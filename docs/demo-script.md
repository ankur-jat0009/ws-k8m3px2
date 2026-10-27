# WindScope — Video Presentation & Technical Review Script

This script accompanies the video submission for **WindScope — UK Wind Forecast Intelligence**.  
**Total Target Runtime**: Exactly 9 to 10 minutes (maximum limit 10:00).  
- **Part 1 (0:00 – 5:00)**: Client Presentation (Energy Trading & Commercial Decisions).
- **Part 2 (5:00 – 10:00)**: Technical Lead Code & Architecture Review.

---

## Recording Setup & Visual Checklist

| Timeframe | Target Screen / Visual | Primary Focus |
| :--- | :--- | :--- |
| **0:00 – 0:35** | Title Card & WindScope Overview Dashboard | The wholesale power purchasing challenge. |
| **0:35 – 1:35** | Date Selector (Jan 15) & Decision Cutoff Selector | Gate closure (D-1 12:00) vs later revisions. |
| **1:35 – 2:30** | Interactive Forecast vs Actual Chart | Power (MW) vs Energy (MWh), signed errors. |
| **2:30 – 3:30** | Quantitative Accuracy & Metric Interpretation | MAE, RMSE, Signed Bias (short vs spill risk), WAPE. |
| **3:30 – 4:20** | Forecast History & Procurement Decision Support | Vintage progression & residual demand model. |
| **4:20 – 5:00** | Data Quality & Commercial Wrap-Up | Verified 100% outturn, scope limitations, ROI. |
| **5:00 – 5:40** | Architecture Diagram (`docs/architecture.md`) | Decoupled FastAPI + React Vite stack. |
| **5:40 – 6:30** | Codebase: `elexon_client.py` & Ingestion | BMRS `/stream` integration, retry backoff, normalization. |
| **6:30 – 7:20** | Codebase: `forecast_selection.py` | Cutoff logic ($publishTime \le cutoff$), hourly to 30-min mapping. |
| **7:20 – 8:10** | Codebase: `metrics.py` & `timezone_dst.py` | MAE, RMSE, zero-division avoidance, UK DST clock changes. |
| **8:10 – 9:00** | Terminal: Pytest Suite & Vitest Run | 27 backend tests + 4 frontend tests passing. |
| **9:00 – 10:00** | Docker Compose & Production Deployment | `docker-compose.yml`, Render/Vercel topology, tradeoffs. |

---

## PART 1: Client Presentation (0:00 – 5:00)

### [0:00 – 0:35] Scene 1: Introduction to the Procurement Problem
**Visual**: Show browser with WindScope Overview dashboard loaded for January 2026.
> *"Good morning. As a UK electricity utility purchasing power in the wholesale market, one of the most volatile risks our trading desk manages is national wind generation. Because wind is non-dispatchable and intermittent, deciding how much power to buy in the Day-Ahead Auction directly dictates our profitability.
>
> If we over-procure, we spill energy at discounted cash-out prices. If we under-procure, we must scramble in real time to purchase expensive thermal power or face punitive System Buy Prices in the Balancing Mechanism.
>
> Today, I'm introducing **WindScope**—an institutional intelligence platform built specifically for our day-ahead trading desk."*

---

### [0:35 – 1:35] Scene 2: Decision Cutoff & The Available Information Set
**Visual**: Hover over the Decision Cutoff dropdown (`D-1 12:00 London`), switch dates to `2026-01-15`.
> *"The cardinal rule of day-ahead trading is that decisions must be made using only the information available before order book closure. In Great Britain, the primary Day-Ahead Wholesale Auctions on EPEX SPOT and Nord Pool close at 12:00 noon on D-1.
>
> Many commercial dashboards commit a critical error: they display the 'latest' forecast published near delivery. That is hindsight bias—a trader at 11:30 AM yesterday couldn't see today's 04:00 AM update.
>
> In WindScope, our engine strictly isolates the forecast available at the configured cutoff. Notice here on January 15th: our default cutoff is **D-1 12:00 London Time**. The system automatically selected the vintage published at 11:30 AM on January 14th, providing an authentic information set for our purchasing strategy."*

---

