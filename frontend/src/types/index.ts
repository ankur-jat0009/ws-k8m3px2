export interface SettlementPeriodRecord {
  settlement_period: number;
  start_time: string;
  end_time: string;
  delivery_date: string;
  forecast_mw: number | null;
  actual_mw: number | null;
  forecast_mwh: number | null;
  actual_mwh: number | null;
  error_mw: number | null;
  abs_error_mw: number | null;
  percentage_error: number | null;
  publish_time: string | null;
  lead_time_hours: number | null;
  status: string;
}

export interface ForecastOverviewResponse {
  delivery_date: string;
  cutoff_time: string;
  cutoff_applied: string;
  market_timezone: string;
  total_forecast_mwh: number;
  total_actual_mwh: number | null;
  forecast_peak_mw: number;
  forecast_mean_mw: number;
  actual_peak_mw: number | null;
  actual_mean_mw: number | null;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  wape_percent: number | null;
  mape_percent: number | null;
  expected_periods: number;
  available_forecast_periods: number;
  available_actual_periods: number;
  matched_periods: number;
  coverage_percent: number;
  data_source: string;
  last_refresh: string;
}

export interface ForecastTimeSeriesResponse {
  overview: ForecastOverviewResponse;
  periods: SettlementPeriodRecord[];
}

export interface ForecastVintageSummary {
  publish_time: string;
  target_date: string;
  points_count: number;
  min_start_time: string;
  max_start_time: string;
  mean_forecast_mw: number;
  peak_forecast_mw: number;
  total_forecast_mwh: number;
  is_before_cutoff: boolean;
  lead_time_hours: number | null;
}

export interface VintageComparisonPoint {
  settlement_period: number;
  start_time: string;
  actual_mw: number | null;
  cutoff_forecast_mw: number | null;
  latest_forecast_mw: number | null;
  revision_delta_mw: number | null;
}

export interface VintageDetailResponse {
  delivery_date: string;
  cutoff_applied: string;
  total_vintages_count: number;
  eligible_vintages_count: number;
  vintages: ForecastVintageSummary[];
  comparison: VintageComparisonPoint[];
}

export interface AccuracyEvaluationResponse {
  period_label: string;
  cutoff_applied: string;
  matched_pairs_count: number;
  mae_mw: number;
  rmse_mw: number;
  mean_bias_mw: number;
  wape_percent: number;
  mape_percent: number | null;
  mape_excluded_count: number;
  error_p10_mw: number;
  error_p25_mw: number;
  error_p50_mw: number;
  error_p75_mw: number;
  error_p90_mw: number;
  cutoff_vs_latest: {
    cutoff: {
      label: string;
      mae_mw: number | null;
      rmse_mw: number | null;
      bias_mw: number | null;
      wape_percent: number | null;
    };
    latest: {
      label: string;
      mae_mw: number | null;
      rmse_mw: number | null;
      bias_mw: number | null;
      wape_percent: number | null;
    };
    mae_improvement_mw: number;
  };
}

export interface DailySummaryItem {
  delivery_date: string;
  total_forecast_mwh: number;
  total_actual_mwh: number;
  peak_forecast_mw: number;
  peak_actual_mw: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  wape_percent: number;
  coverage_percent: number;
}

export interface OverviewMonthResponse {
  month_label: string;
  cutoff_applied: string;
  total_days: number;
  total_forecast_gwh: number;
  total_actual_gwh: number;
  overall_mae_mw: number;
  overall_rmse_mw: number;
  overall_bias_mw: number;
  overall_wape_percent: number;
  overall_coverage_percent: number;
  days: DailySummaryItem[];
}

export interface DataQualityResponse {
  data_source: string;
  is_live: boolean;
  last_updated: string;
  total_forecast_records: number;
  total_actual_records: number;
  missing_actual_intervals: number;
  missing_forecast_intervals: number;
  duplicate_records_found: number;
  cutoff_adherence_percent: number;
  quality_warnings: string[];
}

export interface ProcurementSupportPeriod {
  settlement_period: number;
  start_time: string;
  forecast_wind_mw: number;
  assumed_demand_mw: number;
  residual_demand_mw: number;
  residual_demand_mwh: number;
  buffer_mw: number;
  residual_with_buffer_mw: number;
}

export interface ProcurementSupportResponse {
  delivery_date: string;
  assumed_demand_mw: number;
  profile_type: string;
  uncertainty_sigma: number;
  historical_rmse_mw: number;
  peak_residual_mw: number;
  min_residual_mw: number;
  mean_residual_mw: number;
  total_residual_mwh: number;
  periods: ProcurementSupportPeriod[];
  disclaimer: string;
}
