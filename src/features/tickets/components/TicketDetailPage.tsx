'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Image as ImageIcon, ChevronDown, ChevronUp, Package, Ruler, ArrowLeft, Loader2, Check, X, Clock, Send, CheckCircle, XCircle, LayoutGrid, List, Store, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils';
import { budgetService, planningService, proposalService } from '../../../services';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

/* =========================
   DAFC DESIGN SYSTEM COLORS
========================= */

// Chart colors: REX = Champagne Gold, TTP = Forest Green
const REX_COLOR = '#D7B797';
const TTP_COLOR = '#127749';

// Card styles using DAFC tokens
const CARD_STYLES_DARK = [
  'from-[rgba(215,183,151,0.12)] to-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.25)]',
  'from-[rgba(18,119,73,0.12)] to-[rgba(18,119,73,0.05)] border-[rgba(18,119,73,0.25)]',
  'from-[rgba(227,179,65,0.12)] to-[rgba(227,179,65,0.05)] border-[rgba(227,179,65,0.25)]',
  'from-[rgba(215,183,151,0.08)] to-[rgba(215,183,151,0.03)] border-[rgba(215,183,151,0.2)]',
  'from-[rgba(42,158,106,0.12)] to-[rgba(42,158,106,0.05)] border-[rgba(42,158,106,0.25)]',
  'from-[rgba(248,81,73,0.12)] to-[rgba(248,81,73,0.05)] border-[rgba(248,81,73,0.25)]',
];

const CARD_STYLES_LIGHT = [
  'from-[rgba(160,120,75,0.22)] to-[rgba(160,120,75,0.1)] border-[rgba(160,120,75,0.5)]',
  'from-[rgba(18,119,73,0.18)] to-[rgba(18,119,73,0.08)] border-[rgba(18,119,73,0.4)]',
  'from-[rgba(227,179,65,0.18)] to-[rgba(227,179,65,0.08)] border-[rgba(227,179,65,0.4)]',
  'from-[rgba(160,120,75,0.18)] to-[rgba(160,120,75,0.08)] border-[rgba(160,120,75,0.4)]',
  'from-[rgba(42,158,106,0.18)] to-[rgba(42,158,106,0.08)] border-[rgba(42,158,106,0.4)]',
  'from-[rgba(248,81,73,0.18)] to-[rgba(248,81,73,0.08)] border-[rgba(248,81,73,0.4)]',
];

/* =========================
   MOCK DATA FOR TICKET DETAIL
========================= */

const MOCK_COLLECTION_DATA = [
  { name: 'Carry Over', rex: 1_850_000_000, ttp: 1_420_000_000 },
  { name: 'Seasonal', rex: 2_150_000_000, ttp: 1_780_000_000 },
  { name: 'Pre-Collection', rex: 980_000_000, ttp: 750_000_000 },
];

const MOCK_GENDER_DATA = [
  { name: "Women's RTW", rex: 2_400_000_000, ttp: 1_950_000_000 },
  { name: "Women's Hard Acc", rex: 800_000_000, ttp: 730_000_000 },
  { name: "Men's RTW", rex: 1_280_000_000, ttp: 920_000_000 },
  { name: "Men's Hard Acc", rex: 500_000_000, ttp: 350_000_000 },
];

const MOCK_SKU_BLOCKS = [
  {
    gender: "Women's",
    productType: 'W Outerwear',
    subCategory: "Women's Outerwear",
    pctBuyPropose: 32,
    otbPropose: 1_680_000_000,
    items: [
      {
        sku: 'BAL-WO-001', name: 'Oversized Wool Coat', theme: 'Winter Essentials',
        color: 'Camel', composition: '80% Wool, 20% Cashmere', srp: 85_000_000,
        order: 12, rex: 7, ttp: 5, ttlValue: 1_020_000_000,
        sizing: {
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          salesMix: [5, 15, 35, 30, 15],
          sellThrough: [40, 55, 62, 48, 35],
          finalChoice: [1, 2, 4, 3, 2],
        },
      },
      {
        sku: 'BAL-WO-002', name: 'Double-Breasted Trench', theme: 'Classic Heritage',
        color: 'Black', composition: '100% Cotton Gabardine', srp: 72_000_000,
        order: 10, rex: 6, ttp: 4, ttlValue: 720_000_000,
        sizing: {
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          salesMix: [8, 20, 30, 28, 14],
          sellThrough: [45, 60, 58, 52, 38],
          finalChoice: [1, 2, 3, 3, 1],
        },
      },
      {
        sku: 'BAL-WO-003', name: 'Quilted Puffer Jacket', theme: 'Urban Sport',
        color: 'Navy', composition: '100% Nylon, Down Fill', srp: 65_000_000,
        order: 8, rex: 5, ttp: 3, ttlValue: 520_000_000,
        sizing: {
          sizes: ['XS', 'S', 'M', 'L'],
          salesMix: [10, 30, 35, 25],
          sellThrough: [50, 65, 60, 42],
          finalChoice: [1, 2, 3, 2],
        },
      },
    ],
  },
  {
    gender: "Women's",
    productType: 'W Bags',
    subCategory: "Women's Hard Accessories — Bags",
    pctBuyPropose: 28,
    otbPropose: 1_470_000_000,
    items: [
      {
        sku: 'BAL-WB-001', name: 'Le Cagole Medium', theme: 'Iconic Carry',
        color: 'Arena Beige', composition: 'Lambskin Leather', srp: 52_000_000,
        order: 15, rex: 9, ttp: 6, ttlValue: 780_000_000,
        sizing: {
          sizes: ['Small', 'Medium', 'Large'],
          salesMix: [25, 50, 25],
          sellThrough: [58, 72, 45],
          finalChoice: [4, 7, 4],
        },
      },
      {
        sku: 'BAL-WB-002', name: 'Hourglass Top Handle', theme: 'Signature Shape',
        color: 'Black Croc', composition: 'Croc-Embossed Calfskin', srp: 68_000_000,
        order: 10, rex: 6, ttp: 4, ttlValue: 680_000_000,
        sizing: {
          sizes: ['XS', 'Small', 'Medium'],
          salesMix: [20, 45, 35],
          sellThrough: [55, 68, 50],
          finalChoice: [2, 5, 3],
        },
      },
    ],
  },
  {
    gender: "Men's",
    productType: 'M Outerwear',
    subCategory: "Men's Outerwear",
    pctBuyPropose: 22,
    otbPropose: 1_155_000_000,
    items: [
      {
        sku: 'BAL-MO-001', name: 'Biker Leather Jacket', theme: 'Moto Heritage',
        color: 'Black', composition: '100% Lambskin', srp: 95_000_000,
        order: 8, rex: 5, ttp: 3, ttlValue: 760_000_000,
        sizing: {
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          salesMix: [10, 25, 35, 20, 10],
          sellThrough: [42, 58, 65, 50, 30],
          finalChoice: [1, 2, 3, 1, 1],
        },
      },
      {
        sku: 'BAL-MO-002', name: 'Padded Bomber Jacket', theme: 'Urban Sport',
        color: 'Olive Green', composition: 'Nylon Twill, Polyester Fill', srp: 48_000_000,
        order: 10, rex: 6, ttp: 4, ttlValue: 480_000_000,
        sizing: {
          sizes: ['S', 'M', 'L', 'XL'],
          salesMix: [15, 30, 35, 20],
          sellThrough: [48, 62, 55, 40],
          finalChoice: [1, 3, 4, 2],
        },
      },
    ],
  },
  {
    gender: "Men's",
    productType: 'M Bags',
    subCategory: "Men's Hard Accessories — Bags",
    pctBuyPropose: 18,
    otbPropose: 945_000_000,
    items: [
      {
        sku: 'BAL-MB-001', name: 'Explorer Backpack', theme: 'Travel Essentials',
        color: 'Black Nylon', composition: 'Recycled Nylon, Leather Trim', srp: 38_000_000,
        order: 12, rex: 7, ttp: 5, ttlValue: 456_000_000,
        sizing: {
          sizes: ['One Size'],
          salesMix: [100],
          sellThrough: [65],
          finalChoice: [12],
        },
      },
      {
        sku: 'BAL-MB-002', name: 'Belt Bag XL', theme: 'Streetwear',
        color: 'Grey Canvas', composition: 'Cotton Canvas, Calfskin', srp: 28_000_000,
        order: 14, rex: 8, ttp: 6, ttlValue: 392_000_000,
        sizing: {
          sizes: ['One Size'],
          salesMix: [100],
          sellThrough: [70],
          finalChoice: [14],
        },
      },
      {
        sku: 'BAL-MB-003', name: 'Crossbody Messenger', theme: 'Daily Carry',
        color: 'Dark Brown', composition: 'Full-Grain Calfskin', srp: 32_000_000,
        order: 9, rex: 5, ttp: 4, ttlValue: 288_000_000,
        sizing: {
          sizes: ['Small', 'Medium'],
          salesMix: [40, 60],
          sellThrough: [55, 68],
          finalChoice: [4, 5],
        },
      },
    ],
  },
];

