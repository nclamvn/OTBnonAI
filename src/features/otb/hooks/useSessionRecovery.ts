'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'otb_draft_';
const DEBOUNCE_MS = 2000; // Save to localStorage every 2s max

interface DraftData {
  allocationValues: Record<string, any>;
  seasonTotalValues: Record<string, any>;
  brandTotalValues: Record<string, any>;
  savedAt: string;
  budgetId: string;
}

interface SessionRecoveryState {
  hasDraft: boolean;
  draftInfo: { savedAt: string; changeCount: number } | null;
}

export function useSessionRecovery(budgetId: string | null) {
  const [recovery, setRecovery] = useState<SessionRecoveryState>({
    hasDraft: false,
    draftInfo: null,
  });
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = budgetId ? `${STORAGE_PREFIX}${budgetId}` : null;

  // Check for existing draft on mount / budgetId change
  useEffect(() => {
    if (!storageKey) {
      setRecovery({ hasDraft: false, draftInfo: null });
      return;
    }
    setDismissed(false);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data: DraftData = JSON.parse(raw);
        const changeCount =
          Object.keys(data.allocationValues || {}).length +
          Object.keys(data.seasonTotalValues || {}).length +
          Object.keys(data.brandTotalValues || {}).length;

        if (changeCount > 0) {
          setRecovery({
            hasDraft: true,
            draftInfo: { savedAt: data.savedAt, changeCount },
          });
        } else {
          setRecovery({ hasDraft: false, draftInfo: null });
        }
      }
    } catch {
      setRecovery({ hasDraft: false, draftInfo: null });
    }
  }, [storageKey]);

  // Save draft to localStorage (debounced)
  const saveDraft = useCallback(
    (allocationValues: Record<string, any>, seasonTotalValues: Record<string, any>, brandTotalValues: Record<string, any>) => {
      if (!storageKey) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          const data: DraftData = {
            allocationValues,
            seasonTotalValues,
            brandTotalValues,
            savedAt: new Date().toISOString(),
            budgetId: budgetId!,
          };
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
          // localStorage might be full — ignore silently
        }
      }, DEBOUNCE_MS);
    },
    [storageKey, budgetId],
  );

  // Recover draft data
  const recoverDraft = useCallback((): DraftData | null => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data: DraftData = JSON.parse(raw);
        setRecovery({ hasDraft: false, draftInfo: null });
        setDismissed(true);
        return data;
      }
    } catch { /* ignore */ }
    return null;
  }, [storageKey]);

  // Dismiss recovery banner without recovering
  const dismissDraft = useCallback(() => {
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
    setRecovery({ hasDraft: false, draftInfo: null });
    setDismissed(true);
  }, [storageKey]);

  // Clear draft after successful API save
  const clearDraft = useCallback(() => {
    if (storageKey) {
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
    setRecovery({ hasDraft: false, draftInfo: null });
  }, [storageKey]);

  return {
    hasDraft: recovery.hasDraft && !dismissed,
    draftInfo: recovery.draftInfo,
    saveDraft,
    recoverDraft,
    dismissDraft,
    clearDraft,
  };
}

export default useSessionRecovery;
