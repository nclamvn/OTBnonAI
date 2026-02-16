'use client';

import {
  LayoutGrid, List, Columns, Eye, AlertCircle,
  AlertTriangle, Store, X, ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ViewMode, ShowFilter } from '../hooks/useTableFilters';

interface ViewToggleBarProps {
  view: ViewMode;
  showOnly: ShowFilter;
  channelFilter: string;
  stores: { id: string; code: string }[];
  onViewChange: (view: ViewMode) => void;
  onShowOnlyChange: (show: ShowFilter) => void;
  onChannelChange: (channel: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  // Jump-to support
  seasonGroups: string[];
  seasonConfig: Record<string, { name: string }>;
  onJumpTo?: (seasonGroup: string) => void;
  darkMode?: boolean;
}

const ViewToggleBar = ({
  view, showOnly, channelFilter, stores,
  onViewChange, onShowOnlyChange, onChannelChange, onReset, hasActiveFilters,
  seasonGroups, seasonConfig, onJumpTo,
  darkMode = false,
}: ViewToggleBarProps) => {
  const { t } = useLanguage();
  const [jumpOpen, setJumpOpen] = useState(false);
  const jumpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (jumpRef.current && !jumpRef.current.contains(e.target as Node)) {
        setJumpOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const viewOptions: { key: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { key: 'detail', icon: LayoutGrid, label: t('planning.viewDetail') || 'Detail' },
    { key: 'summary', icon: List, label: t('planning.viewSummary') || 'Summary' },
    { key: 'compact', icon: Columns, label: t('planning.viewCompact') || 'Compact' },
  ];

  const showOptions: { key: ShowFilter; icon: typeof Eye; label: string }[] = [
    { key: 'all', icon: Eye, label: t('common.all') || 'All' },
    { key: 'modified', icon: Eye, label: t('planning.modified') || 'Modified' },
    { key: 'errors', icon: AlertCircle, label: t('planning.errors') || 'Errors' },
    { key: 'warnings', icon: AlertTriangle, label: t('planning.warnings') || 'Warnings' },
  ];

  const btnBase = `px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors`;
  const btnActive = darkMode
    ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]'
    : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]';
  const btnInactive = darkMode
    ? 'text-[#999] hover:bg-[rgba(215,183,151,0.08)]'
    : 'text-[#666] hover:bg-[rgba(160,120,75,0.08)]';

  return (
    <div
      className={`flex items-center gap-2 px-3 md:px-6 py-1 border-b flex-wrap ${
        darkMode
          ? 'bg-[#121212] border-[#2E2E2E]'
          : 'bg-white border-[rgba(215,183,151,0.2)]'
      }`}
    >
      {/* View mode */}
      <div className="flex items-center gap-0.5 shrink-0">
        {viewOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`${btnBase} ${view === key ? btnActive : btnInactive}`}
            title={label}
          >
            <Icon size={10} className="inline" />
          </button>
        ))}
      </div>

      <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#E8DDD0]'}>|</span>

      {/* Show filter */}
      <div className="flex items-center gap-0.5 shrink-0">
        <span className={`text-[10px] mr-1 ${darkMode ? 'text-[#666]' : 'text-[#999]'}`}>
          {t('common.show') || 'Show'}:
        </span>
        {showOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onShowOnlyChange(key)}
            className={`${btnBase} ${showOnly === key ? btnActive : btnInactive}`}
          >
            {label}
          </button>
        ))}
      </div>

      <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#E8DDD0]'}>|</span>

      {/* Channel filter */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Store size={10} className={darkMode ? 'text-[#666]' : 'text-[#999]'} />
        <button
          onClick={() => onChannelChange('all')}
          className={`${btnBase} ${channelFilter === 'all' ? btnActive : btnInactive}`}
        >
          {t('common.all') || 'All'}
        </button>
        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => onChannelChange(store.id)}
            className={`${btnBase} ${channelFilter === store.id ? btnActive : btnInactive}`}
          >
            {store.code}
          </button>
        ))}
      </div>

      {/* Jump-to dropdown */}
      {onJumpTo && seasonGroups.length > 0 && (
        <>
          <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#E8DDD0]'}>|</span>
          <div className="relative shrink-0" ref={jumpRef}>
            <button
              onClick={() => setJumpOpen(!jumpOpen)}
              className={`${btnBase} ${btnInactive} flex items-center gap-0.5`}
            >
              {t('planning.jumpTo') || 'Jump to'}
              <ChevronDown size={8} className={jumpOpen ? 'rotate-180' : ''} />
            </button>
            {jumpOpen && (
              <div
                className={`absolute top-full left-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden whitespace-nowrap ${
                  darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                }`}
              >
                {seasonGroups.map((sg) => (
                  <button
                    key={sg}
                    onClick={() => {
                      onJumpTo(sg);
                      setJumpOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-xs transition-colors ${
                      darkMode
                        ? 'text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)]'
                        : 'text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.12)]'
                    }`}
                  >
                    {seasonConfig[sg]?.name || sg}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className={`ml-auto p-0.5 rounded transition-colors ${
            darkMode ? 'text-[#999] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#666] hover:text-[#F85149] hover:bg-red-50'
          }`}
          title={t('common.reset') || 'Reset'}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default ViewToggleBar;
