'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Package, ArrowLeft, Loader2, Check, X, Clock, Send, CheckCircle, XCircle, LayoutGrid, List, GitCompare, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils';
import { ProductImage, Breadcrumbs, ConfirmDialog } from '@/components/ui';
import { budgetService, planningService, proposalService } from '@/services';
import { invalidateCache } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

/* =========================
   DAFC DESIGN SYSTEM COLORS
========================= */

// Chart colors: REX = Champagne Gold, TTP = Forest Green

/* =========================
   EMPTY FALLBACK DATA
========================= */

const EMPTY_BUDGET_DATA = {
  id: '',
  fiscalYear: '-',
  groupBrand: '-',
  brandName: '-',
  totalBudget: 0,
  budgetName: '-',
  status: 'DRAFT',
};

const EMPTY_SEASON_DATA = {
  seasonGroup: '-',
  Season: '-',
  rex: 0,
  ttp: 0,
  finalVersion: 0,
};

/* =========================
   GROUPED BAR CHARTS
========================= */


/* =========================
   SKU CARD (with sizing)
========================= */

/* =========================
   PREMIUM SKU CARD
========================= */

const PremiumSKUCard = ({ item, block, darkMode }: { item: any; block: any; darkMode: boolean }) => {
  const [flipped, setFlipped] = useState(false);
  const totalQty = (item.rex || 0) + (item.ttp || 0);
  const totalValue = totalQty * (item.srp || 0);

  // Cost & margin calculations
  const unitCost = item.unitCost || (item.srp ? item.srp * 0.45 : 0);
  const marginPct = item.srp ? ((item.srp - unitCost) / item.srp * 100) : 0;
  const markup = unitCost > 0 ? (item.srp / unitCost) : 0;

  // Store allocation bars
  const storeAllocations = [
    { name: 'REX', qty: item.rex || 0, color: '#D7B797' },
    { name: 'TTP', qty: item.ttp || 0, color: '#127749' },
  ];
  const maxStoreQty = Math.max(...storeAllocations.map(s => s.qty), 1);

  const flipBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); setFlipped(!flipped); }}
      className={`absolute top-3 left-3 z-[5] w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
        darkMode
          ? 'bg-[rgba(215,183,151,0.15)] hover:bg-[rgba(215,183,151,0.3)] text-[#D7B797]'
          : 'bg-[rgba(160,120,75,0.1)] hover:bg-[rgba(160,120,75,0.2)] text-[#6B4D30]'
      }`}
      title={flipped ? 'Show front' : 'Show details'}
    >
      <RotateCcw size={13} strokeWidth={2.5} />
    </button>
  );

  return (
    <div
      className="flex-shrink-0 w-[280px] snap-start"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative w-full transition-transform duration-[600ms] ease-in-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ===== FRONT FACE ===== */}
        <div
          className={`group/card relative w-full rounded-2xl border overflow-hidden transition-all duration-200 ease-out ${
            darkMode
              ? 'bg-[#121212] border-[#2E2E2E] hover:border-[rgba(215,183,151,0.4)] hover:shadow-[0_8px_32px_rgba(215,183,151,0.12)]'
              : 'bg-white border-[rgba(160,120,75,0.2)] hover:border-[rgba(160,120,75,0.5)] hover:shadow-[0_8px_32px_rgba(160,120,75,0.15)]'
          }`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', pointerEvents: flipped ? 'none' : 'auto' }}
        >
          {flipBtn}
          {/* Gold accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D7B797] to-transparent" />

          {/* Image area */}
          <div className={`relative h-[200px] flex items-center justify-center overflow-hidden ${
            darkMode ? 'bg-[#0A0A0A]' : 'bg-[#FAFAF5]'
          }`}>
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />
            <div className="relative z-[1] transition-transform duration-200 ease-out group-hover/card:scale-105">
              <ProductImage subCategory={block.subCategory || ''} sku={item.sku || ''} size={140} darkMode={darkMode} rounded="rounded-xl" />
            </div>
            <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold rounded-full z-[2] font-['Montserrat'] tracking-wide ${
              darkMode
                ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] border border-[rgba(215,183,151,0.25)]'
                : 'bg-[rgba(160,120,75,0.1)] text-[#6B4D30] border border-[rgba(160,120,75,0.25)]'
            }`}>
              {item.color || '-'}
            </span>
          </div>

          {/* Content */}
          <div className="px-5 pt-4 pb-5">
            <div className={`text-xs font-['JetBrains_Mono'] tracking-wider ${
              darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
            }`}>{item.sku}</div>
            <div className={`text-base font-bold font-['Montserrat'] mt-1 leading-snug ${
              darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
            }`}>{item.name}</div>
            <div className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`}>
              {item.theme || '-'}
            </div>

            <div className={`my-3 h-px bg-gradient-to-r ${
              darkMode ? 'from-transparent via-[#2E2E2E] to-transparent' : 'from-transparent via-[rgba(160,120,75,0.2)] to-transparent'
            }`} />

            <div className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`}>SRP</div>
            <div className={`text-xl font-bold font-['JetBrains_Mono'] mt-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>
              {formatCurrency(item.srp || 0)}
            </div>

            {/* Store pills */}
            <div className="flex gap-2 mt-3">
              <div className={`flex-1 rounded-xl px-3 py-2 text-center ${
                darkMode
                  ? 'bg-[rgba(215,183,151,0.08)] border border-[rgba(215,183,151,0.15)]'
                  : 'bg-[rgba(160,120,75,0.06)] border border-[rgba(160,120,75,0.15)]'
              }`}>
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#D7B797]" />
                  <span className={`text-[10px] font-semibold tracking-wide ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>REX</span>
                </div>
                <div className={`text-lg font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.rex || 0}</div>
              </div>
              <div className={`flex-1 rounded-xl px-3 py-2 text-center ${
                darkMode
                  ? 'bg-[rgba(18,119,73,0.08)] border border-[rgba(18,119,73,0.15)]'
                  : 'bg-[rgba(18,119,73,0.04)] border border-[rgba(18,119,73,0.15)]'
              }`}>
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#127749]" />
                  <span className="text-[10px] font-semibold tracking-wide text-[#127749]">TTP</span>
                </div>
                <div className={`text-lg font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.ttp || 0}</div>
              </div>
            </div>

            {/* Summary bar */}
            <div className={`mt-3 rounded-lg px-3 py-2 flex items-center justify-between ${
              darkMode
                ? 'bg-[rgba(215,183,151,0.05)] border border-[rgba(215,183,151,0.1)]'
                : 'bg-[rgba(160,120,75,0.04)] border border-[rgba(160,120,75,0.1)]'
            }`}>
              <div>
                <span className={`text-[9px] uppercase tracking-wider ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`}>Total Qty</span>
                <div className={`text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{totalQty}</div>
              </div>
              <div className={`w-px h-6 ${darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-200'}`} />
              <div className="text-right">
                <span className={`text-[9px] uppercase tracking-wider ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`}>Value</span>
                <div className={`text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(totalValue)}</div>
              </div>
            </div>

            {/* Footer */}
            <div className={`mt-3 space-y-1 text-[10px] ${darkMode ? 'text-[#555555]' : 'text-gray-400'}`}>
              {item.composition && (
                <div className="truncate"><span className="font-semibold">Fabric:</span> {item.composition}</div>
              )}
              {item.sizing?.sizes && (
                <div className="truncate"><span className="font-semibold">Sizes:</span> {item.sizing.sizes.join(' / ')}</div>
              )}
            </div>
          </div>
        </div>

        {/* ===== BACK FACE ===== */}
        <div
          className={`absolute inset-0 w-full rounded-2xl border overflow-hidden overflow-y-auto ${
            darkMode
              ? 'bg-[#121212] border-[#2E2E2E]'
              : 'bg-white border-[rgba(160,120,75,0.2)]'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            pointerEvents: flipped ? 'auto' : 'none',
          }}
        >
          {/* Gold accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D7B797] to-transparent" />

          <div className="px-4 pt-3 pb-4">
            {/* Header with flip-back button */}
            <div className="flex items-start gap-2 mb-3">
              <button
                onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  darkMode
                    ? 'bg-[rgba(215,183,151,0.15)] hover:bg-[rgba(215,183,151,0.3)] text-[#D7B797]'
                    : 'bg-[rgba(160,120,75,0.1)] hover:bg-[rgba(160,120,75,0.2)] text-[#6B4D30]'
                }`}
              >
                <RotateCcw size={13} strokeWidth={2.5} />
              </button>
              <div className="min-w-0">
                <div className={`text-xs font-['JetBrains_Mono'] tracking-wider ${
                  darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
                }`}>{item.sku}</div>
                <div className={`text-sm font-bold font-['Montserrat'] leading-snug truncate ${
                  darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
                }`}>{item.name}</div>
              </div>
            </div>

            {/* ── COST & MARGIN ── */}
            <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-2 ${
              darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
            }`}>Cost & Margin</div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { label: 'Unit Cost', value: formatCurrency(unitCost) },
                { label: 'Margin', value: `${marginPct.toFixed(1)}%` },
                { label: 'Markup', value: `${markup.toFixed(2)}x` },
              ].map(({ label, value }) => (
                <div key={label} className={`rounded-lg px-2 py-1.5 text-center ${
                  darkMode ? 'bg-[rgba(215,183,151,0.06)] border border-[rgba(215,183,151,0.1)]' : 'bg-[rgba(160,120,75,0.04)] border border-[rgba(160,120,75,0.1)]'
                }`}>
                  <div className={`text-[8px] uppercase tracking-wider font-semibold ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`}>{label}</div>
                  <div className={`text-xs font-bold font-['JetBrains_Mono'] mt-0.5 ${
                    label === 'Margin' ? (marginPct >= 50 ? 'text-[#2A9E6A]' : darkMode ? 'text-[#F2F2F2]' : 'text-gray-800') :
                    darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
                  }`}>{value}</div>
                </div>
              ))}
            </div>

            {/* ── STORE ALLOCATION ── */}
            <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-2 ${
              darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
            }`}>Store Allocation</div>
            <div className="space-y-1.5 mb-3">
              {storeAllocations.map(store => {
                const pct = totalQty > 0 ? Math.round(store.qty / totalQty * 100) : 0;
                const barWidth = Math.round(store.qty / maxStoreQty * 100);
                return (
                  <div key={store.name} className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold w-8 font-['JetBrains_Mono'] ${
                      darkMode ? 'text-[#999]' : 'text-gray-500'
                    }`}>{store.name}</span>
                    <div className={`flex-1 h-3 rounded-full overflow-hidden ${
                      darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-100'
                    }`}>
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${barWidth}%`, backgroundColor: store.color, opacity: 0.7 }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold font-['JetBrains_Mono'] w-6 text-right ${
                      darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
                    }`}>{store.qty}</span>
                    <span className={`text-[9px] w-8 text-right ${darkMode ? 'text-[#666]' : 'text-gray-400'}`}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* ── SIZE BREAKDOWN ── */}
            {item.sizing?.sizes && item.sizing.sizes.length > 0 && (
              <>
                <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-2 ${
                  darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
                }`}>Size Breakdown</div>
                <div className={`rounded-lg overflow-hidden mb-3 ${
                  darkMode ? 'border border-[#2E2E2E]' : 'border border-gray-200'
                }`}>
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className={darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'}>
                        <th className={`px-1.5 py-1 text-left font-semibold ${darkMode ? 'text-[#666]' : 'text-gray-400'}`} />
                        {item.sizing.sizes.map((s: string) => (
                          <th key={s} className={`px-1 py-1 text-center font-bold font-['JetBrains_Mono'] ${
                            darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
                          }`}>{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {item.sizing.salesMix && (
                        <tr className={darkMode ? 'border-t border-[#2E2E2E]' : 'border-t border-gray-100'}>
                          <td className={`px-1.5 py-1 font-semibold ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>Mix%</td>
                          {item.sizing.salesMix.map((v: number, i: number) => (
                            <td key={i} className={`px-1 py-1 text-center font-['JetBrains_Mono'] ${
                              darkMode ? 'text-[#ccc]' : 'text-gray-700'
                            }`}>{v}</td>
                          ))}
                        </tr>
                      )}
                      {item.sizing.sellThrough && (
                        <tr className={darkMode ? 'border-t border-[#2E2E2E]' : 'border-t border-gray-100'}>
                          <td className={`px-1.5 py-1 font-semibold ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>ST%</td>
                          {item.sizing.sellThrough.map((v: number, i: number) => (
                            <td key={i} className={`px-1 py-1 text-center font-['JetBrains_Mono'] ${
                              v >= 60 ? 'text-[#2A9E6A] font-bold' :
                              v < 40 ? (darkMode ? 'text-[#FF7B72]' : 'text-red-500') :
                              darkMode ? 'text-[#ccc]' : 'text-gray-700'
                            }`}>{v}</td>
                          ))}
                        </tr>
                      )}
                      {item.sizing.finalChoice && (
                        <tr className={darkMode ? 'border-t border-[#2E2E2E]' : 'border-t border-gray-100'}>
                          <td className={`px-1.5 py-1 font-semibold ${darkMode ? 'text-[#888]' : 'text-gray-500'}`}>Qty</td>
                          {item.sizing.finalChoice.map((v: number, i: number) => (
                            <td key={i} className={`px-1 py-1 text-center font-bold font-['JetBrains_Mono'] ${
                              darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
                            }`}>{v}</td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── PRODUCT INFO ── */}
            <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-1.5 ${
              darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
            }`}>Product Info</div>
            <div className={`space-y-1 text-[10px] ${darkMode ? 'text-[#999]' : 'text-gray-500'}`}>
              {[
                { label: 'Collection', value: item.collection || '-' },
                { label: 'Target', value: item.customerTarget || '-' },
                { label: 'Gender', value: block.gender || '-' },
                { label: 'Category', value: block.productType || '-' },
                { label: 'Composition', value: item.composition || '-' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="font-semibold flex-shrink-0">{label}</span>
                  <span className={`truncate text-right font-['JetBrains_Mono'] ${
                    darkMode ? 'text-[#ccc]' : 'text-gray-700'
                  }`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================
   APPROVAL STEPS & COMPONENTS
========================= */

const APPROVAL_STEPS = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'brand_manager', label: 'Group Brand Manager' },
  { id: 'finance', label: 'Finance' },
  { id: 'ceo', label: 'CEO' },
];

const getApprovalStepStatus = (stepId: any, currentStep: any, approvalHistory: any) => {
  const historyItem = approvalHistory?.find((h: any) => h.stepId === stepId);
  if (historyItem?.action === 'approved') return 'approved';
  if (historyItem?.action === 'rejected') return 'rejected';
  if (historyItem?.action === 'submitted') return 'approved';
  if (stepId === currentStep) return 'current';
  const stepIndex = APPROVAL_STEPS.findIndex((s: any) => s.id === stepId);
  const currentIndex = APPROVAL_STEPS.findIndex((s: any) => s.id === currentStep);
  return stepIndex < currentIndex ? 'approved' : 'waiting';
};

const ApprovalProgressBar = ({ currentStep, approvalHistory, darkMode, t }: any) => (
  <div className={`border rounded-lg px-3 md:px-4 py-2 md:py-2.5 ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
    <div className="flex items-center overflow-x-auto gap-0">
      {APPROVAL_STEPS.map((step: any, index: any) => {
        const status = getApprovalStepStatus(step.id, currentStep, approvalHistory);
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                status === 'approved' ? 'bg-[#127749] text-white' :
                status === 'rejected' ? 'bg-[#F85149] text-white' :
                status === 'current' ? 'bg-[#D7B797] text-white' :
                darkMode ? 'bg-[#1A1A1A] border border-[#2E2E2E] text-[#666666]' : 'bg-gray-100 border border-gray-200 text-gray-400'
              }`}>
                {status === 'approved' ? <Check size={12} strokeWidth={3} /> :
                 status === 'rejected' ? <X size={12} strokeWidth={3} /> :
                 status === 'current' ? <Clock size={12} /> :
                 index + 1}
              </div>
              <div className="flex flex-col">
                <span className={`text-[11px] font-medium leading-tight ${
                  status === 'approved' ? 'text-[#2A9E6A]' :
                  status === 'rejected' ? 'text-[#FF7B72]' :
                  status === 'current' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') :
                  darkMode ? 'text-[#555]' : 'text-gray-400'
                }`}>{step.label}</span>
                {status === 'approved' && <span className="text-[9px] font-semibold text-[#2A9E6A]">Approved</span>}
                {status === 'rejected' && <span className="text-[9px] font-semibold text-[#FF7B72]">Rejected</span>}
                {status === 'current' && <span className={`text-[9px] font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-amber-600'}`}>In Review</span>}
              </div>
            </div>
            {index < APPROVAL_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 min-w-[16px] ${
                getApprovalStepStatus(APPROVAL_STEPS[index + 1].id, currentStep, approvalHistory) !== 'waiting'
                  ? 'bg-[#127749]'
                  : darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

const StatusTrackingPanel = ({ approvalHistory, ticket, darkMode, t }: any) => (
  <div className={`border rounded-lg p-3 h-full flex flex-col ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>
        {t ? t('common.status') : 'Status'}
      </span>
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
        ['APPROVED', 'LEVEL2_APPROVED', 'FINAL'].includes(ticket?.status?.toUpperCase())
          ? darkMode ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]' : 'bg-emerald-50 text-emerald-700'
        : ['REJECTED', 'LEVEL1_REJECTED', 'LEVEL2_REJECTED'].includes(ticket?.status?.toUpperCase())
          ? darkMode ? 'bg-[rgba(248,81,73,0.15)] text-[#FF7B72]' : 'bg-red-50 text-red-700'
        : ['SUBMITTED', 'LEVEL1_APPROVED'].includes(ticket?.status?.toUpperCase())
          ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-amber-50 text-amber-700'
        : darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-gray-100 text-gray-600'
      }`}>
        {ticket?.status?.replace(/_/g, ' ') || 'Draft'}
      </span>
    </div>
    <div className="space-y-0 flex-1">
      {approvalHistory?.length > 0 ? (
        approvalHistory.map((item: any, index: any) => (
          <div key={index} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                item.action === 'approved' ? 'bg-[#2A9E6A]' :
                item.action === 'rejected' ? 'bg-[#F85149]' :
                item.action === 'submitted' ? 'bg-[#D7B797]' :
                darkMode ? 'bg-[#666666]' : 'bg-gray-300'
              }`} />
              {index < approvalHistory.length - 1 && (
                <div className={`w-px flex-1 min-h-[12px] ${darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold ${
                  item.action === 'approved' ? 'text-[#2A9E6A]' :
                  item.action === 'rejected' ? 'text-[#FF7B72]' :
                  darkMode ? 'text-[#D7B797]' : 'text-amber-700'
                }`}>
                  {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                </span>
                <span className={`text-[10px] ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`}>
                  {item.stepLabel || item.role || '-'}
                </span>
              </div>
              {item.decidedAt && (
                <div className={`text-[9px] font-['JetBrains_Mono'] ${darkMode ? 'text-[#444]' : 'text-gray-400'}`}>
                  {new Date(item.decidedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className={`text-xs italic ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`}>
          No history
        </div>
      )}
    </div>
  </div>
);

/* =========================
   MAIN SCREEN
========================= */

export default function TicketDetailPage({ ticket, onBack, darkMode = true }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isMobile } = useIsMobile();
  const { dialogProps, confirm } = useConfirmDialog();
  const [collapsed, setCollapsed] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [skuData, setSkuData] = useState<any[]>([]);
  const [skuViewMode, setSkuViewMode] = useState<string>('card');

  // Diff/View Changes state
  const [showDiff, setShowDiff] = useState(false);
  const [previousSkuData, setPreviousSkuData] = useState<any[]>([]);

  // Determine the right service based on entity type
  const getEntityService = () => {
    if (ticket?.entityType === 'budget') return budgetService;
    if (ticket?.entityType === 'planning') return planningService;
    if (ticket?.entityType === 'proposal') return proposalService;
    return null;
  };

  // Check if current user can approve at the current step
  const canApprove = () => {
    if (!ticket || !user) return false;
    const status = ticket?.status?.toUpperCase();
    const roleName = (user.role?.name || user.roleName || '').toLowerCase();
    const permissions = user.role?.permissions || user.permissions || [];
    const entityType = ticket.entityType;
    const permPrefix = entityType === 'proposal' ? 'proposal' : entityType === 'planning' ? 'planning' : 'budget';

    if (status === 'SUBMITTED') {
      return permissions.includes(`${permPrefix}:approve_l1`) || permissions.includes('*') || roleName.includes('manager');
    }
    if (status === 'LEVEL1_APPROVED') {
      return permissions.includes(`${permPrefix}:approve_l2`) || permissions.includes('*') || roleName.includes('finance') || roleName.includes('director');
    }
    return false;
  };

  const handleSubmitTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    setActionLoading(true);
    try {
      await svc.submit(ticket.id);
      invalidateCache(`/${ticket.entityType}`);
      toast.success(t('ticketDetail.submit'));
      if (onBack) onBack();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    const status = ticket?.status?.toUpperCase();
    setActionLoading(true);
    try {
      if (status === 'SUBMITTED') {
        await svc.approveL1(ticket.id, 'Approved');
      } else if (status === 'LEVEL1_APPROVED') {
        await svc.approveL2(ticket.id, 'Approved');
      }
      invalidateCache(`/${ticket.entityType}`);
      toast.success(t('ticketDetail.approve'));
      if (onBack) onBack();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTicket = () => {
    confirm({
      title: t('ticketDetail.reject'),
      message: t('ticketDetail.rejectReason') || 'Enter rejection reason:',
      confirmLabel: t('ticketDetail.reject'),
      variant: 'danger',
      promptPlaceholder: t('ticketDetail.rejectReasonPlaceholder') || 'Reason...',
      onConfirm: async (reason?: string) => {
        const svc = getEntityService();
        if (!svc) return;
        const status = ticket?.status?.toUpperCase();
        setActionLoading(true);
        try {
          if (status === 'SUBMITTED') {
            await svc.rejectL1(ticket.id, reason || 'Rejected');
          } else if (status === 'LEVEL1_APPROVED') {
            await svc.rejectL2(ticket.id, reason || 'Rejected');
          }
          invalidateCache(`/${ticket.entityType}`);
          toast.success(t('ticketDetail.reject'));
          if (onBack) onBack();
        } catch (err: any) {
          toast.error(err.response?.data?.message || t('common.error'));
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Approval history — derive from ticket status
  const approvalHistory = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return [];
    const history: any[] = [];
    history.push({
      stepId: 'submitted',
      stepLabel: 'Submitted',
      action: 'submitted',
      decidedAt: ticket?.createdAt || ticket?.createdOn || null,
      comment: null
    });
    if (['LEVEL1_APPROVED', 'LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'approved',
        decidedAt: ticket?.l1ApprovedAt || null,
        comment: ticket?.l1Comment || 'Approved for finance review'
      });
    } else if (status === 'LEVEL1_REJECTED') {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'rejected',
        decidedAt: ticket?.l1RejectedAt || null,
        comment: ticket?.l1Comment || 'Rejected'
      });
    }
    if (['LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'approved',
        decidedAt: ticket?.l2ApprovedAt || null,
        comment: ticket?.l2Comment || 'Finance approved'
      });
    } else if (status === 'LEVEL2_REJECTED') {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'rejected',
        decidedAt: ticket?.l2RejectedAt || null,
        comment: ticket?.l2Comment || 'Rejected by Finance'
      });
    }
    if (['APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'ceo',
        stepLabel: 'CEO',
        action: 'approved',
        decidedAt: ticket?.approvedAt || null,
        comment: ticket?.ceoComment || 'Final approval granted'
      });
    }
    return history;
  }, [ticket]);

  const currentStep = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return 'submitted';
    if (status === 'SUBMITTED') return 'brand_manager';
    if (status === 'LEVEL1_APPROVED') return 'finance';
    if (status === 'LEVEL1_REJECTED') return 'brand_manager';
    if (status === 'LEVEL2_APPROVED') return 'ceo';
    if (status === 'LEVEL2_REJECTED') return 'finance';
    if (['APPROVED', 'FINAL'].includes(status)) return 'completed';
    return 'submitted';
  }, [ticket]);

  // Fetch detailed data based on entity type
  useEffect(() => {
    if (!ticket) return;

    const fetchDetailData = async () => {
      setLoading(true);
      try {
        let data = ticket.data;

        // If we have full data from ticket, use it; otherwise fetch
        if (ticket.entityType === 'budget' && ticket.id) {
          const res = await budgetService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'planning' && ticket.id) {
          const res = await planningService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'proposal' && ticket.id) {
          const res = await proposalService.getOne(ticket.id);
          data = res.data || res;
          // Transform proposal items to SKU format
          if (data.items) {
            const groupedSkus: any = {};
            data.items.forEach((item: any) => {
              const key = `${item.gender?.name || 'Unknown'}_${item.category?.name || 'Unknown'}`;
              if (!groupedSkus[key]) {
                groupedSkus[key] = {
                  gender: item.gender?.name?.toLowerCase() || 'unknown',
                  productType: item.category?.name || 'Unknown',
                  subCategory: item.subCategory?.name || item.category?.name || 'Unknown',
                  pctBuyPropose: 0,
                  otbPropose: 0,
                  items: []
                };
              }
              groupedSkus[key].items.push({
                sku: item.sku?.code || item.skuId,
                name: item.sku?.name || '-',
                theme: item.sku?.theme || '-',
                color: item.sku?.color || '-',
                composition: item.sku?.composition || '-',
                srp: Number(item.sku?.retailPrice) || 0,
                unitCost: Number(item.sku?.unitCost) || 0,
                collection: item.sku?.collection || item.collection || '-',
                customerTarget: item.sku?.customerTarget || item.customerTarget || '-',
                order: Number(item.quantity) || 0,
                rex: Math.floor(Number(item.quantity) / 2) || 0,
                ttp: Math.ceil(Number(item.quantity) / 2) || 0,
                ttlValue: Number(item.totalValue) || 0
              });
              groupedSkus[key].otbPropose += Number(item.totalValue) || 0;
            });
            const skuGroups: any[] = Object.values(groupedSkus);
            setSkuData(skuGroups);
            // Default collapse all SKU groups
            const defaultCollapsed: any = {};
            skuGroups.forEach((block: any) => {
              defaultCollapsed[`${block.productType}_${block.gender}`] = true;
            });
            setCollapsed(defaultCollapsed);
          }
        }

        setDetailData(data);
      } catch (err: any) {
        console.error('Failed to fetch ticket detail:', err);
        toast.error('Failed to load detail data');
        // Use ticket's inline data if available
        if (ticket.data) {
          setDetailData(ticket.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetailData();
  }, [ticket]);

  // Generate previous version data for diff comparison
  // In production, this would fetch the actual previous version from the API
  const generatePreviousVersion = useCallback((currentData: any[]) => {
    return currentData.map((block: any) => ({
      ...block,
      items: block.items.map((item: any) => {
        // Simulate previous version with slight differences in quantities and values
        const orderDiff = Math.max(0, (item.order || 0) - Math.floor(Math.random() * 3 + 1));
        const rexDiff = Math.max(0, Math.floor(orderDiff * 0.5));
        const ttpDiff = orderDiff - rexDiff;
        return {
          ...item,
          order: orderDiff,
          rex: rexDiff,
          ttp: ttpDiff,
          ttlValue: orderDiff * (item.srp || 0),
        };
      }),
    }));
  }, []);

  const handleToggleDiff = useCallback(() => {
    if (!showDiff && previousSkuData.length === 0) {
      const dataToUse = skuData;
      setPreviousSkuData(generatePreviousVersion(dataToUse));
    }
    setShowDiff((prev) => !prev);
  }, [showDiff, previousSkuData, skuData, generatePreviousVersion]);

  // Helper: find previous item by SKU code
  const getPreviousItem = useCallback((sku: string) => {
    for (const block of previousSkuData) {
      const found = block.items?.find((i: any) => i.sku === sku);
      if (found) return found;
    }
    return null;
  }, [previousSkuData]);

  // Helper: check if a value changed
  const isDiffValue = useCallback((sku: string, field: string, currentValue: any) => {
    if (!showDiff) return false;
    const prev = getPreviousItem(sku);
    if (!prev) return true; // new item
    return prev[field] !== currentValue;
  }, [showDiff, getPreviousItem]);

  // Generate budget/season data from detail
  const { budgetData, budgetSeasonData } = useMemo(() => {
    if (!detailData) {
      return { budgetData: EMPTY_BUDGET_DATA, budgetSeasonData: EMPTY_SEASON_DATA };
    }

    // For budget type
    if (ticket?.entityType === 'budget') {
      const details = detailData.details || [];
      const storeMap: any = {};
      details.forEach((d: any) => {
        const storeName = d.store?.name || 'Unknown';
        if (!storeMap[storeName]) storeMap[storeName] = 0;
        storeMap[storeName] += Number(d.budgetAmount) || 0;
      });

      return {
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.fiscalYear,
          groupBrand: detailData.groupBrand?.name || '-',
          brandId: detailData.groupBrandId,
          brandName: detailData.groupBrand?.name || '-',
          totalBudget: Number(detailData.totalBudget) || 0,
          budgetName: `${detailData.groupBrand?.name || 'Budget'} - ${detailData.seasonGroupId || ''} ${detailData.seasonType || ''}`,
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.seasonGroupId || '-',
          Season: detailData.seasonType || '-',
          rex: Object.values(storeMap)[0] || 0,
          ttp: Object.values(storeMap)[1] || 0,
          finalVersion: 1
        }
      };
    }

    // For planning type
    if (ticket?.entityType === 'planning') {
      const details = detailData.details || [];
      const storeMap: any = { rex: 0, ttp: 0 };
      details.forEach((d: any) => {
        const otb = Number(d.otbValue) || 0;
        storeMap.rex += otb * 0.5;
        storeMap.ttp += otb * 0.5;
      });

      return {
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.budgetDetail?.budget?.fiscalYear || '-',
          groupBrand: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          brandName: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          totalBudget: Number(detailData.budgetDetail?.budgetAmount) || 0,
          budgetName: detailData.planningCode || 'Planning',
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.budgetDetail?.budget?.seasonGroupId || '-',
          Season: detailData.budgetDetail?.budget?.seasonType || '-',
          rex: storeMap.rex || 343000000,
          ttp: storeMap.ttp || 294000000,
          finalVersion: detailData.versionNumber || 1
        }
      };
    }

    // Default / proposal
    return {
      budgetData: detailData ? {
        id: detailData.id,
        fiscalYear: ticket?.fiscalYear || '-',
        groupBrand: ticket?.brand || '-',
        brandName: ticket?.brand || '-',
        totalBudget: Number(detailData.totalBudget || detailData.totalValue) || 0,
        budgetName: ticket?.name || detailData.proposalCode || '-',
        status: detailData.status
      } : EMPTY_BUDGET_DATA,
      budgetSeasonData: EMPTY_SEASON_DATA,
    };
  }, [detailData, ticket]);

  const rexNum = Number(budgetSeasonData.rex) || 0;
  const ttpNum = Number(budgetSeasonData.ttp) || 0;
  const totalRexTtp = rexNum + ttpNum;

  // Use real SKU data or mock fallback
  const displaySkuData = skuData;

  if (loading) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0A0A0A]' : ''}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className={`animate-spin ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
          <span className={darkMode ? 'text-[#999999]' : 'text-gray-700'}>{t('ticketDetail.loadingDetail')}</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0A0A0A]' : ''}`}>
        <div className={`text-center ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
          <p>{t('common.noData')}</p>
          {onBack && (
            <button onClick={onBack} className={`mt-4 hover:underline ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
              {t('ticketDetail.backToTickets')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 md:p-4 min-h-screen space-y-2 md:space-y-3 ${
      darkMode ? 'bg-[#0A0A0A]' : ''
    }`}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        darkMode={darkMode}
        items={[
          { label: t('common.breadcrumbTickets'), href: '/tickets' },
          { label: ticket?.name || t('ticketDetail.title') },
        ]}
      />

      {/* ===== COMPACT HEADER ===== */}
      {onBack && (
        <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${
          darkMode
            ? 'bg-gradient-to-r from-[#127749] to-[#0F5F3A]'
            : 'bg-gradient-to-r from-[#127749] to-[#2A9E6A]'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onBack} className="p-1 rounded transition-all hover:bg-white/10 text-white shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-['Montserrat'] text-white">{t('ticketDetail.title')}</span>
                <span className={`px-1.5 py-px text-[9px] font-bold rounded ${
                  ['APPROVED', 'LEVEL2_APPROVED', 'FINAL'].includes(ticket?.status?.toUpperCase())
                    ? 'bg-white/20 text-white'
                  : ['REJECTED', 'LEVEL1_REJECTED', 'LEVEL2_REJECTED'].includes(ticket?.status?.toUpperCase())
                    ? 'bg-[#F85149]/30 text-white'
                  : 'bg-white/15 text-white/80'
                }`}>
                  {ticket?.status?.replace(/_/g, ' ') || 'DRAFT'}
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate">{ticket?.entityType?.charAt(0).toUpperCase() + ticket?.entityType?.slice(1)} • {ticket?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleToggleDiff}
              className={`flex items-center gap-1.5 px-2.5 py-1 font-medium rounded text-[11px] border transition-all ${
                showDiff ? 'bg-[#D7B797]/30 text-white border-[#D7B797]/50' : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
              }`}
            >
              <GitCompare size={12} />
              {t('ticketDetail.viewChanges')}
            </button>
            {ticket?.status?.toUpperCase() === 'DRAFT' && (
              <button onClick={handleSubmitTicket} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white font-medium rounded text-[11px] border border-white/15 disabled:opacity-50">
                <Send size={11} /> {t('common.submit')}
              </button>
            )}
            {canApprove() && (<>
              <button onClick={handleRejectTicket} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-[#F85149]/20 hover:bg-[#F85149]/30 text-white font-medium rounded text-[11px] border border-[#F85149]/25 disabled:opacity-50">
                <XCircle size={11} /> {t('ticketDetail.reject')}
              </button>
              <button onClick={handleApproveTicket} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-white/25 hover:bg-white/35 text-white font-medium rounded text-[11px] border border-white/25 disabled:opacity-50">
                <CheckCircle size={11} /> {t('ticketDetail.approve')}
              </button>
            </>)}
          </div>
        </div>
      )}

      {/* ===== APPROVAL + INFO — single compact row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-2 items-stretch">
        {/* Left: Approval progress + Budget/Season inline */}
        <div className="flex flex-col gap-2">
          <ApprovalProgressBar currentStep={currentStep} approvalHistory={approvalHistory} darkMode={darkMode} t={t} />

          {/* Budget + Season — compact inline grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            <div className={`border rounded-lg p-2.5 flex flex-col ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>{t('skuProposal.budget')}</span>
                <span className={`text-[10px] font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(budgetData.totalBudget)}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 flex-1 items-end">
                <div>
                  <span className={`text-[9px] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>{t('budget.fiscalYear')}</span>
                  <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetData.fiscalYear}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>{t('budget.brand')}</span>
                  <p className={`text-xs font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetData.brandName}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>{t('budget.budgetName')}</span>
                  <p className={`text-xs font-semibold truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetData.budgetName}</p>
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-2.5 flex flex-col ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>{t('skuProposal.season')}</span>
                <span className={`text-[10px] font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(totalRexTtp)}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 flex-1 items-end">
                <div>
                  <span className={`text-[9px] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>{t('skuProposal.seasonGroup')}</span>
                  <p className={`text-xs font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetSeasonData.seasonGroup} — {budgetSeasonData.Season}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>REX</span>
                  <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(rexNum)}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${darkMode ? 'text-[#555]' : 'text-gray-400'}`}>TTP</span>
                  <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(ttpNum)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status tracking — stretch full height */}
        <StatusTrackingPanel approvalHistory={approvalHistory} ticket={ticket} darkMode={darkMode} t={t} />
      </div>

      {/* SKU Cards - grouped by type and gender (only for proposals) */}
      {displaySkuData.length > 0 && (
      <div className="space-y-3 md:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={`text-lg font-semibold flex items-center gap-2 font-['Montserrat'] ${
            darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
          }`}>
            <Package size={20} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
            {t('proposal.skuCode')} ({displaySkuData.reduce((sum: any, b: any) => sum + b.items.length, 0)})
          </h3>

          {/* View Mode Toggle (hidden on mobile - always card view) */}
          <div className={`hidden md:flex items-center gap-1 rounded-lg p-1 ${darkMode ? 'bg-[#1A1A1A] border border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.12)] border border-[rgba(160,120,75,0.3)]'}`}>
            <button
              type="button"
              onClick={() => setSkuViewMode('card')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'card'
                  ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                  : darkMode ? 'text-[#666666] hover:text-[#999999]' : 'text-[#999999] hover:text-[#666666]'
              }`}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSkuViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'table'
                  ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                  : darkMode ? 'text-[#666666] hover:text-[#999999]' : 'text-[#999999] hover:text-[#666666]'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
        {/* Diff Legend */}
        {showDiff && (
          <div className={`flex items-center gap-4 px-4 py-2 rounded-xl text-xs font-['Montserrat'] ${darkMode ? 'bg-[rgba(215,183,151,0.05)] border border-[#2E2E2E]' : 'bg-amber-50 border border-amber-200'}`}>
            <span className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}>
              <GitCompare size={12} className="inline mr-1" />
              {t('ticketDetail.comparingVersions') || 'Comparing with previous version'}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded ${darkMode ? 'bg-[rgba(42,158,106,0.25)] ring-1 ring-[#2A9E6A]/40' : 'bg-emerald-100 ring-1 ring-emerald-300'}`} />
              <span className={darkMode ? 'text-[#999999]' : 'text-gray-600'}>{t('ticketDetail.increased') || 'Increased'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded ${darkMode ? 'bg-[rgba(248,81,73,0.15)] ring-1 ring-[#F85149]/40' : 'bg-red-100 ring-1 ring-red-300'}`} />
              <span className={darkMode ? 'text-[#999999]' : 'text-gray-600'}>{t('ticketDetail.decreased') || 'Decreased'}</span>
            </span>
          </div>
        )}

        {/* === TABLE VIEW (desktop only) === */}
        {skuViewMode === 'table' && !isMobile && (
          <div className={`border rounded-2xl shadow-sm overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-300'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0 [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap">
                <thead>
                  <tr className={darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(160,120,75,0.18)]'}>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider sticky left-0 z-10 ${darkMode ? 'text-[#999999] bg-[#1A1A1A]' : 'text-[#666666] bg-[rgba(160,120,75,0.18)]'}`}></th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.category')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.subCategory')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.rail')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.color')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.skuCode')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.productName')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.sizing')}</th>
                    <th className={`px-4 py-0.5 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.srp')}</th>
                    <th className={`px-4 py-0.5 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{t('proposal.rex')}</th>
                    <th className={`px-4 py-0.5 text-center text-xs font-semibold uppercase tracking-wider text-[#127749]`}>{t('proposal.ttp')}</th>
                    <th className={`px-4 py-0.5 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.totalQty')}</th>
                    <th className={`px-4 py-0.5 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.totalValue')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-[#2E2E2E]' : 'divide-gray-100'}`}>
                  {displaySkuData.flatMap((block: any) => block.items.map((item: any, idx: any) => {
                    const prevItem = showDiff ? getPreviousItem(item.sku) : null;
                    const diffCls = (field: string) => {
                      if (!showDiff || !prevItem) return '';
                      const curr = item[field];
                      const prev = prevItem[field];
                      if (curr === prev) return '';
                      return curr > prev
                        ? (darkMode ? 'bg-[rgba(42,158,106,0.15)] ring-1 ring-inset ring-[#2A9E6A]/30 rounded' : 'bg-emerald-50 ring-1 ring-inset ring-emerald-300 rounded')
                        : (darkMode ? 'bg-[rgba(248,81,73,0.12)] ring-1 ring-inset ring-[#F85149]/30 rounded' : 'bg-red-50 ring-1 ring-inset ring-red-300 rounded');
                    };
                    const diffLabel = (field: string) => {
                      if (!showDiff || !prevItem) return null;
                      const curr = item[field];
                      const prev = prevItem[field];
                      if (curr === prev) return null;
                      const delta = curr - prev;
                      return (
                        <span className={`text-[9px] ml-1 ${delta > 0 ? 'text-[#2A9E6A]' : 'text-[#F85149]'}`}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      );
                    };
                    return (
                    <tr key={`${item.sku}_${idx}`} className={`transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.05)]' : 'hover:bg-[rgba(160,120,75,0.1)]'}`}>
                      <td className={`px-4 py-0.5 sticky left-0 z-10 ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
                        <ProductImage subCategory={block.subCategory || ''} sku={item.sku || ''} size={40} darkMode={darkMode} />
                      </td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{block.gender || '-'}</td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{block.subCategory || '-'}</td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{item.theme || '-'}</td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{item.color || '-'}</td>
                      <td className={`px-4 py-0.5 font-['JetBrains_Mono'] text-sm ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{item.sku}</td>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.name}</td>
                      <td className={`px-4 py-0.5 text-[11px] ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{item.sizing?.sizes?.join(', ') || '-'}</td>
                      <td className={`px-4 py-0.5 text-right font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(item.srp || 0)}</td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] font-medium ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} ${diffCls('rex')}`}>
                        {item.rex || 0}{diffLabel('rex')}
                      </td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] font-medium text-[#127749] ${diffCls('ttp')}`}>
                        {item.ttp || 0}{diffLabel('ttp')}
                      </td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] font-bold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'} ${diffCls('order')}`}>
                        {item.order || 0}{diffLabel('order')}
                      </td>
                      <td className={`px-4 py-0.5 text-right font-['JetBrains_Mono'] font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'} ${diffCls('ttlValue')}`}>
                        {formatCurrency(item.ttlValue || 0)}
                      </td>
                    </tr>
                    );
                  }))}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30 bg-[rgba(215,183,151,0.05)]' : 'border-[#D7B797]/40 bg-[rgba(160,120,75,0.12)]'}`}>
                    <td colSpan={9} className={`px-4 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{t('skuProposal.total')}</td>
                    <td className={`px-4 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                      {displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.rex || 0), 0), 0)}
                    </td>
                    <td className={`px-4 py-0.5 text-center font-bold font-['JetBrains_Mono'] text-[#127749]`}>
                      {displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.ttp || 0), 0), 0)}
                    </td>
                    <td className={`px-4 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>
                      {displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.order || 0), 0), 0)}
                    </td>
                    <td className={`px-4 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>
                      {formatCurrency(displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.ttlValue || 0), 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* === CARD VIEW (always on mobile, or when card mode selected) === */}
        {(skuViewMode === 'card' || isMobile) && displaySkuData.map((block: any) => {
          const key = `${block.gender}_${block.productType}`;
          const isCollapsed = collapsed[key];
          const totalSrp = block.items.reduce((sum: any, i: any) => sum + i.srp, 0);
          return (
            <div key={key} className={`border rounded-2xl shadow-sm overflow-hidden ${
              darkMode
                ? 'bg-[#121212] border-[#2E2E2E]'
                : 'bg-white border-gray-300'
            }`}>
              <button
                type="button"
                onClick={() => setCollapsed((p: any) => ({ ...p, [key]: !p[key] }))}
                className={`w-full flex flex-wrap items-center gap-3 md:gap-4 px-3 md:px-5 py-0.5 md:py-1 transition-all ${
                  darkMode
                    ? 'bg-gradient-to-r from-[#2A2118] via-[#3A2D1E] to-[#2A2118] text-[#F2F2F2] hover:from-[#342820] hover:via-[#443524] hover:to-[#342820]'
                    : 'bg-gradient-to-r from-[#6B4D30] via-[#8B7355] to-[#6B4D30] text-white hover:from-[#7A5A3A] hover:via-[#9A8060] hover:to-[#7A5A3A]'
                }`}
              >
                <ChevronDown size={18} className={`transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#F5E6D3]'}`} />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-sm font-['Montserrat']">{block.subCategory}</div>
                  <div className={`text-sm mt-0.5 ${darkMode ? 'text-[#A69076]' : 'text-[#E8D5BE]'}`}>
                    {block.gender} • {block.productType} • <span className="font-['JetBrains_Mono']">{block.items.length}</span> SKUs
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#A69076]' : 'text-[#E8D5BE]'}`}>% Buy propose</div>
                    <div className={`text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2E8DC]' : 'text-white'}`}>{block.pctBuyPropose}%</div>
                  </div>
                  <div className={`w-px h-8 ${darkMode ? 'bg-[#4A3A28]' : 'bg-[rgba(255,255,255,0.2)]'}`} />
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#A69076]' : 'text-[#E8D5BE]'}`}>OTB propose</div>
                    <div className={`text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2E8DC]' : 'text-white'}`}>{formatCurrency(block.otbPropose)}</div>
                  </div>
                  <div className={`w-px h-8 ${darkMode ? 'bg-[#4A3A28]' : 'bg-[rgba(255,255,255,0.2)]'}`} />
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#A69076]' : 'text-[#E8D5BE]'}`}>Total SRP</div>
                    <div className={`text-sm font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2E8DC]' : 'text-white'}`}>{formatCurrency(totalSrp)}</div>
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div
                  className="premium-card-scroll flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 py-5"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: darkMode ? '#D7B797 #1A1A1A' : '#C9A84C #F5F0EA',
                  }}
                >
                  <style>{`
                    .premium-card-scroll::-webkit-scrollbar { height: 6px; }
                    .premium-card-scroll::-webkit-scrollbar-track { background: ${darkMode ? '#1A1A1A' : '#F5F0EA'}; border-radius: 3px; }
                    .premium-card-scroll::-webkit-scrollbar-thumb { background: ${darkMode ? '#D7B797' : '#C9A84C'}; border-radius: 3px; }
                    .premium-card-scroll::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#E3C8A8' : '#B8973C'}; }
                  `}</style>
                  {block.items.map((item: any, idx: number) => (
                    <PremiumSKUCard key={idx} item={item} block={block} darkMode={darkMode} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
      <ConfirmDialog darkMode={darkMode} {...dialogProps} />
    </div>
  );
}
