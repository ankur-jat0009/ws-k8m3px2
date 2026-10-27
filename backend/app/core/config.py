import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "WindScope — UK Wind Forecast Intelligence"
    API_V1_STR: str = "/api/v1"
    ELEXON_API_BASE: str = "https://data.elexon.co.uk/bmrs/api/v1"
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Cache / Data Directory
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    ACTUALS_FILE: str = os.path.join(DATA_DIR, "actuals_wind_jan2026.json")
    FORECASTS_FILE: str = os.path.join(DATA_DIR, "forecasts_wind_jan2026.json")
    
    # Fallback / Offline Demo Mode
    DEMO_MODE: bool = False
    
    # Request timeouts in seconds
    HTTP_TIMEOUT_SECONDS: float = 30.0
    HTTP_MAX_RETRIES: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
