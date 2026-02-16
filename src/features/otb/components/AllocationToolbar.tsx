'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Undo2, Redo2, Save, ChevronDown,
  Send, PanelRightOpen, Check, FileText, Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

const STEPS = [
  { key: 'stepBudget', route: '/budget-management', kpiId: 'budget-management' },
  { key: 'stepAllocation', route: '/planning', kpiId: 'planning' },
  { key: 'stepOtb', route: '/otb-analysis', kpiId: 'otb-analysis' },
  { key: 'stepSku', route: '/sku-proposal', kpiId: 'proposal' },
  { key: 'stepTickets', route: '/tickets', kpiId: 'tickets' },
];

interface KpiItem {
  value: number;
  status: string;
}

interface StatusInfo {
  budgetName?: string;
  status?: string;
  versionName?: string;
  isDirty?: boolean;
  autoSaving?: boolean;
  lastSavedAt?: string | null;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-[#2E2E2E]/20', text: 'text-[#999]', dot: 'bg-[#999]' },
  pending: { bg: 'bg-[rgba(227,179,65,0.15)]', text: 'text-[#E3B341]', dot: 'bg-[#E3B341]' },
  submitted: { bg: 'bg-[rgba(227,179,65,0.15)]', text: 'text-[#E3B341]', dot: 'bg-[#E3B341]' },
  approved: { bg: 'bg-[rgba(18,119,73,0.15)]', text: 'text-[#127749]', dot: 'bg-[#127749]' },
};

interface AllocationToolbarProps {
  onBack: () => void;
  onContinue: () => void;
  onStepClick?: (route: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  saving?: boolean;
  isDirty?: boolean;
  onToggleSidePanel?: () => void;
  sidePanelOpen?: boolean;
  darkMode?: boolean;
  kpiData?: Record<string, KpiItem>;
  statusInfo?: StatusInfo;
}

const AllocationToolbar = ({
  onBack,
  onContinue,
  onStepClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSaveDraft,
  onSubmit,
  saving = false,
  isDirty = false,
  onToggleSidePanel,
  sidePanelOpen = false,
  darkMode = false,
  kpiData = {},
  statusInfo,
}: AllocationToolbarProps) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  // Close save menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setSaveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeStepIndex = 1; // Allocation is step 2 (index 1)

  // Status bar helpers
  const normalizedStatus = (statusInfo?.status || 'draft').toLowerCase();
  const statusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;
  const statusLabel =
    normalizedStatus === 'approved'
      ? t('planning.approved')
      : normalizedStatus === 'pending' || normalizedStatus === 'submitted'
        ? t('planning.pending')
        : t('planning.draft');

