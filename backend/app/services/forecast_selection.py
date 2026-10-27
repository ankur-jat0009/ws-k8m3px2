from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import pytz
from app.repositories.data_store import data_store

LONDON_TZ = pytz.timezone("Europe/London")
UTC_TZ = pytz.UTC

def generate_expected_settlement_periods(delivery_date_str: str) -> List[Dict[str, Any]]:
    """
    Generate all expected settlement periods for a UK calendar date using Europe/London rules.
    Accounts for daylight saving clock changes:
    - 48 periods on normal 24h days
    - 46 periods on spring transition (23h)
    - 50 periods on autumn transition (25h)
    """
    d = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
    
    # Start at midnight in London local time
    start_local = LONDON_TZ.localize(datetime(d.year, d.month, d.day, 0, 0, 0))
    next_day = d + timedelta(days=1)
    end_local = LONDON_TZ.localize(datetime(next_day.year, next_day.month, next_day.day, 0, 0, 0))
    
    # Iterate in 30-minute steps in UTC
    current_utc = start_local.astimezone(UTC_TZ)
    end_utc = end_local.astimezone(UTC_TZ)
    
    periods = []
    period_idx = 1
    while current_utc < end_utc:
        next_utc = current_utc + timedelta(minutes=30)
        periods.append({
            "settlement_period": period_idx,
            "start_time": current_utc.isoformat().replace("+00:00", "Z"),
            "end_time": next_utc.isoformat().replace("+00:00", "Z"),
            "delivery_date": delivery_date_str,
            "start_dt": current_utc
        })
        period_idx += 1
        current_utc = next_utc
        
    return periods

def parse_decision_cutoff(delivery_date_str: str, cutoff_key: str = "D-1_12:00") -> Tuple[pd.Timestamp, str]:
    """
    Parse a decision cutoff descriptor into a timezone-aware UTC pandas.Timestamp.
    Supported presets:
    - 'D-1_09:00': Day-Ahead 09:00 London time
    - 'D-1_12:00': Day-Ahead 12:00 London time (Default GB Day-Ahead gate closure)
    - 'D-1_15:30': Day-Ahead 15:30 London time (EPEX 30-min auction gate closure)
    - 'D-1_17:00': Day-Ahead 17:00 London time
    - 'D-1_23:00': Day-Ahead 23:00 London time
    - 'latest' / 'intraday': Delivery day 23:59:59 (latest available outturn)
    - Custom ISO string: parsed directly
    """
    d = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
    d_minus_1 = d - timedelta(days=1)

    normalized_key = cutoff_key.strip()

    if normalized_key == "D-1_09:00":
        dt_local = LONDON_TZ.localize(datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 9, 0, 0))
        label = "D-1 09:00 London Time"
    elif normalized_key in ("D-1_12:00", "default", ""):
        dt_local = LONDON_TZ.localize(datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 12, 0, 0))
        label = "D-1 12:00 London Time (Day-Ahead Gate Closure)"
    elif normalized_key == "D-1_15:30":
        dt_local = LONDON_TZ.localize(datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 15, 30, 0))
        label = "D-1 15:30 London Time (EPEX 30m Gate Closure)"
    elif normalized_key == "D-1_17:00":
        dt_local = LONDON_TZ.localize(datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 17, 0, 0))
        label = "D-1 17:00 London Time (Evening Schedule)"
    elif normalized_key == "D-1_23:00":
        dt_local = LONDON_TZ.localize(datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 23, 0, 0))
        label = "D-1 23:00 London Time (End of D-1)"
    elif normalized_key in ("latest", "intraday"):
        dt_local = LONDON_TZ.localize(datetime(d.year, d.month, d.day, 23, 59, 59))
        label = "Latest Intra-day Forecast (Post-Cutoff)"
    else:
        # Try parsing as ISO
        try:
            ts = pd.to_datetime(normalized_key, utc=True)
            return ts, f"Custom Cutoff: {ts.isoformat()}"
        except Exception:
            dt_local = LONDON_TZ.localize(datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 12, 0, 0))
            label = "D-1 12:00 London Time (Default Fallback)"

    ts_utc = pd.to_datetime(dt_local.astimezone(UTC_TZ))
    return ts_utc, label

