'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronDown, Plus, Search, Table, X, Filter, Eye, Split,
  Wallet, CircleCheckBig, Hourglass, Trash2, Send, Copy, Clock, Archive
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatters';
import { budgetService, masterDataService } from '@/services';
import { invalidateCache } from '@/services/api';
import { LoadingSpinner, ErrorMessage, EmptyState, ExpandableStatCard } from '@/components/ui';
import { MobileList, FilterChips, FloatingActionButton, PullToRefresh, FilterBottomSheet, useBottomSheet } from '@/components/mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

const YEARS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i);

const CARD_ACCENTS = {
  total:     { color: '#D7B797', darkGrad: 'rgba(215,183,151,0.06)', lightGrad: 'rgba(180,140,95,0.25)', iconDark: 'rgba(215,183,151,0.07)', iconLight: 'rgba(160,120,75,0.20)' },
  allocated: { color: '#2A9E6A', darkGrad: 'rgba(42,158,106,0.06)',  lightGrad: 'rgba(22,120,70,0.20)',  iconDark: 'rgba(42,158,106,0.07)', iconLight: 'rgba(22,120,70,0.18)' },
  remaining: { color: '#E3B341', darkGrad: 'rgba(227,179,65,0.06)',  lightGrad: 'rgba(200,150,30,0.22)', iconDark: 'rgba(227,179,65,0.07)', iconLight: 'rgba(180,130,20,0.18)' },
};

