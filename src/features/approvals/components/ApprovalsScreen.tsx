'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck, CheckCircle, XCircle, Clock, Loader2,
  Filter, Search, ChevronDown, Eye,
  X, AlertTriangle, Shield, ArrowUpRight,
  Wallet, BarChart3, Package, ClipboardList
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { approvalService } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExpandableStatCard } from '../../../components/ui';
import { MobileList, FilterBottomSheet, PullToRefresh, useBottomSheet } from '../../../components/mobile';
import { useIsMobile } from '@/hooks/useIsMobile';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const STATUS_CONFIG: any = {
  SUBMITTED: { color: '#D29922', bg: 'rgba(210,153,34,0.12)', label: 'Pending L1' },
  LEVEL1_APPROVED: { color: '#58A6FF', bg: 'rgba(88,166,255,0.12)', label: 'Pending L2' },
  LEVEL2_APPROVED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Approved' },
  APPROVED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Approved' },
  LEVEL1_REJECTED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Rejected' },
  LEVEL2_REJECTED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Rejected' },
  REJECTED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Rejected' },
};

const ENTITY_ICONS: any = {
  budget: Wallet,
  planning: BarChart3,
  proposal: Package,
};

/* Helper: extract display name & brand from any pending approval item */
const getItemDisplayInfo = (item: any) => {
  const d = item.data || {};
  // Name: try common fields, then type-specific codes
  const name = d.name || d.budgetName || d.planningName || d.ticketName
    || d.budgetCode || d.planningCode || d.proposalCode
    || `${item.entityType} #${String(item.entityId).substring(0, 8)}`;
  // Brand: try direct groupBrand, then nested paths for planning/proposal
  const brand = d.groupBrand?.name
    || d.budgetDetail?.budget?.groupBrand?.name
    || d.budget?.groupBrand?.name
    || d.brand?.name || d.brandName || '-';
  return { name, brand };
};

