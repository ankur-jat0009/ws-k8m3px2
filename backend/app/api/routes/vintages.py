from fastapi import APIRouter, Query, HTTPException
from app.services.forecast_selection import forecast_selector
from app.schemas.market_data import VintageDetailResponse, ForecastVintageSummary, VintageComparisonPoint

router = APIRouter()

@router.get("", response_model=VintageDetailResponse)
def get_forecast_vintages(
    date: str = Query("2026-01-01", description="Delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("D-1_12:00", description="Decision cutoff preset e.g. 'D-1_12:00'")
):
    """
    Retrieve all published forecast vintages targeting a delivery day, along with vintage delta analysis.
    """
    data = forecast_selector.get_vintage_comparison(date, cutoff_key=cutoff)
    if not data:
        raise HTTPException(status_code=404, detail=f"No vintages found for date {date}")

    vintages = [ForecastVintageSummary(**v) for v in data["vintages"]]
    comparison = [VintageComparisonPoint(**c) for c in data["comparison"]]

    return VintageDetailResponse(
        delivery_date=date,
        cutoff_applied=data["cutoff_applied"],
        total_vintages_count=data["total_vintages_count"],
        eligible_vintages_count=data["eligible_vintages_count"],
        vintages=vintages,
        comparison=comparison
    )
