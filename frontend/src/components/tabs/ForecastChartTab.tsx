import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine,
  Cell
} from 'recharts';
import type { SettlementPeriodRecord, ForecastOverviewResponse } from '../../types';

interface ForecastChartTabProps {
  overview: ForecastOverviewResponse | null;
  periods: SettlementPeriodRecord[];
}

export const ForecastChartTab: React.FC<ForecastChartTabProps> = ({ overview, periods }) => {
  const [showForecast, setShowForecast] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showError, setShowError] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<SettlementPeriodRecord | null>(null);

  if (!periods || periods.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        No settlement period data available for this delivery date.
      </div>
    );
  }

  // Format data for Recharts
  const chartData = periods.map((p) => {
    // Format UTC time HH:MM
    const timeLabel = p.start_time.substring(11, 16);
    return {
      period: p.settlement_period,
      timeLabel: `SP${p.settlement_period} (${timeLabel})`,
      shortLabel: timeLabel,
      forecastMw: p.forecast_mw,
      actualMw: p.actual_mw,
      errorMw: p.error_mw,
      absErrorMw: p.abs_error_mw,
      raw: p
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload.raw as SettlementPeriodRecord;
      return (
        <div className="bg-[#0B132B] border border-[#203055] rounded-lg p-3.5 shadow-xl text-xs space-y-2 min-w-[220px]">
          <div className="border-b border-[#1E2D4E] pb-1.5 flex justify-between items-center">
            <span className="font-bold text-white">Settlement Period {p.settlement_period}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {p.start_time.substring(11, 16)} - {p.end_time.substring(11, 16)} UTC
            </span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-slate-400">Forecast Wind:</span>
              <span className="font-bold">{p.forecast_mw !== null ? `${p.forecast_mw.toLocaleString()} MW (${p.forecast_mwh?.toLocaleString()} MWh)` : 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center text-cyan-400">
              <span className="text-slate-400">Actual Outturn:</span>
              <span className="font-bold">{p.actual_mw !== null ? `${p.actual_mw.toLocaleString()} MW (${p.actual_mwh?.toLocaleString()} MWh)` : 'Unavailable'}</span>
            </div>

            {p.error_mw !== null && (
              <div className={`flex justify-between items-center pt-1 border-t border-[#1E2D4E] font-bold ${p.error_mw > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                <span className="text-slate-400 font-normal">Signed Error (F-A):</span>
                <span>{p.error_mw > 0 ? `+${p.error_mw.toLocaleString()}` : p.error_mw.toLocaleString()} MW</span>
              </div>
            )}

            {p.percentage_error !== null && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Absolute Error %:</span>
                <span>{p.percentage_error}%</span>
              </div>
            )}
          </div>

          {p.publish_time && (
            <div className="pt-1.5 border-t border-[#1E2D4E] text-[10px] text-slate-400">
              Vintage Published: <span className="font-mono text-slate-300">{p.publish_time.replace('T', ' ').substring(0, 19)} UTC</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart Card */}
      <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5">
        {/* Header & Series Toggles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <span>National Wind Forecast vs Actual Generation</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (MW Power / 30-min Intervals)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cutoff applied: <span className="text-slate-200 font-semibold">{overview?.cutoff_applied}</span>
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center space-x-2 bg-[#0B1120] border border-[#203055] p-1 rounded-md text-xs">
            <button
              onClick={() => setShowForecast(!showForecast)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                showForecast
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Forecast MW
            </button>
            <button
              onClick={() => setShowActual(!showActual)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                showActual
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Actual MW
            </button>
            <button
              onClick={() => setShowError(!showError)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                showError
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Signed Error (F-A)
            </button>
          </div>
        </div>

        {/* Time-Series Chart */}
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  setSelectedPeriod(e.activePayload[0].payload.raw);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4E" vertical={false} />
              
              <XAxis 
                dataKey="shortLabel" 
                stroke="#64748B" 
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                interval={3}
                tickLine={{ stroke: '#203055' }}
              />

              <YAxis
                yAxisId="left"
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                domain={[0, 'auto']}
                label={{ value: 'Generation (MW)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 10 }}
              />

              {showError && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`}
                  label={{ value: 'Error (MW)', angle: 90, position: 'insideRight', fill: '#94A3B8', fontSize: 10 }}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={30} 
                iconSize={10}
                wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
              />

              <ReferenceLine yAxisId="left" y={0} stroke="#203055" />
              {showError && <ReferenceLine yAxisId="right" y={0} stroke="#334155" strokeDasharray="2 2" />}

              {showError && (
                <Bar 
                  yAxisId="right" 
                  dataKey="errorMw" 
                  name="Forecast Error (MW)" 
                  maxBarSize={12}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={(entry.errorMw || 0) >= 0 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(239, 68, 68, 0.45)'}
                    />
                  ))}
                </Bar>
              )}

              {showForecast && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="forecastMw"
                  name="Forecast Wind (MW)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#10B981', stroke: '#0B132B', strokeWidth: 2 }}
                />
              )}

              {showActual && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="actualMw"
                  name="Actual Wind Outturn (MW)"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#06B6D4', stroke: '#0B132B', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Explanations */}
        <div className="mt-4 pt-3 border-t border-[#1E2D4E] flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Forecast Wind Power (MW)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Actual Outturn (FUELHH)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400/60" />
              <span>Overforecast Error (Short risk)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-400/60" />
              <span>Underforecast Error (Spill risk)</span>
            </span>
          </div>

          <div className="text-slate-400 italic">
            Tip: Click any interval on the chart to inspect period metrics below
          </div>
        </div>
      </div>

      {/* Selected Period Inspector Card */}
      {selectedPeriod && (
        <div className="bg-[#131E36] border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1E2D4E]">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">
                Interval Inspector: Settlement Period {selectedPeriod.settlement_period}
              </span>
              <span className="text-xs text-cyan-300 font-mono">
                {selectedPeriod.start_time.substring(11, 16)} to {selectedPeriod.end_time.substring(11, 16)} UTC
              </span>
            </div>
            <button
              onClick={() => setSelectedPeriod(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs font-mono">
            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">Forecast Power</span>
              <span className="text-sm font-bold text-emerald-400">{selectedPeriod.forecast_mw?.toLocaleString()} MW</span>
            </div>

            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">Forecast Energy</span>
              <span className="text-sm font-bold text-emerald-400">{selectedPeriod.forecast_mwh?.toLocaleString()} MWh</span>
            </div>

            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">Actual Power</span>
              <span className="text-sm font-bold text-cyan-400">{selectedPeriod.actual_mw?.toLocaleString()} MW</span>
            </div>

            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">Actual Energy</span>
              <span className="text-sm font-bold text-cyan-400">{selectedPeriod.actual_mwh?.toLocaleString()} MWh</span>
            </div>

            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">Signed Error</span>
              <span className={`text-sm font-bold ${(selectedPeriod.error_mw || 0) >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {selectedPeriod.error_mw ? `${selectedPeriod.error_mw > 0 ? '+' : ''}${selectedPeriod.error_mw} MW` : 'N/A'}
              </span>
            </div>

            <div className="bg-[#0D1527] p-2.5 rounded border border-[#1E2D4E]">
              <span className="text-[10px] text-slate-400 block uppercase">Publication Time</span>
              <span className="text-[11px] font-bold text-slate-300 truncate block">
                {selectedPeriod.publish_time ? selectedPeriod.publish_time.replace('T', ' ').substring(0, 16) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
