'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3, Filter, ChevronDown, Check,
  Calendar, Tag, Layers, Users, Info, Pencil, X, Star,
  Sparkles, FileText, Clock, Split, ArrowLeftRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils';
import { STORES, GENDERS } from '../../../utils/constants';
import { budgetService, masterDataService, planningService } from '../../../services';
import { FilterBottomSheet, FilterChips, useBottomSheet } from '@/components/mobile';
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

const TABS = [
  { id: 'category', label: 'Category', icon: Tag },
  { id: 'collection', label: 'Collection', icon: Layers },
  { id: 'gender', label: 'Gender', icon: Users }
];

// Reusable editable cell component (memoized to prevent unnecessary re-renders)
const EditableCell = React.memo(({ cellKey, value, isEditing, editValue, onStartEdit, onSaveEdit, onChangeValue, onKeyDown, readOnly = false, darkMode = false }: any) => {
  const { t } = useLanguage();
  if (isEditing && !readOnly) {
    return (
      <div className="flex items-center justify-center animate-in zoom-in duration-200">
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
        <Pencil size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
      </div>
    </div>
  );
});

const OTBAnalysisScreen = ({ otbContext, onOpenSkuProposal, darkMode = false }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});
  const [activeTab, setActiveTab] = useState('category');

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
      const budgetList = (response.data || response || []).map((budget: any) => ({
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

  // Smart Filter Bar — anti-jitter scroll hook
  const { barState, handleBarClick } = useSmartScrollState();

  // Auto-select first budget when budgets are loaded and none selected
  useEffect(() => {
    if (apiBudgets.length > 0 && selectedBudgetIds.length === 0 && selectedBudgetId === 'all') {
      const first = apiBudgets[0];
      setSelectedBudgetIds([first.id]);
      setSelectedBudgetId(first.id);
      if (first.fiscalYear) setSelectedYear(first.fiscalYear);
    }
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
        const list = Array.isArray(response) ? response : (response?.data || []);
        setVersions(list.map((v: any) => ({
          id: v.id,
          name: v.name || v.versionName || `Version ${v.versionNumber || v.id}`,
          status: v.status || 'DRAFT',
          isFinal: v.isFinal || v.status === 'FINAL' || false,
          versionNumber: v.versionNumber
        })));
        // Auto-select the final version if one exists
        const finalVersion = list.find((v: any) => v.isFinal || v.status === 'FINAL');
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

  // Editable cell states
  const [editingCell, setEditingCell] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState<Record<string, any>>({});

  // Category hierarchy collapse states
  const [expandedGenders, setExpandedGenders] = useState<Record<string, boolean>>({ female: true, male: true });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, any>>({});


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

    // Initialize Collection tab data with reference values
    const collectionDemoData: Record<string, Record<string, any>> = {
      rex: { buyPct: 22.5, salesPct: 28, stPct: 67, moc: '3.2', userBuyPct: 28, otbValue: 1179776, varPct: 5 },
      ttp: { buyPct: 16.3, salesPct: 19, stPct: 64, moc: '3.7', userBuyPct: 19, otbValue: 800562, varPct: 3 },
    };
    const collectionDemoData2: Record<string, Record<string, any>> = {
      rex: { buyPct: 35.5, salesPct: 32, stPct: 48, moc: '7.0', userBuyPct: 32, otbValue: 1348316, varPct: -3 },
      ttp: { buyPct: 25.7, salesPct: 21, stPct: 45, moc: '8.0', userBuyPct: 21, otbValue: 884832, varPct: -5 },
    };
    collectionSections.forEach((section: any, sIdx: number) => {
      const demoSet = sIdx === 0 ? collectionDemoData : collectionDemoData2;
      STORES.forEach((store: any) => {
        const key = `collection_${section.id}_${store.id}`;
        const demo = demoSet[store.id] || demoSet.rex;
        initialData[key] = {
          buyPct: demo.buyPct,
          salesPct: demo.salesPct,
          stPct: demo.stPct,
          moc: demo.moc,
          userBuyPct: demo.userBuyPct,
          otbValue: demo.otbValue,
          varPct: demo.varPct,
        };
      });
    });

    // Initialize Gender tab data with reference values
    const genderDemoData: Record<string, Record<string, any>> = {
      // Female
      'gen2_rex': { buyPct: 22, salesPct: 17, stPct: 42, userBuyPct: 17, otbValue: 724121, varPct: -5 },
      'gen2_ttp': { buyPct: 17, salesPct: 14, stPct: 44, userBuyPct: 14, otbValue: 586263, varPct: -3 },
      // Male
      'gen1_rex': { buyPct: 36, salesPct: 42, stPct: 63, userBuyPct: 42, otbValue: 1776427, varPct: 6 },
      'gen1_ttp': { buyPct: 25, salesPct: 27, stPct: 58, userBuyPct: 27, otbValue: 1126675, varPct: 2 },
    };
    GENDERS.forEach((gender: any) => {
      STORES.forEach((store: any) => {
        const key = `gender_${gender.id}_${store.id}`;
        const demo = genderDemoData[`${gender.id}_${store.id}`];
        initialData[key] = demo ? { ...demo } : {
          buyPct: 0, salesPct: 0, stPct: 0, userBuyPct: 0, otbValue: 0, varPct: 0,
        };
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

  // Toggle expanded state for hierarchy
  const toggleGenderExpanded = (genderId: any) => {
    setExpandedGenders((prev: any) => ({ ...prev, [genderId]: !prev[genderId] }));
  };

  const toggleCategoryExpanded = (genderId: any, categoryId: any) => {
    const key = `${genderId}_${categoryId}`;
    setExpandedCategories((prev: any) => ({ ...prev, [key]: !prev[key] }));
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

  // Render Collection Tab
  const renderCollectionTab = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${headerCellClass} ${headerDarkCell} text-left min-w-[200px]`}>{t('otbAnalysis.collection')}</th>
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
            {collectionSections.map((section: any) => (
              <React.Fragment key={`col-${section.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-3 py-0.5" colSpan={8}>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{section.name}</span>
                      <Info size={12} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                    </div>
                  </td>
                </tr>

                {STORES.map((store: any) => {
                  const cellKey = `collection_${section.id}_${store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? 0;
                  const variance = cellData.varPct ?? (userBuyPctValue - (cellData.salesPct || 0));

                  return (
                    <tr
                      key={cellKey}
                      className={`border-b transition-colors ${
                        darkMode
                          ? 'border-[#2E2E2E] hover:bg-[#1A1A1A]'
                          : 'border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)]'
                      }`}
                    >
                      <td className="px-3 py-0.5 pl-6">
                        <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>{store.name}</span>
                      </td>
                      <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.buyPct || 0).toFixed(1)}%</td>
                      <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.stPct || 0).toFixed(0)}%</td>
                      <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{cellData.moc || 0}</td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                        <EditableCell
                          cellKey={cellKey}
                          value={userBuyPctValue}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className={`px-4 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                        variance < 0 ? 'text-[#F85149]' : variance > 0 ? 'text-[#2A9E6A]' : (darkMode ? 'text-[#999999]' : 'text-[#666666]')
                      }`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            <tr className={sumRowClass}>
              <td className="px-3 py-0.5 font-semibold text-xs uppercase tracking-wide font-['Montserrat']">{t('otbAnalysis.total')}</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Gender Tab
  const renderGenderTab = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${headerCellClass} ${headerDarkCell} text-left min-w-[200px]`}>{t('otbAnalysis.gender')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
              <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
              <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
              <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
              <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
            </tr>
          </thead>
          <tbody>
            {GENDERS.map((gen: any) => (
              <React.Fragment key={`gen-${gen.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-3 py-0.5" colSpan={7}>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{gen.name}</span>
                      <Info size={12} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                    </div>
                  </td>
                </tr>

                {STORES.map((store: any) => {
                  const cellKey = `gender_${gen.id}_${store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? 0;
                  const variance = cellData.varPct ?? (userBuyPctValue - (cellData.salesPct || 0));

                  return (
                    <tr
                      key={cellKey}
                      className={`border-b transition-colors ${
                        darkMode
                          ? 'border-[#2E2E2E] hover:bg-[#1A1A1A]'
                          : 'border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)]'
                      }`}
                    >
                      <td className="px-3 py-0.5 pl-6">
                        <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>{store.name}</span>
                      </td>
                      <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.buyPct || 0).toFixed(0)}%</td>
                      <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.stPct || 0).toFixed(0)}%</td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                        <EditableCell
                          cellKey={cellKey}
                          value={userBuyPctValue}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className={`px-4 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                        variance < 0 ? 'text-[#F85149]' : variance > 0 ? 'text-[#2A9E6A]' : (darkMode ? 'text-[#999999]' : 'text-[#666666]')
                      }`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            <tr className={sumRowClass}>
              <td className="px-3 py-0.5 font-semibold text-xs uppercase tracking-wide font-['Montserrat']">{t('otbAnalysis.total')}</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Category Tab - Hierarchical Collapsible
  const renderCategoryTab = () => {
    const calculateGenderTotals = (genderGroup: any) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      genderGroup.categories.forEach((cat: any) => {
        cat.subCategories.forEach((subCat: any) => {
          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
          const data = localData[key] || {};
          totals.buyPct += data.buyPct || 0;
          totals.salesPct += data.salesPct || 0;
          totals.buyProposed += data.buyProposed || 0;
          totals.otbProposed += data.otbProposed || 0;
          totals.otbSubmitted += data.otbSubmitted || 0;
          totals.buyActual += data.buyActual || 0;
        });
      });
      totals.stPct = 90;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    const calculateCategoryTotals = (genderId: any, cat: any) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      cat.subCategories.forEach((subCat: any) => {
        const key = `${genderId}_${cat.id}_${subCat.id}`;
        const data = localData[key] || {};
        totals.buyPct += data.buyPct || 0;
        totals.salesPct += data.salesPct || 0;
        totals.buyProposed += data.buyProposed || 0;
        totals.otbProposed += data.otbProposed || 0;
        totals.otbSubmitted += data.otbSubmitted || 0;
        totals.buyActual += data.buyActual || 0;
      });
      totals.stPct = 47;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    const filteredData = categoryStructure.filter((genderGroup: any) => {
      if (genderFilter !== 'all' && genderGroup.gender.id !== genderFilter) return false;
      return true;
    }).map((genderGroup: any) => ({
      ...genderGroup,
      categories: genderGroup.categories.filter((cat: any) => {
        if (categoryFilter !== 'all' && cat.id !== categoryFilter) return false;
        return true;
      }).map((cat: any) => ({
        ...cat,
        subCategories: cat.subCategories.filter((subCat: any) => {
          if (subCategoryFilter !== 'all' && subCat.id !== subCategoryFilter) return false;
          return true;
        })
      })).filter((cat: any) => cat.subCategories.length > 0)
    })).filter((genderGroup: any) => genderGroup.categories.length > 0);

    const getSelectedLabel = (options: any, value: any) => {
      const option = options.find((o: any) => o.id === value);
      return option ? option.name : 'Select...';
    };

    return (
      <div className="p-4 space-y-3">
        {/* Filter Section */}
        <div className={`mb-2 md:mb-3 py-1.5 ${
          darkMode
            ? 'border-b border-[#2E2E2E]'
            : 'border-b border-[#C4B5A5]'
        }`}>
          <div className="flex items-center gap-2">
            {/* Gender Filter */}
            <div className="relative shrink-0" ref={setDropdownRef('genderFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev: any) => (prev === 'genderFilter' ? null : 'genderFilter'));
                  setOpenDropdown(null);
                }}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 border rounded-md transition-all min-w-[90px] ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] hover:border-[rgba(215,183,151,0.4)]'
                    : 'bg-white border-[#C4B5A5] hover:border-[rgba(215,183,151,0.5)]'
                }`}
              >
                <Users size={12} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`text-xs font-medium flex-1 text-left truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                  {getSelectedLabel(filterOptions.genders, genderFilter)}
                </span>
                <ChevronDown size={12} className={`transition-transform ${darkMode ? 'text-[#666666]' : 'text-[#999999]'} ${openCategoryDropdown === 'genderFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'genderFilter' && (
                <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden ${
                  darkMode
                    ? 'bg-[#121212] border-[#2E2E2E]'
                    : 'bg-white border-[#C4B5A5]'
                }`}>
                  {filterOptions.genders.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleGenderFilterChange(option.id)}
                      className={`px-4 py-0.5 flex items-center gap-2 cursor-pointer transition-colors ${
                        darkMode
                          ? 'hover:bg-[rgba(215,183,151,0.08)]'
                          : 'hover:bg-[rgba(160,120,75,0.12)]'
                      }`}
                    >
                      <span className={`text-sm ${genderFilter === option.id ? (darkMode ? 'text-[#D7B797] font-semibold' : 'text-[#6B4D30] font-semibold') : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                        {option.name}
                      </span>
                      {genderFilter === option.id && <Check size={14} className={darkMode ? 'text-[#D7B797] ml-auto' : 'text-[#6B4D30] ml-auto'} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative shrink-0" ref={setDropdownRef('categoryFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev: any) => (prev === 'categoryFilter' ? null : 'categoryFilter'));
                  setOpenDropdown(null);
                }}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 border rounded-md transition-all min-w-[100px] ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] hover:border-[rgba(215,183,151,0.4)]'
                    : 'bg-white border-[#C4B5A5] hover:border-[rgba(215,183,151,0.5)]'
                }`}
              >
                <Tag size={12} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`text-xs font-medium flex-1 text-left truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                  {getSelectedLabel(filterOptions.categories, categoryFilter)}
                </span>
                <ChevronDown size={12} className={`transition-transform ${darkMode ? 'text-[#666666]' : 'text-[#999999]'} ${openCategoryDropdown === 'categoryFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'categoryFilter' && (
                <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto ${
                  darkMode
                    ? 'bg-[#121212] border-[#2E2E2E]'
                    : 'bg-white border-[#C4B5A5]'
                }`}>
                  {filteredCategoryOptions.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleCategoryFilterChange(option.id)}
                      className={`px-4 py-0.5 flex items-center gap-2 cursor-pointer transition-colors ${
                        darkMode
                          ? 'hover:bg-[rgba(215,183,151,0.08)]'
                          : 'hover:bg-[rgba(160,120,75,0.12)]'
                      }`}
                    >
                      <span className={`text-sm ${categoryFilter === option.id ? (darkMode ? 'text-[#D7B797] font-semibold' : 'text-[#6B4D30] font-semibold') : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                        {option.name}
                      </span>
                      {categoryFilter === option.id && <Check size={14} className={darkMode ? 'text-[#D7B797] ml-auto' : 'text-[#6B4D30] ml-auto'} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Category Filter */}
            <div className="relative shrink-0" ref={setDropdownRef('subCategoryFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev: any) => (prev === 'subCategoryFilter' ? null : 'subCategoryFilter'));
                  setOpenDropdown(null);
                }}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 border rounded-md transition-all min-w-[100px] ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] hover:border-[rgba(215,183,151,0.4)]'
                    : 'bg-white border-[#C4B5A5] hover:border-[rgba(215,183,151,0.5)]'
                }`}
              >
                <Layers size={12} className="text-[#2A9E6A]" />
                <span className={`text-xs font-medium flex-1 text-left truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                  {getSelectedLabel(filterOptions.subCategories, subCategoryFilter)}
                </span>
                <ChevronDown size={12} className={`transition-transform ${darkMode ? 'text-[#666666]' : 'text-[#999999]'} ${openCategoryDropdown === 'subCategoryFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'subCategoryFilter' && (
                <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto ${
                  darkMode
                    ? 'bg-[#121212] border-[#2E2E2E]'
                    : 'bg-white border-[#C4B5A5]'
                }`}>
                  {filteredSubCategoryOptions.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleSubCategoryFilterChange(option.id)}
                      className={`px-4 py-0.5 flex items-center gap-2 cursor-pointer transition-colors ${
                        darkMode
                          ? 'hover:bg-[rgba(215,183,151,0.08)]'
                          : 'hover:bg-[rgba(160,120,75,0.12)]'
                      }`}
                    >
                      <span className={`text-sm ${subCategoryFilter === option.id ? 'text-[#2A9E6A] font-semibold' : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                        {option.name}
                      </span>
                      {subCategoryFilter === option.id && <Check size={14} className="text-[#2A9E6A] ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {(genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setGenderFilter('all');
                  setCategoryFilter('all');
                  setSubCategoryFilter('all');
                }}
                className={`shrink-0 p-1 rounded transition-colors ${darkMode ? 'text-[#999999] hover:text-[#F85149] hover:bg-[#1A1A1A]' : 'text-[#666666] hover:text-[#F85149] hover:bg-red-50'}`}
                title={t('common.clearAll')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Hierarchical Content */}
        {filteredData.map((genderGroup: any) => {
          const genderTotals = calculateGenderTotals(genderGroup);
          const isGenderExpanded = expandedGenders[genderGroup.gender.id];
          const isFemale = genderGroup.gender.id === 'female';

          return (
            <div key={genderGroup.gender.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
              {/* Gender Header - Level 1 */}
              <div
                onClick={() => toggleGenderExpanded(genderGroup.gender.id)}
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
                    className={`transition-transform duration-200 ${isGenderExpanded ? '' : '-rotate-90'} ${darkMode ? 'text-white' : 'text-[#6B4D30]'}`}
                  />
                </button>
                <Users size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-white' : 'text-[#5C4A3A]'}`}>{genderGroup.gender.name}</span>
                <span className={`ml-auto text-xs md:text-sm ${darkMode ? 'text-white/80' : 'text-[#6B4D30]'}`}>
                  {genderGroup.categories.length} categories
                </span>
                <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-white/90' : 'text-[#5C4A3A]'}`}>
                  <span>Buy: <strong>{genderTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{genderTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Gender Content */}
              {isGenderExpanded && (
                <div className={`p-3 space-y-2 ${darkMode ? 'bg-[#0A0A0A]' : 'bg-[#F2F2F2]'}`}>
                  {genderGroup.categories.map((cat: any, catIdx: any) => {
                    const catKey = `${genderGroup.gender.id}_${cat.id}`;
                    const isCatExpanded = expandedCategories[catKey] !== false;
                    const catTotals = calculateCategoryTotals(genderGroup.gender.id, cat);

                    return (
                      <div key={cat.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-[#C4B5A5] bg-white'}`}>
                        {/* Category Header - Level 2 */}
                        <div
                          onClick={() => toggleCategoryExpanded(genderGroup.gender.id, cat.id)}
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
                              className={`transition-transform duration-200 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} ${isCatExpanded ? '' : '-rotate-90'}`}
                            />
                          </button>
                          <Tag size={16} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                          <span className={`font-semibold text-xs uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                            {cat.name}
                          </span>
                          <span className={`ml-auto text-xs md:text-sm ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                            {cat.subCategories.length} sub-categories
                          </span>
                          <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                            <span>Buy: <strong>{catTotals.buyPct}%</strong></span>
                            <span>Proposed: <strong>{catTotals.buyProposed}%</strong></span>
                            <span>OTB: <strong>{catTotals.otbProposed.toLocaleString()}</strong></span>
                          </div>
                        </div>

                        {/* Sub-Categories Table - Level 3 */}
                        {isCatExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className={`px-4 py-2 text-left text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('nav.subCategories')}</th>
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
                                {cat.subCategories.map((subCat: any, subIdx: any) => {
                                  const cellKey = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
                                  const rowData = localData[cellKey] || {};
                                  const isEditing = editingCell === cellKey;

                                  return (
                                    <tr
                                      key={subCat.id}
                                      className={`border-b transition-colors ${
                                        darkMode
                                          ? `border-[#2E2E2E] hover:bg-[#1A1A1A] ${subIdx % 2 === 0 ? 'bg-[#121212]' : 'bg-[#0A0A0A]'}`
                                          : `border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${subIdx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`
                                      }`}
                                    >
                                      <td className="px-4 py-0.5">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-[#666666]' : 'bg-[#999999]'}`}></div>
                                          <span className={darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}>{subCat.name}</span>
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
                                                // Budget info
                                                budgetId: selectedBudgetId !== 'all' ? selectedBudgetId : budgetContext?.budgetId,
                                                budgetName: selectedBudget?.budgetName || budgetContext?.budgetName,
                                                fiscalYear: selectedBudget?.fiscalYear || budgetContext?.fiscalYear,
                                                brandName: selectedBudget?.brandName || budgetContext?.brandName,
                                                // Season info
                                                seasonGroup: selectedSeasonGroup !== 'all' ? selectedSeasonGroup : budgetContext?.seasonGroup,
                                                season: selectedSeason !== 'all' ? selectedSeason : budgetContext?.season,
                                                // Category info
                                                gender: genderGroup.gender,
                                                category: cat,
                                                subCategory: subCat,
                                                // OTB data
                                                otbData: rowData
                                              });
                                            }
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#8B7355]/40 hover:border-[#D7B797]/60 bg-[#8B7355]/10 hover:bg-[#8B7355]/20 text-[#D7B797] rounded-lg font-medium text-xs transition-all"
                                        >
                                          <Split size={12} />
                                          {t('otbAnalysis.allocateSKU')}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* Category Subtotal Row */}
                                <tr className={darkMode ? 'bg-gradient-to-r from-[rgba(215,183,151,0.2)] to-[rgba(215,183,151,0.15)] font-medium' : 'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                                  <td className={`px-4 py-0.5 font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.buyPct}%</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.salesPct}%</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.stPct}%</td>
                                  <td className={`px-3 py-0.5 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{catTotals.buyProposed}%</td>
                                  <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.otbProposed.toLocaleString()}</td>
                                  <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${
                                    catTotals.varPct < 0 ? 'text-[#FF7B72]' : darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'
                                  }`}>
                                    {catTotals.varPct > 0 ? '+' : ''}{catTotals.varPct}%
                                  </td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.otbSubmitted.toLocaleString()}</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.buyActual}%</td>
                                  <td className="px-3 py-0.5"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Gender Total */}
                  <div className={`rounded-xl p-3 border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)]'
                      : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)]'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        TOTAL {genderGroup.gender.name.toUpperCase()}
                      </span>
                      <div className={`flex flex-wrap items-center gap-2 md:gap-6 text-xs md:text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        <span>% Buy: <strong>{genderTotals.buyPct}%</strong></span>
                        <span>% Sales: <strong>{genderTotals.salesPct}%</strong></span>
                        <span>% ST: <strong>{genderTotals.stPct}%</strong></span>
                        <span>% Proposed: <strong>{genderTotals.buyProposed}%</strong></span>
                        <span>$ OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                        <span className={genderTotals.varPct < 0 ? 'text-[#F85149]' : ''}>
                          Var: <strong>{genderTotals.varPct > 0 ? '+' : ''}{genderTotals.varPct}%</strong>
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

  return (
    <div className="space-y-2">
      {/* Filter Toolbar — hides entirely on scroll */}
      <div className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-2 md:mb-3 border-b backdrop-blur-sm relative transition-[transform,opacity] duration-200 ease-out ${
        darkMode ? 'bg-[#121212]/95 border-[#2E2E2E]' : 'bg-white/95 border-[rgba(215,183,151,0.3)]'
      } ${barState === 'collapsed' ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>

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
              <div className="flex flex-wrap items-center gap-2 px-3 md:px-6 py-1.5 relative z-[100]">
                {/* Year Filter */}
                <div className="relative shrink-0" ref={setDropdownRef('year')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'year' ? null : 'year'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all ${
                      selectedYear !== 'all'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                        : darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                          : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                      <Calendar size={12} className={selectedYear !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')} />
                      <span>{selectedYear === 'all' ? (t('common.all') || 'All') : `FY ${selectedYear}`}</span>
                    <ChevronDown size={10} className={`transition-transform duration-200 ${openDropdown === 'year' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'year' && (
                    <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full border rounded-lg shadow-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div
                        onClick={() => { setSelectedYear('all'); setOpenDropdown(null); setSelectedBudgetIds([]); }}
                        className={`px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                          selectedYear === 'all'
                            ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                            : darkMode ? 'hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'hover:bg-[#F2F2F2] text-[#1A1A1A]'
                        }`}
                      >
                        <span className="font-medium">{t('common.all') || 'All Years'}</span>
                        {selectedYear === 'all' && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                      </div>
                      {availableYears.map((year: number) => (
                        <div
                          key={year}
                          onClick={() => { setSelectedYear(year); setOpenDropdown(null); setSelectedBudgetIds([]); }}
                          className={`px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            selectedYear === year
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'hover:bg-[#F2F2F2] text-[#1A1A1A]'
                          }`}
                        >
                          <span className="font-medium">FY {year}</span>
                          {selectedYear === year && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Type Filter (Same/Different Season) */}
                <div className="shrink-0">
                  <div className={`flex rounded-md border overflow-hidden ${
                    darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'
                  }`}>
                    <button
                      type="button"
                      onClick={() => { setComparisonType('same'); setSelectedBudgetIds([]); }}
                      className={`px-2 py-1 text-xs font-medium flex items-center gap-1 transition-all ${
                        comparisonType === 'same'
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.2)] text-[#D7B797] border-r border-[#2E2E2E]'
                            : 'bg-[rgba(215,183,151,0.3)] text-[#6B4D30] border-r border-[#C4B5A5]'
                          : darkMode
                            ? 'bg-[#121212] text-[#666666] hover:text-[#999999] border-r border-[#2E2E2E]'
                            : 'bg-white text-[#999999] hover:text-[#666666] border-r border-[#C4B5A5]'
                      }`}
                    >
                      <ArrowLeftRight size={12} />
                      {t('otbAnalysis.same') || 'Same'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setComparisonType('different'); setSelectedBudgetIds([]); }}
                      className={`px-2 py-1 text-xs font-medium flex items-center gap-1 transition-all ${
                        comparisonType === 'different'
                          ? darkMode
                            ? 'bg-[rgba(215,183,151,0.2)] text-[#D7B797]'
                            : 'bg-[rgba(215,183,151,0.3)] text-[#6B4D30]'
                          : darkMode
                            ? 'bg-[#121212] text-[#666666] hover:text-[#999999]'
                            : 'bg-white text-[#999999] hover:text-[#666666]'
                      }`}
                    >
                      <ArrowLeftRight size={12} className="rotate-45" />
                      {t('otbAnalysis.different') || 'Different'}
                    </button>
                  </div>
                </div>

                {/* Number of Seasons Dropdown */}
                <div className="relative shrink-0" ref={setDropdownRef('seasonCount')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'seasonCount' ? null : 'seasonCount'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all ${
                      darkMode
                        ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                        : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                    }`}
                  >
                      <Calendar size={12} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                      <span>{seasonCount}</span>
                    <ChevronDown size={10} className={`transition-transform duration-200 ${openDropdown === 'seasonCount' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'seasonCount' && (
                    <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full border rounded-lg shadow-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          onClick={() => {
                            setSeasonCount(n);
                            // Trim selected budgets if they exceed the new count
                            if (selectedBudgetIds.length > n) {
                              setSelectedBudgetIds(prev => prev.slice(0, n));
                            }
                            setOpenDropdown(null);
                          }}
                          className={`px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            seasonCount === n
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'hover:bg-[#F2F2F2] text-[#1A1A1A]'
                          }`}
                        >
                          <span className="font-medium">{n}</span>
                          {seasonCount === n && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`h-6 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`} />

                {/* Budget Season Multi-Select */}
                <div className="relative flex-1 min-w-0" ref={setDropdownRef('budgetSeason')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'budgetSeason' ? null : 'budgetSeason'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-2 py-1 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-xs transition-all ${
                      selectedBudgetIds.length > 0
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                        : darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                          : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText size={12} className={`shrink-0 ${selectedBudgetIds.length > 0 ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')}`} />
                      <span className="truncate">
                        {selectedBudgetIds.length === 0
                          ? (t('otbAnalysis.selectBudgets') || 'Select')
                          : `${selectedBudgetIds.length} ${t('otbAnalysis.budgetsSelected') || 'selected'}`}
                      </span>
                      {selectedBudgetIds.length > 0 && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          darkMode ? 'bg-[#D7B797] text-[#0A0A0A]' : 'bg-[#6B4D30] text-white'
                        }`}>{selectedBudgetIds.length}</span>
                      )}
                    </div>
                    <ChevronDown size={12} className={`flex-shrink-0 transition-transform duration-200 ${openDropdown === 'budgetSeason' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'budgetSeason' && (
                    <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-[320px] border rounded-xl shadow-xl z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div className={`p-2 border-b flex items-center justify-between ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[#F2F2F2] border-[#D4C8BB]'}`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                          {t('otbAnalysis.budgetSeason') || 'Budget Season'}
                        </span>
                        {selectedBudgetIds.length > 0 && (
                          <button
                            onClick={() => setSelectedBudgetIds([])}
                            className={`text-xs px-2 py-0.5 rounded transition-colors ${
                              darkMode ? 'text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'
                            }`}
                          >
                            {t('common.clearAll') || 'Clear'}
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto py-0.5">
                        {loadingBudgets && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#D7B797]/30 border-t-[#D7B797] rounded-full animate-spin" />
                            <span className={`ml-2 text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('common.loading')}...</span>
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.length === 0 && (
                          <div className={`px-4 py-6 text-center text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                            {t('budget.noMatchingBudgets') || 'No budgets found'}
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.map((budget: any) => {
                          const isSelected = selectedBudgetIds.includes(budget.id);
                          const isDisabled = !isSelected && selectedBudgetIds.length >= seasonCount;
                          return (
                            <div
                              key={budget.id}
                              onClick={() => !isDisabled && toggleBudgetSelection(budget.id)}
                              className={`px-4 py-2 cursor-pointer transition-colors border-t ${
                                darkMode ? 'border-[#2E2E2E]' : 'border-[#D4C8BB]'
                              } ${
                                isDisabled
                                  ? 'opacity-40 cursor-not-allowed'
                                  : isSelected
                                    ? darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.18)]'
                                    : darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-[#F2F2F2]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Checkbox */}
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#D7B797] border-[#D7B797]'
                                    : darkMode ? 'border-[#666666]' : 'border-[#C4B5A5]'
                                }`}>
                                  {isSelected && <Check size={10} className="text-[#1A1A1A]" strokeWidth={3} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`font-semibold text-sm ${isSelected ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                                    {budget.budgetName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>FY{budget.fiscalYear}</span>
                                    <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]/30'}>|</span>
                                    <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{budget.seasonGroup} {budget.seasonType}</span>
                                    <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]/30'}>|</span>
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

                {/* Season Group Filter - only show after budget selected */}
                {selectedBudgetId && selectedBudgetId !== 'all' && (
                <>
                <div className={`h-6 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`}></div>
                <div className="relative shrink-0" ref={setDropdownRef('seasonGroup')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'seasonGroup' ? null : 'seasonGroup'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all ${
                      selectedSeasonGroup !== 'all'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                        : darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                          : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                      <Calendar size={12} className={`shrink-0 ${selectedSeasonGroup !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')}`} />
                      <span className="truncate">{selectedSeasonGroup === 'all' ? (t('planning.allSeasonGroups') || 'All') : (SEASON_GROUPS.find((s: any) => s.id === selectedSeasonGroup)?.label || selectedSeasonGroup)}</span>
                    <ChevronDown size={10} className={`transition-transform duration-200 ${openDropdown === 'seasonGroup' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'seasonGroup' && (
                    <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full border rounded-lg shadow-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div
                        onClick={() => { setSelectedSeasonGroup('all'); setOpenDropdown(null); }}
                        className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                          selectedSeasonGroup === 'all'
                            ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                            : darkMode ? 'hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'hover:bg-[#F2F2F2] text-[#1A1A1A]'
                        }`}
                      >
                        <span className="font-medium">{t('planning.allSeasonGroups') || 'All Season Groups'}</span>
                        {selectedSeasonGroup === 'all' && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                      </div>
                      {SEASON_GROUPS.map((season: any) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeasonGroup(season.id); setOpenDropdown(null); }}
                          className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            selectedSeasonGroup === season.id
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'hover:bg-[#F2F2F2] text-[#1A1A1A]'
                          }`}
                        >
                          <span className="font-medium">{season.label}</span>
                          {selectedSeasonGroup === season.id && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                        </div>
                      ))}
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
                    className={`px-2 py-1 border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all ${
                      selectedSeason !== 'all'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                        : darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                          : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                      <Clock size={12} className={selectedSeason !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')} />
                      <span className="whitespace-nowrap">{selectedSeason === 'all' ? (t('otbAnalysis.allSeasons') || 'All') : (SEASONS.find((s: any) => s.id === selectedSeason)?.label || selectedSeason)}</span>
                    <ChevronDown size={10} className={`transition-transform duration-200 ${openDropdown === 'season' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'season' && (
                    <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full border rounded-lg shadow-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div
                        onClick={() => { setSelectedSeason('all'); setOpenDropdown(null); }}
                        className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                          selectedSeason === 'all'
                            ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                            : darkMode ? 'hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'hover:bg-[#F2F2F2] text-[#1A1A1A]'
                        }`}
                      >
                        <span className="font-medium">{t('otbAnalysis.allSeasons') || 'All Seasons'}</span>
                        {selectedSeason === 'all' && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                      </div>
                      {SEASONS.map((season: any) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeason(season.id); setOpenDropdown(null); }}
                          className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            selectedSeason === season.id
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[#1A1A1A] text-[#F2F2F2]' : 'hover:bg-[#F2F2F2] text-[#1A1A1A]'
                          }`}
                        >
                          <span className="font-medium">{season.label}</span>
                          {selectedSeason === season.id && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </>
                )}

                {/* Version Filter */}
                {selectedBudgetId && selectedBudgetId !== 'all' && (
                <>
                <div className={`h-6 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`}></div>
                <div className="relative shrink-0" ref={setDropdownRef('version')}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'version' ? null : 'version'));
                      setOpenCategoryDropdown(null);
                    }}
                    disabled={versions.length === 0 && !loadingVersions}
                    className={`px-2 py-1 border rounded-lg font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all ${
                      versions.length === 0 && !loadingVersions
                        ? darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#666666] cursor-not-allowed opacity-50'
                          : 'bg-[#F2F2F2] border-[#C4B5A5] text-[#999999] cursor-not-allowed opacity-50'
                        : selectedVersion
                          ? selectedVersion.isFinal
                            ? darkMode
                              ? 'bg-[rgba(160,120,75,0.18)] border-[#D7B797] text-[#D7B797]'
                              : 'bg-[rgba(215,183,151,0.2)] border-[#D7B797] text-[#6B4D30]'
                            : darkMode
                              ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797]'
                              : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                          : darkMode
                            ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                            : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                      {selectedVersion?.isFinal ? (
                        <Star size={12} className={`shrink-0 ${darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'}`} />
                      ) : (
                        <Sparkles size={12} className={`shrink-0 ${selectedVersion ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')}`} />
                      )}
                      <span className="whitespace-nowrap">
                        {loadingVersions ? `${t('common.loading')}...` : selectedVersion ? selectedVersion.name : t('common.version')}
                      </span>
                      {selectedVersion?.isFinal && (
                        <span className="px-1 py-px text-[9px] font-bold bg-[#D7B797] text-[#0A0A0A] rounded shrink-0">FINAL</span>
                      )}
                    <ChevronDown size={10} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'version' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'version' && (
                    <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-[300px] border rounded-xl shadow-xl z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div className={`p-2 border-b ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[#F2F2F2] border-[#D4C8BB]'}`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Planning Versions</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-0.5">
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
                        {!loadingVersions && versions.map((version: any) => (
                          <div
                            key={version.id}
                            onClick={() => { setSelectedVersionId(version.id); setOpenDropdown(null); }}
                            className={`px-4 py-0.5 cursor-pointer transition-colors border-t ${
                              darkMode ? 'border-[#2E2E2E]' : 'border-[#D4C8BB]'
                            } ${
                              selectedVersionId === version.id
                                ? darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.18)]'
                                : darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-[#F2F2F2]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {version.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797] flex-shrink-0' : 'text-[#6B4D30] fill-[#6B4D30] flex-shrink-0'} />}
                                <span className={`font-semibold text-sm font-['Montserrat'] truncate ${selectedVersionId === version.id ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                                  {version.name}
                                </span>
                                {version.isFinal && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#D7B797] text-[#0A0A0A] rounded flex-shrink-0">FINAL</span>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  version.status === 'APPROVED' ? 'bg-[rgba(18,119,73,0.15)] text-[#127749]' :
                                  version.status === 'SUBMITTED' ? 'bg-[rgba(227,179,65,0.15)] text-[#E3B341]' :
                                  darkMode ? 'bg-[#2E2E2E] text-[#999999]' : 'bg-[#F2F2F2] text-[#666666]'
                                }`}>{version.status}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                {!version.isFinal && (
                                  <button
                                    onClick={(e) => handleSetFinalVersion(version.id, e)}
                                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                                      darkMode
                                        ? 'bg-[rgba(160,120,75,0.18)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.25)]'
                                        : 'bg-[rgba(215,183,151,0.2)] text-[#6B4D30] hover:bg-[rgba(215,183,151,0.35)]'
                                    }`}
                                  >
                                    {t('planning.latestVersion')}
                                  </button>
                                )}
                                {selectedVersionId === version.id && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
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
                    className={`shrink-0 p-1 rounded transition-colors ${darkMode ? 'text-[#666666] hover:text-red-400 hover:bg-red-400/10' : 'text-[#999999] hover:text-red-500 hover:bg-red-50'}`}
                    title={t('common.clearAllFilters')}
                  >
                    <X size={14} />
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

      {/* Single Budget Mode - Tabs & Content */}
      {selectedBudgetIds.length <= 1 && selectedBudget && selectedSeason && selectedSeasonGroup && (
      <div className={`rounded-xl shadow-lg border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
        {/* Tabs */}
        <div className={`border-b px-2 md:px-4 pt-2 ${darkMode ? 'border-[#2E2E2E] bg-[#1A1A1A]' : 'border-[#D4C8BB] bg-[#F2F2F2]'}`}>
          <div className="flex gap-1">
            {TABS.map((tab: any) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 text-sm font-medium font-['Montserrat'] flex items-center gap-2 border-b-2 transition-all duration-200 ${
                    isActive
                      ? darkMode
                        ? 'border-[#D7B797] text-[#D7B797] bg-[#121212] -mb-px rounded-t-md'
                        : 'border-[#D7B797] text-[#6B4D30] bg-white -mb-px rounded-t-md'
                      : darkMode
                        ? 'border-transparent text-[#666666] hover:text-[#999999] hover:bg-[#121212] rounded-t-md'
                        : 'border-transparent text-[#999999] hover:text-[#666666] hover:bg-white/50 rounded-t-md'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>


        {/* Content */}
        <div className="overflow-y-auto">
          {activeTab === 'collection' && renderCollectionTab()}
          {activeTab === 'gender' && renderGenderTab()}
          {activeTab === 'category' && renderCategoryTab()}
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
