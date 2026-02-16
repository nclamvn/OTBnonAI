'use client';

import { FileText, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AllocationStatusBarProps {
  budgetName?: string;
  status?: string; // 'draft' | 'pending' | 'approved'
  versionName?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  isDirty?: boolean;
  autoSaving?: boolean;
  lastSavedAt?: string | null;
  darkMode?: boolean;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  draft: {
    bg: 'bg-[#2E2E2E]/20',
    text: 'text-[#999]',
    dot: 'bg-[#999]',
  },
  pending: {
    bg: 'bg-[rgba(227,179,65,0.15)]',
    text: 'text-[#E3B341]',
    dot: 'bg-[#E3B341]',
  },
  submitted: {
    bg: 'bg-[rgba(227,179,65,0.15)]',
    text: 'text-[#E3B341]',
    dot: 'bg-[#E3B341]',
  },
  approved: {
    bg: 'bg-[rgba(18,119,73,0.15)]',
    text: 'text-[#127749]',
    dot: 'bg-[#127749]',
  },
};

const AllocationStatusBar = ({
  budgetName,
  status = 'draft',
  versionName,
  lastModifiedBy,
  lastModifiedAt,
  isDirty = false,
  autoSaving = false,
  lastSavedAt,
  darkMode = false,
}: AllocationStatusBarProps) => {
  const { t } = useLanguage();

  if (!budgetName) return null;

  const normalizedStatus = (status || 'draft').toLowerCase();
  const cfg = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.draft;
  const statusLabel =
    normalizedStatus === 'approved'
      ? t('planning.approved')
      : normalizedStatus === 'pending' || normalizedStatus === 'submitted'
        ? t('planning.pending')
        : t('planning.draft');

  return (
    <div
      className={`px-3 md:px-6 py-1 border-b flex items-center gap-2 flex-wrap text-[11px] ${
        darkMode
          ? 'bg-[#121212] border-[#2E2E2E]'
          : 'bg-white border-[rgba(215,183,151,0.3)]'
      }`}
    >
      {/* Budget ID */}
      <div className="flex items-center gap-1 shrink-0">
        <FileText size={11} className={darkMode ? 'text-[#999]' : 'text-[#666]'} />
        <span
          className={`font-semibold font-['Montserrat'] ${
            darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'
          }`}
        >
          {budgetName}
        </span>
      </div>

      <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>

      {/* Status badge */}
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {statusLabel}
      </span>

      {/* Version */}
      {versionName && (
        <>
          <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
          <span className={`font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
            {versionName}
          </span>
        </>
      )}

      {/* Last modified */}
      {(lastModifiedBy || lastModifiedAt) && (
        <>
          <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
          <div className="flex items-center gap-1">
            <Clock size={10} className={darkMode ? 'text-[#999]' : 'text-[#666]'} />
            <span className={darkMode ? 'text-[#999]' : 'text-[#666]'}>
              {t('planning.lastModified')}:
              {lastModifiedBy ? ` ${lastModifiedBy}` : ''}
              {lastModifiedAt ? `, ${lastModifiedAt}` : ''}
            </span>
          </div>
        </>
      )}

      {/* Auto-save indicator */}
      {(autoSaving || lastSavedAt) && (
        <>
          <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
          {autoSaving ? (
            <span className="inline-flex items-center gap-1 text-[#E3B341]">
              <div className="w-2 h-2 border border-[#E3B341]/40 border-t-[#E3B341] rounded-full animate-spin" />
              {t('planning.autoSaving')}
            </span>
          ) : lastSavedAt ? (
            <span className={`inline-flex items-center gap-1 ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>
              {t('planning.savedAt', { time: lastSavedAt })}
            </span>
          ) : null}
        </>
      )}

      {/* Unsaved indicator */}
      {isDirty && (
        <>
          <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#C4B5A5]'}>|</span>
          <span className="inline-flex items-center gap-1 text-[#E3B341] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E3B341] animate-pulse" />
            {t('planning.unsavedChanges')}
          </span>
        </>
      )}
    </div>
  );
};

export default AllocationStatusBar;
