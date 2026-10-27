import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { KPICard } from '../components/KPICard';
import { Navbar } from '../components/Navbar';
import { SettlementTableTab } from '../components/tabs/SettlementTableTab';
import { getCsvExportUrl } from '../services/api';
import type { SettlementPeriodRecord } from '../types';

describe('Frontend UI Components', () => {
  it('renders KPICard with value, unit, and badge correctly', () => {
    render(
      <KPICard
        title="Mean Absolute Error"
        value="1,420"
        unit="MW"
        badge="Lower is better"
        badgeColor="emerald"
        subtext="RMSE: 1,890 MW"
      />
    );

    expect(screen.getByText('Mean Absolute Error')).toBeInTheDocument();
    expect(screen.getByText('1,420')).toBeInTheDocument();
    expect(screen.getByText('MW')).toBeInTheDocument();
    expect(screen.getByText('Lower is better')).toBeInTheDocument();
    expect(screen.getByText('RMSE: 1,890 MW')).toBeInTheDocument();
  });

  it('renders Navbar with branding and calls onDateChange when selected', () => {
    const onDateChange = vi.fn();
    const onCutoffChange = vi.fn();
    const onTabChange = vi.fn();
    const onRefresh = vi.fn();

    render(
      <Navbar
        selectedDate="2026-01-01"
        onDateChange={onDateChange}
        selectedCutoff="D-1_12:00"
        onCutoffChange={onCutoffChange}
        activeTab="overview"
        onTabChange={onTabChange}
        dataSource="Cached Elexon Store"
        isLive={false}
        onRefresh={onRefresh}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('WindScope')).toBeInTheDocument();
    expect(screen.getByText('UK Trading Desk')).toBeInTheDocument();
    expect(screen.getByText('Cached Elexon Store')).toBeInTheDocument();

    // Next day button
    const nextBtn = screen.getByTitle('Next Delivery Day');
    fireEvent.click(nextBtn);
    expect(onDateChange).toHaveBeenCalledWith('2026-01-02');
  });

  it('generates proper CSV export URL with date and cutoff', () => {
    const url = getCsvExportUrl('2026-01-15', 'D-1_12:00', 'Matched');
    expect(url).toContain('/api/v1/settlement-periods/export-csv');
    expect(url).toContain('date=2026-01-15');
    expect(url).toContain('cutoff=D-1_12%3A00');
    expect(url).toContain('status=Matched');
  });

  it('filters settlement periods in SettlementTableTab when user types in search', () => {
    const mockPeriods: SettlementPeriodRecord[] = [
      {
        settlement_period: 1,
        start_time: '2026-01-01T00:00:00Z',
        end_time: '2026-01-01T00:30:00Z',
        delivery_date: '2026-01-01',
        forecast_mw: 5000,
        actual_mw: 4800,
        forecast_mwh: 2500,
        actual_mwh: 2400,
        error_mw: 200,
        abs_error_mw: 200,
        percentage_error: 4.17,
        publish_time: '2025-12-31T11:30:00Z',
        lead_time_hours: 12.5,
        status: 'Matched'
      },
      {
        settlement_period: 25,
        start_time: '2026-01-01T12:00:00Z',
        end_time: '2026-01-01T12:30:00Z',
        delivery_date: '2026-01-01',
        forecast_mw: 8000,
        actual_mw: 7500,
        forecast_mwh: 4000,
        actual_mwh: 3750,
        error_mw: 500,
        abs_error_mw: 500,
        percentage_error: 6.67,
        publish_time: '2025-12-31T11:30:00Z',
        lead_time_hours: 24.5,
        status: 'Matched'
      }
    ];

    render(
      <SettlementTableTab
        deliveryDate="2026-01-01"
        selectedCutoff="D-1_12:00"
        periods={mockPeriods}
      />
    );

    expect(screen.getByText('SP1')).toBeInTheDocument();
    expect(screen.getByText('SP25')).toBeInTheDocument();

    // Type search
    const searchInput = screen.getByPlaceholderText(/Search by SP or time/i);
    fireEvent.change(searchInput, { target: { value: '25' } });

    expect(screen.queryByText('SP1')).not.toBeInTheDocument();
    expect(screen.getByText('SP25')).toBeInTheDocument();
  });
});
