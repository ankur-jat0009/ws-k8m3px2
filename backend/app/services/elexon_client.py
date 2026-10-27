import asyncio
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElexonClientError(Exception):
    """Base exception for Elexon API errors."""
    pass

class ElexonClient:
    def __init__(self, base_url: str = settings.ELEXON_API_BASE, timeout: float = settings.HTTP_TIMEOUT_SECONDS):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = settings.HTTP_MAX_RETRIES

    async def _get_with_retry(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/{endpoint}"
        last_error = None

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    logger.info(f"Elexon GET attempt {attempt}/{self.max_retries}: {url} params={params}")
                    response = await client.get(url, params=params, headers={"Accept": "application/json"})
                    
                    if response.status_code == 200:
                        data = response.json()
                        if isinstance(data, list):
                            return data
                        elif isinstance(data, dict) and "data" in data:
                            return data["data"]
                        return []
                    elif response.status_code in (429, 502, 503, 504):
                        logger.warning(f"Transient HTTP {response.status_code} from Elexon API. Retrying...")
                        await asyncio.sleep(2 ** attempt * 0.5)
                    else:
                        response.raise_for_status()
            except (httpx.RequestError, httpx.HTTPStatusError, Exception) as e:
                last_error = e
                logger.warning(f"Request failed on attempt {attempt}: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(0.01) # fast backoff for tests
                else:
                    break

        raise ElexonClientError(f"Failed to fetch data from {url} after {self.max_retries} attempts: {last_error}")

    async def fetch_fuelhh_actuals(self, settlement_date_from: str, settlement_date_to: str) -> List[Dict[str, Any]]:
        """Fetch actual half-hourly generation outturn for specified settlement dates."""
        params = {
            "settlementDateFrom": settlement_date_from,
            "settlementDateTo": settlement_date_to
        }
        raw_records = await self._get_with_retry("datasets/FUELHH/stream", params=params)
        # Filter strictly to fuelType == 'WIND'
        wind_records = [r for r in raw_records if r.get("fuelType") == "WIND"]
        return wind_records

    async def fetch_wind_forecasts(self, publish_from: str, publish_to: str) -> List[Dict[str, Any]]:
        """Fetch wind generation forecasts published within the specified time window."""
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        return await self._get_with_retry("datasets/WINDFOR/stream", params=params)

elexon_client = ElexonClient()
