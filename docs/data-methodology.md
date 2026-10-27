# WindScope — Data Methodology & Market Semantics

## 1. Overview and Purpose
**WindScope** is an institutional-grade UK energy trading analytics platform developed for power procurement teams and quantitative traders. In wholesale electricity markets, power must be procured ahead of physical delivery. Because wind generation is non-dispatchable and intermittent, traders must evaluate:
1. What national wind generation volume was forecast for a target delivery day at the exact time when day-ahead procurement decisions were finalized.
2. How accurate historical day-ahead forecasts were relative to actual physical outturn, enabling informed risk-budgeting and reserve-procurement strategies.

---

## 2. Official Elexon Data Sources
All market data is sourced exclusively from the **Elexon BMRS (Balancing Mechanism Reporting Service) / Insights Solution API**:

| Dataset | Official Endpoint URL | Description |
| :--- | :--- | :--- |
| **FUELHH** (Actuals) | `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream` | Half-Hourly Generation Outturn by Fuel Type |
| **WINDFOR** (Forecasts) | `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream` | National Wind Generation Forecasts (rolling multi-day horizon) |

### 2.1 Actual Wind Generation (`FUELHH`)
- **Filter**: Filter records where `fuelType == 'WIND'`.
- **Primary Fields**:
  - `startTime`: Target settlement period start timestamp in UTC (ISO 8601: `YYYY-MM-DDTHH:MM:SSZ`).
  - `settlementDate`: Target delivery date (`YYYY-MM-DD`).
  - `settlementPeriod`: Settlement period index ($1 \dots 48$ for a standard 24-hour day; 46 on short clock-change day; 50 on long clock-change day).
  - `fuelType`: Constant string `'WIND'`.
  - `generation`: Average physical power delivered during the 30-minute interval, expressed in **Megawatts (MW)**.
- **Query Parameters**:
  - `settlementDateFrom` and `settlementDateTo`: Calendar date range bounds.

### 2.2 Forecast Wind Generation (`WINDFOR`)
- **Primary Fields**:
  - `publishTime`: Timestamp when the forecast vintage was calculated and published by National Grid ESO (UTC ISO 8601).
  - `startTime`: Target operational generation start time in UTC (ISO 8601).
  - `generation`: Predicted national wind generation, expressed in **Megawatts (MW)**.
- **Cadence & Horizon**:
  - In Elexon BMRS, `WINDFOR` is published multiple times daily (typically every 2 to 4 hours: 02:30, 04:30, 07:30, 09:30, 11:30, 15:30, 18:30, 22:30 UTC).
  - Each publication contains an hourly forecast vector spanning a rolling 72-hour horizon (73 individual hourly intervals).
- **Query Parameters**:
  - `publishDateTimeFrom` and `publishDateTimeTo`: Range of publication timestamps.

---

## 3. Market Timezone, Resolution & Calendar Semantics

### 3.1 Timezone Standard
- The canonical market timezone is **`Europe/London`**.
- During January (the primary evaluation period), London observes Greenwich Mean Time (**GMT**, UTC+00:00).
- During British Summer Time (**BST**, UTC+01:00), clocks advance by 1 hour.
- All internal storage and calculation retains timezone-aware UTC timestamps with explicit conversion to `Europe/London` for settlement calendar mapping.
- Day-length rules:
  - Standard day: 24 hours = 48 half-hour settlement periods.
  - Spring DST clock change (short day): 23 hours = 46 settlement periods.
  - Autumn DST clock change (long day): 25 hours = 50 settlement periods.
  - January 2026 consists entirely of standard 48-period days ($31 \times 48 = 1,488$ expected periods).

### 3.2 Granularity Alignment: Hourly Forecasts to Half-Hourly Settlement Periods
- `FUELHH` actuals are published at **half-hourly (30-minute) settlement period** resolution (`:00` and `:30`).
- `WINDFOR` forecasts are published at **hourly** resolution (`:00`).
- **Alignment Rule**: In the GB electricity market, an hourly forecast starting at `HH:00` governs the entire operational hour (`HH:00:00` to `HH:59:59`). This hour contains two settlement periods:
  - Odd period ($2k - 1$): `HH:00:00` to `HH:29:59`
  - Even period ($2k$): `HH:30:00` to `HH:59:59`
- Both constituent half-hour settlement periods inherit the forecast power ($\text{MW}$) of their containing hour.
- **Energy Conversion**:
  $$\text{Energy (MWh)} = \text{Power (MW)} \times 0.5\text{ hours}$$
  $$\text{Daily Energy (MWh)} = \sum_{p=1}^{N} \text{MW}_p \times 0.5$$

---

## 4. Day-Ahead Decision Timeline & Cutoff Methodology

### 4.1 Wholesale Market Context
In Great Britain:
- The principal Day-Ahead wholesale power auctions (EPEX SPOT GB Day-Ahead Auction and Nord Pool GB Day-Ahead Auction) have an order book closure at **12:00 London Time on D-1** (the day prior to physical delivery).
- Traders must submit binding bids and offers before 12:00 D-1 based on the latest available market intelligence.
- Forecast revisions published *after* 12:00 D-1 were physically unavailable to the trader when submitting day-ahead bids. Evaluating day-ahead decisions using later revisions constitutes hindsight bias (look-ahead leak).

