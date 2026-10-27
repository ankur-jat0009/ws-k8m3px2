from fastapi import APIRouter, Query, Response
from typing import Optional, List
import io
import csv
from app.services.forecast_selection import forecast_selector
from app.schemas.market_data import SettlementPeriodRecord

router = APIRouter()

@router.get("")
def get_settlement_periods(
    date: str = Query("2026-01-01", description="Delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("D-1_12:00", description="Decision cutoff preset e.g. 'D-1_12:00'"),
    status: Optional[str] = Query(None, description="Filter by status: Matched, Missing Forecast, Missing Actual"),
    sort_by: str = Query("settlement_period", description="Field to sort by: settlement_period, forecast_mw, actual_mw, error_mw, abs_error_mw"),
    sort_dir: str = Query("asc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(48, ge=1, le=100, description="Items per page")
):
    periods, meta = forecast_selector.get_matched_settlement_periods(date, cutoff_key=cutoff)

    # Filter
    if status:
        periods = [p for p in periods if p.get("status") == status]

    # Sort
    reverse = (sort_dir.lower() == "desc")
    def sort_key(item):
        val = item.get(sort_by)
        if val is None:
            return float("-inf") if reverse else float("inf")
        return val

    periods.sort(key=sort_key, reverse=reverse)

    # Paginate
    total = len(periods)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated = periods[start_idx:end_idx]

    return {
        "metadata": meta,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
        "data": [SettlementPeriodRecord(**p) for p in paginated]
    }

@router.get("/export-csv")
def export_settlement_periods_csv(
    date: str = Query("2026-01-01", description="Delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("D-1_12:00", description="Decision cutoff preset e.g. 'D-1_12:00'"),
    status: Optional[str] = Query(None, description="Optional status filter")
):
    """
    Export matched settlement period records as a standardized CSV file.
    Includes timestamps, power (MW), energy (MWh), and forecast publication vintages.
    """
    periods, meta = forecast_selector.get_matched_settlement_periods(date, cutoff_key=cutoff)

    if status:
        periods = [p for p in periods if p.get("status") == status]

    output = io.StringIO()
    writer = csv.writer(output)

    # Header metadata comments
    writer.writerow(["# WindScope UK Wind Forecast Intelligence"])
    writer.writerow([f"# Delivery Date: {date}"])
    writer.writerow([f"# Cutoff Applied: {meta['cutoff_applied']} ({meta['cutoff_time']})"])
    writer.writerow([f"# Market Timezone: Europe/London"])
    writer.writerow([f"# Data Source: {meta['data_source']}"])
    writer.writerow([])

    # CSV column headers
    writer.writerow([
        "settlement_period",
        "start_time_utc",
        "end_time_utc",
        "delivery_date",
        "forecast_power_mw",
        "actual_power_mw",
        "forecast_energy_mwh",
        "actual_energy_mwh",
        "signed_error_mw",
        "absolute_error_mw",
        "percentage_error_pct",
        "forecast_publish_time_utc",
        "lead_time_hours",
        "quality_status"
    ])

    for p in periods:
        writer.writerow([
            p["settlement_period"],
            p["start_time"],
            p["end_time"],
            p["delivery_date"],
            p["forecast_mw"] if p["forecast_mw"] is not None else "",
            p["actual_mw"] if p["actual_mw"] is not None else "",
            p["forecast_mwh"] if p["forecast_mwh"] is not None else "",
            p["actual_mwh"] if p["actual_mwh"] is not None else "",
            p["error_mw"] if p["error_mw"] is not None else "",
            p["abs_error_mw"] if p["abs_error_mw"] is not None else "",
            p["percentage_error"] if p["percentage_error"] is not None else "",
            p["publish_time"] or "",
            p["lead_time_hours"] if p["lead_time_hours"] is not None else "",
            p["status"]
        ])

    csv_data = output.getvalue()
    filename = f"windscope_settlement_periods_{date}_{cutoff.replace(':', '')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
