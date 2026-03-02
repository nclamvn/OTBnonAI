'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface KpiItem {
  value: number;
  status: string;
}

export interface LoadingState {
  visible: boolean;
  message?: string;
}

type SaveHandler = () => Promise<void> | void;

interface AppContextType {
  // Backward compat — darkMode is always true (toggle removed from AppHeader)
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  sharedYear: number | null;
  setSharedYear: React.Dispatch<React.SetStateAction<number | null>>;
  allocationData: any;
  setAllocationData: React.Dispatch<React.SetStateAction<any>>;
  otbAnalysisContext: any;
  setOtbAnalysisContext: React.Dispatch<React.SetStateAction<any>>;
  skuProposalContext: any;
  setSkuProposalContext: React.Dispatch<React.SetStateAction<any>>;
  kpiData: Record<string, KpiItem>;
  setKpiData: React.Dispatch<React.SetStateAction<Record<string, KpiItem>>>;
  registerSave: (handler: SaveHandler) => void;
  unregisterSave: () => void;
  triggerSave: () => Promise<void>;
  hasSaveHandler: boolean;
  registerSaveAsNew: (handler: SaveHandler) => void;
  unregisterSaveAsNew: () => void;
  triggerSaveAsNew: () => Promise<void>;
  hasSaveAsNewHandler: boolean;
  registerCreateBudget: (handler: () => void) => void;
  unregisterCreateBudget: () => void;
  triggerCreateBudget: () => void;
  registerExport: (handler: () => void) => void;
  unregisterExport: () => void;
  triggerExport: () => void;
  hasExportHandler: boolean;
  headerSubtitle: string | null;
  setHeaderSubtitle: (subtitle: string | null) => void;
  loading: LoadingState;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [sharedYear, setSharedYear] = useState<number | null>(null);

  const [allocationData, setAllocationData] = useState(null);
  const [otbAnalysisContext, setOtbAnalysisContext] = useState(null);
  const [skuProposalContext, setSkuProposalContext] = useState(null);

  const [kpiData, setKpiData] = useState<Record<string, KpiItem>>({
    'budget-management': { value: 5, status: 'completed' },
    'planning': { value: 3, status: 'completed' },
    'otb-analysis': { value: 3, status: 'in-progress' },
    'proposal': { value: 27, status: 'in-progress' },
    'tickets': { value: 4, status: 'in-progress' },
  });

  // Save handler
  const saveHandlerRef = useRef<SaveHandler | null>(null);
  const [hasSaveHandler, setHasSaveHandler] = useState(false);

  const registerSave = useCallback((handler: SaveHandler) => {
    saveHandlerRef.current = handler;
    setHasSaveHandler(true);
  }, []);

  const unregisterSave = useCallback(() => {
    saveHandlerRef.current = null;
    setHasSaveHandler(false);
  }, []);

  const triggerSave = useCallback(async () => {
    if (saveHandlerRef.current) {
      setLoading({ visible: true, message: undefined });
      try {
        await saveHandlerRef.current();
      } finally {
        setLoading({ visible: false, message: undefined });
      }
    }
  }, []);

  // Save-as-new handler
  const saveAsNewHandlerRef = useRef<SaveHandler | null>(null);
  const [hasSaveAsNewHandler, setHasSaveAsNewHandler] = useState(false);

  const registerSaveAsNew = useCallback((handler: SaveHandler) => {
    saveAsNewHandlerRef.current = handler;
    setHasSaveAsNewHandler(true);
  }, []);

  const unregisterSaveAsNew = useCallback(() => {
    saveAsNewHandlerRef.current = null;
    setHasSaveAsNewHandler(false);
  }, []);

  const triggerSaveAsNew = useCallback(async () => {
    if (saveAsNewHandlerRef.current) {
      setLoading({ visible: true, message: undefined });
      try {
        await saveAsNewHandlerRef.current();
      } finally {
        setLoading({ visible: false, message: undefined });
      }
    }
  }, []);

  // Create budget handler
  const createBudgetHandlerRef = useRef<(() => void) | null>(null);

  const registerCreateBudget = useCallback((handler: () => void) => {
    createBudgetHandlerRef.current = handler;
  }, []);

  const unregisterCreateBudget = useCallback(() => {
    createBudgetHandlerRef.current = null;
  }, []);

  const triggerCreateBudget = useCallback(() => {
    if (createBudgetHandlerRef.current) {
      createBudgetHandlerRef.current();
    }
  }, []);

  // Export handler
  const exportHandlerRef = useRef<(() => void) | null>(null);
  const [hasExportHandler, setHasExportHandler] = useState(false);

  const registerExport = useCallback((handler: () => void) => {
    exportHandlerRef.current = handler;
    setHasExportHandler(true);
  }, []);

  const unregisterExport = useCallback(() => {
    exportHandlerRef.current = null;
    setHasExportHandler(false);
  }, []);

  const triggerExport = useCallback(async () => {
    if (exportHandlerRef.current) {
      setLoading({ visible: true, message: undefined });
      try {
        await exportHandlerRef.current();
      } finally {
        setLoading({ visible: false, message: undefined });
      }
    }
  }, []);

  // Header subtitle
  const [headerSubtitle, setHeaderSubtitle] = useState<string | null>(null);

  // Global loading overlay
  const [loading, setLoading] = useState<LoadingState>({ visible: false });

  const showLoading = useCallback((message?: string) => {
    setLoading({ visible: true, message });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading({ visible: false, message: undefined });
  }, []);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>, message?: string): Promise<T> => {
    setLoading({ visible: true, message });
    try {
      return await fn();
    } finally {
      setLoading({ visible: false, message: undefined });
    }
  }, []);

  // Backward compat — light theme only, toggle removed
  const darkMode = false;
  const setDarkMode = useCallback((_value: boolean) => { /* no-op */ }, []);

  const value = {
    darkMode,
    setDarkMode,
    sharedYear,
    setSharedYear,
    allocationData,
    setAllocationData,
    otbAnalysisContext,
    setOtbAnalysisContext,
    skuProposalContext,
    setSkuProposalContext,
    kpiData,
    setKpiData,
    registerSave,
    unregisterSave,
    triggerSave,
    hasSaveHandler,
    registerSaveAsNew,
    unregisterSaveAsNew,
    triggerSaveAsNew,
    hasSaveAsNewHandler,
    registerCreateBudget,
    unregisterCreateBudget,
    triggerCreateBudget,
    registerExport,
    unregisterExport,
    triggerExport,
    hasExportHandler,
    headerSubtitle,
    setHeaderSubtitle,
    loading,
    showLoading,
    hideLoading,
    withLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
