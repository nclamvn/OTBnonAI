'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, ArrowRight, TrendingUp, TrendingDown, Minus, Loader2,
  GitCompare, AlertTriangle
} from 'lucide-react';
import { planningService } from '../../../services';
import { formatCurrency } from '../../../utils';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: string;
  darkMode: boolean;
}

/* ═══════════════════════════════════════════════
   DIFF LOGIC HELPERS
═══════════════════════════════════════════════ */

const getDetailKey = (d: any) => {
  const dimType = d.dimensionType || 'category';
  const col = d.collectionId || d.collection?.id || '';
  const gen = d.genderId || d.gender?.id || '';
  const cat = d.categoryId || d.category?.id || '';
  const sub = d.subCategoryId || d.subCategory?.id || '';
  return `${dimType}|${col}|${gen}|${cat}|${sub}`;
};

const getDetailName = (d: any) => {
  const parts: string[] = [];
  if (d.gender?.name) parts.push(d.gender.name);
  if (d.category?.name) parts.push(d.category.name);
  if (d.subCategory?.name) parts.push(d.subCategory.name);
  if (d.collection?.name) parts.push(d.collection.name);
  // Fallback to raw fields if relations are not populated (e.g. from snapshotData)
  if (parts.length === 0) {
    if (d.genderName) parts.push(d.genderName);
    if (d.categoryName) parts.push(d.categoryName);
    if (d.subCategoryName) parts.push(d.subCategoryName);
    if (d.collectionName) parts.push(d.collectionName);
  }
  return parts.length > 0 ? parts.join(' > ') : d.dimensionType || 'Item';
};

const COMPARE_FIELDS = [
  { key: 'userBuyPct', label: 'Buy %', format: 'pct' },
  { key: 'otbValue', label: 'OTB Value', format: 'currency' },
  { key: 'systemBuyPct', label: 'System Buy %', format: 'pct' },
  { key: 'lastSeasonPct', label: 'Last Season %', format: 'pct' },
  { key: 'variancePct', label: 'Variance %', format: 'pct' },
];

const formatVal = (val: number, format: string) => {
  if (format === 'pct') return `${val.toFixed(1)}%`;
  if (format === 'currency') return formatCurrency(val);
  return val.toString();
};

/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */

