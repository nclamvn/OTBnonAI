'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  ChevronDown,
  RefreshCcw,
  DollarSign,
  Target,
  Percent,
  ShoppingCart,
  Building2,
  Boxes,
  ClipboardCheck,
  BarChart3,
  Bell,
  TrendingUp,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { budgetService, masterDataService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import KPIDetailModal from '../components/Common/KPIDetailModal';

const STAT_ACCENTS = {
  gold:    { color: '#D7B797', darkGrad: 'rgba(215,183,151,0.18)', darkMid: 'rgba(215,183,151,0.06)', lightGrad: 'rgba(180,140,95,0.22)', lightMid: 'rgba(200,160,110,0.08)', iconDark: 'rgba(215,183,151,0.12)', iconLight: 'rgba(160,120,75,0.14)', glowDark: 'rgba(215,183,151,0.15)', glowLight: 'rgba(180,140,95,0.12)' },
  emerald: { color: '#2A9E6A', darkGrad: 'rgba(42,158,106,0.18)',  darkMid: 'rgba(42,158,106,0.05)', lightGrad: 'rgba(22,120,70,0.20)',  lightMid: 'rgba(30,140,80,0.06)',  iconDark: 'rgba(42,158,106,0.12)', iconLight: 'rgba(22,120,70,0.12)', glowDark: 'rgba(42,158,106,0.15)', glowLight: 'rgba(22,120,70,0.10)' },
  blue:    { color: '#58A6FF', darkGrad: 'rgba(88,166,255,0.16)',   darkMid: 'rgba(88,166,255,0.04)', lightGrad: 'rgba(50,120,220,0.18)', lightMid: 'rgba(60,140,240,0.06)', iconDark: 'rgba(88,166,255,0.12)', iconLight: 'rgba(50,120,220,0.12)', glowDark: 'rgba(88,166,255,0.12)', glowLight: 'rgba(50,120,220,0.10)' },
  rose:    { color: '#F87171', darkGrad: 'rgba(248,113,113,0.16)', darkMid: 'rgba(248,113,113,0.04)', lightGrad: 'rgba(220,70,70,0.18)',  lightMid: 'rgba(240,90,90,0.06)',  iconDark: 'rgba(248,113,113,0.12)', iconLight: 'rgba(200,60,60,0.12)', glowDark: 'rgba(248,113,113,0.12)', glowLight: 'rgba(220,70,70,0.10)' },
  amber:   { color: '#F59E0B', darkGrad: 'rgba(245,158,11,0.16)',   darkMid: 'rgba(245,158,11,0.04)', lightGrad: 'rgba(200,120,10,0.20)', lightMid: 'rgba(220,140,20,0.06)', iconDark: 'rgba(245,158,11,0.12)', iconLight: 'rgba(180,110,10,0.12)', glowDark: 'rgba(245,158,11,0.12)', glowLight: 'rgba(200,120,10,0.10)' },
  teal:    { color: '#14B8A6', darkGrad: 'rgba(20,184,166,0.16)',   darkMid: 'rgba(20,184,166,0.04)', lightGrad: 'rgba(15,140,130,0.18)', lightMid: 'rgba(20,160,150,0.06)', iconDark: 'rgba(20,184,166,0.12)', iconLight: 'rgba(15,140,130,0.12)', glowDark: 'rgba(20,184,166,0.12)', glowLight: 'rgba(15,140,130,0.10)' },
  violet:  { color: '#A78BFA', darkGrad: 'rgba(167,139,250,0.16)', darkMid: 'rgba(167,139,250,0.04)', lightGrad: 'rgba(120,90,220,0.18)', lightMid: 'rgba(140,110,240,0.06)', iconDark: 'rgba(167,139,250,0.12)', iconLight: 'rgba(100,70,200,0.12)', glowDark: 'rgba(167,139,250,0.12)', glowLight: 'rgba(120,90,220,0.10)' },
  indigo:  { color: '#818CF8', darkGrad: 'rgba(129,140,248,0.16)', darkMid: 'rgba(129,140,248,0.04)', lightGrad: 'rgba(80,90,220,0.18)',  lightMid: 'rgba(100,110,240,0.06)', iconDark: 'rgba(129,140,248,0.12)', iconLight: 'rgba(80,90,220,0.12)', glowDark: 'rgba(129,140,248,0.12)', glowLight: 'rgba(80,90,220,0.10)' },
};

const StatCard = ({ title, value, subtitle, trend, trendLabel, icon: Icon, darkMode, chart, accent = 'gold', onClick, cardKey }) => {
  const a = STAT_ACCENTS[accent] || STAT_ACCENTS.gold;
  const borderColor = darkMode ? 'border-[#2E2E2E]' : 'border-gray-200';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';

  return (
    <div
      className={`relative overflow-hidden border ${borderColor} rounded-xl px-3 py-2 transition-all duration-200 hover:shadow-md group ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: darkMode
          ? `linear-gradient(135deg, #121212 0%, ${a.darkMid} 40%, ${a.darkGrad} 100%)`
          : `linear-gradient(135deg, #ffffff 0%, ${a.lightMid} 35%, ${a.lightGrad} 100%)`,
        boxShadow: `inset 0 -1px 0 ${darkMode ? a.glowDark : a.glowLight}`,
      }}
      onClick={onClick}
    >
      {/* Watermark Icon */}
      <div
        className="absolute -bottom-1 -right-1 transition-all duration-300 group-hover:scale-110 group-hover:opacity-[0.15] pointer-events-none"
        style={{ opacity: darkMode ? 0.06 : 0.08 }}
      >
        <Icon size={48} color={a.color} strokeWidth={1} />
      </div>

      {/* Expand hint */}
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <ArrowUpRight size={10} color={a.color} />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-medium uppercase tracking-wider ${textMuted}`}>{title}</p>
          <div className={`mt-0.5 text-lg font-bold font-['JetBrains_Mono'] tabular-nums leading-tight ${textPrimary}`}>{value}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {trendLabel && (
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold font-['JetBrains_Mono'] rounded ${
                trend > 0
                  ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]'
                  : 'bg-[rgba(248,81,73,0.15)] text-[#FF7B72]'
              }`}>
                {trend > 0 ? '\u25B2' : '\u25BC'} {trendLabel}
              </span>
            )}
            <p className={`text-[10px] ${textMuted}`}>{subtitle}</p>
          </div>
        </div>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0"
          style={{ backgroundColor: darkMode ? a.iconDark : a.iconLight }}
        >
          <Icon size={14} color={a.color} />
        </div>
      </div>
      {chart && <div className="relative z-10 mt-1.5">{chart}</div>}
    </div>
  );
};

