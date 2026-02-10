'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ROUTE_MAP } from '@/utils/routeMap';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Wallet,
  DollarSign,
  BarChart3,
  Package,
  FileText,
  Ticket,
  FileCheck,
  ShoppingCart,
  Receipt,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Home,
  Search,
  Command,
  User,
  Settings,
  Save,
  ChevronDown,
  Layers,
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';

// Screen configuration builder (uses t() for translations)
const getScreenConfig = (t) => ({
  'home': {
    label: t('screenConfig.dashboard'),
    shortLabel: 'Home',
    icon: Home,
    step: null,
    kpiLabel: t('header.kpiOverview'),
    kpiDescription: t('header.kpiSystemOverview')
  },
  'budget-management': {
    label: t('screenConfig.budgetManagement'),
    shortLabel: t('budget.title'),
    icon: Wallet,
    step: 1,
    kpiLabel: t('header.kpiBudgets'),
    kpiDescription: t('header.kpiBudgetsDesc')
  },
  'planning': {
    label: t('screenConfig.budgetAllocation'),
    shortLabel: t('header.kpiAllocated'),
    icon: DollarSign,
    step: 2,
    kpiLabel: t('header.kpiAllocated'),
    kpiDescription: t('header.kpiAllocatedDesc')
  },
  'otb-analysis': {
    label: t('screenConfig.otbAnalysis'),
    shortLabel: 'OTB',
    icon: BarChart3,
    step: 3,
    kpiLabel: t('header.kpiAnalyzed'),
    kpiDescription: t('header.kpiAnalyzedDesc')
  },
  'proposal': {
    label: t('screenConfig.skuProposal'),
    shortLabel: 'SKU',
    icon: Package,
    step: 4,
    kpiLabel: t('header.kpiSKUs'),
    kpiDescription: t('header.kpiSKUsDesc')
  },
  'dev-ticket': {
    label: t('screenConfig.devTicket'),
    shortLabel: 'Dev',
    icon: FileText,
    step: null,
    kpiLabel: t('header.kpiPages'),
    kpiDescription: t('header.kpiDocumentation')
  },
  'tickets': {
    label: t('screenConfig.tickets'),
    shortLabel: t('screenConfig.tickets'),
    icon: Ticket,
    step: 5,
    kpiLabel: t('header.kpiTicket'),
    kpiDescription: t('header.kpiTicketsPending')
  },
  'ticket-detail': {
    label: t('screenConfig.ticketDetail'),
    shortLabel: t('screenConfig.ticketDetail'),
    icon: Ticket,
    step: null,
    kpiLabel: t('header.kpiPending'),
    kpiDescription: t('header.kpiTicketsPending')
  },
  'approvals': {
    label: t('screenConfig.approvals'),
    shortLabel: t('screenConfig.approvals'),
    icon: FileCheck,
    step: null,
    kpiLabel: t('header.kpiPending'),
    kpiDescription: t('header.kpiAwaitingApproval')
  },
  'order-confirmation': {
    label: t('screenConfig.orderConfirmation'),
    shortLabel: t('header.kpiOrders'),
    icon: ShoppingCart,
    step: null,
    kpiLabel: t('header.kpiOrders'),
    kpiDescription: t('header.kpiOrdersConfirm')
  },
  'receipt-confirmation': {
    label: t('screenConfig.receiptConfirmation'),
    shortLabel: t('header.kpiReceipts'),
    icon: Receipt,
    step: null,
    kpiLabel: t('header.kpiReceipts'),
    kpiDescription: t('header.kpiReceiptsConfirm')
  },
  'profile': {
    label: t('screenConfig.myProfile'),
    shortLabel: t('header.kpiProfile'),
    icon: User,
    step: null,
    kpiLabel: t('header.kpiProfile'),
    kpiDescription: t('header.kpiUserProfile')
  },
  'settings': {
    label: t('screenConfig.settings'),
    shortLabel: t('header.kpiSettings'),
    icon: Settings,
    step: null,
    kpiLabel: t('header.kpiSettings'),
    kpiDescription: t('header.kpiAppSettings')
  },
  'analytics-sales': {
    label: t('analytics.salesPerformance', 'Sales Performance'),
    shortLabel: 'Sales',
    icon: LineChart,
    step: null,
    kpiLabel: t('analytics.salesPerformance', 'Sales'),
    kpiDescription: t('analytics.salesDesc', 'SKU performance analysis')
  },
  'analytics-budget': {
    label: t('analytics.budgetAnalytics', 'Budget Analytics'),
    shortLabel: 'Budget',
    icon: PieChart,
    step: null,
    kpiLabel: t('analytics.budgetAnalytics', 'Budget'),
    kpiDescription: t('analytics.budgetDesc', 'Budget utilization trends')
  },
  'analytics-trends': {
    label: t('analytics.categoryTrends', 'Category Trends'),
    shortLabel: 'Trends',
    icon: Activity,
    step: null,
    kpiLabel: t('analytics.categoryTrends', 'Trends'),
    kpiDescription: t('analytics.trendsDesc', 'Attribute trends and YoY comparison')
  }
});