const VersionDiffModal = ({ isOpen, onClose, entityId, entityType, darkMode }: VersionDiffModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [previousVersion, setPreviousVersion] = useState<any>(null);
  const [allVersions, setAllVersions] = useState<any[]>([]);
  const [selectedPrevId, setSelectedPrevId] = useState<string>('');

  // Fetch versions data
  useEffect(() => {
    if (!isOpen || !entityId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch current version with full details
        const current = await planningService.getOne(entityId);
        setCurrentVersion(current);

        // Fetch all sibling versions for the same budgetDetail
        if (current.budgetDetailId) {
          const allRes = await planningService.getAll({ budgetDetailId: current.budgetDetailId });
          const versions = (allRes.data || allRes || [])
            .sort((a: any, b: any) => b.versionNumber - a.versionNumber);
          setAllVersions(versions);

          // Auto-select the most recent previous version
          const prev = versions.find(
            (v: any) => v.versionNumber < current.versionNumber && v.id !== entityId
          );
          if (prev) {
            setSelectedPrevId(prev.id);
            const prevFull = await planningService.getOne(prev.id);
            setPreviousVersion(prevFull);
          } else {
            setPreviousVersion(null);
          }
        }
      } catch (err: any) {
        console.error('Failed to load version data:', err);
        setError('Failed to load version data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, entityId, entityType]);

  // When user picks a different previous version from dropdown
  const handlePrevVersionChange = async (prevId: string) => {
    setSelectedPrevId(prevId);
    setLoading(true);
    try {
      const prevFull = await planningService.getOne(prevId);
      setPreviousVersion(prevFull);
    } catch {
      setError('Failed to load selected version');
    } finally {
      setLoading(false);
    }
  };

  // ── Compute diff ──
  const diff = useMemo(() => {
    if (!currentVersion || !previousVersion) return null;

    // Prefer live details, fall back to snapshotData
    const currentDetails = currentVersion.details?.length
      ? currentVersion.details
      : (currentVersion.snapshotData?.details || []);
    const prevDetails = previousVersion.details?.length
      ? previousVersion.details
      : (previousVersion.snapshotData?.details || []);

    const prevMap = new Map<string, any>();
    prevDetails.forEach((d: any) => prevMap.set(getDetailKey(d), d));

    const currentMap = new Map<string, any>();
    currentDetails.forEach((d: any) => currentMap.set(getDetailKey(d), d));

    const rows: any[] = [];
    let changedCount = 0;
    let addedCount = 0;
    let removedCount = 0;

    // Walk current details
    currentDetails.forEach((curr: any) => {
      const key = getDetailKey(curr);
      const prev = prevMap.get(key);

      if (!prev) {
        addedCount++;
        rows.push({ name: getDetailName(curr), type: 'added', prev: null, curr, changes: [] });
        return;
      }

      // Compare numeric fields
      const changes: any[] = [];
      COMPARE_FIELDS.forEach((f) => {
        const oldVal = Number(prev[f.key]) || 0;
        const newVal = Number(curr[f.key]) || 0;
        if (Math.abs(oldVal - newVal) > 0.001) {
          changes.push({ field: f.label, oldVal, newVal, diff: newVal - oldVal, format: f.format });
        }
      });

      rows.push({
        name: getDetailName(curr),
        type: changes.length > 0 ? 'changed' : 'unchanged',
        prev,
        curr,
        changes,
      });
      if (changes.length > 0) changedCount++;
    });

    // Find removed items (in prev but not in current)
    prevDetails.forEach((prev: any) => {
      if (!currentMap.has(getDetailKey(prev))) {
        removedCount++;
        rows.push({ name: getDetailName(prev), type: 'removed', prev, curr: null, changes: [] });
      }
    });

    const total = rows.length;
    const unchanged = total - changedCount - addedCount - removedCount;

    return { rows, summary: { total, changed: changedCount, added: addedCount, removed: removedCount, unchanged } };
  }, [currentVersion, previousVersion]);

  // ── Early return ──
  if (!isOpen) return null;

  const border = darkMode ? 'border-[#2E2E2E]' : 'border-gray-300';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-[#999999]' : 'text-gray-600';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-500';

  // Versions available for comparison (exclude current)
  const comparableVersions = allVersions.filter((v: any) => v.id !== entityId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col rounded-2xl border ${border} shadow-2xl overflow-hidden`}
        style={{
          background: darkMode
            ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.04) 40%, rgba(215,183,151,0.12) 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.05) 35%, rgba(215,183,151,0.14) 100%)',
        }}
      >
        {/* ── Header ── */}
        <div className={`px-6 py-4 border-b ${border} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-[rgba(215,183,151,0.12)]' : 'bg-[rgba(215,183,151,0.18)]'}`}>
              <GitCompare size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
            </div>
            <div>
              <h3 className={`text-base font-bold font-['Montserrat'] ${textPrimary}`}>Version Comparison</h3>
              {currentVersion && (
                <p className={`text-xs ${textSecondary}`}>
                  {currentVersion.planningCode || currentVersion.versionName || 'Current version'}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.1)]' : 'hover:bg-gray-100'}`}>
            <X size={18} className={textSecondary} />
          </button>
        </div>

        {/* ── Version Selector ── */}
        {!loading && currentVersion && comparableVersions.length > 0 && (
          <div className={`px-6 py-3 border-b ${border} flex flex-wrap items-center gap-3`}>
            <span className={`text-xs font-semibold font-['Montserrat'] ${textSecondary}`}>Compare:</span>
            <select
              value={selectedPrevId}
              onChange={(e) => handlePrevVersionChange(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-['JetBrains_Mono'] ${border} ${darkMode ? 'bg-[#1A1A1A] text-[#F2F2F2]' : 'bg-gray-50 text-gray-900'} outline-none`}
            >
              {comparableVersions.map((v: any) => (
                <option key={v.id} value={v.id}>
                  V{v.versionNumber} — {v.versionName || v.planningCode} ({v.status})
                </option>
              ))}
            </select>
            <ArrowRight size={16} className={textMuted} />
            <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'bg-[rgba(42,158,106,0.12)] text-[#2A9E6A]' : 'bg-emerald-50 text-emerald-700'}`}>
              V{currentVersion.versionNumber} — {currentVersion.versionName || 'Current'} (reviewing)
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className={`animate-spin ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
              <p className={`text-sm mt-3 ${textSecondary}`}>Loading versions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle size={32} className="text-[#F85149] mb-3" />
              <p className="text-sm text-[#F85149]">{error}</p>
            </div>
          ) : !previousVersion ? (
            <div className="flex flex-col items-center justify-center py-16">
              <GitCompare size={36} className={`mb-3 ${textMuted}`} />
              <p className={`text-sm font-medium ${textPrimary}`}>No previous version found</p>
              <p className={`text-xs mt-1 ${textSecondary}`}>This is the first version — no comparison available.</p>
            </div>
          ) : diff ? (
            <>
              {/* ── Summary Cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Items', value: diff.summary.total, color: darkMode ? '#D7B797' : '#6B4D30' },
                  { label: 'Changed', value: diff.summary.changed, color: '#D29922' },
                  { label: 'Added', value: diff.summary.added, color: '#2A9E6A' },
                  { label: 'Removed', value: diff.summary.removed, color: '#F85149' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border ${border} px-4 py-3 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'}`}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider font-['Montserrat']" style={{ color: s.color }}>{s.label}</div>
                    <div className={`text-xl font-bold font-['JetBrains_Mono'] mt-1 ${textPrimary}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Diff Table ── */}
              <div className={`rounded-xl border ${border} overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}>
                      <th className={`px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        Dimension
                      </th>
                      <th className={`px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        Field
                      </th>
                      <th className={`px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>
                        V{previousVersion.versionNumber} (old)
                      </th>
                      <th className={`px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#2A9E6A]' : 'text-emerald-700'}`}>
                        V{currentVersion.versionNumber} (new)
                      </th>
                      <th className={`px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.rows
                      .filter((r: any) => r.type !== 'unchanged')
                      .map((row: any, rIdx: number) => {
                        // ── Added row ──
                        if (row.type === 'added') {
                          return (
                            <tr key={`a-${rIdx}`} className={`border-b ${darkMode ? 'border-[#2E2E2E] bg-[rgba(42,158,106,0.06)]' : 'border-gray-200 bg-emerald-50/50'}`}>
                              <td className={`px-4 py-2 font-medium ${textPrimary}`}>{row.name}</td>
                              <td className="px-4 py-2" colSpan={3}>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]">
                                  + ADDED
                                </span>
                              </td>
                              <td />
                            </tr>
                          );
                        }

                        // ── Removed row ──
                        if (row.type === 'removed') {
                          return (
                            <tr key={`r-${rIdx}`} className={`border-b ${darkMode ? 'border-[#2E2E2E] bg-[rgba(248,81,73,0.06)]' : 'border-gray-200 bg-red-50/50'}`}>
                              <td className={`px-4 py-2 font-medium ${textPrimary}`}>{row.name}</td>
                              <td className="px-4 py-2" colSpan={3}>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(248,81,73,0.12)] text-[#F85149]">
                                  &minus; REMOVED
                                </span>
                              </td>
                              <td />
                            </tr>
                          );
                        }

                        // ── Changed rows — one <tr> per changed field, rowSpan on dimension ──
                        return row.changes.map((ch: any, cIdx: number) => (
                          <tr
                            key={`c-${rIdx}-${cIdx}`}
                            className={`border-b ${darkMode ? 'border-[#2E2E2E] bg-[rgba(210,153,34,0.04)]' : 'border-gray-200 bg-amber-50/30'}`}
                          >
                            {cIdx === 0 && (
                              <td className={`px-4 py-2 font-medium ${textPrimary}`} rowSpan={row.changes.length}>
                                {row.name}
                              </td>
                            )}
                            <td className={`px-4 py-2 font-['Montserrat'] ${textSecondary}`}>{ch.field}</td>
                            <td className={`px-4 py-2 text-right font-['JetBrains_Mono'] ${textMuted}`}>
                              {formatVal(ch.oldVal, ch.format)}
                            </td>
                            <td className={`px-4 py-2 text-right font-semibold font-['JetBrains_Mono']`}>
                              <span className={`px-2 py-0.5 rounded ${
                                ch.diff > 0
                                  ? darkMode ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]' : 'bg-emerald-100 text-emerald-700'
                                  : darkMode ? 'bg-[rgba(248,81,73,0.12)] text-[#F85149]' : 'bg-red-100 text-red-700'
                              }`}>
                                {formatVal(ch.newVal, ch.format)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-['JetBrains_Mono'] text-xs font-semibold">
                              <span className="inline-flex items-center gap-1" style={{ color: ch.diff > 0 ? '#2A9E6A' : '#F85149' }}>
                                {ch.diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {ch.diff > 0 ? '+' : ''}{formatVal(ch.diff, ch.format)}
                              </span>
                            </td>
                          </tr>
                        ));
                      })}

                    {/* No changes */}
                    {diff.rows.filter((r: any) => r.type !== 'unchanged').length === 0 && (
                      <tr>
                        <td colSpan={5} className={`px-4 py-8 text-center ${textSecondary}`}>
                          <Minus size={24} className="mx-auto mb-2 opacity-50" />
                          No differences found between these versions.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Unchanged count */}
              {diff.summary.unchanged > 0 && (
                <p className={`text-xs mt-3 ${textMuted}`}>
                  {diff.summary.unchanged} unchanged items hidden.
                </p>
              )}
            </>
          ) : null}
        </div>

        {/* ── Footer ── */}
        <div className={`px-6 py-3 border-t ${border} flex justify-end flex-shrink-0`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-sm font-semibold font-['Montserrat'] transition-all ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A584]' : 'bg-[#D7B797] text-white hover:bg-[#C4A584]'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionDiffModal;
