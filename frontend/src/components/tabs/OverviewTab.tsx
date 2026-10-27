import React from 'react';
import type { 
  ForecastOverviewResponse, 
  OverviewMonthResponse 
} from '../../types';
import { KPICard } from '../KPICard';
import { 
  Zap, 
  Gauge, 
  TrendingUp, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface OverviewTabProps {
  overview: ForecastOverviewResponse | null;
  monthOverview: OverviewMonthResponse | null;
  onSelectDate: (date: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  monthOverview,
  onSelectDate
}) => {
  if (!overview) {
    return (
      <div className="py-12 text-center text-slate-400">
        Loading delivery day intelligence...
      </div>
    );
  }

  const isOverforecasting = (overview.bias_mw || 0) > 0;
  const biasBadgeColor = isOverforecasting ? 'amber' : 'emerald';
  const biasBadgeText = isOverforecasting ? 'Overforecast (Short Risk)' : 'Underforecast (Spill Risk)';

  return (
    <div className="space-y-6">
      {/* Cutoff & Market Banner */}
      <div className="bg-[#131E36] border border-[#203055] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-0.5">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Delivery Day {overview.delivery_date}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {overview.coverage_percent}% Coverage ({overview.matched_periods}/{overview.expected_periods} SP)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cutoff Rule: <span className="text-slate-200 font-semibold">{overview.cutoff_applied}</span> — Evaluated at <span className="font-mono text-cyan-300">{overview.cutoff_time}</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Market Timezone</div>
          <div className="text-xs font-semibold text-slate-200">{overview.market_timezone} (GMT)</div>
          <div className="text-[11px] text-slate-400">Last Refreshed: {new Date(overview.last_refresh).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Forecast Generation"
          value={overview.total_forecast_mwh.toLocaleString()}
          unit="MWh"
          subtext={`Peak: ${overview.forecast_peak_mw.toLocaleString()} MW`}
          badge="Day-Ahead"
          badgeColor="emerald"
          icon={<Zap className="w-4 h-4 text-emerald-400" />}
        />

        <KPICard
          title="Actual Generation"
          value={overview.total_actual_mwh ? overview.total_actual_mwh.toLocaleString() : 'N/A'}
          unit="MWh"
          subtext={overview.actual_peak_mw ? `Peak: ${overview.actual_peak_mw.toLocaleString()} MW` : 'Outturn Pending'}
          badge="FUELHH Outturn"
          badgeColor="cyan"
          icon={<Gauge className="w-4 h-4 text-cyan-400" />}
        />

        <KPICard
          title="Mean Absolute Error (MAE)"
          value={overview.mae_mw !== null ? overview.mae_mw.toLocaleString() : 'N/A'}
          unit="MW"
          subtext={`RMSE: ${overview.rmse_mw !== null ? overview.rmse_mw.toLocaleString() : 'N/A'} MW`}
          badge={`WAPE: ${overview.wape_percent !== null ? overview.wape_percent : 'N/A'}%`}
          badgeColor="amber"
          icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
        />

        <KPICard
          title="Signed Bias (F - A)"
          value={overview.bias_mw !== null ? `${overview.bias_mw > 0 ? '+' : ''}${overview.bias_mw.toLocaleString()}` : 'N/A'}
          unit="MW"
          subtext={isOverforecasting ? 'Utility at risk of being short' : 'Utility at risk of spill'}
          badge={biasBadgeText}
          badgeColor={biasBadgeColor}
          icon={isOverforecasting ? <ArrowUpRight className="w-4 h-4 text-amber-400" /> : <ArrowDownRight className="w-4 h-4 text-emerald-400" />}
        />
      </div>

      {/* Monthly Benchmark Summary Table */}
      {monthOverview && (
        <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                January 2026 Wholesale Month Overview
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Full 31-day benchmark at {monthOverview.cutoff_applied}. Click any row to inspect delivery day.
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-slate-300">
                Monthly MAE: <strong className="text-amber-400">{monthOverview.overall_mae_mw.toLocaleString()} MW</strong>
              </span>
              <span className="text-slate-300">
                Overall WAPE: <strong className="text-cyan-400">{monthOverview.overall_wape_percent}%</strong>
              </span>
              <span className="text-slate-300">
                Forecast Energy: <strong className="text-emerald-400">{monthOverview.total_forecast_gwh.toLocaleString()} GWh</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0D1527] text-slate-400 sticky top-0 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Delivery Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Forecast MWh</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actual MWh</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Forecast Peak MW</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actual Peak MW</th>
                  <th className="py-2.5 px-3 font-semibold text-right">MAE (MW)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">RMSE (MW)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Signed Bias (MW)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">WAPE (%)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2B4D] font-mono">
                {monthOverview.days.map((d) => {
                  const isSelected = d.delivery_date === overview.delivery_date;
                  return (
                    <tr
                      key={d.delivery_date}
                      onClick={() => onSelectDate(d.delivery_date)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'hover:bg-[#182645]'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-white flex items-center space-x-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        <span>{d.delivery_date}</span>
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400">{d.total_forecast_mwh.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-cyan-400">{d.total_actual_mwh.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{d.peak_forecast_mw.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{d.peak_actual_mw.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-semibold text-amber-300">{d.mae_mw.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{d.rmse_mw.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right font-semibold ${d.bias_mw > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {d.bias_mw > 0 ? `+${d.bias_mw.toLocaleString()}` : d.bias_mw.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-cyan-300">{d.wape_percent}%</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          100%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
