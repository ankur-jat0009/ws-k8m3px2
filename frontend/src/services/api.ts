import type {
  ForecastTimeSeriesResponse,
  OverviewMonthResponse,
  VintageDetailResponse,
  AccuracyEvaluationResponse,
  DataQualityResponse,
  ProcurementSupportResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchForecasts(date: string, cutoff: string = 'D-1_12:00'): Promise<ForecastTimeSeriesResponse> {
  const res = await fetch(`${API_BASE}/api/v1/forecasts?date=${date}&cutoff=${encodeURIComponent(cutoff)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch forecasts: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMonthOverview(cutoff: string = 'D-1_12:00'): Promise<OverviewMonthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/overview/month?cutoff=${encodeURIComponent(cutoff)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch month overview: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVintages(date: string, cutoff: string = 'D-1_12:00'): Promise<VintageDetailResponse> {
  const res = await fetch(`${API_BASE}/api/v1/forecast-vintages?date=${date}&cutoff=${encodeURIComponent(cutoff)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch forecast vintages: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAccuracy(date: string, cutoff: string = 'D-1_12:00'): Promise<AccuracyEvaluationResponse> {
  const res = await fetch(`${API_BASE}/api/v1/accuracy?date=${date}&cutoff=${encodeURIComponent(cutoff)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch accuracy metrics: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDataQuality(): Promise<DataQualityResponse> {
  const res = await fetch(`${API_BASE}/api/v1/data-quality`);
  if (!res.ok) {
    throw new Error(`Failed to fetch data quality report: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function triggerRefresh(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/v1/data-quality/refresh`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger refresh: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProcurementDecision(
  deliveryDate: string,
  assumedDemandMw: number = 35000,
  profileType: string = 'diurnal_standard',
  uncertaintySigma: number = 1.0
): Promise<ProcurementSupportResponse> {
  const res = await fetch(`${API_BASE}/api/v1/procurement-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      delivery_date: deliveryDate,
      assumed_demand_mw: assumedDemandMw,
      profile_type: profileType,
      uncertainty_sigma: uncertaintySigma
    })
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch procurement support: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function getCsvExportUrl(date: string, cutoff: string = 'D-1_12:00', status?: string): string {
  let url = `${API_BASE}/api/v1/settlement-periods/export-csv?date=${date}&cutoff=${encodeURIComponent(cutoff)}`;
  if (status) {
    url += `&status=${encodeURIComponent(status)}`;
  }
  return url;
}
