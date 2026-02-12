'use client';

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Receipt, CheckCircle, Clock, Loader2, Package,
  Search, ChevronDown, ChevronRight, X, AlertTriangle, FileText,
  ClipboardCheck, XCircle, AlertCircle, BarChart3, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '../../../utils';
import { proposalService } from '../../../services/proposalService';
import { ExpandableStatCard, MobileDataCard } from '../../../components/ui';
import { useIsMobile } from '@/hooks/useIsMobile';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const RECEIPT_STATUS: any = {
  PENDING: { color: '#D29922', bg: 'rgba(210,153,34,0.12)', label: 'Pending' },
  CONFIRMED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Confirmed' },
  DISCREPANCY: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Discrepancy' },
  PARTIAL: { color: '#A371F7', bg: 'rgba(163,113,247,0.12)', label: 'Partial' },
};

/* ═══════════════════════════════════════════════
   DEMO SKU DATA
═══════════════════════════════════════════════ */
const DEMO_SKUS = [
  { sku: 'BAL-OW-001', name: 'Wool Blend Overcoat', productType: 'W Outerwear', gender: 'Women', color: 'Camel', composition: '80% Wool, 20% Cashmere', srp: 45000000, rex: 4, ttp: 3, orderedQty: 7, receivedQty: 7, sizes: { '36': { salesMix: 8, st: 45 }, '38': { salesMix: 30, st: 52 }, '40': { salesMix: 35, st: 48 }, '42': { salesMix: 27, st: 40 } } },
  { sku: 'BAL-BG-002', name: 'Le City Medium Bag', productType: 'W Bags', gender: 'Women', color: 'Nero', composition: '100% Arena Leather', srp: 32000000, rex: 6, ttp: 4, orderedQty: 10, receivedQty: 10, sizes: { 'OS': { salesMix: 100, st: 65 } } },
  { sku: 'BAL-TP-003', name: 'Silk Bow Blouse', productType: 'W Tops', gender: 'Women', color: 'Ivory', composition: '100% Silk', srp: 28000000, rex: 5, ttp: 3, orderedQty: 8, receivedQty: 8, sizes: { '38': { salesMix: 15, st: 55 }, '40': { salesMix: 40, st: 60 }, '42': { salesMix: 30, st: 50 }, '44': { salesMix: 15, st: 42 } } },
  { sku: 'BAL-TL-004', name: 'Tailored Wool Blazer', productType: 'W Tailoring', gender: 'Women', color: 'Navy', composition: '95% Wool, 5% Elastane', srp: 38000000, rex: 3, ttp: 2, orderedQty: 5, receivedQty: 4, sizes: { '36': { salesMix: 10, st: 48 }, '38': { salesMix: 35, st: 55 }, '40': { salesMix: 35, st: 50 }, '42': { salesMix: 20, st: 43 } } },
  { sku: 'BAL-MO-005', name: 'Leather Bomber Jacket', productType: 'M Outerwear', gender: 'Men', color: 'Dark Brown', composition: '100% Lamb Leather', srp: 52000000, rex: 3, ttp: 2, orderedQty: 5, receivedQty: 5, sizes: { '48': { salesMix: 20, st: 50 }, '50': { salesMix: 40, st: 55 }, '52': { salesMix: 30, st: 48 }, '54': { salesMix: 10, st: 38 } } },
  { sku: 'BAL-KN-006', name: 'Cashmere Turtleneck', productType: 'W Tops', gender: 'Women', color: 'Cream', composition: '100% Cashmere', srp: 35000000, rex: 4, ttp: 3, orderedQty: 7, receivedQty: 7, sizes: { 'S': { salesMix: 15, st: 50 }, 'M': { salesMix: 40, st: 58 }, 'L': { salesMix: 30, st: 52 }, 'XL': { salesMix: 15, st: 44 } } },
  { sku: 'BAL-MT-007', name: 'Slim Fit Wool Trousers', productType: 'M Tailoring', gender: 'Men', color: 'Charcoal', composition: '98% Wool, 2% Elastane', srp: 25000000, rex: 5, ttp: 3, orderedQty: 8, receivedQty: 8, sizes: { '46': { salesMix: 10, st: 42 }, '48': { salesMix: 30, st: 55 }, '50': { salesMix: 35, st: 52 }, '52': { salesMix: 25, st: 46 } } },
  { sku: 'BAL-SL-008', name: 'Card Holder Wallet', productType: 'W Bags', gender: 'Women', color: 'Black', composition: '100% Calf Leather', srp: 12000000, rex: 8, ttp: 6, orderedQty: 14, receivedQty: 13, sizes: { 'OS': { salesMix: 100, st: 72 } } },
];

