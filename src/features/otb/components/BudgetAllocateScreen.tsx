'use client';

import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import {
  DollarSign, Sparkles, Filter, Clock, ChevronDown, Check,
  ChevronRight, TrendingUp, Sun, Snowflake,
  Star, Layers, Tag, FileText, X, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils';
import { SEASON_GROUPS, STORES, SEASON_CONFIG } from '../../../utils/constants';
import { budgetService, masterDataService, planningService } from '../../../services';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { FilterBottomSheet, FilterChips, useBottomSheet } from '@/components/mobile';

// Constants - same as BudgetManagementScreen
const YEARS = [2023, 2024, 2025, 2026];

const GROUP_BRAND_COLORS = [
  'from-[#8A6340] to-[#6B4D30]',
  'from-[#5C4033] to-[#3E2B22]',
  'from-[#7A6350] to-[#5C4A32]',
  'from-[#4A3728] to-[#362A1E]',
];


const BudgetAllocateScreen = ({
  budgets,
  plannings,
  getPlanningStatus,
  handleOpenPlanningDetail,
  onOpenOtbAnalysis,
  allocationData,
  onAllocationDataUsed,
  availableBudgets: propAvailableBudgets,
  darkMode = false
}: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});
  // API state for fetching budgets and brands
  const [apiBudgets, setApiBudgets] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [brandList, setBrandList] = useState<any[]>([]);
  const [groupBrandList, setGroupBrandList] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Fetch brands (group brands) from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brands = await masterDataService.getBrands();
        const list = Array.isArray(brands) ? brands : (brands?.data || []);

        // Group brands are the top-level items; individual brands may be nested
        // The API returns group_brands (Ferragamo, Burberry, etc.)
        const groups: any[] = [];
        const allBrands: any[] = [];

        list.forEach((b: any) => {
          const id = b.id || b.brandId;
          const name = b.name || b.brandName || b.code || 'Unknown';
          const groupId = b.groupBrandId || b.groupId || id;

          // Add to group list (dedupe) - use group count for consistent color
          if (!groups.find((g: any) => g.id === groupId)) {
            groups.push({
              id: groupId,
              name: b.groupBrand?.name || b.groupName || name,
              color: GROUP_BRAND_COLORS[groups.length % GROUP_BRAND_COLORS.length]
            });
          }

          allBrands.push({
            id,
            groupBrandId: groupId,
            name
          });
        });

        setGroupBrandList(groups);
        setBrandList(allBrands);
      } catch (err: any) {
        console.error('Failed to fetch brands:', err);
        setBrandList([]);
        setGroupBrandList([]);
      }
    };
    fetchBrands();
    // Fetch categories
    masterDataService.getCategories().then(res => {
      const data = res.data || res || [];
      setCategoryData(Array.isArray(data) ? data : []);
    }).catch(() => setCategoryData([]));
  }, []);

  // Fetch budgets on mount (with Strict Mode ignore pattern)
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoadingBudgets(true);
      try {
        const response = await budgetService.getAll({ status: 'APPROVED' });
        if (ignore) return;
        const budgetList = (response.data || response || []).map((budget: any) => ({
          id: budget.id,
          fiscalYear: budget.fiscalYear,
          groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
          brandId: budget.brandId,
          brandName: budget.Brand?.name || budget.groupBrand?.name || budget.brandName || 'Unknown',
          totalBudget: budget.totalAmount || budget.totalBudget || 0,
          budgetName: budget.budgetCode || budget.name || budget.budgetName || 'Untitled',
          status: (budget.status || 'DRAFT').toLowerCase()
        }));
        setApiBudgets(budgetList);
      } catch (err: any) {
        if (!ignore) {
          console.error('Failed to fetch budgets:', err);
        }
      } finally {
        if (!ignore) setLoadingBudgets(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  // Filter states - all single choice
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedGroupBrand, setSelectedGroupBrand] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedSeasonGroup, setSelectedSeasonGroup] = useState<any>(null); // null means "All Seasons"

  // Available budgets for dropdown selection - prefer API data
  const allBudgets = apiBudgets.length > 0 ? apiBudgets : (propAvailableBudgets || []);

  // Filter budgets by selected year and group brand for the dropdown
  const availableBudgets = useMemo(() => {
    let filtered = allBudgets;
    if (selectedYear) {
      filtered = filtered.filter((b: any) => b.fiscalYear === selectedYear);
    }
    // Also filter by group brand if selected (match by name since groupBrand field is a name string)
    if (selectedGroupBrand) {
      const groupObj = groupBrandList.find((g: any) => g.id === selectedGroupBrand);
      if (groupObj) {
        filtered = filtered.filter((b: any) =>
          b.groupBrand === selectedGroupBrand ||
          b.groupBrand === groupObj.name ||
          b.brandName === groupObj.name
        );
      }
    }
    return filtered;
  }, [allBudgets, selectedYear, selectedGroupBrand, groupBrandList]);
  // Budget info from allocation
  const [selectedBudgetId, setSelectedBudgetId] = useState<any>(null);
  const [totalBudget, setTotalBudget] = useState(0);

  // Budget name dropdown state
  const [isBudgetNameDropdownOpen, setIsBudgetNameDropdownOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Store allocation data locally to survive the race condition with API fetch
  const [pendingAllocation, setPendingAllocation] = useState<any>(null);
  const [fallbackBudgetName, setFallbackBudgetName] = useState<any>(null);

  // Collapse states for table sections
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, any>>({});
  const [collapsedBrands, setCollapsedBrands] = useState<Record<string, any>>({});

  // Editable allocation values state
  // Structure: { 'brandId-seasonGroup-subSeason': { rex: number, ttp: number } }
  const [allocationValues, setAllocationValues] = useState<Record<string, any>>({});

  // Track which cell is currently being edited (for showing raw value)
  const [editingCell, setEditingCell] = useState<any>(null); // 'brandId-seasonGroup-subSeason-field'

  // Season totals editable state (for season header rows)
  // Structure: { 'brandId-seasonGroup': { rex: number, ttp: number } }
  const [seasonTotalValues, setSeasonTotalValues] = useState<Record<string, any>>({});

  // Brand totals editable state (for total row)
  // Structure: { 'brandId': { rex: number, ttp: number } }
  const [brandTotalValues, setBrandTotalValues] = useState<Record<string, any>>({});

  // Dropdown states
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isGroupBrandDropdownOpen, setIsGroupBrandDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<any>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);
  // Refs
  const budgetNameDropdownRef = useRef<any>(null);
  const yearDropdownRef = useRef<any>(null);
  const groupBrandDropdownRef = useRef<any>(null);
  const brandDropdownRef = useRef<any>(null);
  const seasonDropdownRef = useRef<any>(null);
  const versionDropdownRef = useRef<any>(null);
  // Get brands filtered by selected group brand
  const filteredBrands = useMemo(() => {
    if (!selectedGroupBrand) return brandList;
    return brandList.filter((b: any) => b.groupBrandId === selectedGroupBrand);
  }, [selectedGroupBrand, brandList]);

  // Track if we just applied allocation data to prevent reset (using ref for synchronous access)
  const appliedAllocationRef = useRef(false);

  // Reset brand and budget selection when group brand changes (only if not from allocation)
  useEffect(() => {
    if (!appliedAllocationRef.current) {
      setSelectedBrand(null);
      // Also clear budget selection if it no longer matches the selected group brand
      if (selectedGroupBrand && selectedBudgetId) {
        const groupObj = groupBrandList.find((g: any) => g.id === selectedGroupBrand);
        if (groupObj) {
          const matchingBudget = allBudgets.find((b: any) =>
            b.id === selectedBudgetId && (
              b.groupBrand === selectedGroupBrand ||
              b.groupBrand === groupObj.name ||
              b.brandName === groupObj.name
            )
          );
          if (!matchingBudget) {
            setSelectedBudgetId(null);
            setTotalBudget(0);
            setFallbackBudgetName(null);
          }
        }
      }
    } else {
      // Reset the flag after the brand has been set
      appliedAllocationRef.current = false;
    }
  }, [selectedGroupBrand]);

  // Handle allocation data from Budget Management page
  useEffect(() => {
    if (allocationData) {
      // Store locally so it survives clearing
      setPendingAllocation(allocationData);
      setFallbackBudgetName(allocationData.budgetName);

      // Mark that we're applying allocation data (synchronously)
      appliedAllocationRef.current = true;

      // Set filters from allocation data
      if (allocationData.year) setSelectedYear(allocationData.year);
      if (allocationData.groupBrand) {
        // Resolve group brand name to actual ID from groupBrandList (may not be loaded yet)
        const resolvedGroup = groupBrandList.find((g: any) => g.id === allocationData.groupBrand || g.name === allocationData.groupBrand);
        setSelectedGroupBrand(resolvedGroup?.id || allocationData.groupBrand);
      }
      if (allocationData.totalBudget) setTotalBudget(allocationData.totalBudget);

      // Set budget ID directly if available
      if (allocationData.id) {
        setSelectedBudgetId(allocationData.id);
      }

      // Find and set brand
      if (allocationData.brandName && allocationData.groupBrand) {
        const resolvedGroupForBrand = groupBrandList.find((g: any) => g.id === allocationData.groupBrand || g.name === allocationData.groupBrand);
        const matchingBrand = brandList.find(
          b => b.groupBrandId === (resolvedGroupForBrand?.id || allocationData.groupBrand) && b.name === allocationData.brandName
        );
        if (matchingBrand) setSelectedBrand(matchingBrand.id);
      }

      // Clear allocation data from context
      if (onAllocationDataUsed) onAllocationDataUsed();
    }
  }, [allocationData, onAllocationDataUsed]);

  // When availableBudgets load and we have pending allocation, try to match
  useEffect(() => {
    if (pendingAllocation && availableBudgets.length > 0) {
      // Match by ID first, then by name
      const match = pendingAllocation.id
        ? availableBudgets.find((b: any) => b.id === pendingAllocation.id)
        : availableBudgets.find(
            (b: any) => b.budgetName === pendingAllocation.budgetName &&
              b.fiscalYear === pendingAllocation.year &&
              b.groupBrand === pendingAllocation.groupBrand
          );

      if (match) {
        setSelectedBudgetId(match.id);
        setTotalBudget(match.totalBudget || pendingAllocation.totalBudget);
        // Keep fallbackBudgetName as a reliable backup - don't clear it
      }
      setPendingAllocation(null);
    }
  }, [pendingAllocation, availableBudgets]);

  // Get selected budget object
  const selectedBudget = availableBudgets.find((b: any) => b.id === selectedBudgetId);

  // Fetch planning versions when budget is selected
  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedBudgetId) {
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

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (budgetNameDropdownRef.current && !budgetNameDropdownRef.current.contains(event.target)) {
        setIsBudgetNameDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
      if (groupBrandDropdownRef.current && !groupBrandDropdownRef.current.contains(event.target)) {
        setIsGroupBrandDropdownOpen(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target)) {
        setIsBrandDropdownOpen(false);
      }
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target)) {
        setIsSeasonDropdownOpen(false);
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target)) {
        setIsVersionDropdownOpen(false);
      }
};
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate store percentages from budgets
  const storePercentages = useMemo(() => {
    const totalByStore: Record<string, any> = {};
    let grandTotal = 0;

    STORES.forEach((store: any) => {
      totalByStore[store.id] = 0;
    });

    budgets.forEach((budget: any) => {
      if (budget.fiscalYear === selectedYear) {
        budget.details?.forEach((detail: any) => {
          if (totalByStore[detail.storeId] !== undefined) {
            totalByStore[detail.storeId] += detail.budgetAmount;
            grandTotal += detail.budgetAmount;
          }
        });
      }
    });

    const percentages: Record<string, any> = {};
    STORES.forEach((store: any) => {
      percentages[store.id] = grandTotal > 0 ? Math.round((totalByStore[store.id] / grandTotal) * 100) : 50;
    });

    return percentages;
  }, [budgets, selectedYear]);

  // Get allocation key for state
  const getAllocationKey = (brandId: any, seasonGroup: any, subSeason: any) => {
    return `${brandId}-${seasonGroup}-${subSeason}`;
  };

  // Handle allocation input change
  const handleAllocationChange = (brandId: any, seasonGroup: any, subSeason: any, field: any, value: any) => {
    const key = getAllocationKey(brandId, seasonGroup, subSeason);
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;

    setAllocationValues((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: numValue
      }
    }));
  };

  // Handle season total input change
  const handleSeasonTotalChange = (brandId: any, seasonGroup: any, field: any, value: any) => {
    const key = `${brandId}-${seasonGroup}`;
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;

    setSeasonTotalValues((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: numValue
      }
    }));
  };

  // Handle brand total input change
  const handleBrandTotalChange = (brandId: any, field: any, value: any) => {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;

    setBrandTotalValues((prev: any) => ({
      ...prev,
      [brandId]: {
        ...prev[brandId],
        [field]: numValue
      }
    }));
  };

  // Get season total value (from state or calculated)
  const getSeasonTotalValue = (brandId: any, seasonGroup: any, field: any) => {
    const key = `${brandId}-${seasonGroup}`;
    if (seasonTotalValues[key]?.[field] !== undefined) {
      return seasonTotalValues[key][field];
    }
    return (getSeasonTotals(brandId, seasonGroup) as any)[field];
  };

  // Get brand total value (from state or calculated)
  const getBrandTotalValue = (brandId: any, field: any) => {
    if (brandTotalValues[brandId]?.[field] !== undefined) {
      return brandTotalValues[brandId][field];
    }
    return (getBrandTotals(brandId) as any)[field];
  };

  // Get budget data for a specific brand, season group, and sub-season
  const getBudgetData = (brandId: any, seasonGroupId: any, subSeason: any) => {
    const seasonType = subSeason === 'Pre' ? 'pre' : 'main';
    const seasonId = `${seasonGroupId}_${seasonType}_${selectedYear}`;

    const budget = budgets.find((b: any) =>
      b.groupBrandId === brandId &&
      b.seasonId === seasonId &&
      b.fiscalYear === selectedYear
    );

    // Get values from allocation state first, then fall back to budget data
    const key = getAllocationKey(brandId, seasonGroupId, subSeason);
    const allocatedRex = allocationValues[key]?.rex;
    const allocatedTtp = allocationValues[key]?.ttp;

    if (!budget && allocatedRex === undefined && allocatedTtp === undefined) {
      return { rex: 0, ttp: 0, sum: 0, budget: null };
    }

    const rexDetail = budget?.details?.find((d: any) => d.storeId === 'rex');
    const ttpDetail = budget?.details?.find((d: any) => d.storeId === 'ttp');

    const rex = allocatedRex !== undefined ? allocatedRex : (rexDetail?.budgetAmount || 0);
    const ttp = allocatedTtp !== undefined ? allocatedTtp : (ttpDetail?.budgetAmount || 0);

    return {
      rex,
      ttp,
      sum: rex + ttp,
      budget
    };
  };

  // Get season totals for a brand
  const getSeasonTotals = (brandId: any, seasonGroupId: any) => {
    let rex = 0, ttp = 0, sum = 0;

    SEASON_CONFIG[seasonGroupId]?.subSeasons.forEach((subSeason: any) => {
      const data = getBudgetData(brandId, seasonGroupId, subSeason);
      rex += data.rex;
      ttp += data.ttp;
      sum += data.sum;
    });

    return { rex, ttp, sum };
  };

  // Get brand totals (handles All Seasons when selectedSeasonGroup is null)
  const getBrandTotals = (brandId: any) => {
    if (selectedSeasonGroup) {
      return getSeasonTotals(brandId, selectedSeasonGroup);
    }
    // Sum totals from all season groups
    let rex = 0, ttp = 0, sum = 0;
    SEASON_GROUPS.forEach((sg: any) => {
      const totals = getSeasonTotals(brandId, sg);
      rex += totals.rex;
      ttp += totals.ttp;
      sum += totals.sum;
    });
    return { rex, ttp, sum };
  };

  // Calculate mix percentage
  const calculateMix = (value: any, brandId: any) => {
    const brandTotals = getBrandTotals(brandId);
    if (brandTotals.sum === 0) return 0;
    return Math.round((value / brandTotals.sum) * 100);
  };

  // Toggle group collapse
  const toggleGroupCollapse = (groupId: any) => {
    setCollapsedGroups((prev: any) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Toggle brand collapse
  const toggleBrandCollapse = (brandId: any) => {
    setCollapsedBrands((prev: any) => ({
      ...prev,
      [brandId]: !prev[brandId]
    }));
  };

  // Get brands to display based on filters (resolve group brand by ID or name)
  const displayBrands = useMemo(() => {
    if (selectedBrand) {
      return brandList.filter((b: any) => b.id === selectedBrand);
    }
    if (selectedGroupBrand) {
      const matchedGroup = groupBrandList.find((g: any) => g.id === selectedGroupBrand || g.name === selectedGroupBrand);
      if (matchedGroup) {
        return brandList.filter((b: any) => b.groupBrandId === matchedGroup.id);
      }
      return brandList.filter((b: any) => b.groupBrandId === selectedGroupBrand);
    }
    return brandList;
  }, [selectedBrand, selectedGroupBrand, brandList, groupBrandList]);

  // Get groups to display based on filters (match by ID or name to handle both UUID and name-string values)
  const displayGroups = useMemo(() => {
    if (selectedGroupBrand) {
      const filtered = groupBrandList.filter((g: any) => g.id === selectedGroupBrand || g.name === selectedGroupBrand);
      return filtered.length > 0 ? filtered : groupBrandList;
    }
    return groupBrandList;
  }, [selectedGroupBrand, groupBrandList]);

  // Handle budget selection from dropdown - auto-populate other filters
  const handleBudgetSelect = (budget: any) => {
    if (!budget) {
      setSelectedBudgetId(null);
      setTotalBudget(0);
      setFallbackBudgetName(null);
      return;
    }

    appliedAllocationRef.current = true;
    setSelectedBudgetId(budget.id);
    setTotalBudget(budget.totalBudget);
    setFallbackBudgetName(budget.budgetName);

    // Auto-set other filters based on selected budget
    if (budget.fiscalYear) setSelectedYear(budget.fiscalYear);
    if (budget.groupBrand) {
      // Resolve group brand name to actual ID from groupBrandList
      const resolvedGroup = groupBrandList.find((g: any) => g.id === budget.groupBrand || g.name === budget.groupBrand);
      setSelectedGroupBrand(resolvedGroup?.id || budget.groupBrand);
    }

    // Find matching brand
    if (budget.brandName && budget.groupBrand) {
      const resolvedGroupForBrand = groupBrandList.find((g: any) => g.id === budget.groupBrand || g.name === budget.groupBrand);
      const matchingBrand = brandList.find(
        b => b.groupBrandId === (resolvedGroupForBrand?.id || budget.groupBrand) && b.name === budget.brandName
      );
      if (matchingBrand) {
        setSelectedBrand(matchingBrand.id);
      }
    }

    setIsBudgetNameDropdownOpen(false);
    setFiltersCollapsed(true);
  };

  // Clear budget selection
  const clearBudgetSelection = () => {
    setSelectedBudgetId(null);
    setTotalBudget(0);
    setSelectedVersionId(null);
    setVersions([]);
    setFallbackBudgetName(null);
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

  const selectedVersion = versions.find((v: any) => v.id === selectedVersionId);

  // Get selected group brand object (match by ID or name)
  const selectedGroupBrandObj = groupBrandList.find((b: any) => b.id === selectedGroupBrand || b.name === selectedGroupBrand);
  const selectedBrandObj = brandList.find((b: any) => b.id === selectedBrand);
  return (
    <>
      {/* Header Section */}
      <div className={`backdrop-blur-xl rounded-xl shadow-xl border p-2 md:p-3 mb-2 md:mb-3 relative z-[100] sticky top-0 ${darkMode ? 'bg-[#121212]/95 border-[#2E2E2E]' : 'bg-gradient-to-br from-white to-[rgba(215,183,151,0.1)] border-[#C4B5A5]'}`}>

        <div className="relative">
          {/* Filter Section - Redesigned */}
          <div className={`rounded-xl border shadow-sm ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
            {/* Filter Header - Clickable to toggle collapse */}
            <div
              className={`flex flex-wrap items-center justify-between px-3 md:px-4 py-0.5 border-b cursor-pointer select-none transition-colors ${darkMode ? 'bg-[#1A1A1A]/50 border-[#2E2E2E] hover:bg-[#1A1A1A]' : 'bg-gradient-to-r from-[rgba(215,183,151,0.05)] to-[rgba(215,183,151,0.1)] border-[#C4B5A5] hover:bg-[rgba(215,183,151,0.15)]'}`}
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            >
              <div className="flex items-center gap-2">
                <ChevronRight size={14} className={`transition-transform duration-200 ${!filtersCollapsed ? 'rotate-90' : ''} ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`} />
                <Filter size={14} className={darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                <span className={`text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>{t('common.filters')}</span>
                {filtersCollapsed && (
                  <div className="flex items-center gap-1.5 ml-1 flex-wrap">
                    {selectedBudget && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'}`}>
                        {selectedBudget.budgetName}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-['JetBrains_Mono'] ${darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-gray-100 text-[#666666]'}`}>
                      FY{selectedYear}
                    </span>
                    {selectedGroupBrandObj && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.15)] text-[#6B4D30]'}`}>
                        {selectedGroupBrandObj.name}
                      </span>
                    )}
                    {selectedVersion?.isFinal && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#D7B797] text-[#0A0A0A] rounded">FINAL</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {!filtersCollapsed && (selectedBudgetId || selectedGroupBrand || selectedBrand || selectedVersionId) && (
                  <button
                    onClick={() => {
                      clearBudgetSelection();
                      setSelectedGroupBrand(null);
                      setSelectedBrand(null);
                      setSelectedVersionId(null);
                      setVersions([]);
                    }}
                    className={`flex items-center gap-1 text-xs transition-colors ${darkMode ? 'text-[#999999] hover:text-[#D7B797]' : 'text-[#666666] hover:text-[#6B4D30]'}`}
                  >
                    <X size={12} />
                    {t('common.clearAllFilters')}
                  </button>
                )}
              </div>
            </div>

            {/* Filter Controls - Collapsible */}
            <div className={`p-3 relative z-[100] ${filtersCollapsed ? 'hidden' : ''}`}>
              {/* Mobile Filter Button */}
              {isMobile && (
                <button
                  onClick={openFilter}
                  className={`flex items-center gap-1.5 px-3 py-0.5 border rounded-lg text-xs font-medium ${
                    darkMode
                      ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#D7B797]'
                      : 'bg-white border-[#C4B5A5] text-[#6B4D30]'
                  }`}
                >
                  <Filter size={12} />
                  {t('common.filters')}
                  {(selectedYear || selectedGroupBrand || selectedBrand || selectedSeasonGroup || selectedBudgetId) && (
                    <span className="w-2 h-2 rounded-full bg-[#D7B797]" />
                  )}
                </button>
              )}
              {/* Desktop Filters */}
              {!isMobile && <div className="flex flex-wrap items-end gap-3">
                {/* Budget Name Dropdown */}
                <div className="relative min-w-[200px]" ref={budgetNameDropdownRef}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                    {t('budget.budgetName')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBudgetNameDropdownOpen(!isBudgetNameDropdownOpen);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-0.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${selectedBudget
                      ? darkMode
                        ? 'bg-[rgba(18,119,73,0.15)] border-[#127749] text-[#2A9E6A] hover:border-[#2A9E6A]'
                        : 'bg-[rgba(18,119,73,0.1)] border-[#127749] text-[#127749] hover:border-[#2A9E6A]'
                      : darkMode
                        ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:border-[rgba(215,183,151,0.25)] hover:bg-[rgba(215,183,151,0.08)]'
                        : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className={selectedBudget ? 'text-[#127749]' : darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                      <span className="truncate">{selectedBudget?.budgetName || fallbackBudgetName || t('planning.selectBudget')}</span>
                    </div>
                    <ChevronDown size={12} className={`flex-shrink-0 transition-transform duration-200 ${isBudgetNameDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isBudgetNameDropdownOpen && (
                    <div className={`absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                      <div className={`p-2 border-b ${darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-[#D4C8BB] bg-[rgba(160,120,75,0.08)]'}`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('budget.title')}</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto py-0.5">
                        {/* Loading state */}
                        {loadingBudgets && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#D7B797]/30 border-t-[#D7B797] rounded-full animate-spin" />
                            <span className={`ml-2 text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('common.loading')}...</span>
                          </div>
                        )}
                        {/* Empty state */}
                        {!loadingBudgets && availableBudgets.length === 0 && (
                          <div className={`px-4 py-6 text-center text-sm ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                            {t('budget.noMatchingBudgets')}
                          </div>
                        )}
                        {/* Clear Selection Option */}
                        {!loadingBudgets && availableBudgets.length > 0 && (
                        <div
                          onClick={() => handleBudgetSelect(null)}
                          className={`px-4 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${!selectedBudgetId
                            ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#999999]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#666666]'
                            }`}
                        >
                          <span className="font-medium">{t('planning.selectBudget')}</span>
                          {!selectedBudgetId && <Check size={14} className="text-[#127749]" />}
                        </div>
                        )}
                        {!loadingBudgets && availableBudgets.map((budget: any) => (
                          <div
                            key={budget.id}
                            onClick={() => handleBudgetSelect(budget)}
                            className={`px-4 py-0.5 cursor-pointer transition-colors border-t ${darkMode ? 'border-[#2E2E2E]/50' : 'border-[#D4C8BB]'} ${selectedBudgetId === budget.id
                              ? darkMode ? 'bg-[rgba(18,119,73,0.15)]' : 'bg-[rgba(18,119,73,0.1)]'
                              : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <div className={`font-semibold text-sm font-['Montserrat'] ${selectedBudgetId === budget.id ? 'text-[#127749]' : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                                  {budget.budgetName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>FY{budget.fiscalYear}</span>
                                  <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]/30'}>•</span>
                                  <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{budget.brandName}</span>
                                  <span className={darkMode ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]/30'}>•</span>
                                  <span className="text-xs font-medium font-['JetBrains_Mono'] text-[#127749]">{formatCurrency(budget.totalBudget)}</span>
                                </div>
                              </div>
                              {selectedBudgetId === budget.id && (
                                <div className="w-5 h-5 rounded-full bg-[#127749] flex items-center justify-center flex-shrink-0 ml-2">
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Show message when no budgets available after loading */}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className={`h-10 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`}></div>

                {/* Year Filter */}
                <div className="relative min-w-[120px]" ref={yearDropdownRef}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                    {t('budget.fiscalYear')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearDropdownOpen(!isYearDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-0.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${darkMode
                      ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:border-[rgba(215,183,151,0.25)] hover:bg-[rgba(215,183,151,0.08)]'
                      : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                      <span className="font-['JetBrains_Mono']">FY {selectedYear}</span>
                    </div>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isYearDropdownOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                      {YEARS.map((year: any) => (
                        <div
                          key={year}
                          onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                          className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedYear === year
                            ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'
                            }`}
                        >
                          <span className="font-medium font-['JetBrains_Mono']">FY {year}</span>
                          {selectedYear === year && <Check size={14} className="text-[#127749]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group Brand Filter */}
                <div className="relative min-w-[140px]" ref={groupBrandDropdownRef}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                    {t('budget.groupBrand')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGroupBrandDropdownOpen(!isGroupBrandDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-0.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${selectedGroupBrand
                      ? darkMode
                        ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                        : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'
                      : darkMode
                        ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:border-[rgba(215,183,151,0.25)] hover:bg-[rgba(215,183,151,0.08)]'
                        : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={14} className={selectedGroupBrand ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                      <span className="truncate">{selectedGroupBrandObj?.name || t('budget.allGroupBrands')}</span>
                    </div>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${isGroupBrandDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isGroupBrandDropdownOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                      <div
                        onClick={() => { setSelectedGroupBrand(null); setIsGroupBrandDropdownOpen(false); }}
                        className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedGroupBrand === null
                          ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                          : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'
                          }`}
                      >
                        <span className="font-medium">{t('budget.allGroupBrands')}</span>
                        {selectedGroupBrand === null && <Check size={14} className="text-[#127749]" />}
                      </div>
                      {groupBrandList.map((group: any) => (
                        <div
                          key={group.id}
                          onClick={() => { setSelectedGroupBrand(group.id); setIsGroupBrandDropdownOpen(false); }}
                          className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedGroupBrand === group.id
                            ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'
                            }`}
                        >
                          <span className="font-medium">{group.name}</span>
                          {selectedGroupBrand === group.id && <Check size={14} className="text-[#127749]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand Filter */}
                <div className="relative min-w-[140px]" ref={brandDropdownRef}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                    {t('budget.brand')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBrandDropdownOpen(!isBrandDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-0.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${selectedBrand
                      ? darkMode
                        ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                        : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'
                      : darkMode
                        ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:border-[rgba(215,183,151,0.25)] hover:bg-[rgba(215,183,151,0.08)]'
                        : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={14} className={selectedBrand ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                      <span className="truncate">{selectedBrandObj?.name || t('budget.allBrands')}</span>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isBrandDropdownOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden max-h-60 overflow-y-auto ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                      <div
                        onClick={() => { setSelectedBrand(null); setIsBrandDropdownOpen(false); }}
                        className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedBrand === null
                          ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                          : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'
                          }`}
                      >
                        <span className="font-medium">{t('budget.allBrands')}</span>
                        {selectedBrand === null && <Check size={14} className="text-[#127749]" />}
                      </div>
                      {filteredBrands.map((brand: any) => (
                        <div
                          key={brand.id}
                          onClick={() => { setSelectedBrand(brand.id); setIsBrandDropdownOpen(false); }}
                          className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedBrand === brand.id
                            ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'
                            }`}
                        >
                          <span className="font-medium">{brand.name}</span>
                          {selectedBrand === brand.id && <Check size={14} className="text-[#127749]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Season Group Filter */}
                <div className="relative min-w-[140px]" ref={seasonDropdownRef}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                    {t('planning.seasonGroup')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSeasonDropdownOpen(!isSeasonDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsVersionDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-0.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${selectedSeasonGroup
                      ? selectedSeasonGroup === 'SS'
                        ? darkMode
                          ? 'bg-[rgba(227,179,65,0.15)] border-[#E3B341] text-[#E3B341] hover:border-[#E3B341]'
                          : 'bg-[rgba(227,179,65,0.15)] border-[#E3B341] text-[#6B4D30] hover:border-[#D7B797]'
                        : darkMode
                          ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:border-[rgba(215,183,151,0.4)]'
                          : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'
                      : darkMode
                        ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:border-[rgba(215,183,151,0.25)] hover:bg-[rgba(215,183,151,0.08)]'
                        : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedSeasonGroup === 'SS' ? <Sun size={14} className="text-[#E3B341]" /> : selectedSeasonGroup === 'FW' ? <Snowflake size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} /> : <Filter size={14} className={darkMode ? 'text-[#999999]' : 'text-[#666666]'} />}
                      <span>{selectedSeasonGroup ? (SEASON_CONFIG[selectedSeasonGroup]?.name || selectedSeasonGroup) : t('planning.allSeasonGroups')}</span>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSeasonDropdownOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-[9999] overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                      <div
                        onClick={() => { setSelectedSeasonGroup(null); setIsSeasonDropdownOpen(false); }}
                        className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedSeasonGroup === null
                          ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                          : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Filter size={14} className={darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                          <span className="font-medium">{t('planning.allSeasonGroups')}</span>
                        </div>
                        {selectedSeasonGroup === null && <Check size={14} className="text-[#127749]" />}
                      </div>
                      {SEASON_GROUPS.map((sg: any) => (
                        <div
                          key={sg}
                          onClick={() => { setSelectedSeasonGroup(sg); setIsSeasonDropdownOpen(false); }}
                          className={`px-3 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedSeasonGroup === sg
                            ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {sg === 'SS' ? <Sun size={14} className="text-[#E3B341]" /> : <Snowflake size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />}
                            <span className="font-medium">{SEASON_CONFIG[sg]?.name || sg}</span>
                          </div>
                          {selectedSeasonGroup === sg && <Check size={14} className="text-[#127749]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider before Version */}
                {selectedBudgetId && (
                  <div className={`h-10 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E]/20'}`}></div>
                )}

                {/* Version Filter */}
                {selectedBudgetId && (
                <div className="relative min-w-[200px]" ref={versionDropdownRef}>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                    Version
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVersionDropdownOpen(!isVersionDropdownOpen);
                      setIsBudgetNameDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                      setIsGroupBrandDropdownOpen(false);
                      setIsBrandDropdownOpen(false);
                      setIsSeasonDropdownOpen(false);
                    }}
                    disabled={versions.length === 0 && !loadingVersions}
                    className={`w-full px-3 py-0.5 border rounded-lg font-medium cursor-pointer flex items-center justify-between text-sm transition-all ${
                      versions.length === 0 && !loadingVersions
                        ? darkMode
                          ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#666666] cursor-not-allowed opacity-50'
                          : 'bg-[#F2F2F2] border-[#C4B5A5] text-[#999999] cursor-not-allowed opacity-50'
                        : selectedVersion
                          ? selectedVersion.isFinal
                            ? darkMode
                              ? 'bg-[rgba(160,120,75,0.18)] border-[#D7B797] text-[#D7B797]'
                              : 'bg-[rgba(215,183,151,0.2)] border-[#D7B797] text-[#6B4D30]'
                            : darkMode
                              ? 'bg-[rgba(18,119,73,0.15)] border-[#127749] text-[#2A9E6A]'
                              : 'bg-[rgba(18,119,73,0.1)] border-[#127749] text-[#127749]'
                          : darkMode
                            ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] hover:border-[rgba(215,183,151,0.25)] hover:bg-[rgba(215,183,151,0.08)]'
                            : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {selectedVersion?.isFinal ? (
                        <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />
                      ) : (
                        <Sparkles size={14} className={selectedVersion ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                      )}
                      <span className="truncate">
                        {loadingVersions ? 'Loading...' : selectedVersion ? selectedVersion.name : 'Select Version'}
                      </span>
                      {selectedVersion?.isFinal && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#D7B797] text-[#0A0A0A] rounded flex-shrink-0">FINAL</span>
                      )}
                    </div>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isVersionDropdownOpen && (
                    <div className={`absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden min-w-[300px] ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                      <div className={`p-2 border-b ${darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-[#D4C8BB] bg-[rgba(160,120,75,0.08)]'}`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.planningVersions')}</span>
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
                            onClick={() => { setSelectedVersionId(version.id); setIsVersionDropdownOpen(false); }}
                            className={`px-4 py-0.5 cursor-pointer transition-colors border-t ${darkMode ? 'border-[#2E2E2E]/50' : 'border-[#D4C8BB]'} ${
                              selectedVersionId === version.id
                                ? darkMode ? 'bg-[rgba(18,119,73,0.15)]' : 'bg-[rgba(18,119,73,0.1)]'
                                : darkMode ? 'hover:bg-[rgba(215,183,151,0.08)]' : 'hover:bg-[rgba(160,120,75,0.18)]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {version.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797] flex-shrink-0' : 'text-[#6B4D30] fill-[#6B4D30] flex-shrink-0'} />}
                                <span className={`font-semibold text-sm font-['Montserrat'] truncate ${selectedVersionId === version.id ? 'text-[#127749]' : darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
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
                                {selectedVersionId === version.id && <Check size={14} className="text-[#127749]" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                )}

              </div>}
            </div>





          </div>
        </div>
      </div>
      {/* Budget Table - Collapsible by Group Brand and Brand */}
      {(selectedBudget || selectedBudgetId) && (
        <div className="space-y-2 relative z-[10]">
          {displayGroups.map((group: any) => {
            const groupBrands = displayBrands.filter((b: any) => b.groupBrandId === group.id);
            const isGroupCollapsed = collapsedGroups[group.id];

            // Calculate group totals
            const groupTotals = groupBrands.reduce((acc: any, brand: any) => {
              const brandTotals = getBrandTotals(brand.id);
              return {
                rex: acc.rex + brandTotals.rex,
                ttp: acc.ttp + brandTotals.ttp,
                sum: acc.sum + brandTotals.sum
              };
            }, { rex: 0, ttp: 0, sum: 0 });

            return (
              <div key={group.id} className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                {/* Group Header - Collapsible with Total Budget */}
                <div
                  onClick={() => !selectedGroupBrand && toggleGroupCollapse(group.id)}
                  className={`px-3 py-0.5 bg-gradient-to-r ${group.color} border-b border-[#C4B5A5] flex flex-col md:flex-row md:items-center justify-between gap-2 ${!selectedGroupBrand ? 'cursor-pointer hover:opacity-90' : ''}`}
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    {!selectedGroupBrand && (
                      <ChevronRight
                        size={20}
                        className={`text-white transition-transform duration-200 ${!isGroupCollapsed ? 'rotate-90' : ''}`}
                      />
                    )}
                    <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white text-xs font-bold font-['Montserrat'] shadow-sm">
                      {group.id}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white font-['Montserrat']">{group.name}</div>
                      <div className="text-[10px] text-white/80 font-['JetBrains_Mono']">
                        {groupBrands.length} brand{groupBrands.length !== 1 ? 's' : ''} • {selectedSeasonGroup ? SEASON_CONFIG[selectedSeasonGroup]?.name : t('planning.allSeasonGroups')} {selectedYear}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Budget Allocated - show when budget is selected */}
                    {totalBudget > 0 && (selectedBudget || selectedBudgetId) && (
                      <div className="flex items-center gap-2 px-3 py-0.5 bg-white/15 rounded-lg backdrop-blur-sm">
                        <div className="text-right">
                          <div className="text-[10px] text-white/70 font-medium font-['Montserrat']">{selectedBudget?.budgetName || fallbackBudgetName}</div>
                          <div className="text-xs font-bold text-white font-['JetBrains_Mono']">{t('skuProposal.budget')}: {formatCurrency(totalBudget)}</div>
                        </div>
                      </div>
                    )}
                    {/* Group Total */}
                    <div className="text-right">
                      <div className="text-xs text-white/80 font-['Montserrat']">{t('skuProposal.totalPlanned')}</div>
                      <div className="font-bold text-sm text-white font-['JetBrains_Mono']">
                        {formatCurrency(groupTotals.sum)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content - Collapsible */}
                {!isGroupCollapsed && (
                  <div>
                    {groupBrands.map((brand: any) => {
                      const isBrandCollapsed = collapsedBrands[brand.id];
                      const brandTotals = getBrandTotals(brand.id);

                      return (
                        <div key={brand.id} className={`last:border-b-0 ${darkMode ? 'border-b border-[#2E2E2E]' : 'border-b border-[#D4C8BB]'}`}>
                          {/* Brand Header - Collapsible when multiple brands */}
                          {(!selectedBrand && groupBrands.length > 1) && (
                            <div
                              onClick={() => toggleBrandCollapse(brand.id)}
                              className={`px-4 py-0.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-0 cursor-pointer transition-colors ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] hover:bg-[rgba(215,183,151,0.08)]' : 'bg-gradient-to-r from-[rgba(215,183,151,0.05)] to-[rgba(215,183,151,0.1)] border-[#C4B5A5] hover:bg-[rgba(160,120,75,0.18)]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <ChevronRight
                                  size={18}
                                  className={`transition-transform duration-200 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'} ${!isBrandCollapsed ? 'rotate-90' : ''}`}
                                />
                                <Tag size={16} className={darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
                                <span className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>{brand.name}</span>
                              </div>
                              <div className="flex items-center gap-2 md:gap-4">
                                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                  <div className="text-right">
                                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.rex')}: </span>
                                    <span className={`text-xs md:text-sm font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(brandTotals.rex)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.ttp')}: </span>
                                    <span className={`text-xs md:text-sm font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(brandTotals.ttp)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.total')}: </span>
                                    <span className={`font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(brandTotals.sum)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Brand Table Content */}
                          {(!isBrandCollapsed || selectedBrand || groupBrands.length === 1) && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className={darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(215,183,151,0.2)]'}>
                                    <th className={`px-3 py-0.5 text-left text-xs font-semibold w-44 font-['Montserrat'] ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
                                      <div className="flex items-center gap-2">
                                        <TrendingUp size={14} />
                                        {selectedBrand || groupBrands.length === 1 ? brand.name : ''} FY {selectedYear}
                                      </div>
                                    </th>
                                    {STORES.map((store: any) => (
                                      <th key={store.id} className={`px-2 py-0.5 text-center text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-white' : 'text-[#333333]'}`}>
                                        <div>{store.code} <span className={`font-normal font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>({storePercentages[store.id]}%)</span></div>
                                      </th>
                                    ))}
                                    <th className={`px-2 py-0.5 text-center text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-white' : 'text-[#333333]'}`}>{t('planning.totalValue')}</th>
                                    <th className={`px-2 py-0.5 text-center text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-white' : 'text-[#333333]'}`}>% MIX</th>
                                    <th className={`px-2 py-0.5 text-center text-xs font-semibold w-20 font-['Montserrat'] ${darkMode ? 'text-white' : 'text-[#333333]'}`}>{t('common.actions')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* Render seasons based on selection */}
                                  {(selectedSeasonGroup ? [selectedSeasonGroup] : SEASON_GROUPS).map((seasonGroup: any) => (
                                    <Fragment key={`${brand.id}-${seasonGroup}`}>
                                      {/* Season Group Header */}
                                      <tr className={darkMode ? 'bg-[#1A1A1A] border-b border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.12)] border-b border-[#C4B5A5]'}>
                                        <td className="px-3 py-0.5">
                                          <div className="flex items-center gap-2">
                                            <div className={`w-1 h-3.5 rounded-full ${seasonGroup === 'SS' ? 'bg-[#E3B341]' : 'bg-[#D7B797]'}`}></div>
                                            {seasonGroup === 'SS' ? (
                                              <Sun size={14} className="text-[#E3B341]" />
                                            ) : (
                                              <Snowflake size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                                            )}
                                            <span className={`font-semibold text-sm font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>{SEASON_CONFIG[seasonGroup]?.name}</span>
                                          </div>
                                        </td>
                                        <td className="px-1.5 py-0.5 text-center">
                                          <input
                                            type="text"
                                            value={formatCurrency(getSeasonTotalValue(brand.id, seasonGroup, 'rex') || 0)}
                                            readOnly
                                            tabIndex={-1}
                                            className={`w-full px-1.5 py-0.5 text-center border rounded text-xs font-semibold font-['JetBrains_Mono'] cursor-default ${darkMode
                                              ? 'border-[#2E2E2E] text-[#F2F2F2] bg-[#121212]'
                                              : 'border-[#C4B5A5] text-[#0A0A0A] bg-[rgba(160,120,75,0.12)]'
                                            }`}
                                          />
                                        </td>
                                        <td className="px-1.5 py-0.5 text-center">
                                          <input
                                            type="text"
                                            value={formatCurrency(getSeasonTotalValue(brand.id, seasonGroup, 'ttp') || 0)}
                                            readOnly
                                            tabIndex={-1}
                                            className={`w-full px-1.5 py-0.5 text-center border rounded text-xs font-semibold font-['JetBrains_Mono'] cursor-default ${darkMode
                                              ? 'border-[#2E2E2E] text-[#F2F2F2] bg-[#121212]'
                                              : 'border-[#C4B5A5] text-[#0A0A0A] bg-[rgba(160,120,75,0.12)]'
                                            }`}
                                          />
                                        </td>
                                        <td className="px-1.5 py-0.5 text-center">
                                          <div className={`px-1.5 py-0.5 border rounded font-bold text-xs font-['JetBrains_Mono'] ${darkMode
                                            ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2]'
                                            : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#0A0A0A]'
                                          }`}>
                                            {formatCurrency(getSeasonTotalValue(brand.id, seasonGroup, 'rex') + getSeasonTotalValue(brand.id, seasonGroup, 'ttp'))}
                                          </div>
                                        </td>
                                        <td className={`px-2 py-0.5 text-center text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                                          {selectedSeasonGroup ? '100%' : `${calculateMix(getSeasonTotalValue(brand.id, seasonGroup, 'rex') + getSeasonTotalValue(brand.id, seasonGroup, 'ttp'), brand.id)}%`}
                                        </td>
                                        <td className="px-2 py-0.5"></td>
                                      </tr>

                                      {/* Sub-Season Rows */}
                                      {SEASON_CONFIG[seasonGroup]?.subSeasons.map((subSeason: any) => {
                                        const data = getBudgetData(brand.id, seasonGroup, subSeason);
                                        const mix = calculateMix(data.sum, brand.id);

                                        return (
                                          <tr key={`${brand.id}-${seasonGroup}-${subSeason}`} className={`border-b transition-colors ${darkMode ? 'border-[#2E2E2E] hover:bg-[rgba(215,183,151,0.08)]' : 'border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.12)]'}`}>
                                            <td className="px-3 py-0.5 pl-10">
                                              <span className={`text-xs font-medium ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{subSeason}</span>
                                            </td>
                                            <td className="px-1.5 py-0.5 text-center">
                                              <input
                                                type="text"
                                                value={editingCell === `${brand.id}-${seasonGroup}-${subSeason}-rex` ? (data.rex || '') : formatCurrency(data.rex)}
                                                onChange={(e) => handleAllocationChange(brand.id, seasonGroup, subSeason, 'rex', e.target.value)}
                                                onFocus={() => setEditingCell(`${brand.id}-${seasonGroup}-${subSeason}-rex`)}
                                                onBlur={() => setEditingCell(null)}
                                                className={`w-full px-1.5 py-0.5 text-center border rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D7B797] focus:border-[#D7B797] font-medium font-['JetBrains_Mono'] transition-colors ${darkMode
                                                  ? 'border-[#2E2E2E] text-[#F2F2F2] bg-[#121212] hover:border-[rgba(215,183,151,0.25)]'
                                                  : 'border-[#C4B5A5] text-[#0A0A0A] bg-white hover:border-[rgba(215,183,151,0.4)]'
                                                }`}
                                                placeholder="0"
                                              />
                                            </td>
                                            <td className="px-1.5 py-0.5 text-center">
                                              <input
                                                type="text"
                                                value={editingCell === `${brand.id}-${seasonGroup}-${subSeason}-ttp` ? (data.ttp || '') : formatCurrency(data.ttp)}
                                                onChange={(e) => handleAllocationChange(brand.id, seasonGroup, subSeason, 'ttp', e.target.value)}
                                                onFocus={() => setEditingCell(`${brand.id}-${seasonGroup}-${subSeason}-ttp`)}
                                                onBlur={() => setEditingCell(null)}
                                                className={`w-full px-1.5 py-0.5 text-center border rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D7B797] focus:border-[#D7B797] font-medium font-['JetBrains_Mono'] transition-colors ${darkMode
                                                  ? 'border-[#2E2E2E] text-[#F2F2F2] bg-[#121212] hover:border-[rgba(215,183,151,0.25)]'
                                                  : 'border-[#C4B5A5] text-[#0A0A0A] bg-white hover:border-[rgba(215,183,151,0.4)]'
                                                }`}
                                                placeholder="0"
                                              />
                                            </td>
                                            <td className="px-1.5 py-0.5 text-center">
                                              <div className={`px-1.5 py-0.5 border rounded font-semibold text-xs font-['JetBrains_Mono'] ${darkMode
                                                ? 'bg-[rgba(18,119,73,0.15)] border-[#127749] text-[#2A9E6A]'
                                                : 'bg-[rgba(18,119,73,0.1)] border-[#127749] text-[#127749]'
                                              }`}>
                                                {formatCurrency(data.sum)}
                                              </div>
                                            </td>
                                            <td className={`px-2 py-0.5 text-center text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                                              {mix}%
                                            </td>
                                            <td className="px-1.5 py-0.5 text-center">
                                              <button
                                                onClick={() => {
                                                  if (onOpenOtbAnalysis) {
                                                    onOpenOtbAnalysis({
                                                      budgetId: selectedBudgetId,
                                                      budgetName: selectedBudget?.budgetName || fallbackBudgetName || null,
                                                      fiscalYear: selectedBudget?.fiscalYear || selectedYear,
                                                      brandName: selectedBudget?.brandName || brand?.name,
                                                      groupBrand: selectedBudget?.groupBrand || brand?.groupBrand,
                                                      totalBudget: selectedBudget?.totalBudget || 0,
                                                      status: selectedBudget?.status,
                                                      seasonGroup,
                                                      season: subSeason,
                                                      rex: data.rex,
                                                      ttp: data.ttp
                                                    });
                                                  }
                                                }}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#127749] hover:bg-[#0d5a37] text-white rounded-md font-medium text-xs font-['Montserrat'] transition-colors"
                                              >
                                                <Edit size={14} />
                                                {t('budget.allocateOTB')}
                                              </button>

                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </Fragment>
                                  ))}

                                  {/* Total Row */}
                                  <tr className={`border-t-2 ${darkMode ? 'bg-[rgba(18,119,73,0.15)] border-[#127749]' : 'bg-[rgba(18,119,73,0.1)] border-[#127749]'}`}>
                                    <td className="px-3 py-0.5">
                                      <span className={`font-bold text-xs font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>TOTAL</span>
                                    </td>
                                    <td className="px-1.5 py-0.5 text-center">
                                      <input
                                        type="text"
                                        value={formatCurrency(getBrandTotalValue(brand.id, 'rex') || 0)}
                                        readOnly
                                        tabIndex={-1}
                                        className={`w-full px-1.5 py-0.5 text-center border rounded text-xs font-bold font-['JetBrains_Mono'] cursor-default ${darkMode
                                          ? 'border-[#127749] text-[#2A9E6A] bg-[rgba(18,119,73,0.2)]'
                                          : 'border-[#127749] text-[#127749] bg-[rgba(18,119,73,0.15)]'
                                        }`}
                                      />
                                    </td>

                                    <td className="px-1.5 py-0.5 text-center">
                                      <input
                                        type="text"
                                        value={formatCurrency(getBrandTotalValue(brand.id, 'ttp') || 0)}
                                        readOnly
                                        tabIndex={-1}
                                        className={`w-full px-1.5 py-0.5 text-center border rounded text-xs font-bold font-['JetBrains_Mono'] cursor-default ${darkMode
                                          ? 'border-[#127749] text-[#2A9E6A] bg-[rgba(18,119,73,0.2)]'
                                          : 'border-[#127749] text-[#127749] bg-[rgba(18,119,73,0.15)]'
                                        }`}
                                      />
                                    </td>

                                    <td className="px-1.5 py-0.5 text-center">
                                      <div className={`px-2 py-0.5 border rounded font-bold text-sm font-['JetBrains_Mono'] ${darkMode
                                        ? 'bg-[rgba(18,119,73,0.25)] border-[#2A9E6A] text-[#2A9E6A]'
                                        : 'bg-[rgba(18,119,73,0.2)] border-[#127749] text-[#127749]'
                                      }`}>
                                        {formatCurrency(getBrandTotalValue(brand.id, 'rex') + getBrandTotalValue(brand.id, 'ttp'))}
                                      </div>
                                    </td>
                                    <td className={`px-2 py-0.5 text-center text-xs font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>100%</td>
                                    <td className="px-2 py-0.5"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Category Breakdown Table - removed per customer request */}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilter}
        filters={[
          {
            key: 'budgetName',
            label: t('budget.budgetName'),
            type: 'single' as const,
            options: availableBudgets.map((b: any) => ({ label: b.budgetName, value: b.id })),
          },
          {
            key: 'year',
            label: t('budget.fiscalYear'),
            type: 'single' as const,
            options: YEARS.map((y: any) => ({ label: `FY${y}`, value: String(y) })),
          },
          {
            key: 'groupBrand',
            label: t('budget.groupBrand'),
            type: 'single' as const,
            options: groupBrandList.map((g: any) => ({ label: g.name, value: g.id })),
          },
          {
            key: 'brand',
            label: t('budget.brand'),
            type: 'single' as const,
            options: filteredBrands.map((b: any) => ({ label: b.name, value: b.id })),
          },
          {
            key: 'seasonGroup',
            label: t('planning.seasonGroup'),
            type: 'single' as const,
            options: SEASON_GROUPS.map((sg: any) => ({ label: SEASON_CONFIG[sg]?.name || sg, value: sg })),
          },
          ...(selectedBudgetId && versions.length > 0 ? [{
            key: 'version',
            label: 'Version',
            type: 'single' as const,
            options: versions.map((v: any) => ({ label: `${v.name}${v.isFinal ? ' (FINAL)' : ''}`, value: v.id })),
          }] : []),
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          if (mobileFilterValues.budgetName) {
            const budget = availableBudgets.find((b: any) => b.id === mobileFilterValues.budgetName);
            if (budget) handleBudgetSelect(budget);
          } else {
            clearBudgetSelection();
          }
          setSelectedYear(mobileFilterValues.year ? Number(mobileFilterValues.year) : 2025);
          setSelectedGroupBrand((mobileFilterValues.groupBrand as string) || null);
          setSelectedBrand((mobileFilterValues.brand as string) || null);
          setSelectedSeasonGroup((mobileFilterValues.seasonGroup as string) || null);
          if (mobileFilterValues.version) setSelectedVersionId(mobileFilterValues.version as string);
        }}
        onReset={() => {
          setMobileFilterValues({});
          clearBudgetSelection();
          setSelectedYear(2025);
          setSelectedGroupBrand(null);
          setSelectedBrand(null);
          setSelectedSeasonGroup(null);
          setSelectedVersionId(null);
          setVersions([]);
        }}
      />
    </>
  );
};

export default BudgetAllocateScreen;
