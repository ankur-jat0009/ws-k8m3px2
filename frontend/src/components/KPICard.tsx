import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';
  icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtext,
  badge,
  badgeColor = 'slate',
  icon
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    slate: 'bg-slate-700/30 text-slate-400 border-slate-700/50',
  }[badgeColor];

  return (
    <div className="bg-[#131E36] border border-[#203055] rounded-lg p-4 flex flex-col justify-between hover:border-[#2A4070] transition-colors shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>

      <div className="flex items-baseline space-x-1.5 my-1">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1C2B4D] text-xs">
        {subtext ? <span className="text-slate-400 truncate">{subtext}</span> : <div />}
        {badge && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
