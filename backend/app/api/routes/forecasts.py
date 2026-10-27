from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.forecast_selection import forecast_selector
from app.services.metrics import metrics_engine
from app.schemas.market_data import ForecastTimeSeriesResponse, ForecastOverviewResponse, SettlementPeriodRecord

router = APIRouter()

@router.get("", response_model=ForecastTimeSeriesResponse)
def get_forecasts_for_delivery_date(
    date: str = Query("2026-01-01", description="Delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("D-1_12:00", description="Decision cutoff preset e.g. 'D-1_12:00'")
):
    """
    Get matched forecast vs actual generation time series and headline metrics for a delivery day.
    """
    periods_data, meta = forecast_selector.get_matched_settlement_periods(date, cutoff_key=cutoff)
    if not periods_data:
        raise HTTPException(status_code=404, detail=f"No settlement periods found for date {date}")

    metrics = metrics_engine.calculate_period_metrics(periods_data)

    overview = ForecastOverviewResponse(
        delivery_date=date,
        cutoff_time=meta["cutoff_time"],
        cutoff_applied=meta["cutoff_applied"],
        market_timezone="Europe/London",
        total_forecast_mwh=metrics["total_forecast_mwh"],
        total_actual_mwh=metrics["total_actual_mwh"],
        forecast_peak_mw=metrics["forecast_peak_mw"],
        forecast_mean_mw=metrics["forecast_mean_mw"],
        actual_peak_mw=metrics["actual_peak_mw"],
        actual_mean_mw=metrics["actual_mean_mw"],
        mae_mw=metrics["mae_mw"],
        rmse_mw=metrics["rmse_mw"],
        bias_mw=metrics["bias_mw"],
        wape_percent=metrics["wape_percent"],
        mape_percent=metrics["mape_percent"],
        expected_periods=meta["expected_periods"],
        available_forecast_periods=meta["available_forecast_periods"],
        available_actual_periods=meta["available_actual_periods"],
        matched_periods=meta["matched_periods"],
        coverage_percent=meta["coverage_percent"],
        data_source=meta["data_source"],
        last_refresh=meta["last_refresh"]
    )

    records = [SettlementPeriodRecord(**p) for p in periods_data]

    return ForecastTimeSeriesResponse(
        overview=overview,
        periods=records
    )