/* ═══════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════ */
const ApprovalsScreen = ({ darkMode }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const { isOpen: filterOpen, open: openFilterSheet, close: closeFilterSheet } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});

  // Fetch pending approvals
  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await approvalService.getPending();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch pending approvals:', err);
      setError(t('approvals.failedToLoad'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to entity detail page
  const navigateToEntity = (item: any) => {
    const routes: Record<string, string> = {
      budget: '/budget-management',
      planning: `/planning/${item.entityId}`,
      proposal: `/proposal/${item.entityId}`,
    };
    const path = routes[item.entityType];
    if (path) router.push(path);
  };

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter((item: any) => {
      if (entityFilter !== 'all' && item.entityType !== entityFilter) return false;
      if (levelFilter !== 'all' && item.level !== parseInt(levelFilter)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const info = getItemDisplayInfo(item);
        return info.name.toLowerCase().includes(term) || info.brand.toLowerCase().includes(term);
      }
      return true;
    });
  }, [items, entityFilter, levelFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const l1 = items.filter((i: any) => i.level === 1).length;
    const l2 = items.filter((i: any) => i.level === 2).length;
    const budgets = items.filter((i: any) => i.entityType === 'budget').length;
    const plannings = items.filter((i: any) => i.entityType === 'planning').length;
    const proposals = items.filter((i: any) => i.entityType === 'proposal').length;

    return {
      total, l1, l2, budgets, plannings, proposals,
      entityBreakdown: [
        { label: t('approvals.typeBudget'), value: budgets, color: '#D7B797' },
        { label: t('approvals.typePlanning'), value: plannings, color: '#58A6FF' },
        { label: t('approvals.typeProposal'), value: proposals, color: '#2A9E6A' },
      ].filter((b: any) => b.value > 0),
      levelBreakdown: [
        { label: 'Level 1', value: l1, color: '#58A6FF' },
        { label: 'Level 2', value: l2, color: '#A371F7' },
      ].filter((b: any) => b.value > 0),
      l1Pct: total > 0 ? Math.round((l1 / total) * 100) : 0,
      l2Pct: total > 0 ? Math.round((l2 / total) * 100) : 0,
      budgetPct: total > 0 ? Math.round((budgets / total) * 100) : 0,
    };
  }, [items, t]);

  const bg = darkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-[#121212]' : 'bg-white';
  const border = darkMode ? 'border-[#2E2E2E]' : 'border-gray-300';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-[#999999]' : 'text-gray-700';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${bg} p-2 md:p-4`}>
      {/* Compact Header + Filters */}
      <div className={`border ${border} rounded-xl px-2 md:px-3 py-2 mb-3`} style={{
        background: darkMode
          ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.03) 40%, rgba(215,183,151,0.10) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.04) 35%, rgba(215,183,151,0.12) 100%)',
        boxShadow: `inset 0 -1px 0 ${darkMode ? 'rgba(215,183,151,0.08)' : 'rgba(215,183,151,0.05)'}`,
      }}>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-[rgba(215,183,151,0.15)]'}`}>
            <FileCheck size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
          </div>
          <div className="flex-shrink-0">
            <h1 className={`text-sm font-semibold font-['Montserrat'] ${textPrimary} leading-tight`}>
              {t('screenConfig.approvals')}
            </h1>
            <p className={`text-[10px] ${textMuted} leading-tight`}>
              {t('approvals.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Mobile filter button */}
            {isMobile && (
              <button
                onClick={openFilterSheet}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${border} text-xs font-medium font-['Montserrat'] ${darkMode ? 'text-[#D7B797] bg-[#1A1A1A]' : 'text-[#6B4D30] bg-gray-50'}`}
              >
                <Filter size={12} />
                {t('budget.filters')}
                {(entityFilter !== 'all' || levelFilter !== 'all' || searchTerm) && (
                  <span className="w-2 h-2 rounded-full bg-[#D7B797]" />
                )}
              </button>
            )}

            {/* Desktop filters */}
            {!isMobile && (
            <>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} w-48`}>
              <Search size={12} className={textMuted} />
              <input
                type="text"
                placeholder={t('approvals.searchPlaceholder')}
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className={`bg-transparent outline-none text-xs w-full font-['Montserrat'] ${textPrimary} placeholder:${textMuted}`}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')}>
                  <X size={10} className={textMuted} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={entityFilter}
                onChange={(e: any) => setEntityFilter(e.target.value)}
                className={`appearance-none px-2 py-1 pr-6 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} text-xs font-['Montserrat'] ${textPrimary} outline-none cursor-pointer`}
              >
                <option value="all">{t('approvals.allTypes')}</option>
                <option value="budget">{t('approvals.typeBudget')}</option>
                <option value="planning">{t('approvals.typePlanning')}</option>
                <option value="proposal">{t('approvals.typeProposal')}</option>
              </select>
              <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>

            <div className="relative">
              <select
                value={levelFilter}
                onChange={(e: any) => setLevelFilter(e.target.value)}
                className={`appearance-none px-2 py-1 pr-6 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} text-xs font-['Montserrat'] ${textPrimary} outline-none cursor-pointer`}
              >
                <option value="all">{t('approvals.allLevels')}</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
              </select>
              <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>
            </>
            )}

            <button
              onClick={fetchPendingApprovals}
              className={`px-2.5 py-1 rounded-lg border ${border} text-xs font-medium font-['Montserrat'] transition-all ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]' : 'text-[#6B4D30] hover:bg-[rgba(215,183,151,0.1)]'}`}
            >
              {t('common.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <ExpandableStatCard
          title={t('approvals.totalPending')}
          value={stats.total}
          sub={t('approvals.awaitingReview')}
          darkMode={darkMode}
          icon={Clock}
          accent="amber"
          breakdown={stats.entityBreakdown}
          expandTitle={t('approvals.allTypes')}
        />
        <ExpandableStatCard
          title={t('approvals.level1Pending')}
          value={stats.l1}
          sub={t('approvals.initialReview')}
          darkMode={darkMode}
          icon={Shield}
          accent="blue"
          progress={stats.l1Pct}
          progressLabel="Level 1"
          breakdown={stats.entityBreakdown}
        />
        <ExpandableStatCard
          title={t('approvals.level2Pending')}
          value={stats.l2}
          sub={t('approvals.finalApproval')}
          darkMode={darkMode}
          icon={FileCheck}
          accent="emerald"
          progress={stats.l2Pct}
          progressLabel="Level 2"
          badges={[
            { label: t('approvals.typeBudget'), value: stats.budgets, color: '#D7B797' },
            { label: t('approvals.typePlanning'), value: stats.plannings, color: '#58A6FF' },
          ].filter((b: any) => b.value > 0)}
        />
        <ExpandableStatCard
          title={t('approvals.budgetItems')}
          value={stats.budgets}
          sub={t('approvals.budgetRequests')}
          darkMode={darkMode}
          icon={ArrowUpRight}
          accent="gold"
          progress={stats.budgetPct}
          progressLabel={t('approvals.typeBudget')}
        />
      </div>

      {/* Table */}
      <div className={`border ${border} rounded-xl overflow-hidden`} style={{
        background: darkMode
          ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.02) 40%, rgba(215,183,151,0.06) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.03) 35%, rgba(215,183,151,0.08) 100%)',
      }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className={`animate-spin ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
            <p className={`text-sm mt-3 ${textSecondary}`}>{t('approvals.loadingApprovals')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-[#F85149]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{error}</p>
            <button onClick={fetchPendingApprovals} className="mt-3 px-4 py-2 rounded-xl bg-[#D7B797] text-black text-sm font-medium font-['Montserrat']">
              {t('common.tryAgain')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CheckCircle size={48} className={`${darkMode ? 'text-[#2A9E6A]' : 'text-green-500'}`} />
            <p className={`text-base font-semibold mt-4 font-['Montserrat'] ${textPrimary}`}>{t('approvals.allCaughtUp')}</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>{t('approvals.noPendingItems')}</p>
          </div>
        ) : isMobile ? (
          /* Mobile List View with Swipe Actions */
          <PullToRefresh onRefresh={fetchPendingApprovals}>
            <div className="p-2">
              <MobileList
                items={filtered.map((item: any, idx: any) => {
                  const status = item.data?.status || 'SUBMITTED';
                  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
                  const { name, brand } = getItemDisplayInfo(item);

                  return {
                    id: `${item.entityType}-${item.entityId}-${idx}`,
                    avatar: item.entityType === 'budget' ? '💰' : item.entityType === 'planning' ? '📊' : '📦',
                    title: name,
                    subtitle: `${item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)} • ${brand}`,
                    value: `L${item.level}`,
                    status: {
                      text: sc.label,
                      variant: (sc.color === '#2A9E6A' ? 'success' : sc.color === '#F85149' ? 'error' : 'warning') as any,
                    },
                    details: [
                      { label: t('approvals.colLevel'), value: `Level ${item.level}` },
                      { label: t('approvals.colSubmitted'), value: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('vi-VN') : '-' },
                    ],
                  };
                })}
                onItemPress={(listItem) => {
                  const idx = filtered.findIndex((_: any, i: any) => listItem.id.endsWith(`-${i}`));
                  if (idx >= 0) navigateToEntity(filtered[idx]);
                }}
                expandable
                emptyMessage={t('approvals.noPendingItems')}
              />
            </div>
          </PullToRefresh>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} border-b ${border}`}>
                  {[t('approvals.colType'), t('approvals.colName'), t('approvals.colBrand'), t('approvals.colLevel'), t('approvals.colStatus'), t('approvals.colSubmitted'), t('common.actions')].map((h: any) => (
                    <th key={h} className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any, idx: any) => {
                  const status = item.data?.status || 'SUBMITTED';
                  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
                  const { name, brand } = getItemDisplayInfo(item);

                  return (
                    <tr
                      key={`${item.entityType}-${item.entityId}-${idx}`}
                      className={`border-b ${border} transition-colors ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-50'}`}
                    >
                      {/* Type */}
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          {(() => { const Icon = ENTITY_ICONS[item.entityType] || ClipboardList; return <Icon size={16} strokeWidth={2} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />; })()}
                          <span className={`text-sm font-medium font-['Montserrat'] capitalize ${textPrimary}`}>
                            {item.entityType}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-medium font-['Montserrat'] ${textPrimary}`}>{name}</span>
                      </td>

                      {/* Brand */}
                      <td className="px-3 py-1.5">
                        <span className={`text-sm font-['Montserrat'] ${textSecondary}`}>{brand}</span>
                      </td>

                      {/* Level */}
                      <td className="px-3 py-1.5">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-['JetBrains_Mono']"
                          style={{
                            color: item.level === 1 ? '#58A6FF' : '#A371F7',
                            backgroundColor: item.level === 1 ? 'rgba(88,166,255,0.12)' : 'rgba(163,113,247,0.12)',
                          }}
                        >
                          L{item.level}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-['JetBrains_Mono']"
                          style={{ color: sc.color, backgroundColor: sc.bg }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td className="px-3 py-1.5">
                        <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>
                          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-1.5">
                        <button
                          onClick={() => navigateToEntity(item)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all ${darkMode ? 'bg-[rgba(215,183,151,0.1)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.18)]' : 'bg-[rgba(160,120,75,0.1)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                        >
                          <Eye size={13} />
                          {t('common.view')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilterSheet}
        filters={[
          {
            key: 'entityFilter',
            label: t('approvals.allTypes'),
            icon: '🏷️',
            type: 'single',
            options: [
              { value: 'budget', label: t('approvals.typeBudget') },
              { value: 'planning', label: t('approvals.typePlanning') },
              { value: 'proposal', label: t('approvals.typeProposal') },
            ],
          },
          {
            key: 'levelFilter',
            label: t('approvals.allLevels'),
            icon: '🛡️',
            type: 'single',
            options: [
              { value: '1', label: 'Level 1' },
              { value: '2', label: 'Level 2' },
            ],
          },
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => {
          setMobileFilterValues(prev => ({ ...prev, [key]: value }));
          if (key === 'entityFilter') setEntityFilter(value ? String(value) : 'all');
          if (key === 'levelFilter') setLevelFilter(value ? String(value) : 'all');
        }}
        onApply={closeFilterSheet}
        onReset={() => {
          setMobileFilterValues({});
          setSearchTerm('');
          setEntityFilter('all');
          setLevelFilter('all');
        }}
      />
    </div>
  );
};

export default ApprovalsScreen;