  return (
    <div
      className={`border-b ${
        darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'
      }`}
    >
      {/* Row 1: Stepper + Actions */}
      <div className="px-3 md:px-6 py-1.5 flex items-center gap-2">
        {/* Back button */}
        <button
          onClick={onBack}
          className={`p-1.5 rounded-md transition-colors shrink-0 ${
            darkMode
              ? 'text-[#999] hover:text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)]'
              : 'text-[#666] hover:text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.12)]'
          }`}
          title={t('planning.backToBudget')}
        >
          <ArrowLeft size={14} />
        </button>

        {/* Stepper breadcrumb */}
        {isMobile ? (
          <span
            className={`text-xs font-semibold font-['Montserrat'] ${
              darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
            }`}
          >
            {t('common.step')} 2/5
          </span>
        ) : (
          <nav className="flex items-center gap-0.5 flex-1 min-w-0">
            {STEPS.map((step, i) => {
              const isActive = i === activeStepIndex;
              const isCompleted = i < activeStepIndex;
              const kpi = kpiData[step.kpiId];
              const kpiCount = kpi?.value;
              return (
                <div key={step.key} className="flex items-center gap-0.5">
                  {i > 0 && (
                    <div
                      className={`w-4 h-px ${
                        isCompleted || isActive
                          ? darkMode
                            ? 'bg-[#2A9E6A]'
                            : 'bg-[#127749]'
                          : darkMode
                            ? 'bg-[#2E2E2E]'
                            : 'bg-[#C4B5A5]'
                      }`}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (!isActive && onStepClick) onStepClick(step.route);
                    }}
                    disabled={isActive}
                    className={`text-[11px] font-medium font-['Montserrat'] px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
                      isActive
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] font-bold cursor-default'
                          : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30] font-bold cursor-default'
                        : isCompleted
                          ? darkMode
                            ? 'text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.1)] cursor-pointer'
                            : 'text-[#127749] hover:bg-[rgba(18,119,73,0.08)] cursor-pointer'
                          : darkMode
                            ? 'text-[#666] hover:text-[#999] cursor-pointer'
                            : 'text-[#999] hover:text-[#666] cursor-pointer'
                    }`}
                  >
                    <span className="flex items-center gap-0.5">
                      {isCompleted && <Check size={10} className="inline -mt-0.5" />}
                      {t(`planning.${step.key}`)}
                      {kpiCount !== undefined && (
                        <span className={`text-[9px] font-['JetBrains_Mono'] tabular-nums ml-0.5 ${
                          isActive
                            ? darkMode ? 'text-[#D7B797]/70' : 'text-[#6B4D30]/70'
                            : isCompleted
                              ? darkMode ? 'text-[#2A9E6A]/70' : 'text-[#127749]/70'
                              : darkMode ? 'text-[#555]' : 'text-[#999]'
                        }`}>
                          ({kpiCount})
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>
        )}

        {/* Spacer on mobile */}
        {isMobile && <div className="flex-1" />}

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded transition-colors ${
              canUndo
                ? darkMode
                  ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]'
                  : 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'
                : 'opacity-30 cursor-not-allowed'
            } ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}
            title={`${t('planning.undo')} (Ctrl+Z)`}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded transition-colors ${
              canRedo
                ? darkMode
                  ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]'
                  : 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'
                : 'opacity-30 cursor-not-allowed'
            } ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}
            title={`${t('planning.redo')} (Ctrl+Shift+Z)`}
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Save dropdown */}
        <div className="relative shrink-0" ref={saveMenuRef}>
          <button
            onClick={() => setSaveMenuOpen(!saveMenuOpen)}
            disabled={saving}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors border ${
              isDirty
                ? darkMode
                  ? 'bg-[rgba(18,119,73,0.15)] border-[#127749] text-[#2A9E6A] hover:bg-[rgba(18,119,73,0.25)]'
                  : 'bg-[rgba(18,119,73,0.1)] border-[#127749] text-[#127749] hover:bg-[rgba(18,119,73,0.18)]'
                : darkMode
                  ? 'border-[#2E2E2E] text-[#999] hover:bg-[rgba(215,183,151,0.08)]'
                  : 'border-[#C4B5A5] text-[#666] hover:bg-[rgba(160,120,75,0.12)]'
            }`}
          >
            {saving ? (
              <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <Save size={12} />
            )}
            <ChevronDown size={10} className={`transition-transform ${saveMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {saveMenuOpen && (
            <div
              className={`absolute top-full right-0 mt-1 w-48 border rounded-lg shadow-xl z-[9999] overflow-hidden ${
                darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
              }`}
            >
              <button
                onClick={() => {
                  onSaveDraft();
                  setSaveMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                  darkMode
                    ? 'text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)]'
                    : 'text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.12)]'
                }`}
              >
                <Save size={13} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                {t('planning.saveDraft')}
              </button>
              <button
                onClick={() => {
                  onSubmit();
                  setSaveMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium border-t transition-colors ${
                  darkMode
                    ? 'text-[#2A9E6A] hover:bg-[rgba(18,119,73,0.15)] border-[#2E2E2E]'
                    : 'text-[#127749] hover:bg-[rgba(18,119,73,0.1)] border-[#D4C8BB]'
                }`}
              >
                <Send size={13} />
                {t('planning.submitForApproval')}
              </button>
            </div>
          )}
        </div>

        {/* Side panel toggle */}
        {onToggleSidePanel && (
          <button
            onClick={onToggleSidePanel}
            className={`p-1 rounded transition-colors shrink-0 ${
              sidePanelOpen
                ? darkMode
                  ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]'
                  : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                : darkMode
                  ? 'text-[#999] hover:bg-[rgba(215,183,151,0.08)]'
                  : 'text-[#666] hover:bg-[rgba(160,120,75,0.12)]'
            }`}
            title={`${t('planning.validation')} / ${t('planning.history')}`}
          >
            <PanelRightOpen size={14} />
          </button>
        )}

        {/* Continue button */}
        <button
          onClick={onContinue}
          className={`p-1.5 rounded-md transition-colors shrink-0 ${
            darkMode
              ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.25)] border border-[rgba(215,183,151,0.25)]'
              : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30] hover:bg-[rgba(215,183,151,0.25)] border border-[rgba(215,183,151,0.4)]'
          }`}
          title={t('planning.continueToOtb')}
        >
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Row 2: Status info (merged from AllocationStatusBar) */}
      {statusInfo?.budgetName && (
        <div
          className={`px-3 md:px-6 py-1 border-t flex items-center gap-2 flex-wrap text-[11px] ${
            darkMode ? 'border-[#2E2E2E]/50' : 'border-[rgba(215,183,151,0.15)]'
          }`}
        >
          {/* Budget name */}
          <div className="flex items-center gap-1 shrink-0">
            <FileText size={11} className={darkMode ? 'text-[#999]' : 'text-[#666]'} />
            <span
              className={`font-semibold font-['Montserrat'] ${
                darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'
              }`}
            >
              {statusInfo.budgetName}
            </span>
          </div>

          <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusLabel}
          </span>

          {/* Version */}
          {statusInfo.versionName && (
            <>
              <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
              <span className={`font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                {statusInfo.versionName}
              </span>
            </>
          )}

          {/* Auto-save indicator */}
          {(statusInfo.autoSaving || statusInfo.lastSavedAt) && (
            <>
              <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
              {statusInfo.autoSaving ? (
                <span className="inline-flex items-center gap-1 text-[#E3B341]">
                  <div className="w-2 h-2 border border-[#E3B341]/40 border-t-[#E3B341] rounded-full animate-spin" />
                  {t('planning.autoSaving')}
                </span>
              ) : statusInfo.lastSavedAt ? (
                <span className={`inline-flex items-center gap-1 ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>
                  <Clock size={10} />
                  {t('planning.savedAt', { time: statusInfo.lastSavedAt })}
                </span>
              ) : null}
            </>
          )}

          {/* Unsaved indicator */}
          {statusInfo.isDirty && (
            <>
              <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
              <span className="inline-flex items-center gap-1 text-[#E3B341] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E3B341] animate-pulse" />
                {t('planning.unsavedChanges')}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(AllocationToolbar);
