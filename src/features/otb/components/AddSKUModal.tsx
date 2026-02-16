'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductImage } from '@/components/ui';

interface AddSKUModalProps {
  isOpen: boolean;
  onClose: () => void;
  skuCatalog: any[];
  blockGender?: string;
  blockCategory?: string;
  blockSubCategory?: string;
  existingSkus: string[];
  onAddSkus: (skus: any[]) => void;
  darkMode?: boolean;
}

const AddSKUModal = ({
  isOpen,
  onClose,
  skuCatalog,
  blockGender = '',
  blockCategory = '',
  blockSubCategory = '',
  existingSkus,
  onAddSkus,
  darkMode = false,
}: AddSKUModalProps) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

  // Pre-filter catalog by block's gender/category/subCategory, then by search
  const filteredCatalog = useMemo(() => {
    let items = skuCatalog;

    // Pre-filter by block context
    if (blockSubCategory) {
      items = items.filter((s: any) =>
        (s.productType || '').toLowerCase() === blockSubCategory.toLowerCase() ||
        (s.division || '').toLowerCase() === blockSubCategory.toLowerCase()
      );
    } else if (blockCategory) {
      items = items.filter((s: any) =>
        (s.division || '').toLowerCase() === blockCategory.toLowerCase() ||
        (s.productType || '').toLowerCase().includes(blockCategory.toLowerCase())
      );
    }

    // Exclude already-added SKUs
    items = items.filter((s: any) => !existingSkus.includes(s.sku));

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((s: any) =>
        (s.sku || '').toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.color || '').toLowerCase().includes(q) ||
        (s.theme || '').toLowerCase().includes(q)
      );
    }

    return items;
  }, [skuCatalog, blockGender, blockCategory, blockSubCategory, existingSkus, searchQuery]);

  const toggleSku = (sku: string) => {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const handleAdd = () => {
    const skusToAdd = skuCatalog.filter((s: any) => selectedSkus.has(s.sku));
    onAddSkus(skusToAdd);
    setSelectedSkus(new Set());
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-lg mx-4 max-h-[80vh] flex flex-col rounded-xl border shadow-2xl ${
          darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[#C4B5A5]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          darkMode ? 'border-[#2E2E2E]' : 'border-[rgba(215,183,151,0.3)]'
        }`}>
          <div>
            <h3 className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#0A0A0A]'}`}>
              {t('proposal.addSku')}
            </h3>
            {blockSubCategory && (
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
                {blockGender} &bull; {blockCategory} &bull; {blockSubCategory}
              </p>
            )}
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-[#2E2E2E] text-[#999]' : 'hover:bg-gray-100 text-[#666]'
          }`}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className={`px-4 py-2 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[rgba(215,183,151,0.2)]'}`}>
          <div className="relative">
            <Search size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-[#666]' : 'text-[#999]'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search') + '...'}
              className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D7B797] ${
                darkMode
                  ? 'border-[#2E2E2E] bg-[#121212] text-[#F2F2F2] placeholder-[#666]'
                  : 'border-[#C4B5A5] bg-white text-[#0A0A0A] placeholder-[#999]'
              }`}
              autoFocus
            />
          </div>
        </div>

        {/* SKU List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
          {filteredCatalog.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-[#666]' : 'text-[#999]'}`}>
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">{t('common.noResults')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCatalog.map((sku: any) => {
                const isSelected = selectedSkus.has(sku.sku);
                return (
                  <button
                    key={sku.sku}
                    type="button"
                    onClick={() => toggleSku(sku.sku)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? darkMode
                          ? 'bg-[rgba(42,158,106,0.15)] border border-[#2A9E6A]/30'
                          : 'bg-[rgba(18,119,73,0.08)] border border-[#127749]/20'
                        : darkMode
                          ? 'hover:bg-[rgba(215,183,151,0.06)] border border-transparent'
                          : 'hover:bg-[rgba(215,183,151,0.08)] border border-transparent'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#2A9E6A] border-[#2A9E6A]'
                        : darkMode
                          ? 'border-[#555] bg-transparent'
                          : 'border-[#C4B5A5] bg-transparent'
                    }`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>

                    {/* Product Image */}
                    <ProductImage subCategory={sku.productType || blockSubCategory} sku={sku.sku} size={40} darkMode={darkMode} rounded="rounded-lg" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold truncate ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333]'}`}>
                        <span className="font-['JetBrains_Mono']">{sku.sku}</span>
                        <span className={`mx-1.5 ${darkMode ? 'text-[#555]' : 'text-[#C4B5A5]'}`}>&bull;</span>
                        {sku.name || 'Unnamed'}
                      </div>
                      <div className={`text-[10px] ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
                        {[sku.color, sku.theme, sku.productType].filter(Boolean).join(' • ')}
                      </div>
                    </div>

                    {/* SRP */}
                    {sku.srp > 0 && (
                      <span className={`text-[10px] font-['JetBrains_Mono'] shrink-0 ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                        {sku.srp.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-4 py-3 border-t ${
          darkMode ? 'border-[#2E2E2E]' : 'border-[rgba(215,183,151,0.3)]'
        }`}>
          <span className={`text-xs ${darkMode ? 'text-[#999]' : 'text-[#666]'}`}>
            {selectedSkus.size} {t('common.of')} {filteredCatalog.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                darkMode
                  ? 'text-[#999] hover:bg-[#2E2E2E]'
                  : 'text-[#666] hover:bg-gray-100'
              }`}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedSkus.size === 0}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedSkus.size > 0
                  ? darkMode
                    ? 'bg-[rgba(42,158,106,0.2)] text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.3)]'
                    : 'bg-[rgba(18,119,73,0.12)] text-[#127749] hover:bg-[rgba(18,119,73,0.2)]'
                  : darkMode
                    ? 'bg-[#2E2E2E] text-[#555] cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('proposal.addSku')} ({selectedSkus.size})
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddSKUModal;
