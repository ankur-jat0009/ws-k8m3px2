from fastapi import APIRouter, HTTPException
from app.services.forecast_selection import forecast_selector
from app.services.metrics import metrics_engine
from app.schemas.market_data import ProcurementSupportRequest, ProcurementSupportResponse, ProcurementSupportPeriod

router = APIRouter()

@router.post("", response_model=ProcurementSupportResponse)
def calculate_procurement_support(req: ProcurementSupportRequest):
    """
    Evaluate illustrative residual demand and statistical uncertainty buffer:
    Residual Demand (MW) = User Demand (MW) - Wind Forecast (MW)
    Buffer = sigma * Historical RMSE
    """
    periods, meta = forecast_selector.get_matched_settlement_periods(req.delivery_date, cutoff_key="D-1_12:00")
    if not periods:
        raise HTTPException(status_code=404, detail=f"No data available for date {req.delivery_date}")

    m = metrics_engine.calculate_period_metrics(periods)
    rmse = m["rmse_mw"] or 1500.0

    res = metrics_engine.calculate_residual_demand(
        periods=periods,
        base_demand_mw=req.assumed_demand_mw,
        profile_type=req.profile_type,
        uncertainty_sigma=req.uncertainty_sigma,
        rmse_mw=rmse
    )

    period_objs = [ProcurementSupportPeriod(**p) for p in res["periods"]]

    disclaimer = (
        "Illustrative calculation only. This calculation estimates the national wind generation shortfall "
        "relative to user-entered demand assumptions. It does NOT represent a utility's actual total procurement "
        "requirement, because it excludes utility portfolio share, consumer load profiles, solar PV, nuclear/thermal "
        "dispatch, interconnector flows, transmission constraints, and Balancing Mechanism cash-out exposure."
    )

    return ProcurementSupportResponse(
        delivery_date=req.delivery_date,
        assumed_demand_mw=req.assumed_demand_mw,
        profile_type=req.profile_type,
        uncertainty_sigma=req.uncertainty_sigma,
        historical_rmse_mw=rmse,
        peak_residual_mw=res["peak_residual_mw"],
        min_residual_mw=res["min_residual_mw"],
        mean_residual_mw=res["mean_residual_mw"],
        total_residual_mwh=res["total_residual_mwh"],
        periods=period_objs,
        disclaimer=disclaimer
    )
