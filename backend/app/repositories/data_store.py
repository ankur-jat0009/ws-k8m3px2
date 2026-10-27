import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import pandas as pd
from app.core.config import settings

logger = logging.getLogger(__name__)

class DataStore:
    def __init__(self):
        self.actuals: List[Dict[str, Any]] = []
        self.forecasts: List[Dict[str, Any]] = []
        self.last_refresh: str = datetime.now(timezone.utc).isoformat()
        self.data_source: str = "Cached Elexon Store"
        self.is_live: bool = False
        self._df_actuals: Optional[pd.DataFrame] = None
        self._df_forecasts: Optional[pd.DataFrame] = None
        self._initialized: bool = False

    def initialize(self):
        """Load data from local files or fixtures into memory."""
        if self._initialized:
            return

        logger.info("Initializing DataStore...")
        
        # 1. Load actuals
        if os.path.exists(settings.ACTUALS_FILE):
            with open(settings.ACTUALS_FILE, "r") as f:
                self.actuals = json.load(f)
            logger.info(f"Loaded {len(self.actuals)} actual wind records from {settings.ACTUALS_FILE}")
        else:
            logger.warning(f"Actuals file {settings.ACTUALS_FILE} not found!")

        # 2. Load forecasts
        if os.path.exists(settings.FORECASTS_FILE):
            with open(settings.FORECASTS_FILE, "r") as f:
                self.forecasts = json.load(f)
            logger.info(f"Loaded {len(self.forecasts)} forecast records from {settings.FORECASTS_FILE}")
        else:
            logger.warning(f"Forecasts file {settings.FORECASTS_FILE} not found!")

        self._build_dataframes()
        self._initialized = True
        self.last_refresh = datetime.now(timezone.utc).isoformat()

    def _build_dataframes(self):
        if self.actuals:
            df_a = pd.DataFrame(self.actuals)
            df_a = df_a[df_a.get("fuelType", "WIND") == "WIND"].copy()
            df_a["startTime"] = pd.to_datetime(df_a["startTime"], utc=True)
            df_a["generation"] = pd.to_numeric(df_a["generation"], errors="coerce").fillna(0.0)
            self._df_actuals = df_a
        else:
            self._df_actuals = pd.DataFrame(columns=["startTime", "settlementDate", "settlementPeriod", "generation"])

        if self.forecasts:
            df_f = pd.DataFrame(self.forecasts)
            df_f["publishTime"] = pd.to_datetime(df_f["publishTime"], utc=True)
            df_f["startTime"] = pd.to_datetime(df_f["startTime"], utc=True)
            df_f["generation"] = pd.to_numeric(df_f["generation"], errors="coerce").fillna(0.0)
            self._df_forecasts = df_f
        else:
            self._df_forecasts = pd.DataFrame(columns=["publishTime", "startTime", "generation"])

    def get_actuals_for_date(self, settlement_date: str) -> pd.DataFrame:
        if self._df_actuals is None or self._df_actuals.empty:
            return pd.DataFrame()
        return self._df_actuals[self._df_actuals["settlementDate"] == settlement_date].copy()

    def get_forecasts_targeting_date(self, target_date: str) -> pd.DataFrame:
        """Return all forecast records targeting target_date (UTC midnight to 23:59:59)."""
        if self._df_forecasts is None or self._df_forecasts.empty:
            return pd.DataFrame()
        start_bound = pd.Timestamp(f"{target_date}T00:00:00Z")
        end_bound = pd.Timestamp(f"{target_date}T23:59:59Z")
        mask = (self._df_forecasts["startTime"] >= start_bound) & (self._df_forecasts["startTime"] <= end_bound)
        return self._df_forecasts[mask].copy()

    def get_all_vintages_targeting_date(self, target_date: str) -> List[str]:
        """Return sorted list of unique publishTime strings for forecasts targeting target_date."""
        df = self.get_forecasts_targeting_date(target_date)
        if df.empty:
            return []
        pubs = df["publishTime"].sort_values().unique()
        return [pd.Timestamp(p).isoformat() for p in pubs]

    def get_all_available_dates(self) -> List[str]:
        if self._df_actuals is None or self._df_actuals.empty:
            return []
        dates = sorted(self._df_actuals["settlementDate"].dropna().unique().tolist())
        return dates

    def update_from_live(self, new_actuals: List[Dict[str, Any]], new_forecasts: List[Dict[str, Any]]):
        if new_actuals:
            self.actuals = new_actuals
        if new_forecasts:
            self.forecasts = new_forecasts
        self._build_dataframes()
        self.is_live = True
        self.data_source = "Live Elexon BMRS"
        self.last_refresh = datetime.now(timezone.utc).isoformat()

data_store = DataStore()
