'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Save, Plus, Trash2, Search,
  Package, DollarSign, ShoppingCart, Store, ChevronDown, ChevronRight,
  Check, X, AlertCircle, Send, Hash, CheckCircle, XCircle
} from 'lucide-react';
import { formatCurrency } from '../../../utils';
import { masterDataService, proposalService, budgetService, approvalService } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '../../../components/ui';

const ProposalDetailPage = ({ proposal, onBack, onSave, entityId }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { user } = useAuth();
  const { dialogProps, confirm } = useConfirmDialog();

  // Approval action states
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalProcessing, setApprovalProcessing] = useState(false);
  const [ticketName, setTicketName] = useState(proposal?.ticketName || proposal?.subCategory?.name || 'New Proposal');

  // API data states
  const [allStores, setAllStores] = useState<any[]>([]);
  const [skuMasterData, setSkuMasterData] = useState<any[]>([]);
  const [budgetInfo, setBudgetInfo] = useState({ name: '', totalBudget: 0, remainingBudget: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch stores, SKU catalog, and budget info from API
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [storesRes, skuRes] = await Promise.all([
          masterDataService.getStores().catch(() => []),
          masterDataService.getSkuCatalog().catch(() => ({ data: [] }))
        ]);

        const allStoresRaw = Array.isArray(storesRes) ? storesRes : (storesRes?.data || []);
        // Only show REX and TTP stores
        const stores = allStoresRaw.filter((s: any) => {
          const code = (s.code || s.storeCode || s.name || '').toUpperCase();
          return code === 'REX' || code === 'TTP';
        });
        setAllStores((stores.length > 0 ? stores : allStoresRaw.slice(0, 2)).map((s: any) => ({
          id: s.id || s.code?.toLowerCase(),
          code: s.code || s.storeCode,
          name: s.name || s.storeName,
          region: s.region || ''
        })));

        const skus = Array.isArray(skuRes) ? skuRes : (skuRes?.data || []);
        setSkuMasterData(skus.map((s: any) => ({
          id: s.id,
          code: s.skuCode || s.code,
          name: s.productName || s.name,
          rail: s.rail || '',
          productType: s.productType || s.category || '',
          theme: s.theme || '',
          color: s.color || '',
          composition: s.composition || '',
          unitCost: Number(s.unitCost) || 0,
          imageUrl: s.imageUrl || `https://placehold.co/80x80/f8fafc/475569?text=${(s.skuCode || s.code || 'SKU').substring(0, 4)}`
        })));

        // Fetch budget info if budgetId available
        if (proposal?.budgetId) {
          try {
            const budget = await budgetService.getOne(proposal.budgetId);
            setBudgetInfo({
              name: budget.name || budget.ticketName || '',
              totalBudget: Number(budget.totalBudget || budget.amount) || 0,
              remainingBudget: Number(budget.remainingBudget || budget.totalBudget || budget.amount) || 0
            });
          } catch (e: any) {
            console.error('Failed to fetch budget info:', e);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch proposal detail data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [proposal?.budgetId]);

  // Check for pending approval for this entity
  useEffect(() => {
    if (!entityId) return;
    const checkApproval = async () => {
      try {
        const pending = await approvalService.getPending();
        const items = Array.isArray(pending) ? pending : [];
        const match = items.find((a: any) => a.entityType === 'proposal' && a.entityId === entityId);
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

  // Get context info from proposal (passed from OTB Analysis)
  const contextInfo = {
    budgetName: proposal?.budgetName || budgetInfo.name,
    fiscalYear: proposal?.fiscalYear,
    brandName: proposal?.brandName,
    seasonGroup: proposal?.seasonGroup,
    season: proposal?.season,
    gender: proposal?.gender,
    category: proposal?.category,
    subCategory: proposal?.subCategory,
    otbData: proposal?.otbData
  };

  // Initialize skuList from proposal products if editing, otherwise empty
  const [skuList, setSkuList] = useState(() => {
    if (proposal?.products && proposal.products.length > 0) {
      return proposal.products.map((p: any) => ({
        id: p.id || p.skuId,
        code: p.skuCode || p.code,
        name: p.productName || p.name,
        rail: p.rail || '',
        productType: p.productType || p.category || '',
        theme: p.theme || '',
        color: p.color || '',
        composition: p.composition || '',
        unitCost: Number(p.unitCost) || 0,
        imageUrl: p.imageUrl || `https://placehold.co/80x80/f8fafc/475569?text=SKU`,
        stores: p.stores || [{ storeId: allStores[0]?.id || 'store1', quantity: p.orderQty || 0 }]
      }));
    }
    return [];
  });
  const [expandedSku, setExpandedSku] = useState<any>(null);
  const [showAddSkuModal, setShowAddSkuModal] = useState(false);
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [selectedSkusToAdd, setSelectedSkusToAdd] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<any>(null);
  const [editValue, setEditValue] = useState('');

  // Calculate totals
  const calculateSkuTotals = (sku: any) => {
    const order = sku.stores.reduce((sum: any, s: any) => sum + s.quantity, 0);
    return { order, ttlValue: order * sku.unitCost };
  };

  const grandTotals = useMemo(() => {
    let totalOrder = 0, totalValue = 0;
    skuList.forEach((sku: any) => {
      const { order, ttlValue } = calculateSkuTotals(sku);
      totalOrder += order;
      totalValue += ttlValue;
    });
    return { totalOrder, totalValue, skuCount: skuList.length };
  }, [skuList]);

  const availableSkus = useMemo(() => {
    const existingIds = skuList.map((s: any) => s.id);
    return skuMasterData.filter((sku: any) =>
      !existingIds.includes(sku.id) &&
      (sku.code.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
       sku.name.toLowerCase().includes(skuSearchQuery.toLowerCase()))
    );
  }, [skuList, skuSearchQuery]);

  const handleAddSkus = () => {
    const newSkus = selectedSkusToAdd.map((skuId: any) => {
      const masterSku = skuMasterData.find((s: any) => s.id === skuId);
      return { ...masterSku, stores: [{ storeId: 'rex', quantity: 0 }] };
    });
    setSkuList((prev: any) => [...prev, ...newSkus]);
    setSelectedSkusToAdd([]);
    setShowAddSkuModal(false);
    setSkuSearchQuery('');
  };

  const handleRemoveSku = (skuId: any) => {
    confirm({
      title: t('common.delete'),
      message: t('common.confirmDelete'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      onConfirm: () => setSkuList((prev: any) => prev.filter((s: any) => s.id !== skuId)),
    });
  };
  

  const handleAddStore = (skuId: any, storeId: any) => {
    setSkuList((prev: any) => prev.map((sku: any) => {
      if (sku.id === skuId && !sku.stores.some((s: any) => s.storeId === storeId)) {
        return { ...sku, stores: [...sku.stores, { storeId, quantity: 0 }] };
      }
      return sku;
    }));
  };

  const handleRemoveStore = (skuId: any, storeId: any) => {
    setSkuList((prev: any) => prev.map((sku: any) => {
      if (sku.id === skuId) {
        return { ...sku, stores: sku.stores.filter((s: any) => s.storeId !== storeId) };
      }
      return sku;
    }));
  };

  const handleQuantityChange = (skuId: any, storeId: any, newQuantity: any) => {
    const qty = parseInt(newQuantity) || 0;
    setSkuList((prev: any) => prev.map((sku: any) => {
      if (sku.id === skuId) {
        return { ...sku, stores: sku.stores.map((s: any) => s.storeId === storeId ? { ...s, quantity: qty } : s) };
      }
      return sku;
    }));
  };

  const getStoreInfo = (storeId: any) => allStores.find((s: any) => s.id === storeId);
  const getAvailableStores = (skuId: any) => {
    const sku = skuList.find((s: any) => s.id === skuId);
    if (!sku) return allStores;
    const existingStoreIds = sku.stores.map((s: any) => s.storeId);
    return allStores.filter((s: any) => !existingStoreIds.includes(s.id));
  };

  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      const proposalData = { ticketName, budgetId: proposal?.budgetId };
      let savedProposal;
      if (proposal?.id) {
        savedProposal = await proposalService.update(proposal.id, proposalData);
        if (skuList.length > 0) {
          await proposalService.bulkAddProducts(proposal.id, skuList.map((sku: any) => ({
            skuId: sku.id,
            skuCode: sku.code,
            productName: sku.name,
            unitCost: sku.unitCost,
            orderQty: sku.stores.reduce((sum: any, s: any) => sum + s.quantity, 0),
            stores: sku.stores
          })));
        }
      } else {
        savedProposal = await proposalService.create(proposalData);
        if (savedProposal?.id && skuList.length > 0) {
          await proposalService.bulkAddProducts(savedProposal.id, skuList.map((sku: any) => ({
            skuId: sku.id,
            skuCode: sku.code,
            productName: sku.name,
            unitCost: sku.unitCost,
            orderQty: sku.stores.reduce((sum: any, s: any) => sum + s.quantity, 0),
            stores: sku.stores
          })));
        }
      }
      onSave && onSave({ ticketName, skuList, totals: grandTotals, savedProposal });
    } catch (err: any) {
      console.error('Failed to save proposal:', err);
    } finally {
      setSaving(false);
    }
  };

  const budgetUsagePercent = (grandTotals.totalValue / budgetInfo.remainingBudget) * 100;
  const isOverBudget = grandTotals.totalValue > budgetInfo.remainingBudget;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Compact Header */}
      <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-0.5 md:py-4 sticky top-0 z-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                  <ShoppingCart size={isMobile ? 16 : 20} className="text-purple-600" />
                </div>
                <div className="min-w-0">
                  <input
                    type="text"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    className="text-base md:text-lg font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
                    placeholder={t('proposal.newProposal')}
                  />
                  <div className="text-xs text-slate-500 truncate">{t('proposal.budgetInfo')}: {contextInfo.budgetName}</div>
                </div>
              </div>
            </div>
            {/* Context Info from OTB Analysis */}
            {contextInfo.gender && (
              <div className="flex flex-wrap items-center gap-2 ml-0 md:ml-4 px-2 md:px-3 py-0.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">{t('budget.fiscalYear')}</span>
                  <span className="font-semibold text-indigo-700">{contextInfo.fiscalYear}</span>
                </div>
                <div className="w-px h-4 bg-indigo-200 hidden md:block"></div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">{t('skuProposal.season')}:</span>
                  <span className="font-semibold text-amber-700">{contextInfo.seasonGroup} - {contextInfo.season}</span>
                </div>
                <div className="w-px h-4 bg-indigo-200 hidden md:block"></div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">{t('skuProposal.category')}:</span>
                  <span className="font-semibold text-purple-700">{contextInfo.gender?.name} / {contextInfo.category?.name} / {contextInfo.subCategory?.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Center Stats */}
          <div className="flex flex-wrap items-center gap-2 md:gap-6 text-xs md:text-sm w-full md:w-auto">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Package size={14} className="text-slate-400" />
              <span className="text-slate-600"><strong className="text-slate-800">{grandTotals.skuCount}</strong> {t('header.kpiSKUs')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <Hash size={14} className="text-slate-400" />
              <span className="text-slate-600"><strong className="text-slate-800">{grandTotals.totalOrder}</strong> {t('proposal.order')}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <DollarSign size={14} className="text-slate-400" />
              <span className="text-slate-600">{t('proposal.totalValue')}: <strong className={isOverBudget ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(grandTotals.totalValue)}</strong></span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="text-slate-600">
              {t('proposal.remainingBudget')}: <strong className="text-purple-600">{formatCurrency(budgetInfo.remainingBudget)}</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            {pendingApproval ? (
              <>
                <input
                  type="text"
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-blue-400 w-full md:w-48"
                  placeholder={t('approvals.commentPlaceholder')}
                />
                <button
                  onClick={() => handleApprovalAction('approve')}
                  disabled={approvalProcessing}
                  className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  {t('approvals.approve')} L{pendingApproval.level}
                </button>
                <button
                  onClick={() => handleApprovalAction('reject')}
                  disabled={approvalProcessing}
                  className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  <XCircle size={14} />
                  {t('approvals.reject')}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} className="flex items-center justify-center gap-2 px-4 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                  <Save size={16} />
                  {t('common.save')}
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Send size={16} />
                  {t('common.submit')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Budget Warning */}
      {isOverBudget && (
        <div className="px-3 md:px-6 py-0.5 bg-red-50 border-b border-red-200 flex flex-wrap items-center justify-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{t('budget.remaining')}: -<strong>{formatCurrency(grandTotals.totalValue - budgetInfo.remainingBudget)}</strong></span>
        </div>
      )}

      {/* Main Content */}
      <div className="p-3 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-semibold text-slate-800">{t('proposal.skuCode')}</h2>
          <button
            onClick={() => setShowAddSkuModal(true)}
            className="flex items-center gap-2 px-4 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            {t('proposal.addSku')}
          </button>
        </div>

        {/* SKU Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {skuList.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-600 font-medium">{t('skuProposal.noSkuData')}</p>
              <p className="text-sm text-slate-400 mt-1">{t('proposal.addSku')}</p>
            </div>
          ) : isMobile ? (
            /* Mobile Card View */
            <div className="divide-y divide-slate-100">
              {skuList.map((sku: any) => {
                const { order, ttlValue } = calculateSkuTotals(sku);
                const isExpanded = expandedSku === sku.id;
                const availableStoresForSku = getAvailableStores(sku.id);

                return (
                  <div key={sku.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={sku.imageUrl}
                        alt={sku.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                        onError={(e) => { (e.target as any).onerror = null; (e.target as any).src = 'https://placehold.co/48x48/f1f5f9/64748b?text=SKU'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono text-xs text-purple-600 font-semibold">{sku.code}</span>
                            <div className="font-medium text-slate-800 text-sm truncate">{sku.name}</div>
                            <div className="text-xs text-slate-400">{sku.theme}</div>
                          </div>
                          <button onClick={() => handleRemoveSku(sku.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                          <span>{sku.rail} / {sku.productType}</span>
                          <span>{sku.color}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-slate-50 rounded-lg px-2 py-0.5 text-center">
                            <div className="text-[10px] text-slate-400 uppercase">{t('proposal.unitCost')}</div>
                            <div className="text-xs font-semibold text-slate-700">{formatCurrency(sku.unitCost)}</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-2 py-0.5 text-center">
                            <div className="text-[10px] text-slate-400 uppercase">{t('proposal.order')}</div>
                            <div className="text-xs font-semibold text-slate-800">{order}</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-2 py-0.5 text-center">
                            <div className="text-[10px] text-slate-400 uppercase">{t('proposal.totalValue')}</div>
                            <div className="text-xs font-semibold text-emerald-600">{formatCurrency(ttlValue)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedSku(isExpanded ? null : sku.id)}
                          className="mt-2 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                        >
                          <Store size={12} />
                          {sku.stores.length} {t('proposal.store')}
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Store Details */}
                    {isExpanded && (
                      <div className="mt-3 ml-2 pl-3 border-l-2 border-purple-300">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Store size={12} className="text-purple-500" />
                            {t('ticketDetail.storeAllocation')}
                          </h4>
                          {availableStoresForSku.length > 0 && (
                            <div className="relative group">
                              <button className="flex items-center gap-1 px-2 py-0.5 text-xs text-purple-600 hover:bg-purple-100 rounded transition-colors">
                                <Plus size={12} />
                                {t('proposal.selectStore')}
                              </button>
                              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                                {availableStoresForSku.map((store: any) => (
                                  <div
                                    key={store.id}
                                    onClick={() => handleAddStore(sku.id, store.id)}
                                    className="px-3 py-0.5 text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                                  >
                                    <span className="w-6 h-6 bg-purple-100 rounded text-xs font-bold text-purple-600 flex items-center justify-center">{store.code}</span>
                                    {store.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sku.stores.map((storeQty: any) => {
                            const storeInfo = getStoreInfo(storeQty.storeId);
                            const cellKey = `${sku.id}_${storeQty.storeId}`;
                            const isEditingStore = editingCell === cellKey;
                            return (
                              <div key={storeQty.storeId} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                                <span className="w-6 h-6 bg-purple-100 rounded text-[10px] font-bold text-purple-600 flex items-center justify-center">
                                  {storeInfo?.code}
                                </span>
                                <span className="text-xs text-slate-600">{storeInfo?.name}</span>
                                {isEditingStore ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => { handleQuantityChange(sku.id, storeQty.storeId, editValue); setEditingCell(null); }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') { handleQuantityChange(sku.id, storeQty.storeId, editValue); setEditingCell(null); }
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-12 px-1 py-0.5 text-center border border-purple-400 rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    onClick={() => { setEditingCell(cellKey); setEditValue(storeQty.quantity.toString()); }}
                                    className="w-12 px-1 py-0.5 text-center bg-slate-50 border border-slate-200 rounded cursor-pointer hover:border-purple-300 text-xs font-medium text-slate-700"
                                  >
                                    {storeQty.quantity}
                                  </div>
                                )}
                                {sku.stores.length > 1 && (
                                  <button onClick={() => handleRemoveStore(sku.id, storeQty.storeId)} className="p-0.5 hover:bg-red-50 rounded">
                                    <X size={10} className="text-red-400" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Totals */}
              <div className="p-3 bg-[rgba(160,120,75,0.18)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#666666]">{t('skuProposal.total')}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#333333]">{grandTotals.totalOrder} {t('proposal.order')}</span>
                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(grandTotals.totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(160,120,75,0.18)] border-b border-[rgba(160,120,75,0.25)]">
                  <th className="w-10 px-3 py-0.5"></th>
                  <th className="text-left px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.skuCode')}</th>
                  <th className="text-left px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.productName')}</th>
                  <th className="text-left px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.rail')} / {t('proposal.productType')}</th>
                  <th className="text-left px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.color')}</th>
                  <th className="text-right px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.unitCost')}</th>
                  <th className="text-center px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.store')}</th>
                  <th className="text-center px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.order')}</th>
                  <th className="text-right px-4 py-0.5 text-xs font-semibold text-[#666666] uppercase">{t('proposal.totalValue')}</th>
                  <th className="w-12 px-3 py-0.5"></th>
                </tr>
              </thead>
              <tbody>
                {skuList.map((sku: any) => {
                  const { order, ttlValue } = calculateSkuTotals(sku);
                  const isExpanded = expandedSku === sku.id;
                  const availableStoresForSku = getAvailableStores(sku.id);

                  return (
                    <React.Fragment key={sku.id}>
                      <tr className={`border-b border-slate-100 hover:bg-slate-50 ${isExpanded ? 'bg-purple-50/50' : ''}`}>
                        <td className="px-3 py-0.5">
                          <button
                            onClick={() => setExpandedSku(isExpanded ? null : sku.id)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                          </button>
                        </td>
                        <td className="px-4 py-0.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={sku.imageUrl}
                              alt={sku.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                              onError={(e) => { (e.target as any).onerror = null; (e.target as any).src = 'https://placehold.co/40x40/f1f5f9/64748b?text=SKU'; }}
                            />
                            <span className="font-mono text-xs text-purple-600 font-semibold">{sku.code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-0.5">
                          <div className="font-medium text-slate-800">{sku.name}</div>
                          <div className="text-xs text-slate-400">{sku.theme}</div>
                        </td>
                        <td className="px-4 py-0.5">
                          <div className="text-sm text-slate-700">{sku.rail}</div>
                          <div className="text-xs text-slate-400">{sku.productType}</div>
                        </td>
                        <td className="px-4 py-0.5 text-sm text-slate-700">{sku.color}</td>
                        <td className="px-4 py-0.5 text-right font-medium text-slate-700">{formatCurrency(sku.unitCost)}</td>
                        <td className="px-4 py-0.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                            <Store size={12} />
                            {sku.stores.length}
                          </span>
                        </td>
                        <td className="px-4 py-0.5 text-center font-semibold text-slate-800">{order}</td>
                        <td className="px-4 py-0.5 text-right font-semibold text-emerald-600">{formatCurrency(ttlValue)}</td>
                        <td className="px-3 py-0.5">
                          <button onClick={() => handleRemoveSku(sku.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} className="text-red-500" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Store Details */}
                      {isExpanded && (
                        <tr className="bg-[rgba(160,120,75,0.12)]">
                          <td colSpan={10} className="px-4 py-4">
                            <div className="ml-8 pl-4 border-l-2 border-purple-300">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                  <Store size={14} className="text-purple-500" />
                                  {t('ticketDetail.storeAllocation')}
                                </h4>
                                {availableStoresForSku.length > 0 && (
                                  <div className="relative group">
                                    <button className="flex items-center gap-1 px-2 py-0.5 text-xs text-purple-600 hover:bg-purple-100 rounded transition-colors">
                                      <Plus size={12} />
                                      {t('proposal.selectStore')}
                                    </button>
                                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                                      {availableStoresForSku.map((store: any) => (
                                        <div
                                          key={store.id}
                                          onClick={() => handleAddStore(sku.id, store.id)}
                                          className="px-3 py-0.5 text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                                        >
                                          <span className="w-6 h-6 bg-purple-100 rounded text-xs font-bold text-purple-600 flex items-center justify-center">{store.code}</span>
                                          {store.name}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {sku.stores.map((storeQty: any) => {
                                  const storeInfo = getStoreInfo(storeQty.storeId);
                                  const cellKey = `${sku.id}_${storeQty.storeId}`;
                                  const isEditing = editingCell === cellKey;

                                  return (
                                    <div key={storeQty.storeId} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-0.5">
                                      <span className="w-7 h-7 bg-purple-100 rounded-lg text-xs font-bold text-purple-600 flex items-center justify-center">
                                        {storeInfo?.code}
                                      </span>
                                      <span className="text-sm text-slate-600 min-w-[70px]">{storeInfo?.name}</span>

                                      {isEditing ? (
                                        <input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onBlur={() => { handleQuantityChange(sku.id, storeQty.storeId, editValue); setEditingCell(null); }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') { handleQuantityChange(sku.id, storeQty.storeId, editValue); setEditingCell(null); }
                                            if (e.key === 'Escape') setEditingCell(null);
                                          }}
                                          className="w-14 px-2 py-0.5 text-center border border-purple-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                          autoFocus
                                        />
                                      ) : (
                                        <div
                                          onClick={() => { setEditingCell(cellKey); setEditValue(storeQty.quantity.toString()); }}
                                          className="w-14 px-2 py-0.5 text-center bg-slate-50 border border-slate-200 rounded cursor-pointer hover:border-purple-300 text-sm font-medium text-slate-700"
                                        >
                                          {storeQty.quantity}
                                        </div>
                                      )}

                                      {sku.stores.length > 1 && (
                                        <button onClick={() => handleRemoveStore(sku.id, storeQty.storeId)} className="p-1 hover:bg-red-50 rounded">
                                          <X size={12} className="text-red-400" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Totals Row */}
                <tr className="bg-[rgba(160,120,75,0.18)] font-semibold">
                  <td colSpan={7} className="px-4 py-0.5 text-right text-[#666666]">{t('skuProposal.total')}</td>
                  <td className="px-4 py-0.5 text-center text-[#333333]">{grandTotals.totalOrder}</td>
                  <td className="px-4 py-0.5 text-right text-emerald-600">{formatCurrency(grandTotals.totalValue)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Add SKU Modal */}
      {showAddSkuModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-xl md:rounded-xl shadow-xl w-full md:max-w-2xl max-h-[85vh] md:max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">{t('proposal.addSku')}</h2>
                <button onClick={() => { setShowAddSkuModal(false); setSelectedSkusToAdd([]); setSkuSearchQuery(''); }} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
              <div className="mt-3 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`${t('common.search')}...`}
                  value={skuSearchQuery}
                  onChange={(e) => setSkuSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto p-3">
              {availableSkus.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('skuProposal.noSkuData')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {availableSkus.map((sku: any) => {
                    const isSelected = selectedSkusToAdd.includes(sku.id);
                    return (
                      <div
                        key={sku.id}
                        onClick={() => {
                          if (isSelected) setSelectedSkusToAdd((prev: any) => prev.filter((id: any) => id !== sku.id));
                          else setSelectedSkusToAdd((prev: any) => [...prev, sku.id]);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'}`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <img src={sku.imageUrl} alt={sku.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-600">{sku.code}</span>
                            <span className="text-xs text-slate-400">{sku.productType}</span>
                          </div>
                          <div className="font-medium text-slate-800 text-sm truncate">{sku.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">{t('proposal.unitCost')}</div>
                          <div className="font-semibold text-purple-600 text-sm">{formatCurrency(sku.unitCost)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-600">{selectedSkusToAdd.length}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowAddSkuModal(false); setSelectedSkusToAdd([]); }} className="px-4 py-0.5 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddSkus}
                  disabled={selectedSkusToAdd.length === 0}
                  className={`px-4 py-0.5 rounded-lg text-sm font-medium ${
                    selectedSkusToAdd.length > 0 ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {t('proposal.addSku')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog darkMode {...dialogProps} />
    </div>
  );
};

export default ProposalDetailPage;
