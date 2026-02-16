'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
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
import KPIDetailModal from '../components/ui/KPIDetailModal';
import { FilterChips, useBottomSheet, FilterBottomSheet } from '../components/mobile';
import { useIsMobile } from '@/hooks/useIsMobile';

const STAT_ACCENTS = {
  gold:    { color: '#D7B797', darkGrad: 'rgba(215,183,151,0.18)', darkMid: 'rgba(215,183,151,0.06)', lightGrad: 'rgba(160,120,70,0.38)', lightMid: 'rgba(180,140,95,0.16)', iconDark: 'rgba(215,183,151,0.12)', iconLight: 'rgba(140,100,55,0.26)', glowDark: 'rgba(215,183,151,0.15)', glowLight: 'rgba(160,120,70,0.20)' },
  emerald: { color: '#2A9E6A', darkGrad: 'rgba(42,158,106,0.18)',  darkMid: 'rgba(42,158,106,0.05)', lightGrad: 'rgba(15,100,55,0.35)',  lightMid: 'rgba(20,120,65,0.14)',  iconDark: 'rgba(42,158,106,0.12)', iconLight: 'rgba(15,100,55,0.24)', glowDark: 'rgba(42,158,106,0.15)', glowLight: 'rgba(15,100,55,0.18)' },
  blue:    { color: '#58A6FF', darkGrad: 'rgba(88,166,255,0.16)',   darkMid: 'rgba(88,166,255,0.04)', lightGrad: 'rgba(40,100,200,0.32)', lightMid: 'rgba(50,120,220,0.14)', iconDark: 'rgba(88,166,255,0.12)', iconLight: 'rgba(40,100,200,0.24)', glowDark: 'rgba(88,166,255,0.12)', glowLight: 'rgba(40,100,200,0.18)' },
  rose:    { color: '#F87171', darkGrad: 'rgba(248,113,113,0.16)', darkMid: 'rgba(248,113,113,0.04)', lightGrad: 'rgba(200,55,55,0.32)',  lightMid: 'rgba(220,70,70,0.14)',  iconDark: 'rgba(248,113,113,0.12)', iconLight: 'rgba(180,45,45,0.24)', glowDark: 'rgba(248,113,113,0.12)', glowLight: 'rgba(200,55,55,0.18)' },
  amber:   { color: '#F59E0B', darkGrad: 'rgba(245,158,11,0.16)',   darkMid: 'rgba(245,158,11,0.04)', lightGrad: 'rgba(180,100,5,0.35)', lightMid: 'rgba(200,120,10,0.14)', iconDark: 'rgba(245,158,11,0.12)', iconLight: 'rgba(160,90,5,0.24)', glowDark: 'rgba(245,158,11,0.12)', glowLight: 'rgba(180,100,5,0.18)' },
  teal:    { color: '#14B8A6', darkGrad: 'rgba(20,184,166,0.16)',   darkMid: 'rgba(20,184,166,0.04)', lightGrad: 'rgba(10,120,110,0.32)', lightMid: 'rgba(15,140,130,0.14)', iconDark: 'rgba(20,184,166,0.12)', iconLight: 'rgba(10,120,110,0.24)', glowDark: 'rgba(20,184,166,0.12)', glowLight: 'rgba(10,120,110,0.18)' },
  violet:  { color: '#A78BFA', darkGrad: 'rgba(167,139,250,0.16)', darkMid: 'rgba(167,139,250,0.04)', lightGrad: 'rgba(100,70,200,0.32)', lightMid: 'rgba(120,90,220,0.14)', iconDark: 'rgba(167,139,250,0.12)', iconLight: 'rgba(80,55,180,0.24)', glowDark: 'rgba(167,139,250,0.12)', glowLight: 'rgba(100,70,200,0.18)' },
  indigo:  { color: '#818CF8', darkGrad: 'rgba(129,140,248,0.16)', darkMid: 'rgba(129,140,248,0.04)', lightGrad: 'rgba(60,70,200,0.32)',  lightMid: 'rgba(80,90,220,0.14)', iconDark: 'rgba(129,140,248,0.12)', iconLight: 'rgba(60,70,200,0.24)', glowDark: 'rgba(129,140,248,0.12)', glowLight: 'rgba(60,70,200,0.18)' },
};

