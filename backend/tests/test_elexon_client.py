import asyncio
from unittest.mock import AsyncMock, patch
from app.services.elexon_client import ElexonClient, ElexonClientError

def test_fuelhh_filters_strictly_to_wind():
    """Verify that when FUELHH returns multiple fuel types, only WIND records are retained."""
    mock_data = [
        {"fuelType": "CCGT", "generation": 10000, "settlementPeriod": 1},
        {"fuelType": "WIND", "generation": 5000, "settlementPeriod": 1},
        {"fuelType": "NUCLEAR", "generation": 4000, "settlementPeriod": 1},
        {"fuelType": "WIND", "generation": 5200, "settlementPeriod": 2}
    ]

    client = ElexonClient()
    with patch.object(client, "_get_with_retry", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_data
        result = asyncio.run(client.fetch_fuelhh_actuals("2026-01-01", "2026-01-01"))
        assert len(result) == 2
        for r in result:
            assert r["fuelType"] == "WIND"

def test_elexon_client_handles_persistent_failure():
    """Verify that persistent upstream failures raise an explicit ElexonClientError."""
    client = ElexonClient(timeout=1.0)
    with patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):
        try:
            asyncio.run(client.fetch_wind_forecasts("2026-01-01T00:00:00Z", "2026-01-01T01:00:00Z"))
            assert False, "Should have raised ElexonClientError"
        except ElexonClientError:
            pass
