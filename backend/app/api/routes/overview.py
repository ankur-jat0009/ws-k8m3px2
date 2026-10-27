from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import numpy as np
from app.services.forecast_selection import forecast_selector
from app.services.metrics import metrics_engine
from app.repositories.data_store import data_store
from app.schemas.market_data import OverviewMonthResponse, DailySummaryItem

router = APIRouter()

@router.get("/month", response_model=OverviewMonthResponse)
def get_month_overview(
    cutoff: str = Query("D-1_12:00", description="Decision cutoff preset e.g. 'D-1_12:00'")
):
    """
    Get full January 2026 day-ahead summary metrics across all 31 delivery days.
    """
    dates = data_store.get_all_available_dates()
    if not dates:
        # Default to Jan 1 to Jan 31, 2026
        dates = [f"2026-01-{d:02d}" for d in range(1, 32)]

    daily_items = []
    all_abs_errors = []
    all_sq_errors = []
    all_signed_errors = []
    all_actuals = []
    total_forecast_mwh = 0.0
    total_actual_mwh = 0.0

    for d in dates:
        periods, meta = forecast_selector.get_matched_settlement_periods(d, cutoff_key=cutoff)
        m = metrics_engine.calculate_period_metrics(periods)
        
        fc_mwh = m["total_forecast_mwh"]
        act_mwh = m["total_actual_mwh"] or 0.0
        total_forecast_mwh += fc_mwh
        total_actual_mwh += act_mwh

        # Collect for overall statistics
        for p in periods:
            if p.get("forecast_mw") is not None and p.get("actual_mw") is not None:
                err = p["forecast_mw"] - p["actual_mw"]
                all_abs_errors.append(abs(err))
                all_sq_errors.append(err ** 2)
                all_signed_errors.append(err)
                all_actuals.append(p["actual_mw"])

        daily_items.append(DailySummaryItem(
            delivery_date=d,
            total_forecast_mwh=fc_mwh,
            total_actual_mwh=act_mwh,
            peak_forecast_mw=m["forecast_peak_mw"],
            peak_actual_mw=m["actual_peak_mw"] or 0.0,
            mae_mw=m["mae_mw"] or 0.0,
            rmse_mw=m["rmse_mw"] or 0.0,
            bias_mw=m["bias_mw"] or 0.0,
            wape_percent=m["wape_percent"] or 0.0,
            coverage_percent=meta["coverage_percent"]
        ))

    overall_mae = float(np.mean(all_abs_errors)) if all_abs_errors else 0.0
    overall_rmse = float(np.sqrt(np.mean(all_sq_errors))) if all_sq_errors else 0.0
    overall_bias = float(np.mean(all_signed_errors)) if all_signed_errors else 0.0
    sum_actuals = float(np.sum(all_actuals))
    overall_wape = float((np.sum(all_abs_errors) / sum_actuals) * 100.0) if sum_actuals > 0 else 0.0

    return OverviewMonthResponse(
        month_label="January 2026",
        cutoff_applied=cutoff,
        total_days=len(daily_items),
        total_forecast_gwh=round(total_forecast_mwh / 1000.0, 2),
        total_actual_gwh=round(total_actual_mwh / 1000.0, 2),
        overall_mae_mw=round(overall_mae, 2),
        overall_rmse_mw=round(overall_rmse, 2),
        overall_bias_mw=round(overall_bias, 2),
        overall_wape_percent=round(overall_wape, 2),
        overall_coverage_percent=100.0,
        days=daily_items
    )
