'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck, CheckCircle, XCircle, Clock, Loader2,
  Filter, Search, ChevronDown, Eye, MessageSquare,
  X, AlertTriangle, Shield, ArrowUpRight
} from 'lucide-react';
import { approvalService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '../utils';
import { ExpandableStatCard } from '../components/Common';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const STATUS_CONFIG = {
  SUBMITTED: { color: '#D29922', bg: 'rgba(210,153,34,0.12)', label: 'Pending L1' },
  LEVEL1_APPROVED: { color: '#58A6FF', bg: 'rgba(88,166,255,0.12)', label: 'Pending L2' },
  LEVEL2_APPROVED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Approved' },
  APPROVED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Approved' },
  LEVEL1_REJECTED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Rejected' },
  LEVEL2_REJECTED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Rejected' },
  REJECTED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Rejected' },
};

const ENTITY_ICONS = {
  budget: '💰',
  planning: '📊',
  proposal: '📦',
};

/* ═══════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════ */
const ApprovalsScreen = ({ darkMode }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [actionModal, setActionModal] = useState(null); // { item, action: 'approve'|'reject' }
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

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
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
      setError(t('approvals.failedToLoad'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle approve/reject
  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      const { item, action } = actionModal;
      if (action === 'approve') {
        await approvalService.approve(item.entityType, item.entityId, item.level, comment);
      } else {
        await approvalService.reject(item.entityType, item.entityId, item.level, comment);
      }
      setActionModal(null);
      setComment('');
      fetchPendingApprovals();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (entityFilter !== 'all' && item.entityType !== entityFilter) return false;
      if (levelFilter !== 'all' && item.level !== parseInt(levelFilter)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const name = (item.data?.name || item.data?.budgetName || '').toLowerCase();
        const brand = (item.data?.brand?.name || item.data?.brandName || '').toLowerCase();
        return name.includes(term) || brand.includes(term);
      }
      return true;
    });
  }, [items, entityFilter, levelFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const l1 = items.filter(i => i.level === 1).length;
    const l2 = items.filter(i => i.level === 2).length;
    const budgets = items.filter(i => i.entityType === 'budget').length;
    const plannings = items.filter(i => i.entityType === 'planning').length;
    const proposals = items.filter(i => i.entityType === 'proposal').length;

    return {
      total, l1, l2, budgets, plannings, proposals,
      entityBreakdown: [
        { label: t('approvals.typeBudget'), value: budgets, color: '#D7B797' },
        { label: t('approvals.typePlanning'), value: plannings, color: '#58A6FF' },
        { label: t('approvals.typeProposal'), value: proposals, color: '#2A9E6A' },
      ].filter(b => b.value > 0),
      levelBreakdown: [
        { label: 'Level 1', value: l1, color: '#58A6FF' },
        { label: 'Level 2', value: l2, color: '#A371F7' },
      ].filter(b => b.value > 0),
      l1Pct: total > 0 ? Math.round((l1 / total) * 100) : 0,
      l2Pct: total > 0 ? Math.round((l2 / total) * 100) : 0,
      budgetPct: total > 0 ? Math.round((budgets / total) * 100) : 0,
    };
  }, [items, t]);

  const bg = darkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-[#121212]' : 'bg-white';
  const border = darkMode ? 'border-[#2E2E2E]' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-[#999999]' : 'text-gray-600';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bg} p-4`}>
      {/* Compact Header + Filters */}
      <div className={`border ${border} rounded-xl px-3 py-2 mb-3`} style={{
        background: darkMode
          ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.03) 40%, rgba(215,183,151,0.10) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.04) 35%, rgba(215,183,151,0.12) 100%)',
        boxShadow: `inset 0 -1px 0 ${darkMode ? 'rgba(215,183,151,0.08)' : 'rgba(215,183,151,0.05)'}`,
      }}>
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-[rgba(215,183,151,0.15)]'}`}>
            <FileCheck size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#8A6340]'} />
          </div>
          <div className="flex-shrink-0">
            <h1 className={`text-sm font-semibold font-['Montserrat'] ${textPrimary} leading-tight`}>
              {t('screenConfig.approvals')}
            </h1>
            <p className={`text-[10px] ${textMuted} leading-tight`}>
              {t('approvals.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} w-48`}>
              <Search size={12} className={textMuted} />
              <input
                type="text"
                placeholder={t('approvals.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                onChange={(e) => setEntityFilter(e.target.value)}
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
                onChange={(e) => setLevelFilter(e.target.value)}
                className={`appearance-none px-2 py-1 pr-6 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} text-xs font-['Montserrat'] ${textPrimary} outline-none cursor-pointer`}
              >
                <option value="all">{t('approvals.allLevels')}</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
              </select>
              <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
            </div>

            <button
              onClick={fetchPendingApprovals}
              className={`px-2.5 py-1 rounded-lg border ${border} text-xs font-medium font-['Montserrat'] transition-all ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]' : 'text-[#8A6340] hover:bg-[rgba(215,183,151,0.1)]'}`}
            >
              {t('common.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
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
          ].filter(b => b.value > 0)}
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
            <Loader2 size={32} className="animate-spin text-[#D7B797]" />
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} border-b ${border}`}>
                  {[t('approvals.colType'), t('approvals.colName'), t('approvals.colBrand'), t('approvals.colLevel'), t('approvals.colStatus'), t('approvals.colSubmitted'), t('common.actions')].map((h) => (
                    <th key={h} className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const status = item.data?.status || 'SUBMITTED';
                  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
                  const name = item.data?.name || item.data?.budgetName || `${item.entityType} #${item.entityId}`;
                  const brand = item.data?.brand?.name || item.data?.brandName || '-';

                  return (
                    <tr
                      key={`${item.entityType}-${item.entityId}-${idx}`}
                      className={`border-b ${border} transition-colors ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-50'}`}
                    >
                      {/* Type */}
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{ENTITY_ICONS[item.entityType] || '📋'}</span>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setActionModal({ item, action: 'approve' }); setComment(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(42,158,106,0.12)] text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.2)]"
                          >
                            <CheckCircle size={13} />
                            {t('approvals.approve')}
                          </button>
                          <button
                            onClick={() => { setActionModal({ item, action: 'reject' }); setComment(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(248,81,73,0.1)] text-[#F85149] hover:bg-[rgba(248,81,73,0.18)]"
                          >
                            <XCircle size={13} />
                            {t('approvals.reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} shadow-2xl`} style={{
            background: darkMode
              ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.04) 40%, rgba(215,183,151,0.12) 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.05) 35%, rgba(215,183,151,0.14) 100%)',
            boxShadow: `inset 0 -1px 0 ${darkMode ? 'rgba(215,183,151,0.10)' : 'rgba(215,183,151,0.06)'}`,
          }}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-['Montserrat'] ${textPrimary}`}>
                  {actionModal.action === 'approve' ? t('approvals.confirmApprove') : t('approvals.confirmReject')}
                </h3>
                <button onClick={() => setActionModal(null)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-100'}`}>
                  <X size={18} className={textMuted} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <div className={`text-sm ${textSecondary}`}>
                  {ENTITY_ICONS[actionModal.item.entityType]} <span className="capitalize font-medium">{actionModal.item.entityType}</span>
                  {' — '}
                  <span className={textPrimary}>{actionModal.item.data?.name || actionModal.item.data?.budgetName || `#${actionModal.item.entityId}`}</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>
                  {t('approvals.commentOptional')}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} text-sm font-['Montserrat'] ${textPrimary} outline-none resize-none focus:border-[#D7B797]`}
                  placeholder={t('approvals.commentPlaceholder')}
                />
              </div>
            </div>
            <div className={`p-5 border-t ${border} flex justify-end gap-3`}>
              <button
                onClick={() => setActionModal(null)}
                className={`px-4 py-2 rounded-xl border ${border} text-sm font-medium font-['Montserrat'] ${textSecondary} transition-all ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-100'}`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`px-5 py-2 rounded-xl text-sm font-semibold font-['Montserrat'] transition-all disabled:opacity-50 ${
                  actionModal.action === 'approve'
                    ? 'bg-[#2A9E6A] text-white hover:bg-[#238a5a]'
                    : 'bg-[#F85149] text-white hover:bg-[#e04440]'
                }`}
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : actionModal.action === 'approve' ? t('approvals.approve') : t('approvals.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsScreen;