const SmallCard = ({ title, value, subtitle, icon: Icon, darkMode, accent = 'gold', onClick, cardKey }) => {
  const a = STAT_ACCENTS[accent] || STAT_ACCENTS.gold;
  const borderColor = darkMode ? 'border-[#2E2E2E]' : 'border-gray-200';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';

  return (
    <div
      className={`relative overflow-hidden border ${borderColor} rounded-xl px-3 py-2 transition-all duration-200 hover:shadow-md group ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: darkMode
          ? `linear-gradient(135deg, #121212 0%, ${a.darkMid} 40%, ${a.darkGrad} 100%)`
          : `linear-gradient(135deg, #ffffff 0%, ${a.lightMid} 35%, ${a.lightGrad} 100%)`,
        boxShadow: `inset 0 -1px 0 ${darkMode ? a.glowDark : a.glowLight}`,
      }}
      onClick={onClick}
    >
      {/* Watermark Icon */}
      <div
        className="absolute -bottom-1 -right-1 transition-all duration-300 group-hover:scale-110 group-hover:opacity-[0.15] pointer-events-none"
        style={{ opacity: darkMode ? 0.05 : 0.07 }}
      >
        <Icon size={44} color={a.color} strokeWidth={1} />
      </div>

      {/* Expand hint */}
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <ArrowUpRight size={10} color={a.color} />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-medium uppercase tracking-wider ${textMuted}`}>{title}</p>
          <div className={`mt-0.5 text-lg font-bold font-['JetBrains_Mono'] tabular-nums leading-tight ${textPrimary}`}>{value}</div>
          <p className={`text-[10px] ${textMuted}`}>{subtitle}</p>
        </div>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0"
          style={{ backgroundColor: darkMode ? a.iconDark : a.iconLight }}
        >
          <Icon size={14} color={a.color} />
        </div>
      </div>
    </div>
  );
};

const CARD_CONFIG = {
  totalSales: { icon: DollarSign, accent: 'gold' },
  budgetUtilization: { icon: Target, accent: 'emerald' },
  avgMargin: { icon: Percent, accent: 'blue' },
  sellThrough: { icon: ShoppingCart, accent: 'rose' },
  totalBrands: { icon: Building2, accent: 'amber' },
  categories: { icon: Boxes, accent: 'teal' },
  pendingApprovals: { icon: ClipboardCheck, accent: 'violet' },
  activePlans: { icon: BarChart3, accent: 'indigo' },
};

const HomeScreen = ({ darkMode = true }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const panelBg = darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-200';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';

  // KPI expand state
  const [expandedCard, setExpandedCard] = useState(null);

  // Stats from API
  const [stats, setStats] = useState({
    totalSales: '0',
    budgetUtilization: '0%',
    avgMargin: '0%',
    sellThrough: '0%',
    totalBrands: '0',
    categories: '0',
    pendingApprovals: '0',
    activePlans: '0'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Dashboard filter state
  const SEASON_OPTIONS = ['SS25', 'FW25', 'SS26', 'FW26'];
  const REGION_OPTIONS = ['Vietnam', 'Global'];
  const [selectedSeason, setSelectedSeason] = useState('SS25');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('Vietnam');
  const [brandOptions, setBrandOptions] = useState([]);
  const [openFilter, setOpenFilter] = useState(null); // 'season' | 'brand' | 'region' | null
  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch brands for filter
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brands = await masterDataService.getBrands();
        const list = Array.isArray(brands) ? brands : (brands?.data || []);
        setBrandOptions(list.map(b => b.name || b.code || 'Unknown'));
      } catch { setBrandOptions([]); }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const data = await budgetService.getStatistics();
        if (data) {
          setStats({
            totalSales: data.totalSales || data.totalBudget || '0',
            budgetUtilization: data.budgetUtilization || data.utilization || '0%',
            avgMargin: data.avgMargin || '0%',
            sellThrough: data.sellThrough || '0%',
            totalBrands: String(data.totalBrands || data.brandCount || 0),
            categories: String(data.categories || data.categoryCount || 0),
            pendingApprovals: String(data.pendingApprovals || data.pendingCount || 0),
            activePlans: String(data.activePlans || data.planCount || 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div>
            <h2 className={`text-xl font-bold font-['Montserrat'] ${textPrimary}`}>{t('home.welcomeBack', { name: userName })}</h2>
            <p className={`text-sm ${textMuted}`}>{t('home.subtitle')}</p>
          </div>
        </div>
        <span className="inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-wider font-['Montserrat'] rounded-full bg-[rgba(215,183,151,0.15)] text-[#D7B797] border border-[rgba(215,183,151,0.3)]">
          {t('home.springSummer2025')}
        </span>
      </div>

      {/* Filter Bar */}
      <div className={`border ${panelBg} rounded-lg p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold uppercase rounded bg-[rgba(18,119,73,0.15)] text-[#2A9E6A] border border-[rgba(18,119,73,0.4)]">
            <span className="w-2 h-2 rounded-full bg-[#127749]"></span>
            {t('common.live').toUpperCase()}
          </span>
          {/* Filter Dropdowns */}
          <div ref={filterRef} className="flex flex-wrap items-center gap-3">
            {[
              { key: 'season', label: t('home.season'), value: selectedSeason, options: SEASON_OPTIONS, onSelect: setSelectedSeason },
              { key: 'brand', label: t('home.brand'), value: selectedBrand === 'all' ? t('home.allBrands') : selectedBrand, options: ['all', ...brandOptions], onSelect: setSelectedBrand, displayFn: (v) => v === 'all' ? t('home.allBrands') : v },
              { key: 'region', label: t('home.region'), value: selectedRegion, options: REGION_OPTIONS, onSelect: setSelectedRegion }
            ].map((filter) => (
              <div key={filter.key} className="relative">
                <button
                  onClick={() => setOpenFilter(openFilter === filter.key ? null : filter.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-150 ${
                    openFilter === filter.key
                      ? darkMode
                        ? 'border-[rgba(215,183,151,0.4)] bg-[rgba(215,183,151,0.08)] text-[#D7B797]'
                        : 'border-[rgba(184,153,112,0.5)] bg-[rgba(215,183,151,0.15)] text-[#8A6340]'
                      : darkMode
                        ? 'border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                        : 'border-gray-200 text-gray-600 hover:bg-[rgba(215,183,151,0.15)] hover:border-[rgba(184,153,112,0.4)] hover:text-[#8A6340]'
                  }`}
                >
                  <span className="uppercase tracking-wide text-[10px]">{filter.label}</span>
                  <span className={`text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{filter.value}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${openFilter === filter.key ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === filter.key && (
                  <div className={`absolute top-full left-0 mt-2 min-w-[160px] rounded-xl shadow-xl border overflow-hidden z-50 ${
                    darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-gray-200'
                  }`}>
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {filter.options.map((opt) => {
                        const display = filter.displayFn ? filter.displayFn(opt) : opt;
                        const isSelected = filter.key === 'brand' ? (opt === selectedBrand) : (opt === filter.value);
                        return (
                          <button
                            key={opt}
                            onClick={() => { filter.onSelect(opt); setOpenFilter(null); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                              isSelected
                                ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
                                : darkMode ? 'text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.08)]' : 'text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-medium font-['Montserrat']">{display}</span>
                            {isSelected && <Check size={14} className="text-[#127749]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className={`inline-flex items-center gap-2 ${textMuted}`}>
              <span className="w-2 h-2 rounded-full bg-[#127749]"></span>
              {t('common.updatedJustNow')}
            </span>
            <button className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-150 ${
              darkMode
                ? 'border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                : 'border-gray-200 text-gray-600 hover:bg-[rgba(215,183,151,0.15)] hover:text-[#8A6340]'
            }`}>
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
        <StatCard
          title={t('home.totalSales')}
          value="12,5 T d"
          trend={12.5}
          trendLabel="12.5%"
          subtitle={t('home.unitsVsLastSeason')}
          icon={DollarSign}
          darkMode={darkMode}
          accent="gold"
          cardKey="totalSales"
          onClick={() => setExpandedCard({ key: 'totalSales', title: t('home.totalSales'), value: '12,5 T d', trend: 12.5, trendLabel: '12.5%', subtitle: t('home.unitsVsLastSeason') })}
          chart={(
            <svg viewBox="0 0 160 40" className="w-full h-6">
              <polyline
                fill="none"
                stroke="#D7B797"
                strokeWidth="3"
                points="0,32 24,28 48,20 72,22 96,14 120,16 144,8 160,10"
              />
            </svg>
          )}
        />
        <StatCard
          title={t('home.budgetUtilization')}
          value="57%"
          trend={8.2}
          trendLabel="8.2%"
          subtitle={t('home.thisMonth')}
          icon={Target}
          darkMode={darkMode}
          accent="emerald"
          cardKey="budgetUtilization"
          onClick={() => setExpandedCard({ key: 'budgetUtilization', title: t('home.budgetUtilization'), value: '57%', trend: 8.2, trendLabel: '8.2%', subtitle: t('home.thisMonth') })}
          chart={(
            <svg viewBox="0 0 160 40" className="w-full h-6">
              <polyline
                fill="none"
                stroke="#2A9E6A"
                strokeWidth="3"
                points="0,30 30,26 60,22 90,18 120,16 150,12 160,10"
              />
            </svg>
          )}
        />
        <StatCard
          title={t('home.avgMargin')}
          value="42.5%"
          trend={2.3}
          trendLabel="2.3%"
          subtitle={t('home.acrossCategories')}
          icon={Percent}
          darkMode={darkMode}
          accent="blue"
          cardKey="avgMargin"
          onClick={() => setExpandedCard({ key: 'avgMargin', title: t('home.avgMargin'), value: '42.5%', trend: 2.3, trendLabel: '2.3%', subtitle: t('home.acrossCategories') })}
        />
        <StatCard
          title={t('home.sellThrough')}
          value="68.3%"
          trend={-1.5}
          trendLabel="1.5%"
          subtitle={t('home.currentSeasonPerformance')}
          icon={ShoppingCart}
          darkMode={darkMode}
          accent="rose"
          cardKey="sellThrough"
          onClick={() => setExpandedCard({ key: 'sellThrough', title: t('home.sellThrough'), value: '68.3%', trend: -1.5, trendLabel: '1.5%', subtitle: t('home.currentSeasonPerformance') })}
        />
      </div>

      {/* Small Stats */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
        <SmallCard
          title={t('home.totalBrands')}
          value={stats.totalBrands}
          subtitle={t('home.activeBrands')}
          icon={Building2}
          darkMode={darkMode}
          accent="amber"
          cardKey="totalBrands"
          onClick={() => setExpandedCard({ key: 'totalBrands', title: t('home.totalBrands'), value: stats.totalBrands, subtitle: t('home.activeBrands') })}
        />
        <SmallCard
          title={t('home.categoriesTitle')}
          value={stats.categories}
          subtitle={t('home.productCategories')}
          icon={Boxes}
          darkMode={darkMode}
          accent="teal"
          cardKey="categories"
          onClick={() => setExpandedCard({ key: 'categories', title: t('home.categoriesTitle'), value: stats.categories, subtitle: t('home.productCategories') })}
        />
        <SmallCard
          title={t('home.pendingApprovals')}
          value={stats.pendingApprovals}
          subtitle={t('home.itemsAwaitingReview')}
          icon={ClipboardCheck}
          darkMode={darkMode}
          accent="violet"
          cardKey="pendingApprovals"
          onClick={() => setExpandedCard({ key: 'pendingApprovals', title: t('home.pendingApprovals'), value: stats.pendingApprovals, subtitle: t('home.itemsAwaitingReview') })}
        />
        <SmallCard
          title={t('home.activePlans')}
          value={stats.activePlans}
          subtitle={t('home.otbPlansInProgress')}
          icon={BarChart3}
          darkMode={darkMode}
          accent="indigo"
          cardKey="activePlans"
          onClick={() => setExpandedCard({ key: 'activePlans', title: t('home.activePlans'), value: stats.activePlans, subtitle: t('home.otbPlansInProgress') })}
        />
      </div>

      {/* Charts & Alerts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Sales Performance Chart */}
        <div className={`border ${panelBg} rounded-lg p-5 transition-all duration-150 hover:border-[rgba(215,183,151,0.25)]`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold font-['Montserrat'] ${textPrimary}`}>{t('home.salesPerformance')}</h3>
              <p className={`text-xs ${textMuted}`}>{t('home.monthlyComparison')}</p>
            </div>
            <span className="inline-flex px-3 py-1 text-xs font-semibold uppercase tracking-wider font-['Montserrat'] rounded-full bg-[rgba(215,183,151,0.15)] text-[#D7B797] border border-[rgba(215,183,151,0.3)]">
              {t('common.liveData')}
            </span>
          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: t('home.totalRevenue'), value: '12,5T', trend: '+12.5%', up: true },
              { label: t('home.monthlyGrowth'), value: '+8.2%', trend: t('home.aboveTarget'), up: true },
              { label: t('home.bestMonth'), value: t('home.aug'), trend: '2,1T đ', up: true },
              { label: t('home.avgMonthly'), value: '1,39T', trend: '+5.4%', up: true },
            ].map((s, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2.5 border ${darkMode ? 'border-[#2E2E2E] bg-[rgba(255,255,255,0.02)]' : 'border-gray-100 bg-gray-50'}`}
              >
                <p className={`text-[10px] font-medium uppercase tracking-wider ${textMuted} font-['Montserrat']`}>{s.label}</p>
                <p className={`text-base font-bold font-['JetBrains_Mono'] tabular-nums mt-0.5 ${textPrimary}`}>{s.value}</p>
                <span className={`text-[10px] font-semibold font-['JetBrains_Mono'] ${s.up ? 'text-[#2A9E6A]' : 'text-[#FF7B72]'}`}>
                  {s.up ? '▲' : '▼'} {s.trend}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-[3px] rounded-full bg-[#D7B797]"></span>
              <span className={`text-[11px] font-medium font-['Montserrat'] ${textMuted}`}>{t('home.actualSales')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-[3px] rounded-full bg-[#2A9E6A]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #2A9E6A 0, #2A9E6A 4px, transparent 4px, transparent 8px)' }}></span>
              <span className={`text-[11px] font-medium font-['Montserrat'] ${textMuted}`}>{t('home.targetSales')}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-1">
            <svg viewBox="0 0 540 230" className="w-full" style={{ height: '220px' }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D7B797" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#D7B797" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="targetFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2A9E6A" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#2A9E6A" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Y-axis labels */}
              {[
                { y: 30, label: '2,5T' },
                { y: 70, label: '2,0T' },
                { y: 110, label: '1,5T' },
                { y: 150, label: '1,0T' },
                { y: 190, label: '0,5T' },
              ].map((tick) => (
                <g key={tick.y}>
                  <text x="38" y={tick.y + 3} textAnchor="end" fontSize="9" fill={darkMode ? '#555555' : '#9ca3af'} fontFamily="JetBrains Mono">{tick.label}</text>
                  <line x1="44" y1={tick.y} x2="520" y2={tick.y} stroke={darkMode ? '#1E1E1E' : '#f3f4f6'} strokeWidth="1" />
                </g>
              ))}

              {/* Area fill - actual */}
              <path
                d="M62,185 L119,168 L176,148 L233,138 L290,120 L347,105 L404,88 L461,72 L518,58 L518,200 L62,200 Z"
                fill="url(#salesFill)"
              />
              {/* Area fill - target */}
              <path
                d="M62,192 L119,176 L176,162 L233,148 L290,138 L347,125 L404,115 L461,105 L518,95 L518,200 L62,200 Z"
                fill="url(#targetFill)"
              />

              {/* Actual line */}
              <polyline
                fill="none"
                stroke="#D7B797"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="62,185 119,168 176,148 233,138 290,120 347,105 404,88 461,72 518,58"
              />
              {/* Target line */}
              <polyline
                fill="none"
                stroke="#2A9E6A"
                strokeDasharray="6 4"
                strokeWidth="2"
                strokeLinecap="round"
                points="62,192 119,176 176,162 233,148 290,138 347,125 404,115 461,105 518,95"
              />

              {/* Data point dots - actual */}
              {[
                [62,185], [119,168], [176,148], [233,138], [290,120], [347,105], [404,88], [461,72], [518,58]
              ].map(([cx, cy], i) => (
                <g key={`dot-a-${i}`}>
                  <circle cx={cx} cy={cy} r="5" fill={darkMode ? '#121212' : '#ffffff'} stroke="#D7B797" strokeWidth="2.5" />
                </g>
              ))}
              {/* Data point dots - target */}
              {[
                [62,192], [119,176], [176,162], [233,148], [290,138], [347,125], [404,115], [461,105], [518,95]
              ].map(([cx, cy], i) => (
                <g key={`dot-t-${i}`}>
                  <circle cx={cx} cy={cy} r="3.5" fill={darkMode ? '#121212' : '#ffffff'} stroke="#2A9E6A" strokeWidth="2" />
                </g>
              ))}

              {/* Value labels on actual line (every other point) */}
              {[
                { x: 62, y: 185, label: '0,8T' },
                { x: 176, y: 148, label: '1,2T' },
                { x: 290, y: 120, label: '1,5T' },
                { x: 404, y: 88, label: '1,9T' },
                { x: 518, y: 58, label: '2,3T' },
              ].map((p, i) => (
                <g key={`val-${i}`}>
                  <rect x={p.x - 16} y={p.y - 20} width="32" height="14" rx="4" fill={darkMode ? 'rgba(215,183,151,0.15)' : 'rgba(215,183,151,0.2)'} />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="8" fill="#D7B797" fontFamily="JetBrains Mono" fontWeight="600">{p.label}</text>
                </g>
              ))}

              {/* X-axis month labels */}
              {[
                { x: 62, m: 'jan' }, { x: 119, m: 'feb' }, { x: 176, m: 'mar' },
                { x: 233, m: 'apr' }, { x: 290, m: 'may' }, { x: 347, m: 'jun' },
                { x: 404, m: 'jul' }, { x: 461, m: 'aug' }, { x: 518, m: 'sep' },
              ].map((tick) => (
                <text key={tick.m} x={tick.x} y={215} textAnchor="middle" fontSize="9" fill={darkMode ? '#555555' : '#9ca3af'} fontFamily="Montserrat" fontWeight="500">
                  {t(`home.${tick.m}`)}
                </text>
              ))}

              {/* Highlight best month marker */}
              <line x1="461" y1="72" x2="461" y2="200" stroke="#D7B797" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              <rect x="443" y="62" width="36" height="14" rx="4" fill="rgba(215,183,151,0.2)" stroke="rgba(215,183,151,0.3)" strokeWidth="0.5" />
              <text x="461" y="72" textAnchor="middle" fontSize="8" fill="#D7B797" fontFamily="JetBrains Mono" fontWeight="700">2,1T</text>
            </svg>
          </div>
        </div>

        {/* Active Alerts */}
        <div className={`border ${panelBg} rounded-lg p-5 transition-all duration-150 hover:border-[rgba(215,183,151,0.25)]`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-[rgba(215,183,151,0.1)]'
              }`}>
                <Bell size={18} className="text-[#D7B797]" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold font-['Montserrat'] ${textPrimary}`}>{t('home.activeAlerts')}</h3>
                <p className={`text-xs ${textMuted}`}>{t('home.activeAlertsCount', { count: 4 })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-[rgba(248,81,73,0.15)] text-[#FF7B72] font-semibold">1</span>
              <span className="px-2 py-1 rounded bg-[rgba(210,153,34,0.15)] text-[#E3B341] font-semibold">1</span>
              <span className="px-2 py-1 rounded bg-[rgba(88,166,255,0.15)] text-[#79C0FF] font-semibold">1</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Critical Alert */}
            <div className={`border rounded-lg p-4 transition-all duration-150 border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.08)] hover:border-[rgba(248,81,73,0.5)]`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(248,81,73,0.2)]">
                  <Bell size={16} className="text-[#F85149]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimary}`}>{t('home.lowStockAlert')}</span>
                    <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>{t('home.timeAgo15m')}</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                    {t('home.lowStockMessage')}
                  </p>
                  <button className="mt-2 text-xs font-semibold text-[#FF7B72] hover:text-[#F85149] transition-colors">{t('common.viewDetails')}</button>
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <div className={`border rounded-lg p-4 transition-all duration-150 border-[rgba(210,153,34,0.3)] bg-[rgba(210,153,34,0.08)] hover:border-[rgba(210,153,34,0.5)]`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(210,153,34,0.2)]">
                  <TrendingUp size={16} className="text-[#D29922]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimary}`}>{t('home.budgetThresholdWarning')}</span>
                    <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>{t('home.timeAgo1h')}</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                    {t('home.budgetThresholdMessage')}
                  </p>
                  <button className="mt-2 text-xs font-semibold text-[#E3B341] hover:text-[#D29922] transition-colors">{t('common.viewDetails')}</button>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className={`border rounded-lg p-4 transition-all duration-150 border-[rgba(88,166,255,0.3)] bg-[rgba(88,166,255,0.08)] hover:border-[rgba(88,166,255,0.5)]`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(88,166,255,0.2)]">
                  <BarChart3 size={16} className="text-[#58A6FF]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimary}`}>{t('home.salesSpike')}</span>
                    <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>{t('home.timeAgo3h')}</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                    {t('home.salesSpikeMessage')}
                  </p>
                  <button className="mt-2 text-xs font-semibold text-[#79C0FF] hover:text-[#58A6FF] transition-colors">{t('common.viewDetails')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Detail Modal */}
      {expandedCard && (
        <KPIDetailModal
          isOpen={!!expandedCard}
          onClose={() => setExpandedCard(null)}
          cardKey={expandedCard.key}
          title={expandedCard.title}
          icon={CARD_CONFIG[expandedCard.key]?.icon}
          accent={CARD_CONFIG[expandedCard.key]?.accent}
          darkMode={darkMode}
          currentValue={expandedCard.value}
          trend={expandedCard.trend}
          trendLabel={expandedCard.trendLabel}
          subtitle={expandedCard.subtitle}
        />
      )}
    </div>
  );
};

export default HomeScreen;
