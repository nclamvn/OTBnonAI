'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items, darkMode = true }: { items: BreadcrumbItem[]; darkMode?: boolean }) {
  const router = useRouter();
  const textMuted = darkMode ? 'text-[#555555]' : 'text-gray-500';
  const textActive = darkMode ? 'text-[#D7B797]' : 'text-gray-900';

  return (
    <nav className="flex items-center gap-1.5 text-xs font-['Montserrat'] mb-3">
      <button onClick={() => router.push('/')} className={`flex items-center gap-1 ${textMuted} hover:${textActive} transition-colors`}>
        <Home size={12} />
      </button>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={10} className={textMuted} />
          {item.href ? (
            <button onClick={() => router.push(item.href!)} className={`${textMuted} hover:${textActive} transition-colors`}>
              {item.label}
            </button>
          ) : (
            <span className={`${textActive} font-semibold`}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
