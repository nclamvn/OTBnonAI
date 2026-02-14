'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft, Save, TrendingUp, Layers, Users, Tag, Info, Pencil,
  ChevronDown, Check, CheckCircle2, History, Clock, Sparkles, X,
  Calendar, User, MessageSquare, AlertCircle, CheckCircle, XCircle,
  Send, FileText, DollarSign
} from 'lucide-react';
import { formatCurrency } from '../../../utils';
import { GENDERS, STORES } from '../../../utils/constants';
import { masterDataService, planningService, approvalService } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

const TABS = [
  { id: 'collection', label: 'Collection', icon: Layers },
  { id: 'gender', label: 'Gender', icon: Users },
  { id: 'category', label: 'Category', icon: Tag }
];

// Reusable editable cell component
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
          className={`w-20 px-2 py-0.5 text-center border-2 rounded-lg focus:outline-none focus:ring-2 font-medium transition-all ${darkMode ? 'border-[#D7B797] focus:ring-[#D7B797]/50 bg-[#1A1A1A] text-[#F2F2F2]' : 'border-blue-500 focus:ring-blue-400 bg-white text-slate-700'}`}
          autoFocus
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center">
        <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-lg min-w-[70px] justify-center ${darkMode ? 'bg-[#1A1A1A] border border-[#2E2E2E]' : 'bg-slate-100 border border-slate-200'}`}>
          <span className={`font-medium ${darkMode ? 'text-[#999999]' : 'text-slate-600'}`}>{typeof value === 'number' ? value.toFixed(0) : value}%</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onStartEdit(cellKey, value)}
      className="group flex items-center justify-center gap-1 cursor-pointer"
      title={t ? t('planningDetail.clickToEdit') : 'Click to edit'}
    >
      <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-lg transition-all min-w-[70px] justify-center ${darkMode ? 'bg-[rgba(215,183,151,0.15)] border border-[rgba(215,183,151,0.3)] hover:bg-[rgba(215,183,151,0.25)] hover:border-[rgba(215,183,151,0.5)]' : 'bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'}`}>
        <span className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-slate-700'}`}>{typeof value === 'number' ? value.toFixed(0) : value}%</span>
        <Pencil size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-[#D7B797]' : 'text-blue-400'}`} />
      </div>
    </div>
  );
});

// Approval Status Badge Component
const ApprovalStatusBadge = ({ status }: any) => {
  const statusConfig: Record<string, any> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, labelKey: 'pending' },
    approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, labelKey: 'approved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, labelKey: 'rejected' },
    waiting: { bg: 'bg-slate-100', text: 'text-slate-500', icon: AlertCircle, labelKey: 'waiting' }
  };

  const config = statusConfig[status] || statusConfig.waiting;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon size={12} />
      {config.labelKey.charAt(0).toUpperCase() + config.labelKey.slice(1)}
    </span>
  );
};