class ForecastSelector:
    @staticmethod
    def get_matched_settlement_periods(delivery_date: str, cutoff_key: str = "D-1_12:00") -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Produce a matched list of settlement periods for a delivery date and decision cutoff.
        Returns:
            periods: List of enriched settlement period dictionaries
            metadata: Summary information (cutoff applied, total counts, timestamps)
        """
        expected_periods = generate_expected_settlement_periods(delivery_date)
        cutoff_ts, cutoff_label = parse_decision_cutoff(delivery_date, cutoff_key)

        df_actuals = data_store.get_actuals_for_date(delivery_date)
        df_forecasts = data_store.get_forecasts_targeting_date(delivery_date)

        # 1. Filter forecasts to those published at or before cutoff
        if not df_forecasts.empty:
            eligible_fc = df_forecasts[df_forecasts["publishTime"] <= cutoff_ts].copy()
            # Deduplicate by (startTime, publishTime): keep last
            eligible_fc = eligible_fc.drop_duplicates(subset=["startTime", "publishTime"], keep="last")
            # Select the latest publishTime for each startTime
            selected_fc = eligible_fc.sort_values("publishTime").groupby("startTime").last().reset_index()
        else:
            selected_fc = pd.DataFrame()

        # Build lookup maps
        # Actuals indexed by settlementPeriod and/or startTime
        actual_map = {}
        if not df_actuals.empty:
            for _, row in df_actuals.iterrows():
                actual_map[int(row["settlementPeriod"])] = float(row["generation"])

        # Forecasts indexed by hourly startTime
        forecast_map = {}
        publish_map = {}
        if not selected_fc.empty:
            for _, row in selected_fc.iterrows():
                st_str = row["startTime"].isoformat().replace("+00:00", "Z")
                forecast_map[st_str] = float(row["generation"])
                publish_map[st_str] = row["publishTime"].isoformat().replace("+00:00", "Z")

        # 2. Match each half-hourly settlement period
        enriched_periods = []
        matched_count = 0
        forecast_available_count = 0
        actual_available_count = 0

        for sp in expected_periods:
            sp_idx = sp["settlement_period"]
            st_utc = sp["start_time"]
            et_utc = sp["end_time"]
            sp_dt = sp["start_dt"]

            # Hourly WINDFOR matching: truncate minutes to 00
            hour_st = sp_dt.strftime("%Y-%m-%dT%H:00:00Z")

            fc_val = forecast_map.get(hour_st)
            pub_time = publish_map.get(hour_st)
            act_val = actual_map.get(sp_idx)

            lead_hours = None
            if pub_time:
                pub_dt = pd.to_datetime(pub_time, utc=True)
                lead_hours = round((sp_dt - pub_dt).total_seconds() / 3600.0, 1)

            # Status determination
            status = "Matched"
            if fc_val is not None:
                forecast_available_count += 1
            if act_val is not None:
                actual_available_count += 1

            if fc_val is None and act_val is None:
                status = "Missing Both"
            elif fc_val is None:
                status = "Missing Forecast"
            elif act_val is None:
                status = "Missing Actual"
            else:
                matched_count += 1

            # Metric calculations per period
            error_mw = None
            abs_error_mw = None
            pct_error = None
            fc_mwh = None
            act_mwh = None

            if fc_val is not None:
                fc_mwh = round(fc_val * 0.5, 2)
            if act_val is not None:
                act_mwh = round(act_val * 0.5, 2)

            if fc_val is not None and act_val is not None:
                error_mw = round(fc_val - act_val, 2)
                abs_error_mw = round(abs(error_mw), 2)
                if act_val >= 100.0:
                    pct_error = round((abs_error_mw / act_val) * 100.0, 2)

            enriched_periods.append({
                "settlement_period": sp_idx,
                "start_time": st_utc,
                "end_time": et_utc,
                "delivery_date": delivery_date,
                "forecast_mw": fc_val,
                "actual_mw": act_val,
                "forecast_mwh": fc_mwh,
                "actual_mwh": act_mwh,
                "error_mw": error_mw,
                "abs_error_mw": abs_error_mw,
                "percentage_error": pct_error,
                "publish_time": pub_time,
                "lead_time_hours": lead_hours,
                "status": status
            })

        metadata = {
            "delivery_date": delivery_date,
            "cutoff_time": cutoff_ts.isoformat().replace("+00:00", "Z"),
            "cutoff_applied": cutoff_label,
            "expected_periods": len(expected_periods),
            "available_forecast_periods": forecast_available_count,
            "available_actual_periods": actual_available_count,
            "matched_periods": matched_count,
            "coverage_percent": round((matched_count / len(expected_periods)) * 100.0, 1) if expected_periods else 0.0,
            "data_source": data_store.data_source,
            "last_refresh": data_store.last_refresh
        }

        return enriched_periods, metadata

    @staticmethod
    def get_vintage_comparison(delivery_date: str, cutoff_key: str = "D-1_12:00") -> Dict[str, Any]:
        """
        Extract all forecast publication vintages for a delivery date, along with period-by-period
        comparison between D-1 cutoff forecast and latest outturn forecast.
        """
        df_forecasts = data_store.get_forecasts_targeting_date(delivery_date)
        df_actuals = data_store.get_actuals_for_date(delivery_date)
        cutoff_ts, cutoff_label = parse_decision_cutoff(delivery_date, cutoff_key)

        expected_periods = generate_expected_settlement_periods(delivery_date)

        if df_forecasts.empty:
            return {
                "delivery_date": delivery_date,
                "cutoff_applied": cutoff_label,
                "total_vintages_count": 0,
                "eligible_vintages_count": 0,
                "vintages": [],
                "comparison": []
            }

        # Vintages summaries
        vintages_summary = []
        unique_pubs = df_forecasts["publishTime"].sort_values().unique()

        target_start = pd.Timestamp(f"{delivery_date}T00:00:00Z")

        for pub in unique_pubs:
            subset = df_forecasts[df_forecasts["publishTime"] == pub]
            pub_ts = pd.Timestamp(pub)
            is_eligible = pub_ts <= cutoff_ts
            lead_h = round((target_start - pub_ts).total_seconds() / 3600.0, 1)
            mean_mw = round(float(subset["generation"].mean()), 1)
            peak_mw = round(float(subset["generation"].max()), 1)
            # 1 hour per point
            total_mwh = round(float(subset["generation"].sum()), 1)

            vintages_summary.append({
                "publish_time": pub_ts.isoformat().replace("+00:00", "Z"),
                "target_date": delivery_date,
                "points_count": len(subset),
                "min_start_time": subset["startTime"].min().isoformat().replace("+00:00", "Z"),
                "max_start_time": subset["startTime"].max().isoformat().replace("+00:00", "Z"),
                "mean_forecast_mw": mean_mw,
                "peak_forecast_mw": peak_mw,
                "total_forecast_mwh": total_mwh,
                "is_before_cutoff": is_eligible,
                "lead_time_hours": lead_h
            })

        # Cutoff forecast vs Latest forecast per period
        cutoff_periods, _ = ForecastSelector.get_matched_settlement_periods(delivery_date, cutoff_key)
        latest_periods, _ = ForecastSelector.get_matched_settlement_periods(delivery_date, "latest")

        latest_map = {p["settlement_period"]: p["forecast_mw"] for p in latest_periods}

        comparison = []
        for cp in cutoff_periods:
            sp_idx = cp["settlement_period"]
            c_mw = cp["forecast_mw"]
            l_mw = latest_map.get(sp_idx)
            delta = round(l_mw - c_mw, 2) if (l_mw is not None and c_mw is not None) else None

            comparison.append({
                "settlement_period": sp_idx,
                "start_time": cp["start_time"],
                "actual_mw": cp["actual_mw"],
                "cutoff_forecast_mw": c_mw,
                "latest_forecast_mw": l_mw,
                "revision_delta_mw": delta
            })

        eligible_count = sum(1 for v in vintages_summary if v["is_before_cutoff"])

        return {
            "delivery_date": delivery_date,
            "cutoff_applied": cutoff_label,
            "total_vintages_count": len(vintages_summary),
            "eligible_vintages_count": eligible_count,
            "vintages": vintages_summary,
            "comparison": comparison
        }

forecast_selector = ForecastSelector()
