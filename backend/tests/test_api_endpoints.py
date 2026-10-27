import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.data_store import data_store

@pytest.fixture(scope="module", autouse=True)
def init_test_store():
    data_store.initialize()

client = TestClient(app)

def test_health_check_endpoint():
    with TestClient(app) as tc:
        response = tc.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "data_source" in data
        assert data["actuals_loaded"] > 0
        assert data["forecasts_loaded"] > 0

def test_get_forecasts_valid_date():
    with TestClient(app) as tc:
        response = tc.get("/api/v1/forecasts?date=2026-01-01&cutoff=D-1_12:00")
        assert response.status_code == 200
        data = response.json()
        assert "overview" in data
        assert "periods" in data
        assert len(data["periods"]) == 48
        assert data["overview"]["delivery_date"] == "2026-01-01"
        assert data["overview"]["matched_periods"] == 48
        assert data["overview"]["total_forecast_mwh"] > 0

def test_get_month_overview():
    with TestClient(app) as tc:
        response = tc.get("/api/v1/overview/month?cutoff=D-1_12:00")
        assert response.status_code == 200
        data = response.json()
        assert data["total_days"] == 31
        assert data["overall_mae_mw"] > 0
        assert len(data["days"]) == 31

def test_get_vintages_endpoint():
    with TestClient(app) as tc:
        response = tc.get("/api/v1/forecast-vintages?date=2026-01-01&cutoff=D-1_12:00")
        assert response.status_code == 200
        data = response.json()
        assert data["total_vintages_count"] > 0
        assert len(data["comparison"]) == 48

def test_get_accuracy_endpoint():
    with TestClient(app) as tc:
        response = tc.get("/api/v1/accuracy?date=2026-01-01&cutoff=D-1_12:00")
        assert response.status_code == 200
        data = response.json()
        assert data["matched_pairs_count"] == 48
        assert data["mae_mw"] > 0
        assert data["rmse_mw"] > 0
        assert "cutoff_vs_latest" in data

def test_get_settlement_periods_pagination_and_sorting():
    with TestClient(app) as tc:
        response = tc.get("/api/v1/settlement-periods?date=2026-01-01&limit=10&page=1&sort_by=settlement_period&sort_dir=asc")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 48
        assert len(data["data"]) == 10
        assert data["data"][0]["settlement_period"] == 1

def test_settlement_periods_csv_export():
    with TestClient(app) as tc:
        response = tc.get("/api/v1/settlement-periods/export-csv?date=2026-01-01&cutoff=D-1_12:00")
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        content = response.text
        assert "settlement_period" in content
        assert "forecast_power_mw" in content
        assert "actual_power_mw" in content
        assert "2026-01-01" in content

def test_data_quality_report():
    with TestClient(app) as tc:
        response = tc.get("/api/v1/data-quality")
        assert response.status_code == 200
        data = response.json()
        assert data["total_actual_records"] == 1488
        assert data["total_forecast_records"] > 0
        assert data["missing_actual_intervals"] == 0

def test_procurement_decision_support():
    with TestClient(app) as tc:
        payload = {
            "delivery_date": "2026-01-01",
            "assumed_demand_mw": 35000.0,
            "profile_type": "diurnal_standard",
            "uncertainty_sigma": 1.0
        }
        response = tc.post("/api/v1/procurement-decision", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["periods"]) == 48
        assert data["peak_residual_mw"] > 0
        assert "disclaimer" in data
