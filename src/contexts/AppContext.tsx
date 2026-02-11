'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface KpiItem {
  value: number;
  status: string;
}

interface AppContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  sharedYear: number;
  setSharedYear: React.Dispatch<React.SetStateAction<number>>;
  sharedGroupBrand: any;
  setSharedGroupBrand: React.Dispatch<React.SetStateAction<any>>;
  sharedBrand: any;
  setSharedBrand: React.Dispatch<React.SetStateAction<any>>;
  allocationData: any;
  setAllocationData: React.Dispatch<React.SetStateAction<any>>;
  otbAnalysisContext: any;
  setOtbAnalysisContext: React.Dispatch<React.SetStateAction<any>>;
  skuProposalContext: any;
  setSkuProposalContext: React.Dispatch<React.SetStateAction<any>>;
  kpiData: Record<string, KpiItem>;
  setKpiData: React.Dispatch<React.SetStateAction<Record<string, KpiItem>>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Dark mode state
  const [darkMode, setDarkModeState] = useState(true);

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
    if (typeof document !== 'undefined') {
      if (value) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Shared filter state between Budget Management and Planning screens
  const [sharedYear, setSharedYear] = useState(2025);
  const [sharedGroupBrand, setSharedGroupBrand] = useState(null);
  const [sharedBrand, setSharedBrand] = useState(null);

  // Cross-screen data passing
  const [allocationData, setAllocationData] = useState(null);
  const [otbAnalysisContext, setOtbAnalysisContext] = useState(null);
  const [skuProposalContext, setSkuProposalContext] = useState(null);

  // KPI data for header step bar
  const [kpiData, setKpiData] = useState<Record<string, KpiItem>>({
    'budget-management': { value: 5, status: 'completed' },
    'planning': { value: 3, status: 'completed' },
    'otb-analysis': { value: 3, status: 'in-progress' },
    'proposal': { value: 27, status: 'in-progress' },
    'tickets': { value: 4, status: 'in-progress' },
  });

  const value = {
    darkMode,
    setDarkMode,
    sharedYear,
    setSharedYear,
    sharedGroupBrand,
    setSharedGroupBrand,
    sharedBrand,
    setSharedBrand,
    allocationData,
    setAllocationData,
    otbAnalysisContext,
    setOtbAnalysisContext,
    skuProposalContext,
    setSkuProposalContext,
    kpiData,
    setKpiData,
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