/* ═══════════════════════════════════════════════
   SIZING TABLE
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
              {sizeKeys.map(s => <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{sizes[s].salesMix}%</td>)}
              <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>100%</td>
            </tr>
            <tr className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
              <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>% ST</td>
              {sizeKeys.map(s => <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{sizes[s].st}%</td>)}
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
   RECEIPT DETAIL PANEL (expandable)
═══════════════════════════════════════════════ */
const ReceiptDetailPanel = ({ receipt, darkMode }: any) => {
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const products = receipt.products && receipt.products.length > 0 ? receipt.products : DEMO_SKUS;

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
          const orderedQty = item.orderedQty || totalQty;
          const receivedQty = item.receivedQty ?? orderedQty;
          const hasDiscrepancy = receivedQty < orderedQty;

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
                    <div className={`text-[10px] ${textMuted}`}>Ordered / Received</div>
                    <div className={`text-xs font-semibold font-['JetBrains_Mono'] ${hasDiscrepancy ? 'text-[#F85149]' : textPrimary}`}>
                      {orderedQty} / {receivedQty}
                      {hasDiscrepancy && <AlertCircle size={10} className="inline ml-1 text-[#F85149]" />}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] ${textMuted}`}>Value</div>
                    <div className={`text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(ttlValue)}</div>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className={`px-3 pb-3 space-y-2 border-t ${border}`}>
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
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>REX / TTP</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{item.rex} / {item.ttp}</p>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-0.5 ${hasDiscrepancy ? (darkMode ? 'bg-[rgba(248,81,73,0.1)] border-[rgba(248,81,73,0.3)]' : 'bg-red-50 border-red-200') : (darkMode ? 'bg-[#1A1A1A]/60 border-[#2E2E2E]' : 'bg-gray-50 border-gray-200')}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Received</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${hasDiscrepancy ? 'text-[#F85149]' : (darkMode ? 'text-[#2A9E6A]' : 'text-green-600')}`}>
                        {receivedQty} / {orderedQty} {hasDiscrepancy ? '(!)' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Store Allocation */}
                  <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
                    <div className={`px-3 py-0.5 text-xs font-semibold border-b font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2] bg-[#1A1A1A] border-[#2E2E2E]' : 'text-gray-600 bg-gray-50 border-gray-300'}`}>
                      Store Allocation
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-[rgba(160,120,75,0.12)] text-[#666666]'}>
                          <th className="px-3 py-0.5 text-left">Store</th>
                          <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">Qty</th>
                          <th className="px-3 py-0.5 text-right font-['JetBrains_Mono']">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-200'}`}>
                          <td className={`px-3 py-0.5 ${textPrimary}`}><span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#D7B797]" />REX</span></td>
                          <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{item.rex || 0}</td>
                          <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency((item.rex || 0) * (item.srp || 0))}</td>
                        </tr>
                        <tr className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-200'}`}>
                          <td className={`px-3 py-0.5 ${textPrimary}`}><span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#127749]" />TTP</span></td>
                          <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{item.ttp || 0}</td>
                          <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency((item.ttp || 0) * (item.srp || 0))}</td>
                        </tr>
                        <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30 bg-[rgba(215,183,151,0.05)]' : 'border-[#D7B797]/40 bg-[rgba(160,120,75,0.08)]'}`}>
                          <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>Total</td>
                          <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalQty}</td>
                          <td className={`px-3 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(ttlValue)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

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
const ReceiptConfirmationScreen = ({ darkMode }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('');
  const [expandedReceiptId, setExpandedReceiptId] = useState<any>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalService.getAll({ status: 'APPROVED' });
      const data = response.data || response;
      const proposals = Array.isArray(data) ? data : [];
      const mapped = proposals.map((p: any, idx: any) => ({
        id: p.id || idx + 1,
        receiptNumber: `REC-${String(idx + 1).padStart(5, '0')}`,
        poReference: p.proposalCode || `PO-${String(idx + 1).padStart(5, '0')}`,
        brandName: p.budget?.groupBrand?.name || p.brandName || '-',
        itemCount: p.products?.length || p.skuCount || 0,
        orderedQty: p.products?.reduce((sum: any, pr: any) => sum + (pr.totalQuantity || 0), 0) || p.totalQty || 0,
        receivedQty: 0,
        status: 'PENDING',
        receivedDate: null,
        createdAt: p.updatedAt || p.createdAt || new Date().toISOString(),
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
          orderedQty: prod.totalQuantity || 7,
          receivedQty: prod.receivedQuantity || 6,
          sizes: prod.sizes || null,
        })),
      }));
      setReceipts(mapped);
    } catch (err: any) {
      console.error('Failed to fetch receipts:', err);
      setError(t('receiptConfirm.failedToLoad'));
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (receipt: any) => {
    setProcessing(true);
    setReceipts((prev: any) => prev.map((r: any) => r.id === receipt.id ? { ...r, status: 'CONFIRMED', receivedQty: r.orderedQty, receivedDate: new Date().toISOString() } : r));
    setProcessing(false);
    setConfirmModal(null);
  };

  const handleFlagDiscrepancy = async (receipt: any) => {
    setProcessing(true);
    setReceipts((prev: any) => prev.map((r: any) => r.id === receipt.id ? { ...r, status: 'DISCREPANCY', discrepancyNote } : r));
    setProcessing(false);
    setConfirmModal(null);
    setDiscrepancyNote('');
  };

  const filtered = useMemo(() => {
    return receipts.filter((receipt: any) => {
      if (statusFilter !== 'all' && receipt.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (receipt.receiptNumber || '').toLowerCase().includes(term) ||
          (receipt.poReference || '').toLowerCase().includes(term) ||
          (receipt.brandName || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [receipts, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = receipts.length;
    const pending = receipts.filter((r: any) => r.status === 'PENDING').length;
    const confirmed = receipts.filter((r: any) => r.status === 'CONFIRMED').length;
    const discrepancy = receipts.filter((r: any) => r.status === 'DISCREPANCY').length;
    const partial = receipts.filter((r: any) => r.status === 'PARTIAL').length;

    return {
      total, pending, confirmed, discrepancy, partial,
      confirmedPct: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      discrepancyPct: total > 0 ? Math.round((discrepancy / total) * 100) : 0,
      statusBreakdown: [
        { label: t('receiptConfirm.statusPending'), value: pending, color: '#D29922' },
        { label: t('receiptConfirm.statusConfirmed'), value: confirmed, color: '#2A9E6A' },
        { label: t('receiptConfirm.statusDiscrepancy'), value: discrepancy, color: '#F85149' },
        { label: t('receiptConfirm.statusPartial'), value: partial, color: '#A371F7' },
      ].filter((b: any) => b.value > 0),
    };
  }, [receipts, t]);

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
            <input type="text" placeholder={t('receiptConfirm.searchPlaceholder')} value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} className={`bg-transparent outline-none text-xs w-full font-['Montserrat'] ${textPrimary}`} />
            {searchTerm && <button onClick={() => setSearchTerm('')}><X size={10} className={textMuted} /></button>}
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className={`appearance-none px-2 py-1.5 pr-6 rounded-lg border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} text-xs font-['Montserrat'] ${textPrimary} outline-none cursor-pointer`}>
              <option value="all">{t('receiptConfirm.allStatuses')}</option>
              <option value="PENDING">{t('receiptConfirm.statusPending')}</option>
              <option value="CONFIRMED">{t('receiptConfirm.statusConfirmed')}</option>
              <option value="DISCREPANCY">{t('receiptConfirm.statusDiscrepancy')}</option>
              <option value="PARTIAL">{t('receiptConfirm.statusPartial')}</option>
            </select>
            <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
          </div>
          <button onClick={fetchReceipts} className={`px-2.5 py-1.5 rounded-lg border ${border} text-xs font-medium font-['Montserrat'] transition-all ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)]' : 'text-[#6B4D30] hover:bg-[rgba(215,183,151,0.1)]'}`}>
            {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="p-3 md:p-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <ExpandableStatCard title={t('receiptConfirm.totalReceipts')} value={stats.total} sub={t('receiptConfirm.allReceipts')} darkMode={darkMode} icon={Receipt} accent="gold" breakdown={stats.statusBreakdown} expandTitle={t('receiptConfirm.allStatuses')} />
        <ExpandableStatCard title={t('receiptConfirm.pendingReceipts')} value={stats.pending} sub={t('receiptConfirm.awaitingCheck')} darkMode={darkMode} icon={Clock} accent="amber" trendLabel={stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : '0%'} trend={stats.pending > 0 ? -1 : 0} />
        <ExpandableStatCard title={t('receiptConfirm.confirmedReceipts')} value={stats.confirmed} sub={t('receiptConfirm.goodsReceived')} darkMode={darkMode} icon={CheckCircle} accent="emerald" progress={stats.confirmedPct} progressLabel={t('receiptConfirm.statusConfirmed')} />
        <ExpandableStatCard title={t('receiptConfirm.discrepancies')} value={stats.discrepancy} sub={t('receiptConfirm.needsAttention')} darkMode={darkMode} icon={AlertCircle} accent="red" progress={stats.discrepancyPct} progressLabel={t('receiptConfirm.statusDiscrepancy')} badges={[{ label: t('receiptConfirm.statusPartial'), value: stats.partial, color: '#A371F7' }].filter(b => b.value > 0)} />
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
            <p className={`text-sm mt-3 ${textSecondary}`}>{t('receiptConfirm.loadingReceipts')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-[#F85149]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{error}</p>
            <button onClick={fetchReceipts} className="mt-3 px-4 py-0.5 rounded-xl bg-[#D7B797] text-black text-sm font-medium font-['Montserrat']">{t('common.tryAgain')}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ClipboardCheck size={48} className={textMuted} />
            <p className={`text-base font-semibold mt-4 font-['Montserrat'] ${textPrimary}`}>{t('receiptConfirm.noReceipts')}</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>{t('receiptConfirm.noReceiptsDesc')}</p>
          </div>
        ) : isMobile ? (
          <div className="p-3 space-y-2">
            {filtered.map((receipt: any, idx: any) => {
              const sc = RECEIPT_STATUS[receipt.status] || RECEIPT_STATUS.PENDING;
              const statusColorMap: any = { CONFIRMED: 'success', DISCREPANCY: 'critical', PENDING: 'warning', PARTIAL: 'neutral' };
              const dateStr = receipt.receivedDate ? new Date(receipt.receivedDate).toLocaleDateString('vi-VN') : receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString('vi-VN') : '-';
              return (
                <div key={receipt.id || idx}>
                  <MobileDataCard
                    title={receipt.receiptNumber}
                    subtitle={`${receipt.poReference} - ${receipt.brandName}`}
                    status={sc.label}
                    statusColor={statusColorMap[receipt.status] || 'neutral'}
                    darkMode={darkMode}
                    metrics={[
                      { label: t('receiptConfirm.colItems'), value: receipt.itemCount || receipt.products?.length || 0 },
                      { label: t('receiptConfirm.colDate'), value: dateStr },
                    ]}
                    actions={[
                      ...(receipt.status === 'PENDING' ? [
                        { label: t('common.confirm'), primary: true, onClick: () => { setConfirmModal({ receipt, action: 'confirm' }); setDiscrepancyNote(''); } },
                        { label: t('receiptConfirm.flag'), onClick: () => { setConfirmModal({ receipt, action: 'discrepancy' }); setDiscrepancyNote(''); } },
                      ] : []),
                      { label: expandedReceiptId === receipt.id ? 'Hide SKUs' : `View ${receipt.itemCount || receipt.products?.length || 0} SKUs`, onClick: () => setExpandedReceiptId(expandedReceiptId === receipt.id ? null : receipt.id) },
                    ]}
                  />
                  {expandedReceiptId === receipt.id && <ReceiptDetailPanel receipt={receipt} darkMode={darkMode} />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} border-b ${border}`}>
                  {['', t('receiptConfirm.colReceipt'), t('receiptConfirm.colPORef'), t('receiptConfirm.colBrand'), t('receiptConfirm.colItems'), t('receiptConfirm.colStatus'), t('receiptConfirm.colDate'), t('common.actions')].map((h: any, i: number) => (
                    <th key={`${h}-${i}`} className={`px-3 py-0.5 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${textMuted} ${i === 0 ? 'w-8' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((receipt: any, idx: any) => {
                  const sc = RECEIPT_STATUS[receipt.status] || RECEIPT_STATUS.PENDING;
                  const isExpanded = expandedReceiptId === receipt.id;
                  return (
                    <Fragment key={receipt.id || idx}>
                      <tr
                        className={`border-b ${border} transition-colors cursor-pointer ${isExpanded ? (darkMode ? 'bg-[rgba(215,183,151,0.05)]' : 'bg-[rgba(215,183,151,0.06)]') : (darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-50')}`}
                        onClick={() => setExpandedReceiptId(isExpanded ? null : receipt.id)}
                      >
                        <td className="px-3 py-0.5">
                          <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
                        </td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{receipt.receiptNumber}</span></td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-['JetBrains_Mono'] ${textSecondary}`}>{receipt.poReference}</span></td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-['Montserrat'] ${textPrimary}`}>{receipt.brandName}</span></td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-['JetBrains_Mono'] ${textPrimary}`}>{receipt.itemCount || receipt.products?.length || 0}</span></td>
                        <td className="px-3 py-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-['JetBrains_Mono']" style={{ color: sc.color, backgroundColor: sc.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>
                            {receipt.receivedDate ? new Date(receipt.receivedDate).toLocaleDateString('vi-VN') : receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-0.5" onClick={(e) => e.stopPropagation()}>
                          {receipt.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setConfirmModal({ receipt, action: 'confirm' }); setDiscrepancyNote(''); }} className="flex items-center gap-1 px-3 py-0.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(42,158,106,0.12)] text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.2)]">
                                <CheckCircle size={13} /> {t('common.confirm')}
                              </button>
                              <button onClick={() => { setConfirmModal({ receipt, action: 'discrepancy' }); setDiscrepancyNote(''); }} className="flex items-center gap-1 px-3 py-0.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(248,81,73,0.1)] text-[#F85149] hover:bg-[rgba(248,81,73,0.18)]">
                                <AlertCircle size={13} /> {t('receiptConfirm.flag')}
                              </button>
                            </div>
                          )}
                          {receipt.status === 'CONFIRMED' && <span className={`text-xs font-['Montserrat'] ${darkMode ? 'text-[#2A9E6A]' : 'text-green-600'}`}><CheckCircle size={14} className="inline mr-1" />{t('receiptConfirm.verified')}</span>}
                          {receipt.status === 'DISCREPANCY' && <span className={`text-xs font-['Montserrat'] ${darkMode ? 'text-[#FF7B72]' : 'text-red-600'}`}><AlertCircle size={14} className="inline mr-1" />{t('receiptConfirm.underReview')}</span>}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <ReceiptDetailPanel receipt={receipt} darkMode={darkMode} />
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

      {/* Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} ${cardBg} shadow-2xl`}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-['Montserrat'] ${textPrimary}`}>
                  {confirmModal.action === 'confirm' ? t('receiptConfirm.confirmReceipt') : t('receiptConfirm.flagDiscrepancy')}
                </h3>
                <button onClick={() => setConfirmModal(null)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-100'}`}><X size={18} className={textMuted} /></button>
              </div>
            </div>
            <div className="p-5">
              <div className={`rounded-xl border ${border} p-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colReceipt')}</span><span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{confirmModal.receipt.receiptNumber}</span></div>
                  <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colPORef')}</span><span className={`text-sm font-['JetBrains_Mono'] ${textSecondary}`}>{confirmModal.receipt.poReference}</span></div>
                  <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colBrand')}</span><span className={`text-sm font-['Montserrat'] ${textPrimary}`}>{confirmModal.receipt.brandName}</span></div>
                </div>
              </div>
              {confirmModal.action === 'discrepancy' && (
                <div className="mt-4">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>{t('receiptConfirm.discrepancyNote')}</label>
                  <textarea value={discrepancyNote} onChange={(e: any) => setDiscrepancyNote(e.target.value)} rows={3} className={`w-full px-3 py-0.5 rounded-xl border ${border} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'} text-sm font-['Montserrat'] ${textPrimary} outline-none resize-none focus:border-[#D7B797]`} placeholder={t('receiptConfirm.discrepancyPlaceholder')} />
                </div>
              )}
            </div>
            <div className={`p-5 border-t ${border} flex justify-end gap-3`}>
              <button onClick={() => setConfirmModal(null)} className={`px-4 py-0.5 rounded-xl border ${border} text-sm font-medium font-['Montserrat'] ${textSecondary} transition-all ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-100'}`}>{t('common.back')}</button>
              <button
                onClick={() => confirmModal.action === 'confirm' ? handleConfirmReceipt(confirmModal.receipt) : handleFlagDiscrepancy(confirmModal.receipt)}
                disabled={processing || (confirmModal.action === 'discrepancy' && !discrepancyNote.trim())}
                className={`px-5 py-0.5 rounded-xl text-sm font-semibold font-['Montserrat'] transition-all disabled:opacity-50 ${confirmModal.action === 'confirm' ? 'bg-[#2A9E6A] text-white hover:bg-[#238a5a]' : 'bg-[#F85149] text-white hover:bg-[#e04440]'}`}
              >
                {processing ? <Loader2 size={16} className="animate-spin mx-auto" /> : confirmModal.action === 'confirm' ? t('common.confirm') : t('receiptConfirm.submitFlag')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ReceiptConfirmationScreen;
