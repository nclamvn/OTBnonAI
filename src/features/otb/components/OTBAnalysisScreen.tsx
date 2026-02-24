'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Filter, ChevronDown, Check,
  Calendar, Tag, Layers, Users, Pencil, X,
  FileText, Clock, Split, Bookmark, Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils';
import { STORES, GENDERS } from '@/utils/constants';
import { budgetService, masterDataService, planningService } from '@/services';
import { invalidateCache } from '@/services/api';
import { FilterBottomSheet, useBottomSheet } from '@/components/mobile';
import { FilterSelect } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSmartScrollState } from '@/hooks/useSmartScrollState';

// Constants
const SEASON_GROUPS = [
  { id: 'SS', label: 'Spring Summer' },
  { id: 'FW', label: 'Fall Winter' }
];

const SEASONS = [
  { id: 'Pre', label: 'Pre' },
  { id: 'Main/Show', label: 'Main/Show' }
];

// Reusable editable cell component (memoized to prevent unnecessary re-renders)
const EditableCell = React.memo(({ cellKey, value, isEditing, editValue, onStartEdit, onSaveEdit, onChangeValue, onKeyDown, readOnly = false, darkMode = false }: any) => {
  const { t } = useLanguage();
  if (isEditing && !readOnly) {
    return (
      <div className="flex items-center justify-center">
        <input
          type="number"
          value={editValue}
          onChange={(e) => onChangeValue(e.target.value)}
          onBlur={() => onSaveEdit(cellKey)}
          onKeyDown={(e) => onKeyDown(e, cellKey)}
          className={`w-20 px-2 py-0.5 text-center border-2 border-[#D7B797] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.5)] font-['JetBrains_Mono'] font-medium transition-all ${
            darkMode
              ? 'bg-[#1A1A1A] text-[#F2F2F2]'
              : 'bg-white text-[#1A1A1A]'
          }`}
          autoFocus
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center">
        <div className={`flex items-center gap-1.5 px-3 py-0.5 border rounded-lg min-w-[70px] justify-center ${
          darkMode
            ? 'bg-[#1A1A1A] border-[#2E2E2E]'
            : 'bg-[#F2F2F2] border-[#C4B5A5]'
        }`}>
          <span className={`font-['JetBrains_Mono'] font-medium ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
            {typeof value === 'number' ? value.toFixed(0) : value}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onStartEdit(cellKey, value)}
      className="group flex items-center justify-center gap-1 cursor-pointer"
      title={t ? t('otbAnalysis.clickToEdit') : 'Click to edit'}
    >
      <div className={`flex items-center gap-1.5 px-3 py-0.5 border rounded-lg transition-all min-w-[70px] justify-center ${
        darkMode
          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(215,183,151,0.4)]'
          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] hover:bg-[rgba(215,183,151,0.25)] hover:border-[rgba(215,183,151,0.5)]'
      }`}>
        <span className={`font-['JetBrains_Mono'] font-medium ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
          {typeof value === 'number' ? value.toFixed(0) : value}%
        </span>
        <Pencil size={12} className={`opacity-40 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
      </div>
    </div>
  );
});

const OTBAnalysisScreen = ({ otbContext, onOpenSkuProposal, darkMode = false }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});

  // API data states
  const [categoryStructure, setCategoryStructure] = useState<any[]>([]);
  const [collectionSections, setCollectionSections] = useState<any[]>([]);
  const [apiDataLoading, setApiDataLoading] = useState(true);

  // API state for fetching budgets
  const [apiBudgets, setApiBudgets] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Version states
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<any>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await budgetService.getAll({ status: 'APPROVED' });
      const budgetList = (Array.isArray(response) ? response : []).map((budget: any) => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
        brandId: budget.groupBrandId || budget.brandId,
        brandName: budget.groupBrand?.name || budget.Brand?.name || budget.brandName || 'Unknown',
        totalBudget: Number(budget.totalBudget) || Number(budget.totalAmount) || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || 'Untitled',
        seasonGroup: budget.seasonGroupId || budget.seasonGroup || '',
        seasonType: budget.seasonType || '',
        status: (budget.status || 'DRAFT').toLowerCase(),
        details: budget.details || []
      }));
      setApiBudgets(budgetList);
    } catch (err: any) {
      console.error('Failed to fetch budgets:', err);
      toast.error(t('budget.failedToLoadBudgets'));
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  // Fetch budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Compute available fiscal years from budgets
  const availableYears = useMemo(() => {
    return [...new Set(apiBudgets.map((b: any) => b.fiscalYear))].sort((a: number, b: number) => b - a);
  }, [apiBudgets]);

  // Filter states
  const [selectedBudgetId, setSelectedBudgetId] = useState('all');
  const [selectedSeasonGroup, setSelectedSeasonGroup] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [budgetContext, setBudgetContext] = useState<any>(null); // Budget info from Planning Screen
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<any>(null);

  // New filters: Year, Type (Same/Different Season), Budget Season (multi-select)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [comparisonType, setComparisonType] = useState<'same' | 'different'>('same');
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<string[]>([]);
  const [seasonCount, setSeasonCount] = useState<number>(1);

  // Smart Filter Bar — direct DOM toggle, zero re-render
  const { barRef, handleBarClick } = useSmartScrollState();

  // Auto-fill from sessionStorage (shared with BudgetAllocateScreen), fallback to first budget
  useEffect(() => {
    if (apiBudgets.length === 0 || selectedBudgetIds.length > 0) return;
    try {
      const stored = sessionStorage.getItem('otb_budget_filters');
      if (stored) {
        const filters = JSON.parse(stored);
        if (filters.selectedYear) setSelectedYear(filters.selectedYear);
        if (filters.selectedSeasonGroup) setSelectedSeasonGroup(filters.selectedSeasonGroup);
        // Try to find matching budget by year
        const matchingBudgets = apiBudgets.filter((b: any) => b.fiscalYear === filters.selectedYear);
        if (matchingBudgets.length > 0) {
          setSelectedBudgetIds([matchingBudgets[0].id]);
          setSelectedBudgetId(matchingBudgets[0].id);
          return;
        }
      }
    } catch { /* ignore */ }
    // Fallback: select first budget
    const first = apiBudgets[0];
    setSelectedBudgetIds([first.id]);
    setSelectedBudgetId(first.id);
    if (first.fiscalYear) setSelectedYear(first.fiscalYear);
  }, [apiBudgets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync single-budget mode when exactly 1 budget selected in multi-select
  useEffect(() => {
    if (selectedBudgetIds.length === 1) {
      setSelectedBudgetId(selectedBudgetIds[0]);
      const budget = apiBudgets.find((b: any) => b.id === selectedBudgetIds[0]);
      if (budget) {
        if (budget.seasonGroup) setSelectedSeasonGroup(budget.seasonGroup);
        if (budget.seasonType) setSelectedSeason(budget.seasonType);
      }
    } else if (selectedBudgetIds.length === 0) {
      setSelectedBudgetId('all');
    }
  }, [selectedBudgetIds, apiBudgets]);

  // Fetch planning versions when budget is selected
  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedBudgetId || selectedBudgetId === 'all') {
        setVersions([]);
        setSelectedVersionId(null);
        return;
      }
      setLoadingVersions(true);
      try {
        const response = await planningService.getAll({ budgetId: selectedBudgetId });
        const list = Array.isArray(response) ? response : [];
        setVersions(list.map((v: any) => ({
          id: v.id,
          name: v.name || v.versionName || `Version ${v.versionNumber || v.id}`,
          status: v.status || 'DRAFT',
          isFinal: v.isFinal || v.status?.toLowerCase() === 'final' || false,
          versionNumber: v.versionNumber
        })));
        // Auto-select the final version if one exists
        const finalVersion = list.find((v: any) => v.isFinal || v.status?.toLowerCase() === 'final');
        if (finalVersion) {
          setSelectedVersionId(finalVersion.id);
        } else {
          setSelectedVersionId(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch planning versions:', err);
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchVersions();
  }, [selectedBudgetId]);

  // Category tab filter states
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<any>(null);

  // Active tab for Category / Collection / Gender views
  const [activeTab, setActiveTab] = useState<'category' | 'collection' | 'gender'>('category');

  // Collapse states for Collection and Gender tabs
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [expandedGenderGroups, setExpandedGenderGroups] = useState<Record<string, boolean>>({});

  // Editable cell states
  const [editingCell, setEditingCell] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState<Record<string, any>>({});

  // Category hierarchy collapse states (Category -> SubCategory -> Gender)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, any>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, any>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);


  // Refs
  const dropdownRefs = useRef<Record<string, any>>({});
  const setDropdownRef = (key: any) => (el: any) => {
    dropdownRefs.current[key] = el;
  };
  // Fetch categories, collections, and planning versions from API
  useEffect(() => {
    const fetchApiData = async () => {
      setApiDataLoading(true);
      try {
        const [categoriesRes, collectionsRes] = await Promise.all([
          masterDataService.getCategories().catch(() => []),
          masterDataService.getCollections().catch(() => [])
        ]);

        // Transform categories into hierarchy
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        if (categories.length > 0) {
          // Check if API returns gender-level hierarchy (each item has .categories[])
          const isGenderHierarchy = categories[0]?.categories && Array.isArray(categories[0].categories);
          if (isGenderHierarchy) {
            // API returns: [{ id, name: "Female", categories: [{ id, name, subCategories: [...] }] }]
            const structure = categories.map((genderObj: any) => ({
              gender: { id: genderObj.id, name: genderObj.name },
              categories: (genderObj.categories || []).map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                subCategories: (cat.subCategories || []).map((sub: any) => ({
                  id: sub.id || sub.subCategoryId,
                  name: sub.name || sub.subCategoryName,
                })),
              })),
            }));
            setCategoryStructure(structure);
          } else {
            // Flat list: each item is a category with gender ref
            const genderMap: Record<string, any> = {};
            categories.forEach((cat: any) => {
              const genderId = (cat.gender?.id || cat.genderId || 'unknown').toLowerCase();
              const genderName = cat.gender?.name || cat.genderName || genderId;
              if (!genderMap[genderId]) {
                genderMap[genderId] = { gender: { id: genderId, name: genderName }, categories: [] };
              }
              const catId = cat.id || cat.categoryId;
              const catName = cat.name || cat.categoryName;
              let existingCat = genderMap[genderId].categories.find((c: any) => c.id === catId);
              if (!existingCat) {
                existingCat = { id: catId, name: catName, subCategories: [] };
                genderMap[genderId].categories.push(existingCat);
              }
              if (cat.subCategories && cat.subCategories.length > 0) {
                cat.subCategories.forEach((sub: any) => {
                  if (!existingCat.subCategories.find((s: any) => s.id === (sub.id || sub.subCategoryId))) {
                    existingCat.subCategories.push({ id: sub.id || sub.subCategoryId, name: sub.name || sub.subCategoryName });
                  }
                });
              }
            });
            setCategoryStructure(Object.values(genderMap));
          }
        }

        // Transform collections into sections
        const collections = Array.isArray(collectionsRes) ? collectionsRes : (collectionsRes?.data || []);
        if (collections.length > 0) {
          setCollectionSections(collections.map((c: any) => ({ id: c.id || c.code, name: c.name || c.collectionName })));
        } else {
          setCollectionSections([
            { id: 'carryover', name: 'Carry Over/Commercial' },
            { id: 'seasonal', name: 'Seasonal' }
          ]);
        }

      } catch (err: any) {
        console.error('Failed to fetch OTB analysis data:', err);
      } finally {
        setApiDataLoading(false);
      }
    };
    fetchApiData();
  }, [otbContext?.budgetId]);

  // Initialize local data for editable cells (zeros instead of random — will be populated by API)
  useEffect(() => {
    const initialData: Record<string, any> = {};

    // Initialize Category tab data with sample demo values
    const sampleCategoryData: Record<string, { buyPct: number; salesPct: number; stPct: number; buyProposed: number; otbProposed: number; varPct: number; otbSubmitted: number; buyActual: number }> = {};
    let catIndex = 0;
    const demoValues = [
      { buyPct: 25, salesPct: 22, stPct: 88, buyProposed: 18, otbProposed: 15, otbSubmitted: 14, buyActual: 16 },
      { buyPct: 18, salesPct: 20, stPct: 91, buyProposed: 12, otbProposed: 10, otbSubmitted: 9, buyActual: 11 },
      { buyPct: 15, salesPct: 14, stPct: 85, buyProposed: 22, otbProposed: 20, otbSubmitted: 18, buyActual: 21 },
      { buyPct: 12, salesPct: 16, stPct: 92, buyProposed: 14, otbProposed: 12, otbSubmitted: 11, buyActual: 13 },
      { buyPct: 10, salesPct: 8, stPct: 78, buyProposed: 16, otbProposed: 14, otbSubmitted: 13, buyActual: 15 },
      { buyPct: 8, salesPct: 10, stPct: 82, buyProposed: 8, otbProposed: 7, otbSubmitted: 6, buyActual: 7 },
      { buyPct: 7, salesPct: 6, stPct: 75, buyProposed: 6, otbProposed: 5, otbSubmitted: 5, buyActual: 6 },
      { buyPct: 5, salesPct: 4, stPct: 80, buyProposed: 4, otbProposed: 17, otbSubmitted: 16, buyActual: 3 },
    ];
    categoryStructure.forEach((genderGroup: any) => {
      genderGroup.categories.forEach((cat: any) => {
        cat.subCategories.forEach((subCat: any) => {
          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
          const demo = demoValues[catIndex % demoValues.length];
          initialData[key] = {
            buyPct: demo.buyPct,
            salesPct: demo.salesPct,
            stPct: demo.stPct,
            buyProposed: demo.buyProposed,
            otbProposed: demo.otbProposed,
            varPct: demo.buyProposed - demo.salesPct,
            otbSubmitted: demo.otbSubmitted,
            buyActual: demo.buyActual
          };
          catIndex++;
        });
      });
    });

    // Initialize Collection tab data (collection x store)
    const collectionDemoValues = [
      { buyPct: 30, salesPct: 28, stPct: 93, moc: 2.1, userBuyPct: 25, otbValue: 45000, varPct: -3 },
      { buyPct: 22, salesPct: 20, stPct: 87, moc: 1.8, userBuyPct: 20, otbValue: 32000, varPct: 2 },
      { buyPct: 18, salesPct: 16, stPct: 85, moc: 1.5, userBuyPct: 15, otbValue: 28000, varPct: -1 },
      { buyPct: 15, salesPct: 14, stPct: 90, moc: 1.9, userBuyPct: 12, otbValue: 22000, varPct: 1 },
      { buyPct: 10, salesPct: 12, stPct: 82, moc: 1.3, userBuyPct: 10, otbValue: 18000, varPct: -2 },
    ];
    let colIdx = 0;
    collectionSections.forEach((section: any) => {
      STORES.forEach((store: any) => {
        const key = `collection_${section.id}_${store.id}`;
        const demo = collectionDemoValues[colIdx % collectionDemoValues.length];
        initialData[key] = { ...demo };
        colIdx++;
      });
    });

    // Initialize Gender tab data (gender x store)
    const genderDemoValues = [
      { buyPct: 55, salesPct: 52, stPct: 94, userBuyPct: 50, otbValue: 120000, varPct: -2 },
      { buyPct: 45, salesPct: 48, stPct: 91, userBuyPct: 42, otbValue: 98000, varPct: 3 },
      { buyPct: 35, salesPct: 30, stPct: 86, userBuyPct: 32, otbValue: 75000, varPct: -5 },
      { buyPct: 28, salesPct: 25, stPct: 89, userBuyPct: 26, otbValue: 62000, varPct: 1 },
      { buyPct: 20, salesPct: 18, stPct: 83, userBuyPct: 18, otbValue: 45000, varPct: -2 },
    ];
    let genIdx = 0;
    const genderList = categoryStructure.length > 0
      ? categoryStructure.map((g: any) => g.gender)
      : GENDERS;
    genderList.forEach((gender: any) => {
      STORES.forEach((store: any) => {
        const key = `gender_${gender.id}_${store.id}`;
        const demo = genderDemoValues[genIdx % genderDemoValues.length];
        initialData[key] = { ...demo };
        genIdx++;
      });
    });

    setLocalData(initialData);
  }, [categoryStructure, collectionSections]);

  useEffect(() => {
    if (!otbContext) return;
    const { budgetId, budgetName, seasonGroup, season, rex, ttp, fiscalYear, brandName, groupBrand, totalBudget, status } = otbContext;

    // Try to find matching budget in loaded budgets
    let matchedBudget = null;
    if (budgetId && apiBudgets.find((b: any) => b.id === budgetId)) {
      matchedBudget = apiBudgets.find((b: any) => b.id === budgetId);
      setSelectedBudgetId(budgetId);
    } else if (budgetName) {
      matchedBudget = apiBudgets.find((b: any) => b.budgetName === budgetName);
      if (matchedBudget) {
        setSelectedBudgetId(matchedBudget.id);
      }
    }

    // Store full budget context from Planning Screen (whether matched or passed directly)
    setBudgetContext({
      budgetId: budgetId || matchedBudget?.id,
      budgetName: budgetName || matchedBudget?.budgetName,
      fiscalYear: fiscalYear || matchedBudget?.fiscalYear || new Date().getFullYear(),
      brandName: brandName || matchedBudget?.brandName,
      groupBrand: groupBrand || matchedBudget?.groupBrand,
      totalBudget: totalBudget || matchedBudget?.totalBudget || 0,
      status: status || matchedBudget?.status || 'draft',
      seasonGroup: seasonGroup || 'all',
      season: season || 'all',
      rex: rex ?? 0,
      ttp: ttp ?? 0
    });

    if (seasonGroup) {
      setSelectedSeasonGroup(seasonGroup);
    }
    if (season) {
      setSelectedSeason(season);
    }
  }, [otbContext, apiBudgets]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (openDropdown) {
        const el = dropdownRefs.current[openDropdown];
        if (el && !el.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
      if (openCategoryDropdown) {
        const el = dropdownRefs.current[openCategoryDropdown];
        if (el && !el.contains(event.target)) {
          setOpenCategoryDropdown(null);
        }
      }
};
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, openCategoryDropdown]);

  // Edit handlers
  const handleStartEdit = (cellKey: any, currentValue: any) => {
    setEditingCell(cellKey);
    setEditValue(typeof currentValue === 'number' ? currentValue.toFixed(0) : currentValue.toString());
  };

  const handleSaveEdit = (cellKey: any) => {
    const newValue = parseFloat(editValue) || 0;
    const isCollectionOrGender = cellKey.startsWith('collection_') || cellKey.startsWith('gender_');
    const fieldToUpdate = isCollectionOrGender ? 'userBuyPct' : 'buyProposed';

    setLocalData((prev: any) => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        [fieldToUpdate]: newValue
      }
    }));
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: any, cellKey: any) => {
    if (e.key === 'Enter') {
      handleSaveEdit(cellKey);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Handle set version as final
  const handleSetFinalVersion = async (versionId: any, e: any) => {
    e.stopPropagation();
    try {
      await planningService.finalize(versionId);
      invalidateCache('/planning');
      toast.success(t('planning.latestVersion'));
      setVersions((prev: any) => prev.map((v: any) => ({
        ...v,
        isFinal: v.id === versionId
      })));
      setSelectedVersionId(versionId);
    } catch (err: any) {
      console.error('Failed to set version as final:', err);
      toast.error(t('approval.failedToSave'));
    }
  };

  // Reset budget selection when season filters change (if current budget doesn't match)
  useEffect(() => {
    if (selectedBudgetId && selectedBudgetId !== 'all' && selectedSeasonGroup !== 'all') {
      const currentBudget = apiBudgets.find((b: any) => b.id === selectedBudgetId);
      if (currentBudget && currentBudget.seasonGroup && currentBudget.seasonGroup !== selectedSeasonGroup) {
        setSelectedBudgetId('all');
        setSelectedVersionId(null);
        setVersions([]);
      }
    }
  }, [selectedSeasonGroup]);

  useEffect(() => {
    if (selectedBudgetId && selectedBudgetId !== 'all' && selectedSeason !== 'all') {
      const currentBudget = apiBudgets.find((b: any) => b.id === selectedBudgetId);
      if (currentBudget && currentBudget.seasonType && currentBudget.seasonType !== selectedSeason) {
        setSelectedBudgetId('all');
        setSelectedVersionId(null);
        setVersions([]);
      }
    }
  }, [selectedSeason]);

  // Toggle budget selection for multi-compare (max = seasonCount)
  const toggleBudgetSelection = (budgetId: string) => {
    setSelectedBudgetIds(prev => {
      if (prev.includes(budgetId)) {
        return prev.filter(id => id !== budgetId);
      }
      if (prev.length >= seasonCount) {
        toast.error(t('otbAnalysis.maxBudgets') || `Maximum ${seasonCount} budgets can be compared`);
        return prev;
      }
      return [...prev, budgetId];
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedBudgetId('all');
    setSelectedSeasonGroup('all');
    setSelectedSeason('all');
    setSelectedVersionId(null);
    setVersions([]);
    setBudgetContext(null);
    setSelectedYear('all');
    setComparisonType('same');
    setSelectedBudgetIds([]);
    setSeasonCount(1);
  };

  const hasActiveFilters = selectedBudgetId !== 'all' || selectedSeasonGroup !== 'all' || selectedSeason !== 'all' || selectedVersionId || selectedYear !== 'all' || selectedBudgetIds.length > 0;

  // Filter budgets by year, type, and season
  const filteredBudgets = useMemo(() => {
    let list = apiBudgets;
    // Filter by year
    if (selectedYear !== 'all') {
      list = list.filter((b: any) => b.fiscalYear === selectedYear);
    }
    // For "same" type, if a budget is already selected, only show same seasonType
    if (comparisonType === 'same' && selectedBudgetIds.length > 0) {
      const firstBudget = apiBudgets.find((b: any) => b.id === selectedBudgetIds[0]);
      if (firstBudget?.seasonType) {
        list = list.filter((b: any) => b.seasonType === firstBudget.seasonType);
      }
    }
    if (selectedSeasonGroup !== 'all') {
      const seasonFiltered = list.filter((b: any) => b.seasonGroup === selectedSeasonGroup);
      if (seasonFiltered.length > 0) list = seasonFiltered;
    }
    if (selectedSeason !== 'all') {
      const seasonFiltered = list.filter((b: any) => b.seasonType === selectedSeason);
      if (seasonFiltered.length > 0) list = seasonFiltered;
    }
    return list;
  }, [apiBudgets, selectedYear, comparisonType, selectedBudgetIds, selectedSeasonGroup, selectedSeason]);

  const selectedBudget = selectedBudgetId === 'all'
    ? null
    : apiBudgets.find((b: any) => b.id === selectedBudgetId);
  const selectedVersion = versions.find((v: any) => v.id === selectedVersionId);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    let totalOtbValue = 0;

    // Sum from collection data
    collectionSections.forEach((section: any) => {
      STORES.forEach((store: any) => {
        const key = `collection_${section.id}_${store.id}`;
        totalOtbValue += localData[key]?.otbValue || 0;
      });
    });

    return { otbValue: totalOtbValue };
  }, [localData]);

  // Toggle expanded state for hierarchy (Category -> SubCategory -> Gender)
  const toggleCategoryExpanded = (categoryId: any) => {
    setExpandedCategories((prev: any) => ({ ...prev, [categoryId]: prev[categoryId] === false ? true : false }));
  };

  const toggleSubCategoryExpanded = (catId: any, subCatId: any) => {
    const key = `${catId}_${subCatId}`;
    setExpandedSubCategories((prev: any) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const handleToggleAll = () => {
    const newExpanded = allCollapsed; // if currently collapsed → expand, vice versa
    setAllCollapsed(!newExpanded);
    const newCats: Record<string, boolean> = {};
    const newSubCats: Record<string, boolean> = {};
    categoryFirstStructure.forEach((catEntry: any) => {
      newCats[catEntry.id] = newExpanded;
      Object.values(catEntry.subCategories).forEach((subCatEntry: any) => {
        newSubCats[`${catEntry.id}_${subCatEntry.subCategory.id}`] = newExpanded;
      });
    });
    setExpandedCategories(newCats);
    setExpandedSubCategories(newSubCats);
  };

  // Generate filter options from categoryStructure
  const filterOptions = useMemo(() => {
    const genders: any[] = [{ id: 'all', name: 'All Genders' }];
    const categories: any[] = [{ id: 'all', name: 'All Categories' }];
    const subCategories: any[] = [{ id: 'all', name: 'All Sub-Categories' }];

    categoryStructure.forEach((genderGroup: any) => {
      genders.push({ id: genderGroup.gender.id, name: genderGroup.gender.name });
      genderGroup.categories.forEach((cat: any) => {
        if (!categories.find((c: any) => c.id === cat.id)) {
          categories.push({ id: cat.id, name: cat.name, genderId: genderGroup.gender.id });
        }
        cat.subCategories.forEach((subCat: any) => {
          if (!subCategories.find((sc: any) => sc.id === subCat.id)) {
            subCategories.push({ id: subCat.id, name: subCat.name, categoryId: cat.id, genderId: genderGroup.gender.id });
          }
        });
      });
    });

    return { genders, categories, subCategories };
  }, [categoryStructure]);

  // Get filtered categories based on gender selection
  const filteredCategoryOptions = useMemo(() => {
    if (genderFilter === 'all') return filterOptions.categories;
    return [
      { id: 'all', name: 'All Categories' },
      ...filterOptions.categories.filter((c: any) => c.id !== 'all' && c.genderId === genderFilter)
    ];
  }, [genderFilter, filterOptions.categories]);

  // Get filtered sub-categories based on gender and category selection
  const filteredSubCategoryOptions = useMemo(() => {
    let options = filterOptions.subCategories;
    if (genderFilter !== 'all') {
      options = options.filter((sc: any) => sc.id === 'all' || sc.genderId === genderFilter);
    }
    if (categoryFilter !== 'all') {
      options = options.filter((sc: any) => sc.id === 'all' || sc.categoryId === categoryFilter);
    }
    return [{ id: 'all', name: 'All Sub-Categories' }, ...options.filter((o: any) => o.id !== 'all')];
  }, [genderFilter, categoryFilter, filterOptions.subCategories]);

  // Reset dependent filters when parent filter changes
  const handleGenderFilterChange = (value: any) => {
    setGenderFilter(value);
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setOpenCategoryDropdown(null);
  };

  const handleCategoryFilterChange = (value: any) => {
    setCategoryFilter(value);
    setSubCategoryFilter('all');
    setOpenCategoryDropdown(null);
  };

  const handleSubCategoryFilterChange = (value: any) => {
    setSubCategoryFilter(value);
    setOpenCategoryDropdown(null);
  };

  // Brand filter options from available budgets (filtered by selected year)
  const brandOptions = useMemo(() => {
    const budgets = selectedYear === 'all'
      ? apiBudgets
      : apiBudgets.filter((b: any) => b.fiscalYear === selectedYear);
    const seen = new Set<string>();
    return budgets.reduce((acc: any[], b: any) => {
      const key = b.brandName || b.groupBrand || 'Unknown';
      if (!seen.has(key)) {
        seen.add(key);
        acc.push({ value: b.id, label: key });
      }
      return acc;
    }, []);
  }, [apiBudgets, selectedYear]);

  const handleBrandToggle = (budgetId: string) => {
    setSelectedBudgetIds(prev => {
      if (prev.includes(budgetId)) {
        // Remove brand
        const next = prev.filter(id => id !== budgetId);
        if (next.length === 1) {
          setSelectedBudgetId(next[0]);
          const budget = apiBudgets.find((b: any) => b.id === next[0]);
          if (budget) {
            if (budget.seasonGroup) setSelectedSeasonGroup(budget.seasonGroup);
            if (budget.seasonType) setSelectedSeason(budget.seasonType);
          }
        } else if (next.length === 0) {
          setSelectedBudgetId('all');
        }
        return next;
      }
      // Add brand
      const next = [...prev, budgetId];
      if (next.length === 1) {
        setSelectedBudgetId(budgetId);
        const budget = apiBudgets.find((b: any) => b.id === budgetId);
        if (budget) {
          if (budget.seasonGroup) setSelectedSeasonGroup(budget.seasonGroup);
          if (budget.seasonType) setSelectedSeason(budget.seasonType);
        }
      }
      return next;
    });
  };

  // Common table styles - DAFC Design System (compact)
  const headerCellClass = "px-3 py-2 text-center text-xs font-semibold tracking-wide font-['Montserrat']";
  const headerDarkCell = darkMode ? 'bg-[#0A0A0A] text-[#999999]' : 'bg-gray-100 text-gray-700';
  const headerGoldCell = darkMode ? 'bg-[rgba(215,183,151,0.2)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.3)] text-[#6B4D30]';
  const headerBrownCell = darkMode ? 'bg-[rgba(139,115,85,0.25)] text-[#D7B797]' : 'bg-[rgba(139,115,85,0.2)] text-[#5C4033]';
  const headerDarkBrownCell = darkMode ? 'bg-[rgba(92,64,51,0.3)] text-[#D7B797]' : 'bg-[rgba(92,64,51,0.2)] text-[#5C4033]';
  const groupRowClass = darkMode
    ? "bg-[rgba(215,183,151,0.08)] border-l-2 border-[#D7B797]"
    : "bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] border-l-2 border-[#D7B797]";
  const sumRowClass = darkMode
    ? "bg-gradient-to-r from-[rgba(215,183,151,0.2)] to-[rgba(215,183,151,0.15)] text-[#D7B797] font-semibold"
    : "bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] text-[#5C4A32] font-semibold";

  // Transform categoryStructure (Gender->Cat->SubCat) into categoryFirstStructure (Cat->SubCat->Gender)
  const categoryFirstStructure = useMemo(() => {
    const catMap: Record<string, { category: any; subCategories: Record<string, { subCategory: any; genders: { gender: any; dataKey: string }[] }> }> = {};

    categoryStructure.forEach((genderGroup: any) => {
      genderGroup.categories.forEach((cat: any) => {
        if (!catMap[cat.id]) {
          catMap[cat.id] = { category: { id: cat.id, name: cat.name }, subCategories: {} };
        }
        cat.subCategories.forEach((subCat: any) => {
          if (!catMap[cat.id].subCategories[subCat.id]) {
            catMap[cat.id].subCategories[subCat.id] = { subCategory: { id: subCat.id, name: subCat.name }, genders: [] };
          }
          catMap[cat.id].subCategories[subCat.id].genders.push({
            gender: genderGroup.gender,
            dataKey: `${genderGroup.gender.id}_${cat.id}_${subCat.id}`,
          });
        });
      });
    });

    return Object.values(catMap).map(entry => ({
      ...entry.category,
      subCategories: Object.values(entry.subCategories),
    }));
  }, [categoryStructure]);

  // Render Category Tab - Hierarchical Collapsible (Category -> SubCategory -> Gender)
  const renderCategoryTab = () => {
    // Calculate category-level totals (across all sub-cats and genders)
    const calculateCategoryTotals = (catEntry: any) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      catEntry.subCategories.forEach((subCatEntry: any) => {
        subCatEntry.genders.forEach((g: any) => {
          const data = localData[g.dataKey] || {};
          totals.buyPct += data.buyPct || 0;
          totals.salesPct += data.salesPct || 0;
          totals.buyProposed += data.buyProposed || 0;
          totals.otbProposed += data.otbProposed || 0;
          totals.otbSubmitted += data.otbSubmitted || 0;
          totals.buyActual += data.buyActual || 0;
        });
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    // Calculate subcategory-level totals (across all genders)
    const calculateSubCategoryTotals = (subCatEntry: any) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      subCatEntry.genders.forEach((g: any) => {
        const data = localData[g.dataKey] || {};
        totals.buyPct += data.buyPct || 0;
        totals.salesPct += data.salesPct || 0;
        totals.buyProposed += data.buyProposed || 0;
        totals.otbProposed += data.otbProposed || 0;
        totals.otbSubmitted += data.otbSubmitted || 0;
        totals.buyActual += data.buyActual || 0;
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    // Filter: L1=category, L2=subCategory, L3=gender
    const filteredData = categoryFirstStructure
      .filter((catEntry: any) => categoryFilter === 'all' || catEntry.id === categoryFilter)
      .map((catEntry: any) => ({
        ...catEntry,
        subCategories: catEntry.subCategories
          .filter((subCatEntry: any) => subCategoryFilter === 'all' || subCatEntry.subCategory.id === subCategoryFilter)
          .map((subCatEntry: any) => ({
            ...subCatEntry,
            genders: subCatEntry.genders.filter((g: any) => genderFilter === 'all' || g.gender.id === genderFilter),
          }))
          .filter((subCatEntry: any) => subCatEntry.genders.length > 0),
      }))
      .filter((catEntry: any) => catEntry.subCategories.length > 0);

    return (
      <div className="p-4 space-y-3">
        {/* Hierarchical Content: Category (L1) -> SubCategory (L2) -> Gender rows (L3) */}
        {filteredData.map((catEntry: any) => {
          const catTotals = calculateCategoryTotals(catEntry);
          const isCatExpanded = expandedCategories[catEntry.id] !== false;

          return (
            <div key={catEntry.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
              {/* Category Header - Level 1 */}
              <div
                onClick={() => toggleCategoryExpanded(catEntry.id)}
                className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${
                  darkMode
                    ? 'bg-gradient-to-r from-[#1A1A1A] to-[#121212] hover:from-[#2E2E2E] hover:to-[#1A1A1A]'
                    : 'bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] hover:from-[rgba(215,183,151,0.25)] hover:to-[rgba(215,183,151,0.15)] border-b border-[rgba(215,183,151,0.2)]'
                }`}
              >
                <button className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'bg-white/20 hover:bg-white/30' : 'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'
                }`}>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isCatExpanded ? '' : '-rotate-90'} ${darkMode ? 'text-white' : 'text-[#6B4D30]'}`}
                  />
                </button>
                <Tag size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-white' : 'text-[#5C4A3A]'}`}>{catEntry.name}</span>
                <span className={`ml-auto text-xs md:text-sm ${darkMode ? 'text-white/80' : 'text-[#6B4D30]'}`}>
                  {catEntry.subCategories.length} sub-categories
                </span>
                <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-white/90' : 'text-[#5C4A3A]'}`}>
                  <span>Buy: <strong>{catTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{catTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{catTotals.otbProposed.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Category Content */}
              {isCatExpanded && (
                <div className={`p-3 space-y-2 ${darkMode ? 'bg-[#0A0A0A]' : 'bg-[#F2F2F2]'}`}>
                  {catEntry.subCategories.map((subCatEntry: any) => {
                    const subCatKey = `${catEntry.id}_${subCatEntry.subCategory.id}`;
                    const isSubCatExpanded = expandedSubCategories[subCatKey] !== false;
                    const subCatTotals = calculateSubCategoryTotals(subCatEntry);

                    return (
                      <div key={subCatEntry.subCategory.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-[#C4B5A5] bg-white'}`}>
                        {/* SubCategory Header - Level 2 */}
                        <div
                          onClick={() => toggleSubCategoryExpanded(catEntry.id, subCatEntry.subCategory.id)}
                          className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${
                            darkMode
                              ? 'bg-[rgba(215,183,151,0.08)] hover:bg-[rgba(160,120,75,0.18)]'
                              : 'bg-[rgba(160,120,75,0.12)] hover:bg-[rgba(215,183,151,0.2)]'
                          }`}
                        >
                          <button className={`p-1 rounded-lg transition-colors ${
                            darkMode ? 'bg-[rgba(160,120,75,0.18)] hover:bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.2)] hover:bg-[rgba(215,183,151,0.3)]'
                          }`}>
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} ${isSubCatExpanded ? '' : '-rotate-90'}`}
                            />
                          </button>
                          <Layers size={16} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                          <span className={`font-semibold text-xs uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                            {subCatEntry.subCategory.name}
                          </span>
                        </div>

                        {/* Gender Table - Level 3 */}
                        {isSubCatExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className={`px-4 py-2 text-left text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.gender') || 'Gender'}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('common.submit')}</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>% Actual</th>
                                  <th className={`px-3 py-2 text-center text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('common.actions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subCatEntry.genders.map((gEntry: any, gIdx: number) => {
                                  const cellKey = gEntry.dataKey;
                                  const rowData = localData[cellKey] || {};
                                  const isEditing = editingCell === cellKey;

                                  return (
                                    <tr
                                      key={cellKey}
                                      className={`border-b transition-colors ${
                                        darkMode
                                          ? `border-[#2E2E2E] hover:bg-[#1A1A1A] ${gIdx % 2 === 0 ? 'bg-[#121212]' : 'bg-[#0A0A0A]'}`
                                          : `border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${gIdx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`
                                      }`}
                                    >
                                      <td className="px-4 py-0.5">
                                        <div className="flex items-center gap-2">
                                          <Users size={12} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                                          <span className={darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}>{gEntry.gender.name}</span>
                                        </div>
                                      </td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.buyPct || 0}%</td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.salesPct || 0}%</td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.stPct || 0}%</td>
                                      <td className={`px-3 py-0.5 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                                        <EditableCell
                                          cellKey={cellKey}
                                          value={rowData.buyProposed || 0}
                                          isEditing={isEditing}
                                          editValue={editValue}
                                          onStartEdit={handleStartEdit}
                                          onSaveEdit={handleSaveEdit}
                                          onChangeValue={setEditValue}
                                          onKeyDown={handleKeyDown}
                                          darkMode={darkMode}
                                        />
                                      </td>
                                      <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                                        {(rowData.otbProposed || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                                        (rowData.varPct || 0) < 0 ? 'text-[#F85149]' : 'text-[#2A9E6A]'
                                      }`}>
                                        {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                                      </td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                                        {(rowData.otbSubmitted || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.buyActual || 0}%</td>
                                      <td className="px-3 py-0.5 text-center">
                                        <button
                                          onClick={() => {
                                            if (onOpenSkuProposal) {
                                              onOpenSkuProposal({
                                                budgetId: selectedBudgetId !== 'all' ? selectedBudgetId : budgetContext?.budgetId,
                                                budgetName: selectedBudget?.budgetName || budgetContext?.budgetName,
                                                fiscalYear: selectedBudget?.fiscalYear || budgetContext?.fiscalYear,
                                                brandName: selectedBudget?.brandName || budgetContext?.brandName,
                                                seasonGroup: selectedSeasonGroup !== 'all' ? selectedSeasonGroup : budgetContext?.seasonGroup,
                                                season: selectedSeason !== 'all' ? selectedSeason : budgetContext?.season,
                                                gender: gEntry.gender,
                                                category: { id: catEntry.id, name: catEntry.name },
                                                subCategory: subCatEntry.subCategory,
                                                otbData: rowData
                                              });
                                            }
                                          }}
                                          className="p-1.5 border border-[#8B7355]/40 hover:border-[#D7B797]/60 bg-[#8B7355]/10 hover:bg-[#8B7355]/20 text-[#D7B797] rounded-lg transition-all"
                                          title={t('otbAnalysis.allocateSKU')}
                                        >
                                          <Split size={12} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* SubCategory Subtotal Row */}
                                <tr className={darkMode ? 'bg-gradient-to-r from-[rgba(215,183,151,0.2)] to-[rgba(215,183,151,0.15)] font-medium' : 'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                                  <td className={`px-4 py-0.5 font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{subCatTotals.buyPct}%</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{subCatTotals.salesPct}%</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{subCatTotals.stPct}%</td>
                                  <td className={`px-3 py-0.5 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{subCatTotals.buyProposed}%</td>
                                  <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{subCatTotals.otbProposed.toLocaleString()}</td>
                                  <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${
                                    subCatTotals.varPct < 0 ? 'text-[#FF7B72]' : darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'
                                  }`}>
                                    {subCatTotals.varPct > 0 ? '+' : ''}{subCatTotals.varPct}%
                                  </td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{subCatTotals.otbSubmitted.toLocaleString()}</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{subCatTotals.buyActual}%</td>
                                  <td className="px-3 py-0.5"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Category Total */}
                  <div className={`rounded-xl p-3 border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)]'
                      : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)]'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        TOTAL {catEntry.name.toUpperCase()}
                      </span>
                      <div className={`flex flex-wrap items-center gap-2 md:gap-6 text-xs md:text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        <span>% Buy: <strong>{catTotals.buyPct}%</strong></span>
                        <span>% Sales: <strong>{catTotals.salesPct}%</strong></span>
                        <span>% ST: <strong>{catTotals.stPct}%</strong></span>
                        <span>% Proposed: <strong>{catTotals.buyProposed}%</strong></span>
                        <span>$ OTB: <strong>{catTotals.otbProposed.toLocaleString()}</strong></span>
                        <span className={catTotals.varPct < 0 ? 'text-[#F85149]' : ''}>
                          Var: <strong>{catTotals.varPct > 0 ? '+' : ''}{catTotals.varPct}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Collection Tab — collection sections with store-level detail
  const renderCollectionTab = () => {
    const calculateCollectionTotals = (sectionId: string) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, moc: 0, userBuyPct: 0, otbValue: 0, varPct: 0 };
      let count = 0;
      STORES.forEach((store: any) => {
        const key = `collection_${sectionId}_${store.id}`;
        const data = localData[key] || {};
        totals.buyPct += data.buyPct || 0;
        totals.salesPct += data.salesPct || 0;
        totals.moc += data.moc || 0;
        totals.userBuyPct += data.userBuyPct || 0;
        totals.otbValue += data.otbValue || 0;
        totals.varPct += data.varPct || 0;
        count++;
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      if (count > 0) totals.moc = Math.round((totals.moc / count) * 10) / 10;
      return totals;
    };

    return (
      <div className="p-4 space-y-3">
        {collectionSections.map((section: any) => {
          const sectionTotals = calculateCollectionTotals(section.id);
          const isExpanded = expandedCollections[section.id] !== false;

          return (
            <div key={section.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
              {/* Collection Header */}
              <div
                onClick={() => setExpandedCollections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${
                  darkMode
                    ? 'bg-gradient-to-r from-[#1A1A1A] to-[#121212] hover:from-[#2E2E2E] hover:to-[#1A1A1A]'
                    : 'bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] hover:from-[rgba(215,183,151,0.25)] hover:to-[rgba(215,183,151,0.15)] border-b border-[rgba(215,183,151,0.2)]'
                }`}
              >
                <button className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'bg-white/20 hover:bg-white/30' : 'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'
                }`}>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'} ${darkMode ? 'text-white' : 'text-[#6B4D30]'}`} />
                </button>
                <Bookmark size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-white' : 'text-[#5C4A3A]'}`}>{section.name}</span>
                <span className={`ml-auto text-xs md:text-sm ${darkMode ? 'text-white/80' : 'text-[#6B4D30]'}`}>
                  {STORES.length} stores
                </span>
                <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-white/90' : 'text-[#5C4A3A]'}`}>
                  <span>Buy: <strong>{sectionTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{sectionTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{formatCurrency(sectionTotals.otbValue)}</strong></span>
                </div>
              </div>

              {/* Collection Store Table */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>Store</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>MOC</th>
                        <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                        <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                        <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STORES.map((store: any, sIdx: number) => {
                        const cellKey = `collection_${section.id}_${store.id}`;
                        const rowData = localData[cellKey] || {};
                        const isEditing = editingCell === cellKey;

                        return (
                          <tr
                            key={cellKey}
                            className={`border-b transition-colors ${
                              darkMode
                                ? `border-[#2E2E2E] hover:bg-[#1A1A1A] ${sIdx % 2 === 0 ? 'bg-[#121212]' : 'bg-[#0A0A0A]'}`
                                : `border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${sIdx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`
                            }`}
                          >
                            <td className="px-4 py-0.5">
                              <div className="flex items-center gap-2">
                                <Store size={12} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                                <span className={darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}>{store.name}</span>
                              </div>
                            </td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.buyPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.salesPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.stPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.moc || 0}</td>
                            <td className={`px-3 py-0.5 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                              <EditableCell
                                cellKey={cellKey}
                                value={rowData.userBuyPct || 0}
                                isEditing={isEditing}
                                editValue={editValue}
                                onStartEdit={handleStartEdit}
                                onSaveEdit={handleSaveEdit}
                                onChangeValue={setEditValue}
                                onKeyDown={handleKeyDown}
                                darkMode={darkMode}
                              />
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                              {formatCurrency(rowData.otbValue || 0)}
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                              (rowData.varPct || 0) < 0 ? 'text-[#F85149]' : 'text-[#2A9E6A]'
                            }`}>
                              {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                            </td>
                          </tr>
                        );
                      })}
                      {/* Collection Subtotal */}
                      <tr className={darkMode ? 'bg-gradient-to-r from-[rgba(215,183,151,0.2)] to-[rgba(215,183,151,0.15)] font-medium' : 'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                        <td className={`px-4 py-0.5 font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{sectionTotals.buyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{sectionTotals.salesPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{sectionTotals.stPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{sectionTotals.moc}</td>
                        <td className={`px-3 py-0.5 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{sectionTotals.userBuyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{formatCurrency(sectionTotals.otbValue)}</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${
                          sectionTotals.varPct < 0 ? 'text-[#FF7B72]' : darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'
                        }`}>
                          {sectionTotals.varPct > 0 ? '+' : ''}{sectionTotals.varPct}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Gender Tab — gender groups with store-level detail
  const renderGenderTab = () => {
    const genderList = categoryStructure.length > 0
      ? categoryStructure.map((g: any) => g.gender)
      : GENDERS;

    const calculateGenderTotals = (genderId: string) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, userBuyPct: 0, otbValue: 0, varPct: 0 };
      STORES.forEach((store: any) => {
        const key = `gender_${genderId}_${store.id}`;
        const data = localData[key] || {};
        totals.buyPct += data.buyPct || 0;
        totals.salesPct += data.salesPct || 0;
        totals.userBuyPct += data.userBuyPct || 0;
        totals.otbValue += data.otbValue || 0;
        totals.varPct += data.varPct || 0;
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      return totals;
    };

    return (
      <div className="p-4 space-y-3">
        {genderList.map((gender: any) => {
          const genderTotals = calculateGenderTotals(gender.id);
          const isExpanded = expandedGenderGroups[gender.id] !== false;

          return (
            <div key={gender.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
              {/* Gender Header */}
              <div
                onClick={() => setExpandedGenderGroups(prev => ({ ...prev, [gender.id]: !isExpanded }))}
                className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${
                  darkMode
                    ? 'bg-gradient-to-r from-[#1A1A1A] to-[#121212] hover:from-[#2E2E2E] hover:to-[#1A1A1A]'
                    : 'bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] hover:from-[rgba(215,183,151,0.25)] hover:to-[rgba(215,183,151,0.15)] border-b border-[rgba(215,183,151,0.2)]'
                }`}
              >
                <button className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'bg-white/20 hover:bg-white/30' : 'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'
                }`}>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'} ${darkMode ? 'text-white' : 'text-[#6B4D30]'}`} />
                </button>
                <Users size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-white' : 'text-[#5C4A3A]'}`}>{gender.name}</span>
                <span className={`ml-auto text-xs md:text-sm ${darkMode ? 'text-white/80' : 'text-[#6B4D30]'}`}>
                  {STORES.length} stores
                </span>
                <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-white/90' : 'text-[#5C4A3A]'}`}>
                  <span>Buy: <strong>{genderTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{genderTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{formatCurrency(genderTotals.otbValue)}</strong></span>
                </div>
              </div>

              {/* Gender Store Table */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>Store</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                        <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                        <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                        <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STORES.map((store: any, sIdx: number) => {
                        const cellKey = `gender_${gender.id}_${store.id}`;
                        const rowData = localData[cellKey] || {};
                        const isEditing = editingCell === cellKey;

                        return (
                          <tr
                            key={cellKey}
                            className={`border-b transition-colors ${
                              darkMode
                                ? `border-[#2E2E2E] hover:bg-[#1A1A1A] ${sIdx % 2 === 0 ? 'bg-[#121212]' : 'bg-[#0A0A0A]'}`
                                : `border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${sIdx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`
                            }`}
                          >
                            <td className="px-4 py-0.5">
                              <div className="flex items-center gap-2">
                                <Store size={12} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                                <span className={darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}>{store.name}</span>
                              </div>
                            </td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.buyPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.salesPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.stPct || 0}%</td>
                            <td className={`px-3 py-0.5 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                              <EditableCell
                                cellKey={cellKey}
                                value={rowData.userBuyPct || 0}
                                isEditing={isEditing}
                                editValue={editValue}
                                onStartEdit={handleStartEdit}
                                onSaveEdit={handleSaveEdit}
                                onChangeValue={setEditValue}
                                onKeyDown={handleKeyDown}
                                darkMode={darkMode}
                              />
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                              {formatCurrency(rowData.otbValue || 0)}
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                              (rowData.varPct || 0) < 0 ? 'text-[#F85149]' : 'text-[#2A9E6A]'
                            }`}>
                              {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                            </td>
                          </tr>
                        );
                      })}
                      {/* Gender Subtotal */}
                      <tr className={darkMode ? 'bg-gradient-to-r from-[rgba(215,183,151,0.2)] to-[rgba(215,183,151,0.15)] font-medium' : 'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                        <td className={`px-4 py-0.5 font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{genderTotals.buyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{genderTotals.salesPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{genderTotals.stPct}%</td>
                        <td className={`px-3 py-0.5 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{genderTotals.userBuyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{formatCurrency(genderTotals.otbValue)}</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${
                          genderTotals.varPct < 0 ? 'text-[#FF7B72]' : darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'
                        }`}>
                          {genderTotals.varPct > 0 ? '+' : ''}{genderTotals.varPct}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Budget Comparison Table (when 2-3 budgets selected)
  const renderComparisonTable = () => {
    const comparedBudgets = selectedBudgetIds
      .map(id => apiBudgets.find((b: any) => b.id === id))
      .filter(Boolean);
    if (comparedBudgets.length < 2) return null;

    // Flatten categories for rows
    const categoryRows: { gender: string; category: string; subCategory: string; key: string }[] = [];
    categoryStructure.forEach((genderGroup: any) => {
      genderGroup.categories.forEach((cat: any) => {
        cat.subCategories.forEach((subCat: any) => {
          categoryRows.push({
            gender: genderGroup.gender.name,
            category: cat.name,
            subCategory: subCat.name,
            key: `${genderGroup.gender.id}_${cat.id}_${subCat.id}`
          });
        });
      });
    });

    // Group by category for cleaner display
    const groupedRows: Record<string, typeof categoryRows> = {};
    categoryRows.forEach(row => {
      const groupKey = `${row.gender} - ${row.category}`;
      if (!groupedRows[groupKey]) groupedRows[groupKey] = [];
      groupedRows[groupKey].push(row);
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${headerCellClass} ${headerDarkCell} text-left min-w-[200px]`} rowSpan={2}>
                {t('otbAnalysis.category') || 'Category'}
              </th>
              {comparedBudgets.map((budget: any) => (
                <th key={budget.id} className={`${headerCellClass} ${headerGoldCell}`} colSpan={3}>
                  <div className="flex flex-col items-center py-1">
                    <span className="font-bold text-xs">{budget.budgetName}</span>
                    <span className="text-[10px] opacity-70">FY{budget.fiscalYear} &middot; {budget.seasonGroup} {budget.seasonType}</span>
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {comparedBudgets.map((budget: any) => (
                <React.Fragment key={`h2-${budget.id}`}>
                  <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.pctBuy')}</th>
                  <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.pctSales')}</th>
                  <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.pctST')}</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedRows).map(([groupName, rows]) => (
              <React.Fragment key={groupName}>
                {/* Category Group Header */}
                <tr className={groupRowClass}>
                  <td className="px-3 py-1" colSpan={1 + comparedBudgets.length * 3}>
                    <div className="flex items-center gap-2">
                      <Tag size={12} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                      <span className={`font-semibold text-xs uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{groupName}</span>
                    </div>
                  </td>
                </tr>
                {rows.map((row, idx) => {
                  const data = localData[row.key] || {};
                  return (
                    <tr
                      key={row.key}
                      className={`border-b transition-colors ${
                        darkMode
                          ? `border-[#2E2E2E] hover:bg-[#1A1A1A] ${idx % 2 === 0 ? 'bg-[#121212]' : 'bg-[#0A0A0A]'}`
                          : `border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`
                      }`}
                    >
                      <td className="px-4 py-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-[#666666]' : 'bg-[#999999]'}`} />
                          <span className={darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}>{row.subCategory}</span>
                        </div>
                      </td>
                      {comparedBudgets.map((budget: any, bIdx: number) => {
                        // Vary data slightly per budget for demo visualization
                        const offset = bIdx * 3;
                        return (
                          <React.Fragment key={`${row.key}-${budget.id}`}>
                            <td className={`px-3 py-1 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                              {Math.max(0, (data.buyPct || 0) - offset)}%
                            </td>
                            <td className={`px-3 py-1 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                              {Math.max(0, (data.salesPct || 0) - offset)}%
                            </td>
                            <td className={`px-3 py-1 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                              {Math.max(0, (data.stPct || 0) - offset)}%
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            {/* Grand Total row */}
            <tr className={sumRowClass}>
              <td className="px-4 py-1 font-semibold text-xs uppercase tracking-wide font-['Montserrat']">{t('otbAnalysis.total')}</td>
              {comparedBudgets.map((budget: any) => (
                <React.Fragment key={`total-${budget.id}`}>
                  <td className="px-3 py-1 text-center font-['JetBrains_Mono'] font-bold">100%</td>
                  <td className="px-3 py-1 text-center font-['JetBrains_Mono'] font-bold">100%</td>
                  <td className="px-3 py-1 text-center font-['JetBrains_Mono']">-</td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Empty state: no approved budgets available
  if (!loadingBudgets && apiBudgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-[rgba(215,183,151,0.15)]'
        }`}>
          <BarChart3 size={32} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
        </div>
        <h3 className={`text-lg font-bold font-['Montserrat'] mb-2 ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
          {t('otbAnalysis.noApprovedBudgets') || 'No approved budgets available'}
        </h3>
        <p className={`text-sm mb-6 max-w-md ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
          {t('otbAnalysis.noApprovedBudgetsDescription') || 'Please submit and approve a budget in Budget Management first.'}
        </p>
        <button
          onClick={() => router.push('/budget-management')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold font-['Montserrat'] transition-all ${
            darkMode
              ? 'bg-[#D7B797] text-[#1A1A1A] hover:bg-[#C4A882]'
              : 'bg-[#6B4D30] text-white hover:bg-[#5C4028]'
          }`}
        >
          {t('otbAnalysis.goToBudgetManagement') || 'Go to Budget Management'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Filter Toolbar — hides entirely on scroll */}
      <div ref={barRef} className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-2 md:mb-3 border-b backdrop-blur-sm relative ${
        darkMode ? 'bg-[#121212]/95 border-[#2E2E2E]' : 'bg-white/95 border-[rgba(215,183,151,0.3)]'
      }`}>

        {/* ===== FILTER CONTENT ===== */}
        <div>
        <div>
              {/* Mobile Filter Button */}
              {isMobile && (
                <div className="px-3 md:px-6 py-1.5">
                <button
                  onClick={openFilter}
                  className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-medium ${
                    darkMode
                      ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#D7B797]'
                      : 'bg-white border-[#C4B5A5] text-[#6B4D30]'
                  }`}
                >
                  <Filter size={12} />
                  {t('otbAnalysis.filters')}
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-[#D7B797]" />
                  )}
                </button>
                </div>
              )}
              {/* Desktop Filters */}
              {!isMobile && (
              <div className="flex flex-wrap items-center gap-2.5 px-3 md:px-6 py-1.5 relative z-[100]">
                {/* Year Filter */}
                <div className="relative shrink-0" ref={setDropdownRef('year')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'year' ? null : 'year'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-3 py-[7px] border rounded-lg font-medium cursor-pointer flex items-center gap-2 text-xs transition-all duration-200 ${
                      openDropdown === 'year'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/50 shadow-[0_0_0_1px_rgba(215,183,151,0.12)]'
                          : 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/60 shadow-[0_0_0_1px_rgba(215,183,151,0.15)]'
                        : selectedYear !== 'all'
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.2)] text-[#D7B797] hover:border-[rgba(215,183,151,0.35)]'
                            : 'bg-[rgba(215,183,151,0.04)] border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                          : darkMode
                            ? 'bg-[#141414] border-[#2A2A2A] text-[#F2F2F2] hover:border-[#444444] hover:bg-[#181818]'
                            : 'bg-white border-[#D4CCC2] text-[#1A1A1A] hover:border-[#B8A998] hover:bg-[#FDFCFB]'
                    }`}
                  >
                      <Calendar size={12} className={selectedYear !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')} />
                      <span>{selectedYear === 'all' ? (t('common.all') || 'All') : `FY ${selectedYear}`}</span>
                    <ChevronDown size={10} strokeWidth={2} className={`transition-transform duration-200 ease-out ${openDropdown === 'year' ? 'rotate-180' : ''} ${openDropdown === 'year' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                  </button>
                  {openDropdown === 'year' && (
                    <div className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#161616] border-[#2E2E2E]' : 'bg-white border-[#D4CCC2]'
                    }`} style={{ boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)' : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06)' }}>
                      <div className="h-[1.5px]" style={{ background: darkMode ? 'linear-gradient(90deg, transparent 5%, rgba(215,183,151,0.35) 50%, transparent 95%)' : 'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)' }} />
                      <div className="py-1">
                      <div
                        onClick={() => { setSelectedYear('all'); setOpenDropdown(null); setSelectedBudgetIds([]); }}
                        className={`relative px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-all duration-150 ${
                          selectedYear === 'all'
                            ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)] text-[#CCCCCC] hover:text-[#F2F2F2]' : 'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {selectedYear === 'all' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                        <span className={selectedYear === 'all' ? 'font-semibold' : 'font-medium'}>{t('common.all') || 'All Years'}</span>
                        {selectedYear === 'all' && <Check size={13} strokeWidth={2.5} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                      </div>
                      {availableYears.map((year: number) => (
                        <div
                          key={year}
                          onClick={() => { setSelectedYear(year); setOpenDropdown(null); setSelectedBudgetIds([]); }}
                          className={`relative px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-all duration-150 ${
                            selectedYear === year
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)] text-[#CCCCCC] hover:text-[#F2F2F2]' : 'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'
                          }`}
                        >
                          {selectedYear === year && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                          <span className={selectedYear === year ? 'font-semibold' : 'font-medium'}>FY {year}</span>
                          {selectedYear === year && <Check size={13} strokeWidth={2.5} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Type Filter (Same/Different Season) — no label, compact */}
                <FilterSelect
                  value={comparisonType}
                  options={[
                    { value: 'same', label: t('otbAnalysis.same') || 'Same' },
                    { value: 'different', label: t('otbAnalysis.different') || 'Different' },
                  ]}
                  onChange={(val: any) => { setComparisonType(val); setSelectedBudgetIds([]); }}
                  darkMode={darkMode}
                />

                {/* Number of Seasons Dropdown */}
                <div className="relative shrink-0" ref={setDropdownRef('seasonCount')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'seasonCount' ? null : 'seasonCount'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-3 py-[7px] border rounded-lg font-medium cursor-pointer flex items-center gap-2 text-xs transition-all duration-200 ${
                      openDropdown === 'seasonCount'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/50 shadow-[0_0_0_1px_rgba(215,183,151,0.12)]'
                          : 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/60 shadow-[0_0_0_1px_rgba(215,183,151,0.15)]'
                        : darkMode
                          ? 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.2)] text-[#D7B797] hover:border-[rgba(215,183,151,0.35)]'
                          : 'bg-[rgba(215,183,151,0.04)] border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                    }`}
                  >
                      <Calendar size={12} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                      <span>{seasonCount}</span>
                    <ChevronDown size={10} strokeWidth={2} className={`transition-transform duration-200 ease-out ${openDropdown === 'seasonCount' ? 'rotate-180' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
                  </button>
                  {openDropdown === 'seasonCount' && (
                    <div className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#161616] border-[#2E2E2E]' : 'bg-white border-[#D4CCC2]'
                    }`} style={{ boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)' : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06)' }}>
                      <div className="h-[1.5px]" style={{ background: darkMode ? 'linear-gradient(90deg, transparent 5%, rgba(215,183,151,0.35) 50%, transparent 95%)' : 'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)' }} />
                      <div className="py-1">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          onClick={() => {
                            setSeasonCount(n);
                            if (selectedBudgetIds.length > n) {
                              setSelectedBudgetIds(prev => prev.slice(0, n));
                            }
                            setOpenDropdown(null);
                          }}
                          className={`relative px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-all duration-150 ${
                            seasonCount === n
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)] text-[#CCCCCC] hover:text-[#F2F2F2]' : 'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'
                          }`}
                        >
                          {seasonCount === n && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                          <span className={seasonCount === n ? 'font-semibold' : 'font-medium'}>{n}</span>
                          {seasonCount === n && <Check size={13} strokeWidth={2.5} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`h-5 w-px hidden sm:block rounded-full ${darkMode ? 'bg-gradient-to-b from-transparent via-[#2E2E2E] to-transparent' : 'bg-gradient-to-b from-transparent via-[#C4B5A5]/40 to-transparent'}`} />

                {/* Budget Season Multi-Select */}
                <div className="relative flex-1 min-w-0" ref={setDropdownRef('budgetSeason')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'budgetSeason' ? null : 'budgetSeason'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-3 py-[7px] border rounded-lg font-medium cursor-pointer flex items-center justify-between text-xs transition-all duration-200 ${
                      openDropdown === 'budgetSeason'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/50 shadow-[0_0_0_1px_rgba(215,183,151,0.12)]'
                          : 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/60 shadow-[0_0_0_1px_rgba(215,183,151,0.15)]'
                        : selectedBudgetIds.length > 0
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.2)] text-[#D7B797] hover:border-[rgba(215,183,151,0.35)]'
                            : 'bg-[rgba(215,183,151,0.04)] border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                          : darkMode
                            ? 'bg-[#141414] border-[#2A2A2A] text-[#F2F2F2] hover:border-[#444444] hover:bg-[#181818]'
                            : 'bg-white border-[#D4CCC2] text-[#1A1A1A] hover:border-[#B8A998] hover:bg-[#FDFCFB]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={12} className={`shrink-0 ${selectedBudgetIds.length > 0 ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                      <span className="truncate">
                        {selectedBudgetIds.length === 0
                          ? (t('otbAnalysis.selectBudgets') || 'Select')
                          : selectedBudgetIds.length === 1
                            ? (apiBudgets.find((b: any) => b.id === selectedBudgetIds[0])?.budgetName || 'Budget')
                            : `${selectedBudgetIds.length} ${t('otbAnalysis.budgetsSelected') || 'selected'}`}
                      </span>
                      {selectedBudgetIds.length > 1 && (
                        <span className={`px-1.5 text-[10px] leading-[16px] font-bold rounded-md ${
                          darkMode ? 'bg-[#D7B797]/90 text-[#0A0A0A]' : 'bg-[#6B4D30] text-white'
                        }`} style={{ letterSpacing: '0.02em' }}>{selectedBudgetIds.length}</span>
                      )}
                    </div>
                    <ChevronDown size={12} strokeWidth={2} className={`flex-shrink-0 transition-transform duration-200 ease-out ${openDropdown === 'budgetSeason' ? 'rotate-180' : ''} ${openDropdown === 'budgetSeason' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                  </button>
                  {openDropdown === 'budgetSeason' && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-[320px] border rounded-lg z-[9999] overflow-hidden ${
                        darkMode ? 'bg-[#161616] border-[#2E2E2E]' : 'bg-white border-[#D4CCC2]'
                      }`}
                      style={{
                        boxShadow: darkMode
                          ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(215,183,151,0.06)'
                          : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)',
                      }}
                    >
                      {/* Golden top accent */}
                      <div className="h-[1.5px]" style={{ background: darkMode ? 'linear-gradient(90deg, transparent 5%, rgba(215,183,151,0.35) 50%, transparent 95%)' : 'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)' }} />
                      <div className={`px-3 py-2 border-b flex items-center justify-between ${darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-[#FDFCFB] border-[#E8E0D8]'}`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                          {t('otbAnalysis.budgetSeason') || 'Budget Season'}
                        </span>
                        {selectedBudgetIds.length > 0 && (
                          <button
                            onClick={() => setSelectedBudgetIds([])}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                              darkMode ? 'text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#F85149] hover:bg-[rgba(248,81,73,0.08)]'
                            }`}
                          >
                            {t('common.clearAll') || 'Clear'}
                          </button>
                        )}
                      </div>
                      <div className="filter-select-scroll max-h-72 overflow-y-auto py-1">
                        {loadingBudgets && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#D7B797]/30 border-t-[#D7B797] rounded-full animate-spin" />
                            <span className={`ml-2 text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('common.loading')}...</span>
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.length === 0 && (
                          <div className={`px-4 py-6 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                            <p className="text-sm mb-2">{t('budget.noMatchingBudgets') || 'No budgets found'}</p>
                            {apiBudgets.length === 0 && (
                              <p className="text-xs">
                                {t('otbAnalysis.noApprovedBudgetsDescription') || 'Please submit and approve a budget in Budget Management first.'}
                              </p>
                            )}
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.map((budget: any) => {
                          const isSelected = selectedBudgetIds.includes(budget.id);
                          const isDisabled = !isSelected && selectedBudgetIds.length >= seasonCount;
                          return (
                            <div
                              key={budget.id}
                              onClick={() => !isDisabled && toggleBudgetSelection(budget.id)}
                              className={`relative px-3 py-2 cursor-pointer transition-all duration-150 ${
                                isDisabled
                                  ? 'opacity-40 cursor-not-allowed'
                                  : isSelected
                                    ? darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(215,183,151,0.1)]'
                                    : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)]' : 'hover:bg-[rgba(215,183,151,0.06)]'
                              }`}
                            >
                              {/* Left accent bar */}
                              {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                              <div className="flex items-center gap-3">
                                {/* Checkbox */}
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#D7B797] border-[#D7B797]'
                                    : darkMode ? 'border-[#555555]' : 'border-[#C4B5A5]'
                                }`}>
                                  {isSelected && <Check size={10} className="text-[#1A1A1A]" strokeWidth={3} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`font-semibold text-sm ${isSelected ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                                    {budget.budgetName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>FY{budget.fiscalYear}</span>
                                    <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#D4CCC2]'}>|</span>
                                    <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{budget.seasonGroup} {budget.seasonType}</span>
                                    <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#D4CCC2]'}>|</span>
                                    <span className={`text-xs font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(budget.totalBudget)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand Filter — multi-select brands */}
                {brandOptions.length >= 1 && (
                <>
                <div className={`h-5 w-px hidden sm:block rounded-full ${darkMode ? 'bg-gradient-to-b from-transparent via-[#2E2E2E] to-transparent' : 'bg-gradient-to-b from-transparent via-[#C4B5A5]/40 to-transparent'}`} />
                <div className="relative shrink-0" ref={setDropdownRef('brand')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'brand' ? null : 'brand'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-3 py-[7px] border rounded-lg font-medium cursor-pointer flex items-center gap-2 text-xs transition-all duration-200 ${
                      openDropdown === 'brand'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/50 shadow-[0_0_0_1px_rgba(215,183,151,0.12)]'
                          : 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/60 shadow-[0_0_0_1px_rgba(215,183,151,0.15)]'
                        : selectedBudgetIds.length > 0
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.2)] text-[#D7B797] hover:border-[rgba(215,183,151,0.35)]'
                            : 'bg-[rgba(215,183,151,0.04)] border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                          : darkMode
                            ? 'bg-[#141414] border-[#2A2A2A] text-[#F2F2F2] hover:border-[#444444] hover:bg-[#181818]'
                            : 'bg-white border-[#D4CCC2] text-[#1A1A1A] hover:border-[#B8A998] hover:bg-[#FDFCFB]'
                    }`}
                  >
                    <Tag size={12} className={selectedBudgetIds.length > 0 ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')} />
                    <span className="truncate max-w-[120px]">
                      {(() => {
                        const selectedBrands = brandOptions.filter((b: any) => selectedBudgetIds.includes(b.value));
                        if (selectedBrands.length === 0) return 'Brands';
                        if (selectedBrands.length === 1) return selectedBrands[0].label;
                        return `${selectedBrands.length} brands`;
                      })()}
                    </span>
                    {selectedBudgetIds.length > 1 && (
                      <span className={`px-1.5 text-[10px] leading-[16px] font-bold rounded-md ${
                        darkMode ? 'bg-[#D7B797]/90 text-[#0A0A0A]' : 'bg-[#6B4D30] text-white'
                      }`}>{selectedBudgetIds.filter(id => brandOptions.some((b: any) => b.value === id)).length}</span>
                    )}
                    <ChevronDown size={10} strokeWidth={2} className={`transition-transform duration-200 ease-out ${openDropdown === 'brand' ? 'rotate-180' : ''} ${openDropdown === 'brand' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                  </button>
                  {openDropdown === 'brand' && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-[220px] border rounded-lg z-[9999] overflow-hidden ${
                        darkMode ? 'bg-[#161616] border-[#2E2E2E]' : 'bg-white border-[#D4CCC2]'
                      }`}
                      style={{
                        boxShadow: darkMode
                          ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(215,183,151,0.06)'
                          : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)',
                      }}
                    >
                      <div className="h-[1.5px]" style={{ background: darkMode ? 'linear-gradient(90deg, transparent 5%, rgba(215,183,151,0.35) 50%, transparent 95%)' : 'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)' }} />
                      <div className={`px-3 py-2 border-b flex items-center justify-between ${darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-[#FDFCFB] border-[#E8E0D8]'}`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                          Select Brands
                        </span>
                        {selectedBudgetIds.length > 0 && (
                          <button
                            onClick={() => { setSelectedBudgetIds([]); setSelectedBudgetId('all'); }}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                              darkMode ? 'text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#F85149] hover:bg-[rgba(248,81,73,0.08)]'
                            }`}
                          >
                            {t('common.clearAll') || 'Clear'}
                          </button>
                        )}
                      </div>
                      <div className="filter-select-scroll max-h-60 overflow-y-auto py-1">
                        {brandOptions.map((brand: any) => {
                          const isSelected = selectedBudgetIds.includes(brand.value);
                          return (
                            <div
                              key={brand.value}
                              onClick={() => handleBrandToggle(brand.value)}
                              className={`relative px-3 py-2 cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ? darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(215,183,151,0.1)]'
                                  : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)]' : 'hover:bg-[rgba(215,183,151,0.06)]'
                              }`}
                            >
                              {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#D7B797] border-[#D7B797]'
                                    : darkMode ? 'border-[#555555]' : 'border-[#C4B5A5]'
                                }`}>
                                  {isSelected && <Check size={10} className="text-[#1A1A1A]" strokeWidth={3} />}
                                </div>
                                <span className={`text-sm ${isSelected ? (darkMode ? 'text-[#D7B797] font-semibold' : 'text-[#6B4D30] font-semibold') : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                                  {brand.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}

                {/* Season Group Filter - only show after budget selected */}
                {selectedBudgetId && selectedBudgetId !== 'all' && (
                <>
                <div className={`h-5 w-px hidden sm:block rounded-full ${darkMode ? 'bg-gradient-to-b from-transparent via-[#2E2E2E] to-transparent' : 'bg-gradient-to-b from-transparent via-[#C4B5A5]/40 to-transparent'}`} />
                <div className="relative shrink-0" ref={setDropdownRef('seasonGroup')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'seasonGroup' ? null : 'seasonGroup'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-3 py-[7px] border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      openDropdown === 'seasonGroup'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/50 shadow-[0_0_0_1px_rgba(215,183,151,0.12)]'
                          : 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/60 shadow-[0_0_0_1px_rgba(215,183,151,0.15)]'
                        : selectedSeasonGroup !== 'all'
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.2)] text-[#D7B797] hover:border-[rgba(215,183,151,0.35)]'
                            : 'bg-[rgba(215,183,151,0.04)] border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                          : darkMode
                            ? 'bg-[#141414] border-[#2A2A2A] text-[#F2F2F2] hover:border-[#444444] hover:bg-[#181818]'
                            : 'bg-white border-[#D4CCC2] text-[#1A1A1A] hover:border-[#B8A998] hover:bg-[#FDFCFB]'
                    }`}
                  >
                      <Calendar size={12} className={`shrink-0 ${selectedSeasonGroup !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                      <span className="truncate">{selectedSeasonGroup === 'all' ? (t('planning.allSeasonGroups') || 'All') : (SEASON_GROUPS.find((s: any) => s.id === selectedSeasonGroup)?.label || selectedSeasonGroup)}</span>
                    <ChevronDown size={12} strokeWidth={2} className={`shrink-0 transition-transform duration-200 ease-out ${openDropdown === 'seasonGroup' ? 'rotate-180' : ''} ${openDropdown === 'seasonGroup' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                  </button>
                  {openDropdown === 'seasonGroup' && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden ${
                        darkMode ? 'bg-[#161616] border-[#2E2E2E]' : 'bg-white border-[#D4CCC2]'
                      }`}
                      style={{
                        boxShadow: darkMode
                          ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(215,183,151,0.06)'
                          : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)',
                      }}
                    >
                      {/* Golden top accent */}
                      <div className="h-[1.5px]" style={{ background: darkMode ? 'linear-gradient(90deg, transparent 5%, rgba(215,183,151,0.35) 50%, transparent 95%)' : 'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)' }} />
                      <div className="py-1">
                      <div
                        onClick={() => { setSelectedSeasonGroup('all'); setOpenDropdown(null); }}
                        className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                          selectedSeasonGroup === 'all'
                            ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)] text-[#CCCCCC] hover:text-[#F2F2F2]' : 'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {selectedSeasonGroup === 'all' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                        <span className={selectedSeasonGroup === 'all' ? 'font-semibold' : 'font-normal'}>{t('planning.allSeasonGroups') || 'All Season Groups'}</span>
                        {selectedSeasonGroup === 'all' && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />}
                      </div>
                      {SEASON_GROUPS.map((season: any) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeasonGroup(season.id); setOpenDropdown(null); }}
                          className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                            selectedSeasonGroup === season.id
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)] text-[#CCCCCC] hover:text-[#F2F2F2]' : 'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'
                          }`}
                        >
                          {selectedSeasonGroup === season.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                          <span className={selectedSeasonGroup === season.id ? 'font-semibold' : 'font-normal'}>{season.label}</span>
                          {selectedSeasonGroup === season.id && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Season Filter */}
                <div className="relative shrink-0" ref={setDropdownRef('season')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'season' ? null : 'season'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-3 py-[7px] border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      openDropdown === 'season'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/50 shadow-[0_0_0_1px_rgba(215,183,151,0.12)]'
                          : 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/60 shadow-[0_0_0_1px_rgba(215,183,151,0.15)]'
                        : selectedSeason !== 'all'
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.2)] text-[#D7B797] hover:border-[rgba(215,183,151,0.35)]'
                            : 'bg-[rgba(215,183,151,0.04)] border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                          : darkMode
                            ? 'bg-[#141414] border-[#2A2A2A] text-[#F2F2F2] hover:border-[#444444] hover:bg-[#181818]'
                            : 'bg-white border-[#D4CCC2] text-[#1A1A1A] hover:border-[#B8A998] hover:bg-[#FDFCFB]'
                    }`}
                  >
                      <Clock size={12} className={`shrink-0 ${selectedSeason !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                      <span className="whitespace-nowrap">{selectedSeason === 'all' ? (t('otbAnalysis.allSeasons') || 'All') : (SEASONS.find((s: any) => s.id === selectedSeason)?.label || selectedSeason)}</span>
                    <ChevronDown size={12} strokeWidth={2} className={`shrink-0 transition-transform duration-200 ease-out ${openDropdown === 'season' ? 'rotate-180' : ''} ${openDropdown === 'season' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                  </button>
                  {openDropdown === 'season' && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden ${
                        darkMode ? 'bg-[#161616] border-[#2E2E2E]' : 'bg-white border-[#D4CCC2]'
                      }`}
                      style={{
                        boxShadow: darkMode
                          ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(215,183,151,0.06)'
                          : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)',
                      }}
                    >
                      {/* Golden top accent */}
                      <div className="h-[1.5px]" style={{ background: darkMode ? 'linear-gradient(90deg, transparent 5%, rgba(215,183,151,0.35) 50%, transparent 95%)' : 'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)' }} />
                      <div className="py-1">
                      <div
                        onClick={() => { setSelectedSeason('all'); setOpenDropdown(null); }}
                        className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                          selectedSeason === 'all'
                            ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)] text-[#CCCCCC] hover:text-[#F2F2F2]' : 'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {selectedSeason === 'all' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                        <span className={selectedSeason === 'all' ? 'font-semibold' : 'font-normal'}>{t('otbAnalysis.allSeasons') || 'All Seasons'}</span>
                        {selectedSeason === 'all' && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />}
                      </div>
                      {SEASONS.map((season: any) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeason(season.id); setOpenDropdown(null); }}
                          className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                            selectedSeason === season.id
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)] text-[#CCCCCC] hover:text-[#F2F2F2]' : 'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'
                          }`}
                        >
                          {selectedSeason === season.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                          <span className={selectedSeason === season.id ? 'font-semibold' : 'font-normal'}>{season.label}</span>
                          {selectedSeason === season.id && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}

                {/* Version Filter */}
                {selectedBudgetId && selectedBudgetId !== 'all' && (
                <>
                <div className={`h-5 w-px hidden sm:block rounded-full ${darkMode ? 'bg-gradient-to-b from-transparent via-[#2E2E2E] to-transparent' : 'bg-gradient-to-b from-transparent via-[#C4B5A5]/40 to-transparent'}`} />
                <div className="relative shrink-0" ref={setDropdownRef('version')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'version' ? null : 'version'));
                      setOpenCategoryDropdown(null);
                    }}
                    disabled={versions.length === 0 && !loadingVersions}
                    className={`px-3 py-[7px] border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      versions.length === 0 && !loadingVersions
                        ? darkMode
                          ? 'bg-[#141414] border-[#2A2A2A] text-[#555555] cursor-not-allowed opacity-50'
                          : 'bg-[#FDFCFB] border-[#D4CCC2] text-[#999999] cursor-not-allowed opacity-50'
                        : openDropdown === 'version'
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/50 shadow-[0_0_0_1px_rgba(215,183,151,0.12)]'
                            : 'bg-[rgba(215,183,151,0.06)] border-[#D7B797]/60 shadow-[0_0_0_1px_rgba(215,183,151,0.15)]'
                          : selectedVersion
                            ? selectedVersion.isFinal
                              ? darkMode
                                ? 'bg-[rgba(215,183,151,0.1)] border-[#D7B797]/60 text-[#D7B797]'
                                : 'bg-[rgba(215,183,151,0.12)] border-[#D7B797]/70 text-[#6B4D30]'
                              : darkMode
                                ? 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.2)] text-[#D7B797] hover:border-[rgba(215,183,151,0.35)]'
                                : 'bg-[rgba(215,183,151,0.04)] border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                            : darkMode
                              ? 'bg-[#141414] border-[#2A2A2A] text-[#F2F2F2] hover:border-[#444444] hover:bg-[#181818]'
                              : 'bg-white border-[#D4CCC2] text-[#1A1A1A] hover:border-[#B8A998] hover:bg-[#FDFCFB]'
                    }`}
                  >
                      <span className="whitespace-nowrap">
                        {loadingVersions ? '...' : selectedVersion ? `v${versions.indexOf(selectedVersion) + 1}${selectedVersion.isFinal ? ' ★' : ''}` : t('common.version')}
                      </span>
                    <ChevronDown size={12} strokeWidth={2} className={`shrink-0 transition-transform duration-200 ease-out ${openDropdown === 'version' ? 'rotate-180' : ''} ${openDropdown === 'version' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#555555]' : 'text-[#AAAAAA]')}`} />
                  </button>
                  {openDropdown === 'version' && (
                    <div
                      className={`absolute top-full right-0 mt-1.5 whitespace-nowrap w-max min-w-[200px] border rounded-lg z-[9999] overflow-hidden ${
                        darkMode ? 'bg-[#161616] border-[#2E2E2E]' : 'bg-white border-[#D4CCC2]'
                      }`}
                      style={{
                        boxShadow: darkMode
                          ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(215,183,151,0.06)'
                          : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)',
                      }}
                    >
                      {/* Golden top accent */}
                      <div className="h-[1.5px]" style={{ background: darkMode ? 'linear-gradient(90deg, transparent 5%, rgba(215,183,151,0.35) 50%, transparent 95%)' : 'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)' }} />
                      <div className={`px-3 py-2 border-b flex items-center justify-between ${darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-[#FDFCFB] border-[#E8E0D8]'}`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Planning Versions</span>
                      </div>
                      <div className="filter-select-scroll max-h-60 overflow-y-auto py-1">
                        {loadingVersions && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#D7B797]/30 border-t-[#D7B797] rounded-full animate-spin" />
                            <span className={`ml-2 text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('common.loading')}...</span>
                          </div>
                        )}
                        {!loadingVersions && versions.length === 0 && (
                          <div className={`px-4 py-6 text-center text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                            {t('planning.noVersions')}
                          </div>
                        )}
                        {!loadingVersions && versions.map((version: any, idx: number) => (
                          <div
                            key={version.id}
                            onClick={() => { setSelectedVersionId(version.id); setOpenDropdown(null); }}
                            className={`relative px-3 py-[6px] cursor-pointer transition-all duration-150 ${
                              selectedVersionId === version.id
                                ? darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(215,183,151,0.1)]'
                                : darkMode ? 'hover:bg-[rgba(215,183,151,0.04)]' : 'hover:bg-[rgba(215,183,151,0.06)]'
                            }`}
                          >
                            {/* Left accent bar */}
                            {selectedVersionId === version.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background: darkMode ? '#D7B797' : '#8B6E4E' }} />}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className={`text-sm truncate ${selectedVersionId === version.id ? (darkMode ? 'text-[#D7B797] font-semibold' : 'text-[#6B4D30] font-semibold') : (darkMode ? 'text-[#CCCCCC] font-normal' : 'text-[#444444] font-normal')}`}>
                                  v{idx + 1}{version.isFinal ? ' ★' : ''}
                                </span>
                                <span className={`text-[10px] px-1 py-px rounded-[3px] shrink-0 ${
                                  version.status?.toLowerCase() === 'approved' ? 'bg-[rgba(18,119,73,0.15)] text-[#127749]' :
                                  version.status?.toLowerCase() === 'submitted' ? 'bg-[rgba(227,179,65,0.15)] text-[#E3B341]' :
                                  darkMode ? 'bg-[#2E2E2E] text-[#888]' : 'bg-[#F0EDE8] text-[#888]'
                                }`}>{version.status?.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!version.isFinal && (
                                  <button
                                    onClick={(e) => handleSetFinalVersion(version.id, e)}
                                    className={`px-1.5 py-px text-[10px] font-medium rounded-[3px] transition-all duration-150 ${
                                      darkMode
                                        ? 'bg-[rgba(215,183,151,0.1)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.2)]'
                                        : 'bg-[rgba(215,183,151,0.15)] text-[#6B4D30] hover:bg-[rgba(215,183,151,0.25)]'
                                    }`}
                                  >
                                    Set Final
                                  </button>
                                )}
                                {selectedVersionId === version.id && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className={`shrink-0 px-1.5 py-[8px] rounded-lg border transition-all duration-200 ${
                      darkMode
                        ? 'text-[#666666] border-transparent hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.08)] hover:border-[rgba(248,81,73,0.15)]'
                        : 'text-[#999999] border-transparent hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.06)] hover:border-[rgba(248,81,73,0.12)]'
                    }`}
                    title={t('common.clearAllFilters')}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
              )}
        </div>{/* end overflow-hidden min-h-0 */}
        </div>{/* end grid animation wrapper */}
      </div>

      {/* Budget Context Card - Outside sticky */}
      {!isMobile && ((selectedBudget && selectedSeasonGroup && selectedSeason) || budgetContext) && (
        <div className={`flex items-center gap-4 px-3 py-2 rounded-lg border ${
          darkMode
            ? 'border-[rgba(215,183,151,0.25)] bg-[rgba(215,183,151,0.05)]'
            : 'border-[rgba(215,183,151,0.3)] bg-[rgba(215,183,151,0.08)]'
        }`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`text-xs font-semibold font-['Montserrat'] truncate ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
              {selectedBudget?.budgetName || budgetContext?.budgetName || 'Budget'}
            </span>
            <span className={`text-[10px] shrink-0 ${darkMode ? 'text-[#D7B797]/60' : 'text-[#6B4D30]/60'}`}>
              FY {selectedBudget?.fiscalYear || budgetContext?.fiscalYear} - {selectedBudget?.brandName || budgetContext?.brandName || 'Brand'}
            </span>
          </div>
          <div className={`w-px h-4 shrink-0 ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.3)]'}`} />
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
              {formatCurrency(
                budgetContext?.rex || budgetContext?.ttp
                  ? (budgetContext.rex || 0) + (budgetContext.ttp || 0)
                  : selectedBudget?.totalBudget || 0
              )}
            </span>
            <div className={`flex items-center gap-2 text-[10px] font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]/60' : 'text-[#6B4D30]/60'}`}>
              {budgetContext?.rex || budgetContext?.ttp ? (
                <>
                  <span>REX: {formatCurrency(budgetContext?.rex || 0)}</span>
                  <span>TTP: {formatCurrency(budgetContext?.ttp || 0)}</span>
                </>
              ) : selectedBudget?.details?.length > 0 ? (
                selectedBudget.details
                  .filter((d: any) => {
                    const code = (d.store?.code || d.storeCode || '').toUpperCase();
                    return code === 'REX' || code === 'TTP';
                  })
                  .map((d: any) => (
                  <span key={d.id || d.store?.code}>{d.store?.code || d.storeCode}: {formatCurrency(Number(d.budgetAmount) || 0)}</span>
                ))
              ) : (
                <span>{t('otbAnalysis.totalBudget')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Mode (2-3 budgets selected) */}
      {selectedBudgetIds.length >= 2 && (
      <div className={`rounded-xl shadow-lg border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
        {/* Comparison Header */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          darkMode ? 'border-[#2E2E2E] bg-[#1A1A1A]' : 'border-[#D4C8BB] bg-[#F2F2F2]'
        }`}>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
            <span className={`text-sm font-semibold font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
              {t('otbAnalysis.budgetComparison') || 'Budget Comparison'} ({selectedBudgetIds.length} {t('otbAnalysis.budgets') || 'budgets'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              darkMode ? 'bg-[rgba(215,183,151,0.2)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.3)] text-[#6B4D30]'
            }`}>
              {comparisonType === 'same' ? 'Same Season' : 'Different Season'}
            </span>
          </div>
        </div>

        {/* Selected Budgets Summary */}
        <div className={`px-4 py-2 border-b flex flex-wrap gap-2 ${
          darkMode ? 'bg-[rgba(215,183,151,0.05)] border-[#2E2E2E]' : 'bg-[rgba(215,183,151,0.08)] border-[#D4C8BB]'
        }`}>
          {selectedBudgetIds.map((id, idx) => {
            const budget = apiBudgets.find((b: any) => b.id === id);
            if (!budget) return null;
            return (
              <div key={id} className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${
                darkMode ? 'border-[rgba(215,183,151,0.25)] bg-[rgba(215,183,151,0.08)]' : 'border-[rgba(215,183,151,0.4)] bg-white'
              }`}>
                <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#D7B797]' : idx === 1 ? 'bg-[#2A9E6A]' : 'bg-[#7C3AED]'}`} />
                <span className={`text-xs font-medium ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{budget.budgetName}</span>
                <span className={`text-[10px] font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{formatCurrency(budget.totalBudget)}</span>
                <button
                  onClick={() => toggleBudgetSelection(id)}
                  className={`p-0.5 rounded transition-colors ${darkMode ? 'hover:bg-[#2E2E2E]' : 'hover:bg-[#F2F2F2]'}`}
                >
                  <X size={10} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="overflow-y-auto">
          {renderComparisonTable()}
        </div>
      </div>
      )}

      {/* Single Budget Mode - Tabbed Content */}
      {selectedBudgetIds.length <= 1 && selectedBudget && selectedSeason && selectedSeasonGroup && (
      <div className={`rounded-xl shadow-lg border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
        {/* Tab Navigation: Category | Collection | Gender */}
        <div className={`border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
          <div className="flex">
            {(['category', 'collection', 'gender'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const labels: Record<string, string> = {
                category: 'Category',
                collection: 'Collection',
                gender: 'Gender',
              };
              const icons: Record<string, React.ReactNode> = {
                category: <Tag size={14} />,
                collection: <Bookmark size={14} />,
                gender: <Users size={14} />,
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 md:px-6 py-2.5 text-xs md:text-sm font-semibold font-['Montserrat'] uppercase tracking-wide border-b-2 -mb-px transition-all ${
                    isActive
                      ? darkMode
                        ? 'border-[#D7B797] text-[#D7B797] bg-[rgba(215,183,151,0.08)]'
                        : 'border-[#6B4D30] text-[#6B4D30] bg-[rgba(215,183,151,0.08)]'
                      : darkMode
                        ? 'border-transparent text-[#666666] hover:text-[#999999] hover:bg-[rgba(215,183,151,0.04)]'
                        : 'border-transparent text-[#999999] hover:text-[#6B4D30] hover:bg-[rgba(215,183,151,0.04)]'
                  }`}
                >
                  {icons[tab]}
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Bar (Category tab only) */}
        {activeTab === 'category' && (
        <div className={`border-b px-3 py-2 ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleAll}
              className={`flex items-center gap-1.5 px-3 py-[7px] text-sm font-medium rounded-lg border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
            >
              <ChevronDown size={12} className={`transition-transform ${allCollapsed ? '-rotate-90' : ''}`} />
              {allCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
            <FilterSelect
              label={t('common.category') || 'Category'}
              value={categoryFilter}
              options={[
                { value: 'all', label: t('common.all') || 'All' },
                ...filterOptions.categories.filter((c: any) => c.id !== 'all').map((c: any) => ({ value: c.id, label: c.name })),
              ]}
              onChange={handleCategoryFilterChange}
              darkMode={darkMode}
            />
            <FilterSelect
              label={t('common.subCategories') || 'SubCat'}
              value={subCategoryFilter}
              options={[
                { value: 'all', label: t('common.all') || 'All' },
                ...filteredSubCategoryOptions.filter((c: any) => c.id !== 'all').map((c: any) => ({ value: c.id, label: c.name })),
              ]}
              onChange={handleSubCategoryFilterChange}
              darkMode={darkMode}
            />
            <FilterSelect
              label={t('common.gender') || 'Gender'}
              value={genderFilter}
              options={[
                { value: 'all', label: t('common.all') || 'All' },
                ...filterOptions.genders.filter((c: any) => c.id !== 'all').map((c: any) => ({ value: c.id, label: c.name })),
              ]}
              onChange={handleGenderFilterChange}
              darkMode={darkMode}
            />
            {(genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all') && (
              <button
                onClick={() => { setGenderFilter('all'); setCategoryFilter('all'); setSubCategoryFilter('all'); }}
                className={`shrink-0 p-1 rounded transition-colors ${darkMode ? 'text-[#999999] hover:text-[#F85149] hover:bg-[#1A1A1A]' : 'text-[#666666] hover:text-[#F85149] hover:bg-red-50'}`}
                title={t('common.clearAll')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        )}

        {/* Tab Content */}
        <div className="overflow-y-auto">
          {activeTab === 'category' && renderCategoryTab()}
          {activeTab === 'collection' && renderCollectionTab()}
          {activeTab === 'gender' && renderGenderTab()}
        </div>
      </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilter}
        filters={[
          {
            key: 'year',
            label: t('budget.fiscalYear') || 'Fiscal Year',
            type: 'single',
            options: availableYears.map((y: number) => ({ label: `FY ${y}`, value: String(y) })),
          },
          {
            key: 'type',
            label: t('otbAnalysis.comparisonType') || 'Comparison Type',
            type: 'single',
            options: [
              { label: 'Same Season', value: 'same' },
              { label: 'Different Season', value: 'different' },
            ],
          },
          {
            key: 'seasonCount',
            label: t('otbAnalysis.numberOfSeasons') || 'Number of Seasons',
            type: 'single',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
            ],
          },
          {
            key: 'budget',
            label: t('otbAnalysis.budgetSeason') || 'Budget Season',
            type: 'single',
            options: filteredBudgets.map((b: any) => ({ label: `${b.budgetName} (${formatCurrency(b.totalBudget)})`, value: b.id })),
          },
          {
            key: 'seasonGroup',
            label: t('otbAnalysis.seasonGroup'),
            type: 'single',
            options: SEASON_GROUPS.map((s: any) => ({ label: s.label, value: s.id })),
          },
          {
            key: 'season',
            label: t('otbAnalysis.season'),
            type: 'single',
            options: SEASONS.map((s: any) => ({ label: s.label, value: s.id })),
          },
          {
            key: 'version',
            label: 'Version',
            type: 'single',
            options: versions.map((v: any) => ({ label: `${v.name}${v.isFinal ? ' (FINAL)' : ''}`, value: v.id })),
          },
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          if (mobileFilterValues.year) {
            setSelectedYear(mobileFilterValues.year === 'all' ? 'all' : Number(mobileFilterValues.year));
          }
          if (mobileFilterValues.type) {
            setComparisonType(mobileFilterValues.type as 'same' | 'different');
          }
          if (mobileFilterValues.seasonCount) {
            setSeasonCount(Number(mobileFilterValues.seasonCount) || 1);
          }
          if (mobileFilterValues.budget) {
            setSelectedBudgetIds([mobileFilterValues.budget as string]);
          }
          setSelectedSeasonGroup((mobileFilterValues.seasonGroup as string) || 'all');
          setSelectedSeason((mobileFilterValues.season as string) || 'all');
          setSelectedVersionId((mobileFilterValues.version as string) || null);
        }}
        onReset={() => {
          setMobileFilterValues({});
          clearFilters();
        }}
      />
    </div>
  );
};

export default OTBAnalysisScreen;
