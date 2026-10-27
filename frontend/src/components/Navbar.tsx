import React from 'react';
import { 
  Wind, 
  Calendar, 
  Clock, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  History,
  Target,
  ShoppingCart,
  Table,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedCutoff: string;
  onCutoffChange: (cutoff: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  dataSource: string;
  isLive: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedDate,
  onDateChange,
  selectedCutoff,
  onCutoffChange,
  activeTab,
  onTabChange,
  dataSource,
  isLive,
  onRefresh,
  isRefreshing
}) => {
  // Navigation for day shift within January 2026 (1 to 31)
  const currentDayNum = parseInt(selectedDate.split('-')[2], 10);

  const handlePrevDay = () => {
    if (currentDayNum > 1) {
      const nextDay = String(currentDayNum - 1).padStart(2, '0');
      onDateChange(`2026-01-${nextDay}`);
    }
  };

  const handleNextDay = () => {
    if (currentDayNum < 31) {
      const nextDay = String(currentDayNum + 1).padStart(2, '0');
      onDateChange(`2026-01-${nextDay}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4 mr-1.5" /> },
    { id: 'chart', label: 'Forecast vs Actual', icon: <Wind className="w-4 h-4 mr-1.5" /> },
    { id: 'vintages', label: 'Forecast History', icon: <History className="w-4 h-4 mr-1.5" /> },
    { id: 'accuracy', label: 'Quantitative Accuracy', icon: <Target className="w-4 h-4 mr-1.5" /> },
    { id: 'procurement', label: 'Procurement Support', icon: <ShoppingCart className="w-4 h-4 mr-1.5" /> },
    { id: 'table', label: 'Settlement Table', icon: <Table className="w-4 h-4 mr-1.5" /> },
    { id: 'quality', label: 'Data Quality', icon: <ShieldCheck className="w-4 h-4 mr-1.5" /> },
  ];

  return (
    <header className="bg-[#0D1527] border-b border-[#1E2D4E] sticky top-0 z-50 shadow-md">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Wind className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">WindScope</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                UK Trading Desk
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Elexon BMRS Forecast Intelligence</p>
          </div>
        </div>

        {/* Global Selectors: Date & Cutoff */}
        <div className="flex items-center space-x-3">
          {/* Day Navigation */}
          <div className="flex items-center bg-[#131E36] border border-[#203055] rounded-md p-1 shadow-inner">
            <button
              onClick={handlePrevDay}
              disabled={currentDayNum <= 1}
              className="p-1 hover:bg-[#1C2B4D] rounded text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Delivery Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              >
                {Array.from({ length: 31 }, (_, i) => {
                  const day = String(i + 1).padStart(2, '0');
                  const val = `2026-01-${day}`;
                  return (
                    <option key={val} value={val} className="bg-[#131E36] text-white">
                      {val} ({i + 1} Jan 2026)
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleNextDay}
              disabled={currentDayNum >= 31}
              className="p-1 hover:bg-[#1C2B4D] rounded text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Delivery Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Decision Cutoff Selector */}
          <div className="flex items-center bg-[#131E36] border border-[#203055] rounded-md px-2.5 py-1.5 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400 mr-2" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400 leading-none">Decision Cutoff</span>
              <select
                value={selectedCutoff}
                onChange={(e) => onCutoffChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="D-1_12:00" className="bg-[#131E36] text-white">
                  D-1 12:00 London (GB Day-Ahead Gate Closure)
                </option>
                <option value="D-1_09:00" className="bg-[#131E36] text-white">
                  D-1 09:00 London (Morning Trading Run)
                </option>
                <option value="D-1_15:30" className="bg-[#131E36] text-white">
                  D-1 15:30 London (EPEX 30m Gate Closure)
                </option>
                <option value="D-1_17:00" className="bg-[#131E36] text-white">
                  D-1 17:00 London (Evening Schedule)
                </option>
                <option value="D-1_23:00" className="bg-[#131E36] text-white">
                  D-1 23:00 London (End of D-1)
                </option>
                <option value="latest" className="bg-[#131E36] text-white">
                  Latest Intra-day (Post-Cutoff Horizon)
                </option>
              </select>
            </div>
          </div>

          {/* Data Provenance Badge & Refresh */}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#1E2D4E]">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#131E36] border border-[#203055] text-xs">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
              <span className="text-slate-300 text-[11px] font-medium">{dataSource}</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded bg-[#131E36] hover:bg-[#1C2B4D] border border-[#203055] text-slate-300 hover:text-white transition-colors"
              title="Refresh Elexon Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-[#0B1120] border-t border-[#19243C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1E2D4E] text-white border border-[#2A3E6E] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131E36]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
