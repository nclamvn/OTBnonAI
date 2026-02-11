'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronDown, Plus, Search, Table, PieChart, X, Filter, Eye, Split,
  Wallet, CircleCheckBig, Hourglass
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils/formatters';
import { budgetService, masterDataService } from '../../../services';
import { LoadingSpinner, ErrorMessage, EmptyState, ExpandableStatCard } from '../../../components/ui';
import { MobileList, FilterChips, FloatingActionButton, PullToRefresh, FilterBottomSheet, useBottomSheet } from '@/components/mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

const YEARS = [2023, 2024, 2025, 2026];

const CARD_ACCENTS = {
  total:     { color: '#D7B797', darkGrad: 'rgba(215,183,151,0.06)', lightGrad: 'rgba(180,140,95,0.25)', iconDark: 'rgba(215,183,151,0.07)', iconLight: 'rgba(160,120,75,0.20)' },
  allocated: { color: '#2A9E6A', darkGrad: 'rgba(42,158,106,0.06)',  lightGrad: 'rgba(22,120,70,0.20)',  iconDark: 'rgba(42,158,106,0.07)', iconLight: 'rgba(22,120,70,0.18)' },
  remaining: { color: '#E3B341', darkGrad: 'rgba(227,179,65,0.06)',  lightGrad: 'rgba(200,150,30,0.22)', iconDark: 'rgba(227,179,65,0.07)', iconLight: 'rgba(180,130,20,0.18)' },
};

