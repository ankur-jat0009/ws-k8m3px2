from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.forecast_selection import forecast_selector
from app.services.metrics import metrics_engine
from app.schemas.market_data import AccuracyEvaluationResponse

router = APIRouter()

@router.get("", response_model=AccuracyEvaluationResponse)
def get_accuracy_metrics(
    date: str = Query("2026-01-01", description="Delivery date (YYYY-MM-DD) or 'all' for January 2026"),
    cutoff: str = Query("D-1_12:00", description="Decision cutoff preset e.g. 'D-1_12:00'")
):
    """
    Get detailed forecast accuracy metrics, error percentiles, and comparison of Day-Ahead vs Latest.
    """
    # 1. Day-Ahead decision cutoff metrics
    periods_cutoff, meta = forecast_selector.get_matched_settlement_periods(date, cutoff_key=cutoff)
    m_cutoff = metrics_engine.calculate_period_metrics(periods_cutoff)

    # 2. Latest intra-day forecast metrics
    periods_latest, _ = forecast_selector.get_matched_settlement_periods(date, cutoff_key="latest")
    m_latest = metrics_engine.calculate_period_metrics(periods_latest)

    cutoff_vs_latest = {
        "cutoff": {
            "label": meta["cutoff_applied"],
            "mae_mw": m_cutoff["mae_mw"],
            "rmse_mw": m_cutoff["rmse_mw"],
            "bias_mw": m_cutoff["bias_mw"],
            "wape_percent": m_cutoff["wape_percent"]
        },
        "latest": {
            "label": "Latest Intra-day Outturn",
            "mae_mw": m_latest["mae_mw"],
            "rmse_mw": m_latest["rmse_mw"],
            "bias_mw": m_latest["bias_mw"],
            "wape_percent": m_latest["wape_percent"]
        },
        "mae_improvement_mw": round((m_cutoff["mae_mw"] or 0.0) - (m_latest["mae_mw"] or 0.0), 2)
    }

    return AccuracyEvaluationResponse(
        period_label=f"Delivery Day {date}",
        cutoff_applied=meta["cutoff_applied"],
        matched_pairs_count=m_cutoff["matched_count"],
        mae_mw=m_cutoff["mae_mw"] or 0.0,
        rmse_mw=m_cutoff["rmse_mw"] or 0.0,
        mean_bias_mw=m_cutoff["bias_mw"] or 0.0,
        wape_percent=m_cutoff["wape_percent"] or 0.0,
        mape_percent=m_cutoff["mape_percent"],
        mape_excluded_count=m_cutoff["mape_excluded_count"],
        error_p10_mw=m_cutoff["p10"] or 0.0,
        error_p25_mw=m_cutoff["p25"] or 0.0,
        error_p50_mw=m_cutoff["p50"] or 0.0,
        error_p75_mw=m_cutoff["p75"] or 0.0,
        error_p90_mw=m_cutoff["p90"] or 0.0,
        cutoff_vs_latest=cutoff_vs_latest
    )