### 4.2 Forecast Selection Rule
For a target delivery day $D$ and decision cutoff time $T_{\text{cutoff}}$ on $D-1$:
1. Determine the cutoff timestamp:
   $$t_{\text{cutoff}} = \text{Timestamp}(D-1, T_{\text{cutoff}}, \text{"Europe/London"})$$
2. Filter the universe of forecast records $\mathcal{F}$ targeting delivery day $D$ to those published at or before the cutoff:
   $$\mathcal{F}_{\text{eligible}} = \{ f \in \mathcal{F} \mid f.\text{publishTime} \le t_{\text{cutoff}} \}$$
3. For each target settlement interval $s$, select the vintage with the latest publication timestamp:
   $$f^*(s) = \arg\max_{f \in \mathcal{F}_{\text{eligible}}, \text{targets}(f, s)} (f.\text{publishTime})$$
4. **Configurable Cutoffs Supported**:
   - `D-1 09:00` (Early morning preliminary trading run)
   - `D-1 12:00` (**Default**: Standard GB Day-Ahead Auction Gate Closure)
   - `D-1 15:30` (EPEX Half-Hourly Day-Ahead Auction Gate Closure)
   - `D-1 17:00` (Post-auction day-ahead balancing schedule)
   - `D-1 23:00` (Final day-ahead schedule)
   - `Intraday / Latest` (Most recent vintage available prior to delivery, used as a benchmark to measure forecast improvement)

---

## 5. Quantitative Forecast Accuracy Metrics

All metrics are evaluated exclusively on valid, matched forecast-actual observation pairs $(F_i, A_i)$ for $i = 1 \dots n$, where $F_i$ is forecast power (MW) and $A_i$ is actual physical outturn (MW).

### 5.1 Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |F_i - A_i| \quad (\text{MW})$$
Measures average error magnitude without considering sign. Lower is better.

### 5.2 Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (F_i - A_i)^2} \quad (\text{MW})$$
Penalizes larger forecast errors disproportionately, reflecting the non-linear cost of balancing severe volume errors.

### 5.3 Mean Bias Error (Signed Bias)
$$\text{Bias} = \frac{1}{n} \sum_{i=1}^n (F_i - A_i) \quad (\text{MW})$$
- **Positive Bias ($> 0$)**: Systematic **overforecasting** (forecast > actual). The utility is at risk of being short in real time and having to purchase expensive imbalance power.
- **Negative Bias ($< 0$)**: Systematic **underforecasting** (forecast < actual). The utility bought excess power day-ahead and may face spill or discount cash-out prices.

### 5.4 Weighted Absolute Percentage Error (WAPE)
$$\text{WAPE} = \frac{\sum_{i=1}^n |F_i - A_i|}{\sum_{i=1}^n A_i} \times 100\%$$
Volume-weighted percentage error. Unlike standard MAPE, WAPE does not blow up when actual generation is close to zero.

### 5.5 Mean Absolute Percentage Error (MAPE)
$$\text{MAPE} = \frac{100\%}{n'} \sum_{i \in \{i \mid A_i \ge \epsilon\}} \frac{|F_i - A_i|}{A_i}$$
Calculated only on intervals where $A_i \ge 100\text{ MW}$ to avoid numerical instability and distortion during very low wind generation. Intervals below $100\text{ MW}$ are excluded with explicit counts reported.

### 5.6 Forecast Coverage Ratio
$$\text{Coverage} = \frac{n_{\text{matched}}}{N_{\text{expected}}} \times 100\%$$
Discloses data completeness. For standard January days, $N_{\text{expected}} = 48$.

---

## 6. Deduplication & Data Quality Policy

1. **Exact Duplicate Records**: If multiple records exist with the identical `(startTime, publishTime, generation)`, deduplicate to a single unique record.
2. **Conflicting Records**: If multiple records share `(startTime, publishTime)` with conflicting generation values, take the last received record and increment the quality warning flag.
3. **Missing Data Handling**:
   - If an actual interval is absent, the forecast is preserved, the actual is marked `null`/`Missing`, and error metrics for that interval are suppressed.
   - If a forecast interval is absent at cutoff, the interval is flagged as `Missing Forecast`.
   - Never impute or backfill missing values with synthetic data without explicit disclosure.
4. **Physical Bounds Validation**:
   - Generation values $< 0\text{ MW}$ are flagged as anomalous (wind generation is non-negative, though small auxiliary consumption can occur; negative values are retained with a quality warning).
   - Generation values $> 35,000\text{ MW}$ are flagged as exceeding current GB installed wind capacity.

---

## 7. Procurement Decision Support Model

### Residual Demand Formulation
$$\text{Residual Demand (MW)} = \text{User Assumed Gross Demand (MW)} - \text{Forecast Wind Generation (MW)}$$
- Allows the trading desk to evaluate how much non-wind power (thermal, hydro, nuclear, interconnectors) must be scheduled for delivery.
- **Uncertainty Adjustment**:
  $$\text{Procurement Buffer} = k \times \text{Historical RMSE}$$
  Where $k$ is an adjustable risk multiplier ($1.0\sigma \approx 68\%$, $1.96\sigma \approx 95\%$ under Gaussian assumptions).
- **Limitation**: As emphasized in `docs/limitations.md`, this is an illustrative operational metric, not a complete trading optimization, because it excludes solar generation, outages, and transmission constraints.
