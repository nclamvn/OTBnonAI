'use client';

import { useState, useCallback, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { formatCurrency, parseSmartInput, formatFullCurrency } from '../../utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  darkMode?: boolean;
  className?: string;
  placeholder?: string;
  negativeWarning?: string;
  'data-alloc-cell'?: boolean;
  onNavigate?: (direction: 'next' | 'prev' | 'down' | 'up') => void;
}

const CurrencyInput = ({
  value,
  onChange,
  darkMode = false,
  className = '',
  placeholder = '0',
  negativeWarning,
  'data-alloc-cell': dataAllocCell,
  onNavigate,
}: CurrencyInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isNegative = typeof value === 'number' && value < 0;
  const displayValue = isEditing ? editValue : formatCurrency(value);
  const fullValue = formatFullCurrency(value);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(true);
    setEditValue(value === 0 ? '' : String(value));
    // Select all text after React renders the raw value
    requestAnimationFrame(() => e.target.select());
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() === '') {
      // Don't change if empty — keep previous value
      return;
    }
    // Try smart parse first, then raw number
    const parsed = parseSmartInput(editValue);
    if (parsed !== null) {
      onChange(parsed);
    } else {
      const raw = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(raw)) onChange(raw);
    }
  }, [editValue, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      // Commit value before navigating
      if (editValue.trim() !== '') {
        const parsed = parseSmartInput(editValue);
        if (parsed !== null) onChange(parsed);
        else {
          const raw = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
          if (!isNaN(raw)) onChange(raw);
        }
      }
      // Navigate using DOM data-alloc-cell
      const cells = Array.from(document.querySelectorAll<HTMLInputElement>('[data-alloc-cell]'));
      const idx = cells.indexOf(e.currentTarget);
      if (idx >= 0) {
        const colCount = document.querySelectorAll('thead th').length - 3; // subtract label, total, mix, actions cols
        const nextIdx = e.shiftKey ? idx - 1 : idx + (e.key === 'Enter' ? Math.max(colCount, 1) : 1);
        const nextCell = cells[nextIdx];
        if (nextCell) nextCell.focus();
        else e.currentTarget.blur();
      }
    }
    if (e.key === 'Escape') {
      setEditValue(String(value));
      e.currentTarget.blur();
    }
  }, [editValue, onChange, value]);

  return (
    <div
      className="relative group"
      onMouseEnter={() => !isEditing && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <input
        ref={inputRef}
        type="text"
        data-alloc-cell={dataAllocCell ? '' : undefined}
        value={displayValue}
        onChange={(e) => setEditValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full pl-4 pr-1.5 py-0.5 text-center border rounded text-xs focus:outline-none focus:ring-1 font-medium font-['JetBrains_Mono'] transition-colors ${
          isNegative
            ? 'border-[#F85149] focus:ring-[#F85149] focus:border-[#F85149] text-[#F85149]'
            : `focus:ring-[#D7B797] focus:border-[#D7B797] ${darkMode
              ? 'border-[#2E2E2E] text-[#F2F2F2] bg-[#121212] hover:border-[rgba(215,183,151,0.25)]'
              : 'border-[#C4B5A5] text-[#0A0A0A] bg-white hover:border-[rgba(215,183,151,0.4)]'
            }`
        } ${className}`}
        placeholder={placeholder}
        title={isNegative ? negativeWarning : undefined}
      />
      <Pencil
        size={8}
        className={`absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none ${
          isNegative ? 'text-[#F85149]/60' : darkMode ? 'text-[#D7B797]/40' : 'text-[#8A6340]/30'
        }`}
      />
      {/* Full value tooltip */}
      {showTooltip && value !== 0 && (
        <span
          className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] font-['JetBrains_Mono'] whitespace-nowrap pointer-events-none shadow-lg ${
            darkMode
              ? 'bg-[#2E2E2E] text-[#F2F2F2] border border-[#3E3E3E]'
              : 'bg-[#0A0A0A] text-white'
          }`}
        >
          {fullValue}
        </span>
      )}
    </div>
  );
};

export default CurrencyInput;