const MOCK_BUDGET_DATA = {
  id: 'mock-budget-001',
  fiscalYear: 'FY2025',
  groupBrand: 'Balenciaga',
  brandName: 'Balenciaga',
  totalBudget: 5_250_000_000,
  budgetName: 'BUD-BAL-FW-main-2025',
  status: 'LEVEL1_APPROVED',
};

const MOCK_SEASON_DATA = {
  seasonGroup: 'FW',
  Season: 'Fall/Winter 2025',
  rex: 2_980_000_000,
  ttp: 2_270_000_000,
  finalVersion: 3,
};

/* =========================
   GROUPED BAR CHARTS
========================= */

const CollectionBarChart = ({ data, darkMode, t }: any) => (
  <div className={`border rounded-xl shadow-sm p-4 ${
    darkMode
      ? 'bg-[#121212] border-[#2E2E2E]'
      : 'bg-white border-gray-300'
  }`}>
    <h3 className={`text-sm font-semibold font-['Montserrat'] ${
      darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'
    }`}>{t ? t('planningDetail.collection') : 'Collection Allocation'}</h3>
    <p className={`text-xs mb-2 ${
      darkMode ? 'text-[#999999]' : 'text-gray-700'
    }`}>Carry Over vs Seasonal — REX & TTP</p>
    <div className="h-[280px]" style={{ minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2E2E2E' : '#e2e8f0'} />
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: darkMode ? '#999999' : '#64748b' }} />
          <YAxis tick={{ fontSize: 12, fill: darkMode ? '#999999' : '#64748b' }} tickFormatter={(v: any) => `${(v / 1e9).toFixed(1)}B`} />
          <Tooltip
            formatter={(v: any) => formatCurrency(v)}
            contentStyle={{
              backgroundColor: darkMode ? '#1A1A1A' : '#fff',
              border: `1px solid ${darkMode ? '#2E2E2E' : '#e2e8f0'}`,
              borderRadius: '8px',
              color: darkMode ? '#F2F2F2' : '#1e293b'
            }}
            labelStyle={{ color: darkMode ? '#F2F2F2' : '#1e293b' }}
            cursor={{ fill: darkMode ? 'rgba(215,183,151,0.1)' : 'rgba(0,0,0,0.05)' }}
          />
          <Legend wrapperStyle={{ color: darkMode ? '#999999' : '#64748b' }} />
          <Bar dataKey="rex" name="REX" fill={REX_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
          <Bar dataKey="ttp" name="TTP" fill={TTP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GenderBarChart = ({ data, darkMode, t }: any) => (
  <div className={`border rounded-xl shadow-sm p-4 ${
    darkMode
      ? 'bg-[#121212] border-[#2E2E2E]'
      : 'bg-white border-gray-300'
  }`}>
    <h3 className={`text-sm font-semibold font-['Montserrat'] ${
      darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'
    }`}>{t ? t('planningDetail.gender') : 'Gender Allocation'}</h3>
    <p className={`text-xs mb-2 ${
      darkMode ? 'text-[#999999]' : 'text-gray-700'
    }`}>Male vs Female — REX & TTP</p>
    <div className="h-[280px]" style={{ minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2E2E2E' : '#e2e8f0'} />
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: darkMode ? '#999999' : '#64748b' }} />
          <YAxis tick={{ fontSize: 12, fill: darkMode ? '#999999' : '#64748b' }} tickFormatter={(v: any) => `${(v / 1e9).toFixed(1)}B`} />
          <Tooltip
            formatter={(v: any) => formatCurrency(v)}
            contentStyle={{
              backgroundColor: darkMode ? '#1A1A1A' : '#fff',
              border: `1px solid ${darkMode ? '#2E2E2E' : '#e2e8f0'}`,
              borderRadius: '8px',
              color: darkMode ? '#F2F2F2' : '#1e293b'
            }}
            labelStyle={{ color: darkMode ? '#F2F2F2' : '#1e293b' }}
            cursor={{ fill: darkMode ? 'rgba(215,183,151,0.1)' : 'rgba(0,0,0,0.05)' }}
          />
          <Legend wrapperStyle={{ color: darkMode ? '#999999' : '#64748b' }} />
          <Bar dataKey="rex" name="REX" fill={REX_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
          <Bar dataKey="ttp" name="TTP" fill={TTP_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

/* =========================
   SKU CARD (with sizing)
========================= */

const SizingTable = ({ productType, darkMode, sizing }: any) => {
  const data = sizing || { sizes: ['0002', '0004', '0006', '0008'], salesMix: [6, 33, 33, 28], sellThrough: [50, 43, 30, 63], finalChoice: [0, 3, 3, 2] };
  const sumMix = data.salesMix.reduce((a: number, b: number) => a + b, 0);
  const sumFinal = data.finalChoice.reduce((a: number, b: number) => a + b, 0);

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-gray-300 bg-white'}`}>
      <div className={`px-4 py-0.5 text-sm font-semibold border-b font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2] bg-[#1A1A1A] border-[#2E2E2E]' : 'text-gray-600 bg-gray-50 border-gray-300'}`}>
        Sizing
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-[rgba(160,120,75,0.18)] text-[#666666]'}>
              <th className="px-3 py-0.5 text-left">{productType}</th>
              {data.sizes.map((s: string) => (
                <th key={s} className="px-3 py-0.5 text-center font-['JetBrains_Mono']">{s}</th>
              ))}
              <th className="px-3 py-0.5 text-center">Sum</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
              <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>% Sales mix</td>
              {data.salesMix.map((v: number, i: number) => (
                <td key={i} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{v}%</td>
              ))}
              <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{sumMix}%</td>
            </tr>
            <tr className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
              <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>% ST</td>
              {data.sellThrough.map((v: number, i: number) => (
                <td key={i} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{v}%</td>
              ))}
              <td className={`px-3 py-0.5 text-center ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>-</td>
            </tr>
            <tr className={`border-t ${darkMode ? 'border-[#2E2E2E] bg-[rgba(227,179,65,0.1)]' : 'border-gray-300 bg-[rgba(227,179,65,0.18)]'}`}>
              <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#E3B341]' : 'text-[#6B4D30]'}`}>Final Choice</td>
              {data.finalChoice.map((v: number, i: number) => (
                <td key={i} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{v}</td>
              ))}
              <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{sumFinal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SKUCard = ({ item, block, cardIdx, darkMode, onUpdateItem }: any) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [storeOrderOpen, setStoreOrderOpen] = useState(true);
  const [sizingOpen, setSizingOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const cardStyles = darkMode ? CARD_STYLES_DARK : CARD_STYLES_LIGHT;
  const style = cardStyles[cardIdx % cardStyles.length];
  const productType = item.productType || block.productType;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${style} shadow-sm overflow-hidden transition-all ${
      darkMode
        ? 'hover:shadow-[0_4px_20px_rgba(215,183,151,0.1)]'
        : 'hover:shadow-md'
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
            darkMode
              ? 'bg-[#1A1A1A] border-[#2E2E2E]'
              : 'bg-white/80 border-white/50'
          }`}>
            <ImageIcon size={24} className={darkMode ? 'text-[#666666]' : 'text-gray-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-base truncate font-['Montserrat'] ${
              darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
            }`}>
              <span className="font-['JetBrains_Mono']">{item.sku}</span> • {item.name}
            </div>
            <div className={`text-sm mt-0.5 ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>
              {block.gender} • {block.subCategory}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => setDetailsOpen((p) => !p)}
                className={`px-2.5 py-0.5 text-xs font-medium rounded-lg border transition-all ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                    : 'bg-white/80 border-gray-300 text-gray-600 hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(160,120,75,0.4)] hover:text-[#6B4D30]'
                }`}
              >
                {detailsOpen ? 'Hide details' : 'Details'}
              </button>
              <button
                type="button"
                onClick={() => setStoreOrderOpen((p) => !p)}
                className={`px-2.5 py-0.5 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                    : 'bg-white/80 border-gray-300 text-gray-600 hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(160,120,75,0.4)] hover:text-[#6B4D30]'
                }`}
              >
                <Store size={12} />
                {storeOrderOpen ? 'Hide stores' : 'Store Order'}
              </button>
              <button
                type="button"
                onClick={() => setSizingOpen((p) => !p)}
                className={`px-2.5 py-0.5 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all ${
                  darkMode
                    ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                    : 'bg-white/80 border-gray-300 text-gray-600 hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(160,120,75,0.4)] hover:text-[#6B4D30]'
                }`}
              >
                <Ruler size={12} />
                {sizingOpen ? 'Hide sizing' : 'Sizing'}
              </button>
            </div>
          </div>
        </div>

        {detailsOpen && (
          <div className={`mt-4 rounded-xl border p-4 ${
            darkMode
              ? 'border-[#2E2E2E] bg-[#1A1A1A]/40'
              : 'border-white/50 bg-white/40'
          }`}>
            <div className="grid grid-cols-2 gap-3 text-base">
              <div>
                <span className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>Product type</span>
                <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{productType}</div>
              </div>
              <div>
                <span className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>Theme</span>
                <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.theme}</div>
              </div>
              <div>
                <span className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>Color</span>
                <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.color}</div>
              </div>
              <div>
                <span className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>Composition</span>
                <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.composition}</div>
              </div>
              <div>
                <span className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>SRP</span>
                <div className={`font-medium text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(item.srp)}</div>
              </div>
            </div>
          </div>
        )}

        {storeOrderOpen && (
          <div className={`mt-4 rounded-xl border overflow-hidden ${
            darkMode ? 'border-[#2E2E2E] bg-[#121212]' : 'border-gray-300 bg-white'
          }`}>
            <div className={`px-4 py-0.5 text-sm font-semibold border-b font-['Montserrat'] ${
              darkMode ? 'text-[#F2F2F2] bg-[#1A1A1A] border-[#2E2E2E]' : 'text-gray-600 bg-gray-50 border-gray-300'
            }`}>Store Order</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-[rgba(160,120,75,0.18)] text-[#666666]'}>
                    <th className="px-3 py-0.5 text-left">Store</th>
                    <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">ORDER</th>
                    <th className="px-3 py-0.5 text-right font-['JetBrains_Mono']">TTL VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'rex', label: 'REX', color: 'bg-[#D7B797]', value: item.rex || 0 },
                    { key: 'ttp', label: 'TTP', color: 'bg-[#127749]', value: item.ttp || 0 },
                  ].map((store) => (
                    <tr key={store.key} className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
                      <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${store.color}`} />{store.label}
                        </span>
                      </td>
                      <td className="px-3 py-0.5 text-center">
                        {editingStore === store.key ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              const newVal = parseInt(editValue) || 0;
                              if (onUpdateItem) onUpdateItem(item.sku, store.key, newVal);
                              setEditingStore(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newVal = parseInt(editValue) || 0;
                                if (onUpdateItem) onUpdateItem(item.sku, store.key, newVal);
                                setEditingStore(null);
                              }
                              if (e.key === 'Escape') setEditingStore(null);
                            }}
                            className={`w-16 px-2 py-0.5 text-center border-2 border-[#D7B797] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.5)] font-['JetBrains_Mono'] font-medium text-sm ${darkMode ? 'bg-[#1A1A1A] text-[#F2F2F2]' : 'bg-white text-[#1A1A1A]'}`}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => { setEditingStore(store.key); setEditValue(String(store.value)); }}
                            className={`inline-flex items-center gap-1 cursor-pointer px-2 py-0.5 rounded-md transition-colors font-['JetBrains_Mono'] font-medium ${darkMode ? 'text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.1)]' : 'text-gray-800 hover:bg-[rgba(215,183,151,0.15)]'}`}
                            title="Click to edit"
                          >
                            {store.value}
                            <Pencil size={10} className="opacity-0 group-hover:opacity-60" />
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(store.value * (item.srp || 0))}</td>
                    </tr>
                  ))}
                  <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30' : 'border-[#D7B797]/40'} ${darkMode ? 'bg-[rgba(215,183,151,0.05)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                    <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>Total</td>
                    <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{(item.rex || 0) + (item.ttp || 0)}</td>
                    <td className={`px-3 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(((item.rex || 0) + (item.ttp || 0)) * (item.srp || 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sizingOpen && (
          <div className="mt-4">
            <SizingTable productType={productType} darkMode={darkMode} sizing={item.sizing} />
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
   APPROVAL STEPS & COMPONENTS
========================= */

const APPROVAL_STEPS = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'brand_manager', label: 'Group Brand Manager' },
  { id: 'finance', label: 'Finance' },
  { id: 'ceo', label: 'CEO' },
];

const getApprovalStepStatus = (stepId: any, currentStep: any, approvalHistory: any) => {
  const historyItem = approvalHistory?.find((h: any) => h.stepId === stepId);
  if (historyItem?.action === 'approved') return 'approved';
  if (historyItem?.action === 'rejected') return 'rejected';
  if (historyItem?.action === 'submitted') return 'approved';
  if (stepId === currentStep) return 'current';
  const stepIndex = APPROVAL_STEPS.findIndex((s: any) => s.id === stepId);
  const currentIndex = APPROVAL_STEPS.findIndex((s: any) => s.id === currentStep);
  return stepIndex < currentIndex ? 'approved' : 'waiting';
};

const ApprovalProgressBar = ({ currentStep, approvalHistory, darkMode, t }: any) => (
  <div className={`border rounded-xl shadow-sm p-3 md:p-5 ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-300'}`}>
    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 md:mb-5 font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>
      {t ? t('ticketDetail.approvalHistory') : 'Approval Progress'}
    </h3>
    <div className="flex items-start overflow-x-auto pb-2 md:pb-0">
      {APPROVAL_STEPS.map((step: any, index: any) => {
        const status = getApprovalStepStatus(step.id, currentStep, approvalHistory);
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center shrink-0" style={{ minWidth: 80 }}>
              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                status === 'approved' ? 'bg-[#127749] border-[#127749] text-white' :
                status === 'rejected' ? 'bg-[#F85149] border-[#F85149] text-white' :
                status === 'current' ? 'bg-[#D7B797] border-[#D7B797] text-white animate-pulse' :
                darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#666666]' : 'bg-gray-100 border-gray-300 text-gray-500'
              }`}>
                {status === 'approved' ? <Check size={20} strokeWidth={3} /> :
                 status === 'rejected' ? <X size={20} strokeWidth={3} /> :
                 status === 'current' ? <Clock size={20} /> :
                 <span className="text-sm md:text-base font-bold">{index + 1}</span>}
              </div>
              <div className={`text-xs md:text-sm mt-1.5 md:mt-2 font-medium text-center leading-tight ${
                status === 'approved' ? 'text-[#2A9E6A]' :
                status === 'rejected' ? 'text-[#FF7B72]' :
                status === 'current' ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') :
                darkMode ? 'text-[#666666]' : 'text-gray-500'
              }`}>
                {step.label}
              </div>
              {(status === 'approved' || status === 'rejected') && (
                <span className={`mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  status === 'approved'
                    ? darkMode ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]' : 'bg-emerald-100 text-emerald-700'
                    : darkMode ? 'bg-[rgba(248,81,73,0.15)] text-[#FF7B72]' : 'bg-red-100 text-red-700'
                }`}>
                  {status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              )}
              {status === 'current' && (
                <span className={`mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-amber-100 text-amber-700'
                }`}>
                  In Review
                </span>
              )}
            </div>
            {index < APPROVAL_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-5 md:mt-7 mx-1 rounded-full transition-all min-w-[20px] ${
                getApprovalStepStatus(APPROVAL_STEPS[index + 1].id, currentStep, approvalHistory) !== 'waiting'
                  ? 'bg-[#127749]'
                  : darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

const StatusTrackingPanel = ({ approvalHistory, ticket, darkMode, t }: any) => (
  <div className={`border rounded-xl shadow-sm p-3 md:p-5 ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-300'}`}>
    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 md:mb-4 font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>
      {t ? t('common.status') : 'Status Tracking'}
    </h3>

    <div className="space-y-0">
      {approvalHistory?.length > 0 ? (
        approvalHistory.map((item: any, index: any) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                item.action === 'approved' ? 'bg-[#2A9E6A]' :
                item.action === 'rejected' ? 'bg-[#F85149]' :
                item.action === 'submitted' ? 'bg-[#D7B797]' :
                darkMode ? 'bg-[#666666]' : 'bg-gray-400'
              }`} />
              {index < approvalHistory.length - 1 && (
                <div className={`w-px flex-1 min-h-[20px] ${darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  item.action === 'approved' ? (darkMode ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]' : 'bg-emerald-100 text-emerald-700') :
                  item.action === 'rejected' ? (darkMode ? 'bg-[rgba(248,81,73,0.15)] text-[#FF7B72]' : 'bg-red-100 text-red-700') :
                  darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-amber-100 text-amber-700'
                }`}>
                  {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                </span>
                <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                  by {item.stepLabel || item.role || '-'}
                </span>
              </div>
              {item.decidedAt && (
                <div className={`text-[10px] mt-0.5 font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666]' : 'text-gray-500'}`}>
                  {new Date(item.decidedAt).toLocaleString('vi-VN')}
                </div>
              )}
              {item.comment && (
                <div className={`mt-1.5 px-3 py-0.5 rounded-lg text-xs italic ${
                  darkMode ? 'bg-[#1A1A1A] text-[#999999] border border-[#2E2E2E]' : 'bg-gray-50 text-gray-600 border border-gray-300'
                }`}>
                  "{item.comment}"
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className={`text-sm italic ${darkMode ? 'text-[#666666]' : 'text-gray-500'}`}>
          {t ? t('ticketDetail.approvalHistory') : 'No approval history yet'}
        </div>
      )}
    </div>

    <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>{t ? t('common.status') : 'Current Status'}:</span>
        <span className={`px-3 py-0.5 text-xs font-bold rounded-full ${
          ['APPROVED', 'LEVEL2_APPROVED', 'FINAL'].includes(ticket?.status?.toUpperCase())
            ? darkMode ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]' : 'bg-emerald-100 text-emerald-700'
          : ['REJECTED', 'LEVEL1_REJECTED', 'LEVEL2_REJECTED'].includes(ticket?.status?.toUpperCase())
            ? darkMode ? 'bg-[rgba(248,81,73,0.15)] text-[#FF7B72]' : 'bg-red-100 text-red-700'
          : ['SUBMITTED', 'LEVEL1_APPROVED'].includes(ticket?.status?.toUpperCase())
            ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-amber-100 text-amber-700'
          : darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-gray-100 text-gray-600'
        }`}>
          {ticket?.status?.replace(/_/g, ' ') || 'Draft'}
        </span>
      </div>
    </div>
  </div>
);

/* =========================
   MAIN SCREEN
========================= */

export default function TicketDetailPage({ ticket, onBack, darkMode = true }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isMobile } = useIsMobile();
  const [collapsed, setCollapsed] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [skuData, setSkuData] = useState<any[]>([]);
  const [skuViewMode, setSkuViewMode] = useState<string>('card');

  // Determine the right service based on entity type
  const getEntityService = () => {
    if (ticket?.entityType === 'budget') return budgetService;
    if (ticket?.entityType === 'planning') return planningService;
    if (ticket?.entityType === 'proposal') return proposalService;
    return null;
  };

  // Check if current user can approve at the current step
  const canApprove = () => {
    if (!ticket || !user) return false;
    const status = ticket?.status?.toUpperCase();
    const roleName = (user.role?.name || user.roleName || '').toLowerCase();
    const permissions = user.role?.permissions || user.permissions || [];
    const entityType = ticket.entityType;
    const permPrefix = entityType === 'proposal' ? 'proposal' : entityType === 'planning' ? 'planning' : 'budget';

    if (status === 'SUBMITTED') {
      return permissions.includes(`${permPrefix}:approve_l1`) || permissions.includes('*') || roleName.includes('manager');
    }
    if (status === 'LEVEL1_APPROVED') {
      return permissions.includes(`${permPrefix}:approve_l2`) || permissions.includes('*') || roleName.includes('finance') || roleName.includes('director');
    }
    return false;
  };

  const handleSubmitTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    setActionLoading(true);
    try {
      await svc.submit(ticket.id);
      toast.success(t('ticketDetail.submit'));
      if (onBack) onBack();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    const status = ticket?.status?.toUpperCase();
    setActionLoading(true);
    try {
      if (status === 'SUBMITTED') {
        await svc.approveL1(ticket.id, 'Approved');
      } else if (status === 'LEVEL1_APPROVED') {
        await svc.approveL2(ticket.id, 'Approved');
      }
      toast.success(t('ticketDetail.approve'));
      if (onBack) onBack();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTicket = async () => {
    const reason = window.prompt(t('ticketDetail.reject') + ':');
    if (reason === null) return; // User cancelled
    const svc = getEntityService();
    if (!svc) return;
    const status = ticket?.status?.toUpperCase();
    setActionLoading(true);
    try {
      if (status === 'SUBMITTED') {
        await svc.rejectL1(ticket.id, reason || 'Rejected');
      } else if (status === 'LEVEL1_APPROVED') {
        await svc.rejectL2(ticket.id, reason || 'Rejected');
      }
      toast.success(t('ticketDetail.reject'));
      if (onBack) onBack();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Approval history — derive from ticket status
  const approvalHistory = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return [];
    const history: any[] = [];
    history.push({
      stepId: 'submitted',
      stepLabel: 'Submitted',
      action: 'submitted',
      decidedAt: ticket?.createdAt || ticket?.createdOn || null,
      comment: null
    });
    if (['LEVEL1_APPROVED', 'LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'approved',
        decidedAt: ticket?.l1ApprovedAt || null,
        comment: ticket?.l1Comment || 'Approved for finance review'
      });
    } else if (status === 'LEVEL1_REJECTED') {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'rejected',
        decidedAt: ticket?.l1RejectedAt || null,
        comment: ticket?.l1Comment || 'Rejected'
      });
    }
    if (['LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'approved',
        decidedAt: ticket?.l2ApprovedAt || null,
        comment: ticket?.l2Comment || 'Finance approved'
      });
    } else if (status === 'LEVEL2_REJECTED') {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'rejected',
        decidedAt: ticket?.l2RejectedAt || null,
        comment: ticket?.l2Comment || 'Rejected by Finance'
      });
    }
    if (['APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'ceo',
        stepLabel: 'CEO',
        action: 'approved',
        decidedAt: ticket?.approvedAt || null,
        comment: ticket?.ceoComment || 'Final approval granted'
      });
    }
    return history;
  }, [ticket]);

  const currentStep = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return 'submitted';
    if (status === 'SUBMITTED') return 'brand_manager';
    if (status === 'LEVEL1_APPROVED') return 'finance';
    if (status === 'LEVEL1_REJECTED') return 'brand_manager';
    if (status === 'LEVEL2_APPROVED') return 'ceo';
    if (status === 'LEVEL2_REJECTED') return 'finance';
    if (['APPROVED', 'FINAL'].includes(status)) return 'completed';
    return 'submitted';
  }, [ticket]);

  // Fetch detailed data based on entity type
  useEffect(() => {
    if (!ticket) return;

    const fetchDetailData = async () => {
      setLoading(true);
      try {
        let data = ticket.data;

        // If we have full data from ticket, use it; otherwise fetch
        if (ticket.entityType === 'budget' && ticket.id) {
          const res = await budgetService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'planning' && ticket.id) {
          const res = await planningService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'proposal' && ticket.id) {
          const res = await proposalService.getOne(ticket.id);
          data = res.data || res;
          // Transform proposal items to SKU format
          if (data.items) {
            const groupedSkus: any = {};
            data.items.forEach((item: any) => {
              const key = `${item.gender?.name || 'Unknown'}_${item.category?.name || 'Unknown'}`;
              if (!groupedSkus[key]) {
                groupedSkus[key] = {
                  gender: item.gender?.name?.toLowerCase() || 'unknown',
                  productType: item.category?.name || 'Unknown',
                  subCategory: item.subCategory?.name || item.category?.name || 'Unknown',
                  pctBuyPropose: 0,
                  otbPropose: 0,
                  items: []
                };
              }
              groupedSkus[key].items.push({
                sku: item.sku?.code || item.skuId,
                name: item.sku?.name || '-',
                theme: item.sku?.theme || '-',
                color: item.sku?.color || '-',
                composition: item.sku?.composition || '-',
                srp: Number(item.sku?.retailPrice) || 0,
                order: Number(item.quantity) || 0,
                rex: Math.floor(Number(item.quantity) / 2) || 0,
                ttp: Math.ceil(Number(item.quantity) / 2) || 0,
                ttlValue: Number(item.totalValue) || 0
              });
              groupedSkus[key].otbPropose += Number(item.totalValue) || 0;
            });
            const skuGroups: any[] = Object.values(groupedSkus);
            setSkuData(skuGroups);
            // Default collapse all SKU groups
            const defaultCollapsed: any = {};
            skuGroups.forEach((block: any) => {
              defaultCollapsed[`${block.productType}_${block.gender}`] = true;
            });
            setCollapsed(defaultCollapsed);
          }
        }

        setDetailData(data);
      } catch (err: any) {
        console.error('Failed to fetch ticket detail:', err);
        toast.error('Failed to load detail data');
        // Use ticket's inline data if available
        if (ticket.data) {
          setDetailData(ticket.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetailData();
  }, [ticket]);

  // Generate chart data from detail
  const { collectionData, genderData, budgetData, budgetSeasonData } = useMemo(() => {
    if (!detailData) {
      return {
        collectionData: MOCK_COLLECTION_DATA,
        genderData: MOCK_GENDER_DATA,
        budgetData: MOCK_BUDGET_DATA,
        budgetSeasonData: MOCK_SEASON_DATA,
      };
    }

    // For budget type
    if (ticket?.entityType === 'budget') {
      const details = detailData.details || [];
      const storeMap: any = {};
      details.forEach((d: any) => {
        const storeName = d.store?.name || 'Unknown';
        if (!storeMap[storeName]) {
          storeMap[storeName] = 0;
        }
        storeMap[storeName] += Number(d.budgetAmount) || 0;
      });

      return {
        collectionData: [
          { name: 'Total Allocation', rex: storeMap['REX'] || storeMap['Rex'] || Object.values(storeMap)[0] || 0, ttp: storeMap['TTP'] || storeMap['Ttp'] || Object.values(storeMap)[1] || 0 }
        ],
        genderData: [],
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.fiscalYear,
          groupBrand: detailData.groupBrand?.name || '-',
          brandId: detailData.groupBrandId,
          brandName: detailData.groupBrand?.name || '-',
          totalBudget: Number(detailData.totalBudget) || 0,
          budgetName: `${detailData.groupBrand?.name || 'Budget'} - ${detailData.seasonGroupId || ''} ${detailData.seasonType || ''}`,
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.seasonGroupId || '-',
          Season: detailData.seasonType || '-',
          rex: Object.values(storeMap)[0] || 0,
          ttp: Object.values(storeMap)[1] || 0,
          finalVersion: 1
        }
      };
    }

    // For planning type
    if (ticket?.entityType === 'planning') {
      const details = detailData.details || [];
      const collectionMap: any = {};
      const genderMap: any = {};

      details.forEach((d: any) => {
        const colName = d.collection?.name || 'Other';
        const genName = d.gender?.name || 'Other';

        if (!collectionMap[colName]) collectionMap[colName] = { rex: 0, ttp: 0 };
        if (!genderMap[genName]) genderMap[genName] = { rex: 0, ttp: 0 };

        const otb = Number(d.otbValue) || 0;
        collectionMap[colName].rex += otb * 0.5;
        collectionMap[colName].ttp += otb * 0.5;
        genderMap[genName].rex += otb * 0.5;
        genderMap[genName].ttp += otb * 0.5;
      });

      return {
        collectionData: Object.entries(collectionMap).map(([name, data]: any) => ({ name, ...data })),
        genderData: Object.entries(genderMap).map(([name, data]: any) => ({ name, ...data })),
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.budgetDetail?.budget?.fiscalYear || '-',
          groupBrand: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          brandName: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          totalBudget: Number(detailData.budgetDetail?.budgetAmount) || 0,
          budgetName: detailData.planningCode || 'Planning',
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.budgetDetail?.budget?.seasonGroupId || '-',
          Season: detailData.budgetDetail?.budget?.seasonType || '-',
          rex: Object.values(collectionMap).reduce((sum: any, c: any) => sum + (c.rex || 0), 0) || 343000000,
          ttp: Object.values(collectionMap).reduce((sum: any, c: any) => sum + (c.ttp || 0), 0) || 294000000,
          finalVersion: detailData.versionNumber || 1
        }
      };
    }

    // Default / proposal — use rich mock data
    return {
      collectionData: MOCK_COLLECTION_DATA,
      genderData: MOCK_GENDER_DATA,
      budgetData: detailData ? {
        id: detailData.id,
        fiscalYear: ticket?.fiscalYear || MOCK_BUDGET_DATA.fiscalYear,
        groupBrand: ticket?.brand || MOCK_BUDGET_DATA.groupBrand,
        brandName: ticket?.brand || MOCK_BUDGET_DATA.brandName,
        totalBudget: MOCK_BUDGET_DATA.totalBudget,
        budgetName: ticket?.name || MOCK_BUDGET_DATA.budgetName,
        status: detailData.status
      } : MOCK_BUDGET_DATA,
      budgetSeasonData: MOCK_SEASON_DATA,
    };
  }, [detailData, ticket]);

  const rexNum = Number(budgetSeasonData.rex) || 0;
  const ttpNum = Number(budgetSeasonData.ttp) || 0;
  const totalRexTtp = rexNum + ttpNum;

  // Use real SKU data or mock fallback
  const displaySkuData = skuData.length > 0 ? skuData : MOCK_SKU_BLOCKS;

  if (loading) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className={`animate-spin ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
          <span className={darkMode ? 'text-[#999999]' : 'text-gray-700'}>{t('ticketDetail.loadingDetail')}</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50'}`}>
        <div className={`text-center ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
          <p>{t('common.noData')}</p>
          {onBack && (
            <button onClick={onBack} className={`mt-4 hover:underline ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
              {t('ticketDetail.backToTickets')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 md:p-6 min-h-screen space-y-3 md:space-y-6 ${
      darkMode ? 'bg-[#0A0A0A]' : 'bg-gray-50'
    }`}>
      {/* Back Button & Header */}
      {onBack && (
        <div className={`flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 p-3 md:p-4 rounded-xl ${
          darkMode
            ? 'bg-gradient-to-r from-[#127749] to-[#0F5F3A]'
            : 'bg-gradient-to-r from-[#127749] to-[#2A9E6A]'
        }`}>
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2 rounded-lg transition-all hover:bg-white/10 text-white shrink-0"
            >
              <ArrowLeft size={isMobile ? 20 : 24} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xs md:text-sm font-semibold font-['Montserrat'] text-white">
                {t('ticketDetail.title')}
              </h1>
              <p className="text-xs text-white/70 truncate">
                {ticket?.entityType?.charAt(0).toUpperCase() + ticket?.entityType?.slice(1)} • {ticket?.name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
            {/* Submit — only for DRAFT */}
            {ticket?.status?.toUpperCase() === 'DRAFT' && (
              <button
                onClick={handleSubmitTicket}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-3 md:px-4 py-0.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all text-xs md:text-sm border border-white/20 backdrop-blur-sm disabled:opacity-50"
              >
                <Send size={14} />
                {t('common.submit')}
              </button>
            )}

            {/* Approve / Reject — for pending approvers */}
            {canApprove() && (
              <>
                <button
                  onClick={handleRejectTicket}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-3 md:px-4 py-0.5 bg-[#F85149]/20 hover:bg-[#F85149]/30 text-white font-semibold rounded-lg transition-all text-xs md:text-sm border border-[#F85149]/30 backdrop-blur-sm disabled:opacity-50"
                >
                  <XCircle size={14} />
                  {t('ticketDetail.reject')}
                </button>
                <button
                  onClick={handleApproveTicket}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-3 md:px-4 py-0.5 bg-white/25 hover:bg-white/35 text-white font-semibold rounded-lg transition-all text-xs md:text-sm border border-white/30 backdrop-blur-sm disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  {t('ticketDetail.approve')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== APPROVAL PROGRESS BAR ===== */}
      <ApprovalProgressBar
        currentStep={currentStep}
        approvalHistory={approvalHistory}
        darkMode={darkMode}
        t={t}
      />

      {/* ===== STATUS TRACKING + BUDGET INFO ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Budget + Budget Season — 2/3 width */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

      {/* 1. Budget + Budget Season */}
        <div className={`border rounded-xl shadow-sm p-3 md:p-5 ${
          darkMode
            ? 'bg-[#121212] border-[#2E2E2E]'
            : 'bg-white border-gray-300'
        }`}>
          <h3 className={`text-sm md:text-base font-semibold mb-3 md:mb-4 font-['Montserrat'] ${
            darkMode ? 'text-[#F2F2F2]' : 'text-gray-600'
          }`}>{t('skuProposal.budget')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('budget.fiscalYear')}</p>
              <p className={`text-sm md:text-base font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetData.fiscalYear}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('budget.groupBrand')}</p>
              <p className={`text-sm md:text-base font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetData.groupBrand}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('budget.brand')}</p>
              <p className={`text-sm md:text-base font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetData.brandName}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('budget.totalBudget')}</p>
              <p className={`text-xs md:text-sm font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(budgetData.totalBudget)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('budget.budgetName')}</p>
              <p className={`text-sm md:text-base font-semibold truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetData.budgetName}</p>
            </div>
          </div>
        </div>

        <div className={`border rounded-xl shadow-sm p-3 md:p-5 ${
          darkMode
            ? 'bg-[#121212] border-[#2E2E2E]'
            : 'bg-white border-gray-300'
        }`}>
          <h3 className={`text-sm md:text-base font-semibold mb-3 md:mb-4 font-['Montserrat'] ${
            darkMode ? 'text-[#F2F2F2]' : 'text-gray-600'
          }`}>{t('skuProposal.season')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('skuProposal.seasonGroup')}</p>
              <p className={`text-sm md:text-base font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetSeasonData.seasonGroup}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('skuProposal.season')}</p>
              <p className={`text-sm md:text-base font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{budgetSeasonData.Season}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('common.version')}</p>
              <p className={`text-sm md:text-base font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>v{budgetSeasonData.finalVersion}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>REX</p>
              <p className={`text-xs md:text-sm font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(rexNum)}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>TTP</p>
              <p className={`text-xs md:text-sm font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(ttpNum)}</p>
            </div>
            <div>
              <p className={`text-xs md:text-sm ${darkMode ? 'text-[#999999]' : 'text-gray-700'}`}>{t('skuProposal.total')}</p>
              <p className={`text-xs md:text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(totalRexTtp)}</p>
            </div>
          </div>
        </div>

      </div>

        {/* Status Tracking Panel — 1/3 width */}
        <StatusTrackingPanel
          approvalHistory={approvalHistory}
          ticket={ticket}
          darkMode={darkMode}
          t={t}
        />
      </div>

      {/* 3. Charts - Collection & Gender (grouped bar: REX, TTP per category) */}
      {(collectionData.length > 0 || genderData.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-3">
          {collectionData.length > 0 && <CollectionBarChart data={collectionData} darkMode={darkMode} t={t} />}
          {genderData.length > 0 && <GenderBarChart data={genderData} darkMode={darkMode} t={t} />}
        </div>
      )}

      {/* 4. SKU Cards - grouped by type and gender (only for proposals) */}
      {displaySkuData.length > 0 && (
      <div className="space-y-3 md:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={`text-lg font-semibold flex items-center gap-2 font-['Montserrat'] ${
            darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'
          }`}>
            <Package size={20} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
            {t('proposal.skuCode')} ({displaySkuData.reduce((sum: any, b: any) => sum + b.items.length, 0)})
          </h3>

          {/* View Mode Toggle (hidden on mobile - always card view) */}
          <div className={`hidden md:flex items-center gap-1 rounded-lg p-1 ${darkMode ? 'bg-[#1A1A1A] border border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.12)] border border-[rgba(160,120,75,0.3)]'}`}>
            <button
              type="button"
              onClick={() => setSkuViewMode('card')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'card'
                  ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                  : darkMode ? 'text-[#666666] hover:text-[#999999]' : 'text-[#999999] hover:text-[#666666]'
              }`}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSkuViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'table'
                  ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                  : darkMode ? 'text-[#666666] hover:text-[#999999]' : 'text-[#999999] hover:text-[#666666]'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
        {/* === TABLE VIEW (desktop only) === */}
        {skuViewMode === 'table' && !isMobile && (
          <div className={`border rounded-2xl shadow-sm overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-300'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(160,120,75,0.18)]'}>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}></th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.skuCode')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.productName')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.productType')}</th>
                    <th className={`px-4 py-0.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.color')}</th>
                    <th className={`px-4 py-0.5 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.rex')}</th>
                    <th className={`px-4 py-0.5 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.ttp')}</th>
                    <th className={`px-4 py-0.5 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.order')}</th>
                    <th className={`px-4 py-0.5 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('proposal.totalValue')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-[#2E2E2E]' : 'divide-gray-100'}`}>
                  {displaySkuData.flatMap((block: any) => block.items.map((item: any, idx: any) => (
                    <tr key={`${item.sku}_${idx}`} className={`transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.05)]' : 'hover:bg-[rgba(160,120,75,0.1)]'}`}>
                      <td className="px-4 py-0.5">
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-gray-50 border-gray-300'}`}>
                          <ImageIcon size={16} className={darkMode ? 'text-[#666666]' : 'text-gray-500'} />
                        </div>
                      </td>
                      <td className={`px-4 py-0.5 font-['JetBrains_Mono'] text-sm ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{item.sku}</td>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.name}</td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{item.productType || block.productType}</td>
                      <td className={`px-4 py-0.5 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>{item.color || '-'}</td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] font-medium ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{item.rex || 0}</td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] font-medium text-[#127749]`}>{item.ttp || 0}</td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] font-bold ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.order || 0}</td>
                      <td className={`px-4 py-0.5 text-right font-['JetBrains_Mono'] font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(item.ttlValue || 0)}</td>
                    </tr>
                  )))}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30 bg-[rgba(215,183,151,0.05)]' : 'border-[#D7B797]/40 bg-[rgba(160,120,75,0.12)]'}`}>
                    <td colSpan={5} className={`px-4 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{t('skuProposal.total')}</td>
                    <td className={`px-4 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                      {displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.rex || 0), 0), 0)}
                    </td>
                    <td className={`px-4 py-0.5 text-center font-bold font-['JetBrains_Mono'] text-[#127749]`}>
                      {displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.ttp || 0), 0), 0)}
                    </td>
                    <td className={`px-4 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>
                      {displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.order || 0), 0), 0)}
                    </td>
                    <td className={`px-4 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>
                      {formatCurrency(displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.ttlValue || 0), 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* === CARD VIEW (always on mobile, or when card mode selected) === */}
        {(skuViewMode === 'card' || isMobile) && displaySkuData.map((block: any) => {
          const key = `${block.gender}_${block.productType}`;
          const isCollapsed = collapsed[key];
          const totalSrp = block.items.reduce((sum: any, i: any) => sum + i.srp, 0);
          return (
            <div key={key} className={`border rounded-2xl shadow-sm overflow-hidden ${
              darkMode
                ? 'bg-[#121212] border-[#2E2E2E]'
                : 'bg-white border-gray-300'
            }`}>
              <button
                type="button"
                onClick={() => setCollapsed((p: any) => ({ ...p, [key]: !p[key] }))}
                className={`w-full flex flex-wrap items-center gap-3 md:gap-4 px-3 md:px-5 py-0.5 md:py-1 transition-all ${
                  darkMode
                    ? 'bg-gradient-to-r from-[#1B2A4A] via-[#162240] to-[#1B2A4A] text-[#F2F2F2] hover:from-[#1F3058] hover:via-[#1A2848] hover:to-[#1F3058]'
                    : 'bg-gradient-to-r from-[#1E3A5F] via-[#2A4A7F] to-[#1E3A5F] text-white hover:from-[#234470] hover:via-[#305490] hover:to-[#234470]'
                }`}
              >
                <ChevronDown size={18} className={`transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-sm font-['Montserrat']">{block.subCategory}</div>
                  <div className={`text-sm mt-0.5 ${darkMode ? 'text-[#7A8BA8]' : 'text-blue-200'}`}>
                    {block.gender} • {block.productType} • <span className="font-['JetBrains_Mono']">{block.items.length}</span> SKUs
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#7A8BA8]' : 'text-blue-200'}`}>% Buy propose</div>
                    <div className={`text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{block.pctBuyPropose}%</div>
                  </div>
                  <div className={`w-px h-8 ${darkMode ? 'bg-[#2E3D5A]' : 'bg-blue-400/30'}`} />
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#7A8BA8]' : 'text-blue-200'}`}>OTB propose</div>
                    <div className={`text-sm font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(block.otbPropose)}</div>
                  </div>
                  <div className={`w-px h-8 ${darkMode ? 'bg-[#2E3D5A]' : 'bg-blue-400/30'}`} />
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${darkMode ? 'text-[#7A8BA8]' : 'text-blue-200'}`}>Total SRP</div>
                    <div className={`text-sm font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{formatCurrency(totalSrp)}</div>
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div className={`p-3 md:p-5 ${darkMode ? 'bg-[#0A0A0A]/50' : 'bg-gray-50/50'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                    {block.items.map((item: any, idx: any) => (
                      <SKUCard
                        key={`${item.sku}_${idx}`}
                        item={{ ...item, productType: block.productType }}
                        block={block}
                        cardIdx={idx}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