### [1:35 – 2:30] Scene 3: Forecast vs Actual Generation Outturn
**Visual**: Navigate to the **Forecast vs Actual** tab. Hover over peak settlement periods. Toggle series buttons.
> *"Let's look at the operational delivery day. On January 15th, our Day-Ahead forecast predicted a total volume of 387,000 MWh, with generation ramping to a peak of 18,200 MW during the evening peak.
>
> In our interactive time-series chart, the green line represents our Day-Ahead wind forecast, the cyan line tracks actual physical outturn from Elexon FUELHH, and the amber/rose bars reveal our half-hourly forecast errors.
>
> Notice the distinction between power and energy: each settlement period represents 30 minutes of delivery, so energy in Megawatt-hours is power in Megawatts multiplied by 0.5 hours. By clicking any settlement period, our interval inspector provides instant drill-downs on forecast MW, actual MW, and exact error margins."*

---

### [2:30 – 3:30] Scene 4: Quantitative Accuracy & Risk Metrics
**Visual**: Navigate to the **Quantitative Accuracy** tab. Highlight MAE, RMSE, Signed Bias, and WAPE.
> *"Next, traders need to know: how much can we trust this forecast?
>
> On the Quantitative Accuracy desk, WindScope evaluates four primary metrics across matched settlement periods:
> 1. **MAE (Mean Absolute Error)**: Measures our average volume deviation. For this delivery day, MAE was 1,280 MW.
> 2. **RMSE (Root Mean Squared Error)**: Sits at 1,590 MW. Because RMSE squares errors, it penalizes large spikes, reflecting the non-linear balancing cost of severe shortfalls.
> 3. **Signed Bias**: Sits at +940 MW. This positive sign is critical—it tells the trader we were systematically **overforecasting**. In commercial terms, we were at risk of being short in real time.
> 4. **WAPE (Weighted Absolute Percentage Error)**: Provides a volume-weighted percentage error of 11.2%, without the zero-division instability of standard MAPE during calm intervals.
>
> Furthermore, looking at our Cutoff vs Latest progression, we see that intra-day revisions improved forecast MAE by over 400 MW closer to gate closure."*

---

### [3:30 – 4:20] Scene 5: Forecast History & Procurement Decision Support
**Visual**: Click **Procurement Support** tab. Adjust the Assumed Demand slider to 38,000 MW.
> *"To bridge forecast intelligence with trading action, WindScope provides an interactive Procurement Decision Support tool.
>
> Here, a trader enters an assumed national gross demand profile—for example, 38,000 MW during a cold winter day. WindScope immediately computes the **Illustrative Residual Demand Curve**:
> $$\text{Residual Demand} = \text{Assumed Demand} - \text{Forecast Wind}$$
>
> Notice our amber line: it reveals the exact shape and ramp rate of thermal and interconnector generation needed to meet load. With our uncertainty slider, we can apply a statistical reserve buffer derived directly from our historical RMSE, helping the desk size peaking reserve margins."*

---

### [4:20 – 5:00] Scene 6: Transparency, Limitations & Commercial Wrap-Up
**Visual**: Click **Data Quality** tab. Show 100% verified coverage badge.
> *"Finally, trust in trading tools requires total transparency. In our Data Quality audit, every record is authenticated against live Elexon BMRS streams: exactly 1,488 out of 1,488 settlement intervals across January 2026 are verified with 100% completeness.
>
> As clearly stated in our methodology and limitations panel, national wind forecasts alone do not equal our utility's total procurement obligation, because consumer load, solar generation, and transmission constraints also play crucial roles.
>
> WindScope equips our desk with defensible, cutoff-compliant wind intelligence, eliminating blind spots and quantifying risk ahead of auction close."*

---

## PART 2: Technical Lead Code Review (5:00 – 10:00)

### [5:00 – 5:40] Scene 7: Full-Stack Architecture & Design Principles
**Visual**: Show `docs/architecture.md` diagram and IDE folder structure.
> *"Welcome to the technical lead architecture review. I'll walk through the implementation, code structure, data pipeline, and automated test suite.
>
> WindScope is structured as a decoupled full-stack application:
> - **Backend**: Python 3.12 with FastAPI, Pydantic, pandas, and numpy.
> - **Frontend**: React 19 with TypeScript, Vite, Tailwind CSS, Lucide icons, and Recharts.
> - **Ingestion**: Asynchronous client targeting official Elexon BMRS JSON streaming endpoints.
> - **Storage & Caching**: Local high-performance file store with in-memory pandas indexing and automatic live refresh capability."*

---

