// src/components/mobile/MobileCard.tsx
'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE CARD COMPONENT
// Visual hierarchy, progress bars, large touch targets
// ═══════════════════════════════════════════════════════════════════════════════

export interface MobileCardBadge {
  text: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}

export interface MobileCardMetric {
  icon: string;
  label: string;
  value: string;
}

export interface MobileCardProgress {
  current: number;
  total: number;
  label?: string;
  formatValue?: (value: number) => string;
}

export interface MobileCardProps {
  // Required
  title: string;
  
  // Optional content
  subtitle?: string;
  avatar?: string | React.ReactNode;
  avatarBg?: string;
  badges?: MobileCardBadge[];
  progress?: MobileCardProgress;
  metrics?: MobileCardMetric[];
  
  // Actions
  onPress?: () => void;
  onActionPress?: () => void;
  actionLabel?: string;
  primaryActionLabel?: string;
  
  // Styling
  className?: string;
  disabled?: boolean;
}

const badgeVariants = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const defaultFormatValue = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B đ`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M đ`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K đ`;
  }
  return `${value} đ`;
};

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  avatar,
  avatarBg = 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20',
  badges = [],
  progress,
  metrics = [],
  onPress,
  onActionPress,
  actionLabel = 'Actions',
  primaryActionLabel = 'View Details',
  className = '',
  disabled = false,
}) => {
  const formatValue = progress?.formatValue || defaultFormatValue;
  const percentage = progress 
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : 0;

  return (
    <div
      className={`
        bg-white dark:bg-gray-900
        rounded-2xl
        border border-gray-100 dark:border-gray-800
        shadow-sm
        overflow-hidden
        transition-all duration-150
        ${!disabled && onPress ? 'active:scale-[0.98] cursor-pointer' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
      onClick={!disabled && onPress ? onPress : undefined}
    >
      {/* Main Content */}
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          {avatar && (
            <div className={`
              w-14 h-14 rounded-2xl flex-shrink-0
              bg-gradient-to-br ${avatarBg}
              flex items-center justify-center
              text-lg font-bold text-amber-700 dark:text-amber-400
            `}>
              {typeof avatar === 'string' ? avatar : avatar}
            </div>
          )}

          {/* Title & Badges */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
            
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {badges.map((badge, i) => (
                  <span
                    key={i}
                    className={`
                      px-2 py-0.5 rounded-full text-[11px] font-medium
                      ${badgeVariants[badge.variant]}
                    `}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chevron */}
          {onPress && (
            <svg
              className="w-5 h-5 text-gray-300 dark:text-gray-600 mt-1 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[12px] text-gray-500 dark:text-gray-400">
                {progress.label || 'Progress'}
              </span>
              <span className="text-[14px] font-semibold text-gray-900 dark:text-white">
                {percentage}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-200"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-gray-400">
                {formatValue(progress.current)}
              </span>
              <span className="text-[11px] text-gray-400">
                {formatValue(progress.total)}
              </span>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
              >
                <span className="text-lg">{metric.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {metric.label}
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                    {metric.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      {(onPress || onActionPress) && (
        <div className="flex border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPress?.();
            }}
            className="
              flex-1 h-12 text-[15px] font-medium
              text-amber-600 dark:text-amber-400
              active:bg-amber-50 dark:active:bg-amber-900/20
              transition-colors
            "
          >
            {primaryActionLabel}
          </button>
          
          {onActionPress && (
            <>
              <div className="w-px bg-gray-100 dark:bg-gray-800" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onActionPress();
                }}
                className="
                  flex-1 h-12 text-[15px] font-medium
                  text-gray-600 dark:text-gray-400
                  active:bg-gray-50 dark:active:bg-gray-800
                  transition-colors
                  flex items-center justify-center gap-1
                "
              >
                {actionLabel}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileCard;
