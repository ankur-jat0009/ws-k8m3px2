import React, { useState } from 'react';
import type { SettlementPeriodRecord } from '../../types';
import { getCsvExportUrl } from '../../services/api';
import { Download, Search, Filter, ArrowUpDown } from 'lucide-react';

interface SettlementTableTabProps {
  deliveryDate: string;
  selectedCutoff: string;
  periods: SettlementPeriodRecord[];
}

export const SettlementTableTab: React.FC<SettlementTableTabProps> = ({
  deliveryDate,
  selectedCutoff,
  periods
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<keyof SettlementPeriodRecord>('settlement_period');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  const handleSort = (field: keyof SettlementPeriodRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter
  const filtered = periods.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.settlement_period.toString().includes(searchTerm) ||
      p.start_time.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (valA === null || valA === undefined) return sortAsc ? 1 : -1;
    if (valB === null || valB === undefined) return sortAsc ? -1 : 1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const csvUrl = getCsvExportUrl(deliveryDate, selectedCutoff, statusFilter !== 'ALL' ? statusFilter : undefined);

  return (
    <div className="bg-[#131E36] border border-[#203055] rounded-lg p-5 space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by SP or time (e.g. '12' or '14:30')..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#0D1527] border border-[#203055] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#0D1527] border border-[#203055] text-xs font-semibold text-white rounded py-1.5 px-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Matched">Matched</option>
              <option value="Missing Forecast">Missing Forecast</option>
              <option value="Missing Actual">Missing Actual</option>
            </select>
          </div>
        </div>

        {/* CSV Export Button */}
        <div>
          <a
            href={csvUrl}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#203055] rounded-md">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-[#0D1527] text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th onClick={() => handleSort('settlement_period')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <div className="flex items-center space-x-1">
                  <span>SP</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th onClick={() => handleSort('start_time')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <div className="flex items-center space-x-1">
                  <span>UTC Interval</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th onClick={() => handleSort('forecast_mw')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th onClick={() => handleSort('actual_mw')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th onClick={() => handleSort('forecast_mwh')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end space-x-1">
                  <span>Fc (MWh)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th onClick={() => handleSort('actual_mwh')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end space-x-1">
                  <span>Act (MWh)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th onClick={() => handleSort('error_mw')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end space-x-1">
                  <span>Error (MW)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th onClick={() => handleSort('percentage_error')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                <div className="flex items-center justify-end space-x-1">
                  <span>Abs Err %</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Publication Time</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2B4D]">
            {paginated.length > 0 ? (
              paginated.map((p) => {
                const err = p.error_mw;
                const isOver = (err || 0) > 0;
                return (
                  <tr key={p.settlement_period} className="hover:bg-[#182645] transition-colors">
                    <td className="py-2 px-3 font-bold text-white">SP{p.settlement_period}</td>
                    <td className="py-2 px-3 text-slate-400">
                      {p.start_time.substring(11, 16)} - {p.end_time.substring(11, 16)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                      {p.forecast_mw !== null ? p.forecast_mw.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-400 font-bold">
                      {p.actual_mw !== null ? p.actual_mw.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-300">
                      {p.forecast_mwh !== null ? p.forecast_mwh.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-300">
                      {p.actual_mwh !== null ? p.actual_mwh.toLocaleString() : '-'}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${err !== null ? (isOver ? 'text-amber-400' : 'text-rose-400') : 'text-slate-500'}`}>
                      {err !== null ? `${err > 0 ? '+' : ''}${err.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {p.percentage_error !== null ? `${p.percentage_error}%` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400 text-[11px]">
                      {p.publish_time ? p.publish_time.replace('T', ' ').substring(0, 16) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        p.status === 'Matched'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-400">
                  No records match the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-mono">
        <div>
          Showing {paginated.length} of {sorted.length} settlement periods
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded bg-[#0D1527] border border-[#203055] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C2B4D]"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded bg-[#0D1527] border border-[#203055] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C2B4D]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
