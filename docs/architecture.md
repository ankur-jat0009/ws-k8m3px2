# WindScope — System Architecture & Technical Specifications

## 1. System Overview
**WindScope** is structured as a decoupled full-stack analytics application designed for institutional trading performance, strict timestamp precision, and resilient upstream failure tolerance.

```mermaid
flowchart TD
    subgraph External_Data_Sources [Upstream Market Data - Elexon BMRS]
        BMRS_FUELHH["FUELHH Stream (Actual Wind MW)"]
        BMRS_WINDFOR["WINDFOR Stream (Forecast Vintages MW)"]
    end

    subgraph Backend_Service [Python FastAPI Service - Port 8000]
        Client["Elexon Async Client (httpx with retry & backoff)"]
        Ingestion["Ingestion & Normalization Engine"]
        CacheStore[("Local Data Store / Parquet & SQLite Cache")]
        Selector["Forecast Cutoff & Vintage Selection Engine"]
        MetricsEngine["Statistical Metrics & Accuracy Engine"]
        ProcurementModel["Residual Demand & Uncertainty Model"]
        APIRouters["FastAPI REST Routers (/api/v1)"]
    end

    subgraph Frontend_App [React + TypeScript + Vite - Port 5173]
        APIService["API Client & Query Cache"]
        StateStore["UI State (Selected Date, Cutoff, Filters)"]
        Dashboard["Overview & KPI Dashboard"]
        TimeSeriesChart["Interactive Forecast-Actual Time Series"]
        VintageInspector["Vintage Evolution & Revision History"]
        AccuracySuite["Quantitative Accuracy & Error Distribution"]
        ProcurementView["Residual Demand & Ramping Support"]
        DataTable["Settlement Period Table & CSV Export"]
        QualityPanel["Data Quality & Transparency Panel"]
    end

    BMRS_FUELHH --> Client
    BMRS_WINDFOR --> Client
    Client --> Ingestion
    Ingestion --> CacheStore
    CacheStore --> Selector
    Selector --> MetricsEngine
    Selector --> ProcurementModel
    MetricsEngine --> APIRouters
    ProcurementModel --> APIRouters
    APIRouters --> APIService
    APIService --> StateStore
    StateStore --> Dashboard
    StateStore --> TimeSeriesChart
    StateStore --> VintageInspector
    StateStore --> AccuracySuite
    StateStore --> ProcurementView
    StateStore --> DataTable
    StateStore --> QualityPanel
```

---

## 2. Component Responsibilities

### 2.1 Backend (`backend/`)
- **`app/core/config.py`**: Pydantic `BaseSettings` reading environment variables (`API_V1_STR`, `ELEXON_API_BASE`, `CORS_ORIGINS`, `CACHE_DIR`, `DEMO_MODE`).
- **`app/services/elexon_client.py`**: Asynchronous HTTP client wrapping `httpx.AsyncClient` with:
  - Connection pooling and keep-alive.
  - Configurable timeouts (e.g. 30s read, 10s connect).
  - Retry mechanism with exponential backoff on transient errors (502, 503, 504, 429).
- **`app/services/ingestion.py`**:
  - Pulls `FUELHH` and filters records to `fuelType == 'WIND'`.
  - Pulls `WINDFOR` forecast records.
  - Normalizes schemas, validates data types, handles timezone parsing (`UTC` and `Europe/London`).
- **`app/repositories/data_store.py`**:
  - Persistent local file/SQLite cache for rapid queries and instant startup.
  - Built-in fallback to bundled deterministic test fixtures if upstream Elexon is unavailable.
- **`app/services/forecast_selection.py`**:
  - Generates expected settlement periods for any day in `Europe/London` (accounting for standard 48, spring 46, autumn 50 periods).
  - Evaluates decision cutoff: selects forecasts where $publishTime \le cutoff$.
  - Maps hourly WINDFOR forecasts to constituent half-hourly settlement periods.
  - Matches forecast and actual records by settlement period and interval start.
- **`app/services/metrics.py`**:
  - Computes quantitative accuracy metrics: MAE, RMSE, Signed Bias, WAPE, MAPE, and total energy (MWh).
  - Computes forecast error percentiles and distribution.
- **`app/schemas/`**: Pydantic models for request query params and strongly typed response payloads.
- **`app/api/routes/`**: Clean modular route controllers.