const StatCard = ({ title, value, subtitle, trend, trendLabel, icon: Icon, darkMode, chart, accent = 'gold', onClick, cardKey }: any) => {
  const a = (STAT_ACCENTS as any)[accent] || STAT_ACCENTS.gold;
  const borderColor = darkMode ? 'border-[#2E2E2E]' : 'border-gray-300';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';

  return (
    <div
      className={`relative overflow-hidden border ${borderColor} rounded-xl px-3 py-1 transition-all duration-200 hover:shadow-md group ${onClick ? 'cursor-pointer' : ''}`}
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
        style={{ opacity: darkMode ? 0.06 : 0.14 }}
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

const SmallCard = ({ title, value, subtitle, icon: Icon, darkMode, accent = 'gold', onClick, cardKey }: any) => {
  const a = (STAT_ACCENTS as any)[accent] || STAT_ACCENTS.gold;
  const borderColor = darkMode ? 'border-[#2E2E2E]' : 'border-gray-300';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';

  return (
    <div
      className={`relative overflow-hidden border ${borderColor} rounded-xl px-3 py-1 transition-all duration-200 hover:shadow-md group ${onClick ? 'cursor-pointer' : ''}`}
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
        style={{ opacity: darkMode ? 0.05 : 0.13 }}
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
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const panelBg = darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-300';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';

  // KPI expand state
  const [expandedCard, setExpandedCard] = useState<any>(null);
  // Alert expand state
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

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
  const [brandOptions, setBrandOptions] = useState<any[]>([]);
  const [openFilter, setOpenFilter] = useState<any>(null); // 'season' | 'brand' | 'region' | null
  const filterRef = useRef<any>(null);
  const { isOpen: mobileFilterOpen, open: openMobileFilter, close: closeMobileFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: any) => {
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
        const list = Array.isArray(brands) ? brands : ((brands as any)?.data || []);
        setBrandOptions(list.map((b: any) => b.name || b.code || 'Unknown'));
      } catch { setBrandOptions([]); }
    };
    fetchBrands();
  }, []);

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
      toast.error('Không thể tải dữ liệu tổng quan.');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div>
            <h2 className={`text-xl font-bold font-['Montserrat'] ${textPrimary}`}>{t('home.welcomeBack', { name: userName })}</h2>
            <p className={`text-sm ${textMuted}`}>{t('home.subtitle')}</p>
          </div>
        </div>
        <span className={`inline-flex px-4 py-1 text-xs font-semibold uppercase tracking-wider font-['Montserrat'] rounded-full ${
          darkMode
            ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] border border-[rgba(215,183,151,0.3)]'
            : 'bg-[rgba(138,99,64,0.18)] text-[#5A3D22] border border-[rgba(138,99,64,0.45)]'
        }`}>
          {t('home.springSummer2025')}
        </span>
      </div>

      {/* Mobile Filter Chips */}
      {isMobile && (
        <FilterChips
          chips={[
            { key: 'season', label: selectedSeason, icon: '📅' },
            { key: 'brand', label: selectedBrand === 'all' ? t('home.allBrands') : selectedBrand, icon: '🏷️' },
            { key: 'region', label: selectedRegion, icon: '🌍' },
          ]}
          activeValues={mobileFilterValues}
          onChipPress={() => openMobileFilter()}
          onMorePress={openMobileFilter}
        />
      )}

      {/* Desktop Filter Bar */}
      {!isMobile && <div className={`border ${panelBg} rounded-lg p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold uppercase rounded ${
            darkMode
              ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A] border border-[rgba(18,119,73,0.4)]'
              : 'bg-[rgba(9,84,49,0.14)] text-[#065F32] border border-[rgba(9,84,49,0.4)]'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#127749]"></span>
            {t('common.live').toUpperCase()}
          </span>
          {/* Filter Dropdowns */}
          <div ref={filterRef} className="flex flex-wrap items-center gap-3">
            {[
              { key: 'season', label: t('home.season'), value: selectedSeason, options: SEASON_OPTIONS, onSelect: setSelectedSeason },
              { key: 'brand', label: t('home.brand'), value: selectedBrand === 'all' ? t('home.allBrands') : selectedBrand, options: ['all', ...brandOptions], onSelect: setSelectedBrand, displayFn: (v: any) => v === 'all' ? t('home.allBrands') : v },
              { key: 'region', label: t('home.region'), value: selectedRegion, options: REGION_OPTIONS, onSelect: setSelectedRegion }
            ].map((filter) => (
              <div key={filter.key} className="relative">
                <button
                  onClick={() => setOpenFilter(openFilter === filter.key ? null : filter.key)}
                  className={`flex items-center gap-2 px-4 py-1 rounded-full border text-xs font-semibold transition-all duration-150 ${
                    openFilter === filter.key
                      ? darkMode
                        ? 'border-[rgba(215,183,151,0.4)] bg-[rgba(215,183,151,0.08)] text-[#D7B797]'
                        : 'border-[rgba(184,153,112,0.5)] bg-[rgba(215,183,151,0.15)] text-[#6B4D30]'
                      : darkMode
                        ? 'border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                        : 'border-gray-300 text-gray-700 hover:bg-[rgba(215,183,151,0.15)] hover:border-[rgba(184,153,112,0.4)] hover:text-[#6B4D30]'
                  }`}
                >
                  <span className="uppercase tracking-wide text-[10px]">{filter.label}</span>
                  <span className={`text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{filter.value}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${openFilter === filter.key ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === filter.key && (
                  <div className={`absolute top-full left-0 mt-2 min-w-[160px] rounded-xl shadow-xl border overflow-hidden z-50 ${
                    darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-gray-300'
                  }`}>
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {filter.options.map((opt) => {
                        const display = filter.displayFn ? filter.displayFn(opt) : opt;
                        const isSelected = filter.key === 'brand' ? (opt === selectedBrand) : (opt === filter.value);
                        return (
                          <button
                            key={opt}
                            onClick={() => { filter.onSelect(opt); setOpenFilter(null); }}
                            className={`w-full flex items-center justify-between px-4 py-1 text-sm transition-colors ${
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
                : 'border-gray-300 text-gray-700 hover:bg-[rgba(215,183,151,0.15)] hover:text-[#6B4D30]'
            }`}>
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      </div>}

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

      {/* Sales Performance Chart - Full Width Premium */}
      <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        darkMode
          ? 'border-[#1E1E1E] bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#0A0A0A]'
          : 'border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-white'
      }`} style={darkMode ? { boxShadow: '0 0 40px rgba(215,183,151,0.03), inset 0 1px 0 rgba(255,255,255,0.02)' } : { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              darkMode ? 'bg-gradient-to-br from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.05)]' : 'bg-gradient-to-br from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.05)]'
            }`}>
              <TrendingUp size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#8B6914]'} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold font-['Montserrat'] tracking-tight ${textPrimary}`}>{t('home.salesPerformance')}</h3>
              <p className={`text-xs ${textMuted} mt-0.5`}>{t('home.monthlyComparison')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-5 mr-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-[2.5px] rounded-full bg-[#D7B797]"></span>
                <span className={`text-[11px] font-medium font-['Montserrat'] ${textMuted}`}>{t('home.actualSales')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-[2.5px] rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #2A9E6A 0, #2A9E6A 4px, transparent 4px, transparent 7px)', backgroundSize: '7px 2.5px' }}></span>
                <span className={`text-[11px] font-medium font-['Montserrat'] ${textMuted}`}>{t('home.targetSales')}</span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest font-['Montserrat'] rounded-full border ${
              darkMode
                ? 'bg-[rgba(42,158,106,0.1)] text-[#2A9E6A] border-[rgba(42,158,106,0.2)]'
                : 'bg-[rgba(42,158,106,0.08)] text-[#1a7a4f] border-[rgba(42,158,106,0.2)]'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A9E6A] animate-pulse"></span>
              {t('common.liveData')}
            </span>
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 mt-4">
          {[
            { label: t('home.totalRevenue'), value: '12,5T', trend: '+12.5%', up: true, icon: '₫' },
            { label: t('home.monthlyGrowth'), value: '+8.2%', trend: t('home.aboveTarget'), up: true, icon: '↗' },
            { label: t('home.bestMonth'), value: t('home.aug'), trend: '2,1T đ', up: true, icon: '★' },
            { label: t('home.avgMonthly'), value: '1,39T', trend: '+5.4%', up: true, icon: '◎' },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3 border transition-all duration-200 ${
                darkMode
                  ? 'border-[#1A1A1A] bg-[rgba(255,255,255,0.015)] hover:border-[#2A2A2A] hover:bg-[rgba(255,255,255,0.03)]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted} font-['Montserrat']`}>{s.label}</p>
                <span className={`text-[10px] ${darkMode ? 'text-[#333]' : 'text-gray-300'}`}>{s.icon}</span>
              </div>
              <p className={`text-xl font-bold font-['JetBrains_Mono'] tabular-nums mt-1 ${textPrimary}`}>{s.value}</p>
              <span className={`text-[10px] font-semibold font-['JetBrains_Mono'] ${s.up ? 'text-[#2A9E6A]' : 'text-[#FF7B72]'}`}>
                {s.up ? '▲' : '▼'} {s.trend}
              </span>
            </div>
          ))}
        </div>

        {/* Chart - Full Width */}
        <div className="px-2 sm:px-4 mt-4 pb-5">
          <svg viewBox="0 0 960 300" className="w-full" preserveAspectRatio="xMidYMid meet" style={{ height: 'clamp(220px, 30vw, 340px)' }}>
            <defs>
              <linearGradient id="salesFillPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D7B797" stopOpacity="0.30" />
                <stop offset="40%" stopColor="#D7B797" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#D7B797" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="targetFillPremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A9E6A" stopOpacity="0.12" />
                <stop offset="60%" stopColor="#2A9E6A" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#2A9E6A" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="salesLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#C4A07A" />
                <stop offset="50%" stopColor="#D7B797" />
                <stop offset="100%" stopColor="#E8CDB0" />
              </linearGradient>
              <filter id="glowSales" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowTarget" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="labelShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Y-axis labels + grid lines */}
            {[
              { y: 30, label: '2,5T' },
              { y: 80, label: '2,0T' },
              { y: 130, label: '1,5T' },
              { y: 180, label: '1,0T' },
              { y: 230, label: '0,5T' },
            ].map((tick) => (
              <g key={tick.y}>
                <text x="52" y={tick.y + 4} textAnchor="end" fontSize="10" fill={darkMode ? '#3A3A3A' : '#9CA3AF'} fontFamily="JetBrains Mono" fontWeight="500">{tick.label}</text>
                <line x1="64" y1={tick.y} x2="920" y2={tick.y} stroke={darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} strokeWidth="1" />
              </g>
            ))}

            {/* Area fill - target (behind) */}
            <path
              d="M92,238 L195,218 L299,202 L402,183 L506,170 L609,153 L713,140 L816,127 L920,112 L920,255 L92,255 Z"
              fill="url(#targetFillPremium)"
            />
            {/* Area fill - actual */}
            <path
              d="M92,225 L195,200 L299,175 L402,160 L506,135 L609,115 L713,90 L816,65 L920,42 L920,255 L92,255 Z"
              fill="url(#salesFillPremium)"
            />

            {/* Target line */}
            <polyline
              fill="none"
              stroke="#2A9E6A"
              strokeDasharray="8 5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="92,238 195,218 299,202 402,183 506,170 609,153 713,140 816,127 920,112"
              opacity="0.7"
            />
            {/* Actual line - with gradient */}
            <polyline
              fill="none"
              stroke="url(#salesLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="92,225 195,200 299,175 402,160 506,135 609,115 713,90 816,65 920,42"
              filter="url(#glowSales)"
            />

            {/* Target dots */}
            {[
              [92,238], [195,218], [299,202], [402,183], [506,170], [609,153], [713,140], [816,127], [920,112]
            ].map(([cx, cy], i) => (
              <circle key={`dot-t-${i}`} cx={cx} cy={cy} r="3" fill={darkMode ? '#0D0D0D' : '#ffffff'} stroke="#2A9E6A" strokeWidth="1.5" opacity="0.7" />
            ))}

            {/* Actual dots */}
            {[
              [92,225], [195,200], [299,175], [402,160], [506,135], [609,115], [713,90], [816,65], [920,42]
            ].map(([cx, cy], i) => (
              <g key={`dot-a-${i}`}>
                <circle cx={cx} cy={cy} r="6" fill={darkMode ? '#0D0D0D' : '#ffffff'} stroke="#D7B797" strokeWidth="2.5" />
                {i === 8 && (
                  <>
                    <circle cx={cx} cy={cy} r="10" fill="none" stroke="#D7B797" strokeWidth="1" opacity="0.3">
                      <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </g>
            ))}

            {/* Value labels on actual line */}
            {[
              { x: 92, y: 225, label: '0,8T' },
              { x: 195, y: 200, label: '0,9T' },
              { x: 299, y: 175, label: '1,2T' },
              { x: 402, y: 160, label: '1,3T' },
              { x: 506, y: 135, label: '1,5T' },
              { x: 609, y: 115, label: '1,7T' },
              { x: 713, y: 90, label: '1,9T' },
              { x: 816, y: 65, label: '2,1T' },
              { x: 920, y: 42, label: '2,3T' },
            ].map((p, i) => (
              <g key={`val-${i}`} filter="url(#labelShadow)">
                <rect x={p.x - 20} y={p.y - 24} width="40" height="17" rx="5"
                  fill={darkMode ? 'rgba(215,183,151,0.12)' : 'rgba(215,183,151,0.18)'}
                  stroke={darkMode ? 'rgba(215,183,151,0.15)' : 'rgba(215,183,151,0.25)'}
                  strokeWidth="0.5"
                />
                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="9.5" fill="#D7B797" fontFamily="JetBrains Mono" fontWeight="700">{p.label}</text>
              </g>
            ))}

            {/* X-axis month labels */}
            {[
              { x: 92, m: 'jan' }, { x: 195, m: 'feb' }, { x: 299, m: 'mar' },
              { x: 402, m: 'apr' }, { x: 506, m: 'may' }, { x: 609, m: 'jun' },
              { x: 713, m: 'jul' }, { x: 816, m: 'aug' }, { x: 920, m: 'sep' },
            ].map((tick) => (
              <text key={tick.m} x={tick.x} y={275} textAnchor="middle" fontSize="10" fill={darkMode ? '#3A3A3A' : '#9CA3AF'} fontFamily="Montserrat" fontWeight="600" letterSpacing="0.5">
                {t(`home.${tick.m}`)}
              </text>
            ))}

            {/* Best month highlight */}
            <line x1="816" y1="65" x2="816" y2="255" stroke="#D7B797" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
          </svg>
        </div>
      </div>

      {/* Active Alerts */}
      <div className={`border ${panelBg} rounded-xl p-5 transition-all duration-150 hover:border-[rgba(215,183,151,0.25)]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-[rgba(215,183,151,0.1)]'
            }`}>
              <Bell size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold font-['Montserrat'] ${textPrimary}`}>{t('home.activeAlerts')}</h3>
              <p className={`text-xs ${textMuted}`}>{t('home.activeAlertsCount', { count: 3 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-[rgba(248,81,73,0.15)] text-[#FF7B72] font-semibold font-['Montserrat']">1 {t('home.critical') || 'Critical'}</span>
            <span className="px-2 py-1 rounded-md bg-[rgba(210,153,34,0.15)] text-[#E3B341] font-semibold font-['Montserrat']">1 {t('home.warning') || 'Warning'}</span>
            <span className="px-2 py-1 rounded-md bg-[rgba(88,166,255,0.15)] text-[#79C0FF] font-semibold font-['Montserrat']">1 Info</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {/* Alert items */}
          {[
            {
              id: 'lowStock',
              icon: Bell,
              iconColor: 'text-[#F85149]',
              iconBg: 'bg-[rgba(248,81,73,0.2)]',
              borderColor: 'border-[rgba(248,81,73,0.3)]',
              borderHover: 'hover:border-[rgba(248,81,73,0.5)]',
              bgColor: 'bg-[rgba(248,81,73,0.08)]',
              accentColor: '#FF7B72',
              accentHover: '#F85149',
              title: t('home.lowStockAlert'),
              time: t('home.timeAgo15m'),
              message: t('home.lowStockMessage'),
              route: '/proposal',
              detailItems: [
                { label: 'SKU', value: 'Nike Air Max 90' },
                { label: 'Size', value: '42' },
                { label: t('home.currentStock') || 'Tồn kho hiện tại', value: '3 ' + (t('home.units') || 'đôi') },
                { label: t('home.minThreshold') || 'Ngưỡng tối thiểu', value: '10 ' + (t('home.units') || 'đôi') },
              ],
            },
            {
              id: 'budgetThreshold',
              icon: TrendingUp,
              iconColor: 'text-[#D29922]',
              iconBg: 'bg-[rgba(210,153,34,0.2)]',
              borderColor: 'border-[rgba(210,153,34,0.3)]',
              borderHover: 'hover:border-[rgba(210,153,34,0.5)]',
              bgColor: 'bg-[rgba(210,153,34,0.08)]',
              accentColor: '#E3B341',
              accentHover: '#D29922',
              title: t('home.budgetThresholdWarning'),
              time: t('home.timeAgo1h'),
              message: t('home.budgetThresholdMessage'),
              route: '/budget-management',
              detailItems: [
                { label: t('home.budgetName') || 'Ngân sách', value: 'Adidas SS25' },
                { label: t('home.used') || 'Đã sử dụng', value: '92%' },
                { label: t('home.remaining') || 'Còn lại', value: '800M đ' },
                { label: t('home.totalBudget') || 'Tổng ngân sách', value: '10T đ' },
              ],
            },
            {
              id: 'salesSpike',
              icon: BarChart3,
              iconColor: 'text-[#58A6FF]',
              iconBg: 'bg-[rgba(88,166,255,0.2)]',
              borderColor: 'border-[rgba(88,166,255,0.3)]',
              borderHover: 'hover:border-[rgba(88,166,255,0.5)]',
              bgColor: 'bg-[rgba(88,166,255,0.08)]',
              accentColor: '#79C0FF',
              accentHover: '#58A6FF',
              title: t('home.salesSpike'),
              time: t('home.timeAgo3h'),
              message: t('home.salesSpikeMessage'),
              route: '/otb-analysis',
              detailItems: [
                { label: t('home.collection') || 'Dòng sản phẩm', value: 'Gucci Heritage' },
                { label: t('home.overTarget') || 'Vượt kế hoạch', value: '+18%' },
                { label: t('home.period') || 'Thời gian', value: t('home.thisWeek') || 'Tuần này' },
                { label: t('home.action') || 'Hành động', value: t('home.checkInventory') || 'Kiểm tra tồn kho' },
              ],
            },
          ].map((alert) => {
            const AlertIcon = alert.icon;
            const isExpanded = expandedAlert === alert.id;
            return (
              <div key={alert.id} className={`border rounded-xl overflow-hidden transition-all duration-300 ${alert.borderColor} ${alert.bgColor} ${alert.borderHover}`}>
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${alert.iconBg}`}>
                      <AlertIcon size={16} className={alert.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${textPrimary}`}>{alert.title}</span>
                        <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>{alert.time}</span>
                      </div>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                        {alert.message}
                      </p>
                      <button
                        className="mt-2 text-xs font-semibold transition-colors flex items-center gap-1"
                        style={{ color: alert.accentColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = alert.accentHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = alert.accentColor)}
                      >
                        {t('common.viewDetails')}
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Detail Panel */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className={`px-4 pb-4 pt-0 border-t ${darkMode ? 'border-[rgba(255,255,255,0.06)]' : 'border-[rgba(0,0,0,0.06)]'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      {alert.detailItems.map((item, idx) => (
                        <div key={idx} className={`rounded-lg px-3 py-2 ${darkMode ? 'bg-[rgba(0,0,0,0.3)]' : 'bg-[rgba(255,255,255,0.6)]'}`}>
                          <p className={`text-[10px] font-medium uppercase tracking-wider ${textMuted} font-['Montserrat']`}>{item.label}</p>
                          <p className={`text-sm font-bold font-['JetBrains_Mono'] tabular-nums mt-0.5 ${textPrimary}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(alert.route); }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all duration-200"
                      style={{
                        backgroundColor: `${alert.accentColor}20`,
                        color: alert.accentColor,
                        border: `1px solid ${alert.accentColor}30`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${alert.accentColor}35`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${alert.accentColor}20`; }}
                    >
                      <ArrowUpRight size={14} />
                      {t('home.goToPage') || 'Đi đến trang chi tiết'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Detail Modal */}
      {expandedCard && (
        <KPIDetailModal
          isOpen={!!expandedCard}
          onClose={() => setExpandedCard(null)}
          cardKey={expandedCard.key}
          title={expandedCard.title}
          icon={(CARD_CONFIG as any)[expandedCard.key]?.icon}
          accent={(CARD_CONFIG as any)[expandedCard.key]?.accent}
          darkMode={darkMode}
          currentValue={expandedCard.value}
          trend={expandedCard.trend}
          trendLabel={expandedCard.trendLabel}
          subtitle={expandedCard.subtitle}
        />
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={mobileFilterOpen}
        onClose={closeMobileFilter}
        filters={[
          {
            key: 'season',
            label: t('home.season'),
            icon: '📅',
            type: 'single',
            options: SEASON_OPTIONS.map(s => ({ value: s, label: s })),
          },
          {
            key: 'brand',
            label: t('home.brand'),
            icon: '🏷️',
            type: 'single',
            options: [{ value: 'all', label: t('home.allBrands') }, ...brandOptions.map(b => ({ value: b, label: b }))],
          },
          {
            key: 'region',
            label: t('home.region'),
            icon: '🌍',
            type: 'single',
            options: REGION_OPTIONS.map(r => ({ value: r, label: r })),
          },
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => {
          setMobileFilterValues(prev => ({ ...prev, [key]: value }));
          if (key === 'season') setSelectedSeason(String(value) || 'SS25');
          if (key === 'brand') setSelectedBrand(String(value) || 'all');
          if (key === 'region') setSelectedRegion(String(value) || 'Vietnam');
        }}
        onApply={closeMobileFilter}
        onReset={() => {
          setMobileFilterValues({});
          setSelectedSeason('SS25');
          setSelectedBrand('all');
          setSelectedRegion('Vietnam');
        }}
      />
    </div>
  );
};

export default HomeScreen;