const BudgetManagementScreen = ({
  selectedYear,
  setSelectedYear,
  selectedGroupBrand,
  setSelectedGroupBrand,
  selectedBrand,
  setSelectedBrand,
  onAllocate,
  darkMode = false
}: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});

  // API state
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // Master data for create form
  const [apiBrands, setApiBrands] = useState<any[]>([]);
  const [apiStores, setApiStores] = useState<any[]>([]);

  // Derived brand list and group categories from API
  const brandList = useMemo(() => apiBrands.map((b: any) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    groupId: b.groupId || 'A',
    color: b.colorConfig?.gradient || 'from-gray-400 to-gray-600',
  })), [apiBrands]);

  const groupBrandCategories = useMemo(() => {
    const groups: Record<string, any> = {};
    brandList.forEach((b: any) => {
      const gid = b.groupId || 'A';
      if (!groups[gid]) groups[gid] = { id: gid, name: `Group ${gid}` };
    });
    return Object.values(groups).sort((a, b) => a.id.localeCompare(b.id));
  }, [brandList]);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, any> = {};
      if (selectedYear) filters.fiscalYear = selectedYear;
      if (selectedBrand) filters.brandId = selectedBrand;

      const response = await budgetService.getAll(filters);
      // Map API response to UI format
      const budgets = (response.data || response || []).map((budget: any) => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
        brandId: budget.groupBrandId || budget.brandId,
        brandName: budget.groupBrand?.name || budget.Brand?.name || budget.brandName || 'Unknown',
        totalBudget: Number(budget.totalBudget || budget.totalAmount) || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || 'Untitled',
        status: (budget.status || 'DRAFT').toLowerCase(),
        createdAt: budget.createdAt,
        createdBy: budget.createdBy
      }));
      setBudgetData(budgets);
    } catch (err: any) {
      console.error('Failed to fetch budgets:', err);
      setError(t('budget.failedToLoadBudgets'));
      setBudgetData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedBrand]);

  // Initial fetch
  useEffect(() => {
    fetchBudgets();
    // Fetch master data for create form
    masterDataService.getBrands().then(b => setApiBrands(Array.isArray(b) ? b : [])).catch(() => {});
    masterDataService.getStores().then(s => {
      const all = Array.isArray(s) ? s : [];
      // Only show REX and TTP stores
      const filtered = all.filter((st: any) => {
        const code = (st.code || st.name || '').toUpperCase();
        return code === 'REX' || code === 'TTP';
      });
      setApiStores(filtered.length > 0 ? filtered : all.slice(0, 2));
    }).catch(() => {});
  }, [fetchBudgets]);

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currency, setCurrency] = useState<any>('VND'); // VND or USD

  // Dropdown states
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [groupBrandDropdownOpen, setGroupBrandDropdownOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Form state for create budget
  const [newBudgetForm, setNewBudgetForm] = useState({
    fiscalYear: 2026,
    groupBrand: 'A',
    brandId: '',
    seasonGroup: 'SS',
    seasonType: 'pre',
    name: '',
    totalBudget: '',
    description: ''
  });

  // Filter budgets
  const filteredBudgets = useMemo(() => {
    return budgetData.filter((budget: any) => {
      if (selectedYear && budget.fiscalYear !== selectedYear) return false;
      if (selectedGroupBrand && budget.groupBrand !== selectedGroupBrand) return false;
      if (selectedBrand && budget.brandId !== selectedBrand) return false;
      if (searchQuery && !budget.budgetName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [budgetData, selectedYear, selectedGroupBrand, selectedBrand, searchQuery]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = budgetData.reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const approved = budgetData.filter((b: any) => b.status === 'approved').reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const pending = budgetData.filter((b: any) => b.status === 'pending').reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const draft = budgetData.filter((b: any) => b.status === 'draft').reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const remaining = total - approved;

    // Group by brand for breakdown
    const byBrand: Record<string, any> = {};
    budgetData.forEach((b: any) => {
      const name = b.brandName || b.groupBrand || 'Other';
      byBrand[name] = (byBrand[name] || 0) + (Number(b.totalBudget) || 0);
    });
    const brandBreakdown = Object.entries(byBrand)
      .map(([label, value]) => ({ label, value, displayValue: formatCurrency(value, { currency }), pct: total > 0 ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value);

    // Status counts
    const statusCounts: Record<string, number> = { approved: 0, pending: 0, draft: 0 };
    budgetData.forEach((b: any) => {
      const s = b.status || 'draft';
      if (statusCounts[s] !== undefined) statusCounts[s]++;
    });

    return {
      total,
      approved,
      pending,
      draft,
      remaining,
      count: budgetData.length,
      approvedPct: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
      pendingPct: total > 0 ? ((pending / total) * 100).toFixed(1) : 0,
      remainingPct: total > 0 ? ((remaining / total) * 100).toFixed(1) : 0,
      brandBreakdown,
      statusCounts,
    };
  }, [budgetData, currency]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedYear(null);
    setSelectedGroupBrand(null);
    setSelectedBrand(null);
    setSearchQuery('');
  };

  const DetailRow = ({ label, value, strong }: any) => (
  <div className="flex justify-between gap-4">
    <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>{label}</span>
    <span className={`text-right ${strong ? 'font-semibold text-[#2A9E6A] font-[\'JetBrains_Mono\']' : ''}`}>
      {value}
    </span>
  </div>
);


  const hasActiveFilters = selectedYear || selectedGroupBrand || selectedBrand || searchQuery;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner darkMode={darkMode} size="lg" message={t('budget.loadingBudgets')} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorMessage darkMode={darkMode} message={error} onRetry={fetchBudgets} />
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Filters Section */}
      <div className={`rounded-lg shadow-sm border px-2 md:px-3 py-0.5 ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter size={14} className={`shrink-0 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`} />
          <span className={`text-xs font-medium font-['Montserrat'] shrink-0 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('budget.filters')}</span>
          <div className={`h-5 w-px shrink-0 ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#C4B5A5]/50'}`}></div>

          {/* Mobile Filter Button */}
          {isMobile && (
            <button
              onClick={openFilter}
              className={`flex items-center gap-1.5 px-3 py-0.5 border rounded-lg text-xs font-medium ${
                darkMode
                  ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#D7B797]'
                  : 'bg-white border-[#C4B5A5] text-[#6B4D30]'
              }`}
            >
              <Filter size={12} />
              {t('budget.filters')}
              {(selectedYear || selectedGroupBrand || selectedBrand) && (
                <span className="w-2 h-2 rounded-full bg-[#D7B797]" />
              )}
            </button>
          )}

          {/* Desktop Filters */}
          {!isMobile && <>
          {/* Year Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setYearDropdownOpen(!yearDropdownOpen);
                setGroupBrandDropdownOpen(false);
                setBrandDropdownOpen(false);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-0.5 border rounded-lg transition-colors min-w-[110px] ${selectedYear
                ? darkMode
                  ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797]'
                  : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                : darkMode
                  ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)]'
                  : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(215,183,151,0.4)]'
                }`}
            >
              <span className="text-xs font-medium">{selectedYear ? `FY${selectedYear}` : t('budget.allYears')}</span>
              <ChevronDown size={12} className="opacity-50 shrink-0" />
            </button>
            {yearDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg border py-0.5 z-20 min-w-[140px] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                <button
                  onClick={() => { setSelectedYear(null); setYearDropdownOpen(false); }}
                  className={`w-full px-4 py-0.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'} ${!selectedYear ? (darkMode ? 'text-[#D7B797] font-medium' : 'text-[#6B4D30] font-medium') : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}
                >
                  {t('budget.allYears')}
                </button>
                {YEARS.map((year: any) => (
                  <button
                    key={year}
                    onClick={() => { setSelectedYear(year); setYearDropdownOpen(false); }}
                    className={`w-full px-4 py-0.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'} ${selectedYear === year ? (darkMode ? 'text-[#D7B797] font-medium' : 'text-[#6B4D30] font-medium') : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}
                  >
                    FY{year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group Brand Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setGroupBrandDropdownOpen(!groupBrandDropdownOpen);
                setYearDropdownOpen(false);
                setBrandDropdownOpen(false);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-0.5 border rounded-lg transition-colors min-w-[130px] ${selectedGroupBrand
                ? darkMode
                  ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797]'
                  : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                : darkMode
                  ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)]'
                  : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(215,183,151,0.4)]'
                }`}
            >
              <span className="text-xs font-medium">
                {selectedGroupBrand
                  ? groupBrandCategories.find((g: any) => g.id === selectedGroupBrand)?.name
                  : t('budget.allGroupBrands')}
              </span>
              <ChevronDown size={12} className="opacity-50 shrink-0" />
            </button>
            {groupBrandDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg border py-0.5 z-20 min-w-[150px] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                <button
                  onClick={() => { setSelectedGroupBrand(null); setGroupBrandDropdownOpen(false); }}
                  className={`w-full px-4 py-0.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'} ${!selectedGroupBrand ? (darkMode ? 'text-[#D7B797] font-medium' : 'text-[#6B4D30] font-medium') : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}
                >
                  {t('budget.allGroupBrands')}
                </button>
                {groupBrandCategories.map((group: any) => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroupBrand(group.id); setGroupBrandDropdownOpen(false); }}
                    className={`w-full px-4 py-0.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'} ${selectedGroupBrand === group.id ? (darkMode ? 'text-[#D7B797] font-medium' : 'text-[#6B4D30] font-medium') : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setBrandDropdownOpen(!brandDropdownOpen);
                setYearDropdownOpen(false);
                setGroupBrandDropdownOpen(false);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-0.5 border rounded-lg transition-colors min-w-[110px] ${selectedBrand
                ? darkMode
                  ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797]'
                  : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                : darkMode
                  ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)]'
                  : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(215,183,151,0.4)]'
                }`}
            >
              <span className="text-xs font-medium">
                {selectedBrand ? brandList.find((b: any) => b.id === selectedBrand)?.name : t('budget.allBrands')}
              </span>
              <ChevronDown size={12} className="opacity-50 shrink-0" />
            </button>
            {brandDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg border py-0.5 z-20 min-w-[140px] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                <button
                  onClick={() => { setSelectedBrand(null); setBrandDropdownOpen(false); }}
                  className={`w-full px-4 py-0.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'} ${!selectedBrand ? (darkMode ? 'text-[#D7B797] font-medium' : 'text-[#6B4D30] font-medium') : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}
                >
                  {t('budget.allBrands')}
                </button>
                {brandList.map((brand: any) => (
                  <button
                    key={brand.id}
                    onClick={() => { setSelectedBrand(brand.id); setBrandDropdownOpen(false); }}
                    className={`w-full px-4 py-0.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'} ${selectedBrand === brand.id ? (darkMode ? 'text-[#D7B797] font-medium' : 'text-[#6B4D30] font-medium') : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          </>}

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`} />
            <input
              type="text"
              placeholder={t('budget.searchBudgets')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-0.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-transparent ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] placeholder-[#666666]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A] placeholder-[#999999]'}`}
            />
          </div>

          {/* Currency Toggle */}
          <div className={`flex items-center rounded-lg p-1 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F2F2F2]'}`}>
            <button
              onClick={() => setCurrency('VND')}
              className={`px-3 py-0.5 rounded-md text-xs font-semibold font-['JetBrains_Mono'] transition-all ${
                currency === 'VND'
                  ? darkMode
                    ? 'bg-[#D7B797] text-[#0A0A0A] shadow-sm'
                    : 'bg-[#D7B797] text-[#0A0A0A] shadow-sm'
                  : darkMode
                    ? 'text-[#666666] hover:text-[#F2F2F2]'
                    : 'text-[#999999] hover:text-[#0A0A0A]'
              }`}
            >
              VND
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-0.5 rounded-md text-xs font-semibold font-['JetBrains_Mono'] transition-all ${
                currency === 'USD'
                  ? darkMode
                    ? 'bg-[#127749] text-white shadow-sm'
                    : 'bg-[#127749] text-white shadow-sm'
                  : darkMode
                    ? 'text-[#666666] hover:text-[#F2F2F2]'
                    : 'text-[#999999] hover:text-[#0A0A0A]'
              }`}
            >
              USD
            </button>
          </div>

          {/* View Toggle */}
          {/* <div className={`flex items-center gap-1 rounded-lg p-1 ml-auto ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F2F2F2]'}`}>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-0.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? darkMode ? 'bg-[#2E2E2E] text-[#F2F2F2] shadow-sm' : 'bg-white text-[#0A0A0A] shadow-sm'
                  : darkMode ? 'text-[#999999] hover:text-[#F2F2F2]' : 'text-[#666666] hover:text-[#0A0A0A]'
              }`}
            >
              <Table size={16} />
              Table
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-2 px-4 py-0.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'charts'
                  ? darkMode ? 'bg-[#2E2E2E] text-[#F2F2F2] shadow-sm' : 'bg-white text-[#0A0A0A] shadow-sm'
                  : darkMode ? 'text-[#999999] hover:text-[#F2F2F2]' : 'text-[#666666] hover:text-[#0A0A0A]'
              }`}
            >
              <PieChart size={16} />
              Charts
            </button>
          </div> */}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1 text-xs font-medium transition-colors shrink-0 ${
                darkMode ? 'text-[#999999] hover:text-[#D7B797]' : 'text-[#666666] hover:text-[#6B4D30]'
              }`}
            >
              <X size={12} />
              {t('budget.clearAll')}
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-0.5 bg-[#127749] text-white rounded-lg hover:bg-[#2A9E6A] transition-colors shadow-sm text-xs font-medium font-['Montserrat'] shrink-0"
          >
            <Plus size={14} />
            {t('budget.createBudget')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <ExpandableStatCard
          title={t('budget.totalBudget')}
          value={formatCurrency(summaryStats.total, { currency })}
          sub={t('budget.allBudgetsCombined')}
          darkMode={darkMode}
          icon={Wallet}
          accent="gold"
          trendLabel={`${summaryStats.count} budgets`}
          trend={1}
          breakdown={summaryStats.brandBreakdown.slice(0, 5)}
          expandTitle={t('home.kpiDetail.byBrand')}
        />
        <ExpandableStatCard
          title={t('budget.allocated')}
          value={formatCurrency(summaryStats.approved, { currency })}
          sub={`${summaryStats.approvedPct}% ${t('budget.ofTotal')}`}
          darkMode={darkMode}
          icon={CircleCheckBig}
          accent="emerald"
          progress={Number(summaryStats.approvedPct)}
          progressLabel={t('budget.allocated')}
          badges={[
            { label: 'Approved', value: summaryStats.statusCounts.approved, color: '#2A9E6A' },
            { label: 'Pending', value: summaryStats.statusCounts.pending, color: '#D29922' },
            { label: 'Draft', value: summaryStats.statusCounts.draft, color: '#666666' },
          ]}
          expandTitle={t('home.kpiDetail.byStatus')}
        />
        <ExpandableStatCard
          title={t('budget.remaining')}
          value={formatCurrency(summaryStats.remaining, { currency })}
          sub={`${summaryStats.remainingPct}% ${t('budget.ofTotal')}`}
          darkMode={darkMode}
          icon={Hourglass}
          accent="amber"
          progress={Number(summaryStats.remainingPct)}
          progressLabel={t('budget.remaining')}
          breakdown={[
            { label: 'Draft', value: summaryStats.draft, displayValue: formatCurrency(summaryStats.draft, { currency }), pct: summaryStats.total > 0 ? Math.round((summaryStats.draft / summaryStats.total) * 100) : 0, color: '#666666' },
            { label: 'Pending', value: summaryStats.pending, displayValue: formatCurrency(summaryStats.pending, { currency }), pct: summaryStats.total > 0 ? Math.round((summaryStats.pending / summaryStats.total) * 100) : 0, color: '#D29922' },
          ]}
          expandTitle={t('home.kpiDetail.breakdown')}
        />
      </div>

      {/* Data Table */}
      {viewMode === 'table' && (
        <>
        {/* Mobile Card View */}
        {isMobile && (
          <PullToRefresh onRefresh={fetchBudgets}>
            <FilterChips
              chips={[
                { key: 'year', label: t('budget.fiscalYear') },
                { key: 'groupBrand', label: t('budget.groupBrand') },
                { key: 'brand', label: t('budget.brand') },
              ]}
              activeValues={{
                year: selectedYear ? `FY${selectedYear}` : '',
                groupBrand: selectedGroupBrand ? (groupBrandCategories.find((g: any) => g.id === selectedGroupBrand)?.name || '') : '',
                brand: selectedBrand ? (brandList.find((b: any) => b.id === selectedBrand)?.name || '') : '',
              }}
              onChipPress={openFilter}
              onMorePress={openFilter}
              className="mb-2"
            />
            <MobileList
              items={filteredBudgets.map((budget: any) => ({
                id: budget.id,
                avatar: budget.status === 'approved' ? '✅' : budget.status === 'pending' ? '⏳' : '📝',
                title: budget.budgetName,
                subtitle: `FY${budget.fiscalYear} - ${budget.brandName}`,
                value: formatCurrency(budget.totalBudget, { currency }),
                valueLabel: t('budget.amount'),
                status: { text: budget.status, variant: budget.status === 'approved' ? 'success' as const : budget.status === 'pending' ? 'warning' as const : 'default' as const },
                expandedContent: (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-[#999]' : 'text-[#666]'}>{t('budget.groupBrand')}</span>
                      <span className="font-medium">{budget.groupBrand}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setSelectedBudget(budget); setShowViewModal(true); }}
                        className={`flex-1 px-3 py-0.5 text-xs font-medium rounded-lg border ${darkMode ? 'border-[#2E2E2E] text-[#999]' : 'border-[#C4B5A5] text-[#666]'}`}
                      >
                        {t('budget.view')}
                      </button>
                      <button
                        onClick={() => onAllocate && onAllocate({
                          id: budget.id, year: budget.fiscalYear, groupBrand: budget.groupBrand,
                          brandId: budget.brandId, brandName: budget.brandName,
                          totalBudget: budget.totalBudget, budgetName: budget.budgetName,
                        })}
                        className="flex-1 px-3 py-0.5 text-xs font-semibold rounded-lg bg-[#127749] text-white"
                      >
                        {t('budget.allocate')}
                      </button>
                    </div>
                  </div>
                ),
              }))}
              expandable
              emptyMessage={hasActiveFilters ? t('budget.noMatchingBudgets') : t('budget.noBudgetsYet')}
            />
            <FloatingActionButton icon={<Plus size={20} />} onClick={() => setShowCreateModal(true)} />
          </PullToRefresh>
        )}
        {/* Desktop Table */}
        {!isMobile && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(160,120,75,0.18)]'}>
              <tr>
                <th className={`text-left px-3 py-0.5 text-xs font-semibold tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                  {t('budget.fiscalYear')}
                </th>
                <th className={`text-left px-3 py-0.5 text-xs font-semibold tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                  {t('budget.groupBrand')}
                </th>
                <th className={`text-left px-3 py-0.5 text-xs font-semibold tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                  {t('budget.brand')}
                </th>
                <th className={`text-left px-3 py-0.5 text-xs font-semibold tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                  {t('budget.budgetName')}
                </th>
                <th className={`text-left px-3 py-0.5 text-xs font-semibold tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                  {t('budget.amount')}
                </th>
                <th className={`text-right px-3 py-0.5 text-xs font-semibold tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'divide-y divide-[#2E2E2E]' : 'divide-y divide-[#2E2E2E]/10'}>
              {filteredBudgets.map((budget: any) => (
                <tr
                  key={budget.id}
                  className={`transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'}`}
                >
                  <td className="px-3 py-0.5">
                    <span className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>FY{budget.fiscalYear}</span>
                  </td>
                  <td className="px-3 py-0.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-[#2E2E2E] text-[#F2F2F2]' : 'bg-[#F2F2F2] text-[#0A0A0A]'}`}>
                      {budget.groupBrand}
                    </span>
                  </td>
                  <td className="px-3 py-0.5">
                    <span className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{budget.brandName}</span>
                  </td>
                  <td className="px-3 py-0.5">
                    <span className={`text-sm font-medium cursor-pointer transition-colors ${
                      darkMode
                        ? 'text-[#D7B797] hover:text-[#D7B797]/80 hover:underline'
                        : 'text-[#6B4D30] hover:text-[#6B4D30]/80 hover:underline'
                    }`}>
                      {budget.budgetName}
                    </span>
                  </td>
                  <td className="px-3 py-0.5">
                    <span className={`text-sm font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>{formatCurrency(budget.totalBudget, { currency })}</span>
                  </td>
                  <td className="px-3 py-0.5">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <button
                        onClick={() => {
                          setSelectedBudget(budget);
                          setShowViewModal(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-md transition
                          ${darkMode
                            ? 'text-[#999999] hover:text-[#F2F2F2] hover:bg-[#2E2E2E]'
                            : 'text-[#666666] hover:text-[#0A0A0A] hover:bg-[#F2F2F2]'
                          }`}
                      >
                        <Eye size={14} />
                        {t('budget.view')}
                      </button>

                      {/* Allocate */}
                      <button
                        onClick={() =>
                          onAllocate &&
                          onAllocate({
                            id: budget.id,
                            year: budget.fiscalYear,
                            groupBrand: budget.groupBrand,
                            brandId: budget.brandId,
                            brandName: budget.brandName,
                            totalBudget: budget.totalBudget,
                            budgetName: budget.budgetName,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-semibold rounded-md transition
        ${darkMode
                            ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797] hover:bg-[rgba(160,120,75,0.18)] border border-[rgba(215,183,151,0.25)]'
                            : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30] hover:bg-[rgba(215,183,151,0.25)] border border-[rgba(215,183,151,0.4)]'
                          }`}
                      >
                        <Split size={14} />
                        {t('budget.allocate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {filteredBudgets.length === 0 && (
            <div className="py-8">
              <EmptyState
                darkMode={darkMode}
                title={hasActiveFilters ? t('budget.noMatchingBudgets') : t('budget.noBudgetsYet')}
                message={hasActiveFilters
                  ? t('budget.tryAdjustingFilters')
                  : t('budget.createFirstBudget')
                }
                actionLabel={hasActiveFilters ? undefined : t('budget.createBudget')}
                onAction={hasActiveFilters ? undefined : () => setShowCreateModal(true)}
              />
              {hasActiveFilters && (
                <div className="text-center">
                  <button
                    onClick={clearFilters}
                    className={`text-sm font-medium transition-colors ${
                      darkMode
                        ? 'text-[#D7B797] hover:text-[#D7B797]/80'
                        : 'text-[#6B4D30] hover:text-[#6B4D30]/80'
                    }`}
                  >
                    {t('common.clearAllFilters')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}
        </>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilter}
        filters={[
          {
            key: 'year',
            label: t('budget.fiscalYear'),
            type: 'single',
            options: YEARS.map((y: any) => ({ label: `FY${y}`, value: String(y) })),
          },
          {
            key: 'groupBrand',
            label: t('budget.groupBrand'),
            type: 'single',
            options: groupBrandCategories.map((g: any) => ({ label: g.name, value: g.id })),
          },
          {
            key: 'brand',
            label: t('budget.brand'),
            type: 'single',
            options: brandList.map((b: any) => ({ label: b.name, value: b.id })),
          },
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          setSelectedYear(mobileFilterValues.year ? Number(mobileFilterValues.year) : null);
          setSelectedGroupBrand((mobileFilterValues.groupBrand as string) || null);
          setSelectedBrand((mobileFilterValues.brand as string) || null);
        }}
        onReset={() => {
          setMobileFilterValues({});
          clearFilters();
        }}
      />

      {showViewModal && selectedBudget && (
        <div className="fixed inset-0 z-[9999]">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowViewModal(false)}
          />

          {/* Modal */}
          <div className="relative flex min-h-screen items-center justify-center p-4">
            <div
              className={`w-full max-w-lg rounded-2xl shadow-xl overflow-hidden
          ${darkMode ? 'bg-[#121212] text-[#F2F2F2]' : 'bg-white text-[#0A0A0A]'}`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between px-6 py-4 border-b
            ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}
              >
                <h3 className="text-lg font-semibold font-['Montserrat']">{t('budget.budgetDetail')}</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2E2E2E]' : 'hover:bg-[#F2F2F2]'}`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4 text-sm">
                <DetailRow label={t('budget.fiscalYear')} value={`FY${selectedBudget.fiscalYear}`} />
                <DetailRow label={t('budget.groupBrand')} value={selectedBudget.groupBrand} />
                <DetailRow label={t('budget.brand')} value={selectedBudget.brandName} />
                <DetailRow label={t('budget.budgetName')} value={selectedBudget.budgetName} />
                <DetailRow label={t('budget.createdBy')} value="TC Admin" />
                <DetailRow label={t('budget.createdOn')} value="02/02/2025" />

                <DetailRow
                  label={t('budget.totalBudget')}
                  value={formatCurrency(selectedBudget.totalBudget, { currency })}
                  strong
                />
              </div>

              {/* Footer */}
              <div
                className={`flex justify-end px-6 py-4 border-t
            ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}
              >
                <button
                  onClick={() => setShowViewModal(false)}
                  className={`px-4 py-0.5 text-sm font-medium rounded-lg transition-colors
              ${darkMode
                ? 'bg-[#2E2E2E] hover:bg-[#1A1A1A] text-[#F2F2F2]'
                : 'bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0A0A0A]'}`}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Charts View Placeholder */}
      {viewMode === 'charts' && (
        <div className={`rounded-xl shadow-sm border p-12 ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
          <div className="text-center">
            <PieChart size={48} className={`mx-auto mb-4 ${darkMode ? 'text-[#2E2E2E]' : 'text-[#999999]'}`} />
            <p className={darkMode ? 'text-[#666666]' : 'text-[#999999]'}>{t('common.chartsComingSoon')}</p>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-hidden ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
              <h3 className={`text-lg font-semibold font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>{t('budget.createNewBudget')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-[#666666] hover:text-[#F2F2F2] hover:bg-[#2E2E2E]' : 'text-[#999999] hover:text-[#0A0A0A] hover:bg-[#F2F2F2]'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-3 md:p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)]">
              {/* Fiscal Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Fiscal Year */}
                <div>
                  <label className={`block text-sm font-medium mb-2 font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                    {t('budget.fiscalYear')} <span className="text-[#F85149]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.fiscalYear}
                    onChange={(e) =>
                      setNewBudgetForm({
                        ...newBudgetForm,
                        fiscalYear: parseInt(e.target.value),
                      })
                    }
                    className={`w-full px-4 py-0.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-[#D7B797] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A]'}`}
                  >
                    {YEARS.map((year: any) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group Brand */}
                <div>
                  <label className={`block text-sm font-medium mb-2 font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                    {t('budget.groupBrand')} <span className="text-[#F85149]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.groupBrand}
                    onChange={(e) =>
                      setNewBudgetForm({ ...newBudgetForm, groupBrand: e.target.value })
                    }
                    className={`w-full px-4 py-0.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-[#D7B797] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A]'}`}
                  >
                    {groupBrandCategories.map((group: any) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className={`block text-sm font-medium mb-2 font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                    {t('budget.brand')} <span className="text-[#F85149]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.brandId}
                    onChange={(e) =>
                      setNewBudgetForm({ ...newBudgetForm, brandId: e.target.value })
                    }
                    className={`w-full px-4 py-0.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-[#D7B797] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A]'}`}
                  >
                    <option value="">{t('budget.selectBrand')}</option>
                    {apiBrands.map((brand: any) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Season Group & Season Type - removed per customer request */}

              {/* Budget Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                  {t('budget.budgetName')} <span className="text-[#F85149]">{t('common.required')}</span>
                </label>
                <input
                  type="text"
                  value={newBudgetForm.name}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, name: e.target.value })}
                  placeholder={t('budget.enterBudgetName')}
                  className={`w-full px-4 py-0.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-[#D7B797] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] placeholder-[#666666]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A] placeholder-[#999999]'}`}
                />
              </div>

              {/* Total Budget */}
              <div>
                <label className={`block text-sm font-medium mb-2 font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                  {t('budget.amountVND')} <span className="text-[#F85149]">{t('common.required')}</span>
                </label>
                <input
                  type="text"
                  value={newBudgetForm.totalBudget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewBudgetForm({ ...newBudgetForm, totalBudget: value });
                  }}
                  placeholder={t('budget.enterTotalBudgetAmount')}
                  className={`w-full px-4 py-0.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-[#D7B797] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] placeholder-[#666666]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A] placeholder-[#999999]'}`}
                />
                {newBudgetForm.totalBudget && (
                  <p className={`text-xs mt-1 font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                    {formatCurrency(parseInt(newBudgetForm.totalBudget) || 0, { currency })}
                  </p>
                )}
              </div>



              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                  {t('common.description')}
                </label>
                <textarea
                  value={newBudgetForm.description}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, description: e.target.value })}
                  placeholder={t('budget.enterDescription')}
                  rows={3}
                  className={`w-full px-4 py-0.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-[#D7B797] resize-none ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] placeholder-[#666666]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A] placeholder-[#999999]'}`}
                />
              </div>
            </div>
            <div className={`flex items-center justify-end gap-3 p-6 border-t ${darkMode ? 'border-[#2E2E2E] bg-[#0A0A0A]' : 'border-[#C4B5A5] bg-[#F2F2F2]'} rounded-b-2xl`}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBudgetForm({ fiscalYear: 2026, groupBrand: 'A', brandId: apiBrands[0]?.id || '', seasonGroup: 'SS', seasonType: 'pre', name: '', totalBudget: '', description: '' });
                }}
                className={`px-5 py-0.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:bg-[#2E2E2E]' : 'text-[#666666] hover:bg-[#E5E5E5]'}`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  if (!newBudgetForm.totalBudget || !newBudgetForm.brandId) return;

                  setCreating(true);
                  try {
                    const totalAmount = parseInt(newBudgetForm.totalBudget) || 0;
                    if (apiStores.length === 0) {
                      toast.error(t('budget.noStoresAvailable') || 'No stores available');
                      return;
                    }
                    // Split budget equally across all stores
                    const stores = apiStores;
                    const perStore = Math.floor(totalAmount / stores.length);
                    const details = stores.map((store: any, idx: any) => ({
                      storeId: store.id,
                      budgetAmount: idx === 0 ? totalAmount - perStore * (stores.length - 1) : perStore,
                    }));

                    await budgetService.create({
                      groupBrandId: newBudgetForm.brandId,
                      seasonGroupId: newBudgetForm.seasonGroup,
                      seasonType: newBudgetForm.seasonType,
                      fiscalYear: newBudgetForm.fiscalYear,
                      comment: newBudgetForm.description || undefined,
                      details,
                    });
                    toast.success(t('budget.budgetCreatedSuccess'));
                    setShowCreateModal(false);
                    setNewBudgetForm({ fiscalYear: 2026, groupBrand: 'A', brandId: apiBrands[0]?.id || '', seasonGroup: 'SS', seasonType: 'pre', name: '', totalBudget: '', description: '' });
                    // Refresh the list
                    fetchBudgets();
                  } catch (err: any) {
                    console.error('Failed to create budget:', err);
                    toast.error(err.response?.data?.message || t('budget.failedToCreateBudget'));
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={!newBudgetForm.totalBudget || !newBudgetForm.name || creating}
                className={`px-5 py-0.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                  !newBudgetForm.totalBudget || !newBudgetForm.name || creating
                    ? 'bg-[#2E2E2E] cursor-not-allowed text-[#666666]'
                    : 'bg-[#127749] hover:bg-[#2A9E6A]'
                }`}
              >
                {creating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {creating ? t('budget.creating') : t('budget.createBudget')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BudgetManagementScreen;
