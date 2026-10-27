import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

class MetricsEngine:
    @staticmethod
    def calculate_period_metrics(periods: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate quantitative forecast metrics strictly from valid matched forecast-actual pairs.
        """
        matched = [p for p in periods if p.get("forecast_mw") is not None and p.get("actual_mw") is not None]
        
        forecast_vals = [p["forecast_mw"] for p in periods if p.get("forecast_mw") is not None]
        actual_vals = [p["actual_mw"] for p in periods if p.get("actual_mw") is not None]

        # Power & Energy aggregates
        fc_peak = round(float(np.max(forecast_vals)), 1) if forecast_vals else 0.0
        fc_mean = round(float(np.mean(forecast_vals)), 1) if forecast_vals else 0.0
        total_fc_mwh = round(sum(v * 0.5 for v in forecast_vals), 1)

        act_peak = round(float(np.max(actual_vals)), 1) if actual_vals else None
        act_mean = round(float(np.mean(actual_vals)), 1) if actual_vals else None
        total_act_mwh = round(sum(v * 0.5 for v in actual_vals), 1) if actual_vals else None

        if not matched:
            return {
                "total_forecast_mwh": total_fc_mwh,
                "total_actual_mwh": total_act_mwh,
                "forecast_peak_mw": fc_peak,
                "forecast_mean_mw": fc_mean,
                "actual_peak_mw": act_peak,
                "actual_mean_mw": act_mean,
                "mae_mw": None,
                "rmse_mw": None,
                "bias_mw": None,
                "wape_percent": None,
                "mape_percent": None,
                "mape_excluded_count": 0,
                "matched_count": 0,
                "p10": None, "p25": None, "p50": None, "p75": None, "p90": None
            }

        f = np.array([p["forecast_mw"] for p in matched], dtype=float)
        a = np.array([p["actual_mw"] for p in matched], dtype=float)
        errors = f - a
        abs_errors = np.abs(errors)

        mae = float(np.mean(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        bias = float(np.mean(errors))

        # WAPE: sum(|f - a|) / sum(a)
        sum_act = float(np.sum(a))
        wape = float((np.sum(abs_errors) / sum_act) * 100.0) if sum_act > 0 else 0.0

        # MAPE with exclusion for actuals < 100 MW
        mape_mask = a >= 100.0
        mape_excluded = int(np.sum(~mape_mask))
        if np.any(mape_mask):
            mape = float(np.mean(abs_errors[mape_mask] / a[mape_mask]) * 100.0)
        else:
            mape = None

        # Percentiles of signed error
        p10 = float(np.percentile(errors, 10))
        p25 = float(np.percentile(errors, 25))
        p50 = float(np.percentile(errors, 50))
        p75 = float(np.percentile(errors, 75))
        p90 = float(np.percentile(errors, 90))

        return {
            "total_forecast_mwh": total_fc_mwh,
            "total_actual_mwh": total_act_mwh,
            "forecast_peak_mw": fc_peak,
            "forecast_mean_mw": fc_mean,
            "actual_peak_mw": act_peak,
            "actual_mean_mw": act_mean,
            "mae_mw": round(mae, 2),
            "rmse_mw": round(rmse, 2),
            "bias_mw": round(bias, 2),
            "wape_percent": round(wape, 2),
            "mape_percent": round(mape, 2) if mape is not None else None,
            "mape_excluded_count": mape_excluded,
            "matched_count": len(matched),
            "p10": round(p10, 2),
            "p25": round(p25, 2),
            "p50": round(p50, 2),
            "p75": round(p75, 2),
            "p90": round(p90, 2)
        }

    @staticmethod
    def calculate_residual_demand(periods: List[Dict[str, Any]], base_demand_mw: float, profile_type: str = "diurnal_standard", uncertainty_sigma: float = 1.0, rmse_mw: float = 1500.0) -> Dict[str, Any]:
        """
        Model illustrative residual demand:
        Residual Demand (MW) = Assumed Customer Demand (MW) - Forecast Wind Generation (MW)
        """
        # Diurnal shaping factor for standard UK demand (morning and evening peaks)
        # Period 1 (00:00) to Period 48 (23:30)
        diurnal_weights = [
            0.72, 0.70, 0.68, 0.66, 0.65, 0.65, 0.66, 0.68, # 00:00 - 03:30 (night trough)
            0.72, 0.78, 0.88, 0.98, 1.05, 1.10, 1.12, 1.10, # 04:00 - 07:30 (morning ramp)
            1.08, 1.06, 1.05, 1.04, 1.03, 1.03, 1.02, 1.02, # 08:00 - 11:30 (daytime plateau)
            1.02, 1.03, 1.04, 1.06, 1.08, 1.12, 1.18, 1.22, # 12:00 - 15:30 (afternoon ramp)
            1.25, 1.24, 1.20, 1.15, 1.10, 1.05, 0.98, 0.92, # 16:00 - 19:30 (evening peak)
            0.88, 0.84, 0.80, 0.78, 0.76, 0.75, 0.74, 0.73  # 20:00 - 23:30 (late night drop)
        ]

        results = []
        residual_mw_list = []

        buffer_mw = round(uncertainty_sigma * rmse_mw, 1)

        for p in periods:
            sp_idx = p["settlement_period"]
            fc_wind = p.get("forecast_mw") or 0.0

            if profile_type == "flat":
                d_mw = base_demand_mw
            elif profile_type == "industrial":
                # High day, lower night
                d_mw = base_demand_mw * (1.15 if 14 <= sp_idx <= 38 else 0.85)
            else: # diurnal_standard
                weight_idx = min(sp_idx - 1, len(diurnal_weights) - 1)
                d_mw = round(base_demand_mw * diurnal_weights[weight_idx], 1)

            res_mw = round(d_mw - fc_wind, 1)
            res_mwh = round(res_mw * 0.5, 1)
            res_buffered = round(res_mw + buffer_mw, 1)

            residual_mw_list.append(res_mw)

            results.append({
                "settlement_period": sp_idx,
                "start_time": p["start_time"],
                "forecast_wind_mw": fc_wind,
                "assumed_demand_mw": d_mw,
                "residual_demand_mw": res_mw,
                "residual_demand_mwh": res_mwh,
                "buffer_mw": buffer_mw,
                "residual_with_buffer_mw": res_buffered
            })

        peak_res = max(residual_mw_list) if residual_mw_list else 0.0
        min_res = min(residual_mw_list) if residual_mw_list else 0.0
        mean_res = round(float(np.mean(residual_mw_list)), 1) if residual_mw_list else 0.0
        total_res_mwh = round(sum(r * 0.5 for r in residual_mw_list), 1)

        return {
            "peak_residual_mw": peak_res,
            "min_residual_mw": min_res,
            "mean_residual_mw": mean_res,
            "total_residual_mwh": total_res_mwh,
            "buffer_mw": buffer_mw,
            "periods": results
        }

metrics_engine = MetricsEngine()
