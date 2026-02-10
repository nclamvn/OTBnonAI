'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight,
  Building2, Package, FolderTree, Tag,
  RefreshCw, Filter, X
} from 'lucide-react';
import { masterDataService } from '../services';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '../utils';

// Config per master data type (takes t for i18n)
const getTypeConfig = (t) => ({
  brands: {
    title: t('masterData.titleBrands'),
    icon: Building2,
    fetchFn: () => masterDataService.getBrands(),
    columns: [
      { key: 'code', label: t('masterData.colCode'), width: '120px', mono: true },
      { key: 'name', label: t('masterData.colBrandName') },
      { key: 'groupBrand', label: t('masterData.colGroup'), render: (v) => v?.name || v || '-' },
      { key: 'isActive', label: t('masterData.colStatus'), render: (v) => v !== false ? t('common.active') : t('common.inactive'), badge: true },
    ],
    searchFields: ['code', 'name'],
  },
  skus: {
    title: t('masterData.titleSkuCatalog'),
    icon: Package,
    fetchFn: () => masterDataService.getSkuCatalog(),
    columns: [
      { key: 'skuCode', label: t('masterData.colSkuCode'), width: '140px', mono: true },
      { key: 'productName', label: t('masterData.colProductName') },
      { key: 'productType', label: t('masterData.colCategory'), width: '150px' },
      { key: 'color', label: t('masterData.colColor'), width: '120px' },
      { key: 'theme', label: t('masterData.colTheme'), width: '120px' },
      { key: 'srp', label: t('masterData.colSRP'), width: '120px', render: (v) => v ? formatCurrency(v) : '-', mono: true },
    ],
    searchFields: ['skuCode', 'productName', 'color'],
  },
  categories: {
    title: t('masterData.titleCategories'),
    icon: FolderTree,
    fetchFn: () => masterDataService.getCategories(),
    columns: [
      { key: 'code', label: t('masterData.colCode'), width: '120px', mono: true },
      { key: 'name', label: t('masterData.colCategoryName') },
      { key: 'gender', label: t('masterData.colGender'), render: (v) => v?.name || v || '-' },
      { key: 'subCategories', label: t('masterData.colSubCategories'), render: (v) => Array.isArray(v) ? t('masterData.items', { count: v.length }) : '-' },
      { key: 'isActive', label: t('masterData.colStatus'), render: (v) => v !== false ? t('common.active') : t('common.inactive'), badge: true },
    ],
    searchFields: ['code', 'name'],
  },
  subcategories: {
    title: t('masterData.titleSubCategories'),
    icon: Tag,
    fetchFn: () => masterDataService.getSubCategories(),
    columns: [
      { key: 'code', label: t('masterData.colCode'), width: '120px', mono: true },
      { key: 'name', label: t('masterData.colSubCategoryName') },
      { key: 'parent', label: t('masterData.colParentCategory'), render: (v) => v?.name || '-' },
      { key: 'isActive', label: t('masterData.colStatus'), render: (v) => v !== false ? t('common.active') : t('common.inactive'), badge: true },
    ],
    searchFields: ['code', 'name'],
  },
});