const BudgetManagementScreen = ({
  selectedYear,
  setSelectedYear,
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
  const [deleting, setDeleting] = useState(false); // SEC-14: debounce delete
  const [duplicating, setDuplicating] = useState(false); // UX-06: clone/copy budget
  const [submittingId, setSubmittingId] = useState<string | null>(null); // UX-12: quick submit
  const [archiving, setArchiving] = useState(false); // UX-26: archive budget
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false); // UX-26: archive confirm

  // Master data for create form
  const [apiStores, setApiStores] = useState<any[]>([]);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, any> = {};
      if (selectedYear) filters.fiscalYear = selectedYear;

      const response = await budgetService.getAll(filters);
      // Map API response to UI format
      const budgets = (Array.isArray(response) ? response : []).map((budget: any) => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        totalBudget: Number(budget.totalBudget || budget.totalAmount) || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || 'Untitled',
        status: (budget.status || 'DRAFT').toLowerCase(),
        createdAt: budget.createdAt,
        createdBy: typeof budget.createdBy === 'object' ? budget.createdBy?.name : budget.createdBy
      }));
      setBudgetData(budgets);
    } catch (err: any) {
      console.error('Failed to fetch budgets:', err);
      setError(t('budget.failedToLoadBudgets'));
      setBudgetData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  // Delete budget (DRAFT only) — SEC-14: debounced with deleting state
  const handleDeleteBudget = async () => {
    if (!selectedBudget?.id || deleting) return;
    setDeleting(true);
    try {
      await budgetService.delete(selectedBudget.id);
      invalidateCache('/budgets');
      toast.success(t('budget.deleteSuccess') || 'Budget deleted successfully');
      setShowDeleteConfirm(false);
      setShowViewModal(false);
      setSelectedBudget(null);
      await fetchBudgets();
    } catch (err: any) {
      console.error('Failed to delete budget:', err);
      toast.error(t('budget.deleteFailed') || 'Failed to delete budget');
    } finally {
      setDeleting(false);
    }
  };

  // UX-06: Duplicate/clone budget
  const handleDuplicateBudget = async () => {
    if (!selectedBudget || duplicating || apiStores.length === 0) return;
    setDuplicating(true);
    try {
      const totalAmount = Number(selectedBudget.totalBudget) || 0;
      const stores = apiStores;
      const perStore = Math.floor(totalAmount / stores.length);
      const details = stores.map((store: any, idx: number) => ({
        storeId: store.id,
        budgetAmount: idx === 0 ? totalAmount - perStore * (stores.length - 1) : perStore,
      }));

      await budgetService.create({
        budgetCode: `${selectedBudget.budgetName} (Copy)`,
        fiscalYear: selectedBudget.fiscalYear,
        details,
      });
      invalidateCache('/budgets');
      toast.success(t('budget.duplicateSuccess') || 'Budget duplicated successfully');
      setShowViewModal(false);
      setSelectedBudget(null);
      await fetchBudgets();
    } catch (err: any) {
      console.error('Failed to duplicate budget:', err);
      toast.error(err?.response?.data?.message || t('budget.duplicateFailed') || 'Failed to duplicate budget');
    } finally {
      setDuplicating(false);
    }
  };

  // UX-12: Quick submit for DRAFT budgets
  const handleQuickSubmit = async (budgetId: string) => {
    if (submittingId) return;
    setSubmittingId(budgetId);
    try {
      await budgetService.submit(budgetId);
      invalidateCache('/budgets');
      toast.success(t('budget.submitSuccess') || 'Budget submitted for approval');
      await fetchBudgets();
    } catch (err: any) {
      console.error('Failed to submit budget:', err);
      toast.error(err?.response?.data?.message || t('budget.submitFailed') || 'Failed to submit budget');
    } finally {
      setSubmittingId(null);
    }
  };

  // UX-26: Archive approved budget
  const handleArchiveBudget = async () => {
    if (!selectedBudget?.id || archiving) return;
    setArchiving(true);
    try {
      await budgetService.archive(selectedBudget.id);
      invalidateCache('/budgets');
      toast.success(t('budget.archiveSuccess') || 'Budget archived successfully');
      setShowArchiveConfirm(false);
      setShowViewModal(false);
      setSelectedBudget(null);
      await fetchBudgets();
    } catch (err: any) {
      console.error('Failed to archive budget:', err);
      toast.error(err?.response?.data?.message || t('budget.archiveFailed') || 'Failed to archive budget');
    } finally {
      setArchiving(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBudgets();
    // Fetch master data for create form
    masterDataService.getStores().then(s => {
      const all = Array.isArray(s) ? s : [];
      setApiStores(all.length > 0 ? all : []);
    }).catch(() => {});
  }, [fetchBudgets]);

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currency, setCurrency] = useState<any>('VND'); // VND or USD

  // Dropdown states
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]); // UX-16: approval timeline
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  // Status filter (P1 UX-01)
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Column sorting (P1 UX-06)
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const toggleSort = (col: string) => {
    if (sortColumn === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('desc'); }
  };

  // Form state for create budget
  const [newBudgetForm, setNewBudgetForm] = useState({
    fiscalYear: new Date().getFullYear() + 1,
    seasonGroup: 'SS',
    seasonType: 'pre',
    name: '',
    totalBudget: '',
    description: ''
  });

  // UX-16: Fetch approval history when view modal opens
  useEffect(() => {
    if (showViewModal && selectedBudget?.id) {
      setLoadingApprovals(true);
      setApprovalHistory([]);
      budgetService.getOne(selectedBudget.id).then((detail: any) => {
        setApprovalHistory(Array.isArray(detail?.approvals) ? detail.approvals : []);
      }).catch(() => {
        setApprovalHistory([]);
      }).finally(() => {
        setLoadingApprovals(false);
      });
    }
  }, [showViewModal, selectedBudget?.id]);

  // Filter + sort budgets
  const filteredBudgets = useMemo(() => {
    let list = budgetData.filter((budget: any) => {
      if (selectedYear && budget.fiscalYear !== selectedYear) return false;
      if (statusFilter && budget.status !== statusFilter) return false;
      if (searchQuery && !budget.budgetName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    if (sortColumn) {
      list = [...list].sort((a: any, b: any) => {
        let va = a[sortColumn], vb = b[sortColumn];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [budgetData, selectedYear, statusFilter, searchQuery, sortColumn, sortDir]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = budgetData.reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const approved = budgetData.filter((b: any) => b.status === 'approved').reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const pending = budgetData.filter((b: any) => b.status === 'pending').reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const draft = budgetData.filter((b: any) => b.status === 'draft').reduce((sum: any, b: any) => sum + (Number(b.totalBudget) || 0), 0);
    const remaining = total - approved;

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
      statusCounts,
    };
  }, [budgetData]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedYear(null);
    setSearchQuery('');
    setStatusFilter('');
  };

  const DetailRow = ({ label, value, strong }: any) => (
  <div className="flex justify-between gap-4">
    <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>{label}</span>
    <span className={`text-right ${strong ? 'font-semibold text-[#2A9E6A] font-[\'JetBrains_Mono\']' : ''}`}>
      {value}
    </span>
  </div>
);


  const hasActiveFilters = selectedYear || searchQuery || statusFilter;

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
      <div className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-2 md:mb-3 border-b backdrop-blur-sm ${darkMode ? 'bg-[#121212]/95 border-[#2E2E2E]' : 'bg-white/95 border-[#C4B5A5]'}`}>
        <div className="flex flex-wrap items-center gap-1.5 px-3 md:px-6 py-1.5">

          {/* Mobile Filter Button */}
          {isMobile && (
            <button
              onClick={openFilter}
              className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-medium ${
                darkMode
                  ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#D7B797]'
                  : 'bg-white border-[#C4B5A5] text-[#6B4D30]'
              }`}
            >
              <Filter size={12} />
              {t('budget.filters')}
              {selectedYear && (
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
              }}
              className={`flex items-center justify-between gap-2 px-3 py-1 border rounded-lg transition-colors min-w-[110px] ${selectedYear
                ? darkMode
                  ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797]'
                  : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                : darkMode
                  ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)]'
                  : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(215,183,151,0.4)]'
                }`}
              aria-label="Select fiscal year"
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

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1">
            {['draft', 'submitted', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  statusFilter === s
                    ? s === 'approved' ? 'bg-[rgba(42,158,106,0.2)] text-[#2A9E6A]'
                      : s === 'rejected' ? 'bg-[rgba(248,81,73,0.15)] text-[#F85149]'
                      : s === 'submitted' ? 'bg-[rgba(88,166,255,0.15)] text-[#58A6FF]'
                      : darkMode ? 'bg-[rgba(215,183,151,0.12)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                    : darkMode ? 'text-[#666] hover:bg-[#1A1A1A]' : 'text-[#999] hover:bg-gray-100'
                }`}
              >
                {t(`common.${s}`) || s}
                {summaryStats.statusCounts[s] > 0 && (
                  <span className="ml-1 opacity-70">({summaryStats.statusCounts[s]})</span>
                )}
              </button>
            ))}
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
              className={`w-full pl-8 pr-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D7B797] focus:border-transparent ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] placeholder-[#666666]' : 'bg-white border-[#C4B5A5] text-[#0A0A0A] placeholder-[#999999]'}`}
            />
          </div>

          {/* Currency Toggle */}
          <div className={`flex items-center rounded-lg p-1 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F2F2F2]'}`}>
            <button
              onClick={() => setCurrency('VND')}
              className={`px-3 py-1 rounded-md text-xs font-semibold font-['JetBrains_Mono'] transition-all ${
                currency === 'VND'
                  ? darkMode
                    ? 'bg-[#D7B797] text-[#0A0A0A] shadow-sm'
                    : 'bg-[#D7B797] text-[#0A0A0A] shadow-sm'
                  : darkMode
                    ? 'text-[#666666] hover:text-[#F2F2F2]'
                    : 'text-[#999999] hover:text-[#0A0A0A]'
              }`}
              aria-label="Switch to VND currency"
            >
              VND
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-md text-xs font-semibold font-['JetBrains_Mono'] transition-all ${
                currency === 'USD'
                  ? darkMode
                    ? 'bg-[#127749] text-white shadow-sm'
                    : 'bg-[#127749] text-white shadow-sm'
                  : darkMode
                    ? 'text-[#666666] hover:text-[#F2F2F2]'
                    : 'text-[#999999] hover:text-[#0A0A0A]'
              }`}
              aria-label="Switch to USD currency"
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
              className={`shrink-0 p-1 rounded transition-colors ${darkMode ? 'text-[#666666] hover:text-red-400 hover:bg-red-400/10' : 'text-[#999999] hover:text-red-500 hover:bg-red-50'}`}
              title={t('common.clearAllFilters')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#127749] text-white rounded-lg hover:bg-[#2A9E6A] transition-colors shadow-sm text-xs font-medium font-['Montserrat'] shrink-0"
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
              ]}
              activeValues={{
                year: selectedYear ? `FY${selectedYear}` : '',
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
                subtitle: `FY${budget.fiscalYear}`,
                value: formatCurrency(budget.totalBudget, { currency }),
                valueLabel: t('budget.amount'),
                status: { text: budget.status, variant: budget.status === 'approved' ? 'success' as const : budget.status === 'pending' ? 'warning' as const : 'default' as const },
                expandedContent: (
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setSelectedBudget(budget); setShowViewModal(true); }}
                        className={`flex-1 px-3 py-0.5 text-xs font-medium rounded-lg border ${darkMode ? 'border-[#2E2E2E] text-[#999]' : 'border-[#C4B5A5] text-[#666]'}`}
                      >
                        {t('budget.view')}
                      </button>
                      <button
                        onClick={() => onAllocate && onAllocate({
                          id: budget.id, year: budget.fiscalYear,
                          totalBudget: budget.totalBudget, budgetName: budget.budgetName,
                        })}
                        className="px-2 py-1 rounded-lg bg-[#127749] text-white"
                        title={t('budget.allocate')}
                        aria-label="Allocate budget"
                      >
                        <Split size={14} />
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
                        className={`p-2.5 md:p-1.5 rounded-md transition ${darkMode
                            ? 'text-[#999999] hover:text-[#F2F2F2] hover:bg-[#2E2E2E]'
                            : 'text-[#666666] hover:text-[#0A0A0A] hover:bg-[#F2F2F2]'
                          }`}
                        title={t('budget.view')}
                        aria-label="View budget"
                      >
                        <Eye size={14} />
                      </button>

                      {/* UX-12: Quick Submit for DRAFT budgets */}
                      {budget.status === 'draft' && (
                        <button
                          onClick={() => handleQuickSubmit(budget.id)}
                          disabled={submittingId === budget.id}
                          className={`p-2.5 md:p-1.5 rounded-md transition ${submittingId === budget.id ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode
                              ? 'text-blue-400 hover:bg-blue-500/10'
                              : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          title={t('budget.submit') || 'Submit for Approval'}
                          aria-label="Submit budget"
                        >
                          <Send size={14} />
                        </button>
                      )}

                      {/* UX-26: Archive for APPROVED budgets */}
                      {budget.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedBudget(budget);
                            setShowArchiveConfirm(true);
                          }}
                          className={`p-2.5 md:p-1.5 rounded-md transition ${darkMode
                              ? 'text-[#E3B341] hover:bg-[rgba(227,179,65,0.1)]'
                              : 'text-[#9A7B2E] hover:bg-[rgba(227,179,65,0.1)]'
                            }`}
                          title={t('budget.archive') || 'Archive'}
                          aria-label="Archive budget"
                        >
                          <Archive size={14} />
                        </button>
                      )}

                      {/* Allocate */}
                      <button
                        onClick={() =>
                          onAllocate &&
                          onAllocate({
                            id: budget.id,
                            year: budget.fiscalYear,
                            totalBudget: budget.totalBudget,
                            budgetName: budget.budgetName,
                          })
                        }
                        className={`p-2.5 md:p-1.5 rounded-md transition ${darkMode
                            ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797] hover:bg-[rgba(160,120,75,0.18)] border border-[rgba(215,183,151,0.25)]'
                            : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30] hover:bg-[rgba(215,183,151,0.25)] border border-[rgba(215,183,151,0.4)]'
                          }`}
                        title={t('budget.allocate')}
                        aria-label="Allocate budget"
                      >
                        <Split size={14} />
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
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          setSelectedYear(mobileFilterValues.year ? Number(mobileFilterValues.year) : null);
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
                  aria-label="Close budget detail"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                <DetailRow label={t('budget.fiscalYear')} value={`FY${selectedBudget.fiscalYear}`} />
                <DetailRow label={t('budget.budgetName')} value={selectedBudget.budgetName} />
                <DetailRow label={t('budget.createdBy')} value={selectedBudget.createdBy || t('common.unknown')} />
                <DetailRow label={t('budget.createdOn')} value={selectedBudget.createdAt ? new Date(selectedBudget.createdAt).toLocaleDateString('vi-VN') : '-'} />

                <DetailRow
                  label={t('budget.totalBudget')}
                  value={formatCurrency(selectedBudget.totalBudget, { currency })}
                  strong
                />

                {/* UX-16: Approval History Timeline */}
                <div className={`pt-3 border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]/40'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                    <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                      {t('budget.approvalHistory') || 'Approval History'}
                    </span>
                  </div>
                  {loadingApprovals ? (
                    <div className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                      {t('common.loading') || 'Loading...'}
                    </div>
                  ) : approvalHistory.length === 0 ? (
                    <div className={`text-xs italic ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                      {t('budget.noApprovalRecords') || 'No approval records yet'}
                    </div>
                  ) : (
                    <div className="relative pl-4 space-y-3">
                      {/* Timeline line */}
                      <div className={`absolute left-[5px] top-1 bottom-1 w-px ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#C4B5A5]/40'}`} />
                      {approvalHistory.map((approval: any, idx: number) => {
                        const isApprove = (approval.action || '').toLowerCase().includes('approve');
                        const isReject = (approval.action || '').toLowerCase().includes('reject');
                        const dotColor = isApprove ? 'bg-[#2A9E6A]' : isReject ? 'bg-[#F85149]' : 'bg-[#D29922]';
                        return (
                          <div key={idx} className="relative flex items-start gap-3">
                            {/* Timeline dot */}
                            <div className={`absolute left-[-12px] top-1 w-2.5 h-2.5 rounded-full ring-2 ${dotColor} ${darkMode ? 'ring-[#121212]' : 'ring-white'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                                  {approval.deciderName || approval.decidedBy || t('common.unknown')}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isApprove
                                    ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]'
                                    : isReject
                                      ? 'bg-[rgba(248,81,73,0.15)] text-[#F85149]'
                                      : 'bg-[rgba(210,153,34,0.15)] text-[#D29922]'
                                }`}>
                                  {(approval.action || 'submitted').toUpperCase()}
                                </span>
                                {approval.level && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-[#2E2E2E] text-[#999999]' : 'bg-[#F2F2F2] text-[#666666]'}`}>
                                    L{approval.level}
                                  </span>
                                )}
                              </div>
                              {approval.comment && (
                                <p className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                                  {approval.comment}
                                </p>
                              )}
                              <span className={`text-[10px] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                                {approval.decidedAt || approval.createdAt
                                  ? new Date(approval.decidedAt || approval.createdAt).toLocaleString('vi-VN')
                                  : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div
                className={`flex items-center justify-between px-6 py-4 border-t
            ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}
              >
                <div className="flex items-center gap-2">
                  {selectedBudget.status === 'draft' && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                      {t('common.delete') || 'Delete'}
                    </button>
                  )}
                  {/* UX-06: Duplicate budget */}
                  <button
                    onClick={handleDuplicateBudget}
                    disabled={duplicating}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${duplicating ? 'opacity-50 cursor-not-allowed' : ''} ${
                      darkMode
                        ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]'
                        : 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'
                    }`}
                  >
                    <Copy size={14} />
                    {duplicating ? (t('budget.duplicating') || 'Duplicating...') : (t('budget.duplicate') || 'Duplicate')}
                  </button>
                  {/* UX-26: Archive approved budget */}
                  {selectedBudget.status === 'approved' && (
                    <button
                      onClick={() => setShowArchiveConfirm(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        darkMode
                          ? 'text-[#E3B341] hover:bg-[rgba(227,179,65,0.1)]'
                          : 'text-[#9A7B2E] hover:bg-[rgba(227,179,65,0.12)]'
                      }`}
                    >
                      <Archive size={14} />
                      {t('budget.archive') || 'Archive'}
                    </button>
                  )}
                </div>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedBudget && (
        <div className="fixed inset-0 z-[10000]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative flex min-h-screen items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-[#121212] text-[#F2F2F2]' : 'bg-white text-[#0A0A0A]'}`}>
              <div className="px-6 py-5 space-y-3">
                <h3 className="text-lg font-semibold font-['Montserrat']">{t('budget.confirmDelete') || 'Confirm Delete'}</h3>
                <p className={`text-sm ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
                  {t('budget.deleteWarning') || 'Are you sure you want to delete this budget? This action cannot be undone.'}
                </p>
                <p className="text-sm font-medium">{selectedBudget.budgetName}</p>
              </div>
              <div className={`flex justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'bg-[#2E2E2E] hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0A0A0A]'}`}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteBudget}
                  disabled={deleting}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {deleting ? (t('common.deleting') || 'Deleting...') : (t('common.delete') || 'Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UX-26: Archive Confirmation Dialog */}
      {showArchiveConfirm && selectedBudget && (
        <div className="fixed inset-0 z-[10000]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowArchiveConfirm(false)} />
          <div className="relative flex min-h-screen items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-[#121212] text-[#F2F2F2]' : 'bg-white text-[#0A0A0A]'}`}>
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Archive size={18} className={darkMode ? 'text-[#E3B341]' : 'text-[#9A7B2E]'} />
                  <h3 className="text-lg font-semibold font-['Montserrat']">{t('budget.confirmArchive') || 'Confirm Archive'}</h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
                  {t('budget.archiveWarning') || 'Are you sure you want to archive this budget? Archived budgets will no longer appear in active views.'}
                </p>
                <p className="text-sm font-medium">{selectedBudget.budgetName}</p>
              </div>
              <div className={`flex justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'bg-[#2E2E2E] hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0A0A0A]'}`}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleArchiveBudget}
                  disabled={archiving}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${archiving ? 'opacity-50 cursor-not-allowed' : ''} ${
                    darkMode
                      ? 'bg-[#E3B341] hover:bg-[#D29922] text-[#0A0A0A]'
                      : 'bg-[#E3B341] hover:bg-[#D29922] text-[#0A0A0A]'
                  }`}
                >
                  <Archive size={14} />
                  {archiving ? (t('budget.archiving') || 'Archiving...') : (t('budget.archive') || 'Archive')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-hidden ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
              <h3 className={`text-lg font-semibold font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>{t('budget.createNewBudget')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-[#666666] hover:text-[#F2F2F2] hover:bg-[#2E2E2E]' : 'text-[#999999] hover:text-[#0A0A0A] hover:bg-[#F2F2F2]'}`}
                aria-label="Close create budget dialog"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-3 md:p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)]">
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
                  setNewBudgetForm({ fiscalYear: 2026, seasonGroup: 'SS', seasonType: 'pre', name: '', totalBudget: '', description: '' });
                }}
                className={`px-5 py-0.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:bg-[#2E2E2E]' : 'text-[#666666] hover:bg-[#E5E5E5]'}`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  if (!newBudgetForm.totalBudget) return;
                  const totalAmount = parseInt(newBudgetForm.totalBudget) || 0;
                  if (totalAmount <= 0) {
                    toast.error(t('budget.amountMustBePositive') || 'Amount must be greater than 0');
                    return;
                  }
                  if (totalAmount > 100_000_000_000) {
                    toast.error(t('budget.amountTooLarge') || 'Amount exceeds maximum (100 billion VND)');
                    return;
                  }

                  setCreating(true);
                  try {
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
                      budgetCode: newBudgetForm.name,
                      seasonGroupId: newBudgetForm.seasonGroup,
                      seasonType: newBudgetForm.seasonType,
                      fiscalYear: newBudgetForm.fiscalYear,
                      comment: newBudgetForm.description || undefined,
                      details,
                    });
                    invalidateCache('/budgets');
                    toast.success(t('budget.budgetCreatedSuccess'));
                    setShowCreateModal(false);
                    setNewBudgetForm({ fiscalYear: new Date().getFullYear() + 1, seasonGroup: 'SS', seasonType: 'pre', name: '', totalBudget: '', description: '' });
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
