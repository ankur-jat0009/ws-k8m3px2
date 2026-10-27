import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.repositories.data_store import data_store
from app.api.routes import overview, forecasts, vintages, accuracy, settlement, quality, procurement

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("windscope")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize in-memory cache and indexes
    logger.info("Starting WindScope Intelligence API...")
    data_store.initialize()
    logger.info("DataStore initialized successfully.")
    yield
    # Shutdown
    logger.info("Shutting down WindScope Intelligence API...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="UK Wind Generation Forecast Intelligence & Trading Analytics platform utilizing Elexon BMRS data.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "WindScope Backend API",
        "data_source": data_store.data_source,
        "is_live": data_store.is_live,
        "actuals_loaded": len(data_store.actuals),
        "forecasts_loaded": len(data_store.forecasts),
        "last_refresh": data_store.last_refresh
    }

# API Routers
api_prefix = settings.API_V1_STR
app.include_router(overview.router, prefix=f"{api_prefix}/overview", tags=["Overview"])
app.include_router(forecasts.router, prefix=f"{api_prefix}/forecasts", tags=["Forecasts"])
app.include_router(vintages.router, prefix=f"{api_prefix}/forecast-vintages", tags=["Forecast Vintages"])
app.include_router(accuracy.router, prefix=f"{api_prefix}/accuracy", tags=["Accuracy Metrics"])
app.include_router(settlement.router, prefix=f"{api_prefix}/settlement-periods", tags=["Settlement Periods"])
app.include_router(quality.router, prefix=f"{api_prefix}/data-quality", tags=["Data Quality"])
app.include_router(procurement.router, prefix=f"{api_prefix}/procurement-decision", tags=["Procurement Support"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
