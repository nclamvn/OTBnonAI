'use client';

import React from 'react';
import {
  Undo2, Redo2, PanelRightOpen, FileText, Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  quickActions?: React.ReactNode;
}

const AllocationToolbar = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onToggleSidePanel,
  sidePanelOpen = false,
  darkMode = false,
  statusInfo,
  quickActions,
}: AllocationToolbarProps) => {
  const { t } = useLanguage();

  // Status bar helpers
  const normalizedStatus = (statusInfo?.status || 'draft').toLowerCase();
  const statusCfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;
  const statusLabel =
    normalizedStatus === 'approved'
      ? t('planning.approved')
      : normalizedStatus === 'pending' || normalizedStatus === 'submitted'
        ? t('planning.pending')
        : t('planning.draft');

  const hasStatusInfo = statusInfo?.budgetName;

  return (
    <div
      className={`border-b ${
        darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'
      }`}
    >
      {/* Single row: Status info + Actions */}
      <div className="px-3 md:px-6 py-1 flex items-center gap-2 text-[11px]">
        {/* Status info (left side) */}
        {hasStatusInfo && (
          <>
            <div className="flex items-center gap-1 shrink-0">
              <FileText size={11} className={darkMode ? 'text-[#999]' : 'text-[#666]'} />
              <span
                className={`font-semibold font-['Montserrat'] ${
                  darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'
                }`}
              >
                {statusInfo!.budgetName}
              </span>
            </div>

            <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>

            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${statusCfg.bg} ${statusCfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusLabel}
            </span>

            {statusInfo!.versionName && (
              <>
                <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
                <span className={`font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                  {statusInfo!.versionName}
                </span>
              </>
            )}

            {(statusInfo!.autoSaving || statusInfo!.lastSavedAt) && (
              <>
                <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
                {statusInfo!.autoSaving ? (
                  <span className="inline-flex items-center gap-1 text-[#E3B341]">
                    <div className="w-2 h-2 border border-[#E3B341]/40 border-t-[#E3B341] rounded-full animate-spin" />
                    {t('planning.autoSaving')}
                  </span>
                ) : statusInfo!.lastSavedAt ? (
                  <span className={`inline-flex items-center gap-1 ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>
                    <Clock size={10} />
                    {t('planning.savedAt', { time: statusInfo!.lastSavedAt })}
                  </span>
                ) : null}
              </>
            )}

            {statusInfo!.isDirty && (
              <>
                <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
                <span className="inline-flex items-center gap-1 text-[#E3B341] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3B341] animate-pulse" />
                  {t('planning.unsavedChanges')}
                </span>
              </>
            )}
          </>
        )}

        {/* Spacer to push actions right */}
        <div className="flex-1" />

        {/* Quick actions */}
        {quickActions && (
          <div className="flex items-center gap-2 shrink-0">
            {quickActions}
          </div>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded-md transition-colors border ${
              canUndo
                ? darkMode
                  ? 'border-[#2E2E2E] text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]'
                  : 'border-[#C4B5A5] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'
                : darkMode
                  ? 'border-[#2E2E2E] text-[#999] opacity-30 cursor-not-allowed'
                  : 'border-[#C4B5A5] text-[#666] opacity-30 cursor-not-allowed'
            }`}
            title={`${t('planning.undo')} (Ctrl+Z)`}
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded-md transition-colors border ${
              canRedo
                ? darkMode
                  ? 'border-[#2E2E2E] text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]'
                  : 'border-[#C4B5A5] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'
                : darkMode
                  ? 'border-[#2E2E2E] text-[#999] opacity-30 cursor-not-allowed'
                  : 'border-[#C4B5A5] text-[#666] opacity-30 cursor-not-allowed'
            }`}
            title={`${t('planning.redo')} (Ctrl+Shift+Z)`}
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Side panel toggle */}
        {onToggleSidePanel && (
          <button
            onClick={onToggleSidePanel}
            className={`p-1 rounded-md transition-colors shrink-0 border ${
              sidePanelOpen
                ? darkMode
                  ? 'bg-[rgba(215,183,151,0.15)] border-[rgba(215,183,151,0.25)] text-[#D7B797]'
                  : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                : darkMode
                  ? 'border-[#2E2E2E] text-[#999] hover:bg-[rgba(215,183,151,0.08)]'
                  : 'border-[#C4B5A5] text-[#666] hover:bg-[rgba(160,120,75,0.12)]'
            }`}
            title={`${t('planning.validation')} / ${t('planning.history')}`}
          >
            <PanelRightOpen size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(AllocationToolbar);