const MasterDataScreen = ({ type = 'brands', darkMode = false }) => {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const TYPE_CONFIG = useMemo(() => getTypeConfig(t), [t]);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.brands;
  const Icon = config.icon;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await config.fetchFn();
      const list = Array.isArray(result) ? result : (result?.data || []);
      setData(list);
    } catch (err) {
      console.error('Master data fetch error:', err);
      setError(t('masterData.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchData();
  }, [fetchData]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      config.searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, config.searchFields]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const renderBadge = (value) => {
    const isActive = value === 'Active';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? darkMode ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]' : 'bg-[rgba(18,119,73,0.1)] text-[#127749]'
          : darkMode ? 'bg-[rgba(248,81,73,0.1)] text-[#FF7B72]' : 'bg-red-50 text-red-600'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-[#2A9E6A]' : 'bg-red-400'}`} />
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header + Search - Merged compact */}
      <div className={`rounded-lg border overflow-hidden ${
        darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'
      }`} style={{
        background: darkMode
          ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.03) 40%, rgba(215,183,151,0.10) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.05) 35%, rgba(215,183,151,0.14) 100%)',
        boxShadow: `inset 0 -1px 0 ${darkMode ? 'rgba(215,183,151,0.06)' : 'rgba(215,183,151,0.08)'}`,
      }}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
              background: darkMode
                ? 'linear-gradient(135deg, rgba(215,183,151,0.10) 0%, rgba(215,183,151,0.20) 100%)'
                : 'linear-gradient(135deg, rgba(160,120,75,0.12) 0%, rgba(160,120,75,0.22) 100%)',
            }}>
              <Icon size={14} className={darkMode ? 'text-[#D7B797]' : 'text-[#8A6340]'} style={darkMode ? { filter: 'drop-shadow(0 0 3px rgba(215,183,151,0.4))' } : undefined} />
            </div>
            <div>
              <h1 className={`text-sm font-bold font-['Montserrat'] leading-tight ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                {config.title}
              </h1>
              <p className={`text-[10px] font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                {loading ? t('common.loading') : t('masterData.records', { count: filteredData.length })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Inline Search */}
            <div className="relative">
              <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-[#555555]' : 'text-[#999999]'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={`${t('masterData.search')} ${config.title.toLowerCase()}...`}
                className={`w-56 pl-8 pr-7 py-1 border rounded-md text-xs font-['Montserrat'] transition-all focus:outline-none focus:ring-1 focus:ring-[#D7B797] ${
                  darkMode
                    ? 'bg-[#0A0A0A] border-[#1A1A1A] text-[#F2F2F2] placeholder-[#444444]'
                    : 'bg-white border-[#C4B5A5] text-[#0A0A0A] placeholder-[#999999]'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${darkMode ? 'text-[#555555] hover:text-[#999999]' : 'text-[#999999] hover:text-[#666666]'}`}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs font-['Montserrat'] transition-all ${
                darkMode
                  ? 'text-[#888888] hover:text-[#D7B797] hover:bg-[rgba(215,183,151,0.06)] border border-[#1A1A1A]'
                  : 'text-[#666666] hover:text-[#8A6340] hover:bg-[rgba(160,120,75,0.12)] border border-[#C4B5A5]'
              }`}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {t('masterData.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={`rounded-lg border overflow-hidden ${
        darkMode ? 'border-[#2E2E2E]' : 'border-[#C4B5A5]'
      }`} style={{
        background: darkMode
          ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.02) 40%, rgba(215,183,151,0.06) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.03) 35%, rgba(215,183,151,0.08) 100%)',
      }}>
        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw size={24} className={`animate-spin mx-auto mb-3 ${darkMode ? 'text-[#D7B797]' : 'text-[#8A6340]'}`} />
            <p className={`text-xs font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{t('masterData.loadingData')}</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-red-400 mb-3 text-xs font-['Montserrat']">{error}</p>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-[#D7B797] text-[#0A0A0A] rounded-md font-medium text-xs font-['Montserrat'] hover:bg-[#C4A480] transition-colors"
            >
              {t('masterData.tryAgain')}
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-10 text-center">
            <Icon size={32} className={`mx-auto mb-3 ${darkMode ? 'text-[#2E2E2E]' : 'text-[#2E2E2E]/30'}`} />
            <p className={`text-xs font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
              {searchTerm ? t('masterData.noResultsFound') : t('masterData.noDataAvailable')}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={darkMode ? 'bg-[#0A0A0A]' : 'bg-[rgba(160,120,75,0.08)]'}>
                    <th className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] w-10 ${
                      darkMode ? 'text-[#666666]' : 'text-[#999999]'
                    }`}>
                      #
                    </th>
                    {config.columns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${
                          darkMode ? 'text-[#666666]' : 'text-[#999999]'
                        }`}
                        style={{ width: col.width }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className={`border-t transition-colors ${
                        darkMode
                          ? 'border-[#1A1A1A] hover:bg-[rgba(215,183,151,0.03)]'
                          : 'border-[#D4C8BB] hover:bg-[rgba(215,183,151,0.05)]'
                      }`}
                    >
                      <td className={`px-3 py-1.5 text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#444444]' : 'text-[#BBBBBB]'}`}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      {config.columns.map((col) => {
                        const rawValue = item[col.key];
                        const displayValue = col.render ? col.render(rawValue, item) : (rawValue || '-');

                        return (
                          <td
                            key={col.key}
                            className={`px-3 py-1.5 text-xs ${
                              col.mono ? "font-['JetBrains_Mono']" : "font-['Montserrat']"
                            } ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}
                          >
                            {col.badge ? renderBadge(displayValue) : displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between px-3 py-1.5 border-t ${
                darkMode ? 'border-[#1A1A1A]' : 'border-[#D4C8BB]'
              }`}>
                <p className={`text-[10px] font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode ? 'hover:bg-[rgba(215,183,151,0.06)] text-[#888888]' : 'hover:bg-[rgba(160,120,75,0.12)] text-[#666666]'
                    }`}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className={`px-2 py-0.5 text-[10px] font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      darkMode ? 'hover:bg-[rgba(215,183,151,0.06)] text-[#888888]' : 'hover:bg-[rgba(160,120,75,0.12)] text-[#666666]'
                    }`}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MasterDataScreen;
