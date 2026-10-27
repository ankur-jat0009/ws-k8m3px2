import React from 'react';
import type { AccuracyEvaluationResponse } from '../../types';
import { KPICard } from '../KPICard';
import { Target, TrendingUp, ArrowUpRight, ArrowDownRight, Award, BarChart2 } from 'lucide-react';

interface AccuracyTabProps {
  accuracyData: AccuracyEvaluationResponse | null;
}

export const AccuracyTab: React.FC<AccuracyTabProps> = ({ accuracyData }) => {
  if (!accuracyData) {
    return (
      <div className="py-16 text-center text-slate-400">
        Loading accuracy metrics...
      </div>
    );
  }

  const { cutoff_vs_latest } = accuracyData;
  const isOverforecast = accuracyData.mean_bias_mw > 0;

  return (
    <div className="space-y-6">
      {/* Accuracy Header Banner */}
      <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Quantitative Forecast Accuracy Evaluation
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {accuracyData.matched_pairs_count} Matched Pairs Evaluated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Strictly evaluated from verified forecast-actual pairs at <span className="text-slate-200 font-semibold">{accuracyData.cutoff_applied}</span>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded bg-[#0D1527] border border-[#1E2D4E] text-xs font-mono">
            <span className="text-slate-400">Target: </span>
            <span className="text-emerald-400 font-bold">{accuracyData.period_label}</span>
          </div>
        </div>
      </div>

      {/* Primary Quantitative Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Mean Absolute Error (MAE)"
          value={accuracyData.mae_mw.toLocaleString()}
          unit="MW"
          subtext="Average magnitude of forecast error"
          badge="Lower is better"
          badgeColor="emerald"
          icon={<Target className="w-4 h-4 text-emerald-400" />}
        />

        <KPICard
          title="Root Mean Squared Error (RMSE)"
          value={accuracyData.rmse_mw.toLocaleString()}
          unit="MW"
          subtext="Penalizes large outlier errors"
          badge="Quadratic Loss"
          badgeColor="cyan"
          icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
        />

        <KPICard
          title="Mean Signed Bias (F - A)"
          value={`${accuracyData.mean_bias_mw > 0 ? '+' : ''}${accuracyData.mean_bias_mw.toLocaleString()}`}
          unit="MW"
          subtext={isOverforecast ? 'Overforecasting: Short Imbalance Risk' : 'Underforecasting: Spill Imbalance Risk'}
          badge={isOverforecast ? '+ Overforecast' : '- Underforecast'}
          badgeColor={isOverforecast ? 'amber' : 'emerald'}
          icon={isOverforecast ? <ArrowUpRight className="w-4 h-4 text-amber-400" /> : <ArrowDownRight className="w-4 h-4 text-emerald-400" />}
        />

        <KPICard
          title="Weighted Error (WAPE)"
          value={`${accuracyData.wape_percent}%`}
          subtext={`MAPE: ${accuracyData.mape_percent !== null ? `${accuracyData.mape_percent}%` : 'N/A'}`}
          badge={accuracyData.mape_excluded_count > 0 ? `${accuracyData.mape_excluded_count} Low-Wind Periods Excluded` : 'Complete'}
          badgeColor="slate"
          icon={<Award className="w-4 h-4 text-slate-300" />}
        />
      </div>

      {/* Decision-Time Cutoff vs Latest Forecast Progression */}
      {cutoff_vs_latest && (
        <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1E2D4E]">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Decision Cutoff vs Later Forecast Evolution</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing accuracy at Day-Ahead order gate closure vs the latest available forecast near delivery.
              </p>
            </div>
            {cutoff_vs_latest.mae_improvement_mw > 0 && (
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                +{cutoff_vs_latest.mae_improvement_mw.toLocaleString()} MW MAE Improvement Near Real-Time
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Cutoff Box */}
            <div className="bg-[#0D1527] border border-[#1E2D4E] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-400 text-sm">1. Day-Ahead Decision Forecast</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {cutoff_vs_latest.cutoff.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Information set actually available to the trader at binding auction gate closure.
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">MAE</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.cutoff.mae_mw?.toLocaleString()} MW</span>
                </div>
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">RMSE</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.cutoff.rmse_mw?.toLocaleString()} MW</span>
                </div>
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">Signed Bias</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.cutoff.bias_mw?.toLocaleString()} MW</span>
                </div>
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">WAPE</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.cutoff.wape_percent}%</span>
                </div>
              </div>
            </div>

            {/* Latest Outturn Box */}
            <div className="bg-[#0D1527] border border-[#1E2D4E] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-400 text-sm">2. Latest Intra-Day Forecast</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {cutoff_vs_latest.latest.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Final revision prior to operational delivery (illustrates forecast convergence).
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">MAE</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.latest.mae_mw?.toLocaleString()} MW</span>
                </div>
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">RMSE</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.latest.rmse_mw?.toLocaleString()} MW</span>
                </div>
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">Signed Bias</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.latest.bias_mw?.toLocaleString()} MW</span>
                </div>
                <div className="bg-[#131E36] p-2 rounded">
                  <span className="text-[10px] text-slate-400 block uppercase">WAPE</span>
                  <span className="text-sm font-bold text-white">{cutoff_vs_latest.latest.wape_percent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Distribution Percentiles & Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Distribution Percentiles */}
        <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
            Forecast Error Distribution Percentiles (MW)
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Signed error distribution (Forecast - Actual) for risk-budgeting.
          </p>

          <div className="grid grid-cols-5 gap-2 text-center font-mono">
            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">P10</span>
              <span className="text-xs font-bold text-rose-400">{accuracyData.error_p10_mw > 0 ? `+${accuracyData.error_p10_mw}` : accuracyData.error_p10_mw}</span>
            </div>
            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">P25</span>
              <span className="text-xs font-bold text-slate-200">{accuracyData.error_p25_mw > 0 ? `+${accuracyData.error_p25_mw}` : accuracyData.error_p25_mw}</span>
            </div>
            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">Median</span>
              <span className="text-xs font-bold text-cyan-400">{accuracyData.error_p50_mw > 0 ? `+${accuracyData.error_p50_mw}` : accuracyData.error_p50_mw}</span>
            </div>
            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">P75</span>
              <span className="text-xs font-bold text-slate-200">{accuracyData.error_p75_mw > 0 ? `+${accuracyData.error_p75_mw}` : accuracyData.error_p75_mw}</span>
            </div>
            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">P90</span>
              <span className="text-xs font-bold text-amber-400">{accuracyData.error_p90_mw > 0 ? `+${accuracyData.error_p90_mw}` : accuracyData.error_p90_mw}</span>
            </div>
          </div>
        </div>

        {/* Commercial Interpretation Guide */}
        <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Trading Desk Metric Interpretation
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-amber-400">Positive Bias (Overforecasting):</strong> National wind was predicted higher than physical delivery. If the utility relied on this, it will be short in real time and exposed to System Buy Price (SBP) cash-out.
              </li>
              <li>
                <strong className="text-emerald-400">Negative Bias (Underforecasting):</strong> Actual generation exceeded expectations. The utility has excess power that spills into the Balancing Mechanism.
              </li>
              <li>
                <strong className="text-cyan-400">WAPE vs MAPE:</strong> WAPE weights errors by volume, avoiding zero-division and distortion during low-wind periods.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
