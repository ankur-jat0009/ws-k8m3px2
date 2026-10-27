import pytest
import numpy as np
from app.services.metrics import metrics_engine

def test_metrics_perfect_forecast():
    """When forecast equals actual, all error metrics should be zero."""
    periods = [
        {"settlement_period": i, "forecast_mw": 5000.0, "actual_mw": 5000.0}
        for i in range(1, 49)
    ]
    m = metrics_engine.calculate_period_metrics(periods)
    assert m["mae_mw"] == 0.0
    assert m["rmse_mw"] == 0.0
    assert m["bias_mw"] == 0.0
    assert m["wape_percent"] == 0.0
    assert m["mape_percent"] == 0.0
    # 48 periods * 5000 MW * 0.5 h = 120,000 MWh
    assert m["total_forecast_mwh"] == 120000.0
    assert m["total_actual_mwh"] == 120000.0

def test_metrics_overforecasting_positive_bias():
    """
    If forecast > actual, bias must be strictly positive (overforecasting).
    Forecast = 6000 MW, Actual = 4000 MW -> error = +2000 MW
    """
    periods = [
        {"settlement_period": 1, "forecast_mw": 6000.0, "actual_mw": 4000.0},
        {"settlement_period": 2, "forecast_mw": 6000.0, "actual_mw": 4000.0}
    ]
    m = metrics_engine.calculate_period_metrics(periods)
    assert m["mae_mw"] == 2000.0
    assert m["rmse_mw"] == 2000.0
    assert m["bias_mw"] == 2000.0
    # WAPE = 4000 / 8000 * 100% = 50.0%
    assert m["wape_percent"] == 50.0

def test_metrics_underforecasting_negative_bias():
    """
    If forecast < actual, bias must be strictly negative (underforecasting).
    Forecast = 3000 MW, Actual = 5000 MW -> error = -2000 MW
    """
    periods = [
        {"settlement_period": 1, "forecast_mw": 3000.0, "actual_mw": 5000.0}
    ]
    m = metrics_engine.calculate_period_metrics(periods)
    assert m["mae_mw"] == 2000.0
    assert m["rmse_mw"] == 2000.0
    assert m["bias_mw"] == -2000.0

def test_mape_zero_actual_handling():
    """
    When actual generation is 0 MW or very low (< 100 MW), MAPE must not divide by zero.
    Low/zero actual intervals should be excluded from MAPE and counted.
    """
    periods = [
        {"settlement_period": 1, "forecast_mw": 500.0, "actual_mw": 0.0},     # 0 MW actual -> excluded
        {"settlement_period": 2, "forecast_mw": 200.0, "actual_mw": 50.0},    # < 100 MW actual -> excluded
        {"settlement_period": 3, "forecast_mw": 1100.0, "actual_mw": 1000.0}  # >= 100 MW -> included (10% error)
    ]
    m = metrics_engine.calculate_period_metrics(periods)
    assert m["mape_excluded_count"] == 2
    assert m["mape_percent"] == 10.0
    # WAPE uses total volume, so it does not fail
    assert m["wape_percent"] is not None

def test_energy_mwh_conversion():
    """MWh must equal MW * 0.5 hours for half-hourly periods."""
    periods = [
        {"settlement_period": 1, "forecast_mw": 1000.0, "actual_mw": 2000.0},
        {"settlement_period": 2, "forecast_mw": 3000.0, "actual_mw": 4000.0}
    ]
    m = metrics_engine.calculate_period_metrics(periods)
    # Forecast: (1000 + 3000) * 0.5 = 2000 MWh
    # Actual: (2000 + 4000) * 0.5 = 3000 MWh
    assert m["total_forecast_mwh"] == 2000.0
    assert m["total_actual_mwh"] == 3000.0

def test_missing_data_metric_calculation():
    """When some periods have missing forecast or actual, metrics only evaluate matched pairs."""
    periods = [
        {"settlement_period": 1, "forecast_mw": 1000.0, "actual_mw": 800.0},
        {"settlement_period": 2, "forecast_mw": None, "actual_mw": 800.0},
        {"settlement_period": 3, "forecast_mw": 1000.0, "actual_mw": None}
    ]
    m = metrics_engine.calculate_period_metrics(periods)
    assert m["matched_count"] == 1
    assert m["mae_mw"] == 200.0
    assert m["bias_mw"] == 200.0
