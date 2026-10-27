import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_full_trader_workflow_end_to_end():
    with TestClient(app) as client:
        # 1. Health
        res_h = client.get("/health")
        assert res_h.status_code == 200
        assert res_h.json()["status"] == "healthy"

        # 2. Trader opens Overview to check monthly benchmark
        res_m = client.get("/api/v1/overview/month?cutoff=D-1_12:00")
        assert res_m.status_code == 200
        m_data = res_m.json()
        assert m_data["total_days"] == 31
        assert len(m_data["days"]) == 31
        assert m_data["overall_mae_mw"] > 0

        # 3. Trader selects Jan 15 to examine windy day
        res_fc = client.get("/api/v1/forecasts?date=2026-01-15&cutoff=D-1_12:00")
        assert res_fc.status_code == 200
        fc_data = res_fc.json()
        assert len(fc_data["periods"]) == 48
        assert fc_data["overview"]["matched_periods"] == 48
        assert fc_data["overview"]["total_forecast_mwh"] > 0

        # 4. Trader inspects forecast vintages to check publication history
        res_v = client.get("/api/v1/forecast-vintages?date=2026-01-15&cutoff=D-1_12:00")
        assert res_v.status_code == 200
        v_data = res_v.json()
        assert v_data["total_vintages_count"] > 0
        assert len(v_data["comparison"]) == 48

        # 5. Trader evaluates quantitative accuracy
        res_acc = client.get("/api/v1/accuracy?date=2026-01-15&cutoff=D-1_12:00")
        assert res_acc.status_code == 200
        acc_data = res_acc.json()
        assert acc_data["mae_mw"] > 0
        assert acc_data["rmse_mw"] > 0
        assert "cutoff_vs_latest" in acc_data

        # 6. Trader uses procurement decision support with 38,000 MW demand assumption
        res_proc = client.post("/api/v1/procurement-decision", json={
            "delivery_date": "2026-01-15",
            "assumed_demand_mw": 38000.0,
            "profile_type": "diurnal_standard",
            "uncertainty_sigma": 1.5
        })
        assert res_proc.status_code == 200
        proc_data = res_proc.json()
        assert len(proc_data["periods"]) == 48
        assert proc_data["peak_residual_mw"] > 0
        assert proc_data["uncertainty_sigma"] == 1.5

        # 7. Trader exports CSV for settlement records
        res_csv = client.get("/api/v1/settlement-periods/export-csv?date=2026-01-15&cutoff=D-1_12:00")
        assert res_csv.status_code == 200
        assert "settlement_period" in res_csv.text
        assert "forecast_power_mw" in res_csv.text
