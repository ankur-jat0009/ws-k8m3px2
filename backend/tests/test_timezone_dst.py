import pytest
from app.services.forecast_selection import generate_expected_settlement_periods, parse_decision_cutoff
import pytz
import pandas as pd

def test_january_standard_day_periods():
    """Verify that normal winter days in January 2026 have exactly 48 settlement periods."""
    periods = generate_expected_settlement_periods("2026-01-15")
    assert len(periods) == 48
    assert periods[0]["settlement_period"] == 1
    assert periods[0]["start_time"] == "2026-01-15T00:00:00Z"
    assert periods[47]["settlement_period"] == 48
    assert periods[47]["start_time"] == "2026-01-15T23:30:00Z"
    assert periods[47]["end_time"] == "2026-01-16T00:00:00Z"

def test_full_january_2026_period_count():
    """Verify that all 31 days in January 2026 total exactly 1,488 settlement periods."""
    total_periods = 0
    for day in range(1, 32):
        date_str = f"2026-01-{day:02d}"
        periods = generate_expected_settlement_periods(date_str)
        assert len(periods) == 48
        total_periods += len(periods)
    assert total_periods == 1488

def test_spring_clock_change_transition():
    """
    On Spring clock change day in the UK (e.g. 2026-03-29), clocks advance from 01:00 to 02:00,
    resulting in a 23-hour day with exactly 46 settlement periods.
    """
    periods = generate_expected_settlement_periods("2026-03-29")
    assert len(periods) == 46
    assert periods[0]["settlement_period"] == 1
    assert periods[-1]["settlement_period"] == 46

def test_autumn_clock_change_transition():
    """
    On Autumn clock change day in the UK (e.g. 2026-10-25), clocks fall back from 02:00 to 01:00,
    resulting in a 25-hour day with exactly 50 settlement periods.
    """
    periods = generate_expected_settlement_periods("2026-10-25")
    assert len(periods) == 50
    assert periods[0]["settlement_period"] == 1
    assert periods[-1]["settlement_period"] == 50

def test_cutoff_parsing_d_minus_one_noon():
    """Check that D-1 12:00 cutoff resolves to noon UTC on the preceding day during GMT."""
    cutoff_ts, label = parse_decision_cutoff("2026-01-15", "D-1_12:00")
    expected_utc = pd.Timestamp("2026-01-14T12:00:00Z")
    assert cutoff_ts == expected_utc
    assert "D-1 12:00" in label
