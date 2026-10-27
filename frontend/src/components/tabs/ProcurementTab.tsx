import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import type { ProcurementSupportResponse } from '../../types';
import { fetchProcurementDecision } from '../../services/api';
import { KPICard } from '../KPICard';
import { ShoppingCart, Sliders, ShieldAlert, Zap, Layers } from 'lucide-react';

interface ProcurementTabProps {
  deliveryDate: string;
}

export const ProcurementTab: React.FC<ProcurementTabProps> = ({ deliveryDate }) => {
  const [demandMw, setDemandMw] = useState<number>(35000);
  const [profileType, setProfileType] = useState<string>('diurnal_standard');
  const [uncertaintySigma, setUncertaintySigma] = useState<number>(1.0);
  const [data, setData] = useState<ProcurementSupportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchProcurementDecision(deliveryDate, demandMw, profileType, uncertaintySigma);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to calculate residual demand:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [deliveryDate, demandMw, profileType, uncertaintySigma]);

  if (!data && loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        Calculating residual demand model...
      </div>
    );
  }

  const chartData = data?.periods.map((p) => ({
    period: p.settlement_period,
    shortLabel: p.start_time.substring(11, 16),
    assumedDemandMw: p.assumed_demand_mw,
    forecastWindMw: p.forecast_wind_mw,
    residualDemandMw: p.residual_demand_mw,
    residualWithBufferMw: p.residual_with_buffer_mw,
    raw: p
  })) || [];

  return (
    <div className="space-y-6">
      {/* Scope Disclaimer Banner (Non-negotiable requirement) */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-amber-200 leading-relaxed">
          <strong className="text-amber-300 uppercase tracking-wide block mb-0.5">
            Illustrative Procurement Decision Support Only
          </strong>
          This model calculates the theoretical national wind generation shortfall: <code className="bg-[#0B1120] px-1 py-0.5 rounded font-mono text-white">Residual Demand = User Assumed Demand - Forecast Wind</code>.
          It does <strong>not</strong> represent a utility's total commercial procurement requirement, because it excludes utility PPA portfolio shares, retail customer consumption curves, solar generation, thermal plant availability, interconnector flows, transmission constraints, and Balancing Mechanism cash-out exposure.
        </div>
      </div>

      {/* Interactive Controls & Scenario Modeler */}
      <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5">
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-[#1E2D4E]">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Procurement Scenario Assumptions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Assumed Demand Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-300 font-semibold">Assumed Base Demand:</span>
              <span className="font-mono font-bold text-emerald-400">{demandMw.toLocaleString()} MW</span>
            </div>
            <input
              type="range"
              min="20000"
              max="50000"
              step="500"
              value={demandMw}
              onChange={(e) => setDemandMw(Number(e.target.value))}
              className="w-full h-1.5 bg-[#0D1527] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>20 GW (Summer Night)</span>
              <span>35 GW (Normal Peak)</span>
              <span>50 GW (Extreme Cold)</span>
            </div>
          </div>

          {/* Demand Profile Selector */}
          <div>
            <span className="text-slate-300 font-semibold text-xs block mb-1">Diurnal Load Profile:</span>
            <select
              value={profileType}
              onChange={(e) => setProfileType(e.target.value)}
              className="w-full bg-[#0D1527] border border-[#203055] text-xs font-semibold text-white rounded p-2 focus:outline-none cursor-pointer"
            >
              <option value="diurnal_standard">Diurnal Standard (Morning & Evening Peaks)</option>
              <option value="flat">Flat Demand Profile (Continuous 24h)</option>
              <option value="industrial">Industrial Profile (High Day / Low Night)</option>
            </select>
            <span className="text-[10px] text-slate-500 block mt-1">
              Applies standard UK national diurnal weighting factors.
            </span>
          </div>

          {/* Uncertainty Buffer Multiplier (Derived from Historical RMSE) */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-300 font-semibold">Uncertainty Buffer (k × RMSE):</span>
              <span className="font-mono font-bold text-cyan-400">
                {uncertaintySigma}σ (+{data ? data.periods[0]?.buffer_mw.toLocaleString() : 0} MW)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.25"
              value={uncertaintySigma}
              onChange={(e) => setUncertaintySigma(Number(e.target.value))}
              className="w-full h-1.5 bg-[#0D1527] rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0σ (No buffer)</span>
              <span>1.0σ (~68% margin)</span>
              <span>1.96σ (~95% margin)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Peak Residual Demand"
            value={data.peak_residual_mw.toLocaleString()}
            unit="MW"
            subtext="Maximum thermal/import capacity required"
            badge="Peak Thermal Need"
            badgeColor="amber"
            icon={<Zap className="w-4 h-4 text-amber-400" />}
          />

          <KPICard
            title="Min Residual Demand"
            value={data.min_residual_mw.toLocaleString()}
            unit="MW"
            subtext="Trough non-wind demand"
            badge={data.min_residual_mw < 0 ? 'Surplus Wind Risk' : 'Positive Base'}
            badgeColor={data.min_residual_mw < 0 ? 'rose' : 'cyan'}
            icon={<Layers className="w-4 h-4 text-cyan-400" />}
          />

          <KPICard
            title="Residual Daily Energy"
            value={data.total_residual_mwh.toLocaleString()}
            unit="MWh"
            subtext="Net energy required from non-wind assets"
            badge="Day-Ahead Volume"
            badgeColor="emerald"
            icon={<ShoppingCart className="w-4 h-4 text-emerald-400" />}
          />

          <KPICard
            title="Uncertainty Buffer"
            value={`+${data.periods[0]?.buffer_mw.toLocaleString()}`}
            unit="MW"
            subtext={`Historical RMSE: ${data.historical_rmse_mw.toLocaleString()} MW`}
            badge="Statistical Reserve"
            badgeColor="slate"
            icon={<ShieldAlert className="w-4 h-4 text-slate-300" />}
          />
        </div>
      )}

      {/* Residual Demand Curve Chart */}
      <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Illustrative Residual Demand & Ramping Curve</span>
          <span className="text-[11px] text-slate-400 font-mono font-normal">
            Residual Demand = Assumed Demand - Forecast Wind
          </span>
        </h4>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4E" vertical={false} />
              
              <XAxis 
                dataKey="shortLabel" 
                stroke="#64748B" 
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                interval={3}
              />

              <YAxis
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                label={{ value: 'MW Power', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 10 }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#0B132B] border border-[#203055] rounded p-3 text-xs font-mono space-y-1 text-slate-300">
                        <div className="text-white font-bold mb-1">SP{item.period} ({item.shortLabel} UTC)</div>
                        <div>Assumed Demand: <strong className="text-slate-200">{item.assumedDemandMw.toLocaleString()} MW</strong></div>
                        <div>Forecast Wind: <strong className="text-emerald-400">{item.forecastWindMw.toLocaleString()} MW</strong></div>
                        <div className="pt-1 border-t border-[#1E2D4E] text-amber-400 font-bold">
                          Residual Demand: {item.residualDemandMw.toLocaleString()} MW
                        </div>
                        {uncertaintySigma > 0 && (
                          <div className="text-cyan-400">
                            With Uncertainty Buffer: {item.residualWithBufferMw.toLocaleString()} MW
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />

              <Line
                type="monotone"
                dataKey="assumedDemandMw"
                name="Assumed Demand (MW)"
                stroke="#64748B"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />

              <Area
                type="monotone"
                dataKey="forecastWindMw"
                name="Forecast Wind (MW)"
                fill="#10B981"
                fillOpacity={0.15}
                stroke="#10B981"
                strokeWidth={2}
              />

              <Line
                type="monotone"
                dataKey="residualDemandMw"
                name="Residual Demand (MW)"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={false}
              />

              {uncertaintySigma > 0 && (
                <Line
                  type="monotone"
                  dataKey="residualWithBufferMw"
                  name="Residual + Uncertainty Buffer (MW)"
                  stroke="#06B6D4"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
