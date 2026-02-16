'use client';

import { useState, useRef } from 'react';
import { formatCurrency, formatFullCurrency } from '../../utils';

interface FormattedCurrencyProps {
  value: number | string | null | undefined;
  className?: string;
  showSign?: boolean;
  colorCode?: boolean; // green for positive, red for negative
  darkMode?: boolean;
}

const FormattedCurrency = ({
  value,
  className = '',
  showSign = false,
  colorCode = false,
  darkMode = false,
}: FormattedCurrencyProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const num = typeof value === 'number' ? value : parseFloat(String(value || '0').replace(/[^\d.-]/g, '')) || 0;
  const abbreviated = formatCurrency(num);
  const full = formatFullCurrency(num);
  const prefix = showSign && num > 0 ? '+' : '';

  let colorClass = '';
  if (colorCode) {
    if (num > 0) colorClass = darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]';
    else if (num < 0) colorClass = 'text-[#F85149]';
  }

  return (
    <span
      ref={ref}
      className={`relative inline-block cursor-default ${colorClass} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {prefix}{abbreviated}
      {showTooltip && full !== abbreviated && (
        <span
          className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-[10px] font-['JetBrains_Mono'] whitespace-nowrap pointer-events-none shadow-lg ${
            darkMode
              ? 'bg-[#2E2E2E] text-[#F2F2F2] border border-[#3E3E3E]'
              : 'bg-[#0A0A0A] text-white'
          }`}
        >
          {full}
        </span>
      )}
    </span>
  );
};

export default FormattedCurrency;
