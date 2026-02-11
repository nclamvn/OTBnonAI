'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  Filter, ChevronDown, Package, Image as ImageIcon, Pencil, X, Plus, Trash2, Ruler,
  Star, Layers, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils';
import { budgetService, masterDataService, proposalService } from '../../../services';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { FilterBottomSheet, FilterChips, useBottomSheet } from '@/components/mobile';
import { SlidersHorizontal } from 'lucide-react';

const SEASON_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'SS', label: 'Spring Summer' },
  { id: 'FW', label: 'Fall Winter' }
];

const SEASONS = [
  { id: 'all', label: 'All' },
  { id: 'Pre', label: 'Pre' },
  { id: 'Main/Show', label: 'Main/Show' }
];

// DAFC Design System card backgrounds - warm gold tints
const CARD_BG_CLASSES = [
  { light: 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.3)]', dark: 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.2)]' },
  { light: 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.35)]', dark: 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.25)]' },
  { light: 'bg-[rgba(18,119,73,0.08)] border-[rgba(18,119,73,0.2)]', dark: 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)]' },
  { light: 'bg-[rgba(215,183,151,0.12)] border-[rgba(215,183,151,0.32)]', dark: 'bg-[rgba(215,183,151,0.06)] border-[rgba(215,183,151,0.18)]' },
  { light: 'bg-[rgba(18,119,73,0.06)] border-[rgba(18,119,73,0.18)]', dark: 'bg-[rgba(42,158,106,0.08)] border-[rgba(42,158,106,0.2)]' },
  { light: 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)]', dark: 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.15)]' }
];

const SKU_VERSIONS = [
  { id: 'v1', name: 'Version 1', createdAt: '2025-01-15', isFinal: false },
  { id: 'v2', name: 'Version 2', createdAt: '2025-01-20', isFinal: false },
  { id: 'v3', name: 'Version 3', createdAt: '2025-01-25', isFinal: true },
];

const SIZING_CHOICES = [
  { id: 'choice-a', name: 'Choice A', isFinal: true },
  { id: 'choice-b', name: 'Choice B', isFinal: false },
  { id: 'choice-c', name: 'Choice C', isFinal: false },
];

