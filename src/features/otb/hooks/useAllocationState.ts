'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { planningService } from '../../../services';

// ═══════════════════════════════════════════════════════════════════════════
// useAllocationState — manages allocation values, undo/redo, dirty tracking,
// validation, and save/submit wrappers for BudgetAllocateScreen
// ═══════════════════════════════════════════════════════════════════════════

const MAX_UNDO_STACK = 50;
const DEBOUNCE_MS = 300;
const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

export interface ValidationIssue {
  type: 'error' | 'warning';
  key: string;
  message: string;
  params?: Record<string, string>;
}

interface AllocationSnapshot {
  allocationValues: Record<string, any>;
  seasonTotalValues: Record<string, any>;
  brandTotalValues: Record<string, any>;
}

const emptySnapshot: AllocationSnapshot = {
  allocationValues: {},
  seasonTotalValues: {},
  brandTotalValues: {},
};

const snapshotsEqual = (a: AllocationSnapshot, b: AllocationSnapshot) =>
  JSON.stringify(a) === JSON.stringify(b);

export function useAllocationState(t: (key: string, params?: any) => string) {
  // ── Editable state ────────────────────────────────────────────────────
  const [allocationValues, setAllocationValues] = useState<Record<string, any>>({});
  const [seasonTotalValues, setSeasonTotalValues] = useState<Record<string, any>>({});
  const [brandTotalValues, setBrandTotalValues] = useState<Record<string, any>>({});

  // ── Undo / redo stacks ────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState<AllocationSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<AllocationSnapshot[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Clean snapshot (point-in-time saved state) ────────────────────────
  const [cleanSnapshot, setCleanSnapshot] = useState<AllocationSnapshot>(emptySnapshot);

  // ── Saving state ──────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const versionIdRef = useRef<any>(null); // track current version for auto-save

  // ── Current snapshot helper ───────────────────────────────────────────
  const currentSnapshot = useMemo<AllocationSnapshot>(
    () => ({ allocationValues, seasonTotalValues, brandTotalValues }),
    [allocationValues, seasonTotalValues, brandTotalValues],
  );

  // ── Dirty tracking ───────────────────────────────────────────────────
  const isDirty = useMemo(
    () => !snapshotsEqual(currentSnapshot, cleanSnapshot),
    [currentSnapshot, cleanSnapshot],
  );

  // ── Push to undo stack (debounced) ────────────────────────────────────
  const pushUndo = useCallback(
    (prev: AllocationSnapshot) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setUndoStack((stack) => {
          const next = [...stack, prev];
          return next.length > MAX_UNDO_STACK ? next.slice(-MAX_UNDO_STACK) : next;
        });
        setRedoStack([]);
      }, DEBOUNCE_MS);
    },
    [],
  );

  // ── Allocation change handlers ────────────────────────────────────────
  const handleAllocationChange = useCallback(
    (brandId: any, seasonGroup: any, subSeason: any, field: any, value: any) => {
      const key = `${brandId}-${seasonGroup}-${subSeason}`;
      const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

      pushUndo({ allocationValues, seasonTotalValues, brandTotalValues });
      setAllocationValues((prev: any) => ({
        ...prev,
        [key]: { ...prev[key], [field]: numValue },
      }));
    },
    [allocationValues, seasonTotalValues, brandTotalValues, pushUndo],
  );

  const handleSeasonTotalChange = useCallback(
    (brandId: any, seasonGroup: any, field: any, value: any) => {
      const key = `${brandId}-${seasonGroup}`;
      const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

      pushUndo({ allocationValues, seasonTotalValues, brandTotalValues });
      setSeasonTotalValues((prev: any) => ({
        ...prev,
        [key]: { ...prev[key], [field]: numValue },
      }));
    },
    [allocationValues, seasonTotalValues, brandTotalValues, pushUndo],
  );

  const handleBrandTotalChange = useCallback(
    (brandId: any, field: any, value: any) => {
      const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

      pushUndo({ allocationValues, seasonTotalValues, brandTotalValues });
      setBrandTotalValues((prev: any) => ({
        ...prev,
        [brandId]: { ...prev[brandId], [field]: numValue },
      }));
    },
    [allocationValues, seasonTotalValues, brandTotalValues, pushUndo],
  );

  // ── Undo / Redo ──────────────────────────────────────────────────────
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, { allocationValues, seasonTotalValues, brandTotalValues }]);
    setUndoStack((s) => s.slice(0, -1));
    setAllocationValues(prev.allocationValues);
    setSeasonTotalValues(prev.seasonTotalValues);
    setBrandTotalValues(prev.brandTotalValues);
  }, [canUndo, undoStack, allocationValues, seasonTotalValues, brandTotalValues]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, { allocationValues, seasonTotalValues, brandTotalValues }]);
    setRedoStack((r) => r.slice(0, -1));
    setAllocationValues(next.allocationValues);
    setSeasonTotalValues(next.seasonTotalValues);
    setBrandTotalValues(next.brandTotalValues);
  }, [canRedo, redoStack, allocationValues, seasonTotalValues, brandTotalValues]);

  // ── Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z) ──────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Auto-save every 30s when dirty ────────────────────────────────────
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (!isDirty || !versionIdRef.current) return;

    autoSaveTimerRef.current = setInterval(async () => {
      if (!versionIdRef.current || saving) return;
      setAutoSaving(true);
      try {
        await planningService.update(versionIdRef.current, {
          allocationValues,
          seasonTotalValues,
          brandTotalValues,
        });
        setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues });
        const now = new Date();
        setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {
        // Silent fail for auto-save — user can still manually save
      } finally {
        setAutoSaving(false);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [isDirty, saving, allocationValues, seasonTotalValues, brandTotalValues]);

  // ── Set versionId ref (called from parent) ────────────────────────────
  const setVersionId = useCallback((id: any) => {
    versionIdRef.current = id;
  }, []);

  // ── Beforeunload warning when dirty ───────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Validation ────────────────────────────────────────────────────────
  const validate = useCallback(
    (totalBudget: number, totalAllocated: number): ValidationIssue[] => {
      const issues: ValidationIssue[] = [];

      // Check over-budget
      if (totalBudget > 0 && totalAllocated > totalBudget) {
        const overAmount = totalAllocated - totalBudget;
        issues.push({
          type: 'error',
          key: 'overBudget',
          message: 'planning.errorOverBudget',
          params: { amount: overAmount.toLocaleString() },
        });
      }

      // Check negative values
      Object.entries(allocationValues).forEach(([key, storeValues]) => {
        if (storeValues && typeof storeValues === 'object') {
          Object.entries(storeValues).forEach(([field, val]) => {
            if (typeof val === 'number' && val < 0) {
              issues.push({
                type: 'error',
                key: `negative-${key}-${field}`,
                message: 'planning.errorNegativeValue',
                params: { field: `${key} / ${field}` },
              });
            }
          });
        }
      });

      // Check under-allocation warning
      if (totalBudget > 0 && totalAllocated > 0) {
        const pct = Math.round((totalAllocated / totalBudget) * 100);
        if (pct < 80) {
          issues.push({
            type: 'warning',
            key: 'underAllocation',
            message: 'planning.warningUnderAllocation',
            params: { pct: String(pct) },
          });
        }
      }

      // No allocation at all
      if (totalBudget > 0 && totalAllocated === 0 && Object.keys(allocationValues).length === 0) {
        issues.push({
          type: 'warning',
          key: 'noAllocation',
          message: 'planning.warningNoAllocation',
        });
      }

      return issues;
    },
    [allocationValues],
  );

  // ── Save draft ────────────────────────────────────────────────────────
  const saveDraft = useCallback(
    async (versionId: any) => {
      if (!versionId) return;
      setSaving(true);
      try {
        await planningService.update(versionId, {
          allocationValues,
          seasonTotalValues,
          brandTotalValues,
        });
        setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues });
        const now = new Date();
        setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        toast.success(t('planning.draftSaved'));
      } catch (err: any) {
        console.error('Failed to save draft:', err);
        toast.error(t('planning.saveFailed'));
      } finally {
        setSaving(false);
      }
    },
    [allocationValues, seasonTotalValues, brandTotalValues, t],
  );

  // ── Submit for approval ───────────────────────────────────────────────
  const submitForApproval = useCallback(
    async (versionId: any) => {
      if (!versionId) return;
      setSaving(true);
      try {
        // Save first, then submit
        await planningService.update(versionId, {
          allocationValues,
          seasonTotalValues,
          brandTotalValues,
        });
        await planningService.submit(versionId);
        setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues });
        toast.success(t('planning.submittedForApproval'));
      } catch (err: any) {
        console.error('Failed to submit:', err);
        toast.error(t('planning.saveFailed'));
      } finally {
        setSaving(false);
      }
    },
    [allocationValues, seasonTotalValues, brandTotalValues, t],
  );

  // ── Ctrl+S keyboard shortcut for save ───────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        if (versionIdRef.current) {
          saveDraft(versionIdRef.current);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveDraft]);

  // ── Discard changes ───────────────────────────────────────────────────
  const discardChanges = useCallback(() => {
    setAllocationValues(cleanSnapshot.allocationValues);
    setSeasonTotalValues(cleanSnapshot.seasonTotalValues);
    setBrandTotalValues(cleanSnapshot.brandTotalValues);
    setUndoStack([]);
    setRedoStack([]);
  }, [cleanSnapshot]);

  // ── Mark current state as clean (after external save) ─────────────────
  const markClean = useCallback(() => {
    setCleanSnapshot({ allocationValues, seasonTotalValues, brandTotalValues });
  }, [allocationValues, seasonTotalValues, brandTotalValues]);

  return {
    // State
    allocationValues,
    setAllocationValues,
    seasonTotalValues,
    setSeasonTotalValues,
    brandTotalValues,
    setBrandTotalValues,
    // Handlers
    handleAllocationChange,
    handleSeasonTotalChange,
    handleBrandTotalChange,
    // Undo/Redo
    canUndo,
    canRedo,
    undo,
    redo,
    // Dirty
    isDirty,
    discardChanges,
    markClean,
    // Validation
    validate,
    // Save
    saving,
    saveDraft,
    submitForApproval,
    // Auto-save
    autoSaving,
    lastSavedAt,
    setVersionId,
    // Bulk operations (push undo before bulk change)
    pushUndo,
  };
}

export default useAllocationState;