const PlanningDetailPage = ({
  selectedBudgetDetail: selectedBudgetDetailProp,
  planningDetailData: planningDetailDataProp,
  onBack,
  onSave,
  entityId,
  darkMode
}: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('collection');
  const [editingCell, setEditingCell] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState<Record<string, any>>({});

  // Fallback: fetch planning data by entityId if not passed via context
  const [fetchedBudgetDetail, setFetchedBudgetDetail] = useState<any>(null);
  const [fetchedPlanningData, setFetchedPlanningData] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (!selectedBudgetDetailProp && entityId) {
      const fetchPlanningById = async () => {
        setFetchLoading(true);
        try {
          const planning = await planningService.getOne(entityId);
          if (planning) {
            const bd = planning.budgetDetail || {};
            const budget = bd.budget || {};
            const store = bd.store || {};
            setFetchedBudgetDetail({
              id: planning.budgetDetailId || bd.id || entityId,
              budgetName: budget.budgetCode || planning.planningCode || 'Planning',
              totalAmount: bd.budgetAmount || budget.totalBudget || 0,
              storeName: store.name || '',
              storeCode: store.code || '',
              budget: budget,
            });
            setFetchedPlanningData(planning);
          }
        } catch (err: any) {
          // silently fail - page shows "no data"
        } finally {
          setFetchLoading(false);
        }
      };
      fetchPlanningById();
    }
  }, [selectedBudgetDetailProp, entityId]);

  const selectedBudgetDetail = selectedBudgetDetailProp || fetchedBudgetDetail;
  const planningDetailData = planningDetailDataProp || fetchedPlanningData;

  // Theme helpers
  const bgPage = darkMode ? 'bg-[#0A0A0A]' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30';
  const cardBg = darkMode ? 'bg-[#121212]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#2E2E2E]' : 'border-slate-200';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-slate-800';
  const textSecondary = darkMode ? 'text-[#999999]' : 'text-slate-600';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-slate-400';
  const headerBg = darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-gradient-to-r from-blue-600 to-blue-500';
  const headerText = darkMode ? 'text-[#F2F2F2]' : 'text-white';
  const subtleBg = darkMode ? 'bg-[#1A1A1A]' : 'bg-slate-50';
  const accentText = darkMode ? 'text-[#D7B797]' : 'text-blue-600';
  const btnPrimary = darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A682]' : 'bg-blue-600 text-white hover:bg-blue-700';
  const hoverBg = darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-slate-100';

  // API data states
  const [categoryStructure, setCategoryStructure] = useState<any[]>([]);
  const [level1Approvers, setLevel1Approvers] = useState<any[]>([]);
  const [level2Approvers, setLevel2Approvers] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  // Approval action states
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalProcessing, setApprovalProcessing] = useState(false);

  // Fetch categories and planning versions from API
  useEffect(() => {
    const fetchData = async () => {
      setApiLoading(true);
      try {
        // Fetch categories from API
        const categoriesRes = await masterDataService.getCategories().catch(() => []);
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);

        if (categories.length > 0) {
          // Transform API categories into categoryStructure format
          // API may return flat list or hierarchical — handle both
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

        // Fetch planning versions if budgetDetailId available
        if (selectedBudgetDetail?.id) {
          const versionsRes = await planningService.getAll({ budgetDetailId: selectedBudgetDetail.id }).catch(() => ({ data: [] }));
          const versionsList = Array.isArray(versionsRes) ? versionsRes : (versionsRes?.data || []);
          if (versionsList.length > 0) {
            const mappedVersions = versionsList.map((v: any, idx: any) => ({
              id: v.id,
              versionNumber: v.versionNumber || idx + 1,
              createdAt: v.createdAt,
              createdBy: v.createdBy || { name: 'User', avatar: 'U' },
              data: v.data || {},
              status: v.status?.toLowerCase() || 'draft',
              approvals: v.approvals || { level1: [], level2: [] }
            }));
            setVersions(mappedVersions);

            // Extract approvers from version approval data
            const allL1 = new Map();
            const allL2 = new Map();
            mappedVersions.forEach((ver: any) => {
              (ver.approvals?.level1 || []).forEach((a: any) => {
                if (a.approver && !allL1.has(a.approver.id || a.approverId)) {
                  allL1.set(a.approver.id || a.approverId, {
                    id: a.approver.id || a.approverId,
                    name: a.approver.name || a.approverName || 'Approver',
                    role: a.approver.role || 'Manager',
                    avatar: (a.approver.name || 'AP').substring(0, 2).toUpperCase()
                  });
                }
              });
              (ver.approvals?.level2 || []).forEach((a: any) => {
                if (a.approver && !allL2.has(a.approver.id || a.approverId)) {
                  allL2.set(a.approver.id || a.approverId, {
                    id: a.approver.id || a.approverId,
                    name: a.approver.name || a.approverName || 'Approver',
                    role: a.approver.role || 'Director',
                    avatar: (a.approver.name || 'AP').substring(0, 2).toUpperCase()
                  });
                }
              });
            });
            if (allL1.size > 0) setLevel1Approvers(Array.from(allL1.values()));
            if (allL2.size > 0) setLevel2Approvers(Array.from(allL2.values()));
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch planning data:', err);
      } finally {
        setApiLoading(false);
      }
    };
    fetchData();
  }, [selectedBudgetDetail?.id]);

  // Check for pending approval for this entity
  useEffect(() => {
    if (!entityId) return;
    const checkApproval = async () => {
      try {
        const pending = await approvalService.getPending();
        const items = Array.isArray(pending) ? pending : [];
        const match = items.find((a: any) => a.entityType === 'planning' && a.entityId === entityId);
        if (match) setPendingApproval(match);
      } catch { /* ignore */ }
    };
    checkApproval();
  }, [entityId]);

  const handleApprovalAction = async (action: 'approve' | 'reject') => {
    if (!pendingApproval) return;
    setApprovalProcessing(true);
    try {
      if (action === 'approve') {
        await approvalService.approve(pendingApproval.entityType, pendingApproval.entityId, pendingApproval.level, approvalComment);
      } else {
        await approvalService.reject(pendingApproval.entityType, pendingApproval.entityId, pendingApproval.level, approvalComment);
      }
      setPendingApproval(null);
      setApprovalComment('');
    } catch (err: any) {
      console.error('Approval action failed:', err);
    } finally {
      setApprovalProcessing(false);
    }
  };

  // Version management states
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('draft');
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [approveAnimation, setApproveAnimation] = useState(false);

  // Category tab filters
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);

  // Category hierarchy collapse states
  const [expandedGenders, setExpandedGenders] = useState<Record<string, boolean>>({ female: true, male: true });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, any>>({});

  const versionDropdownRef = useRef<any>(null);
  const genderDropdownRef = useRef<any>(null);
  const categoryDropdownRef = useRef<any>(null);
  const subCategoryDropdownRef = useRef<any>(null);

  // Collection sections - defined early for useEffect
  const COLLECTION_SECTIONS = [
    { id: 'carryover', name: 'Carry Over/Commercial' },
    { id: 'seasonal', name: 'Seasonal' }
  ];

  // Initialize local data for editable cells
  useEffect(() => {
    const initialData: Record<string, any> = {};

    // Fixed demo data sets for category tab (cycling through for variety)
    const catDemoSets = [
      { buyPct: 8, salesPct: 12, stPct: 62, buyProposed: 10, otbProposed: 245680, varPct: -2, otbSubmitted: 238450, buyActual: 9 },
      { buyPct: 5, salesPct: 7, stPct: 55, buyProposed: 6, otbProposed: 178320, varPct: -1, otbSubmitted: 172100, buyActual: 6 },
      { buyPct: 12, salesPct: 14, stPct: 68, buyProposed: 13, otbProposed: 356740, varPct: -1, otbSubmitted: 348200, buyActual: 12 },
      { buyPct: 6, salesPct: 9, stPct: 48, buyProposed: 8, otbProposed: 198560, varPct: -1, otbSubmitted: 192300, buyActual: 7 },
      { buyPct: 15, salesPct: 18, stPct: 72, buyProposed: 17, otbProposed: 425890, varPct: -1, otbSubmitted: 418600, buyActual: 16 },
      { buyPct: 4, salesPct: 5, stPct: 44, buyProposed: 5, otbProposed: 134250, varPct: 0, otbSubmitted: 130800, buyActual: 5 },
      { buyPct: 10, salesPct: 11, stPct: 58, buyProposed: 11, otbProposed: 287430, varPct: 0, otbSubmitted: 282100, buyActual: 10 },
      { buyPct: 7, salesPct: 8, stPct: 52, buyProposed: 8, otbProposed: 215780, varPct: 0, otbSubmitted: 210400, buyActual: 8 },
    ];
    let catIdx = 0;
    categoryStructure.forEach((genderGroup: any) => {
      genderGroup.categories.forEach((cat: any) => {
        cat.subCategories.forEach((subCat: any) => {
          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
          initialData[key] = { ...catDemoSets[catIdx % catDemoSets.length] };
          catIdx++;
        });
      });
    });

    // Fixed demo data for Collection tab (REX/TTP per collection)
    const collectionDemo: Record<string, Record<string, number>> = {
      carryover: { rex: 22, ttp: 16 },
      seasonal: { rex: 35, ttp: 26 },
    };
    COLLECTION_SECTIONS.forEach((section: any) => {
      STORES.forEach((store: any) => {
        const key = `collection_${section.id}_${store.id}`;
        initialData[key] = {
          userBuyPct: collectionDemo[section.id]?.[store.id] || 20
        };
      });
    });

    // Fixed demo data for Gender tab (REX/TTP per gender)
    const genderDemo: Record<string, Record<string, number>> = {
      gen1: { rex: 36, ttp: 25 },
      gen2: { rex: 22, ttp: 17 },
    };
    GENDERS.forEach((gender: any) => {
      STORES.forEach((store: any) => {
        const key = `gender_${gender.id}_${store.id}`;
        initialData[key] = {
          userBuyPct: genderDemo[gender.id]?.[store.id] || 20
        };
      });
    });

    setLocalData(initialData);
  }, [categoryStructure]);

  const handleStartEdit = (cellKey: any, currentValue: any) => {
    setEditingCell(cellKey);
    setEditValue(typeof currentValue === 'number' ? currentValue.toFixed(0) : currentValue.toString());
  };

  const handleSaveEdit = (cellKey: any) => {
    const newValue = parseFloat(editValue) || 0;

    // Determine which field to update based on the key type
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(event.target)) {
        setIsVersionDropdownOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target)) {
        setIsGenderDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(event.target)) {
        setIsSubCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle approve - create new version
  const handleApprove = () => {
    const newVersion = {
      id: `v${versions.length + 1}`,
      versionNumber: versions.length + 1,
      createdAt: new Date().toISOString(),
      createdBy: { name: 'Current User', avatar: 'CU' },
      data: JSON.parse(JSON.stringify(localData)),
      status: 'pending_review',
      approvals: {
        level1: level1Approvers.map((a: any) => ({
          approverId: a.id,
          status: 'pending',
          comment: '',
          approvedAt: null
        })),
        level2: level2Approvers.map((a: any) => ({
          approverId: a.id,
          status: 'waiting',
          comment: '',
          approvedAt: null
        }))
      }
    };

    setVersions((prev: any) => [...prev, newVersion]);
    setApproveAnimation(true);

    setTimeout(() => {
      setApproveAnimation(false);
      setSelectedVersion(newVersion.id);
    }, 1500);
  };

  // Check if current view is read-only
  const isReadOnly = selectedVersion !== 'draft';

  // Format date for display
  const formatDate = (isoString: any) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current version data
  const currentVersion = selectedVersion === 'draft' ? null : versions.find((v: any) => v.id === selectedVersion);

  // Get approver info by ID
  const getApproverInfo = (approverId: any, level: any) => {
    const approvers = level === 1 ? level1Approvers : level2Approvers;
    return approvers.find((a: any) => a.id === approverId);
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
    setIsGenderDropdownOpen(false);
  };

  const handleCategoryFilterChange = (value: any) => {
    setCategoryFilter(value);
    setSubCategoryFilter('all');
    setIsCategoryDropdownOpen(false);
  };

  const handleSubCategoryFilterChange = (value: any) => {
    setSubCategoryFilter(value);
    setIsSubCategoryDropdownOpen(false);
  };

  // Toggle expanded state for hierarchy
  const toggleGenderExpanded = (genderId: any) => {
    setExpandedGenders((prev: any) => ({ ...prev, [genderId]: !prev[genderId] }));
  };

  const toggleCategoryExpanded = (genderId: any, categoryId: any) => {
    const key = `${genderId}_${categoryId}`;
    setExpandedCategories((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate totals for entire data
  const grandTotals = useMemo(() => {
    if (!planningDetailData || planningDetailData.length === 0) {
      return { buyPct: 0, salesPct: 0, userBuyPct: 0, otbValue: 0 };
    }

    const buyPct = planningDetailData.reduce((sum: any, item: any) => sum + item.systemBuyPct, 0);
    const salesPct = planningDetailData.reduce((sum: any, item: any) => sum + item.lastSeasonSalesPct, 0);
    const userBuyPct = planningDetailData.reduce((sum: any, item: any) => sum + item.userBuyPct, 0);
    const otbValue = planningDetailData.reduce((sum: any, item: any) => sum + item.otbValue, 0);

    return { buyPct, salesPct, userBuyPct, otbValue };
  }, [planningDetailData]);

  // Common table styles - DAFC Design System warm beige
  const headerClass = darkMode
    ? "bg-[rgba(215,183,151,0.15)] text-[#D7B797]"
    : "bg-gradient-to-r from-[rgba(160,120,75,0.35)] to-[rgba(160,120,75,0.22)] text-[#5C4A32]";
  const headerCellClass = "px-4 py-0.5 text-center text-xs font-semibold uppercase tracking-wide";
  const groupRowClass = darkMode
    ? "bg-[rgba(215,183,151,0.08)] border-l-4 border-[#D7B797]"
    : "bg-gradient-to-r from-[rgba(160,120,75,0.18)] to-[rgba(160,120,75,0.1)] border-l-4 border-[#D7B797]";
  const sumRowClass = darkMode
    ? "bg-[rgba(215,183,151,0.15)] text-[#D7B797] font-semibold"
    : "bg-gradient-to-r from-[rgba(160,120,75,0.28)] to-[rgba(160,120,75,0.22)] text-[#5C4A32] font-semibold";
  const tableRowClass = darkMode
    ? `border-b border-[#2E2E2E] hover:bg-[#1A1A1A] transition-colors`
    : `border-b border-slate-100 hover:bg-slate-50 transition-colors`;
  const tableCellText = darkMode ? 'text-[#999999]' : 'text-slate-600';
  const tableCellTextBold = darkMode ? 'text-[#F2F2F2]' : 'text-slate-700';
  const groupLabelText = darkMode ? 'text-[#F2F2F2]' : 'text-slate-800';

  // Render Collection Tab
  const renderCollectionTab = () => {
    const collectionData = COLLECTION_SECTIONS.map((section: any, sectionIdx: any) => {
      const items = planningDetailData.filter((_: any, idx: any) =>
        sectionIdx === 0 ? idx % 2 === 0 : idx % 2 === 1
      );

      const storeData = STORES.map((store: any) => {
        const storeItems = items.filter((_: any, idx: any) =>
          store.id === 'rex' ? idx % 2 === 0 : idx % 2 === 1
        );

        const buyPct = storeItems.reduce((sum: any, item: any) => sum + item.systemBuyPct, 0) / (storeItems.length || 1);
        const salesPct = storeItems.reduce((sum: any, item: any) => sum + item.lastSeasonSalesPct, 0) / (storeItems.length || 1);
        // Fixed ST% and MOC per store for consistent demo
        const stPct = store.id === 'rex' ? (sectionIdx === 0 ? 67 : 48) : (sectionIdx === 0 ? 64 : 45);
        const moc = store.id === 'rex' ? (sectionIdx === 0 ? 3.2 : 7.0) : (sectionIdx === 0 ? 3.7 : 8.0);
        const userBuyPct = storeItems.reduce((sum: any, item: any) => sum + item.userBuyPct, 0) / (storeItems.length || 1);
        const otbValue = storeItems.reduce((sum: any, item: any) => sum + item.otbValue, 0);
        const variance = userBuyPct - salesPct;

        return { store, buyPct, salesPct, stPct, moc, userBuyPct, otbValue, variance };
      });

      return { section, storeData };
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={headerClass}>
              <th className={`${headerCellClass} text-left min-w-[200px]`}>{t('planningDetail.collection')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctBuy')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctSales')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctST')}</th>
              <th className={headerCellClass}>{t('planningDetail.moc')}</th>
              <th className={`${headerCellClass} bg-[rgba(160,120,75,0.35)]`}>{t('planningDetail.pctBuyProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.otbProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctVarVsLastSeason')}</th>
            </tr>
          </thead>
          <tbody>
            {collectionData.map((colData: any) => (
              <React.Fragment key={`col-${colData.section.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-4 py-0.5" colSpan={8}>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs uppercase tracking-wide ${groupLabelText}`}>{colData.section.name}</span>
                      <Info size={12} className={textMuted} />
                    </div>
                  </td>
                </tr>

                {colData.storeData.map((storeRow: any) => {
                  const cellKey = `collection_${colData.section.id}_${storeRow.store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? storeRow.userBuyPct;
                  const variance = userBuyPctValue - storeRow.salesPct;

                  return (
                    <tr
                      key={cellKey}
                      className={tableRowClass}
                    >
                      <td className="px-4 py-0.5 pl-8">
                        <span className={tableCellText}>{storeRow.store.name}</span>
                      </td>
                      <td className={`px-4 py-0.5 text-center ${tableCellText}`}>{storeRow.buyPct.toFixed(1)}%</td>
                      <td className={`px-4 py-0.5 text-center ${tableCellText}`}>{storeRow.salesPct.toFixed(0)}%</td>
                      <td className={`px-4 py-0.5 text-center ${tableCellText}`}>{storeRow.stPct.toFixed(0)}%</td>
                      <td className={`px-4 py-0.5 text-center ${tableCellText}`}>{storeRow.moc.toFixed(1)}</td>
                      <td className={`px-4 py-0.5 ${isReadOnly ? 'bg-[rgba(160,120,75,0.1)]' : 'bg-[rgba(160,120,75,0.18)]'}`}>
                        <EditableCell
                          cellKey={cellKey}
                          value={userBuyPctValue}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          readOnly={isReadOnly}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className={`px-4 py-0.5 text-center font-medium ${tableCellTextBold}`}>{formatCurrency(storeRow.otbValue)}</td>
                      <td className={`px-4 py-0.5 text-center font-medium ${
                        variance < 0 ? 'text-red-600' : variance > 0 ? 'text-green-600' : tableCellText
                      }`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            <tr className={sumRowClass}>
              <td className="px-4 py-4 font-semibold text-xs uppercase tracking-wide">{t('planningDetail.sum')}</td>
              <td className="px-4 py-4 text-center">100%</td>
              <td className="px-4 py-4 text-center">100%</td>
              <td className="px-4 py-4 text-center">-</td>
              <td className="px-4 py-4 text-center">-</td>
              <td className="px-4 py-4 text-center">100%</td>
              <td className="px-4 py-4 text-center">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-4 py-4 text-center">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Render Gender Tab
  const renderGenderTab = () => {
    const genderData = GENDERS.map((gen: any) => {
      const items = planningDetailData.filter((item: any) => item.genderId === gen.id);

      const storeData = STORES.map((store: any) => {
        const storeItems = items.filter((_: any, idx: any) =>
          store.id === 'rex' ? idx % 2 === 0 : idx % 2 === 1
        );

        const buyPct = storeItems.reduce((sum: any, item: any) => sum + item.systemBuyPct, 0) / (storeItems.length || 1);
        const salesPct = storeItems.reduce((sum: any, item: any) => sum + item.lastSeasonSalesPct, 0) / (storeItems.length || 1);
        // Fixed ST% per store/gender for consistent demo
        const stPct = store.id === 'rex' ? (gen.id === 'gen2' ? 42 : 63) : (gen.id === 'gen2' ? 44 : 58);
        const userBuyPct = storeItems.reduce((sum: any, item: any) => sum + item.userBuyPct, 0) / (storeItems.length || 1);
        const otbValue = storeItems.reduce((sum: any, item: any) => sum + item.otbValue, 0);
        const variance = userBuyPct - salesPct;

        return { store, buyPct, salesPct, stPct, userBuyPct, otbValue, variance };
      });

      return { gender: gen, storeData };
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={headerClass}>
              <th className={`${headerCellClass} text-left min-w-[200px]`}>{t('planningDetail.gender')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctBuy')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctSales')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctST')}</th>
              <th className={`${headerCellClass} bg-[rgba(160,120,75,0.35)]`}>{t('planningDetail.pctBuyProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.otbProposed')}</th>
              <th className={headerCellClass}>{t('planningDetail.pctVarVsLastSeason')}</th>
            </tr>
          </thead>
          <tbody>
            {genderData.map((genData: any) => (
              <React.Fragment key={`gen-${genData.gender.id}`}>
                <tr className={groupRowClass}>
                  <td className="px-4 py-0.5" colSpan={7}>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs uppercase tracking-wide ${groupLabelText}`}>{genData.gender.name}</span>
                      <Info size={12} className={textMuted} />
                    </div>
                  </td>
                </tr>

                {genData.storeData.map((storeRow: any) => {
                  const cellKey = `gender_${genData.gender.id}_${storeRow.store.id}`;
                  const isEditing = editingCell === cellKey;
                  const cellData = localData[cellKey] || {};
                  const userBuyPctValue = cellData.userBuyPct ?? storeRow.userBuyPct;
                  const variance = userBuyPctValue - storeRow.salesPct;

                  return (
                    <tr
                      key={cellKey}
                      className={tableRowClass}
                    >
                      <td className="px-4 py-0.5 pl-8">
                        <span className={tableCellText}>{storeRow.store.name}</span>
                      </td>
                      <td className={`px-4 py-0.5 text-center ${tableCellText}`}>{storeRow.buyPct.toFixed(1)}%</td>
                      <td className={`px-4 py-0.5 text-center ${tableCellText}`}>{storeRow.salesPct.toFixed(0)}%</td>
                      <td className={`px-4 py-0.5 text-center ${tableCellText}`}>{storeRow.stPct.toFixed(0)}%</td>
                      <td className={`px-4 py-0.5 ${isReadOnly ? 'bg-[rgba(160,120,75,0.1)]' : 'bg-[rgba(160,120,75,0.18)]'}`}>
                        <EditableCell
                          cellKey={cellKey}
                          value={userBuyPctValue}
                          isEditing={isEditing}
                          editValue={editValue}
                          onStartEdit={handleStartEdit}
                          onSaveEdit={handleSaveEdit}
                          onChangeValue={setEditValue}
                          onKeyDown={handleKeyDown}
                          readOnly={isReadOnly}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className={`px-4 py-0.5 text-center font-medium ${tableCellTextBold}`}>{formatCurrency(storeRow.otbValue)}</td>
                      <td className={`px-4 py-0.5 text-center font-medium ${
                        variance < 0 ? 'text-red-600' : variance > 0 ? 'text-green-600' : tableCellText
                      }`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            <tr className={sumRowClass}>
              <td className="px-4 py-4 font-semibold text-xs uppercase tracking-wide">{t('planningDetail.sum')}</td>
              <td className="px-4 py-4 text-center">100%</td>
              <td className="px-4 py-4 text-center">100%</td>
              <td className="px-4 py-4 text-center">-</td>
              <td className="px-4 py-4 text-center">100%</td>
              <td className="px-4 py-4 text-center">{formatCurrency(grandTotals.otbValue)}</td>
              <td className="px-4 py-4 text-center">-</td>
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
      <div className="p-2 md:p-4 space-y-3">
        {/* Filter Section */}
        <div className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-2 md:mb-3 border-b backdrop-blur-sm px-3 md:px-6 py-1.5 ${darkMode ? 'bg-[#0A0A0A]/95 border-[#2E2E2E]' : 'bg-white/95 border-slate-200'}`}>
          <div className="flex items-end gap-2">
            {/* Gender Filter */}
            <div className="relative flex-1 min-w-0" ref={genderDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsGenderDropdownOpen(!isGenderDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                  setIsSubCategoryDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 ${darkMode ? 'bg-[#1A1A1A] border border-[#2E2E2E]' : 'bg-white border border-slate-200'} rounded-md hover:border-pink-300 transition-all min-w-[90px]`}
              >
                <Users size={12} className="text-pink-500" />
                <span className={`text-xs font-medium ${tableCellTextBold} flex-1 text-left truncate`}>
                  {getSelectedLabel(filterOptions.genders, genderFilter)}
                </span>
                <ChevronDown size={12} className={`${textMuted} transition-transform ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isGenderDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-slate-200'} border-2 rounded-lg shadow-lg z-50 overflow-hidden`}>
                  {filterOptions.genders.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleGenderFilterChange(option.id)}
                      className={`px-4 py-0.5 flex items-center gap-2 ${darkMode ? 'hover:bg-pink-500/10' : 'hover:bg-pink-50'} cursor-pointer transition-colors`}
                    >
                      <span className={`text-sm ${genderFilter === option.id ? 'text-pink-600 font-semibold' : tableCellTextBold}`}>
                        {option.name}
                      </span>
                      {genderFilter === option.id && <Check size={14} className="text-pink-500 ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative flex-1 min-w-0" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  setIsGenderDropdownOpen(false);
                  setIsSubCategoryDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 ${darkMode ? 'bg-[#1A1A1A] border border-[#2E2E2E]' : 'bg-white border border-slate-200'} rounded-md hover:border-violet-300 transition-all min-w-[100px]`}
              >
                <Tag size={12} className="text-violet-500" />
                <span className={`text-xs font-medium ${tableCellTextBold} flex-1 text-left truncate`}>
                  {getSelectedLabel(filterOptions.categories, categoryFilter)}
                </span>
                <ChevronDown size={12} className={`${textMuted} transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-slate-200'} border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto`}>
                  {filteredCategoryOptions.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleCategoryFilterChange(option.id)}
                      className={`px-4 py-0.5 flex items-center gap-2 ${darkMode ? 'hover:bg-violet-500/10' : 'hover:bg-violet-50'} cursor-pointer transition-colors`}
                    >
                      <span className={`text-sm ${categoryFilter === option.id ? 'text-violet-600 font-semibold' : tableCellTextBold}`}>
                        {option.name}
                      </span>
                      {categoryFilter === option.id && <Check size={14} className="text-violet-500 ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Category Filter */}
            <div className="relative flex-1 min-w-0" ref={subCategoryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen);
                  setIsGenderDropdownOpen(false);
                  setIsCategoryDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 ${darkMode ? 'bg-[#1A1A1A] border border-[#2E2E2E]' : 'bg-white border border-slate-200'} rounded-md hover:border-emerald-300 transition-all min-w-[100px]`}
              >
                <Layers size={12} className="text-emerald-500" />
                <span className={`text-xs font-medium ${tableCellTextBold} flex-1 text-left truncate`}>
                  {getSelectedLabel(filterOptions.subCategories, subCategoryFilter)}
                </span>
                <ChevronDown size={12} className={`${textMuted} transition-transform ${isSubCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSubCategoryDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-slate-200'} border-2 rounded-lg shadow-lg z-50 overflow-hidden max-h-[300px] overflow-y-auto`}>
                  {filteredSubCategoryOptions.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => handleSubCategoryFilterChange(option.id)}
                      className={`px-4 py-0.5 flex items-center gap-2 ${darkMode ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-50'} cursor-pointer transition-colors`}
                    >
                      <span className={`text-sm ${subCategoryFilter === option.id ? 'text-emerald-600 font-semibold' : tableCellTextBold}`}>
                        {option.name}
                      </span>
                      {subCategoryFilter === option.id && <Check size={14} className="text-emerald-500 ml-auto" />}
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
                className={`shrink-0 p-1 rounded transition-colors ${darkMode ? 'text-[#666666] hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
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
            <div key={genderGroup.gender.id} className={`rounded-xl border-2 overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-slate-200'}`}>
              {/* Gender Header - Level 1 */}
              <div
                onClick={() => toggleGenderExpanded(genderGroup.gender.id)}
                className={`flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 md:py-1 cursor-pointer transition-all ${
                  isFemale
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                    : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600'
                }`}
              >
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                  <button className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <ChevronDown
                      size={18}
                      className={`text-white transition-transform duration-200 ${isGenderExpanded ? '' : '-rotate-90'}`}
                    />
                  </button>
                  <Users size={18} className="text-white" />
                  <span className="font-semibold text-xs uppercase tracking-wide text-white">{genderGroup.gender.name}</span>
                  <span className="ml-auto md:ml-0 text-white/80 text-xs md:text-sm">
                    {genderGroup.categories.length} {t('planningDetail.category').toLowerCase()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 md:ml-auto text-white/90 text-xs md:text-sm pl-8 md:pl-0">
                  <span>Buy: <strong>{genderTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{genderTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Gender Content */}
              {isGenderExpanded && (
                <div className={`p-3 space-y-2 ${darkMode ? 'bg-[#0A0A0A]' : 'bg-slate-50'}`}>
                  {genderGroup.categories.map((cat: any, catIdx: any) => {
                    const catKey = `${genderGroup.gender.id}_${cat.id}`;
                    const isCatExpanded = expandedCategories[catKey] !== false;
                    const catTotals = calculateCategoryTotals(genderGroup.gender.id, cat);

                    return (
                      <div key={cat.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-slate-200'}`}>
                        {/* Category Header - Level 2 */}
                        <div
                          onClick={() => toggleCategoryExpanded(genderGroup.gender.id, cat.id)}
                          className={`flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3 px-3 md:px-4 py-0.5 md:py-1 cursor-pointer transition-all ${
                            catIdx % 2 === 0
                              ? 'bg-gradient-to-r from-violet-100 to-purple-50 hover:from-violet-200 hover:to-purple-100'
                              : 'bg-gradient-to-r from-amber-100 to-orange-50 hover:from-amber-200 hover:to-orange-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                            <button className={`p-1 rounded-lg transition-colors ${
                              catIdx % 2 === 0 ? 'bg-violet-200/50 hover:bg-violet-200' : 'bg-amber-200/50 hover:bg-amber-200'
                            }`}>
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${
                                  catIdx % 2 === 0 ? 'text-violet-600' : 'text-amber-600'
                                } ${isCatExpanded ? '' : '-rotate-90'}`}
                              />
                            </button>
                            <Tag size={16} className={catIdx % 2 === 0 ? 'text-violet-600' : 'text-amber-600'} />
                            <span className={`font-semibold text-sm md:text-base ${catIdx % 2 === 0 ? 'text-violet-800' : 'text-amber-800'}`}>
                              {cat.name}
                            </span>
                            <span className={`ml-auto md:ml-0 ${textMuted} text-xs md:text-sm`}>
                              {cat.subCategories.length} {t('planningDetail.subCategory').toLowerCase()}
                            </span>
                          </div>
                          <div className={`flex flex-wrap items-center gap-2 md:gap-4 md:ml-auto ${tableCellText} text-xs md:text-sm pl-7 md:pl-0`}>
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
                                <tr className="bg-[rgba(160,120,75,0.18)] border-b border-[rgba(160,120,75,0.25)]">
                                  <th className="px-4 py-0.5 text-left text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.subCategory')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.pctBuy')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.pctSales')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.pctST')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#6B4D30] uppercase bg-[rgba(160,120,75,0.28)]">{t('planningDetail.pctProposed')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.dollarOtbProposed')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.pctVar2025_2026')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.otbSubmitted')}</th>
                                  <th className="px-3 py-0.5 text-center text-xs font-semibold text-[#666666] uppercase">{t('planningDetail.pctBuyActual')}</th>
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
                                      className={`${darkMode ? 'border-b border-[#2E2E2E] hover:bg-[#1A1A1A]' : 'border-b border-slate-100 hover:bg-slate-50'} transition-colors ${
                                        subIdx % 2 === 0 ? (darkMode ? 'bg-[#121212]' : 'bg-white') : (darkMode ? 'bg-[#0A0A0A]/50' : 'bg-slate-50/50')
                                      }`}
                                    >
                                      <td className="px-4 py-0.5">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-[#666666]' : 'bg-slate-400'}`}></div>
                                          <span className={tableCellTextBold}>{subCat.name}</span>
                                        </div>
                                      </td>
                                      <td className={`px-3 py-0.5 text-center ${tableCellText}`}>{rowData.buyPct || 0}%</td>
                                      <td className={`px-3 py-0.5 text-center ${tableCellText}`}>{rowData.salesPct || 0}%</td>
                                      <td className={`px-3 py-0.5 text-center ${tableCellText}`}>{rowData.stPct || 0}%</td>
                                      <td className={`px-3 py-0.5 ${isReadOnly ? 'bg-[rgba(160,120,75,0.1)]' : 'bg-[rgba(160,120,75,0.18)]'}`}>
                                        <EditableCell
                                          cellKey={cellKey}
                                          value={rowData.buyProposed || 0}
                                          isEditing={isEditing}
                                          editValue={editValue}
                                          onStartEdit={handleStartEdit}
                                          onSaveEdit={handleSaveEdit}
                                          onChangeValue={setEditValue}
                                          onKeyDown={handleKeyDown}
                                          readOnly={isReadOnly}
                                        />
                                      </td>
                                      <td className={`px-3 py-0.5 text-center ${tableCellTextBold} font-medium`}>
                                        {(rowData.otbProposed || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-3 py-0.5 text-center font-medium ${
                                        (rowData.varPct || 0) < 0 ? 'text-red-600' : 'text-emerald-600'
                                      }`}>
                                        {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                                      </td>
                                      <td className={`px-3 py-0.5 text-center ${tableCellText}`}>
                                        {(rowData.otbSubmitted || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-3 py-0.5 text-center ${tableCellText}`}>{rowData.buyActual || 0}%</td>
                                    </tr>
                                  );
                                })}
                                {/* Category Subtotal Row */}
                                <tr className="bg-gradient-to-r from-[rgba(160,120,75,0.28)] to-[rgba(160,120,75,0.18)] font-medium">
                                  <td className="px-4 py-0.5 text-[#5C4A32] font-semibold">{t('planningDetail.subtotal')}</td>
                                  <td className="px-3 py-0.5 text-center text-[#5C4A32]">{catTotals.buyPct}%</td>
                                  <td className="px-3 py-0.5 text-center text-[#5C4A32]">{catTotals.salesPct}%</td>
                                  <td className="px-3 py-0.5 text-center text-[#5C4A32]">{catTotals.stPct}%</td>
                                  <td className="px-3 py-0.5 text-center text-[#6B4D30] bg-[rgba(160,120,75,0.22)] font-bold">{catTotals.buyProposed}%</td>
                                  <td className="px-3 py-0.5 text-center text-[#5C4A32] font-bold">{catTotals.otbProposed.toLocaleString()}</td>
                                  <td className={`px-3 py-0.5 text-center font-bold ${
                                    catTotals.varPct < 0 ? 'text-red-600' : 'text-[#5C4A32]'
                                  }`}>
                                    {catTotals.varPct > 0 ? '+' : ''}{catTotals.varPct}%
                                  </td>
                                  <td className="px-3 py-0.5 text-center text-[#5C4A32]">{catTotals.otbSubmitted.toLocaleString()}</td>
                                  <td className="px-3 py-0.5 text-center text-[#5C4A32]">{catTotals.buyActual}%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Gender Total */}
                  <div className={`rounded-xl p-2 md:p-3 ${
                    isFemale
                      ? 'bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200'
                      : 'bg-gradient-to-r from-sky-100 to-blue-100 border border-sky-200'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-0">
                      <span className={`font-semibold text-xs uppercase tracking-wide ${isFemale ? 'text-pink-800' : 'text-sky-800'}`}>
                        {t('planningDetail.total')} {genderGroup.gender.name.toUpperCase()}
                      </span>
                      <div className={`flex flex-wrap items-center gap-2 md:gap-6 text-xs md:text-sm ${isFemale ? 'text-pink-700' : 'text-sky-700'}`}>
                        <span>% Buy: <strong>{genderTotals.buyPct}%</strong></span>
                        <span>% Sales: <strong>{genderTotals.salesPct}%</strong></span>
                        <span>% ST: <strong>{genderTotals.stPct}%</strong></span>
                        <span>% Proposed: <strong>{genderTotals.buyProposed}%</strong></span>
                        <span>$ OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                        <span className={genderTotals.varPct < 0 ? 'text-red-600' : ''}>
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

  // Render Approval History Section
  const renderApprovalHistory = () => {
    if (!currentVersion) {
      return (
        <div className={`flex flex-col items-center justify-center py-12 ${textMuted}`}>
          <FileText size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">{t('planningDetail.noApprovedVersions')}</p>
          <p className="text-sm">{t('planningDetail.editHint')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 md:space-y-6 animate-in fade-in slide-in-from-right duration-500">
        {/* Version Info */}
        <div className={`rounded-xl p-4 border ${darkMode ? 'bg-[rgba(215,183,151,0.08)] border-[#2E2E2E]' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#D7B797]' : 'bg-blue-500'}`}>
              <FileText size={20} className={darkMode ? 'text-[#0A0A0A]' : 'text-white'} />
            </div>
            <div>
              <h4 className={`font-bold ${darkMode ? 'text-[#D7B797]' : 'text-blue-800'}`}>{t('common.version')} {currentVersion.versionNumber}</h4>
              <p className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-blue-600'}`}>{formatDate(currentVersion.createdAt)}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-[#999999]' : 'text-blue-700'}`}>
            <User size={14} />
            <span>{t('budget.createdBy')}: <strong>{currentVersion.createdBy.name}</strong></span>
          </div>
        </div>

        {/* Level 1 Approvers */}
        <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-0.5">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={18} />
              {t('planningDetail.approve')} L1
            </h4>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-[#2E2E2E]' : 'divide-slate-100'}`}>
            {currentVersion.approvals.level1.map((approval: any, idx: any) => {
              const approver = getApproverInfo(approval.approverId, 1);
              return (
                <div
                  key={approval.approverId}
                  className={`p-4 ${hoverBg} transition-colors animate-in fade-in slide-in-from-left`}
                  style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {approver?.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className={`font-semibold ${textPrimary}`}>{approver?.name}</span>
                          <span className={`text-sm ${textMuted} ml-2`}>({approver?.role})</span>
                        </div>
                        <ApprovalStatusBadge status={approval.status} />
                      </div>
                      {approval.approvedAt && (
                        <div className={`text-xs ${textMuted} flex items-center gap-1 mb-2`}>
                          <Calendar size={12} />
                          {formatDate(approval.approvedAt)}
                        </div>
                      )}
                      {approval.comment && (
                        <div className={`rounded-lg p-3 mt-2 ${subtleBg}`}>
                          <div className="flex items-start gap-2">
                            <MessageSquare size={14} className={`${textMuted} mt-0.5`} />
                            <p className={`text-sm ${textSecondary} italic`}>"{approval.comment}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level 2 Approvers */}
        <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-0.5">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={18} />
              {t('planningDetail.approve')} L2
            </h4>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-[#2E2E2E]' : 'divide-slate-100'}`}>
            {currentVersion.approvals.level2.map((approval: any, idx: any) => {
              const approver = getApproverInfo(approval.approverId, 2);
              return (
                <div
                  key={approval.approverId}
                  className={`p-4 ${hoverBg} transition-colors animate-in fade-in slide-in-from-left`}
                  style={{ animationDelay: `${(idx + 2) * 100}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {approver?.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className={`font-semibold ${textPrimary}`}>{approver?.name}</span>
                          <span className={`text-sm ${textMuted} ml-2`}>({approver?.role})</span>
                        </div>
                        <ApprovalStatusBadge status={approval.status} />
                      </div>
                      {approval.approvedAt && (
                        <div className={`text-xs ${textMuted} flex items-center gap-1 mb-2`}>
                          <Calendar size={12} />
                          {formatDate(approval.approvedAt)}
                        </div>
                      )}
                      {approval.comment && (
                        <div className={`rounded-lg p-3 mt-2 ${subtleBg}`}>
                          <div className="flex items-start gap-2">
                            <MessageSquare size={14} className={`${textMuted} mt-0.5`} />
                            <p className={`text-sm ${textSecondary} italic`}>"{approval.comment}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!selectedBudgetDetail) {
    if (fetchLoading) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0A0A0A]' : 'bg-slate-50'}`}>
          <div className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-slate-500'}`}>{t('common.loading') || 'Loading...'}</div>
        </div>
      );
    }
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0A0A0A]' : 'bg-slate-50'}`}>
        <div className="text-center">
          <FileText size={40} className={darkMode ? 'text-[#666666] mx-auto mb-3' : 'text-slate-300 mx-auto mb-3'} />
          <p className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-slate-500'}`}>{t('common.noData') || 'No planning data found'}</p>
          <button onClick={onBack} className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-[#1A1A1A] text-[#F2F2F2] hover:bg-[#2E2E2E]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <ArrowLeft size={14} className="inline mr-2" />{t('common.back') || 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgPage} overflow-x-hidden`}>
      {/* Header */}
      <div className={`${headerBg} px-3 md:px-8 py-0.5 md:py-6 shadow-xl relative z-50`}>
        {!darkMode && <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>}
        {!darkMode && <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>}

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          {/* Left - Back & Title */}
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={onBack}
              className={`p-3 rounded-xl transition-all duration-300 ${darkMode ? 'bg-[rgba(215,183,151,0.2)] hover:bg-[rgba(215,183,151,0.3)] text-[#F2F2F2]' : 'bg-white/20 hover:bg-white/30 text-white'}`}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className={`text-lg md:text-2xl font-bold ${headerText} flex items-center gap-2 md:gap-3`}>
                <TrendingUp size={isMobile ? 22 : 28} />
                {t('planningDetail.title')}
              </h1>
              <p className={`mt-1 text-xs md:text-base ${darkMode ? 'text-[#999999]' : 'text-blue-100'}`}>
                {selectedBudgetDetail.budget?.groupBrandName} - {selectedBudgetDetail.budget?.seasonGroupId} {selectedBudgetDetail.budget?.seasonName}
              </p>
            </div>
          </div>

          {/* Center - Budget Info */}
          <div className="flex flex-wrap items-center gap-3 md:gap-8">
            <div className={`text-center px-3 md:px-6 py-0.5 rounded-xl ${darkMode ? 'bg-[rgba(255,255,255,0.05)]' : 'bg-white/10 backdrop-blur-sm'}`}>
              <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#666666]' : 'text-blue-100'}`}>{t('planningDetail.totalBudget')}</div>
              <div className={`text-lg md:text-2xl font-bold ${headerText}`}>
                {formatCurrency(selectedBudgetDetail.budget?.totalBudget || selectedBudgetDetail.totalAmount || 0)}
              </div>
            </div>
            <div className={`text-center px-3 md:px-6 py-0.5 rounded-xl ${darkMode ? 'bg-[rgba(255,255,255,0.05)]' : 'bg-white/10 backdrop-blur-sm'}`}>
              <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#666666]' : 'text-blue-100'}`}>{t('planningDetail.allocated')}</div>
              <div className="text-lg md:text-2xl font-bold text-emerald-300">
                {formatCurrency(grandTotals.otbValue)}
              </div>
            </div>
          </div>

          {/* Right - Version Dropdown */}
          <div className="relative" ref={versionDropdownRef}>
            <button
              type="button"
              onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
              className={`flex items-center gap-3 px-5 py-0.5 rounded-xl font-medium transition-all duration-300 ${
                selectedVersion === 'draft'
                  ? 'bg-amber-400 text-amber-900 hover:bg-amber-300 shadow-lg shadow-amber-500/30'
                  : 'bg-emerald-400 text-emerald-900 hover:bg-emerald-300 shadow-lg shadow-emerald-500/30'
              }`}
            >
              {selectedVersion === 'draft' ? (
                <>
                  <Sparkles size={18} className="animate-spin" style={{ animationDuration: '3s' }} />
                  <span>{t('planningDetail.draftEditing')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{t('common.version')} {versions.find((v: any) => v.id === selectedVersion)?.versionNumber}</span>
                </>
              )}
              <ChevronDown size={18} className={`transition-transform duration-200 ${isVersionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isVersionDropdownOpen && (
              <div className={`absolute top-full right-0 mt-2 w-80 border-2 rounded-xl shadow-2xl z-[99999] overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-slate-200'}`}>
                {/* Draft Option */}
                <div
                  onClick={() => {
                    setSelectedVersion('draft');
                    setIsVersionDropdownOpen(false);
                  }}
                  className={`px-4 py-0.5 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:pl-6 ${
                    selectedVersion === 'draft'
                      ? (darkMode ? 'bg-amber-500/10 border-l-4 border-amber-400' : 'bg-amber-50 border-l-4 border-amber-400')
                      : hoverBg
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedVersion === 'draft' ? 'bg-amber-100' : (darkMode ? 'bg-[#2E2E2E]' : 'bg-slate-100')}`}>
                    <Sparkles size={18} className={selectedVersion === 'draft' ? 'text-amber-600' : textMuted} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${selectedVersion === 'draft' ? 'text-amber-700' : tableCellTextBold}`}>
                      {t('planningDetail.draftCurrent')}
                    </div>
                    <div className={`text-xs ${textMuted}`}>{t('planningDetail.editableVersion')}</div>
                  </div>
                  {selectedVersion === 'draft' && <Check size={20} className="text-amber-500" />}
                </div>

                {/* Divider */}
                {versions.length > 0 && (
                  <div className={`px-4 py-0.5 border-y ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-slate-100 border-slate-200'}`}>
                    <span className={`text-xs font-semibold ${textMuted} uppercase tracking-wide flex items-center gap-2`}>
                      <History size={14} />
                      {t('planningDetail.approvedVersions')} ({versions.length})
                    </span>
                  </div>
                )}

                {/* Version List */}
                <div className="max-h-[250px] overflow-y-auto">
                  {versions.length === 0 ? (
                    <div className={`px-4 py-8 text-center ${textMuted}`}>
                      <Clock size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('planningDetail.noApprovedVersions')}</p>
                    </div>
                  ) : (
                    versions.slice().reverse().map((version: any, idx: any) => (
                      <div
                        key={version.id}
                        onClick={() => {
                          setSelectedVersion(version.id);
                          setIsVersionDropdownOpen(false);
                        }}
                        className={`px-4 py-0.5 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:pl-6 ${
                          selectedVersion === version.id
                            ? (darkMode ? 'bg-emerald-500/10 border-l-4 border-emerald-400' : 'bg-emerald-50 border-l-4 border-emerald-400')
                            : hoverBg
                        }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className={`p-2 rounded-lg ${selectedVersion === version.id ? 'bg-emerald-100' : (darkMode ? 'bg-[#2E2E2E]' : 'bg-slate-100')}`}>
                          <CheckCircle2 size={18} className={selectedVersion === version.id ? 'text-emerald-600' : textMuted} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${selectedVersion === version.id ? 'text-emerald-700' : tableCellTextBold}`}>
                            {t('common.version')} {version.versionNumber}
                          </div>
                          <div className={`text-xs ${textMuted} flex items-center gap-1`}>
                            <Clock size={12} />
                            {formatDate(version.createdAt)}
                          </div>
                        </div>
                        {selectedVersion === version.id && <Check size={20} className="text-emerald-500" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="px-3 md:px-6 py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex flex-wrap items-center justify-center gap-3 text-sm font-medium animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={18} />
          <span>{t('planningDetail.viewingApprovedVersion').replace('{{version}}', versions.find((v: any) => v.id === selectedVersion)?.versionNumber)}</span>
          <button
            onClick={() => setSelectedVersion('draft')}
            className={`ml-4 px-4 py-0.5 rounded-lg transition-all duration-200 ${darkMode ? 'bg-[rgba(215,183,151,0.2)] hover:bg-[rgba(215,183,151,0.3)]' : 'bg-white/20 hover:bg-white/30'}`}
          >
            {t('planningDetail.switchToDraft')}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-6 p-3 md:p-6 relative z-10 overflow-hidden">
        {/* Left - Tabs & Table Content */}
        <div className={`flex-1 min-w-0 rounded-2xl shadow-xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-slate-200'}`}>
          {/* Tabs */}
          <div className={`border-b px-3 md:px-6 ${darkMode ? 'border-[#2E2E2E] bg-[#0A0A0A]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex gap-1">
              {TABS.map((tab: any) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 md:px-6 py-0.5 md:py-4 font-medium flex items-center gap-2 border-b-2 transition-all duration-200 ${
                      isActive
                        ? (darkMode ? 'border-[#D7B797] text-[#D7B797] bg-[#121212] -mb-px rounded-t-lg' : 'border-blue-500 text-blue-600 bg-white -mb-px rounded-t-lg')
                        : (darkMode ? 'border-transparent text-[#666666] hover:text-[#999999] hover:bg-[#1A1A1A] rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg')
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hint for editable cells */}
          {!isReadOnly && (
            <div className={`px-3 md:px-6 py-0.5 border-b flex items-center gap-2 text-sm ${darkMode ? 'bg-[rgba(215,183,151,0.08)] border-[#2E2E2E] text-[#D7B797]' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
              <Pencil size={14} className="animate-bounce" style={{ animationDuration: '2s' }} />
              <span>{t('planningDetail.editHint')}</span>
            </div>
          )}

          {/* Content */}
          <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
            {activeTab === 'collection' && renderCollectionTab()}
            {activeTab === 'gender' && renderGenderTab()}
            {activeTab === 'category' && renderCategoryTab()}
          </div>

          {/* Footer */}
          <div className={`border-t px-3 md:px-6 py-0.5 md:py-4 flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'border-[#2E2E2E] bg-[#0A0A0A]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex flex-wrap items-center gap-3 md:gap-6">
              {versions.length > 0 && (
                <div className="text-sm">
                  <span className={textMuted}>{t('planningDetail.versions')}</span>
                  <span className={`ml-2 font-bold ${accentText}`}>{versions.length} {t('planningDetail.approved')}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
              {/* Approve Button - only show when in draft mode */}
              {!isReadOnly && (
                <button
                  onClick={handleApprove}
                  disabled={approveAnimation}
                  className={`px-4 md:px-6 py-0.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden text-sm md:text-base ${
                    approveAnimation
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20 hover:shadow-xl'
                  }`}
                >
                  {approveAnimation ? (
                    <>
                      <CheckCircle2 size={18} className="animate-bounce" />
                      <span>{t('planningDetail.versionCreated').replace('{{version}}', String(versions.length))}</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{t('ticketDetail.submit')}</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onSave}
                disabled={isReadOnly}
                className={`px-4 md:px-6 py-0.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg text-sm md:text-base ${
                  isReadOnly
                    ? (darkMode ? 'bg-[#2E2E2E] text-[#666666] cursor-not-allowed shadow-none' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none')
                    : (darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A682] shadow-[#D7B797]/20 hover:shadow-xl' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 hover:shadow-xl')
                }`}
              >
                <Save size={18} />
                {t('planningDetail.savePlanning')}
              </button>
            </div>
          </div>
        </div>

        {/* Right - Approval History */}
        <div className={`w-full md:w-96 shrink-0 rounded-2xl shadow-xl border overflow-hidden flex flex-col ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-slate-200'}`}>
          <div className={`px-5 py-4 flex items-center gap-3 ${darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-gradient-to-r from-slate-700 to-slate-600'}`}>
            <History size={20} className="text-white" />
            <h3 className="font-bold text-white">{t('ticketDetail.approvalHistory')}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-280px)]">
            {renderApprovalHistory()}
          </div>
          {/* Conditional Approve/Reject Actions */}
          {pendingApproval && (
            <div className={`border-t p-4 space-y-3 ${darkMode ? 'border-[#2E2E2E] bg-[#0A0A0A]' : 'border-slate-200 bg-slate-50'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${textMuted} flex items-center gap-1.5`}>
                <AlertCircle size={12} />
                {t('approvals.level1Pending').replace('Level 1', `L${pendingApproval.level}`)} — {t('approvals.awaitingReview')}
              </div>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2] focus:border-[#D7B797]' : 'bg-white border-slate-200 focus:border-blue-400'}`}
                placeholder={t('approvals.commentPlaceholder')}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprovalAction('approve')}
                  disabled={approvalProcessing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  {t('approvals.approve')}
                </button>
                <button
                  onClick={() => handleApprovalAction('reject')}
                  disabled={approvalProcessing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  <XCircle size={14} />
                  {t('approvals.reject')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Success Overlay Animation */}
      {approveAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/30">
          <div className="animate-in zoom-in duration-300 bg-emerald-500 text-white px-10 py-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 size={50} />
            </div>
            <div className="text-2xl font-bold">{t('planningDetail.versionCreated').replace('{{version}}', String(versions.length))}</div>
            <div className="text-emerald-100">{t('planningDetail.planningDataSaved')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningDetailPage;
