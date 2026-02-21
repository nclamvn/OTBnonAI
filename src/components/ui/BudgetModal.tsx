'use client';
import React, { useEffect } from 'react';
import { X, Save, Sparkles, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { useLanguage } from '@/contexts/LanguageContext';

const BudgetModal = ({
  selectedCell,
  selectedYear,
  budgetFormData,
  setBudgetFormData,
  onClose,
  onSave,
  calculateTotalBudget,
  handleStoreAllocationChange,
  darkMode,
}: any) => {
  const { t } = useLanguage();

  // Block interactions with layout behind modal
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  if (!selectedCell) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#121212] rounded-3xl shadow-2xl max-w-[calc(100vw-1rem)] md:max-w-4xl w-full my-8 flex flex-col border border-[#2E2E2E]" style={{ pointerEvents: 'auto' }}>
        {/* Header */}
        <div className="bg-[#D7B797] px-4 py-4 md:px-8 md:py-6 flex items-center justify-between relative overflow-hidden rounded-t-3xl">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-[#0A0A0A] flex items-center gap-3 font-['Montserrat']">
              <Sparkles size={24} />
              {selectedCell.existingBudget ? t('components.editBudgetTitle') : t('components.createBudgetTitle')}
            </h2>
            <p className="text-[#0A0A0A]/70 text-sm mt-1">
              {selectedCell.brand.name} - {selectedCell.season.seasonGroupId} {selectedCell.season.name} ({selectedYear})
            </p>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 text-[#0A0A0A] hover:bg-[#0A0A0A]/20 rounded-xl p-2.5 transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 max-h-[60vh] bg-[#121212]">
          {/* Budget Comment */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#F2F2F2] mb-3 flex items-center gap-2 font-['Montserrat']">
              <FileText size={16} className="text-[#D7B797]" />
              {t('components.budgetComment')}
            </label>
            <textarea
              value={budgetFormData.comment}
              onChange={(e: any) => setBudgetFormData((prev: any) => ({ ...prev, comment: e.target.value }))}
              placeholder={t('components.budgetCommentPlaceholder')}
              className="w-full px-5 py-4 bg-[#1A1A1A] border-2 border-[#2E2E2E] rounded-2xl text-[#F2F2F2] placeholder-[#666666] focus:ring-2 focus:ring-[#D7B797] focus:border-transparent resize-none transition-colors duration-200"
              rows={3}
            />
          </div>

          {/* Store Budget Allocation */}
          <div>
            <label className="block text-sm font-bold text-[#F2F2F2] mb-4 flex items-center gap-2 font-['Montserrat']">
              <DollarSign size={16} className="text-[#D7B797]" />
              {t('components.storeBudgetAllocation')}
            </label>
            <div className="space-y-3">
              {budgetFormData.storeAllocations.map((sa: any, idx: any) => (
                <div
                  key={sa.storeId}
                  className="group flex items-center gap-4 p-5 bg-[#1A1A1A] rounded-2xl border-2 border-[#2E2E2E] hover:border-[rgba(215,183,151,0.25)] hover:bg-[rgba(215,183,151,0.08)] transition-colors duration-200"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-[#F2F2F2] group-hover:text-[#D7B797] transition-colors duration-200">{sa.storeName}</div>
                    <div className="text-xs text-[#666666]">{sa.storeCode}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#999999] text-sm font-semibold group-hover:text-[#D7B797] transition-colors duration-200">VND</span>
                    <input
                      type="number"
                      value={sa.budgetAmount || ''}
                      onChange={(e: any) => handleStoreAllocationChange(sa.storeId, e.target.value)}
                      placeholder="0"
                      className="w-44 px-5 py-0.5 bg-[#0A0A0A] border-2 border-[#2E2E2E] rounded-xl text-right font-bold text-[#F2F2F2] placeholder-[#666666] focus:ring-2 focus:ring-[#D7B797] focus:border-transparent transition-colors duration-200 font-['JetBrains_Mono']"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Budget Summary */}
          <div className="mt-8 p-6 bg-[#1A1A1A] rounded-2xl border-2 border-[#D7B797]/30 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <span className="text-lg font-bold text-[#F2F2F2] flex items-center gap-2 font-['Montserrat']">
                <TrendingUp size={20} className="text-[#D7B797]" />
                {t('components.totalBudget')}
              </span>
              <span className="text-3xl font-black text-[#D7B797] font-['JetBrains_Mono']">
                {formatCurrency(calculateTotalBudget())}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#2E2E2E] px-8 py-0.5 flex items-center justify-end gap-3 bg-[#0A0A0A] rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-0.5 border-2 border-[#2E2E2E] rounded-xl font-semibold text-[#999999] bg-[#1A1A1A] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797] transition-colors duration-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            className="px-5 py-0.5 bg-[#D7B797] text-[#0A0A0A] rounded-xl font-semibold hover:bg-[#C4A684] transition-colors duration-200 flex items-center gap-2 shadow-lg shadow-[#D7B797]/20 relative overflow-hidden group"
          >
            <Save size={16} className="relative z-10" />
            <span className="relative z-10 font-['Montserrat']">{t('components.saveBudget')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetModal;