### 2.2 Frontend (`frontend/`)
- Built with **React 18/19**, **TypeScript**, and **Vite**.
- Styled using **Tailwind CSS** with a custom institutional trading desk theme.
- Charting powered by **Recharts** for time-series charts, residual demand curves, and revision drift.
- Navigation tabs for comprehensive domain exploration:
  1. **Overview**: Executive summary, day selection, headline KPIs, monthly aggregation.
  2. **Forecast Analysis**: Interactive time-series comparing forecast vs actual, signed error bar, cutoff indicator.
  3. **Forecast Vintages**: Timeline of published revisions, vintage comparison table, delta analysis.
  4. **Accuracy & Quantitative Metrics**: MAE, RMSE, Signed Bias, WAPE, error distribution, D-1 vs Latest comparison.
  5. **Procurement Support**: User-adjustable demand profile, residual demand curve, uncertainty buffers.
  6. **Settlement Periods Table**: Sortable, searchable, filterable table with full CSV export.
  7. **Data Quality & Methodology**: Transparency audit (missing intervals, duplicate counts, cutoff adherence, data source status).

---

## 3. Sequence Diagram: Data Retrieval & Forecast Evaluation

```mermaid
sequenceDiagram
    autonumber
    actor Trader as Energy Trader / Analyst
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant Selector as Forecast Selector
    participant Cache as Local Data Store
    participant Elexon as Elexon BMRS API

    Trader->>UI: Selects Delivery Date (e.g. 2026-01-15) & Cutoff (D-1 12:00)
    UI->>API: GET /api/v1/forecasts?date=2026-01-15&cutoff=D-1_12:00
    
    alt Data not in Cache
        API->>Elexon: GET /datasets/FUELHH/stream?settlementDateFrom=2026-01-15
        Elexon-->>API: 200 OK (FUELHH stream payload)
        API->>Elexon: GET /datasets/WINDFOR/stream?publishDateTimeFrom=...
        Elexon-->>API: 200 OK (WINDFOR stream payload)
        API->>Cache: Persist normalized actuals & forecast vintages
    else Data cached
        API->>Cache: Read normalized actuals & forecast vintages
        Cache-->>API: Cached Data
    end

    API->>Selector: Filter forecasts (publishTime <= D-1 12:00 London)
    Selector->>Selector: Map hourly forecasts to half-hour settlement periods
    Selector->>Selector: Match with FUELHH actuals by settlement period
    Selector->>API: Matched Time Series (48 periods)
    API->>API: Compute MAE, RMSE, Bias, WAPE, Energy MWh
    API-->>UI: 200 OK (Typed JSON: metadata, KPIs, periods, vintages)
    UI->>Trader: Renders Trading Charts, Metric Cards, and Decision Table
```

---

## 4. API Specification Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status, uptime, and cache readiness. |
| `GET` | `/api/v1/overview` | High-level summary of January 2026 metrics, dates, and monthly aggregates. |
| `GET` | `/api/v1/forecasts` | Time series of forecast, actual, and error for a delivery date and cutoff. |
| `GET` | `/api/v1/forecast-vintages` | All available forecast publication runs targeting the selected delivery day. |
| `GET` | `/api/v1/accuracy` | Statistical metrics (MAE, RMSE, Bias, WAPE, MAPE) for selected day or entire month. |
| `GET` | `/api/v1/settlement-periods` | Detailed settlement period list with filtering, sorting, and pagination. |
| `GET` | `/api/v1/data-quality` | Audit report on data completeness, missing periods, duplicates, and source provenance. |
| `POST` | `/api/v1/refresh` | Trigger upstream cache refresh from Elexon API. |

---

## 5. Security & Deployment Architecture

- **No Secrets in Source**: No API tokens or passwords are baked into code or client bundles.
- **CORS Protection**: Explicit allowed origins configured in backend environment variables.
- **Containerization**:
  - `backend/Dockerfile`: Multi-stage or optimized Python 3.12 slim container running Uvicorn.
  - `frontend/Dockerfile`: Multi-stage Node.js build with static files served by Nginx or Caddy.
  - `docker-compose.yml`: Single-command local spin-up with port mapping (`8000` for backend, `3000`/`5173` for frontend).
- **Production Hosting**:
  - Frontend: Vercel deployment with client-side routing rewrites (`vercel.json`).
  - Backend: Render / Railway / Fly.io container deployment with health checks.
