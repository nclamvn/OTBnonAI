'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Zap, Copy, Scale, ChevronDown, ArrowLeftRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface BulkActionsMenuProps {
  stores: { id: string; code: string; name: string }[];
  allocationValues: Record<string, any>;
  onBulkUpdate: (newValues: Record<string, any>) => void;
  totalBudget: number;
  darkMode?: boolean;
}

const BulkActionsMenu = ({
  stores,
  allocationValues,
  onBulkUpdate,
  totalBudget,
  darkMode = false,
}: BulkActionsMenuProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scaleTarget, setScaleTarget] = useState('');
  const [ratioInputs, setRatioInputs] = useState<Record<string, string>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Copy one store to another
  const handleCopyStore = (fromId: string, toId: string) => {
    const updated = { ...allocationValues };
    Object.keys(updated).forEach((key) => {
      if (updated[key] && typeof updated[key] === 'object') {
        const fromVal = updated[key][fromId];
        if (fromVal !== undefined) {
          updated[key] = { ...updated[key], [toId]: fromVal };
        }
      }
    });
    onBulkUpdate(updated);
    const fromStore = stores.find(s => s.id === fromId);
    const toStore = stores.find(s => s.id === toId);
    toast.success(`${t('planning.copied') || 'Copied'}: ${fromStore?.code} → ${toStore?.code}`);
    setOpen(false);
  };

  // Scale all values to a target total
  const handleScale = () => {
    const target = parseFloat(scaleTarget.replace(/[^0-9.-]/g, ''));
    if (isNaN(target) || target <= 0) {
      toast.error(t('planning.invalidAmount') || 'Invalid amount');
      return;
    }

    let currentTotal = 0;
    Object.values(allocationValues).forEach((storeValues: any) => {
      if (storeValues && typeof storeValues === 'object') {
        Object.values(storeValues).forEach((v: any) => {
          if (typeof v === 'number') currentTotal += v;
        });
      }
    });

    if (currentTotal === 0) {
      toast.error(t('planning.noValuesToScale') || 'No values to scale');
      return;
    }

    const factor = target / currentTotal;
    const updated: Record<string, any> = {};
    Object.entries(allocationValues).forEach(([key, storeValues]: [string, any]) => {
      if (storeValues && typeof storeValues === 'object') {
        const scaledStore: Record<string, number> = {};
        Object.entries(storeValues).forEach(([field, val]: [string, any]) => {
          scaledStore[field] = typeof val === 'number' ? Math.round(val * factor) : val;
        });
        updated[key] = scaledStore;
      } else {
        updated[key] = storeValues;
      }
    });

    onBulkUpdate(updated);
    toast.success(`${t('planning.scaledTo') || 'Scaled to'}: ${target.toLocaleString()}`);
    setScaleTarget('');
    setOpen(false);
  };

  // Apply ratio across stores (e.g., REX 60% / TTP 40%)
  const handleApplyRatio = () => {
    const ratios: Record<string, number> = {};
    let totalRatio = 0;
    stores.forEach(s => {
      const val = parseFloat(ratioInputs[s.id] || '0');
      ratios[s.id] = isNaN(val) ? 0 : val;
      totalRatio += ratios[s.id];
    });

    if (totalRatio !== 100) {
      toast.error(t('planning.ratioMust100') || 'Ratios must total 100%');
      return;
    }

    const updated: Record<string, any> = {};
    Object.entries(allocationValues).forEach(([key, storeValues]: [string, any]) => {
      if (storeValues && typeof storeValues === 'object') {
        // Sum all store values for this row
        let rowTotal = 0;
        Object.values(storeValues).forEach((v: any) => {
          if (typeof v === 'number') rowTotal += v;
        });

        // Redistribute based on ratios
        const newStore: Record<string, number> = {};
        stores.forEach(s => {
          newStore[s.id] = Math.round(rowTotal * (ratios[s.id] / 100));
        });
        updated[key] = newStore;
      } else {
        updated[key] = storeValues;
      }
    });

    onBulkUpdate(updated);
    const ratioStr = stores.map(s => `${s.code} ${ratios[s.id]}%`).join(' / ');
    toast.success(`${t('planning.ratioApplied') || 'Ratio applied'}: ${ratioStr}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-0.5 p-1.5 rounded-md transition-colors border ${
          darkMode
            ? 'border-[#2E2E2E] text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]'
            : 'border-[#C4B5A5] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'
        }`}
        title={t('planning.bulkActions') || 'Bulk Actions'}
      >
        <Zap size={12} />
        <ChevronDown size={8} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full right-0 mt-1 w-64 border rounded-xl shadow-xl z-[9999] overflow-hidden ${
            darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
          }`}
        >
          {/* Copy store */}
          <div className={`px-3 py-2 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[#E8DDD0]'}`}>
            <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
              <Copy size={10} className="inline mr-1" />
              {t('planning.copyStore') || 'Copy Store'}
            </div>
            {stores.map((from) =>
              stores
                .filter((to) => to.id !== from.id)
                .map((to) => (
                  <button
                    key={`${from.id}-${to.id}`}
                    onClick={() => handleCopyStore(from.id, to.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                      darkMode
                        ? 'text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)]'
                        : 'text-[#0A0A0A] hover:bg-[rgba(160,120,75,0.12)]'
                    }`}
                  >
                    {from.code} → {to.code}
                  </button>
                ))
            )}
          </div>

          {/* Apply ratio */}
          <div className={`px-3 py-2 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[#E8DDD0]'}`}>
            <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
              <ArrowLeftRight size={10} className="inline mr-1" />
              {t('planning.applyRatio') || 'Apply Ratio'}
            </div>
            <div className="flex items-center gap-1 mb-1.5">
              {stores.map((store, i) => (
                <div key={store.id} className="flex items-center gap-0.5">
                  {i > 0 && <span className={`text-[10px] ${darkMode ? 'text-[#666]' : 'text-[#999]'}`}>/</span>}
                  <span className={`text-[10px] ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>{store.code}</span>
                  <input
                    type="text"
                    value={ratioInputs[store.id] || ''}
                    onChange={(e) => setRatioInputs(prev => ({ ...prev, [store.id]: e.target.value }))}
                    placeholder={String(Math.round(100 / stores.length))}
                    className={`w-10 px-1 py-0.5 text-center text-[10px] font-['JetBrains_Mono'] border rounded ${
                      darkMode
                        ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2]'
                        : 'bg-white border-[#C4B5A5] text-[#0A0A0A]'
                    }`}
                  />
                  <span className={`text-[10px] ${darkMode ? 'text-[#666]' : 'text-[#999]'}`}>%</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleApplyRatio}
              className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                darkMode
                  ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.15)]'
                  : 'bg-[rgba(160,120,75,0.12)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'
              }`}
            >
              {t('common.apply') || 'Apply'}
            </button>
          </div>

          {/* Scale to total */}
          <div className="px-3 py-2">
            <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
              <Scale size={10} className="inline mr-1" />
              {t('planning.scaleToTotal') || 'Scale to Total'}
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={scaleTarget}
                onChange={(e) => setScaleTarget(e.target.value)}
                placeholder={totalBudget > 0 ? String(totalBudget) : '0'}
                className={`flex-1 px-2 py-1 text-xs font-['JetBrains_Mono'] border rounded ${
                  darkMode
                    ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2]'
                    : 'bg-white border-[#C4B5A5] text-[#0A0A0A]'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleScale()}
              />
              <button
                onClick={handleScale}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  darkMode
                    ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A] hover:bg-[rgba(18,119,73,0.25)]'
                    : 'bg-[rgba(18,119,73,0.1)] text-[#127749] hover:bg-[rgba(18,119,73,0.18)]'
                }`}
              >
                {t('planning.scale') || 'Scale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionsMenu;
