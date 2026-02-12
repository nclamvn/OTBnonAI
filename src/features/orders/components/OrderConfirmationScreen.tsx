'use client';

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import {
  ShoppingCart, CheckCircle, Clock, Loader2, Package,
  Search, ChevronDown, ChevronRight, X, AlertTriangle, FileText,
  DollarSign, Truck, XCircle, Eye, Ruler, Store, Image as ImageIcon
} from 'lucide-react';
import { budgetService, proposalService } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '../../../utils';
import api from '../../../services/api';
import { ExpandableStatCard, MobileDataCard } from '../../../components/ui';
import { useIsMobile } from '@/hooks/useIsMobile';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const ORDER_STATUS: any = {
  PENDING: { color: '#D29922', bg: 'rgba(210,153,34,0.12)', label: 'Pending' },
  CONFIRMED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Confirmed' },
  SHIPPED: { color: '#58A6FF', bg: 'rgba(88,166,255,0.12)', label: 'Shipped' },
  CANCELLED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Cancelled' },
  PARTIAL: { color: '#A371F7', bg: 'rgba(163,113,247,0.12)', label: 'Partial' },
};

/* ═══════════════════════════════════════════════
   DEMO SKU DATA (for proposals without products)
═══════════════════════════════════════════════ */
const DEMO_SKUS = [
  { sku: 'BAL-OW-001', name: 'Wool Blend Overcoat', productType: 'W Outerwear', gender: 'Women', color: 'Camel', composition: '80% Wool, 20% Cashmere', srp: 45000000, rex: 4, ttp: 3, sizes: { '36': { salesMix: 8, st: 45 }, '38': { salesMix: 30, st: 52 }, '40': { salesMix: 35, st: 48 }, '42': { salesMix: 27, st: 40 } } },
  { sku: 'BAL-BG-002', name: 'Le City Medium Bag', productType: 'W Bags', gender: 'Women', color: 'Nero', composition: '100% Arena Leather', srp: 32000000, rex: 6, ttp: 4, sizes: { 'OS': { salesMix: 100, st: 65 } } },
  { sku: 'BAL-TP-003', name: 'Silk Bow Blouse', productType: 'W Tops', gender: 'Women', color: 'Ivory', composition: '100% Silk', srp: 28000000, rex: 5, ttp: 3, sizes: { '38': { salesMix: 15, st: 55 }, '40': { salesMix: 40, st: 60 }, '42': { salesMix: 30, st: 50 }, '44': { salesMix: 15, st: 42 } } },
  { sku: 'BAL-TL-004', name: 'Tailored Wool Blazer', productType: 'W Tailoring', gender: 'Women', color: 'Navy', composition: '95% Wool, 5% Elastane', srp: 38000000, rex: 3, ttp: 2, sizes: { '36': { salesMix: 10, st: 48 }, '38': { salesMix: 35, st: 55 }, '40': { salesMix: 35, st: 50 }, '42': { salesMix: 20, st: 43 } } },
  { sku: 'BAL-MO-005', name: 'Leather Bomber Jacket', productType: 'M Outerwear', gender: 'Men', color: 'Dark Brown', composition: '100% Lamb Leather', srp: 52000000, rex: 3, ttp: 2, sizes: { '48': { salesMix: 20, st: 50 }, '50': { salesMix: 40, st: 55 }, '52': { salesMix: 30, st: 48 }, '54': { salesMix: 10, st: 38 } } },
  { sku: 'BAL-KN-006', name: 'Cashmere Turtleneck', productType: 'W Tops', gender: 'Women', color: 'Cream', composition: '100% Cashmere', srp: 35000000, rex: 4, ttp: 3, sizes: { 'S': { salesMix: 15, st: 50 }, 'M': { salesMix: 40, st: 58 }, 'L': { salesMix: 30, st: 52 }, 'XL': { salesMix: 15, st: 44 } } },
  { sku: 'BAL-MT-007', name: 'Slim Fit Wool Trousers', productType: 'M Tailoring', gender: 'Men', color: 'Charcoal', composition: '98% Wool, 2% Elastane', srp: 25000000, rex: 5, ttp: 3, sizes: { '46': { salesMix: 10, st: 42 }, '48': { salesMix: 30, st: 55 }, '50': { salesMix: 35, st: 52 }, '52': { salesMix: 25, st: 46 } } },
  { sku: 'BAL-SL-008', name: 'Card Holder Wallet', productType: 'W Bags', gender: 'Women', color: 'Black', composition: '100% Calf Leather', srp: 12000000, rex: 8, ttp: 6, sizes: { 'OS': { salesMix: 100, st: 72 } } },
];

