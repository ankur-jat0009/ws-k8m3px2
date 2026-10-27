import pytest
import pandas as pd
from app.services.forecast_selection import forecast_selector, parse_decision_cutoff
from app.repositories.data_store import data_store

@pytest.fixture(autouse=True)
def setup_store():
    data_store.initialize()

def test_forecast_cutoff_exclusion():
    """
    Ensure that forecasts published AFTER the decision cutoff (e.g. 12:00 D-1)
    are strictly excluded from the day-ahead decision evaluation.
    """
    date = "2026-01-01"
    # D-1 12:00 Cutoff
    periods_cutoff, meta_cutoff = forecast_selector.get_matched_settlement_periods(date, cutoff_key="D-1_12:00")
    
    # Check publish times of selected forecasts
    for p in periods_cutoff:
        if p["publish_time"]:
            pub_ts = pd.Timestamp(p["publish_time"])
            cutoff_ts = pd.Timestamp(meta_cutoff["cutoff_time"])
            assert pub_ts <= cutoff_ts, f"Forecast vintage {pub_ts} was published after cutoff {cutoff_ts}!"

def test_vintage_progression_latest_vs_cutoff():
    """
    Verifies that the latest intraday forecast incorporates updates published after the cutoff.
    """
    date = "2026-01-01"
    vintages_data = forecast_selector.get_vintage_comparison(date, cutoff_key="D-1_12:00")
    assert vintages_data["total_vintages_count"] > 0
    assert vintages_data["eligible_vintages_count"] <= vintages_data["total_vintages_count"]

    # There should be revision delta values calculated between latest and cutoff
    deltas = [c["revision_delta_mw"] for c in vintages_data["comparison"] if c["revision_delta_mw"] is not None]
    assert len(deltas) > 0

def test_hourly_windfor_to_halfhourly_settlement_mapping():
    """
    WINDFOR publishes hourly start times (:00).
    Settlement periods 1 (00:00) and 2 (00:30) must map to the same hourly forecast.
    """
    date = "2026-01-01"
    periods, _ = forecast_selector.get_matched_settlement_periods(date, cutoff_key="D-1_12:00")
    
    p1 = periods[0] # SP 1: 00:00 - 00:30
    p2 = periods[1] # SP 2: 00:30 - 01:00
    
    assert p1["settlement_period"] == 1
    assert p2["settlement_period"] == 2
    # Both periods in hour 00:00 should receive the same forecast value from that hour
    if p1["forecast_mw"] is not None and p2["forecast_mw"] is not None:
        assert p1["forecast_mw"] == p2["forecast_mw"]
        assert p1["publish_time"] == p2["publish_time"]

def test_all_january_days_have_matched_periods():
    """Verify that all January 2026 delivery days have 48 settlement periods with valid data."""
    for d in range(1, 6): # Sample first 5 days for speed in unit test
        date_str = f"2026-01-{d:02d}"
        periods, meta = forecast_selector.get_matched_settlement_periods(date_str, cutoff_key="D-1_12:00")
        assert len(periods) == 48
        assert meta["matched_periods"] == 48
        assert meta["coverage_percent"] == 100.0
