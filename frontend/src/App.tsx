import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ForecastChartTab } from './components/tabs/ForecastChartTab';
import { VintagesTab } from './components/tabs/VintagesTab';
import { AccuracyTab } from './components/tabs/AccuracyTab';
import { ProcurementTab } from './components/tabs/ProcurementTab';
import { SettlementTableTab } from './components/tabs/SettlementTableTab';
import { DataQualityTab } from './components/tabs/DataQualityTab';
import {
  fetchForecasts,
  fetchMonthOverview,
  fetchVintages,
  fetchAccuracy,
  fetchDataQuality,
  triggerRefresh
} from './services/api';
import type {
  ForecastTimeSeriesResponse,
  OverviewMonthResponse,
  VintageDetailResponse,
  AccuracyEvaluationResponse,
  DataQualityResponse
} from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-01');
  const [selectedCutoff, setSelectedCutoff] = useState<string>('D-1_12:00');
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [forecastData, setForecastData] = useState<ForecastTimeSeriesResponse | null>(null);
  const [monthOverview, setMonthOverview] = useState<OverviewMonthResponse | null>(null);
  const [vintagesData, setVintagesData] = useState<VintageDetailResponse | null>(null);
  const [accuracyData, setAccuracyData] = useState<AccuracyEvaluationResponse | null>(null);
  const [qualityData, setQualityData] = useState<DataQualityResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load primary data whenever date or cutoff changes
  useEffect(() => {
    let isMounted = true;

    async function loadAllData() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [fcRes, monthRes, vintRes, accRes, qualRes] = await Promise.all([
          fetchForecasts(selectedDate, selectedCutoff),
          fetchMonthOverview(selectedCutoff),
          fetchVintages(selectedDate, selectedCutoff),
          fetchAccuracy(selectedDate, selectedCutoff),
          fetchDataQuality()
        ]);

        if (isMounted) {
          setForecastData(fcRes);
          setMonthOverview(monthRes);
          setVintagesData(vintRes);
          setAccuracyData(accRes);
          setQualityData(qualRes);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load market data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAllData();
    return () => { isMounted = false; };
  }, [selectedDate, selectedCutoff]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerRefresh();
      // Reload current views
      const [fcRes, monthRes, vintRes, accRes, qualRes] = await Promise.all([
        fetchForecasts(selectedDate, selectedCutoff),
        fetchMonthOverview(selectedCutoff),
        fetchVintages(selectedDate, selectedCutoff),
        fetchAccuracy(selectedDate, selectedCutoff),
        fetchDataQuality()
      ]);
      setForecastData(fcRes);
      setMonthOverview(monthRes);
      setVintagesData(vintRes);
      setAccuracyData(accRes);
      setQualityData(qualRes);
    } catch (err: any) {
      alert(`Refresh failed: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedCutoff={selectedCutoff}
        onCutoffChange={setSelectedCutoff}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dataSource={qualityData ? qualityData.data_source : 'Cached Elexon Store'}
        isLive={qualityData ? qualityData.is_live : false}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-200 text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setSelectedDate('2026-01-01')}
              className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-semibold"
            >
              Reset to Jan 1
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
            <span className="text-sm font-semibold text-slate-400 tracking-wide font-mono">
              Loading UK Wind Forecast Intelligence...
            </span>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && (
              <OverviewTab
                overview={forecastData?.overview || null}
                monthOverview={monthOverview}
                onSelectDate={setSelectedDate}
              />
            )}

            {activeTab === 'chart' && (
              <ForecastChartTab
                overview={forecastData?.overview || null}
                periods={forecastData?.periods || []}
              />
            )}

            {activeTab === 'vintages' && (
              <VintagesTab vintagesData={vintagesData} />
            )}

            {activeTab === 'accuracy' && (
              <AccuracyTab accuracyData={accuracyData} />
            )}

            {activeTab === 'procurement' && (
              <ProcurementTab deliveryDate={selectedDate} />
            )}

            {activeTab === 'table' && (
              <SettlementTableTab
                deliveryDate={selectedDate}
                selectedCutoff={selectedCutoff}
                periods={forecastData?.periods || []}
              />
            )}

            {activeTab === 'quality' && (
              <DataQualityTab quality={qualityData} />
            )}
          </div>
        )}
      </main>

      {/* Institutional Trading Footer */}
      <footer className="bg-[#090E1A] border-t border-[#19243C] py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
          <div>
            <span className="text-slate-400 font-bold">WindScope</span> — UK Wind Forecast Intelligence & Day-Ahead Trading Analytics
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Data: Elexon BMRS API (FUELHH & WINDFOR)</span>
            <span>•</span>
            <span>Evaluation: January 2026 (1,488 Settlement Periods)</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">100% Verified Outturn</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
