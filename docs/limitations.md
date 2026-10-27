# WindScope — Scope Boundaries & Procurement Limitations

## 1. Executive Summary
**WindScope** delivers deep quantitative intelligence on UK national wind generation forecasts and historical forecast errors. However, **national wind forecast generation alone is insufficient to calculate an electricity utility's total procurement requirement**.

This document outlines the operational, commercial, and structural market factors that separate national wind generation forecasts from actual commercial procurement obligations.

---

## 2. Factors Excluded From Pure Wind Generation Analysis

### 2.1 Utility-Specific Portfolio vs. National Generation
- **Contractual Ownership**: National wind forecasts reflect total Great Britain grid-connected (and metered) wind capacity. An individual utility only owns, contracts, or off-takes a specific fraction of this capacity via Power Purchase Agreements (PPAs) or direct equity.
- **Embedded vs. Transmission Generation**: BMRS `FUELHH` captures transmission-connected and centrally metered generation. Embedded generation (small distributed wind connected to distribution networks) appears as negative gross customer demand rather than metered wholesale generation.

### 2.2 Demand Side Dynamics
- **Retail Demand Profiles**: A utility's primary procurement obligation is determined by its retail, commercial, and industrial customer load profiles (half-hourly customer meter consumption).
- **Weather Sensitivity**: Temperature, wind-chill, daylight hours, and consumer behavior strongly drive customer demand. Wind generation often fluctuates inversely or independently of customer peak demand.

### 2.3 Other Generation Sources & Technologies
A complete day-ahead supply balance includes:
- **Solar Photovoltaics (PV)**: Highly weather-dependent, diurnal renewable generation.
- **Nuclear Baseload**: Inflexible, continuous power output.
- **Biomass & Hydro**: Baseload and dispatchable peaking renewables.
- **Combined Cycle Gas Turbines (CCGT)**: Flexible thermal dispatch capacity used to balance wind swings.
- **Interconnector Flows**: Power imported/exported via interconnectors with France (IFA, IFA2), Netherlands (BritNed), Belgium (Nemo Link), Norway (North Sea Link), and Ireland (Moyle, EWIC).

### 2.4 Transmission Network Constraints & Curtailment
- **Locational Constraints**: Much of GB's wind generation is located in Scotland and offshore in the North Sea, while the majority of customer demand is in southern England.
- **Export Limits (B6 Boundary)**: When transmission bottlenecks occur between Scotland and England, National Grid ESO curtails wind generation in the Balancing Mechanism (BM) through Bid-Offer Acceptances (BOAs).
- Physical outturn can be lower than forecast simply because the grid operator instructed wind farms to turn down, not because the wind was absent.

### 2.5 Market Balancing & Commercial Imbalance Settlement
- **Cash-Out Exposure**: Energy imbalances are settled at the System Buy Price (SBP) or System Sell Price (SSP) in Elexon's Balancing Mechanism. Imbalance cash-out prices are highly volatile and asymmetric.
- **Optimal Procurement Strategy**: Buying 100% of forecast generation day-ahead is not always economically optimal when expected cash-out prices favor being short or long relative to day-ahead auction prices.

---

## 3. Recommended Use of WindScope Decisions
Traders and analysts should use WindScope to:
1. **Benchmark Forecast Confidence**: Measure whether day-ahead forecasts are exhibiting positive or negative bias during specific weather regimes.
2. **Size Uncertainty Buffers**: Use historical MAE and RMSE metrics to calculate statistical reserve margins around wind generation assumptions.
3. **Analyze Forecast Evolution**: Observe how forecast revisions drift from D-1 12:00 gate closure to intra-day delivery.
4. **Stress-Test Residual Demand**: Use the interactive procurement decision support tool to evaluate residual thermal/interconnector requirements under varying demand scenarios.