const SKUProposalScreen = ({ skuContext, onContextUsed, darkMode = false }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});
  // SKU catalog and proposal data from API
  const [skuCatalog, setSkuCatalog] = useState<any[]>([]);
  const [skuDataLoading, setSkuDataLoading] = useState(true);

  // Master data for filters (genders, categories) and stores
  const [masterGenders, setMasterGenders] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Fetch master data for filters + stores
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [gendersRes, categoriesRes, storesRes] = await Promise.all([
          masterDataService.getGenders().catch(() => []),
          masterDataService.getCategories().catch(() => []),
          masterDataService.getStores().catch(() => [])
        ]);
        const genders = Array.isArray(gendersRes) ? gendersRes : (gendersRes?.data || []);
        setMasterGenders(genders.map((g: any) => (g.name || g.code || '').toLowerCase()));
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        setMasterCategories(categories);
        const storeList = Array.isArray(storesRes) ? storesRes : (storesRes?.data || []);
        setStores(storeList.length > 0 ? storeList : [{ code: 'REX', name: 'REX' }, { code: 'TTP', name: 'TTP' }]);
      } catch (err: any) {
        console.error('Failed to fetch master data:', err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch SKU catalog and proposals from API
  useEffect(() => {
    const fetchSkuData = async () => {
      setSkuDataLoading(true);
      try {
        const [catalogRes, proposalsRes] = await Promise.all([
          masterDataService.getSkuCatalog().catch(() => ({ data: [] })),
          proposalService.getAll().catch(() => ({ data: [] }))
        ]);

        // Transform SKU catalog
        const catalog = Array.isArray(catalogRes) ? catalogRes : (catalogRes?.data || []);
        setSkuCatalog(catalog.map((s: any) => ({
          sku: s.skuCode || s.sku || s.code || s.id,
          name: s.productName || s.name,
          collectionName: s.collectionName || s.collection || '',
          color: s.color || '',
          colorCode: s.colorCode || '',
          division: s.division || s.category || '',
          productType: s.productType || s.category || '',
          departmentGroup: s.departmentGroup || s.department || '',
          fsr: s.fsr || '',
          carryForward: s.carryForward || s.carry || 'NEW',
          composition: s.composition || '',
          unitCost: Number(s.unitCost) || 0,
          importTaxPct: Number(s.importTaxPct || s.importTax) || 0,
          srp: Number(s.srp) || 0,
          wholesale: Number(s.wholesale) || 0,
          rrp: Number(s.rrp) || 0,
          regionalRrp: Number(s.regionalRrp) || 0,
          theme: s.theme || '',
          size: s.size || ''
        })));

        // Transform proposals into SKU blocks grouped by gender/category
        const proposals = Array.isArray(proposalsRes) ? proposalsRes : (proposalsRes?.data || []);
        const blocks: any[] = [];
        proposals.forEach((p: any) => {
          (p.products || []).forEach((prod: any) => {
            const gender = (prod.gender || '').toLowerCase();
            const category = prod.category || '';
            const subCategory = prod.subCategory || '';
            let block = blocks.find((b: any) => b.gender === gender && b.category === category && b.subCategory === subCategory);
            if (!block) {
              block = { gender, category, subCategory, items: [] };
              blocks.push(block);
            }
            // Extract store allocations from product allocations (dynamic)
            const allocations = prod.allocations || [];
            const storeQty: Record<string, number> = {};
            allocations.forEach((a: any) => {
              const code = (a.store?.code || '').toUpperCase();
              if (code) storeQty[code] = (a.quantity || 0);
            });
            // Fallback for legacy rex/ttp fields
            if (!storeQty['REX'] && prod.rex) storeQty['REX'] = prod.rex;
            if (!storeQty['TTP'] && prod.ttp) storeQty['TTP'] = prod.ttp;
            block.items.push({
              sku: prod.skuCode || prod.sku,
              name: prod.productName || prod.name,
              collectionName: prod.collectionName || prod.collection || '',
              color: prod.color || '',
              colorCode: prod.colorCode || '',
              division: prod.division || prod.category || '',
              productType: prod.productType || prod.subCategory || '',
              departmentGroup: prod.departmentGroup || prod.department || '',
              fsr: prod.fsr || '',
              carryForward: prod.carryForward || 'NEW',
              composition: prod.composition || '',
              unitCost: Number(prod.unitCost) || 0,
              importTaxPct: Number(prod.importTaxPct || prod.importTax) || 0,
              srp: Number(prod.srp) || 0,
              wholesale: Number(prod.wholesale) || 0,
              rrp: Number(prod.rrp) || 0,
              regionalRrp: Number(prod.regionalRrp) || 0,
              theme: prod.theme || '',
              size: prod.size || '',
              order: prod.orderQty || 0,
              storeQty,
              ttlValue: Number(prod.totalValue) || 0,
              customerTarget: prod.customerTarget || 'New'
            });
          });
        });
        if (blocks.length > 0) {
          setSkuBlocks(blocks);
        }
      } catch (err: any) {
        console.error('Failed to fetch SKU data:', err);
      } finally {
        setSkuDataLoading(false);
      }
    };
    fetchSkuData();
  }, []);

  // API state for fetching budgets
  const [apiBudgets, setApiBudgets] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await budgetService.getAll({ status: 'APPROVED' });
      const budgetList = (response.data || response || []).map((budget: any) => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
        brandId: budget.brandId,
        brandName: budget.Brand?.name || budget.brandName || 'Unknown',
        totalBudget: budget.totalAmount || budget.totalBudget || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || `Budget #${budget.id}`,
        status: (budget.status || 'DRAFT').toLowerCase()
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

  const [budgetFilter, setBudgetFilter] = useState('all');
  const [seasonGroupFilter, setSeasonGroupFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');

  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');

  const [collapsed, setCollapsed] = useState<Record<string, any>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [contextBanner, setContextBanner] = useState<any>(null);
  const [viewMode, setViewMode] = useState('table');
  const [cardDetailsOpen, setCardDetailsOpen] = useState<Record<string, any>>({});
  const [cardStoreOrderOpen, setCardStoreOrderOpen] = useState<Record<string, any>>({});
  const [cardSizingOpen, setCardSizingOpen] = useState<Record<string, any>>({});
  const [skuVersion, setSkuVersion] = useState('v3');
  const [skuVersions, setSkuVersions] = useState(SKU_VERSIONS);
  const [isSkuVersionOpen, setIsSkuVersionOpen] = useState(false);
  const [sizingVersion, setSizingVersion] = useState('choice-a');
  const [sizingChoices, setSizingChoices] = useState(SIZING_CHOICES);
  const [isSizingVersionOpen, setIsSizingVersionOpen] = useState(false);
  const skuVersionDropdownRef = useRef<any>(null);
  const sizingVersionDropdownRef = useRef<any>(null);

  // Close version dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (skuVersionDropdownRef.current && !skuVersionDropdownRef.current.contains(e.target)) {
        setIsSkuVersionOpen(false);
      }
      if (sizingVersionDropdownRef.current && !sizingVersionDropdownRef.current.contains(e.target)) {
        setIsSizingVersionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSetFinalVersion = (versionId: any, e: any) => {
    e.stopPropagation();
    setSkuVersions((prev: any) => prev.map((v: any) => ({ ...v, isFinal: v.id === versionId })));
  };

  const handleSetFinalSizing = (choiceId: any, e: any) => {
    e.stopPropagation();
    setSizingChoices((prev: any) => prev.map((c: any) => ({ ...c, isFinal: c.id === choiceId })));
  };

  const selectedSkuVersion = skuVersions.find((v: any) => v.id === skuVersion) || skuVersions[0];
  const selectedSizingChoice = sizingChoices.find((c: any) => c.id === sizingVersion) || sizingChoices[0];

  // Apply context from OTB Analysis when navigating here
  useEffect(() => {
    if (skuContext) {
      // Set filters based on context
      if (skuContext.budgetId) {
        setBudgetFilter(skuContext.budgetId);
      }
      if (skuContext.seasonGroup) {
        setSeasonGroupFilter(skuContext.seasonGroup);
      }
      if (skuContext.season) {
        setSeasonFilter(skuContext.season);
      }
      // Use lowercase gender name to match SKU data (e.g., 'female', 'male')
      if (skuContext.gender?.name) {
        setGenderFilter(skuContext.gender.name.toLowerCase());
      }
      // Use category name to match SKU data (e.g., 'RTW', 'Accessories')
      if (skuContext.category?.name) {
        setCategoryFilter(skuContext.category.name);
      }
      // Use subCategory name to match SKU data (e.g., 'W Outerwear', 'M Bags')
      if (skuContext.subCategory?.name) {
        setSubCategoryFilter(skuContext.subCategory.name);
      }

      // Set banner info
      setContextBanner({
        budgetName: skuContext.budgetName,
        fiscalYear: skuContext.fiscalYear,
        brandName: skuContext.brandName,
        seasonGroup: skuContext.seasonGroup,
        season: skuContext.season,
        gender: skuContext.gender?.name,
        category: skuContext.category?.name,
        subCategory: skuContext.subCategory?.name,
        otbData: skuContext.otbData
      });

      // Clear context after use
      if (onContextUsed) {
        onContextUsed();
      }
    }
  }, [skuContext, onContextUsed]);

  const [skuBlocks, setSkuBlocks] = useState<any[]>([]);

  // When context is provided and data loads but no proposal blocks exist,
  // build blocks from the SKU catalog matching the context's subCategory
  useEffect(() => {
    if (contextBanner?.subCategory && skuCatalog.length > 0 && skuBlocks.length === 0 && !skuDataLoading) {
      const subCat = contextBanner.subCategory;
      const matchingItems = skuCatalog.filter((item: any) => (item.productType || '').toLowerCase() === subCat.toLowerCase());
      if (matchingItems.length > 0) {
        const genderKey = (contextBanner.gender || '').toLowerCase();
        setSkuBlocks([{
          gender: genderKey,
          category: contextBanner.category || '',
          subCategory: subCat,
          items: matchingItems.map((item: any) => ({
            ...item,
            order: 0,
            storeQty: {},
            ttlValue: 0,
            customerTarget: 'New'
          }))
        }]);
      }
    }
  }, [contextBanner, skuCatalog, skuBlocks.length, skuDataLoading]);
  const [editingCell, setEditingCell] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [sizingPopup, setSizingPopup] = useState<any>({ open: false, blockKey: null, itemIdx: null, item: null });
  const [sizingData, setSizingData] = useState<Record<string, any>>({});

  const getDefaultSizing = () => ({
    choiceA: { s0002: 2, s0004: 4, s0006: 3, s0008: 2 },
    choiceB: { s0002: 1, s0004: 3, s0006: 3, s0008: 2 },
    choiceC: { s0002: 1, s0004: 2, s0006: 2, s0008: 1 }
  });

  const getSizingKey = (blockKey: any, itemIdx: any) => `${blockKey}_${itemIdx}`;

  const getSizing = (blockKey: any, itemIdx: any) => {
    const key = getSizingKey(blockKey, itemIdx);
    return sizingData[key] || getDefaultSizing();
  };

  const updateSizing = (blockKey: any, itemIdx: any, choice: any, size: any, value: any) => {
    const key = getSizingKey(blockKey, itemIdx);
    const currentSizing = sizingData[key] || getDefaultSizing();
    setSizingData((prev: any) => ({
      ...prev,
      [key]: {
        ...currentSizing,
        [choice]: {
          ...currentSizing[choice],
          [size]: parseInt(value) || 0
        }
      }
    }));
  };

  const calculateSum = (choiceData: any): number => {
    return Object.values(choiceData).reduce((sum: any, val: any) => sum + (parseInt(val) || 0), 0) as number;
  };

  const handleOpenSizing = (blockKey: any, itemIdx: any, item: any) => {
    setSizingPopup({ open: true, blockKey, itemIdx, item });
  };

  const handleCloseSizing = () => {
    setSizingPopup({ open: false, blockKey: null, itemIdx: null, item: null });
  };

  const budgetOptions = useMemo(() => {
    const options = [{ id: 'all', label: 'All Budgets' }];
    apiBudgets.forEach((b: any) => options.push({ id: b.id, label: b.budgetName }));
    return options;
  }, [apiBudgets]);

  const genderOptions = useMemo(() => {
    const fromBlocks = skuBlocks.map((s: any) => s.gender).filter(Boolean);
    const fromMaster = masterGenders.filter(Boolean);
    const genders = new Set([...fromBlocks, ...fromMaster]);
    return ['all', ...Array.from(genders)];
  }, [skuBlocks, masterGenders]);

  const categoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter((s: any) => genderFilter === 'all' || s.gender === genderFilter)
      .map((s: any) => s.category)
      .filter(Boolean);
    const fromMaster = masterCategories.map((c: any) => c.name || c.code || '').filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, skuBlocks, masterCategories]);

  const subCategoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter((s: any) => (genderFilter === 'all' || s.gender === genderFilter)
        && (categoryFilter === 'all' || s.category === categoryFilter))
      .map((s: any) => s.subCategory)
      .filter(Boolean);
    // Also extract sub-categories from master data
    const fromMaster = masterCategories
      .flatMap((c: any) => (c.subCategories || []).map((sc: any) => sc.name || sc.code || ''))
      .filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, categoryFilter, skuBlocks, masterCategories]);

  const filteredSkuBlocks = useMemo(() => {
    return skuBlocks.filter((block: any) => {
      if (genderFilter !== 'all' && block.gender !== genderFilter) return false;
      if (categoryFilter !== 'all' && block.category !== categoryFilter) return false;
      if (subCategoryFilter !== 'all' && block.subCategory !== subCategoryFilter) return false;
      return true;
    });
  }, [genderFilter, categoryFilter, subCategoryFilter, skuBlocks]);

  const grandTotals = useMemo(() => {
    return filteredSkuBlocks.reduce((acc: any, block: any) => {
      block.items.forEach((item: any) => {
        acc.skuCount += 1;
        acc.order += (item.order || 0);
        acc.ttlValue += (item.ttlValue || 0);
        acc.srp += (item.srp || 0);
        acc.unitCost += (item.unitCost || 0);
        // Aggregate per-store quantities
        const sq = item.storeQty || {};
        Object.keys(sq).forEach((code: string) => {
          acc.storeQty[code] = (acc.storeQty[code] || 0) + (sq[code] || 0);
        });
      });
      return acc;
    }, { skuCount: 0, order: 0, storeQty: {} as Record<string, number>, ttlValue: 0, srp: 0, unitCost: 0 });
  }, [filteredSkuBlocks]);

  // Card view available when there's data to show
  const canShowCardView = filteredSkuBlocks.length > 0 && filteredSkuBlocks.some((b: any) => b.items.length > 0);

  const handleStartEdit = (cellKey: any, currentValue: any) => {
    setEditingCell(cellKey);
    setEditValue(currentValue?.toString() ?? '');
  };

  const handleSaveEdit = (cellKey: any) => {
    const value = Number(editValue);
    const nextValue = Number.isFinite(value) ? value : 0;
    const [blockKey, itemIdx, field] = cellKey.split('|');

    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const bKey = `${block.gender}_${block.category}_${block.subCategory}`;
      if (bKey !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== itemIdx) return item;
        // Handle store_XXX fields → update storeQty map
        if (field.startsWith('store_')) {
          const storeCode = field.replace('store_', '');
          const newStoreQty = { ...(item.storeQty || {}), [storeCode]: nextValue };
          return { ...item, storeQty: newStoreQty };
        }
        return { ...item, [field]: nextValue };
      });
      return { ...block, items };
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

  const handleSelectChange = (blockKey: any, itemIdx: any, field: any, value: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== String(itemIdx)) return item;
        return { ...item, [field]: value };
      });
      return { ...block, items };
    }));
  };

  const handleNumberChange = (blockKey: any, itemIdx: any, field: any, value: any) => {
    const nextValue = Number(value);
    const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const bKey = `${block.gender}_${block.category}_${block.subCategory}`;
      if (bKey !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== String(itemIdx)) return item;
        // Handle store_XXX fields → update storeQty map
        if (field.startsWith('store_')) {
          const storeCode = field.replace('store_', '');
          const newStoreQty = { ...(item.storeQty || {}), [storeCode]: safeValue };
          return { ...item, storeQty: newStoreQty };
        }
        return { ...item, [field]: safeValue };
      });
      return { ...block, items };
    }));
  };

  const handleToggle = (key: any) => {
    setCollapsed((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAll = () => {
    const newState = !allCollapsed;
    setAllCollapsed(newState);
    const newCollapsed: Record<string, boolean> = {};
    filteredSkuBlocks.forEach((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      newCollapsed[key] = newState;
    });
    setCollapsed(prev => ({ ...prev, ...newCollapsed }));
  };

  const handleAddSkuRow = (blockKey: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const newItem = {
        sku: '',
        name: '',
        collectionName: '',
        color: '',
        colorCode: '',
        division: block.category || '',
        productType: block.subCategory || '',
        departmentGroup: '',
        fsr: '',
        carryForward: 'NEW',
        composition: '',
        unitCost: 0,
        importTaxPct: 0,
        srp: 0,
        wholesale: 0,
        rrp: 0,
        regionalRrp: 0,
        theme: '',
        size: '',
        order: 0,
        storeQty: {},
        ttlValue: 0,
        customerTarget: 'New',
        isNew: true
      };
      return { ...block, items: [...block.items, newItem] };
    }));
  };

  const handleSkuSelect = (blockKey: any, itemIdx: any, selectedSku: any) => {
    const skuData = skuCatalog.find((s: any) => s.sku === selectedSku);
    if (!skuData) return;

    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (idx !== itemIdx) return item;
        return {
          ...item,
          sku: skuData.sku,
          name: skuData.name,
          collectionName: skuData.collectionName,
          color: skuData.color,
          colorCode: skuData.colorCode,
          division: skuData.division,
          productType: skuData.productType,
          departmentGroup: skuData.departmentGroup,
          fsr: skuData.fsr,
          carryForward: skuData.carryForward,
          composition: skuData.composition,
          unitCost: skuData.unitCost,
          importTaxPct: skuData.importTaxPct,
          srp: skuData.srp,
          wholesale: skuData.wholesale,
          rrp: skuData.rrp,
          regionalRrp: skuData.regionalRrp,
          theme: skuData.theme,
          size: skuData.size,
          isNew: false
        };
      });
      return { ...block, items };
    }));
  };

  const handleDeleteSkuRow = (blockKey: any, itemIdx: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const items = block.items.filter((_: any, idx: any) => idx !== itemIdx);
      return { ...block, items };
    }));
  };

  const filteredSkuItems = useMemo(() => {
    return filteredSkuBlocks.flatMap((block: any) => {
      const blockKey = `${block.gender}_${block.category}_${block.subCategory}`;
      return block.items.map((item: any, idx: any) => ({
        block,
        blockKey,
        item,
        idx,
        key: `${blockKey}_${item.sku || 'new'}_${idx}`
      }));
    });
  }, [filteredSkuBlocks]);

  const getCardBgClass = (index: any) => {
    const style = CARD_BG_CLASSES[index % CARD_BG_CLASSES.length];
    return darkMode ? style.dark : style.light;
  };

  return (
    <div className="space-y-2 md:space-y-3">
      <div className={`rounded-xl shadow-sm border p-2 md:p-3 ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'}`}>
        <div className="flex flex-wrap items-center justify-between mb-2 gap-2">

          {/* Mobile Filter Button */}
          {isMobile && (
            <button
              onClick={openFilter}
              className={`flex items-center gap-2 px-3 py-0.5 rounded-lg text-sm font-medium border ${darkMode ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'}`}
            >
              <SlidersHorizontal size={16} />
              {t('common.filters')}
            </button>
          )}

          {/* Context Banner from OTB Analysis */}
          {contextBanner && (
            <div className={`flex flex-wrap items-center gap-3 px-3 md:px-4 py-0.5 rounded-xl border ${darkMode ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)]' : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.3)]'}`}>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex flex-col">
                  <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.budget')}</span>
                  <span className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{contextBanner.budgetName || 'N/A'}</span>
                </div>
                <div className={`w-px h-8 hidden md:block ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.4)]'}`}></div>
                <div className="flex flex-col">
                  <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.season')}</span>
                  <span className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{contextBanner.seasonGroup} - {contextBanner.season}</span>
                </div>
                <div className={`w-px h-8 hidden md:block ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.4)]'}`}></div>
                <div className="flex flex-col">
                  <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.category')}</span>
                  <span className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{contextBanner.gender} / {contextBanner.category} / {contextBanner.subCategory}</span>
                </div>
                {contextBanner.otbData && (
                  <>
                    <div className={`w-px h-8 hidden md:block ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.4)]'}`}></div>
                    <div className="flex flex-col">
                      <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.totalValue')}</span>
                      <span className={`font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(contextBanner.otbData.otbProposed || 0)}</span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setContextBanner(null)}
                className={`ml-2 p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.15)]' : 'hover:bg-[rgba(215,183,151,0.2)]'}`}
                title="Dismiss"
              >
                <X size={16} className={darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
              </button>
            </div>
          )}
        </div>

        {!isMobile && <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <div className={`rounded-lg border p-3 ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
            <div className={`flex items-center gap-1.5 mb-2 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
              <Filter size={12} />
              <span className="text-xs font-semibold font-['Montserrat']">{t('skuProposal.filters')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.budget')}</label>
                <select
                  value={budgetFilter}
                  onChange={(e) => setBudgetFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-0.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {budgetOptions.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.seasonGroup')}</label>
                <select
                  value={seasonGroupFilter}
                  onChange={(e) => setSeasonGroupFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-0.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {SEASON_GROUPS.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.season')}</label>
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-0.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {SEASONS.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-3 ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
            <div className={`flex items-center gap-1.5 mb-2 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
              <Filter size={12} />
              <span className="text-xs font-semibold font-['Montserrat']">{t('common.filters')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.gender')}</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-0.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {genderOptions.map((g: any) => (
                    <option key={g} value={g}>{g === 'all' ? 'All' : g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.category')}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-0.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {categoryOptions.map((c: any) => (
                    <option key={c} value={c}>{c === 'all' ? 'All' : c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.subCategory')}</label>
                <select
                  value={subCategoryFilter}
                  onChange={(e) => setSubCategoryFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-0.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {subCategoryOptions.map((s: any) => (
                    <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>}

        {/* Versions Section */}
        <div className={`mt-2 rounded-lg border p-3 ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
          <div className={`flex items-center gap-1.5 mb-2 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
            <Package size={12} />
            <span className="text-xs font-semibold font-['Montserrat']">{t('skuProposal.version')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* SKU Version Dropdown */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.version')}</span>
              <div className="relative" ref={skuVersionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSkuVersionOpen(!isSkuVersionOpen)}
                  className={`flex items-center gap-2 px-4 py-0.5 rounded-lg text-sm font-medium transition-all border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.15)]'
                      : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#333333] hover:bg-[rgba(160,120,75,0.18)]'
                  }`}
                >
                  {selectedSkuVersion?.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />}
                  <span>{selectedSkuVersion?.name || t('common.version')}</span>
                  {selectedSkuVersion?.isFinal && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A]' : 'bg-[#D7B797] text-white'}`}>FINAL</span>
                  )}
                  <ChevronDown size={14} className={`transition-transform ${isSkuVersionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSkuVersionOpen && (
                  <div className={`absolute top-full left-0 mt-1 w-72 rounded-xl shadow-xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'}`}>
                    <div className={`px-3 py-0.5 border-b ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
                      <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{t('common.version')}</span>
                    </div>
                    {skuVersions.map((version: any) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => { setSkuVersion(version.id); setIsSkuVersionOpen(false); }}
                        className={`w-full px-3 py-0.5 flex items-center justify-between transition-colors ${
                          version.id === skuVersion
                            ? darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-[rgba(160,120,75,0.12)]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.05)]' : 'hover:bg-[rgba(160,120,75,0.08)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {version.isFinal
                            ? <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />
                            : <Layers size={14} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                          }
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{version.name}</span>
                              {version.isFinal && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]">FINAL</span>
                              )}
                            </div>
                            <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Created: {version.createdAt}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!version.isFinal && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => handleSetFinalVersion(version.id, e)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSetFinalVersion(version.id, e); }}
                              className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
                            >
                              {t('planning.latestVersion')}
                            </span>
                          )}
                          {version.id === skuVersion && <Check size={16} className="text-[#2A9E6A]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className={`h-8 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[rgba(215,183,151,0.3)]'}`} />

            {/* Sizing Choice Dropdown */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.sizingChoice')}</span>
              <div className="relative" ref={sizingVersionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSizingVersionOpen(!isSizingVersionOpen)}
                  className={`flex items-center gap-2 px-4 py-0.5 rounded-lg text-sm font-medium transition-all border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.15)]'
                      : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#333333] hover:bg-[rgba(160,120,75,0.18)]'
                  }`}
                >
                  {selectedSizingChoice?.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />}
                  <span>{selectedSizingChoice?.name || t('skuProposal.sizing')}</span>
                  {selectedSizingChoice?.isFinal && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A]' : 'bg-[#D7B797] text-white'}`}>FINAL</span>
                  )}
                  <ChevronDown size={14} className={`transition-transform ${isSizingVersionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSizingVersionOpen && (
                  <div className={`absolute top-full left-0 mt-1 w-64 rounded-xl shadow-xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'}`}>
                    <div className={`px-3 py-0.5 border-b ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
                      <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{t('skuProposal.sizing')}</span>
                    </div>
                    {sizingChoices.map((choice: any) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => { setSizingVersion(choice.id); setIsSizingVersionOpen(false); }}
                        className={`w-full px-3 py-0.5 flex items-center justify-between transition-colors ${
                          choice.id === sizingVersion
                            ? darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-[rgba(160,120,75,0.12)]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.05)]' : 'hover:bg-[rgba(160,120,75,0.08)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {choice.isFinal
                            ? <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />
                            : <Layers size={14} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                          }
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{choice.name}</span>
                            {choice.isFinal && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]">FINAL</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!choice.isFinal && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => handleSetFinalSizing(choice.id, e)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSetFinalSizing(choice.id, e); }}
                              className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
                            >
                              {t('planning.latestVersion')}
                            </span>
                          )}
                          {choice.id === sizingVersion && <Check size={16} className="text-[#2A9E6A]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3 justify-between mt-4">
          <div className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
            {canShowCardView ? `${filteredSkuItems.length} SKUs found. Card view available.` : 'No SKU data. Add SKUs to enable card view.'}
          </div>
          <div className={`flex items-center gap-1 rounded-lg p-1 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-0.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                  : darkMode ? 'text-[#999999] hover:text-[#D7B797]' : 'text-[#666666] hover:text-[#6B4D30]'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => canShowCardView && setViewMode('card')}
              disabled={!canShowCardView}
              title={!canShowCardView ? 'Add SKUs to enable card view' : 'View SKUs as cards'}
              className={`px-3 py-0.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                  : darkMode ? 'text-[#999999] hover:text-[#D7B797]' : 'text-[#666666] hover:text-[#6B4D30]'
              } ${!canShowCardView ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Card
            </button>
          </div>
        </div>
      </div>

      {filteredSkuBlocks.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
          <Package size={36} className={`mx-auto mb-3 ${darkMode ? 'text-[#666666]' : 'text-[rgba(215,183,151,0.5)]'}`} />
          <p className={`font-medium font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{t('skuProposal.noSkuData')}</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Try adjusting the filters above</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSkuItems.map(({ block, blockKey, item, idx, key }, cardIdx) => {
            const detailsOpen = !!cardDetailsOpen[key];
            const sizingOpen = !!cardSizingOpen[key];
            return (
              <div key={key} className={`rounded-2xl border p-4 ${getCardBgClass(cardIdx)}`}>
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.25)]'}`}>
                      <ImageIcon size={18} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>
                        <span className="font-['JetBrains_Mono']">{item.sku || 'New SKU'}</span> <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>•</span> {item.name || 'Select SKU'}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                        {block.gender} • {block.category} • {block.subCategory}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCardDetailsOpen((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 md:px-3 py-0.5 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {detailsOpen ? t('skuProposal.hideDetails') : t('skuProposal.showDetails')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardStoreOrderOpen((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 md:px-3 py-0.5 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {cardStoreOrderOpen[key] ? t('skuProposal.hideStores') : t('skuProposal.storeOrder')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardSizingOpen((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 md:px-3 py-0.5 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {sizingOpen ? t('skuProposal.hideSizing') : t('skuProposal.sizing')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkuRow(blockKey, idx)}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#666666] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'}`}
                      title={t('proposal.deleteSku')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {item.isNew && (
                  <div className="mt-3">
                    <select
                      value={item.sku}
                      onChange={(e) => handleSkuSelect(blockKey, idx, e.target.value)}
                      className={`w-full px-3 py-0.5 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 font-['JetBrains_Mono'] ${darkMode ? 'border-[#2A9E6A] bg-[#121212] text-[#F2F2F2] focus:ring-[rgba(42,158,106,0.3)]' : 'border-[#127749] bg-white text-[#333333] focus:ring-[rgba(18,119,73,0.3)]'}`}
                    >
                      <option value="">{t('proposal.selectSku')}</option>
                      {skuCatalog.map((sku: any) => (
                        <option key={sku.sku} value={sku.sku}>
                          {sku.sku} - {sku.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Rex/TTP/Order/Total Value summary removed — info shown in Store Order table below */}

                {detailsOpen && (
                  <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Product type</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.productType}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Theme</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.theme}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Color</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.color}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Composition</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.composition}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Unit cost</span>
                        <div className={`font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{formatCurrency(item.unitCost)}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>SRP</span>
                        <div className={`font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.srp)}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Customer target</span>
                        <select
                          value={item.customerTarget}
                          onChange={(e) => handleSelectChange(blockKey, idx, 'customerTarget', e.target.value)}
                          className={`mt-1 w-full px-3 py-0.5 rounded-lg border text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                        >
                          <option value="New">New</option>
                          <option value="Existing">Existing</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {cardStoreOrderOpen[key] && (
                  <div className={`mt-4 rounded-xl border overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
                    <div className={`px-4 py-0.5 text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797] bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] bg-[rgba(160,120,75,0.12)]'}`}>
                      Store Order
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={darkMode ? 'bg-[#121212] text-[#999999]' : 'bg-[rgba(160,120,75,0.12)] text-[#666666]'}>
                            <th className="px-3 py-0.5 text-left">Store</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">ORDER</th>
                            <th className="px-3 py-0.5 text-right font-['JetBrains_Mono']">TTL VALUE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stores.map((st: any, si: number) => {
                            const storeVal = (item.storeQty || {})[st.code] || 0;
                            const colors = ['bg-[#D7B797]', 'bg-[#127749]', 'bg-[#58A6FF]', 'bg-[#A371F7]', 'bg-[#E3B341]'];
                            return (
                              <tr key={st.code} className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
                                <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>
                                  <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${colors[si % colors.length]}`} />{st.code}</span>
                                </td>
                                <td className="px-3 py-0.5 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={storeVal}
                                    onChange={(e) => handleNumberChange(blockKey, idx, `store_${st.code}`, e.target.value)}
                                    className={`w-16 text-center font-['JetBrains_Mono'] text-sm rounded-lg border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${
                                      darkMode
                                        ? 'bg-[#121212] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] focus:border-[#D7B797]'
                                        : 'bg-white border-[rgba(215,183,151,0.4)] text-gray-800 focus:border-[#D7B797]'
                                    }`}
                                  />
                                </td>
                                <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(storeVal * (item.srp || 0))}</td>
                              </tr>
                            );
                          })}
                          <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30 bg-[rgba(215,183,151,0.05)]' : 'border-[#D7B797]/40 bg-[rgba(160,120,75,0.12)]'}`}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{t('skuProposal.total')}</td>
                            <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.order || 0}</td>
                            <td className={`px-3 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(item.ttlValue || (item.order || 0) * (item.srp || 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {sizingOpen && (
                  <div className={`mt-4 rounded-xl border overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
                    <div className={`px-4 py-0.5 text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797] bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] bg-[rgba(160,120,75,0.12)]'}`}>
                      Sizing
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.12)] text-[#6B4D30]'}>
                            <th className="px-3 py-0.5 text-left font-['Montserrat']">{item.productType}</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0002</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0004</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0006</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0008</th>
                            <th className="px-3 py-0.5 text-center font-['Montserrat']">Sum</th>
                          </tr>
                        </thead>
                        <tbody className={darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E]' : 'border-t border-[rgba(215,183,151,0.2)]'}>
                            <td className="px-3 py-0.5">% Sales mix</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">6%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">28%</td>
                            <td className="px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono']">100%</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E]' : 'border-t border-[rgba(215,183,151,0.2)]'}>
                            <td className="px-3 py-0.5">% ST</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">50%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">43%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">30%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">63%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">-</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E] bg-[rgba(215,183,151,0.08)]' : 'border-t border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.08)]'}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>Choice A</td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-1 py-0.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceA[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceA', size, e.target.value)}
                                  className={`w-10 text-center font-['JetBrains_Mono'] text-xs rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#D7B797]' : 'bg-emerald-50 border-emerald-200 text-[#6B4D30]'}`}
                                />
                              </td>
                            ))}
                            <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{calculateSum(getSizing(blockKey, idx).choiceA)}</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E] bg-[rgba(42,158,106,0.08)]' : 'border-t border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.03)]'}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice B</td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-1 py-0.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceB[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceB', size, e.target.value)}
                                  className={`w-10 text-center font-['JetBrains_Mono'] text-xs rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                                />
                              </td>
                            ))}
                            <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{calculateSum(getSizing(blockKey, idx).choiceB)}</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E] bg-[rgba(42,158,106,0.05)]' : 'border-t border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.02)]'}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice C</td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-1 py-0.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceC[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceC', size, e.target.value)}
                                  className={`w-10 text-center font-['JetBrains_Mono'] text-xs rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                                />
                              </td>
                            ))}
                            <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{calculateSum(getSizing(blockKey, idx).choiceC)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add SKU Card */}
          {filteredSkuBlocks.length > 0 && (
            <button
              onClick={() => {
                const firstBlock = filteredSkuBlocks[0];
                const blockKey = `${firstBlock.gender}_${firstBlock.category}_${firstBlock.subCategory}`;
                handleAddSkuRow(blockKey);
              }}
              className={`rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] ${
                darkMode
                  ? 'border-[rgba(215,183,151,0.3)] hover:border-[#D7B797] hover:bg-[rgba(215,183,151,0.05)]'
                  : 'border-[rgba(215,183,151,0.4)] hover:border-[#8A6340] hover:bg-[rgba(215,183,151,0.08)]'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-[rgba(215,183,151,0.2)]'
              }`}>
                <Plus size={24} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
              </div>
              <span className={`text-sm font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                Add New SKU
              </span>
              <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                Click to add a new SKU to {filteredSkuBlocks[0]?.subCategory}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rail Controls */}
          <div className={`flex flex-wrap items-center justify-between px-4 py-2 rounded-xl border ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAll}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
              >
                <ChevronDown size={12} className={`transition-transform ${allCollapsed ? '-rotate-90' : ''}`} />
                {allCollapsed ? 'Expand All' : 'Collapse All'}
              </button>
              <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                {filteredSkuBlocks.length} Rails • {grandTotals.skuCount} SKUs
              </span>
            </div>
            <div className={`flex items-center gap-4 text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
              <span>Order: <span className={`font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.order}</span></span>
              {stores.map((s: any) => (
                <span key={s.code}>{s.code}: <span className={`font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.storeQty[s.code] || 0}</span></span>
              ))}
              <span>Value: <span className={`font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(grandTotals.ttlValue)}</span></span>
            </div>
          </div>

          {filteredSkuBlocks.map((block: any) => {
            const key = `${block.gender}_${block.category}_${block.subCategory}`;
            const isCollapsed = collapsed[key];
            return (
              <div key={key} className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
                <button
                  type="button"
                  onClick={() => handleToggle(key)}
                  className={`w-full flex items-center gap-0 ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.12)] border-b border-[rgba(215,183,151,0.25)]'
                      : 'bg-[rgba(215,183,151,0.18)] border-b border-[rgba(215,183,151,0.3)]'
                  }`}
                >
                  <div className={`w-1.5 self-stretch rounded-l-xl ${darkMode ? 'bg-[#D7B797]' : 'bg-[#8A6340]'}`} />
                  <div className="flex items-center gap-3 px-4 py-2 flex-1">
                    <ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#8A6340]'}`}>RAIL</span>
                        <span className={`font-semibold text-sm ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{block.subCategory}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#999999]' : 'bg-[rgba(160,120,75,0.12)] text-[#6B5B4D]'}`}>
                          {block.items.length} SKUs
                        </span>
                      </div>
                      <div className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-[#8A6340]'}`}>
                        {block.gender} • {block.category}
                      </div>
                    </div>
                    <div className={`hidden md:flex items-center gap-4 text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#6B5B4D]'}`}>
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Order</span>
                        <span className={`font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{block.items.reduce((s: number, i: any) => s + (i.order || 0), 0)}</span>
                      </div>
                      {stores.map((st: any) => (
                        <div key={st.code} className="flex flex-col items-center">
                          <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{st.code}</span>
                          <span className="font-semibold">{block.items.reduce((s: number, i: any) => s + ((i.storeQty || {})[st.code] || 0), 0)}</span>
                        </div>
                      ))}
                      <div className={`h-6 w-px ${darkMode ? 'bg-[rgba(215,183,151,0.2)]' : 'bg-[rgba(215,183,151,0.4)]'}`} />
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Value</span>
                        <span className={`font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(block.items.reduce((s: number, i: any) => s + (i.ttlValue || 0), 0))}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className={`w-full text-xs border-collapse ${darkMode ? '[&_td]:border-[#2E2E2E]' : '[&_td]:border-[rgba(215,183,151,0.2)]'} [&_td]:border`}>
                      <tbody>
                        {/* Image row */}
                        <tr className="">
                          <td className={`px-3 py-2 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Image</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-2 text-center min-w-[140px]">
                              <div className={`w-16 h-16 mx-auto rounded-lg border flex items-center justify-center ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.25)]'}`}>
                                <ImageIcon size={20} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                              </div>
                            </td>
                          ))}
                        </tr>
                        {/* SKU row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>SKU</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>
                              {item.isNew ? (
                                <select
                                  value={item.sku}
                                  onChange={(e) => handleSkuSelect(key, idx, e.target.value)}
                                  className={`w-full px-1 py-0.5 rounded border text-xs font-['JetBrains_Mono'] ${darkMode ? 'border-[#2A9E6A] bg-[#121212] text-[#F2F2F2]' : 'border-[#127749] bg-white text-[#333333]'}`}
                                >
                                  <option value="">{t('proposal.selectSku')}</option>
                                  {skuCatalog.map((sku: any) => (
                                    <option key={sku.sku} value={sku.sku}>{sku.sku}</option>
                                  ))}
                                </select>
                              ) : item.sku}
                            </td>
                          ))}
                        </tr>
                        {/* Name row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Name</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.name}</td>
                          ))}
                        </tr>
                        {/* Product Type (L3) row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Product Type (L3)</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.productType}</td>
                          ))}
                        </tr>
                        {/* Theme row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Theme</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.theme}</td>
                          ))}
                        </tr>
                        {/* Color row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Color</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.color}</td>
                          ))}
                        </tr>
                        {/* Composition row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Composition</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center max-w-[160px] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`} title={item.composition}>{item.composition}</td>
                          ))}
                        </tr>
                        {/* Unit cost row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Unit cost</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{formatCurrency(item.unitCost)}</td>
                          ))}
                        </tr>
                        {/* SRP row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>SRP</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.srp)}</td>
                          ))}
                        </tr>
                        {/* Order row - highlighted */}
                        <tr className={darkMode ? 'bg-[rgba(215,183,151,0.06)]' : 'bg-[rgba(160,120,75,0.06)]'}>
                          <td className={`px-3 py-1.5 font-bold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#1a1714] !border-r-[#555]' : 'text-[#c0392b] bg-[#f5efe8] !border-r-[rgba(160,120,75,0.4)]'}`}>Order</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#c0392b]'}`}>{item.order}</td>
                          ))}
                        </tr>
                        {/* Dynamic store rows */}
                        {stores.map((st: any) => (
                          <tr key={st.code} className="">
                            <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>{st.code}</td>
                            {block.items.map((item: any, idx: number) => {
                              const storeKey = `${key}|${idx}|store_${st.code}`;
                              const isEditingStore = editingCell === storeKey;
                              const storeVal = (item.storeQty || {})[st.code] || 0;
                              return (
                                <td key={idx} className="px-3 py-1.5 text-center">
                                  {isEditingStore ? (
                                    <input
                                      type="number"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={() => handleSaveEdit(storeKey)}
                                      onKeyDown={(e) => handleKeyDown(e, storeKey)}
                                      className={`w-14 px-1 py-0.5 text-center border-2 rounded-md text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'border-[#D7B797] bg-[#121212] text-[#F2F2F2]' : 'border-[#D7B797] bg-white text-[#333333]'}`}
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(storeKey, storeVal)}
                                      className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono'] transition-colors ${darkMode ? 'text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#333333] hover:bg-[rgba(160,120,75,0.12)]'}`}
                                    >
                                      {storeVal}
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* TTL value row - highlighted */}
                        <tr className={darkMode ? 'bg-[rgba(215,183,151,0.06)]' : 'bg-[rgba(160,120,75,0.06)]'}>
                          <td className={`px-3 py-1.5 font-bold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#1a1714] !border-r-[#555]' : 'text-[#6B4D30] bg-[#f5efe8] !border-r-[rgba(160,120,75,0.4)]'}`}>TTL value</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.ttlValue || (item.order * (item.srp || 0)))}</td>
                          ))}
                        </tr>
                        {/* Customer Target row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${darkMode ? 'text-[#D7B797] bg-[#121212] !border-r-[#555]' : 'text-[#6B4D30] bg-white !border-r-[rgba(160,120,75,0.4)]'}`}>Customer Target</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1.5 text-center">
                              <select
                                value={item.customerTarget}
                                onChange={(e) => handleSelectChange(key, idx, 'customerTarget', e.target.value)}
                                className={`px-1.5 py-0.5 rounded-md border text-xs ${darkMode ? 'border-[#2E2E2E] bg-[#1A1A1A] text-[#F2F2F2]' : 'border-[rgba(215,183,151,0.3)] bg-white text-[#333333]'}`}
                              >
                                <option value="New">New</option>
                                <option value="Existing">Existing</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                        {/* Actions row */}
                        <tr className="">
                          <td className={`px-3 py-1.5 sticky left-0 z-10 ${darkMode ? 'bg-[#121212] !border-r-[#555]' : 'bg-white !border-r-[rgba(160,120,75,0.4)]'}`}></td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={() => handleOpenSizing(key, idx, item)} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-[#999999] hover:text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#666666] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`} title="Sizing"><Ruler size={14} /></button>
                                <button type="button" onClick={() => handleDeleteSkuRow(key, idx)} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-[#999999] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#666666] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'}`} title={t('proposal.deleteSku')}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                    {/* Add new SKU button */}
                    <div className={`border-t border-dashed px-3 py-2 ${darkMode ? 'border-[#2E2E2E] bg-[rgba(215,183,151,0.03)]' : 'border-[rgba(215,183,151,0.3)] bg-[rgba(215,183,151,0.03)]'}`}>
                      <button
                        type="button"
                        onClick={() => handleAddSkuRow(key)}
                        className={`w-full flex items-center justify-center gap-2 py-1 text-xs rounded-lg transition-colors border border-dashed ${darkMode ? 'text-[#999999] hover:text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)] border-[#2E2E2E]' : 'text-[#666666] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.3)]'}`}
                      >
                        <Plus size={14} />
                        <span>Add new SKU</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Total */}
          {filteredSkuBlocks.length > 0 && (
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#D7B797]/30' : 'bg-white border-[#D7B797]/40'}`}>
              <div className={`flex items-center gap-0 ${darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-[rgba(215,183,151,0.25)]'}`}>
                <div className={`w-1.5 self-stretch rounded-l-xl ${darkMode ? 'bg-[#2A9E6A]' : 'bg-[#127749]'}`} />
                <div className="flex flex-wrap items-center justify-between flex-1 px-4 py-2.5 gap-3">
                  <span className={`text-sm font-bold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                    GRAND TOTAL — {filteredSkuBlocks.length} Rails • {grandTotals.skuCount} SKUs
                  </span>
                  <div className="flex items-center gap-5 text-xs font-['JetBrains_Mono']">
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Order</span>
                      <span className={`font-bold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.order}</span>
                    </div>
                    {stores.map((st: any) => (
                      <div key={st.code} className="flex flex-col items-center">
                        <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{st.code}</span>
                        <span className={`font-bold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.storeQty[st.code] || 0}</span>
                      </div>
                    ))}
                    <div className={`h-6 w-px ${darkMode ? 'bg-[rgba(215,183,151,0.3)]' : 'bg-[rgba(215,183,151,0.5)]'}`} />
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Total Value</span>
                      <span className={`font-bold text-sm ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(grandTotals.ttlValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sizing Popup Modal */}
      {sizingPopup.open && sizingPopup.item && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${darkMode ? 'bg-[rgba(215,183,151,0.1)] border-b border-[rgba(215,183,151,0.2)]' : 'bg-[rgba(160,120,75,0.18)] border-b border-[rgba(215,183,151,0.3)]'}`}>
              <div>
                <h3 className={`text-lg font-bold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{sizingPopup.item.productType}</h3>
                <p className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-[#6B5B4D]'}`}>
                  <span className="font-['JetBrains_Mono']">{sizingPopup.item.sku}</span> - {sizingPopup.item.name}
                </p>
              </div>
              <button
                onClick={handleCloseSizing}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.15)]' : 'hover:bg-[rgba(215,183,151,0.2)]'}`}
              >
                <X size={20} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
              </button>
            </div>

            {/* Sizing Table */}
            <div className="p-3 md:p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.2)] text-[#6B4D30]'}>
                      <th className="px-4 py-0.5 text-left font-semibold font-['Montserrat']">{sizingPopup.item.productType}</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0002</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0004</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0006</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0008</th>
                      <th className={`px-4 py-0.5 text-center font-semibold font-['Montserrat'] ${darkMode ? 'bg-[rgba(215,183,151,0.2)]' : 'bg-[rgba(215,183,151,0.25)]'}`}>Sum</th>
                    </tr>
                  </thead>
                  <tbody className={darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E] bg-[#1A1A1A]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.08)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>% Sales mix</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">6%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">28%</td>
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>100%</td>
                    </tr>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E]' : 'border-b border-[rgba(215,183,151,0.2)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>% ST</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">50%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">43%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">30%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">63%</td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666] bg-[rgba(215,183,151,0.08)]' : 'text-[#999999] bg-[rgba(160,120,75,0.12)]'}`}>-</td>
                    </tr>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E] bg-[rgba(215,183,151,0.08)]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.12)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>Choice A:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                        <td key={size} className="px-2 py-0.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceA', size, e.target.value)}
                            className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#D7B797]' : 'bg-emerald-50 border-emerald-200 text-[#6B4D30]'}`}
                          />
                        </td>
                      ))}
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797] bg-[rgba(215,183,151,0.15)]' : 'text-[#6B4D30] bg-[rgba(215,183,151,0.2)]'}`}>{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA)}</td>
                    </tr>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E] bg-[rgba(42,158,106,0.08)]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.05)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice B:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                        <td key={size} className="px-2 py-0.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceB[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceB', size, e.target.value)}
                            className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                          />
                        </td>
                      ))}
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A] bg-[rgba(42,158,106,0.15)]' : 'text-[#127749] bg-[rgba(18,119,73,0.1)]'}`}>{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceB)}</td>
                    </tr>
                    <tr className={darkMode ? 'bg-[rgba(42,158,106,0.05)]' : 'bg-[rgba(18,119,73,0.03)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice C:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                        <td key={size} className="px-2 py-0.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceC[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceC', size, e.target.value)}
                            className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                          />
                        </td>
                      ))}
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A] bg-[rgba(42,158,106,0.1)]' : 'text-[#127749] bg-[rgba(18,119,73,0.08)]'}`}>{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseSizing}
                  className={`px-4 py-0.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:bg-[rgba(215,183,151,0.1)] hover:text-[#D7B797]' : 'text-[#666666] hover:bg-[rgba(160,120,75,0.12)] hover:text-[#6B4D30]'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseSizing}
                  className={`px-4 py-0.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A584]' : 'bg-[#D7B797] text-[#333333] hover:bg-[#C4A584]'}`}
                >
                  Save Sizing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilter}
        filters={[
          {
            key: 'gender',
            label: 'Gender',
            type: 'single',
            options: genderOptions.filter((g: any) => g !== 'all').map((g: any) => ({ label: g, value: g })),
          },
          {
            key: 'category',
            label: 'Category',
            type: 'single',
            options: categoryOptions.filter((c: any) => c !== 'all').map((c: any) => ({ label: c, value: c })),
          },
          {
            key: 'subCategory',
            label: 'Sub-Category',
            type: 'single',
            options: subCategoryOptions.filter((sc: any) => sc !== 'all').map((sc: any) => ({ label: sc, value: sc })),
          },
          {
            key: 'seasonGroup',
            label: t('otbAnalysis.seasonGroup'),
            type: 'single',
            options: SEASON_GROUPS.filter((s: any) => s.id !== 'all').map((s: any) => ({ label: s.label, value: s.id })),
          },
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          setGenderFilter((mobileFilterValues.gender as string) || 'all');
          setCategoryFilter((mobileFilterValues.category as string) || 'all');
          setSubCategoryFilter((mobileFilterValues.subCategory as string) || 'all');
          setSeasonGroupFilter((mobileFilterValues.seasonGroup as string) || 'all');
        }}
        onReset={() => {
          setMobileFilterValues({});
          setGenderFilter('all');
          setCategoryFilter('all');
          setSubCategoryFilter('all');
          setSeasonGroupFilter('all');
        }}
      />
    </div>
  );
};

export default SKUProposalScreen;