### [5:40 – 6:30] Scene 8: Elexon API Ingestion & Robustness
**Visual**: Open `backend/app/services/elexon_client.py` and `backend/app/repositories/data_store.py`.
> *"Let's look at `elexon_client.py`. We connect directly to the two specified BMRS datasets:
> 1. `FUELHH/stream` for half-hourly generation outturn.
> 2. `WINDFOR/stream` for multi-horizon wind generation forecasts.
>
> To ensure production resilience against upstream outages:
> - We implement asynchronous HTTP requests via `httpx.AsyncClient` with explicit 30-second timeouts.
> - We wrap requests in an exponential backoff retry loop handling HTTP 429, 502, 503, and 504 status codes.
> - In `fetch_fuelhh_actuals`, we strictly filter raw generation records to `fuelType == 'WIND'`.
> - In `data_store.py`, data is parsed into timezone-aware pandas DataFrames on application startup, allowing sub-10 millisecond query response times."*

---

### [6:30 – 7:20] Scene 9: Forecast Cutoff Logic & Vintage Resolution
**Visual**: Open `backend/app/services/forecast_selection.py`.
> *"The most critical domain logic resides in `forecast_selection.py`.
>
> First, in `parse_decision_cutoff`, we convert trading desk cutoff presets—such as `D-1 12:00 London`—into canonical UTC timestamps.
>
> In `ForecastSelector.get_matched_settlement_periods`:
> 1. We strictly filter forecasts to $publishTime \le cutoff\_ts$.
> 2. We apply deterministic deduplication on `(startTime, publishTime)`, retaining the latest record.
> 3. Granularity alignment: `FUELHH` is published in 30-minute intervals (`:00` and `:30`), whereas `WINDFOR` forecasts are hourly (`:00`).
>
> In accordance with UK market conventions, an hourly forecast for hour `HH:00` governs the entire operational hour, mapping identically to settlement periods $2k-1$ and $2k$.
> 4. Forecasts and actuals are matched by target settlement period, tracking missing intervals explicitly."*

---

### [7:20 – 8:10] Scene 10: Metrics, Timezones & Daylight Saving Handling
**Visual**: Open `backend/app/services/metrics.py` and `backend/tests/test_timezone_dst.py`.
> *"In `metrics.py`, we implement quantitative statistical formulas:
> - MAE and RMSE are computed strictly from valid matched pairs.
> - Signed Bias is defined as $Forecast - Actual$, preserving directionality.
> - For MAPE, to prevent divide-by-zero crashes when wind generation is calm, we filter for actual generation $\ge 100\text{ MW}$, reporting excluded period counts transparently.
> - WAPE divides total absolute error by total actual volume, ensuring numerical stability.
>
> In `generate_expected_settlement_periods`, we use `Europe/London` calendar rules. The UK switches between GMT and BST:
> - Standard days generate 48 periods.
> - Spring clock-change days generate 46 periods.
> - Autumn clock-change days generate 50 periods.
> January 2026 consists entirely of standard 48-period days, totaling exactly 1,488 periods."*

---

### [8:10 – 9:00] Scene 11: Automated Test Suite Execution
**Visual**: Open terminal and run both test suites:
1. `python -m pytest backend/tests -v`
2. `cd frontend && npx vitest run`
> *"Now let's execute our automated test suites.
>
> In the backend, we run `pytest`:
> Notice all 27 unit and integration tests pass in under 6 seconds, validating:
> - FUELHH fuelType WIND filtering.
> - Forecast cutoff exclusion (no lookahead leaks).
> - Hourly WINDFOR to 30-min settlement period mapping.
> - Spring 46, autumn 50, and standard 48 DST period counts.
> - Perfect forecast, positive bias, negative bias, and zero-actual protection.
> - End-to-end full trader workflow.
>
> In the frontend, we execute `vitest`:
> All 4 component tests pass, confirming KPI card rendering, navbar day navigation, CSV export generation, and settlement table search filters."*

---

### [9:00 – 10:00] Scene 12: Packaging, Deployment Topology & Tradeoffs
**Visual**: Show `docker-compose.yml`, `backend/Dockerfile`, and `frontend/Dockerfile`.
> *"To ensure simple, reproducible deployment:
> - We provide containerization via multi-stage Dockerfiles. The frontend is compiled with Vite and served via an optimized Nginx alpine container on port 3000.
> - The FastAPI backend runs via Uvicorn on port 8000.
> - `docker-compose.yml` spins up the entire stack with a single command: `docker compose up --build`.
> - For cloud hosting, the repository is prepared for Vercel (frontend) and Render (backend) with explicit CORS configurations.
>
> In terms of engineering tradeoffs:
> - We chose a high-performance in-memory and local file store over an external Postgres or Redis cluster, keeping the MVP lightweight, zero-latency, and cost-effective within our time budget.
> - All code is committed to a clean, anonymous public GitHub repository with no secrets or personal names.
>
> Thank you for your time and consideration."*