// Planning workflow steps
const PLANNING_STEPS = [
  { id: 'budget-management', step: 1 },
  { id: 'planning', step: 2 },
  { id: 'otb-analysis', step: 3 },
  { id: 'proposal', step: 4 },
  { id: 'tickets', step: 5 }
];

const AppHeader = ({
  currentScreen,
  darkMode = true,
  setDarkMode,
  kpiData = {}
}) => {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const SCREEN_CONFIG = useMemo(() => getScreenConfig(t), [t]);
  const onNavigate = (screenId) => {
    const route = ROUTE_MAP[screenId];
    if (route) {
      router.push(route);
    }
  };
  const currentConfig = SCREEN_CONFIG[currentScreen] || SCREEN_CONFIG['home'];
  const CurrentIcon = currentConfig.icon || Home;

  const [showNotifications, setShowNotifications] = useState(false);
  const [openSaveMenu, setOpenSaveMenu] = useState(false);
  const saveButtonRef = useRef(null);
  const [saveMenuPosition, setSaveMenuPosition] = useState({ top: 0, right: 0 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  // Search results from screen config
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return Object.entries(SCREEN_CONFIG)
      .filter(([id, cfg]) => {
        const label = (cfg.label || '').toLowerCase();
        const shortLabel = (cfg.shortLabel || '').toLowerCase();
        return label.includes(q) || shortLabel.includes(q) || id.includes(q);
      })
      .map(([id, cfg]) => ({ id, ...cfg }))
      .slice(0, 8);
  }, [searchQuery, SCREEN_CONFIG]);

  const isInPlanningWorkflow = PLANNING_STEPS.some(s => s.id === currentScreen);
  const currentStepIndex = PLANNING_STEPS.findIndex(s => s.id === currentScreen);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
        setSearchQuery('');
      }
      if (saveButtonRef.current && !saveButtonRef.current.contains(event.target)) {
        setOpenSaveMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
        setShowNotifications(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="sticky top-0 z-40" style={{
      background: darkMode
        ? 'linear-gradient(180deg, #0A0A0A 0%, rgba(13,11,9,1) 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #fdfbf9 100%)',
    }}>
      {/* Main Header */}
      <div className="h-11 px-4 flex items-center justify-between" style={{
        borderBottom: `1px solid ${darkMode ? '#1A1A1A' : '#D1D5DB'}`,
        background: darkMode
          ? 'linear-gradient(135deg, #0A0A0A 0%, rgba(215,183,151,0.02) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.04) 100%)',
      }}>
        {/* Left - Page Title */}
        <div className="flex items-center gap-2.5">
          {/* Icon with gradient background */}
          <div className="relative">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
              style={{
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(215,183,151,0.10) 0%, rgba(215,183,151,0.20) 100%)'
                  : 'linear-gradient(135deg, rgba(215,183,151,0.12) 0%, rgba(215,183,151,0.22) 100%)',
                border: `1px solid ${darkMode ? 'rgba(215,183,151,0.15)' : 'rgba(215,183,151,0.25)'}`,
                boxShadow: darkMode ? '0 0 8px rgba(215,183,151,0.08)' : 'none',
              }}
            >
              <CurrentIcon size={14} strokeWidth={2} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} style={{ filter: darkMode ? 'drop-shadow(0 0 3px rgba(215,183,151,0.4))' : 'none' }} />
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#2A9E6A]"
              style={{
                border: `1.5px solid ${darkMode ? '#0A0A0A' : '#ffffff'}`,
                boxShadow: '0 0 4px rgba(42,158,106,0.5)',
              }}
            />
          </div>

          {/* Title & Breadcrumb */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`text-sm font-semibold font-['Montserrat'] tracking-tight ${
                darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
              }`}>
                {currentConfig.label || 'Dashboard'}
              </h1>
              {currentConfig.step && (
                <span className={`px-1.5 py-px rounded text-[9px] font-medium font-['JetBrains_Mono'] uppercase tracking-wider ${
                  darkMode
                    ? 'bg-[rgba(215,183,151,0.12)] text-[#D7B797] border border-[rgba(215,183,151,0.15)]'
                    : 'bg-[rgba(215,183,151,0.15)] text-[#6B4D30] border border-[rgba(215,183,151,0.25)]'
                }`}>
                  {t('common.step')} {currentConfig.step}
                </span>
              )}
            </div>
            {currentConfig.step && (
              <div className="flex items-center gap-1">
                <span className={`text-[10px] ${darkMode ? 'text-[#555555]' : 'text-gray-600'}`}>{t('header.planningBreadcrumb')}</span>
                <ChevronRight size={10} className={darkMode ? 'text-[#333333]' : 'text-gray-300'} />
                <span className={`text-[10px] font-medium ${darkMode ? 'text-[#888888]' : 'text-gray-600'}`}>
                  {currentConfig.shortLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-0.5">
          {/* Search Button */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all duration-200 ${
                darkMode
                  ? 'border-[#1A1A1A] hover:border-[rgba(215,183,151,0.2)] hover:bg-[rgba(160,120,75,0.06)]'
                  : 'border-gray-300 hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.06)]'
              }`}
            >
              <Search size={13} className={darkMode ? 'text-[#555555]' : 'text-gray-600'} />
              <span className={`text-[11px] hidden sm:block ${darkMode ? 'text-[#555555]' : 'text-gray-600'}`}>
                {t('header.searchPlaceholder')}
              </span>
              <kbd className={`hidden sm:flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-['JetBrains_Mono'] ${
                darkMode
                  ? 'bg-[#0A0A0A] text-[#444444] border border-[#1A1A1A]'
                  : 'bg-gray-100 text-gray-500 border border-gray-300'
              }`}>
                <Command size={8} />K
              </kbd>
            </button>

            {/* Search Modal */}
            {showSearch && (
              <div className={`absolute right-0 top-full mt-2 w-96 rounded-xl shadow-2xl border overflow-hidden z-[9999] ${
                darkMode
                  ? 'bg-[#121212] border-[#2E2E2E]'
                  : 'bg-white border-gray-300'
              }`}>
                <div className={`p-3 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <Search size={18} className={darkMode ? 'text-[#666666]' : 'text-gray-600'} />
                    <input
                      type="text"
                      placeholder={t('header.searchScreens')}
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchResults.length > 0) {
                          onNavigate(searchResults[0].id);
                          setShowSearch(false);
                          setSearchQuery('');
                        }
                      }}
                      className={`flex-1 bg-transparent text-sm outline-none ${
                        darkMode ? 'text-[#F2F2F2] placeholder:text-[#666666]' : 'text-gray-900 placeholder:text-gray-500'
                      }`}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className={`p-0.5 rounded ${darkMode ? 'text-[#666666] hover:text-[#999999]' : 'text-gray-500 hover:text-gray-700'}`}>
                        <span className="text-xs">{t('common.clearAll') || 'Clear'}</span>
                      </button>
                    )}
                  </div>
                </div>
                {/* Search Results */}
                {searchQuery.trim() && searchResults.length > 0 ? (
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {searchResults.map((result) => {
                      const ResultIcon = result.icon || Home;
                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            onNavigate(result.id);
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            darkMode
                              ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]'
                              : 'hover:bg-gray-50 text-gray-900'
                          }`}
                        >
                          <ResultIcon size={16} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-medium font-['Montserrat']`}>{result.label}</div>
                            {result.step && (
                              <div className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>Step {result.step}</div>
                            )}
                          </div>
                          <ChevronRight size={14} className={darkMode ? 'text-[#444444]' : 'text-gray-300'} />
                        </button>
                      );
                    })}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className={`px-4 py-6 text-center text-sm ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>
                    {t('common.noResults') || 'No results found'}
                  </div>
                ) : (
                  <div className={`p-2 text-center text-xs ${darkMode ? 'text-[#666666]' : 'text-gray-600'}`}>
                    {t('header.typeToSearch')} <kbd className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#1A1A1A] text-[#999999]' : 'bg-gray-100 text-gray-600'}`}>ESC</kbd> {t('header.toClose')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-4 mx-1" style={{
            background: darkMode
              ? 'linear-gradient(180deg, transparent 0%, rgba(215,183,151,0.15) 50%, transparent 100%)'
              : 'linear-gradient(180deg, transparent 0%, rgba(215,183,151,0.25) 50%, transparent 100%)',
          }} />

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className={`relative p-1.5 rounded-md transition-all duration-200 group ${
              darkMode
                ? 'hover:bg-[rgba(215,183,151,0.06)]'
                : 'hover:bg-[rgba(160,120,75,0.08)]'
            }`}
            title={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
          >
            <span className={`text-[11px] font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
              {language === 'en' ? 'EN' : 'VN'}
            </span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode && setDarkMode(!darkMode)}
            className={`relative p-1.5 rounded-md transition-all duration-200 group ${
              darkMode
                ? 'hover:bg-[rgba(215,183,151,0.06)]'
                : 'hover:bg-[rgba(160,120,75,0.08)]'
            }`}
            title={darkMode ? t('header.darkModeTitle') : t('header.lightModeTitle')}
          >
            {darkMode ? (
              <Moon size={15} strokeWidth={2} className="text-[#D7B797] transition-transform group-hover:-rotate-12" style={{ filter: 'drop-shadow(0 0 3px rgba(215,183,151,0.3))' }} />
            ) : (
              <Sun size={15} strokeWidth={2} className="text-[#6B4D30] transition-transform group-hover:rotate-45" />
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-1.5 rounded-md transition-all duration-200 ${
                showNotifications
                  ? darkMode
                    ? 'bg-[rgba(215,183,151,0.10)]'
                    : 'bg-[rgba(215,183,151,0.12)]'
                  : darkMode
                    ? 'hover:bg-[rgba(215,183,151,0.06)]'
                    : 'hover:bg-[rgba(160,120,75,0.08)]'
              }`}
            >
              <Bell size={15} strokeWidth={2} className={
                showNotifications
                  ? 'text-[#D7B797]'
                  : darkMode ? 'text-[#888888]' : 'text-gray-600'
              } style={showNotifications ? { filter: 'drop-shadow(0 0 3px rgba(215,183,151,0.4))' } : undefined} />

            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 ${
                darkMode
                  ? 'bg-[#121212] border-[#2E2E2E]'
                  : 'bg-white border-gray-300'
              }`}>
                {/* Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${
                  darkMode ? 'border-[#2E2E2E] bg-[#0A0A0A]' : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <Bell size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
                    <h3 className={`text-sm font-semibold font-['Montserrat'] ${
                      darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
                    }`}>
                      {t('header.notifications') || 'Notifications'}
                    </h3>
                  </div>
                </div>

                {/* Empty State */}
                <div className="max-h-80 overflow-y-auto">
                  <div className={`px-4 py-8 text-center text-sm ${darkMode ? 'text-[#666666]' : 'text-gray-500'}`}>
                    {t('header.noAlerts')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Tracking Bar - Only show for Planning workflow */}
      {currentScreen !== 'budget-management' && isInPlanningWorkflow && (
        <div className="px-4 py-1.5" style={{
          borderBottom: `1px solid ${darkMode ? '#1A1A1A' : '#D1D5DB'}`,
          background: darkMode
            ? 'linear-gradient(90deg, #0A0A0A 0%, rgba(215,183,151,0.02) 50%, #0A0A0A 100%)'
            : 'linear-gradient(90deg, #FAFAFA 0%, #ffffff 50%, #FAFAFA 100%)',
        }}>
          <div className="flex items-center gap-3">
            {/* Step Progress */}
            <div className="flex items-center gap-1">
              {PLANNING_STEPS.map((step, index) => {
                const config = SCREEN_CONFIG[step.id];
                const Icon = config.icon;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const kpi = kpiData[step.id] || { value: 0, status: 'pending' };

                return (
                  <React.Fragment key={step.id}>
                    {index > 0 && (
                      <div className={`w-4 h-[1.5px] rounded-full transition-all duration-300`} style={{
                        background: isCompleted
                          ? 'linear-gradient(90deg, #127749, #2A9E6A)'
                          : darkMode ? '#1A1A1A' : '#D1D5DB',
                      }} />
                    )}
                    <button
                      onClick={() => onNavigate(step.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200"
                      style={{
                        background: isCurrent
                          ? 'linear-gradient(135deg, rgba(215,183,151,0.08) 0%, rgba(215,183,151,0.16) 100%)'
                          : isCompleted
                            ? 'linear-gradient(135deg, rgba(18,119,73,0.06) 0%, rgba(18,119,73,0.12) 100%)'
                            : 'transparent',
                        border: `1px solid ${
                          isCurrent ? 'rgba(215,183,151,0.2)' : isCompleted ? 'rgba(18,119,73,0.2)' : 'transparent'
                        }`,
                      }}
                    >
                      <div className={`p-0.5 rounded ${
                        isCurrent ? 'bg-[#D7B797]' : isCompleted ? 'bg-[#127749]' : darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-200'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle size={10} className="text-white" strokeWidth={2.5} />
                        ) : (
                          <Icon size={10} className={isCurrent ? 'text-[#0A0A0A]' : darkMode ? 'text-[#555555]' : 'text-gray-600'} strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="text-left">
                        <div className={`text-[11px] font-semibold font-['Montserrat'] leading-tight ${
                          isCurrent ? (darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]') : isCompleted ? 'text-[#2A9E6A]' : darkMode ? 'text-[#888888]' : 'text-gray-600'
                        }`}>
                          {config.shortLabel}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {kpi.status === 'completed' ? (
                            <CheckCircle size={7} className="text-[#2A9E6A]" />
                          ) : kpi.status === 'in-progress' ? (
                            <Clock size={7} className="text-[#E3B341]" />
                          ) : (
                            <Target size={7} className={darkMode ? 'text-[#444444]' : 'text-gray-500'} />
                          )}
                          <span className={`text-[8px] font-['JetBrains_Mono'] ${darkMode ? 'text-[#555555]' : 'text-gray-600'}`}>
                            {kpi.value} {config.kpiLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Save Button - hidden on Tickets pages */}
            {currentScreen !== 'tickets' && currentScreen !== 'ticket-detail' && (
            <div className="ml-auto relative" ref={saveButtonRef}>
              <div className="inline-flex rounded-lg" style={{
                boxShadow: '0 2px 8px rgba(215,183,151,0.2)',
              }}>
                <button
                  onClick={() => console.log('Save')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium font-['Montserrat'] rounded-l-lg transition-colors bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A684]"
                >
                  <Save size={12} />
                  {t('header.save')}
                </button>
                <button
                  onClick={() => {
                    if (!openSaveMenu && saveButtonRef.current) {
                      const rect = saveButtonRef.current.getBoundingClientRect();
                      setSaveMenuPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                    }
                    setOpenSaveMenu(!openSaveMenu);
                  }}
                  className="px-2 py-1 rounded-r-lg border-l border-[rgba(26,26,26,0.2)] transition-colors bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A684]"
                >
                  <ChevronDown size={12} className={`transition-transform ${openSaveMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Save Dropdown Menu - Portal to body */}
      {openSaveMenu && createPortal(
        <div
          className={`fixed w-56 border rounded-xl shadow-2xl overflow-hidden ${
            darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
          }`}
          style={{
            top: saveMenuPosition.top,
            right: saveMenuPosition.right,
            zIndex: 99999
          }}
        >
          <button
            onClick={() => {
              console.log('Save');
              setOpenSaveMenu(false);
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-medium transition-colors ${
              darkMode
                ? 'hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]'
                : 'hover:bg-[rgba(215,183,151,0.15)] text-[#0A0A0A]'
            }`}
          >
            <Save size={14} className="shrink-0" />
            {t('header.save')}
          </button>
          <button
            onClick={() => {
              console.log('Save As New Version');
              setOpenSaveMenu(false);
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-medium border-t transition-colors ${
              darkMode
                ? 'border-[#2E2E2E] hover:bg-[rgba(215,183,151,0.08)] text-[#F2F2F2]'
                : 'border-[#C4B5A5] hover:bg-[rgba(215,183,151,0.15)] text-[#0A0A0A]'
            }`}
          >
            <Layers size={14} className="shrink-0" />
            {t('header.saveAsNewVersion')}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AppHeader;
