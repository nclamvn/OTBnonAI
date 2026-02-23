'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown, Package, Pencil, X, Plus, Trash2, Ruler,
  Star, Layers, Check, LayoutGrid, List, SlidersHorizontal, Download, Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils';
import { budgetService, masterDataService, proposalService } from '@/services';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSmartScrollState } from '@/hooks/useSmartScrollState';
import { FilterBottomSheet, useBottomSheet } from '@/components/mobile';
import { ProductImage, ConfirmDialog, FilterSelect } from '@/components/ui';
import CreatableSelect from '@/components/ui/CreatableSelect';
import AddSKUModal from './AddSKUModal';

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

// Local version/choice selectors — UI-only state, not fetched from API.
// isFinal is toggled locally by the user to mark their preferred version.
const SKU_VERSIONS = [
  { id: 'v1', name: 'Version 1', isFinal: false },
  { id: 'v2', name: 'Version 2', isFinal: false },
  { id: 'v3', name: 'Version 3', isFinal: true },
];

const SIZING_CHOICES = [
  { id: 'choice-a', name: 'Choice A', isFinal: true },
  { id: 'choice-b', name: 'Choice B', isFinal: false },
  { id: 'choice-c', name: 'Choice C', isFinal: false },
];

const SKUProposalScreen = ({ skuContext, onContextUsed, onSubmitTicket, darkMode = false }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const { dialogProps, confirm } = useConfirmDialog();
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
        const rawCategories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        // Handle both gender-hierarchy format [{ name: "Female", categories: [...] }]
        // and flat-list format [{ name: "Women's RTW", subCategories: [...] }]
        const isGenderHierarchy = rawCategories.length > 0 && rawCategories[0]?.categories && Array.isArray(rawCategories[0].categories);
        if (isGenderHierarchy) {
          const flatCats = rawCategories.flatMap((g: any) => (g.categories || []).map((c: any) => ({
            ...c,
            genderName: g.name,
          })));
          setMasterCategories(flatCats);
        } else {
          setMasterCategories(rawCategories);
        }
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
        const [catalogRes, proposalsListRes] = await Promise.all([
          masterDataService.getSkuCatalog().catch(() => []),
          proposalService.getAll().catch(() => [])
        ]);

        // Transform SKU catalog
        const rawCatalog = Array.isArray(catalogRes) ? catalogRes : [];
        const catalog = rawCatalog.map((s: any) => ({
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
        }));

        // Set catalog initially (will be enriched after proposals are processed)
        setSkuCatalog(catalog);

        // Fetch each proposal's detail to get products (list endpoint doesn't include them)
        const proposalsList = Array.isArray(proposalsListRes) ? proposalsListRes : [];
        const detailResults = await Promise.all(
          proposalsList.map((p: any) =>
            proposalService.getOne(p.id).catch(() => null)
          )
        );
        const proposals = detailResults
          .map((r: any) => r?.data || r)
          .filter(Boolean);
        const blocks: any[] = [];
        proposals.forEach((p: any) => {
          (p.products || []).forEach((prod: any) => {
            const gender = (prod.gender || '').toLowerCase();
            const category = (prod.category || '').toLowerCase();
            const subCategory = (prod.subCategory || '').toLowerCase();
            let block = blocks.find((b: any) => b.gender === gender && b.category.toLowerCase() === category && b.subCategory.toLowerCase() === subCategory);
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

        // Enrich catalog with unique SKUs extracted from proposal products
        // This ensures AddSKU modal has items even if the catalog API is empty
        const seenSkus = new Set(catalog.map((c: any) => c.sku));
        const supplementarySkus: any[] = [];
        proposals.forEach((p: any) => {
          (p.products || []).forEach((prod: any) => {
            const sku = prod.skuCode || prod.sku;
            if (sku && !seenSkus.has(sku)) {
              seenSkus.add(sku);
              supplementarySkus.push({
                sku,
                name: prod.productName || prod.name || '',
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
                size: prod.size || ''
              });
            }
          });
        });
        if (supplementarySkus.length > 0) {
          setSkuCatalog((prev) => [...prev, ...supplementarySkus]);
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
      const budgetList = (Array.isArray(response) ? response : []).map((budget: any) => ({
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

  // Auto-select budget from sessionStorage when budgets are loaded
  useEffect(() => {
    if (apiBudgets.length === 0 || budgetFilter !== 'all') return;
    if (storedBudgetFilters?.selectedYear) {
      const match = apiBudgets.find((b: any) => b.fiscalYear === storedBudgetFilters.selectedYear);
      if (match) setBudgetFilter(match.id);
    }
  }, [apiBudgets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill filters from sessionStorage (shared with BudgetAllocateScreen)
  const storedBudgetFilters = (() => {
    try {
      const stored = sessionStorage.getItem('otb_budget_filters');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })();
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [seasonGroupFilter, setSeasonGroupFilter] = useState(storedBudgetFilters?.selectedSeasonGroup || 'all');
  const [seasonFilter, setSeasonFilter] = useState('all');

  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');

  const [collapsed, setCollapsed] = useState<Record<string, any>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [contextBanner, setContextBanner] = useState<any>(null);
  const [viewMode, setViewMode] = useState('table');
  const [lightbox, setLightbox] = useState<{ open: boolean; key: string; tab: 'details' | 'storeOrder' | 'sizing'; item: any; blockKey: string; idx: number; block: any } | null>(null);
  const [skuVersion, setSkuVersion] = useState('v3');
  const [skuVersions, setSkuVersions] = useState(SKU_VERSIONS);
  const [isSkuVersionOpen, setIsSkuVersionOpen] = useState(false);
  const [customerTargetOptions, setCustomerTargetOptions] = useState<string[]>(['New', 'Existing']);
  const [sizingVersion, setSizingVersion] = useState('choice-a');
  const [sizingChoices, setSizingChoices] = useState(SIZING_CHOICES);
  const [isSizingVersionOpen, setIsSizingVersionOpen] = useState(false);
  const skuVersionDropdownRef = useRef<any>(null);
  const sizingVersionDropdownRef = useRef<any>(null);

  // Smart Filter Bar — direct DOM toggle, zero re-render
  const { barRef, handleBarClick } = useSmartScrollState();

  // Close version dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (skuVersionDropdownRef.current && !skuVersionDropdownRef.current.contains(e.target)) {
        setIsSkuVersionOpen(false);
      }
      if (sizingVersionDropdownRef.current && !sizingVersionDropdownRef.current.contains(e.target)) {
        setIsSizingVersionOpen(false);
        setShowAddChoiceInput(false);
        setNewChoiceName('');
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

  const [newChoiceName, setNewChoiceName] = useState('');
  const [showAddChoiceInput, setShowAddChoiceInput] = useState(false);

  const handleAddChoice = () => {
    const name = newChoiceName.trim();
    if (!name) return;
    const id = `choice-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    setSizingChoices((prev: any) => [...prev, { id, name, isFinal: false }]);
    setSizingVersion(id);
    setNewChoiceName('');
    setShowAddChoiceInput(false);
    setIsSizingVersionOpen(false);
  };

  const handleDeleteChoice = (choiceId: any, e: any) => {
    e.stopPropagation();
    confirm({
      title: t('common.delete'),
      message: t('common.confirmDelete'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      onConfirm: () => doDeleteChoice(choiceId),
    });
  };
  const doDeleteChoice = (choiceId: any) => {
    setSizingChoices((prev: any) => {
      const remaining = prev.filter((c: any) => c.id !== choiceId);
      // If deleting the selected choice, switch to first remaining
      if (sizingVersion === choiceId && remaining.length > 0) {
        setSizingVersion(remaining[0].id);
      }
      // If deleting the final choice, make the first one final
      if (remaining.length > 0 && !remaining.some((c: any) => c.isFinal)) {
        remaining[0].isFinal = true;
      }
      return remaining;
    });
  };

  const selectedSkuVersion = skuVersions.find((v: any) => v.id === skuVersion) || skuVersions[0];
  const selectedSizingChoice = sizingChoices.find((c: any) => c.id === sizingVersion) || sizingChoices[0];

  // Computed labels for collapsed bar badges
  const budgetDisplayName = useMemo(() => {
    if (budgetFilter === 'all') return 'All Budgets';
    const b = apiBudgets.find((b: any) => b.id === budgetFilter || b.budgetName === budgetFilter);
    return b?.budgetName || budgetFilter;
  }, [budgetFilter, apiBudgets]);

  const currentVersionLabel = useMemo(() => {
    return selectedSkuVersion ? `${selectedSkuVersion.name}${selectedSkuVersion.isFinal ? ' \u2B50' : ''}` : skuVersion;
  }, [selectedSkuVersion, skuVersion]);

  const currentChoiceLabel = useMemo(() => {
    return selectedSizingChoice ? `${selectedSizingChoice.name}${selectedSizingChoice.isFinal ? ' \u2B50' : ''}` : sizingVersion;
  }, [selectedSizingChoice, sizingVersion]);

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
      // Use category name to match SKU data (case-insensitive)
      if (skuContext.category?.name) {
        setCategoryFilter(skuContext.category.name.toLowerCase());
      }
      // Use subCategory name to match SKU data (case-insensitive)
      if (skuContext.subCategory?.name) {
        setSubCategoryFilter(skuContext.subCategory.name.toLowerCase());
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
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Add SKU Modal state
  const [addSkuModal, setAddSkuModal] = useState<{ open: boolean; blockKey: string; block: any } | null>(null);

  const [sizingData, setSizingData] = useState<Record<string, any>>({});

  const getDefaultSizing = () => {
    const defaults: Record<string, any> = {
      choiceA: { s0002: 2, s0004: 4, s0006: 3, s0008: 2 },
      choiceB: { s0002: 1, s0004: 3, s0006: 3, s0008: 2 },
      choiceC: { s0002: 1, s0004: 2, s0006: 2, s0008: 1 },
    };
    // Add empty sizing for any custom choices
    sizingChoices.forEach((c: any) => {
      const key = choiceIdToKey(c.id);
      if (!defaults[key]) defaults[key] = { s0002: 0, s0004: 0, s0006: 0, s0008: 0 };
    });
    return defaults;
  };

  const choiceIdToKey = (id: string) => {
    if (id === 'choice-a') return 'choiceA';
    if (id === 'choice-b') return 'choiceB';
    if (id === 'choice-c') return 'choiceC';
    return id; // custom choices use their ID as key
  };

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

  // Check if sizing is complete for a given SKU item (any final choice has non-zero quantities)
  const isSizingComplete = (blockKey: any, itemIdx: any) => {
    const sizing = getSizing(blockKey, itemIdx);
    const finalChoice = sizingChoices.find((c: any) => c.isFinal);
    if (!finalChoice) return false;
    const choiceKey = choiceIdToKey(finalChoice.id);
    const choiceData = sizing[choiceKey];
    if (!choiceData) return false;
    return Object.values(choiceData).some((v: any) => (parseInt(v) || 0) > 0);
  };

  // Count sizing completion for a block
  const getSizingCount = (blockKey: any, items: any[]) => {
    let completed = 0;
    items.forEach((_: any, idx: number) => {
      if (isSizingComplete(blockKey, idx)) completed++;
    });
    return { completed, total: items.length };
  };

  const handleOpenLightbox = (key: string, tab: 'details' | 'storeOrder' | 'sizing', item: any, blockKey: string, idx: number, block: any) => {
    setLightbox({ open: true, key, tab, item, blockKey, idx, block });
  };

  const handleCloseLightbox = () => {
    setLightbox(null);
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
      .filter((s: any) => genderFilter === 'all' || s.gender.toLowerCase() === genderFilter.toLowerCase())
      .map((s: any) => s.category)
      .filter(Boolean);
    const fromMaster = masterCategories.map((c: any) => (c.name || c.code || '').toLowerCase()).filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, skuBlocks, masterCategories]);

  const subCategoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter((s: any) => (genderFilter === 'all' || s.gender.toLowerCase() === genderFilter.toLowerCase())
        && (categoryFilter === 'all' || s.category.toLowerCase() === categoryFilter.toLowerCase()))
      .map((s: any) => s.subCategory)
      .filter(Boolean);
    // Also extract sub-categories from master data
    const fromMaster = masterCategories
      .flatMap((c: any) => (c.subCategories || []).map((sc: any) => (sc.name || sc.code || '').toLowerCase()))
      .filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, categoryFilter, skuBlocks, masterCategories]);

  const filteredSkuBlocks = useMemo(() => {
    return skuBlocks.filter((block: any) => {
      if (genderFilter !== 'all' && block.gender.toLowerCase() !== genderFilter.toLowerCase()) return false;
      if (categoryFilter !== 'all' && block.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (subCategoryFilter !== 'all' && block.subCategory.toLowerCase() !== subCategoryFilter.toLowerCase()) return false;
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

  // Export filtered SKU data to CSV
  const handleExportCSV = useCallback(() => {
    const rows = filteredSkuBlocks.flatMap((block: any) =>
      block.items.map((item: any) => ({
        skuCode: item.sku || '',
        productName: item.name || '',
        gender: block.gender || '',
        category: block.category || '',
        subCategory: block.subCategory || '',
        size: item.size || '',
        color: item.color || '',
        srp: item.srp || 0,
        orderQty: item.order || 0,
        totalValue: item.ttlValue || 0,
      }))
    );

    if (rows.length === 0) {
      toast.error(t('skuProposal.noDataToExport') || 'No data to export');
      return;
    }

    const headers = ['SKU Code', 'Product Name', 'Gender', 'Category', 'Sub-Category', 'Size', 'Color', 'SRP', 'Order Qty', 'Total Value'];

    const escapeCSV = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) =>
        [row.skuCode, row.productName, row.gender, row.category, row.subCategory, row.size, row.color, row.srp, row.orderQty, row.totalValue]
          .map(escapeCSV)
          .join(',')
      )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `DAFC_SKU_Proposal_${dateStr}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(t('skuProposal.exportSuccess') || `Exported ${rows.length} SKUs to ${filename}`);
  }, [filteredSkuBlocks, t]);

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

  const handleAddSkusFromModal = (blockKey: any, selectedSkus: any[]) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const newItems = selectedSkus.map((sku: any) => ({
        sku: sku.sku,
        name: sku.name,
        collectionName: sku.collectionName || '',
        color: sku.color || '',
        colorCode: sku.colorCode || '',
        division: sku.division || block.category || '',
        productType: sku.productType || block.subCategory || '',
        departmentGroup: sku.departmentGroup || '',
        fsr: sku.fsr || '',
        carryForward: sku.carryForward || 'NEW',
        composition: sku.composition || '',
        unitCost: sku.unitCost || 0,
        importTaxPct: sku.importTaxPct || 0,
        srp: sku.srp || 0,
        wholesale: sku.wholesale || 0,
        rrp: sku.rrp || 0,
        regionalRrp: sku.regionalRrp || 0,
        theme: sku.theme || '',
        size: sku.size || '',
        order: sku.order || 0,
        storeQty: sku.storeQty || {},
        ttlValue: sku.ttlValue || 0,
        customerTarget: sku.customerTarget || 'New',
        isNew: false,
      }));
      return { ...block, items: [...block.items, ...newItems] };
    }));
  };

  const handleDeleteSkuRow = (blockKey: any, itemIdx: any) => {
    confirm({
      title: t('common.delete'),
      message: t('common.confirmDelete'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      onConfirm: () => doDeleteSkuRow(blockKey, itemIdx),
    });
  };
  const doDeleteSkuRow = (blockKey: any, itemIdx: any) => {
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
      <div ref={barRef} data-filter-bar className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-1 md:mb-2 backdrop-blur-sm border-b relative ${
        darkMode ? 'bg-[#121212]/95 border-[#2E2E2E]' : 'bg-white/95 border-[rgba(215,183,151,0.3)]'
      }`}>

        {/* ===== FILTER CONTENT ===== */}
        <div>
        <div>
        <div className="p-2 md:p-3">
        <div className="flex flex-wrap items-center justify-between mb-2 gap-2">

          {/* Mobile Filter Button */}
          {isMobile && (
            <button
              onClick={openFilter}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${darkMode ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'}`}
            >
              <SlidersHorizontal size={16} />
              {t('common.filters')}
            </button>
          )}

        </div>

        {!isMobile && <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              <FilterSelect
                label={t('skuProposal.budget')}
                value={budgetFilter}
                options={budgetOptions.map((opt: any) => ({ value: opt.id, label: opt.label }))}
                onChange={setBudgetFilter}
                darkMode={darkMode}
                placeholder={t('common.all') || 'All'}
              />
              <FilterSelect
                label={t('skuProposal.seasonGroup')}
                value={seasonGroupFilter}
                options={SEASON_GROUPS.map((opt: any) => ({ value: opt.id, label: opt.label }))}
                onChange={setSeasonGroupFilter}
                darkMode={darkMode}
              />
              <FilterSelect
                label={t('skuProposal.season')}
                value={seasonFilter}
                options={SEASONS.map((opt: any) => ({ value: opt.id, label: opt.label }))}
                onChange={setSeasonFilter}
                darkMode={darkMode}
              />
              <FilterSelect
                label={t('skuProposal.gender')}
                value={genderFilter}
                options={genderOptions.map((g: any) => ({ value: g, label: g === 'all' ? 'All' : g }))}
                onChange={setGenderFilter}
                darkMode={darkMode}
              />
              <FilterSelect
                label={t('skuProposal.category')}
                value={categoryFilter}
                options={categoryOptions.map((c: any) => ({ value: c, label: c === 'all' ? 'All' : c }))}
                onChange={setCategoryFilter}
                darkMode={darkMode}
              />
              <FilterSelect
                label={t('skuProposal.subCategory')}
                value={subCategoryFilter}
                options={subCategoryOptions.map((s: any) => ({ value: s, label: s === 'all' ? 'All' : s }))}
                onChange={setSubCategoryFilter}
                darkMode={darkMode}
              />
        </div>}

        {/* Versions + View Mode - Single Row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* SKU Version Dropdown */}
              <div className="relative" ref={skuVersionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSkuVersionOpen(!isSkuVersionOpen)}
                  className={`flex items-center gap-2 px-4 py-1 rounded-lg text-sm font-medium transition-all border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.15)]'
                      : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#333333] hover:bg-[rgba(160,120,75,0.18)]'
                  }`}
                >
                  {selectedSkuVersion?.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />}
                  <span>{selectedSkuVersion?.name || t('common.version')}</span>
                  {selectedSkuVersion?.isFinal && (
                    <>
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A]' : 'bg-[#D7B797] text-white'}`}>FINAL</span>
                      {/* UX-13: isFinal is local-only state, not persisted to backend */}
                      <span className={`text-[9px] italic ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>(Local Only)</span>
                    </>
                  )}
                  <ChevronDown size={14} className={`transition-transform ${isSkuVersionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSkuVersionOpen && (
                  <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full rounded-xl shadow-xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'}`}>
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

            {/* Divider */}
            <div className={`h-6 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[rgba(215,183,151,0.3)]'}`} />

            {/* Sizing Choice Dropdown */}
              <div className="relative" ref={sizingVersionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSizingVersionOpen(!isSizingVersionOpen)}
                  className={`flex items-center gap-2 px-4 py-1 rounded-lg text-sm font-medium transition-all border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.15)]'
                      : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#333333] hover:bg-[rgba(160,120,75,0.18)]'
                  }`}
                >
                  {selectedSizingChoice?.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />}
                  <span>{selectedSizingChoice?.name || t('skuProposal.sizing')}</span>
                  {selectedSizingChoice?.isFinal && (
                    <>
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A]' : 'bg-[#D7B797] text-white'}`}>FINAL</span>
                      {/* UX-13: isFinal is local-only state, not persisted to backend */}
                      <span className={`text-[9px] italic ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>(Local Only)</span>
                    </>
                  )}
                  <ChevronDown size={14} className={`transition-transform ${isSizingVersionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSizingVersionOpen && (
                  <div className={`absolute top-full left-0 mt-1 min-w-[260px] rounded-xl shadow-xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'}`}>
                    {sizingChoices.map((choice: any) => (
                      <div
                        key={choice.id}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                          choice.id === sizingVersion
                            ? darkMode ? 'bg-[rgba(215,183,151,0.1)] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[#E8E0D8]'
                            : darkMode ? 'hover:bg-[rgba(255,255,255,0.03)] border-[#2E2E2E]' : 'hover:bg-gray-50 border-[#E8E0D8]'
                        }`}
                        onClick={() => { setSizingVersion(choice.id); setIsSizingVersionOpen(false); }}
                      >
                        <span className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{choice.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (!choice.isFinal) handleSetFinalSizing(choice.id, e); }}
                            className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                              choice.isFinal
                                ? darkMode ? 'bg-[#D7B797] text-[#0A0A0A] border-[#D7B797]' : 'bg-[#333333] text-white border-[#333333]'
                                : darkMode ? 'bg-transparent text-[#999999] border-[#444444] hover:border-[#D7B797] hover:text-[#D7B797]' : 'bg-transparent text-[#666666] border-[#C4B5A5] hover:border-[#333333] hover:text-[#333333]'
                            }`}
                          >
                            Final
                          </button>
                          {sizingChoices.length > 1 && !choice.isFinal && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteChoice(choice.id, e); }}
                              className="p-1 rounded transition-colors text-red-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Add new choice */}
                    {showAddChoiceInput ? (
                      <div className={`px-4 py-3 border-t flex items-center gap-2 ${darkMode ? 'border-[#2E2E2E]' : 'border-[#E8E0D8]'}`}>
                        <input
                          type="text"
                          autoFocus
                          value={newChoiceName}
                          onChange={(e) => setNewChoiceName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddChoice(); if (e.key === 'Escape') { setShowAddChoiceInput(false); setNewChoiceName(''); } }}
                          placeholder="Choice name..."
                          className={`flex-1 px-3 py-1.5 text-sm rounded-lg border outline-none ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] placeholder:text-[#666666]' : 'bg-gray-50 border-[#C4B5A5] text-gray-800 placeholder:text-gray-400'}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleAddChoice(); }}
                          disabled={!newChoiceName.trim()}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${newChoiceName.trim() ? (darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A682]' : 'bg-[#333333] text-white hover:bg-[#222222]') : 'opacity-30 cursor-not-allowed bg-gray-300 text-gray-500'}`}
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowAddChoiceInput(true); }}
                        className={`w-full px-4 py-3 text-sm font-medium text-center border-t transition-colors ${
                          darkMode ? 'border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:text-[#D7B797]' : 'border-[#E8E0D8] text-[#666666] hover:bg-gray-50 hover:text-[#333333]'
                        }`}
                      >
                        Add new choice
                      </button>
                    )}
                  </div>
                )}
              </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* SKU Count + Export + View Mode Toggle */}
            <div className="flex items-center gap-3">
              {/* SKU count removed — visible in rail section */}
              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                title={t('skuProposal.exportCSV') || 'Export CSV'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  darkMode
                    ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]'
                    : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'
                }`}
              >
                <Download size={14} />
                <span className="hidden sm:inline">{t('skuProposal.export') || 'Export'}</span>
              </button>
              <div className={`flex items-center gap-1 rounded-lg p-0.5 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
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
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
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

        {/* Rail Controls — sticky inside filter bar (visible in EXPANDED only) */}
        {viewMode === 'table' && filteredSkuBlocks.length > 0 && (
          <div className={`border-t -mx-2 md:-mx-3 -mb-2 md:-mb-3 px-2 md:px-3 mt-2 py-2 md:py-3 flex flex-wrap items-center justify-between gap-y-2 ${darkMode ? 'border-[#2E2E2E]' : 'border-[rgba(215,183,151,0.3)]'}`}>
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
        )}
        </div>{/* end p-2 md:p-3 */}
        </div>{/* end overflow-hidden min-h-0 */}
        </div>{/* end grid animation wrapper */}
      </div>

      {!skuDataLoading && skuCatalog.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
          <Package size={36} className={`mx-auto mb-3 ${darkMode ? 'text-[#666666]' : 'text-[rgba(215,183,151,0.5)]'}`} />
          <p className={`font-medium font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>No SKU Catalog</p>
          <p className={`text-sm mt-1 mb-3 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Import SKU data first to begin creating proposals</p>
          <button
            onClick={() => router.push('/import-data')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-['Montserrat'] transition-colors ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A584]' : 'bg-[#C4A77D] text-white hover:bg-[#B8956D]'}`}
          >
            Go to Import
          </button>
        </div>
      ) : filteredSkuBlocks.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
          <Package size={36} className={`mx-auto mb-3 ${darkMode ? 'text-[#666666]' : 'text-[rgba(215,183,151,0.5)]'}`} />
          <p className={`font-medium font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{t('skuProposal.noSkuData')}</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Try adjusting the filters above</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSkuItems.map(({ block, blockKey, item, idx, key }, cardIdx) => {
            return (
              <div key={key} className={`rounded-2xl border p-4 ${getCardBgClass(cardIdx)}`}>
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <ProductImage subCategory={block.subCategory} sku={item.sku} size={48} darkMode={darkMode} rounded="rounded-xl" />
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
                      onClick={() => handleOpenLightbox(key, 'details', item, blockKey, idx, block)}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {t('skuProposal.showDetails')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(key, 'storeOrder', item, blockKey, idx, block)}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {t('skuProposal.storeOrder')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(key, 'sizing', item, blockKey, idx, block)}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {t('skuProposal.sizing')}
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
              </div>
            );
          })}

          {/* Add SKU Card */}
          {filteredSkuBlocks.length > 0 && (
            <button
              onClick={() => {
                const firstBlock = filteredSkuBlocks[0];
                const blockKey = `${firstBlock.gender}_${firstBlock.category}_${firstBlock.subCategory}`;
                setAddSkuModal({ open: true, blockKey, block: firstBlock });
              }}
              className={`rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-colors duration-200 ${
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
          {filteredSkuBlocks.map((block: any) => {
            const key = `${block.gender}_${block.category}_${block.subCategory}`;
            const isCollapsed = collapsed[key];
            return (
              <div key={key} data-rail-card className={`rounded-xl border ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`} style={{ overflow: 'clip' }}>
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
                        {(() => {
                          const { completed, total } = getSizingCount(key, block.items);
                          return completed > 0 ? (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              completed === total
                                ? 'bg-[#127749]/15 text-[#2A9E6A]'
                                : 'bg-[#D97706]/15 text-[#D97706]'
                            }`}>
                              {completed}/{total} sized
                            </span>
                          ) : null;
                        })()}
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

                {!isCollapsed && (<>
                  <div className="overflow-x-auto" data-table-wrapper style={{ overflowY: 'clip' }}>
                    {(() => {
                      const hlBg = darkMode ? 'bg-[rgba(215,183,151,0.12)]' : 'bg-[rgba(160,120,75,0.1)]';
                      const hlLabel = darkMode ? 'bg-[#1f1a14]' : 'bg-[#ede4d8]';
                      const normLabel = darkMode ? 'bg-[#121212]' : 'bg-white';
                      const labelBase = `px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 cursor-pointer select-none transition-colors`;
                      const labelBorder = darkMode ? '!border-r-[#555]' : '!border-r-[rgba(160,120,75,0.4)]';
                      const labelColor = darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]';
                      const isHl = (rowId: string) => highlightedRow === `${key}_${rowId}`;
                      const toggleHl = (rowId: string) => setHighlightedRow(prev => prev === `${key}_${rowId}` ? null : `${key}_${rowId}`);
                      const trCls = (rowId: string, extra?: string) => `${isHl(rowId) ? hlBg : ''} ${extra || ''}`;
                      const tdLabel = (rowId: string, extra?: string) => `${labelBase} ${labelColor} ${isHl(rowId) ? hlLabel : normLabel} ${labelBorder} ${extra || ''}`;
                      return (
                    <table className={`w-full text-xs border-separate border-spacing-0 ${darkMode ? '[&_td]:border-[#2E2E2E]' : '[&_td]:border-[rgba(215,183,151,0.2)]'} [&_td]:border`}>
                      <tbody>
                        {/* Image row */}
                        <tr className={trCls('image')}>
                          <td className={tdLabel('image', 'py-2')} onClick={() => toggleHl('image')}>Image</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-2 text-center min-w-[140px] ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
                              <div className="mx-auto w-fit">
                                <ProductImage subCategory={block.subCategory} sku={item.sku} size={64} darkMode={darkMode} />
                              </div>
                            </td>
                          ))}
                        </tr>
                        {/* SKU row */}
                        <tr className={trCls('sku')}>
                          <td className={tdLabel('sku')} onClick={() => toggleHl('sku')}>SKU</td>
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
                        <tr className={trCls('name')}>
                          <td className={tdLabel('name')} onClick={() => toggleHl('name')}>Name</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.name}</td>
                          ))}
                        </tr>
                        {/* Product Type (L3) row */}
                        <tr className={trCls('productType')}>
                          <td className={tdLabel('productType')} onClick={() => toggleHl('productType')}>Product Type (L3)</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.productType}</td>
                          ))}
                        </tr>
                        {/* Theme row */}
                        <tr className={trCls('theme')}>
                          <td className={tdLabel('theme')} onClick={() => toggleHl('theme')}>Theme</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.theme}</td>
                          ))}
                        </tr>
                        {/* Color row */}
                        <tr className={trCls('color')}>
                          <td className={tdLabel('color')} onClick={() => toggleHl('color')}>Color</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.color}</td>
                          ))}
                        </tr>
                        {/* Composition row */}
                        <tr className={trCls('composition')}>
                          <td className={tdLabel('composition')} onClick={() => toggleHl('composition')}>Composition</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center max-w-[160px] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`} title={item.composition}>{item.composition}</td>
                          ))}
                        </tr>
                        {/* Unit cost row */}
                        <tr className={trCls('unitCost')}>
                          <td className={tdLabel('unitCost')} onClick={() => toggleHl('unitCost')}>Unit cost</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{formatCurrency(item.unitCost)}</td>
                          ))}
                        </tr>
                        {/* SRP row */}
                        <tr className={trCls('srp')}>
                          <td className={tdLabel('srp')} onClick={() => toggleHl('srp')}>SRP</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.srp)}</td>
                          ))}
                        </tr>
                        {/* Order row - always highlighted + click highlight */}
                        <tr className={trCls('order', darkMode ? 'bg-[rgba(215,183,151,0.06)]' : 'bg-[rgba(160,120,75,0.06)]')}>
                          <td className={`${labelBase} font-bold cursor-pointer select-none transition-colors ${labelBorder} ${darkMode ? 'text-[#D7B797]' : 'text-[#c0392b]'} ${isHl('order') ? hlLabel : (darkMode ? 'bg-[#1a1714]' : 'bg-[#f5efe8]')}`} onClick={() => toggleHl('order')}>Order</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#c0392b]'}`}>{item.order}</td>
                          ))}
                        </tr>
                        {/* Dynamic store rows */}
                        {stores.map((st: any) => (
                          <tr key={st.code} className={trCls(`store_${st.code}`)}>
                            <td className={tdLabel(`store_${st.code}`)} onClick={() => toggleHl(`store_${st.code}`)}>{st.code}</td>
                            {block.items.map((item: any, idx: number) => {
                              const storeKey = `${key}|${idx}|store_${st.code}`;
                              const isEditingStore = editingCell === storeKey;
                              const storeVal = (item.storeQty || {})[st.code] || 0;
                              return (
                                <td key={idx} className="px-3 py-1.5 text-center">
                                  {isEditingStore ? (
                                    <div className="relative group inline-block">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => handleSaveEdit(storeKey)}
                                        onKeyDown={(e) => handleKeyDown(e, storeKey)}
                                        className={`w-14 pl-4 py-0.5 text-center border-2 rounded-md text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'border-[#D7B797] bg-[#121212] text-[#F2F2F2]' : 'border-[#D7B797] bg-white text-[#333333]'}`}
                                        autoFocus
                                      />
                                      <Pencil size={8} className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A6340]/30" />
                                    </div>
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
                        {/* TTL value row - always highlighted + click highlight */}
                        <tr className={trCls('ttlValue', darkMode ? 'bg-[rgba(215,183,151,0.06)]' : 'bg-[rgba(160,120,75,0.06)]')}>
                          <td className={`${labelBase} font-bold cursor-pointer select-none transition-colors ${labelBorder} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} ${isHl('ttlValue') ? hlLabel : (darkMode ? 'bg-[#1a1714]' : 'bg-[#f5efe8]')}`} onClick={() => toggleHl('ttlValue')}>TTL value</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.ttlValue || (item.order * (item.srp || 0)))}</td>
                          ))}
                        </tr>
                        {/* Customer Target row */}
                        <tr className={trCls('customerTarget')}>
                          <td className={tdLabel('customerTarget')} onClick={() => toggleHl('customerTarget')}>Customer Target</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1.5 text-center">
                              <CreatableSelect
                                value={item.customerTarget}
                                options={customerTargetOptions}
                                onChange={(val) => handleSelectChange(key, idx, 'customerTarget', val)}
                                onCreateOption={(val) => setCustomerTargetOptions(prev => [...prev, val])}
                                placeholder="Target..."
                                darkMode={darkMode}
                              />
                            </td>
                          ))}
                        </tr>
                        {/* Actions row */}
                        <tr>
                          <td className={`px-3 py-1.5 sticky left-0 z-10 ${darkMode ? 'bg-[#121212] !border-r-[#555]' : 'bg-white !border-r-[rgba(160,120,75,0.4)]'}`}></td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={() => handleOpenLightbox(`${key}_${item.sku || 'new'}_${idx}`, 'sizing', item, key, idx, block)} className={`p-1 rounded-md transition-colors relative ${darkMode ? 'text-[#999999] hover:text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#666666] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`} title="Sizing">
                                  <Ruler size={14} />
                                  {isSizingComplete(key, idx) && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#2A9E6A] rounded-full flex items-center justify-center">
                                      <Check size={8} className="text-white" />
                                    </span>
                                  )}
                                </button>
                                <button type="button" onClick={() => handleDeleteSkuRow(key, idx)} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-[#999999] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#666666] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'}`} title={t('proposal.deleteSku')}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                      );
                    })()}
                  </div>
                  {/* Add new SKU button — outside scroll container */}
                  <div className={`border-t border-dashed px-3 py-2 ${darkMode ? 'border-[#2E2E2E] bg-[rgba(215,183,151,0.03)]' : 'border-[rgba(215,183,151,0.3)] bg-[rgba(215,183,151,0.03)]'}`}>
                    <button
                      type="button"
                      onClick={() => setAddSkuModal({ open: true, blockKey: key, block })}
                      className={`w-full flex items-center justify-center gap-2 py-1 text-xs rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:text-[#D7B797]' : 'text-[#666666] hover:text-[#6B4D30]'}`}
                    >
                      <Plus size={14} />
                      <span>{t('skuProposal.addNewSku')}</span>
                    </button>
                  </div>
                </>)}
              </div>
            );
          })}

          {/* Sticky Grand Total Bar */}
          {filteredSkuBlocks.length > 0 && (
            <div className={`sticky bottom-0 z-30 rounded-xl border overflow-hidden backdrop-blur-sm ${darkMode ? 'bg-[#121212]/95 border-[#D7B797]/30' : 'bg-white/95 border-[#D7B797]/40'}`}>
              <div className="flex items-center gap-0">
                <div className={`w-1.5 self-stretch ${darkMode ? 'bg-[#2A9E6A]' : 'bg-[#127749]'}`} />
                <div className="flex flex-wrap items-center flex-1 px-4 py-2.5 gap-3">
                  <span className={`text-xs font-semibold font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
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
                      <span className={`text-[10px] font-['Montserrat'] uppercase tracking-wider ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Total Value</span>
                      <span className={`font-bold text-lg font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#C4A77D]'}`}>{formatCurrency(grandTotals.ttlValue)}</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={() => {
                        if (onSubmitTicket) {
                          onSubmitTicket({ budgetId: budgetFilter !== 'all' ? budgetFilter : '', skuBlocks: filteredSkuBlocks, grandTotals, stores });
                        } else {
                          router.push(`/tickets?source=proposal&budgetId=${budgetFilter !== 'all' ? budgetFilter : ''}`);
                        }
                      }}
                      disabled={grandTotals.order === 0}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-['Montserrat'] transition-colors ${
                        grandTotals.order > 0
                          ? darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A584]' : 'bg-[#C4A77D] text-white hover:bg-[#B8956D]'
                          : darkMode ? 'bg-[#2E2E2E] text-[#666666] cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Send size={16} />
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SKU Lightbox Modal — Portal to body for full-screen blur */}
      {lightbox && lightbox.open && lightbox.item && createPortal(
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) handleCloseLightbox(); }}>
          <div ref={lightboxRef} className={`rounded-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col border ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'}`} style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4), 0 10px 30px -8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${darkMode ? 'bg-[rgba(215,183,151,0.1)] border-b border-[rgba(215,183,151,0.2)]' : 'bg-[rgba(160,120,75,0.18)] border-b border-[rgba(215,183,151,0.3)]'}`}>
              <div className="flex items-center gap-3">
                <ProductImage subCategory={lightbox.block?.subCategory || ''} sku={lightbox.item.sku} size={40} darkMode={darkMode} rounded="rounded-xl" />
                <div>
                  <h3 className={`text-base font-bold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                    <span className="font-['JetBrains_Mono']">{lightbox.item.sku}</span> - {lightbox.item.name}
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#6B5B4D]'}`}>
                    {lightbox.block?.gender} {lightbox.block?.category && `• ${lightbox.block.category}`} {lightbox.block?.subCategory && `• ${lightbox.block.subCategory}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseLightbox}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.15)]' : 'hover:bg-[rgba(215,183,151,0.2)]'}`}
              >
                <X size={20} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
              </button>
            </div>

            {/* Tab Buttons */}
            <div className={`flex border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[rgba(215,183,151,0.3)]'}`}>
              {([['details', t('skuProposal.showDetails')], ['storeOrder', t('skuProposal.storeOrder')], ['sizing', t('skuProposal.sizing')]] as const).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setLightbox(prev => prev ? { ...prev, tab: tabId as 'details' | 'storeOrder' | 'sizing' } : null)}
                  className={`flex-1 px-4 py-2.5 text-xs font-semibold font-['Montserrat'] transition-colors relative ${
                    lightbox.tab === tabId
                      ? darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
                      : darkMode ? 'text-[#666666] hover:text-[#999999]' : 'text-[#999999] hover:text-[#666666]'
                  }`}
                >
                  {label}
                  {lightbox.tab === tabId && (
                    <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${darkMode ? 'bg-[#D7B797]' : 'bg-[#6B4D30]'}`} />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto flex-1 p-4 md:p-6">
              {/* Details Tab */}
              {lightbox.tab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Product type</span>
                    <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{lightbox.item.productType}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Theme</span>
                    <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{lightbox.item.theme}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Color</span>
                    <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{lightbox.item.color}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Composition</span>
                    <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{lightbox.item.composition}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Unit cost</span>
                    <div className={`font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{formatCurrency(lightbox.item.unitCost)}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>SRP</span>
                    <div className={`font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(lightbox.item.srp)}</div>
                  </div>
                  <div>
                    <CreatableSelect
                      value={lightbox.item.customerTarget}
                      options={customerTargetOptions}
                      onChange={(val) => handleSelectChange(lightbox.blockKey, lightbox.idx, 'customerTarget', val)}
                      onCreateOption={(val) => setCustomerTargetOptions(prev => [...prev, val])}
                      placeholder="Select target..."
                      darkMode={darkMode}
                      label="Customer target"
                    />
                  </div>
                </div>
              )}

              {/* Store Order Tab */}
              {lightbox.tab === 'storeOrder' && (
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className={darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-[rgba(160,120,75,0.12)] text-[#666666]'}>
                        <th className="px-4 py-2 text-left">Store</th>
                        <th className="px-4 py-2 text-center font-['JetBrains_Mono']">ORDER</th>
                        <th className="px-4 py-2 text-right font-['JetBrains_Mono']">TTL VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((st: any, si: number) => {
                        const storeVal = (lightbox.item.storeQty || {})[st.code] || 0;
                        const colors = ['bg-[#D7B797]', 'bg-[#127749]', 'bg-[#58A6FF]', 'bg-[#A371F7]', 'bg-[#E3B341]'];
                        return (
                          <tr key={st.code} className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
                            <td className={`px-4 py-2 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>
                              <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${colors[si % colors.length]}`} />{st.code}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="relative group inline-block">
                                <input
                                  type="number"
                                  min="0"
                                  value={storeVal}
                                  onChange={(e) => handleNumberChange(lightbox.blockKey, lightbox.idx, `store_${st.code}`, e.target.value)}
                                  className={`w-20 pl-5 text-center font-['JetBrains_Mono'] text-sm rounded-lg border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${
                                    darkMode
                                      ? 'bg-[#121212] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] focus:border-[#D7B797]'
                                      : 'bg-white border-[rgba(215,183,151,0.4)] text-gray-800 focus:border-[#D7B797]'
                                  }`}
                                />
                                <Pencil size={8} className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A6340]/30" />
                              </div>
                            </td>
                            <td className={`px-4 py-2 text-right font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(storeVal * (lightbox.item.srp || 0))}</td>
                          </tr>
                        );
                      })}
                      <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30 bg-[rgba(215,183,151,0.05)]' : 'border-[#D7B797]/40 bg-[rgba(160,120,75,0.12)]'}`}>
                        <td className={`px-4 py-2 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{t('skuProposal.total')}</td>
                        <td className={`px-4 py-2 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{lightbox.item.order || 0}</td>
                        <td className={`px-4 py-2 text-right font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(lightbox.item.ttlValue || (lightbox.item.order || 0) * (lightbox.item.srp || 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sizing Tab */}
              {lightbox.tab === 'sizing' && (
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className={darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.2)] text-[#6B4D30]'}>
                        <th className="px-4 py-2 text-left font-semibold font-['Montserrat']">{lightbox.item.productType}</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0002</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0004</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0006</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0008</th>
                        <th className={`px-4 py-2 text-center font-semibold font-['Montserrat'] ${darkMode ? 'bg-[rgba(215,183,151,0.2)]' : 'bg-[rgba(215,183,151,0.25)]'}`}>Sum</th>
                      </tr>
                    </thead>
                    <tbody className={darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}>
                      <tr className={darkMode ? 'border-b border-[#2E2E2E] bg-[#1A1A1A]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.08)]'}>
                        <td className={`px-4 py-2 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>% Sales mix</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">6%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">33%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">33%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">28%</td>
                        <td className={`px-4 py-2 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>100%</td>
                      </tr>
                      <tr className={darkMode ? 'border-b border-[#2E2E2E]' : 'border-b border-[rgba(215,183,151,0.2)]'}>
                        <td className={`px-4 py-2 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>% ST</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">50%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">43%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">30%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">63%</td>
                        <td className={`px-4 py-2 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666] bg-[rgba(215,183,151,0.08)]' : 'text-[#999999] bg-[rgba(160,120,75,0.12)]'}`}>-</td>
                      </tr>
                      {sizingChoices.map((choice: any, ci: number) => {
                        const key = choiceIdToKey(choice.id);
                        const sizing = getSizing(lightbox.blockKey, lightbox.idx);
                        const choiceData = sizing[key] || { s0002: 0, s0004: 0, s0006: 0, s0008: 0 };
                        const isFirst = ci === 0;
                        return (
                          <tr key={choice.id} className={isFirst
                            ? (darkMode ? 'border-b border-[#2E2E2E] bg-[rgba(215,183,151,0.08)]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.12)]')
                            : (darkMode ? 'border-b border-[#2E2E2E] bg-[rgba(42,158,106,0.05)]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.03)]')
                          }>
                            <td className={`px-4 py-2 font-medium ${isFirst ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : (darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]')}`}>
                              {choice.name}:{choice.isFinal && <span className="ml-1 text-[10px] font-bold text-[#2A9E6A]">FINAL</span>}
                            </td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={choiceData[size] ?? 0}
                                  onChange={(e) => updateSizing(lightbox.blockKey, lightbox.idx, key, size, e.target.value)}
                                  className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${
                                    isFirst
                                      ? (darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#D7B797]' : 'bg-emerald-50 border-emerald-200 text-[#6B4D30]')
                                      : (darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]')
                                  }`}
                                />
                              </td>
                            ))}
                            <td className={`px-4 py-2 text-center font-semibold font-['JetBrains_Mono'] ${isFirst ? (darkMode ? 'text-[#D7B797] bg-[rgba(215,183,151,0.15)]' : 'text-[#6B4D30] bg-[rgba(215,183,151,0.2)]') : (darkMode ? 'text-[#2A9E6A] bg-[rgba(42,158,106,0.1)]' : 'text-[#127749] bg-[rgba(18,119,73,0.08)]')}`}>{calculateSum(choiceData)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-3 flex justify-end gap-3 border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-[rgba(215,183,151,0.3)]'}`}>
              <button
                onClick={handleCloseLightbox}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:bg-[rgba(215,183,151,0.1)] hover:text-[#D7B797]' : 'text-[#666666] hover:bg-[rgba(160,120,75,0.12)] hover:text-[#6B4D30]'}`}
              >
                Close
              </button>
              <button
                onClick={handleCloseLightbox}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A584]' : 'bg-[#D7B797] text-[#333333] hover:bg-[#C4A584]'}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
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
      <ConfirmDialog darkMode={darkMode} {...dialogProps} />

      {/* Add SKU Modal */}
      {addSkuModal && (
        <AddSKUModal
          isOpen={addSkuModal.open}
          onClose={() => setAddSkuModal(null)}
          skuCatalog={skuCatalog}
          blockGender={addSkuModal.block?.gender}
          blockCategory={addSkuModal.block?.category}
          blockSubCategory={addSkuModal.block?.subCategory}
          existingSkus={
            skuBlocks
              .find((b: any) => `${b.gender}_${b.category}_${b.subCategory}` === addSkuModal.blockKey)
              ?.items.map((i: any) => i.sku).filter(Boolean) || []
          }
          onAddSkus={(skus) => handleAddSkusFromModal(addSkuModal.blockKey, skus)}
          darkMode={darkMode}
          stores={stores}
          customerTargetOptions={customerTargetOptions}
          onCreateCustomerTarget={(val) => setCustomerTargetOptions(prev => [...prev, val])}
        />
      )}
    </div>
  );
};

export default SKUProposalScreen;