/* ═══════════════════════════════════════════════
   SIZING TABLE COMPONENT
═══════════════════════════════════════════════ */
const SizingTable = ({ item, darkMode }: any) => {
  const sizes = item.sizes || {};
  const sizeKeys = Object.keys(sizes);
  if (sizeKeys.length === 0) return null;

  const totalQty = (item.rex || 0) + (item.ttp || 0);

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-gray-300 bg-white'}`}>
      <div className={`px-4 py-0.5 text-xs font-semibold border-b font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2] bg-[#1A1A1A] border-[#2E2E2E]' : 'text-gray-600 bg-gray-50 border-gray-300'}`}>
        Sizing — {item.productType}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-[rgba(160,120,75,0.18)] text-[#666666]'}>
              <th className="px-3 py-0.5 text-left">{item.productType}</th>
              {sizeKeys.map(s => <th key={s} className="px-3 py-0.5 text-center font-['JetBrains_Mono']">{s}</th>)}
              <th className="px-3 py-0.5 text-center">Sum</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
              <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>% Sales mix</td>
              {sizeKeys.map(s => (
                <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{sizes[s].salesMix}%</td>
              ))}
              <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>100%</td>
            </tr>
            <tr className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
              <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>% ST</td>
              {sizeKeys.map(s => (
                <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{sizes[s].st}%</td>
              ))}
              <td className={`px-3 py-0.5 text-center ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>-</td>
            </tr>
            <tr className={`border-t ${darkMode ? 'border-[#2E2E2E] bg-[rgba(227,179,65,0.1)]' : 'border-gray-300 bg-[rgba(227,179,65,0.18)]'}`}>
              <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#E3B341]' : 'text-[#6B4D30]'}`}>Qty</td>
              {sizeKeys.map(s => {
                const qty = Math.round(totalQty * sizes[s].salesMix / 100);
                return <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{qty}</td>;
              })}
              <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{totalQty}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   ORDER DETAIL PANEL (expandable)
═══════════════════════════════════════════════ */
const OrderDetailPanel = ({ order, darkMode }: any) => {
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const products = order.products && order.products.length > 0 ? order.products : DEMO_SKUS;

  const border = darkMode ? 'border-[#2E2E2E]' : 'border-gray-300';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-[#999999]' : 'text-gray-700';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-600';

  return (
    <div className={`px-4 py-0.5 border-t ${border} ${darkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50/50'}`}>
      <div className="space-y-2">
        {products.map((item: any, idx: number) => {
          const isExpanded = expandedSku === (item.sku || `sku-${idx}`);
          const totalQty = (item.rex || 0) + (item.ttp || 0);
          const ttlValue = totalQty * (item.srp || 0);

          return (
            <div key={item.sku || idx} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-gray-200 bg-white'}`}>
              {/* SKU Header */}
              <div
                className={`flex items-center gap-3 px-3 py-0.5 cursor-pointer transition-colors ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-50'}`}
                onClick={() => setExpandedSku(isExpanded ? null : (item.sku || `sku-${idx}`))}
              >
                <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-gray-50 border-gray-200'}`}>
                  <ImageIcon size={14} className={textMuted} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold font-['Montserrat'] truncate ${textPrimary}`}>
                    <span className="font-['JetBrains_Mono']">{item.sku}</span> — {item.name}
                  </div>
                  <div className={`text-[10px] ${textMuted}`}>{item.gender} • {item.productType} • {item.color}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className={`text-[10px] ${textMuted}`}>REX / TTP</div>
                    <div className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{item.rex} / {item.ttp}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] ${textMuted}`}>Total</div>
                    <div className={`text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(ttlValue)}</div>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className={`px-3 pb-3 space-y-2 border-t ${border}`}>
                  {/* Product Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className={`rounded-lg border px-2.5 py-0.5 ${darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Composition</p>
                      <p className={`text-xs font-medium ${textPrimary}`}>{item.composition || '-'}</p>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-0.5 ${darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>SRP</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(item.srp || 0)}</p>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-0.5 ${darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Total Qty</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{totalQty}</p>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-0.5 ${darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>TTL Value</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(ttlValue)}</p>
                    </div>
                  </div>

                  {/* Store × Size Allocation Grid */}
                  {(() => {
                    const sizes = item.sizes || {};
                    const sizeKeys = Object.keys(sizes);
                    const storeRows = [
                      { key: 'rex', label: 'REX', color: 'bg-[#D7B797]', qty: item.rex || 0 },
                      { key: 'ttp', label: 'TTP', color: 'bg-[#127749]', qty: item.ttp || 0 },
                    ];
                    return (
                      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
                        <div className={`px-3 py-0.5 text-xs font-semibold border-b font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2] bg-[#1A1A1A] border-[#2E2E2E]' : 'text-gray-600 bg-gray-50 border-gray-300'}`}>
                          Store × Size Allocation
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className={darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-[rgba(160,120,75,0.12)] text-[#666666]'}>
                                <th className="px-3 py-0.5 text-left">Store</th>
                                {sizeKeys.length > 0
                                  ? sizeKeys.map(s => <th key={s} className="px-2 py-0.5 text-center font-['JetBrains_Mono']">{s}</th>)
                                  : <th className="px-2 py-0.5 text-center font-['JetBrains_Mono']">-</th>
                                }
                                <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">TTL Qty</th>
                                <th className="px-3 py-0.5 text-right font-['JetBrains_Mono']">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {storeRows.map((store) => (
                                <tr key={store.key} className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-200'}`}>
                                  <td className={`px-3 py-0.5 ${textPrimary}`}>
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${store.color}`} />{store.label}
                                    </span>
                                  </td>
                                  {sizeKeys.length > 0
                                    ? sizeKeys.map(s => {
                                        const sizeQty = Math.round(store.qty * (sizes[s]?.salesMix || 0) / 100);
                                        return <td key={s} className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{sizeQty}</td>;
                                      })
                                    : <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{store.qty}</td>
                                  }
                                  <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{store.qty}</td>
                                  <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(store.qty * (item.srp || 0))}</td>
                                </tr>
                              ))}
                              <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30 bg-[rgba(215,183,151,0.05)]' : 'border-[#D7B797]/40 bg-[rgba(160,120,75,0.08)]'}`}>
                                <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>Total</td>
                                {sizeKeys.length > 0
                                  ? sizeKeys.map(s => {
                                      const totalSizeQty = storeRows.reduce((sum, st) => sum + Math.round(st.qty * (sizes[s]?.salesMix || 0) / 100), 0);
                                      return <td key={s} className={`px-2 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalSizeQty}</td>;
                                    })
                                  : <td className={`px-2 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalQty}</td>
                                }
                                <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalQty}</td>
                                <td className={`px-3 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(ttlValue)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sizing */}
                  <SizingTable item={item} darkMode={darkMode} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════ */
const OrderConfirmationScreen = ({ darkMode }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Derive from approved proposals (direct /orders endpoint not yet implemented)
      const proposals = await proposalService.getAll({ status: 'APPROVED' });
      const data = Array.isArray(proposals) ? proposals : (proposals?.data || []);
      const mapped = data.map((p: any, idx: any) => ({
        id: p.id || idx + 1,
        poNumber: p.proposalCode ? `PO-${p.proposalCode.replace('PROP-', '')}` : `PO-${String(idx + 1).padStart(5, '0')}`,
        brandName: p.budget?.groupBrand?.name || p.brand?.name || p.brandName || '-',
        season: p.seasonGroup || p.season || '-',
        skuCount: p.products?.length || p.items?.length || p.skuCount || 0,
        totalValue: Number(p.totalValue || p.amount || 0),
        status: 'PENDING',
        createdAt: p.updatedAt || p.createdAt || new Date().toISOString(),
        proposalId: p.id,
        products: (p.products || []).map((prod: any) => ({
          sku: prod.sku || prod.skuCode || `SKU-${String(prod.id || 0).padStart(3, '0')}`,
          name: prod.name || prod.productName || 'Product',
          productType: prod.productType || prod.subCategory?.name || prod.category?.name || '-',
          gender: prod.gender?.name || prod.genderName || '-',
          color: prod.color || '-',
          composition: prod.composition || prod.material || '-',
          srp: prod.srp || prod.retailPrice || prod.price || 0,
          rex: prod.allocations?.find((a: any) => a.store?.name?.includes('REX'))?.quantity || prod.rexQty || 4,
          ttp: prod.allocations?.find((a: any) => a.store?.name?.includes('TTP'))?.quantity || prod.ttpQty || 3,
          sizes: prod.sizes || null,
        })),
      }));
      setOrders(mapped);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(t('orderConfirm.failedToLoad'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (order: any) => {
    setProcessing(true);
    try {
      await api.patch(`/orders/${order.id}/confirm`);
      fetchOrders();
    } catch (err: any) {
      setOrders((prev: any) => prev.map((o: any) => o.id === order.id ? { ...o, status: 'CONFIRMED' } : o));
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleCancelOrder = async (order: any) => {
    setProcessing(true);
    try {
      await api.patch(`/orders/${order.id}/cancel`);
      fetchOrders();
    } catch (err: any) {
      setOrders((prev: any) => prev.map((o: any) => o.id === order.id ? { ...o, status: 'CANCELLED' } : o));
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  // Filtered
  const filtered = useMemo(() => {
    return orders.filter((order: any) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (order.poNumber || '').toLowerCase().includes(term) ||
          (order.brandName || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o: any) => o.status === 'PENDING').length;
    const confirmed = orders.filter((o: any) => o.status === 'CONFIRMED').length;
    const shipped = orders.filter((o: any) => o.status === 'SHIPPED').length;
    const cancelled = orders.filter((o: any) => o.status === 'CANCELLED').length;
    const totalValue = orders.reduce((sum: any, o: any) => sum + (o.totalValue || 0), 0);
    const confirmedValue = orders.filter((o: any) => o.status === 'CONFIRMED').reduce((sum: any, o: any) => sum + (o.totalValue || 0), 0);
    const pendingValue = orders.filter((o: any) => o.status === 'PENDING').reduce((sum: any, o: any) => sum + (o.totalValue || 0), 0);

    return {
      total, pending, confirmed, shipped, cancelled, totalValue, confirmedValue, pendingValue,
      confirmedPct: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      statusBreakdown: [
        { label: t('orderConfirm.statusPending'), value: pending, color: '#D29922' },
        { label: t('orderConfirm.statusConfirmed'), value: confirmed, color: '#2A9E6A' },
        { label: t('orderConfirm.statusShipped'), value: shipped, color: '#58A6FF' },
        { label: t('orderConfirm.statusCancelled'), value: cancelled, color: '#F85149' },
      ].filter((b: any) => b.value > 0),
      valueBreakdown: [
        { label: t('orderConfirm.statusPending'), value: pendingValue, displayValue: formatCurrency(pendingValue), color: '#D29922' },
        { label: t('orderConfirm.statusConfirmed'), value: confirmedValue, displayValue: formatCurrency(confirmedValue), color: '#2A9E6A' },
      ].filter((b: any) => b.value > 0),
    };
  }, [orders, t]);

  const bg = darkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-[#121212]' : 'bg-white';
  const border = darkMode ? 'border-[#2E2E2E]' : 'border-gray-300';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-[#999999]' : 'text-gray-700';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Sticky Filter Bar */}
      <div className={`px-3 md:px-6 py-2 sticky top-0 z-30 border-b ${border} backdrop-blur-sm ${darkMode ? 'bg-[#121212]/95' : 'bg-white/95'}`}>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} ${isMobile ? 'flex-1 min-w-0' : 'w-48'}`}>
            <Search size={12} className={textMuted} />
            <input
              type="text"
              placeholder={t('orderConfirm.searchPlaceholder')}
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className={`bg-transparent outline-none text-xs w-full font-['Montserrat'] ${textPrimary} placeholder:${textMuted}`}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}>
                <X size={10} className={textMuted} />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className={`appearance-none px-2 py-1.5 pr-6 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} text-xs font-['Montserrat'] ${textPrimary} outline-none cursor-pointer`}
            >
              <option value="all">{t('orderConfirm.allStatuses')}</option>
              <option value="PENDING">{t('orderConfirm.statusPending')}</option>
              <option value="CONFIRMED">{t('orderConfirm.statusConfirmed')}</option>
              <option value="SHIPPED">{t('orderConfirm.statusShipped')}</option>
              <option value="CANCELLED">{t('orderConfirm.statusCancelled')}</option>
            </select>
            <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
          </div>

          <button
            onClick={fetchOrders}
            className={`px-2.5 py-1.5 rounded-lg border ${border} text-xs font-medium font-['Montserrat'] transition-all ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]' : 'text-[#6B4D30] hover:bg-[rgba(215,183,151,0.1)]'}`}
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="p-3 md:p-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <ExpandableStatCard title={t('orderConfirm.totalOrders')} value={stats.total} sub={t('orderConfirm.allPurchaseOrders')} darkMode={darkMode} icon={ShoppingCart} accent="gold" breakdown={stats.statusBreakdown} expandTitle={t('orderConfirm.allStatuses')} />
        <ExpandableStatCard title={t('orderConfirm.pendingConfirm')} value={stats.pending} sub={t('orderConfirm.awaitingConfirmation')} darkMode={darkMode} icon={Clock} accent="amber" trendLabel={stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : '0%'} trend={stats.pending > 0 ? -1 : 0} />
        <ExpandableStatCard title={t('orderConfirm.confirmed')} value={stats.confirmed} sub={t('orderConfirm.ordersConfirmed')} darkMode={darkMode} icon={CheckCircle} accent="emerald" progress={stats.confirmedPct} progressLabel={t('orderConfirm.statusConfirmed')} badges={[{ label: t('orderConfirm.statusShipped'), value: stats.shipped, color: '#58A6FF' }].filter(b => b.value > 0)} />
        <ExpandableStatCard title={t('orderConfirm.totalValue')} value={formatCurrency(stats.totalValue)} sub={t('orderConfirm.allOrdersValue')} darkMode={darkMode} icon={DollarSign} accent="blue" breakdown={stats.valueBreakdown} expandTitle={t('orderConfirm.colValue')} />
      </div>

      {/* Table */}
      <div className={`border ${border} rounded-xl overflow-hidden`} style={{
        background: darkMode
          ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.02) 40%, rgba(215,183,151,0.06) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.03) 35%, rgba(215,183,151,0.08) 100%)',
      }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className={`animate-spin ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
            <p className={`text-sm mt-3 ${textSecondary}`}>{t('orderConfirm.loadingOrders')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-[#F85149]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{error}</p>
            <button onClick={fetchOrders} className="mt-3 px-4 py-0.5 rounded-xl bg-[#D7B797] text-black text-sm font-medium font-['Montserrat']">
              {t('common.tryAgain')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={48} className={textMuted} />
            <p className={`text-base font-semibold mt-4 font-['Montserrat'] ${textPrimary}`}>{t('orderConfirm.noOrders')}</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>{t('orderConfirm.noOrdersDesc')}</p>
          </div>
        ) : isMobile ? (
          <div className="p-3 space-y-2">
            {filtered.map((order: any, idx: any) => {
              const sc = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
              const statusColorMap: any = { CONFIRMED: 'success', SHIPPED: 'info', CANCELLED: 'critical', PENDING: 'warning', PARTIAL: 'neutral' };
              return (
                <div key={order.id || idx}>
                  <MobileDataCard
                    title={order.poNumber}
                    subtitle={order.brandName}
                    status={sc.label}
                    statusColor={statusColorMap[order.status] || 'neutral'}
                    darkMode={darkMode}
                    metrics={[
                      { label: t('orderConfirm.colSeason'), value: order.season },
                      { label: t('orderConfirm.colSKUs'), value: order.skuCount || order.products?.length || 0 },
                      { label: t('orderConfirm.colValue'), value: formatCurrency(order.totalValue) },
                      { label: t('orderConfirm.colDate'), value: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-' },
                    ]}
                    actions={[
                      ...(order.status === 'PENDING' ? [
                        { label: t('common.confirm'), primary: true, onClick: () => setConfirmModal({ order, action: 'confirm' }) },
                        { label: t('common.cancel'), onClick: () => setConfirmModal({ order, action: 'cancel' }) },
                      ] : []),
                      { label: expandedOrderId === order.id ? 'Hide SKUs' : `View ${order.skuCount || order.products?.length || 0} SKUs`, onClick: () => setExpandedOrderId(expandedOrderId === order.id ? null : order.id) },
                    ]}
                  />
                  {expandedOrderId === order.id && <OrderDetailPanel order={order} darkMode={darkMode} />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} border-b ${border}`}>
                  {['', t('orderConfirm.colPO'), t('orderConfirm.colBrand'), t('orderConfirm.colSeason'), t('orderConfirm.colSKUs'), t('orderConfirm.colValue'), t('orderConfirm.colStatus'), t('orderConfirm.colDate'), t('common.actions')].map((h: any, i: number) => (
                    <th key={`${h}-${i}`} className={`px-3 py-0.5 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${textMuted} ${i === 0 ? 'w-8' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: any, idx: any) => {
                  const sc = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <Fragment key={order.id || idx}>
                      <tr className={`border-b ${border} transition-colors cursor-pointer ${isExpanded ? (darkMode ? 'bg-[rgba(215,183,151,0.05)]' : 'bg-[rgba(215,183,151,0.06)]') : (darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-50')}`}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <td className="px-3 py-0.5">
                          <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{order.poNumber}</span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-sm font-['Montserrat'] ${textPrimary}`}>{order.brandName}</span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-sm font-['Montserrat'] ${textSecondary}`}>{order.season}</span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-sm font-['JetBrains_Mono'] ${textPrimary}`}>{order.skuCount || order.products?.length || 0}</span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(order.totalValue)}</span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-['JetBrains_Mono']" style={{ color: sc.color, backgroundColor: sc.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-0.5" onClick={(e) => e.stopPropagation()}>
                          {order.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setConfirmModal({ order, action: 'confirm' })} className="flex items-center gap-1 px-3 py-0.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(42,158,106,0.12)] text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.2)]">
                                <CheckCircle size={13} /> {t('common.confirm')}
                              </button>
                              <button onClick={() => setConfirmModal({ order, action: 'cancel' })} className="flex items-center gap-1 px-3 py-0.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(248,81,73,0.1)] text-[#F85149] hover:bg-[rgba(248,81,73,0.18)]">
                                <XCircle size={13} /> {t('common.cancel')}
                              </button>
                            </div>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <span className={`text-xs font-['Montserrat'] ${textMuted}`}><Truck size={14} className="inline mr-1" />{t('orderConfirm.readyToShip')}</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0">
                            <OrderDetailPanel order={order} darkMode={darkMode} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} ${cardBg} shadow-2xl`}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-['Montserrat'] ${textPrimary}`}>
                  {confirmModal.action === 'confirm' ? t('orderConfirm.confirmOrder') : t('orderConfirm.cancelOrder')}
                </h3>
                <button onClick={() => setConfirmModal(null)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-100'}`}>
                  <X size={18} className={textMuted} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className={`rounded-xl border ${border} p-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('orderConfirm.colPO')}</span>
                    <span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{confirmModal.order.poNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('orderConfirm.colBrand')}</span>
                    <span className={`text-sm font-['Montserrat'] ${textPrimary}`}>{confirmModal.order.brandName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>{t('orderConfirm.colValue')}</span>
                    <span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(confirmModal.order.totalValue)}</span>
                  </div>
                </div>
              </div>
              {confirmModal.action === 'cancel' && (
                <p className={`text-sm mt-4 ${darkMode ? 'text-[#FF7B72]' : 'text-red-600'}`}>
                  {t('orderConfirm.cancelWarning')}
                </p>
              )}
            </div>
            <div className={`p-5 border-t ${border} flex justify-end gap-3`}>
              <button onClick={() => setConfirmModal(null)} className={`px-4 py-0.5 rounded-xl border ${border} text-sm font-medium font-['Montserrat'] ${textSecondary} transition-all ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-100'}`}>
                {t('common.back')}
              </button>
              <button
                onClick={() => confirmModal.action === 'confirm' ? handleConfirmOrder(confirmModal.order) : handleCancelOrder(confirmModal.order)}
                disabled={processing}
                className={`px-5 py-0.5 rounded-xl text-sm font-semibold font-['Montserrat'] transition-all disabled:opacity-50 ${confirmModal.action === 'confirm' ? 'bg-[#2A9E6A] text-white hover:bg-[#238a5a]' : 'bg-[#F85149] text-white hover:bg-[#e04440]'}`}
              >
                {processing ? <Loader2 size={16} className="animate-spin mx-auto" /> : confirmModal.action === 'confirm' ? t('common.confirm') : t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default OrderConfirmationScreen;
