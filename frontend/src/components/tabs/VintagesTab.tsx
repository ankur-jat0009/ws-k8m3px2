import React from 'react';
import type { VintageDetailResponse } from '../../types';
import { History, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VintagesTabProps {
  vintagesData: VintageDetailResponse | null;
}

export const VintagesTab: React.FC<VintagesTabProps> = ({ vintagesData }) => {
  if (!vintagesData) {
    return (
      <div className="py-16 text-center text-slate-400">
        Loading forecast vintages...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Forecast Vintage & Evolution Intelligence
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {vintagesData.eligible_vintages_count} of {vintagesData.total_vintages_count} Eligible at Cutoff
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking forecast revisions published by National Grid ESO. Vintages published after <span className="text-slate-200 font-semibold">{vintagesData.cutoff_applied}</span> are strictly segregated to avoid hindsight leakage.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-[#0D1527] px-3 py-1.5 rounded border border-[#1E2D4E] text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Total Vintages</span>
            <span className="font-bold text-white font-mono">{vintagesData.total_vintages_count}</span>
          </div>
          <div className="bg-[#0D1527] px-3 py-1.5 rounded border border-[#1E2D4E] text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Eligible Vintages</span>
            <span className="font-bold text-emerald-400 font-mono">{vintagesData.eligible_vintages_count}</span>
          </div>
        </div>
      </div>

      {/* Grid: Left = Publication Timeline, Right = Revision Drift Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Publication Vintages Table (5 cols) */}
        <div className="lg:col-span-5 bg-[#131E36] border border-[#203055] rounded-lg p-4 flex flex-col">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Published Forecast Runs</span>
          </h4>

          <div className="overflow-y-auto max-h-[500px] divide-y divide-[#1C2B4D] text-xs font-mono">
            {vintagesData.vintages.map((v, idx) => {
              const isEligible = v.is_before_cutoff;
              return (
                <div key={idx} className="py-2.5 px-2 hover:bg-[#182645] rounded transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold">
                      {v.publish_time.replace('T', ' ').substring(0, 16)} UTC
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        isEligible
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}
                    >
                      {isEligible ? 'Eligible at Cutoff' : 'Post-Cutoff'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400">
                    <div>
                      <span>Mean: </span>
                      <strong className="text-slate-200">{v.mean_forecast_mw.toLocaleString()} MW</strong>
                    </div>
                    <div>
                      <span>Peak: </span>
                      <strong className="text-slate-200">{v.peak_forecast_mw.toLocaleString()} MW</strong>
                    </div>
                    <div>
                      <span>Lead: </span>
                      <strong className="text-slate-200">{v.lead_time_hours}h</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Period-by-Period Revision Drift (7 cols) */}
        <div className="lg:col-span-7 bg-[#131E36] border border-[#203055] rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Forecast Revision Drift (Latest vs Cutoff)</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Δ MW = Latest Intra-day - Day-Ahead Cutoff
            </span>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-[#0D1527] text-slate-400 sticky top-0 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-2.5">SP</th>
                  <th className="py-2 px-2.5">UTC Time</th>
                  <th className="py-2 px-2.5 text-right">Cutoff MW</th>
                  <th className="py-2 px-2.5 text-right">Latest MW</th>
                  <th className="py-2 px-2.5 text-right">Actual MW</th>
                  <th className="py-2 px-2.5 text-right">Revision Δ</th>
                  <th className="py-2 px-2.5 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2B4D]">
                {vintagesData.comparison.map((c) => {
                  const delta = c.revision_delta_mw || 0;
                  const isUp = delta > 50;
                  const isDown = delta < -50;

                  return (
                    <tr key={c.settlement_period} className="hover:bg-[#182645] transition-colors">
                      <td className="py-2 px-2.5 font-bold text-white">SP{c.settlement_period}</td>
                      <td className="py-2 px-2.5 text-slate-400">{c.start_time.substring(11, 16)}</td>
                      <td className="py-2 px-2.5 text-right text-emerald-400">{c.cutoff_forecast_mw?.toLocaleString() || 'N/A'}</td>
                      <td className="py-2 px-2.5 text-right text-purple-400">{c.latest_forecast_mw?.toLocaleString() || 'N/A'}</td>
                      <td className="py-2 px-2.5 text-right text-cyan-400">{c.actual_mw?.toLocaleString() || 'N/A'}</td>
                      <td className={`py-2 px-2.5 text-right font-bold ${isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'}`}>
                        {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} MW
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        {isUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-400 inline" />}
                        {isDown && <TrendingDown className="w-3.5 h-3.5 text-rose-400 inline" />}
                        {!isUp && !isDown && <Minus className="w-3.5 h-3.5 text-slate-500 inline" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
