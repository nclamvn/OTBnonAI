'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Plus, X } from 'lucide-react';

interface CreatableSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onCreateOption?: (value: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
}

function CreatableSelect({
  value,
  options,
  onChange,
  onCreateOption,
  placeholder = 'Select or type...',
  darkMode = false,
  label,
  className = '',
  disabled = false,
}: CreatableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered options based on input
  const filtered = inputValue
    ? options.filter((o) => o.toLowerCase().includes(inputValue.toLowerCase()))
    : options;

  const showCreateOption =
    inputValue.trim() &&
    !options.some((o) => o.toLowerCase() === inputValue.trim().toLowerCase());

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
      setInputValue('');
    },
    [onChange]
  );

  const handleCreate = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onCreateOption?.(trimmed);
    onChange(trimmed);
    setIsOpen(false);
    setInputValue('');
  }, [inputValue, onChange, onCreateOption]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setInputValue('');
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (showCreateOption) {
          handleCreate();
        } else if (filtered.length === 1) {
          handleSelect(filtered[0]);
        }
      }
    },
    [showCreateOption, handleCreate, filtered, handleSelect]
  );

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const bg = darkMode ? 'bg-[#141414]' : 'bg-white';
  const border = darkMode ? 'border-[#2E2E2E]' : 'border-[#D4CCC2]';
  const text = darkMode ? 'text-[#F2F2F2]' : 'text-[#1A1A1A]';
  const textMuted = darkMode ? 'text-[#888888]' : 'text-[#888888]';
  const hoverBg = darkMode ? 'hover:bg-[rgba(215,183,151,0.06)]' : 'hover:bg-[rgba(215,183,151,0.08)]';
  const dropBg = darkMode ? 'bg-[#161616]' : 'bg-white';
  const dropBorder = darkMode ? 'border-[#2E2E2E]' : 'border-[#D4CCC2]';
  const accentText = darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <div
          className={`text-[10px] uppercase tracking-[0.12em] font-semibold mb-1.5 font-['Montserrat'] ${
            darkMode ? 'text-[#666666]' : 'text-[#999999]'
          }`}
        >
          {label}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-[7px] text-sm font-medium border rounded-lg transition-colors duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${bg} ${border} ${hoverBg}`}
      >
        <span className={`truncate text-left ${value ? text : textMuted}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className={`p-0.5 rounded hover:bg-[rgba(248,81,73,0.15)] cursor-pointer ${textMuted}`}
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown
            size={13}
            strokeWidth={2}
            className={`transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''} ${textMuted}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1.5 z-[9999] min-w-full w-max rounded-lg overflow-hidden border ${dropBg} ${dropBorder}`}
          style={{
            boxShadow: darkMode
              ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06)',
          }}
        >
          {/* Search input */}
          <div className={`px-2 py-1.5 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-[#E8E0D8]'}`}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full px-2 py-1 text-sm rounded outline-none ${
                darkMode
                  ? 'bg-[#0A0A0A] text-[#F2F2F2] placeholder-[#555555]'
                  : 'bg-[#FAFAF8] text-[#1A1A1A] placeholder-[#AAAAAA]'
              }`}
            />
          </div>

          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.map((option) => {
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center gap-2.5 px-3 py-[6px] text-sm transition-colors duration-150 ${
                    isSelected
                      ? darkMode
                        ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]'
                        : 'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]'
                      : darkMode
                        ? 'text-[#CCCCCC] hover:bg-[rgba(215,183,151,0.04)] hover:text-[#F2F2F2]'
                        : 'text-[#444444] hover:bg-[rgba(215,183,151,0.06)] hover:text-[#1A1A1A]'
                  }`}
                >
                  <span className={`flex-1 text-left truncate ${isSelected ? 'font-semibold' : ''}`}>
                    {option}
                  </span>
                  {isSelected && <Check size={13} strokeWidth={2.5} className={accentText} />}
                </button>
              );
            })}

            {/* Create new option */}
            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreate}
                className={`w-full flex items-center gap-2 px-3 py-[6px] text-sm font-medium transition-colors duration-150 ${
                  darkMode
                    ? 'text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.08)]'
                    : 'text-[#127749] hover:bg-[rgba(18,119,73,0.06)]'
                }`}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Create &quot;{inputValue.trim()}&quot;</span>
              </button>
            )}

            {filtered.length === 0 && !showCreateOption && (
              <div className={`px-3 py-3 text-center text-xs ${textMuted}`}>No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(CreatableSelect);
