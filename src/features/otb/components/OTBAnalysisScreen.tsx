'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  BarChart3, Filter, ChevronDown, Check,
  Calendar, Tag, Layers, Users, Info, Pencil, X, Star,
  Sparkles, FileText, Clock, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils';
import { STORES, GENDERS } from '../../../utils/constants';
import { budgetService, masterDataService, planningService } from '../../../services';
import { FilterBottomSheet, FilterChips, useBottomSheet } from '@/components/mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

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
          className={`w-20 px-2 py-1.5 text-center border-2 border-[#D7B797] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.5)] font-['JetBrains_Mono'] font-medium transition-all ${
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
        <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg min-w-[70px] justify-center ${
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
      <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all min-w-[70px] justify-center ${
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

  // Filter states
  const [selectedBudgetId, setSelectedBudgetId] = useState('all');
  const [selectedSeasonGroup, setSelectedSeasonGroup] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [budgetContext, setBudgetContext] = useState<any>(null); // Budget info from Planning Screen
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<any>(null);

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

    // Initialize Collection tab data
    collectionSections.forEach((section: any) => {
      STORES.forEach((store: any) => {
        const key = `collection_${section.id}_${store.id}`;
        initialData[key] = {
          buyPct: 0,
          salesPct: 0,
          stPct: 0,
          moc: '0.0',
          userBuyPct: 0,
          otbValue: 0
        };
      });
    });

    // Initialize Gender tab data
    GENDERS.forEach((gender: any) => {
      STORES.forEach((store: any) => {
        const key = `gender_${gender.id}_${store.id}`;
        initialData[key] = {
          buyPct: 0,
          salesPct: 0,
          stPct: 0,
          userBuyPct: 0,
          otbValue: 0
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

  // Clear all filters
  const clearFilters = () => {
    setSelectedBudgetId('all');
    setSelectedSeasonGroup('all');
    setSelectedSeason('all');
    setSelectedVersionId(null);
    setVersions([]);
    setBudgetContext(null);
  };

  const hasActiveFilters = selectedBudgetId !== 'all' || selectedSeasonGroup !== 'all' || selectedSeason !== 'all' || selectedVersionId;

  // Filter budgets by selected season group/season
  const filteredBudgets = useMemo(() => {
    let list = apiBudgets;
    if (selectedSeasonGroup !== 'all') {
      const seasonFiltered = list.filter((b: any) => b.seasonGroup === selectedSeasonGroup);
      if (seasonFiltered.length > 0) list = seasonFiltered;
    }
    if (selectedSeason !== 'all') {
      const seasonFiltered = list.filter((b: any) => b.seasonType === selectedSeason);
      if (seasonFiltered.length > 0) list = seasonFiltered;
    }
    return list;
  }, [apiBudgets, selectedSeasonGroup, selectedSeason]);

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
    ? "bg-[rgba(215,183,151,0.08)] border-l-4 border-[#D7B797]"
    : "bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] border-l-4 border-[#D7B797]";
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
                  <td className="px-3 py-2" colSpan={8}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{section.name}</span>
                      <Info size={14} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                    </div>
                  </td>
                </tr>

                {STORES.map((store: any) => {
                  const cellKey = `collection_${section.id}_${store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? 0;
                  const variance = userBuyPctValue - (cellData.salesPct || 0);

                  return (
                    <tr
                      key={cellKey}
                      className={`border-b transition-colors ${
                        darkMode
                          ? 'border-[#2E2E2E] hover:bg-[#1A1A1A]'
                          : 'border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)]'
                      }`}
                    >
                      <td className="px-3 py-1.5 pl-6">
                        <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>{store.name}</span>
                      </td>
                      <td className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.buyPct || 0).toFixed(1)}%</td>
                      <td className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.stPct || 0).toFixed(0)}%</td>
                      <td className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{cellData.moc || 0}</td>
                      <td className={`px-4 py-3 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
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
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${
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
              <td className="px-3 py-2 font-bold font-['Montserrat']">{t('otbAnalysis.total')}</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">-</td>
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
                  <td className="px-3 py-2" colSpan={7}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{gen.name}</span>
                      <Info size={14} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                    </div>
                  </td>
                </tr>

                {STORES.map((store: any) => {
                  const cellKey = `gender_${gen.id}_${store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? 0;
                  const variance = userBuyPctValue - (cellData.salesPct || 0);

                  return (
                    <tr
                      key={cellKey}
                      className={`border-b transition-colors ${
                        darkMode
                          ? 'border-[#2E2E2E] hover:bg-[#1A1A1A]'
                          : 'border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)]'
                      }`}
                    >
                      <td className="px-3 py-1.5 pl-6">
                        <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>{store.name}</span>
                      </td>
                      <td className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.buyPct || 0).toFixed(1)}%</td>
                      <td className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.salesPct || 0).toFixed(0)}%</td>
                      <td className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{(cellData.stPct || 0).toFixed(0)}%</td>
                      <td className={`px-4 py-3 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
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
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>{formatCurrency(cellData.otbValue || 0)}</td>
                      <td className={`px-4 py-3 text-center font-medium font-['JetBrains_Mono'] ${
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
              <td className="px-3 py-2 font-bold font-['Montserrat']">{t('otbAnalysis.total')}</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">-</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">100%</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-3 py-2 text-center font-['JetBrains_Mono']">-</td>
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
        <div className={`px-4 py-3 rounded-xl border mb-4 ${
          darkMode
            ? 'bg-[#121212] border-[#2E2E2E]'
            : 'bg-[#F2F2F2] border-[#C4B5A5]'
        }`}>
          <div className="flex flex-wrap items-center gap-3 md:gap-6 overflow-x-auto">
            <div className={`flex items-center gap-2 shrink-0 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
              <Filter size={16} />
              <span className="font-medium text-sm font-['Montserrat']">{t('otbAnalysis.filters')}:</span>
            </div>

            {/* Gender Filter */}
            <div className="relative" ref={setDropdownRef('genderFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev: any) => (prev === 'genderFilter' ? null : 'genderFilter'));
                  setOpenDropdown(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all min-w-[150px] ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] hover:border-[rgba(215,183,151,0.4)]'
                    : 'bg-white border-[#C4B5A5] hover:border-[rgba(215,183,151,0.5)]'
                }`}
              >
                <Users size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`text-sm font-medium flex-1 text-left truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                  {getSelectedLabel(filterOptions.genders, genderFilter)}
                </span>
                <ChevronDown size={16} className={`transition-transform ${darkMode ? 'text-[#666666]' : 'text-[#999999]'} ${openCategoryDropdown === 'genderFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'genderFilter' && (
                <div className={`absolute top-full left-0 mt-1 w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden ${
                  darkMode
                    ? 'bg-[#121212] border-[#2E2E2E]'
                    : 'bg-white border-[#C4B5A5]'
                }`}>
                  {filterOptions.genders.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleGenderFilterChange(option.id)}
                      className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
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
            <div className="relative" ref={setDropdownRef('categoryFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev: any) => (prev === 'categoryFilter' ? null : 'categoryFilter'));
                  setOpenDropdown(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all min-w-[180px] ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] hover:border-[rgba(215,183,151,0.4)]'
                    : 'bg-white border-[#C4B5A5] hover:border-[rgba(215,183,151,0.5)]'
                }`}
              >
                <Tag size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                <span className={`text-sm font-medium flex-1 text-left truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                  {getSelectedLabel(filterOptions.categories, categoryFilter)}
                </span>
                <ChevronDown size={16} className={`transition-transform ${darkMode ? 'text-[#666666]' : 'text-[#999999]'} ${openCategoryDropdown === 'categoryFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'categoryFilter' && (
                <div className={`absolute top-full left-0 mt-1 w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto ${
                  darkMode
                    ? 'bg-[#121212] border-[#2E2E2E]'
                    : 'bg-white border-[#C4B5A5]'
                }`}>
                  {filteredCategoryOptions.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleCategoryFilterChange(option.id)}
                      className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
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
            <div className="relative" ref={setDropdownRef('subCategoryFilter')}>
              <button
                type="button"
                onClick={() => {
                  setOpenCategoryDropdown((prev: any) => (prev === 'subCategoryFilter' ? null : 'subCategoryFilter'));
                  setOpenDropdown(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all min-w-[180px] ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] hover:border-[rgba(215,183,151,0.4)]'
                    : 'bg-white border-[#C4B5A5] hover:border-[rgba(215,183,151,0.5)]'
                }`}
              >
                <Layers size={14} className="text-[#2A9E6A]" />
                <span className={`text-sm font-medium flex-1 text-left truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                  {getSelectedLabel(filterOptions.subCategories, subCategoryFilter)}
                </span>
                <ChevronDown size={16} className={`transition-transform ${darkMode ? 'text-[#666666]' : 'text-[#999999]'} ${openCategoryDropdown === 'subCategoryFilter' ? 'rotate-180' : ''}`} />
              </button>
              {openCategoryDropdown === 'subCategoryFilter' && (
                <div className={`absolute top-full left-0 mt-1 w-full border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto ${
                  darkMode
                    ? 'bg-[#121212] border-[#2E2E2E]'
                    : 'bg-white border-[#C4B5A5]'
                }`}>
                  {filteredSubCategoryOptions.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleSubCategoryFilterChange(option.id)}
                      className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F85149] to-[#FF7B72] text-white rounded-lg hover:from-[#FF7B72] hover:to-[#F85149] transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                <X size={14} />
                {t('common.clearAll')}
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
            <div key={genderGroup.gender.id} className={`rounded-xl border-2 overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'}`}>
              {/* Gender Header - Level 1 */}
              <div
                onClick={() => toggleGenderExpanded(genderGroup.gender.id)}
                className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-3 cursor-pointer transition-all ${
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
                <span className={`font-bold text-base md:text-lg font-['Montserrat'] ${darkMode ? 'text-white' : 'text-[#5C4A3A]'}`}>{genderGroup.gender.name}</span>
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
                          className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 cursor-pointer transition-all ${
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
                          <span className={`font-semibold text-sm md:text-base font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
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
                                      <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-[#666666]' : 'bg-[#999999]'}`}></div>
                                          <span className={darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}>{subCat.name}</span>
                                        </div>
                                      </td>
                                      <td className={`px-2 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.buyPct || 0}%</td>
                                      <td className={`px-2 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.salesPct || 0}%</td>
                                      <td className={`px-2 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.stPct || 0}%</td>
                                      <td className={`px-3 py-2.5 ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
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
                                      <td className={`px-3 py-2.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>
                                        {(rowData.otbProposed || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-3 py-2.5 text-center font-medium font-['JetBrains_Mono'] ${
                                        (rowData.varPct || 0) < 0 ? 'text-[#F85149]' : 'text-[#2A9E6A]'
                                      }`}>
                                        {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                                      </td>
                                      <td className={`px-2 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                                        {(rowData.otbSubmitted || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-2 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{rowData.buyActual || 0}%</td>
                                      <td className="px-3 py-2.5 text-center">
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
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#D7B797] to-[#C4A57B] hover:from-[#C4A57B] hover:to-[#D7B797] text-[#1A1A1A] rounded-lg font-medium text-xs transition-all shadow-sm hover:shadow-md"
                                        >
                                          <Package size={12} />
                                          {t('nav.skuProposal')}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* Category Subtotal Row */}
                                <tr className={darkMode ? 'bg-gradient-to-r from-[rgba(215,183,151,0.2)] to-[rgba(215,183,151,0.15)] font-medium' : 'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                                  <td className={`px-4 py-2 font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                                  <td className={`px-3 py-2 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.buyPct}%</td>
                                  <td className={`px-3 py-2 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.salesPct}%</td>
                                  <td className={`px-3 py-2 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.stPct}%</td>
                                  <td className={`px-3 py-2 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{catTotals.buyProposed}%</td>
                                  <td className={`px-3 py-2 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.otbProposed.toLocaleString()}</td>
                                  <td className={`px-3 py-2 text-center font-bold font-['JetBrains_Mono'] ${
                                    catTotals.varPct < 0 ? 'text-[#FF7B72]' : darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'
                                  }`}>
                                    {catTotals.varPct > 0 ? '+' : ''}{catTotals.varPct}%
                                  </td>
                                  <td className={`px-3 py-2 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.otbSubmitted.toLocaleString()}</td>
                                  <td className={`px-3 py-2 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#5C4A32]'}`}>{catTotals.buyActual}%</td>
                                  <td className="px-3 py-2"></td>
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
                      <span className={`font-bold text-sm md:text-base font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
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

  return (
    <div className="space-y-2">
      {/* Header Section - Sticky */}
      <div className={`backdrop-blur-xl rounded-xl shadow-xl border p-2 md:p-3 relative z-[100] sticky top-0 ${darkMode ? 'bg-[#121212]/95 border-[#2E2E2E]' : 'bg-gradient-to-br from-white to-[rgba(215,183,151,0.1)] border-[#C4B5A5]'}`}>

        <div className="relative">
          {/* Filter Section - Redesigned like Planning page */}
          <div className={`rounded-xl border shadow-sm ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
            {/* Filter Header */}
            <div className={`flex flex-wrap items-center justify-between px-3 py-2 border-b ${darkMode ? 'bg-[#1A1A1A]/50 border-[#2E2E2E]' : 'bg-gradient-to-r from-[#F2F2F2] to-[rgba(215,183,151,0.1)] border-[#C4B5A5]'}`}>
              <div className="flex items-center gap-2">
                <Filter size={16} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                <span className={`text-sm font-semibold font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]'}`}>{t('otbAnalysis.filters')}</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className={`flex items-center gap-1 text-xs transition-colors ${darkMode ? 'text-[#666666] hover:text-[#999999]' : 'text-[#999999] hover:text-[#666666]'}`}
                >
                  <X size={12} />
                  {t('common.clearAllFilters')}
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="p-3 relative z-[100]">
              {/* Mobile Filter Button */}
              {isMobile && (
                <button
                  onClick={openFilter}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium ${
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
              )}
              {/* Desktop Filters */}
              {!isMobile && (
              <div className="flex flex-wrap items-end gap-2">
                {/* Budget Name Dropdown */}
                <div className="relative min-w-[200px]" ref={setDropdownRef('budget')}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                    {t('budget.budgetName')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'budget' ? null : 'budget'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      selectedBudget
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                        : darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                          : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className={selectedBudget ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')} />
                      <span className="truncate">{selectedBudget?.budgetName || t('otbAnalysis.selectBudget')}</span>
                    </div>
                    <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${openDropdown === 'budget' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'budget' && (
                    <div className={`absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div className={`p-2 border-b ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[#F2F2F2] border-[#D4C8BB]'}`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{t('budget.title')}</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-1">
                        {/* Loading state */}
                        {loadingBudgets && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#D7B797]/30 border-t-[#D7B797] rounded-full animate-spin" />
                            <span className={`ml-2 text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('common.loading')}...</span>
                          </div>
                        )}
                        {/* Empty state */}
                        {!loadingBudgets && filteredBudgets.length === 0 && (
                          <div className={`px-4 py-6 text-center text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                            {t('budget.noMatchingBudgets')}
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.length > 0 && (
                        <div
                          onClick={() => { setSelectedBudgetId('all'); setOpenDropdown(null); }}
                          className={`px-4 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                            selectedBudgetId === 'all'
                              ? darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.18)] text-[#6B4D30]'
                              : darkMode ? 'hover:bg-[#1A1A1A] text-[#666666]' : 'hover:bg-[#F2F2F2] text-[#999999]'
                          }`}
                        >
                          <span className="font-medium">{t('otbAnalysis.selectBudget')}</span>
                          {selectedBudgetId === 'all' && <Check size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                        </div>
                        )}
                        {!loadingBudgets && filteredBudgets.map((budget: any) => (
                          <div
                            key={budget.id}
                            onClick={() => {
                              setSelectedBudgetId(budget.id);
                              if (budget.seasonGroup) setSelectedSeasonGroup(budget.seasonGroup);
                              if (budget.seasonType) setSelectedSeason(budget.seasonType);
                              setOpenDropdown(null);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors border-t ${
                              darkMode ? 'border-[#2E2E2E]' : 'border-[#D4C8BB]'
                            } ${
                              selectedBudgetId === budget.id
                                ? darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.18)]'
                                : darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-[#F2F2F2]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <div className={`font-semibold text-sm ${selectedBudgetId === budget.id ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]')}`}>
                                  {budget.budgetName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>FY{budget.fiscalYear}</span>
                                  <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]/30'}>-</span>
                                  <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{budget.brandName}</span>
                                  <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]/30'}>-</span>
                                  <span className={`text-xs font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(budget.totalBudget)}</span>
                                </div>
                              </div>
                              {selectedBudgetId === budget.id && (
                                <div className="w-5 h-5 rounded-full bg-[#D7B797] flex items-center justify-center flex-shrink-0 ml-2">
                                  <Check size={12} className="text-[#1A1A1A]" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Season Group Filter - only show after budget selected */}
                {selectedBudgetId && selectedBudgetId !== 'all' && (
                <>
                <div className={`h-10 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`}></div>
                <div className="relative min-w-[140px]" ref={setDropdownRef('seasonGroup')}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                    {t('otbAnalysis.seasonGroup')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'seasonGroup' ? null : 'seasonGroup'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      selectedSeasonGroup !== 'all'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                        : darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                          : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className={selectedSeasonGroup !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')} />
                      <span>{selectedSeasonGroup === 'all' ? (t('planning.allSeasonGroups') || 'All Season Groups') : (SEASON_GROUPS.find((s: any) => s.id === selectedSeasonGroup)?.label || selectedSeasonGroup)}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${openDropdown === 'seasonGroup' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'seasonGroup' && (
                    <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div
                        onClick={() => { setSelectedSeasonGroup('all'); setOpenDropdown(null); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
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
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
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
                <div className="relative min-w-[140px]" ref={setDropdownRef('season')}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                    {t('otbAnalysis.season')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'season' ? null : 'season'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      selectedSeason !== 'all'
                        ? darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[rgba(215,183,151,0.5)]'
                        : darkMode
                          ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] hover:border-[#666666] hover:bg-[#1A1A1A]'
                          : 'bg-white border-[#C4B5A5] text-[#1A1A1A] hover:border-[#2E2E2E]/40 hover:bg-[#F2F2F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={selectedSeason !== 'all' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')} />
                      <span>{selectedSeason === 'all' ? (t('otbAnalysis.allSeasons') || 'All Seasons') : (SEASONS.find((s: any) => s.id === selectedSeason)?.label || selectedSeason)}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${openDropdown === 'season' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'season' && (
                    <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div
                        onClick={() => { setSelectedSeason('all'); setOpenDropdown(null); }}
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
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
                          className={`px-3 py-2.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${
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
                <div className={`h-10 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`}></div>
                <div className="relative min-w-[200px]" ref={setDropdownRef('version')}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                    Version
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'version' ? null : 'version'));
                      setOpenCategoryDropdown(null);
                    }}
                    disabled={versions.length === 0 && !loadingVersions}
                    className={`w-full px-3 py-2.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
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
                    <div className="flex items-center gap-2 truncate">
                      {selectedVersion?.isFinal ? (
                        <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />
                      ) : (
                        <Sparkles size={14} className={selectedVersion ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#666666]' : 'text-[#999999]')} />
                      )}
                      <span className="truncate">
                        {loadingVersions ? `${t('common.loading')}...` : selectedVersion ? selectedVersion.name : t('common.version')}
                      </span>
                      {selectedVersion?.isFinal && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#D7B797] text-[#0A0A0A] rounded flex-shrink-0">FINAL</span>
                      )}
                    </div>
                    <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'version' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'version' && (
                    <div className={`absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] ${
                      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
                    }`}>
                      <div className={`p-2 border-b ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[#F2F2F2] border-[#D4C8BB]'}`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Planning Versions</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-1">
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
                            className={`px-4 py-3 cursor-pointer transition-colors border-t ${
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
                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
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

                {/* Budget Context Card */}
                {((selectedBudget  && selectedSeasonGroup && selectedSeason) || budgetContext) && (
                  <>
                    <div className={`h-10 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`}></div>
                    <div className={`flex items-center gap-4 px-4 py-2 rounded-xl border ${
                      darkMode
                        ? 'border-[rgba(215,183,151,0.25)] bg-[rgba(215,183,151,0.08)]'
                        : 'border-[rgba(215,183,151,0.4)] bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.1)]'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold font-['Montserrat'] truncate max-w-[160px] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                          {selectedBudget?.budgetName || budgetContext?.budgetName || 'Budget'}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-[#D7B797]/70' : 'text-[#6B4D30]/70'}`}>
                          FY {selectedBudget?.fiscalYear || budgetContext?.fiscalYear} - {selectedBudget?.brandName || budgetContext?.brandName || 'Brand'}
                        </span>
                      </div>
                      <div className={`w-px h-10 ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.4)]'}`}></div>
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                          {formatCurrency(
                            budgetContext?.rex || budgetContext?.ttp
                              ? (budgetContext.rex || 0) + (budgetContext.ttp || 0)
                              : selectedBudget?.totalBudget || 0
                          )}
                        </span>
                        <div className={`flex items-center gap-3 text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]/70' : 'text-[#6B4D30]/70'}`}>
                          {budgetContext?.rex || budgetContext?.ttp ? (
                            <>
                              <span>Rex: {formatCurrency(budgetContext?.rex || 0)}</span>
                              <span>TTP: {formatCurrency(budgetContext?.ttp || 0)}</span>
                            </>
                          ) : selectedBudget?.details?.length > 0 ? (
                            selectedBudget.details.map((d: any) => (
                              <span key={d.id || d.store?.code}>{d.store?.code || d.storeCode}: {formatCurrency(Number(d.budgetAmount) || 0)}</span>
                            ))
                          ) : (
                            <span>{t('otbAnalysis.totalBudget')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      {selectedBudget && selectedSeason && selectedSeasonGroup && (
      <div className={`rounded-xl shadow-lg border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
        {/* Tabs */}
        <div className={`border-b px-2 md:px-4 overflow-x-auto ${darkMode ? 'border-[#2E2E2E] bg-[#1A1A1A]' : 'border-[#D4C8BB] bg-[#F2F2F2]'}`}>
          <div className="flex gap-0.5">
            {TABS.map((tab: any) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-medium font-['Montserrat'] flex items-center gap-1.5 border-b-2 transition-all duration-200 ${
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

        {/* Hint + Season Context */}
        <div className={`px-3 md:px-4 py-2 border-b flex flex-wrap items-center justify-between gap-1 text-xs ${
          darkMode
            ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.15)] text-[#D7B797]'
            : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.2)] text-[#6B4D30]'
        }`}>
          <div className="flex items-center gap-1.5">
            <Pencil size={12} className="animate-bounce shrink-0" style={{ animationDuration: '2s' }} />
            <span className="text-[10px] md:text-xs">Click on cells with gold background in "% Buy Proposed" column to edit</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedSeasonGroup !== 'all' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                darkMode ? 'bg-[rgba(215,183,151,0.2)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.3)] text-[#6B4D30]'
              }`}>
                {SEASON_GROUPS.find((s: any) => s.id === selectedSeasonGroup)?.label || selectedSeasonGroup}
              </span>
            )}
            {selectedSeason !== 'all' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.25)] text-[#6B4D30]'
              }`}>
                {SEASONS.find((s: any) => s.id === selectedSeason)?.label || selectedSeason}
              </span>
            )}
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
            key: 'budget',
            label: t('budget.budgetName'),
            type: 'single',
            options: filteredBudgets.map((b: any) => ({ label: b.budgetName, value: b.id })),
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
          setSelectedBudgetId((mobileFilterValues.budget as string) || 'all');
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
