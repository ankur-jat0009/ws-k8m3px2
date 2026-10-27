from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SettlementPeriodRecord(BaseModel):
    settlement_period: int = Field(..., description="Settlement period index (1-48)")
    start_time: str = Field(..., description="UTC start timestamp (ISO 8601)")
    end_time: str = Field(..., description="UTC end timestamp (ISO 8601)")
    delivery_date: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    forecast_mw: Optional[float] = Field(None, description="Forecast wind power in MW")
    actual_mw: Optional[float] = Field(None, description="Actual wind outturn in MW")
    forecast_mwh: Optional[float] = Field(None, description="Forecast energy in MWh (MW * 0.5)")
    actual_mwh: Optional[float] = Field(None, description="Actual energy in MWh (MW * 0.5)")
    error_mw: Optional[float] = Field(None, description="Forecast minus Actual error in MW")
    abs_error_mw: Optional[float] = Field(None, description="Absolute error in MW")
    percentage_error: Optional[float] = Field(None, description="Absolute percentage error %")
    publish_time: Optional[str] = Field(None, description="Forecast vintage publication timestamp")
    lead_time_hours: Optional[float] = Field(None, description="Hours from publication to period start")
    status: str = Field("Matched", description="Period data availability status")

class ForecastOverviewResponse(BaseModel):
    delivery_date: str
    cutoff_time: str
    cutoff_applied: str
    market_timezone: str = "Europe/London"
    total_forecast_mwh: float
    total_actual_mwh: Optional[float] = None
    forecast_peak_mw: float
    forecast_mean_mw: float
    actual_peak_mw: Optional[float] = None
    actual_mean_mw: Optional[float] = None
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    bias_mw: Optional[float] = None
    wape_percent: Optional[float] = None
    mape_percent: Optional[float] = None
    expected_periods: int = 48
    available_forecast_periods: int = 48
    available_actual_periods: int = 48
    matched_periods: int = 48
    coverage_percent: float = 100.0
    data_source: str = "Cached Elexon Store"
    last_refresh: str

class ForecastTimeSeriesResponse(BaseModel):
    overview: ForecastOverviewResponse
    periods: List[SettlementPeriodRecord]

class ForecastVintageSummary(BaseModel):
    publish_time: str
    target_date: str
    points_count: int
    min_start_time: str
    max_start_time: str
    mean_forecast_mw: float
    peak_forecast_mw: float
    total_forecast_mwh: float
    is_before_cutoff: bool
    lead_time_hours: Optional[float] = None

class VintageComparisonPoint(BaseModel):
    settlement_period: int
    start_time: str
    actual_mw: Optional[float] = None
    cutoff_forecast_mw: Optional[float] = None
    latest_forecast_mw: Optional[float] = None
    revision_delta_mw: Optional[float] = None

class VintageDetailResponse(BaseModel):
    delivery_date: str
    cutoff_applied: str
    total_vintages_count: int
    eligible_vintages_count: int
    vintages: List[ForecastVintageSummary]
    comparison: List[VintageComparisonPoint]

class AccuracyEvaluationResponse(BaseModel):
    period_label: str
    cutoff_applied: str
    matched_pairs_count: int
    mae_mw: float
    rmse_mw: float
    mean_bias_mw: float
    wape_percent: float
    mape_percent: Optional[float] = None
    mape_excluded_count: int = 0
    error_p10_mw: float
    error_p25_mw: float
    error_p50_mw: float
    error_p75_mw: float
    error_p90_mw: float
    cutoff_vs_latest: Dict[str, Any]

class DailySummaryItem(BaseModel):
    delivery_date: str
    total_forecast_mwh: float
    total_actual_mwh: float
    peak_forecast_mw: float
    peak_actual_mw: float
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    wape_percent: float
    coverage_percent: float

class OverviewMonthResponse(BaseModel):
    month_label: str = "January 2026"
    cutoff_applied: str
    total_days: int
    total_forecast_gwh: float
    total_actual_gwh: float
    overall_mae_mw: float
    overall_rmse_mw: float
    overall_bias_mw: float
    overall_wape_percent: float
    overall_coverage_percent: float
    days: List[DailySummaryItem]

class DataQualityResponse(BaseModel):
    data_source: str
    is_live: bool
    last_updated: str
    total_forecast_records: int
    total_actual_records: int
    missing_actual_intervals: int
    missing_forecast_intervals: int
    duplicate_records_found: int
    cutoff_adherence_percent: float
    quality_warnings: List[str]

class ProcurementSupportRequest(BaseModel):
    delivery_date: str
    assumed_demand_mw: float = 35000.0
    profile_type: str = "diurnal_standard"  # flat, diurnal_standard, industrial
    uncertainty_sigma: float = 1.0

class ProcurementSupportPeriod(BaseModel):
    settlement_period: int
    start_time: str
    forecast_wind_mw: float
    assumed_demand_mw: float
    residual_demand_mw: float
    residual_demand_mwh: float
    buffer_mw: float
    residual_with_buffer_mw: float

class ProcurementSupportResponse(BaseModel):
    delivery_date: str
    assumed_demand_mw: float
    profile_type: str
    uncertainty_sigma: float
    historical_rmse_mw: float
    peak_residual_mw: float
    min_residual_mw: float
    mean_residual_mw: float
    total_residual_mwh: float
    periods: List[ProcurementSupportPeriod]
    disclaimer: str
