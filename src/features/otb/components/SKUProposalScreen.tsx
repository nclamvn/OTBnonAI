'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown, Package, Pencil, X, Plus, Trash2, Ruler,
  Star, Layers, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils';

// 3D realistic fashion product SVG generator — transparent background
const getDemoImageSvg = (subCategory: string, sku: string): string => {
  const hash = (sku || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const variant = hash % 3; // 3 color variants per type
  const sub = (subCategory || '').toLowerCase();

  let svg = '';
  const uid = `p${hash}`; // unique gradient IDs per SKU

  if (sub.includes('bag')) {
    // -- HANDBAG: 3D structured tote/flap bag --
    const palettes = [
      { body: '#8B6914', dark: '#5C4A0E', light: '#C9A84C', metal: '#D4AF37', shadow: 'rgba(90,60,10,0.35)' },
      { body: '#2C2C2C', dark: '#1A1A1A', light: '#4A4A4A', metal: '#C0C0C0', shadow: 'rgba(0,0,0,0.4)' },
      { body: '#7B2D3B', dark: '#5A1525', light: '#A8475A', metal: '#E8C56D', shadow: 'rgba(80,20,30,0.35)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="50%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${p.light}" stop-opacity="0.6"/><stop offset="100%" stop-color="${p.body}" stop-opacity="0.9"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="6" stdDeviation="6" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Handle -->
        <path d="M72 60 C72 30 88 22 100 22 C112 22 128 30 128 60" fill="none" stroke="${p.dark}" stroke-width="5" stroke-linecap="round"/>
        <path d="M72 60 C72 30 88 22 100 22 C112 22 128 30 128 60" fill="none" stroke="${p.body}" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Bag body -->
        <path d="M58 62 L56 158 C56 166 62 172 70 172 L130 172 C138 172 144 166 144 158 L142 62 C142 56 136 52 130 52 L70 52 C64 52 58 56 58 62 Z" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="1"/>
        <!-- Front flap -->
        <path d="M62 52 L62 90 C62 94 80 102 100 102 C120 102 138 94 138 90 L138 52" fill="url(#${uid}f)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Metal clasp -->
        <ellipse cx="100" cy="100" rx="8" ry="6" fill="${p.metal}" stroke="${p.dark}" stroke-width="0.5"/>
        <ellipse cx="100" cy="100" rx="5" ry="3.5" fill="none" stroke="${p.dark}" stroke-width="0.3"/>
        <!-- Stitching -->
        <path d="M66 68 L66 164" fill="none" stroke="${p.light}" stroke-width="0.4" stroke-dasharray="3 3" opacity="0.5"/>
        <path d="M134 68 L134 164" fill="none" stroke="${p.light}" stroke-width="0.4" stroke-dasharray="3 3" opacity="0.5"/>
        <!-- Bottom edge highlight -->
        <path d="M62 168 C62 170 80 174 100 174 C120 174 138 170 138 168" fill="none" stroke="${p.light}" stroke-width="0.6" opacity="0.4"/>
        <!-- Surface highlight -->
        <path d="M68 56 L66 155" fill="none" stroke="white" stroke-width="1.5" opacity="0.12" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">BAGS</text>
    </svg>`;
  } else if (sub.includes('outerwear')) {
    // -- OUTERWEAR: 3D coat/jacket --
    const palettes = [
      { body: '#2D3748', dark: '#1A202C', light: '#4A5568', liner: '#718096', btn: '#A0AEC0', shadow: 'rgba(20,25,35,0.4)' },
      { body: '#5B3A1A', dark: '#3D2510', light: '#8B6340', liner: '#A07850', btn: '#C9A84C', shadow: 'rgba(50,30,10,0.35)' },
      { body: '#1A3A2A', dark: '#0D2018', light: '#2D5A40', liner: '#4A7A60', btn: '#8BBEAA', shadow: 'rgba(10,30,20,0.35)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="${uid}sl" x1="0" y1="0" x2="1" y2="0.5"><stop offset="0%" stop-color="${p.light}" stop-opacity="0.8"/><stop offset="100%" stop-color="${p.body}"/></linearGradient>
        <linearGradient id="${uid}sr" x1="1" y1="0" x2="0" y2="0.5"><stop offset="0%" stop-color="${p.light}" stop-opacity="0.6"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="5" stdDeviation="5" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Collar -->
        <path d="M82 28 L74 40 L88 48 L100 42 L112 48 L126 40 L118 28 C112 22 88 22 82 28 Z" fill="${p.light}" stroke="${p.dark}" stroke-width="0.8"/>
        <path d="M88 48 L100 42 L112 48" fill="none" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Left sleeve -->
        <path d="M74 40 L50 52 L42 120 L56 126 L68 80 L76 170" fill="url(#${uid}sl)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Right sleeve -->
        <path d="M126 40 L150 52 L158 120 L144 126 L132 80 L124 170" fill="url(#${uid}sr)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Body left panel -->
        <path d="M76 46 L68 80 L76 170 L98 172 L98 46 Z" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.5"/>
        <!-- Body right panel -->
        <path d="M124 46 L132 80 L124 170 L102 172 L102 46 Z" fill="${p.body}" stroke="${p.dark}" stroke-width="0.5"/>
        <!-- Center seam -->
        <line x1="100" y1="42" x2="100" y2="172" stroke="${p.dark}" stroke-width="1"/>
        <!-- Buttons -->
        <circle cx="96" cy="70" r="2.5" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.4"/>
        <circle cx="96" cy="95" r="2.5" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.4"/>
        <circle cx="96" cy="120" r="2.5" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.4"/>
        <!-- Pockets -->
        <path d="M80 110 L80 130 L96 130" fill="none" stroke="${p.dark}" stroke-width="0.8"/>
        <path d="M120 110 L120 130 L104 130" fill="none" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Lapel fold highlight -->
        <path d="M88 48 L82 70" fill="none" stroke="white" stroke-width="1" opacity="0.15" stroke-linecap="round"/>
        <path d="M112 48 L118 70" fill="none" stroke="white" stroke-width="0.8" opacity="0.1" stroke-linecap="round"/>
        <!-- Sleeve cuff -->
        <path d="M42 118 L56 124" stroke="${p.liner}" stroke-width="2" stroke-linecap="round"/>
        <path d="M158 118 L144 124" stroke="${p.liner}" stroke-width="2" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">OUTERWEAR</text>
    </svg>`;
  } else if (sub.includes('tailoring')) {
    // -- TAILORING: 3D suit/blazer --
    const palettes = [
      { body: '#1B2838', dark: '#0F1820', mid: '#2A3F55', light: '#3D5A78', lapel: '#4A6E8F', btn: '#B8C6D4', shadow: 'rgba(15,20,30,0.4)' },
      { body: '#3A3A3A', dark: '#222222', mid: '#505050', light: '#686868', lapel: '#787878', btn: '#C0C0C0', shadow: 'rgba(0,0,0,0.4)' },
      { body: '#2C1810', dark: '#1A0E08', mid: '#402820', light: '#5A3C30', lapel: '#6E5040', btn: '#C8A882', shadow: 'rgba(30,15,8,0.35)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="45%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="${uid}lp" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${p.lapel}"/><stop offset="100%" stop-color="${p.mid}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="5" stdDeviation="5" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Shoulders & body -->
        <path d="M74 38 L50 48 L54 80 L66 76 L72 172 L128 172 L134 76 L146 80 L150 48 L126 38 C118 32 82 32 74 38 Z" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Left lapel -->
        <path d="M86 38 L76 52 L82 90 L98 78 L98 38 Z" fill="url(#${uid}lp)" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Right lapel -->
        <path d="M114 38 L124 52 L118 90 L102 78 L102 38 Z" fill="${p.lapel}" stroke="${p.dark}" stroke-width="0.6" opacity="0.85"/>
        <!-- Shirt / tie area -->
        <path d="M92 38 L98 78 L100 172" fill="none" stroke="white" stroke-width="0.6" opacity="0.3"/>
        <path d="M108 38 L102 78 L100 172" fill="none" stroke="white" stroke-width="0.6" opacity="0.3"/>
        <!-- Tie -->
        <path d="M98 40 L100 44 L102 40 L100 90 L98 40" fill="#8B1A2B" stroke="#6B0A1B" stroke-width="0.4" opacity="0.85"/>
        <path d="M97 90 L100 100 L103 90" fill="#8B1A2B" stroke="#6B0A1B" stroke-width="0.3"/>
        <!-- Buttons -->
        <circle cx="100" cy="110" r="2.2" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.4"/>
        <circle cx="100" cy="132" r="2.2" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.4"/>
        <!-- Breast pocket -->
        <path d="M108 72 L118 70 L118 82 L108 84 Z" fill="none" stroke="${p.dark}" stroke-width="0.5"/>
        <path d="M108 72 L118 70" stroke="white" stroke-width="0.6" opacity="0.2"/>
        <!-- Left pocket flap -->
        <path d="M78 118 L78 122 L96 122 L96 118" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.5"/>
        <!-- Right pocket flap -->
        <path d="M104 118 L104 122 L122 122 L122 118" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.5"/>
        <!-- Shoulder seams -->
        <path d="M74 38 L54 48" stroke="${p.light}" stroke-width="0.8" opacity="0.3"/>
        <path d="M126 38 L146 48" stroke="${p.light}" stroke-width="0.6" opacity="0.2"/>
        <!-- Highlight -->
        <path d="M78 42 L72 168" fill="none" stroke="white" stroke-width="1.2" opacity="0.08" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">TAILORING</text>
    </svg>`;
  } else if (sub.includes('shoe')) {
    // -- SHOES: 3D sneaker/loafer --
    const palettes = [
      { body: '#F5F0EA', dark: '#B8AFA5', mid: '#E0D8CE', light: '#FFFFFF', sole: '#3A3A3A', accent: '#C8392B', shadow: 'rgba(100,90,80,0.3)' },
      { body: '#2C2C2C', dark: '#1A1A1A', mid: '#3A3A3A', light: '#4A4A4A', sole: '#F0EBE4', accent: '#D4AF37', shadow: 'rgba(0,0,0,0.4)' },
      { body: '#5A3C28', dark: '#3A2418', mid: '#6E5040', light: '#8B6B50', sole: '#2C2C2C', accent: '#C9A84C', shadow: 'rgba(50,30,15,0.35)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="60%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="5" stdDeviation="5" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Sole -->
        <path d="M30 148 C30 142 40 136 60 134 L150 130 C165 130 175 136 175 144 L175 152 C175 158 165 162 150 162 L60 162 C40 162 30 156 30 148 Z" fill="${p.sole}" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Midsole -->
        <path d="M32 144 C32 140 42 136 62 134 L148 130 C163 130 173 134 173 140 L173 146 C173 150 163 152 148 152 L62 152 C42 152 32 148 32 144 Z" fill="white" stroke="${p.dark}" stroke-width="0.3" opacity="0.8"/>
        <!-- Upper body -->
        <path d="M45 134 L50 80 C52 68 65 56 85 52 L120 52 C130 52 138 60 140 72 L148 130" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Tongue -->
        <path d="M72 62 L70 40 C70 34 80 28 95 28 C110 28 115 34 115 40 L112 62" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.5"/>
        <!-- Lace area -->
        <path d="M78 58 L88 50 M82 68 L92 60 M86 78 L96 70 M90 88 L100 80" fill="none" stroke="${p.dark}" stroke-width="0.8" opacity="0.5"/>
        <!-- Heel tab -->
        <path d="M45 80 L40 68 C40 60 48 56 52 60 L50 80" fill="${p.accent}" stroke="${p.dark}" stroke-width="0.5"/>
        <!-- Toe cap -->
        <path d="M130 130 C155 128 168 132 168 140" fill="none" stroke="${p.dark}" stroke-width="0.5" opacity="0.4"/>
        <!-- Highlight -->
        <path d="M60 80 L55 125" fill="none" stroke="white" stroke-width="1.5" opacity="0.15" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">SHOES</text>
    </svg>`;
  } else if (sub.includes('dress')) {
    // -- DRESSES: 3D elegant dress --
    const palettes = [
      { body: '#8B1A2B', dark: '#5A0A18', mid: '#A82840', light: '#C84060', waist: '#D4AF37', shadow: 'rgba(80,10,20,0.35)' },
      { body: '#1A2A4A', dark: '#0E1830', mid: '#2A3E60', light: '#3D5A80', waist: '#C0C0C0', shadow: 'rgba(15,20,40,0.4)' },
      { body: '#2D5A40', dark: '#1A3828', mid: '#3D7050', light: '#4A8A62', waist: '#E8C56D', shadow: 'rgba(20,45,30,0.35)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="5" stdDeviation="5" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Bodice -->
        <path d="M82 28 L74 36 L70 42 L78 48 L82 80 L118 80 L122 48 L130 42 L126 36 L118 28 C112 24 88 24 82 28 Z" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Neckline -->
        <path d="M86 28 C92 36 108 36 114 28" fill="none" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Straps -->
        <path d="M86 28 L82 18 C82 14 86 12 88 14 L90 28" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.4"/>
        <path d="M114 28 L118 18 C118 14 114 12 112 14 L110 28" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.4"/>
        <!-- Waistline -->
        <path d="M80 80 C80 84 90 86 100 86 C110 86 120 84 120 80" fill="${p.waist}" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Skirt -->
        <path d="M82 80 L62 174 C70 178 90 180 100 180 C110 180 130 178 138 174 L118 80" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Skirt drape folds -->
        <path d="M88 86 L78 174" fill="none" stroke="${p.dark}" stroke-width="0.5" opacity="0.3"/>
        <path d="M100 86 L100 178" fill="none" stroke="${p.dark}" stroke-width="0.4" opacity="0.2"/>
        <path d="M112 86 L122 174" fill="none" stroke="${p.dark}" stroke-width="0.5" opacity="0.3"/>
        <!-- Highlight -->
        <path d="M88 32 L84 76" fill="none" stroke="white" stroke-width="1.2" opacity="0.12" stroke-linecap="round"/>
        <path d="M90 90 L76 170" fill="none" stroke="white" stroke-width="1" opacity="0.08" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">DRESSES</text>
    </svg>`;
  } else if (sub.includes('accessor') || sub.includes('slg')) {
    // -- ACCESSORIES/SLG: 3D wallet/belt/small goods --
    const palettes = [
      { body: '#6B4D30', dark: '#3D2A18', mid: '#8B6B48', light: '#A88860', metal: '#D4AF37', shadow: 'rgba(60,40,15,0.35)' },
      { body: '#2C2C2C', dark: '#1A1A1A', mid: '#404040', light: '#555555', metal: '#C0C0C0', shadow: 'rgba(0,0,0,0.4)' },
      { body: '#4A1E3D', dark: '#2E0E25', mid: '#6A3858', light: '#8A5878', metal: '#E8C56D', shadow: 'rgba(50,15,35,0.35)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="50%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Wallet body -->
        <rect x="45" y="55" width="110" height="80" rx="6" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Flap -->
        <path d="M45 55 L45 90 C45 94 70 100 100 100 C130 100 155 94 155 90 L155 55 C155 52 148 49 100 49 C52 49 45 52 45 55 Z" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Snap closure -->
        <circle cx="100" cy="98" r="5" fill="${p.metal}" stroke="${p.dark}" stroke-width="0.4"/>
        <circle cx="100" cy="98" r="3" fill="none" stroke="${p.dark}" stroke-width="0.3"/>
        <!-- Card slots visible -->
        <rect x="55" y="108" width="38" height="22" rx="2" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.3" opacity="0.5"/>
        <rect x="107" y="108" width="38" height="22" rx="2" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.3" opacity="0.5"/>
        <!-- Stitching -->
        <rect x="50" y="60" width="100" height="70" rx="4" fill="none" stroke="${p.light}" stroke-width="0.3" stroke-dasharray="3 2" opacity="0.4"/>
        <!-- Brand stamp -->
        <rect x="85" y="70" width="30" height="12" rx="2" fill="none" stroke="${p.metal}" stroke-width="0.5" opacity="0.6"/>
        <!-- Highlight -->
        <path d="M52 58 L50 128" fill="none" stroke="white" stroke-width="1.2" opacity="0.1" stroke-linecap="round"/>
      </g>
      <text x="100" y="163" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">${sub.includes('slg') ? 'SLG' : 'ACCESSORIES'}</text>
    </svg>`;
  } else if (sub.includes('knit')) {
    // -- KNITWEAR: 3D knit sweater/cardigan --
    const palettes = [
      { body: '#C4A882', dark: '#8B7A60', mid: '#B89870', light: '#DCC8A8', collar: '#E8D8C0', shadow: 'rgba(100,80,50,0.3)' },
      { body: '#6E2C2C', dark: '#4A1818', mid: '#884040', light: '#A85858', collar: '#C07070', shadow: 'rgba(60,20,20,0.35)' },
      { body: '#3A4A5A', dark: '#222E38', mid: '#4A5E70', light: '#607888', collar: '#7890A0', shadow: 'rgba(30,40,50,0.35)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="50%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Turtleneck collar -->
        <path d="M84 24 L82 42 C82 48 90 52 100 52 C110 52 118 48 118 42 L116 24 C112 20 88 20 84 24 Z" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.6"/>
        <path d="M84 30 C90 34 110 34 116 30" fill="none" stroke="${p.dark}" stroke-width="0.4" opacity="0.4"/>
        <path d="M83 36 C90 40 110 40 117 36" fill="none" stroke="${p.dark}" stroke-width="0.4" opacity="0.3"/>
        <!-- Left sleeve -->
        <path d="M72 48 L46 58 L42 130 L58 132 L62 78 L76 172" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Right sleeve -->
        <path d="M128 48 L154 58 L158 130 L142 132 L138 78 L124 172" fill="${p.body}" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Body -->
        <path d="M76 48 L62 78 L76 172 L124 172 L138 78 L124 48 Z" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Knit texture lines -->
        <path d="M78 60 L122 60" fill="none" stroke="${p.dark}" stroke-width="0.3" opacity="0.15"/>
        <path d="M76 75 L124 75" fill="none" stroke="${p.dark}" stroke-width="0.3" opacity="0.15"/>
        <path d="M76 90 L124 90" fill="none" stroke="${p.dark}" stroke-width="0.3" opacity="0.15"/>
        <path d="M76 105 L124 105" fill="none" stroke="${p.dark}" stroke-width="0.3" opacity="0.15"/>
        <path d="M76 120 L124 120" fill="none" stroke="${p.dark}" stroke-width="0.3" opacity="0.15"/>
        <path d="M76 135 L124 135" fill="none" stroke="${p.dark}" stroke-width="0.3" opacity="0.15"/>
        <path d="M76 150 L124 150" fill="none" stroke="${p.dark}" stroke-width="0.3" opacity="0.15"/>
        <!-- Ribbed hem -->
        <rect x="76" y="164" width="48" height="8" rx="2" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.3" opacity="0.6"/>
        <!-- Sleeve cuffs -->
        <rect x="40" y="126" width="20" height="6" rx="2" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.3" opacity="0.6"/>
        <rect x="140" y="126" width="20" height="6" rx="2" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.3" opacity="0.6"/>
        <!-- Highlight -->
        <path d="M82 50 L78 168" fill="none" stroke="white" stroke-width="1.2" opacity="0.1" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">KNITWEAR</text>
    </svg>`;
  } else if (sub.includes('bottom') || sub.includes('trouser') || sub.includes('pant')) {
    // -- BOTTOMS: 3D trousers/pants --
    const palettes = [
      { body: '#1E2A4A', dark: '#0F1828', mid: '#2A3E5A', light: '#3D5A78', waist: '#4A3828', shadow: 'rgba(15,20,40,0.4)' },
      { body: '#3A3A3A', dark: '#222222', mid: '#505050', light: '#686868', waist: '#5A3C28', shadow: 'rgba(0,0,0,0.4)' },
      { body: '#F0EBE4', dark: '#C8BEB2', mid: '#E0D8CE', light: '#FAFAF5', waist: '#6B4D30', shadow: 'rgba(120,110,100,0.3)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="2" dy="5" stdDeviation="5" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Waistband -->
        <path d="M62 28 L138 28 L140 42 L60 42 Z" fill="${p.waist}" stroke="${p.dark}" stroke-width="0.8" rx="2"/>
        <!-- Belt -->
        <rect x="62" y="30" width="76" height="8" rx="1" fill="${p.waist}" stroke="${p.dark}" stroke-width="0.4"/>
        <!-- Belt buckle -->
        <rect x="95" y="30" width="10" height="8" rx="1" fill="#C0C0C0" stroke="${p.dark}" stroke-width="0.3"/>
        <!-- Left leg -->
        <path d="M60 42 L64 100 L58 178 L90 178 L96 100 L100 62" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Right leg -->
        <path d="M100 62 L104 100 L110 178 L142 178 L136 100 L140 42" fill="${p.body}" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Center seam -->
        <path d="M100 42 L100 62" stroke="${p.dark}" stroke-width="0.8"/>
        <!-- Front crease left -->
        <path d="M78 48 L74 175" fill="none" stroke="${p.light}" stroke-width="0.5" opacity="0.25"/>
        <!-- Front crease right -->
        <path d="M122 48 L126 175" fill="none" stroke="${p.light}" stroke-width="0.5" opacity="0.2"/>
        <!-- Pocket -->
        <path d="M68 44 L68 60 C68 64 72 66 78 62 L82 44" fill="none" stroke="${p.dark}" stroke-width="0.6" opacity="0.5"/>
        <!-- Highlight -->
        <path d="M68 44 L62 174" fill="none" stroke="white" stroke-width="1.2" opacity="0.08" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">BOTTOMS</text>
    </svg>`;
  } else {
    // -- TOPS: 3D shirt/blouse --
    const palettes = [
      { body: '#E8E0D6', dark: '#B8AFA5', mid: '#D4CCC2', light: '#F5F0EA', collar: '#F0EBE4', btn: '#C8BEB2', shadow: 'rgba(120,110,100,0.3)' },
      { body: '#4A6E8F', dark: '#2A4A65', mid: '#3D5E7E', light: '#6A8EAF', collar: '#7A9EBF', btn: '#A8C8E0', shadow: 'rgba(30,50,70,0.35)' },
      { body: '#D4A5A5', dark: '#B08080', mid: '#C49090', light: '#E8C0C0', collar: '#EED0D0', btn: '#C49898', shadow: 'rgba(120,80,80,0.3)' },
    ];
    const p = palettes[variant];
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="${uid}b" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0%" stop-color="${p.light}"/><stop offset="50%" stop-color="${p.body}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="${uid}sl" x1="0" y1="0" x2="1" y2="0.8"><stop offset="0%" stop-color="${p.light}"/><stop offset="100%" stop-color="${p.mid}"/></linearGradient>
        <filter id="${uid}s"><feDropShadow dx="1" dy="4" stdDeviation="4" flood-color="${p.shadow}"/></filter>
      </defs>
      <g filter="url(#${uid}s)">
        <!-- Collar -->
        <path d="M82 32 L72 46 L90 56 L100 48 L110 56 L128 46 L118 32 C112 26 88 26 82 32 Z" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Collar fold left -->
        <path d="M78 36 L72 46 L90 56 L88 42 Z" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.5" opacity="0.9"/>
        <!-- Collar fold right -->
        <path d="M122 36 L128 46 L110 56 L112 42 Z" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.5" opacity="0.8"/>
        <!-- Left sleeve -->
        <path d="M72 46 L48 56 L46 112 L60 114 L64 74 L76 170" fill="url(#${uid}sl)" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Right sleeve -->
        <path d="M128 46 L152 56 L154 112 L140 114 L136 74 L124 170" fill="${p.mid}" stroke="${p.dark}" stroke-width="0.6"/>
        <!-- Body -->
        <path d="M76 50 L64 74 L76 170 L124 170 L136 74 L124 50 Z" fill="url(#${uid}b)" stroke="${p.dark}" stroke-width="0.5"/>
        <!-- Center placket -->
        <rect x="97" y="48" width="6" height="124" rx="1" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.3" opacity="0.7"/>
        <!-- Buttons -->
        <circle cx="100" cy="62" r="2" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.3"/>
        <circle cx="100" cy="82" r="2" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.3"/>
        <circle cx="100" cy="102" r="2" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.3"/>
        <circle cx="100" cy="122" r="2" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.3"/>
        <circle cx="100" cy="142" r="2" fill="${p.btn}" stroke="${p.dark}" stroke-width="0.3"/>
        <!-- Breast pocket -->
        <path d="M108 68 L116 66 L116 78 L108 80 Z" fill="none" stroke="${p.dark}" stroke-width="0.4" opacity="0.5"/>
        <!-- Sleeve cuffs -->
        <rect x="44" y="108" width="18" height="6" rx="1" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.3" opacity="0.7"/>
        <rect x="138" y="108" width="18" height="6" rx="1" fill="${p.collar}" stroke="${p.dark}" stroke-width="0.3" opacity="0.6"/>
        <!-- Surface highlights -->
        <path d="M80 52 L78 165" fill="none" stroke="white" stroke-width="1.5" opacity="0.1" stroke-linecap="round"/>
        <path d="M52 58 L50 108" fill="none" stroke="white" stroke-width="1" opacity="0.1" stroke-linecap="round"/>
      </g>
      <text x="100" y="193" text-anchor="middle" fill="#aaa" font-size="10" font-family="system-ui,sans-serif" font-weight="600" letter-spacing="1.5">TOPS</text>
    </svg>`;
  }

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
import { budgetService, masterDataService, proposalService } from '../../../services';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { FilterBottomSheet, FilterChips, useBottomSheet } from '@/components/mobile';
import { SlidersHorizontal } from 'lucide-react';

const SEASON_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'SS', label: 'Spring Summer' },
  { id: 'FW', label: 'Fall Winter' }
];

const SEASONS = [
  { id: 'all', label: 'All' },
  { id: 'Pre', label: 'Pre' },
  { id: 'Main/Show', label: 'Main/Show' }
];

// DAFC Design System card backgrounds - warm gold tints
const CARD_BG_CLASSES = [
  { light: 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.3)]', dark: 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.2)]' },
  { light: 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.35)]', dark: 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.25)]' },
  { light: 'bg-[rgba(18,119,73,0.08)] border-[rgba(18,119,73,0.2)]', dark: 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)]' },
  { light: 'bg-[rgba(215,183,151,0.12)] border-[rgba(215,183,151,0.32)]', dark: 'bg-[rgba(215,183,151,0.06)] border-[rgba(215,183,151,0.18)]' },
  { light: 'bg-[rgba(18,119,73,0.06)] border-[rgba(18,119,73,0.18)]', dark: 'bg-[rgba(42,158,106,0.08)] border-[rgba(42,158,106,0.2)]' },
  { light: 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)]', dark: 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.15)]' }
];

const SKU_VERSIONS = [
  { id: 'v1', name: 'Version 1', createdAt: '2025-01-15', isFinal: false },
  { id: 'v2', name: 'Version 2', createdAt: '2025-01-20', isFinal: false },
  { id: 'v3', name: 'Version 3', createdAt: '2025-01-25', isFinal: true },
];

const SIZING_CHOICES = [
  { id: 'choice-a', name: 'Choice A', isFinal: true },
  { id: 'choice-b', name: 'Choice B', isFinal: false },
  { id: 'choice-c', name: 'Choice C', isFinal: false },
];

const SKUProposalScreen = ({ skuContext, onContextUsed, darkMode = false }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});
  // SKU catalog and proposal data from API
  const [skuCatalog, setSkuCatalog] = useState<any[]>([]);
  const [skuDataLoading, setSkuDataLoading] = useState(true);

  // Master data for filters (genders, categories) and stores
  const [masterGenders, setMasterGenders] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Fetch master data for filters + stores
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [gendersRes, categoriesRes, storesRes] = await Promise.all([
          masterDataService.getGenders().catch(() => []),
          masterDataService.getCategories().catch(() => []),
          masterDataService.getStores().catch(() => [])
        ]);
        const genders = Array.isArray(gendersRes) ? gendersRes : (gendersRes?.data || []);
        setMasterGenders(genders.map((g: any) => (g.name || g.code || '').toLowerCase()));
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        setMasterCategories(categories);
        const storeList = Array.isArray(storesRes) ? storesRes : (storesRes?.data || []);
        setStores(storeList.length > 0 ? storeList : [{ code: 'REX', name: 'REX' }, { code: 'TTP', name: 'TTP' }]);
      } catch (err: any) {
        console.error('Failed to fetch master data:', err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch SKU catalog and proposals from API
  useEffect(() => {
    const fetchSkuData = async () => {
      setSkuDataLoading(true);
      try {
        const [catalogRes, proposalsRes] = await Promise.all([
          masterDataService.getSkuCatalog().catch(() => ({ data: [] })),
          proposalService.getAll().catch(() => ({ data: [] }))
        ]);

        // Transform SKU catalog
        const catalog = Array.isArray(catalogRes) ? catalogRes : (catalogRes?.data || []);
        setSkuCatalog(catalog.map((s: any) => ({
          sku: s.skuCode || s.sku || s.code || s.id,
          name: s.productName || s.name,
          collectionName: s.collectionName || s.collection || '',
          color: s.color || '',
          colorCode: s.colorCode || '',
          division: s.division || s.category || '',
          productType: s.productType || s.category || '',
          departmentGroup: s.departmentGroup || s.department || '',
          fsr: s.fsr || '',
          carryForward: s.carryForward || s.carry || 'NEW',
          composition: s.composition || '',
          unitCost: Number(s.unitCost) || 0,
          importTaxPct: Number(s.importTaxPct || s.importTax) || 0,
          srp: Number(s.srp) || 0,
          wholesale: Number(s.wholesale) || 0,
          rrp: Number(s.rrp) || 0,
          regionalRrp: Number(s.regionalRrp) || 0,
          theme: s.theme || '',
          size: s.size || ''
        })));

        // Transform proposals into SKU blocks grouped by gender/category
        const proposals = Array.isArray(proposalsRes) ? proposalsRes : (proposalsRes?.data || []);
        const blocks: any[] = [];
        proposals.forEach((p: any) => {
          (p.products || []).forEach((prod: any) => {
            const gender = (prod.gender || '').toLowerCase();
            const category = prod.category || '';
            const subCategory = prod.subCategory || '';
            let block = blocks.find((b: any) => b.gender === gender && b.category === category && b.subCategory === subCategory);
            if (!block) {
              block = { gender, category, subCategory, items: [] };
              blocks.push(block);
            }
            // Extract store allocations from product allocations (dynamic)
            const allocations = prod.allocations || [];
            const storeQty: Record<string, number> = {};
            allocations.forEach((a: any) => {
              const code = (a.store?.code || '').toUpperCase();
              if (code) storeQty[code] = (a.quantity || 0);
            });
            // Fallback for legacy rex/ttp fields
            if (!storeQty['REX'] && prod.rex) storeQty['REX'] = prod.rex;
            if (!storeQty['TTP'] && prod.ttp) storeQty['TTP'] = prod.ttp;
            block.items.push({
              sku: prod.skuCode || prod.sku,
              name: prod.productName || prod.name,
              collectionName: prod.collectionName || prod.collection || '',
              color: prod.color || '',
              colorCode: prod.colorCode || '',
              division: prod.division || prod.category || '',
              productType: prod.productType || prod.subCategory || '',
              departmentGroup: prod.departmentGroup || prod.department || '',
              fsr: prod.fsr || '',
              carryForward: prod.carryForward || 'NEW',
              composition: prod.composition || '',
              unitCost: Number(prod.unitCost) || 0,
              importTaxPct: Number(prod.importTaxPct || prod.importTax) || 0,
              srp: Number(prod.srp) || 0,
              wholesale: Number(prod.wholesale) || 0,
              rrp: Number(prod.rrp) || 0,
              regionalRrp: Number(prod.regionalRrp) || 0,
              theme: prod.theme || '',
              size: prod.size || '',
              order: prod.orderQty || 0,
              storeQty,
              ttlValue: Number(prod.totalValue) || 0,
              customerTarget: prod.customerTarget || 'New'
            });
          });
        });
        if (blocks.length > 0) {
          setSkuBlocks(blocks);
        }
      } catch (err: any) {
        console.error('Failed to fetch SKU data:', err);
      } finally {
        setSkuDataLoading(false);
      }
    };
    fetchSkuData();
  }, []);

  // API state for fetching budgets
  const [apiBudgets, setApiBudgets] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await budgetService.getAll({ status: 'APPROVED' });
      const budgetList = (response.data || response || []).map((budget: any) => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
        brandId: budget.brandId,
        brandName: budget.Brand?.name || budget.brandName || 'Unknown',
        totalBudget: budget.totalAmount || budget.totalBudget || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || `Budget #${budget.id}`,
        status: (budget.status || 'DRAFT').toLowerCase()
      }));
      setApiBudgets(budgetList);
    } catch (err: any) {
      console.error('Failed to fetch budgets:', err);
      toast.error(t('budget.failedToLoadBudgets'));
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  // Fetch budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const [budgetFilter, setBudgetFilter] = useState('all');
  const [seasonGroupFilter, setSeasonGroupFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');

  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');

  const [collapsed, setCollapsed] = useState<Record<string, any>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [contextBanner, setContextBanner] = useState<any>(null);
  const [viewMode, setViewMode] = useState('table');
  const [cardDetailsOpen, setCardDetailsOpen] = useState<Record<string, any>>({});
  const [cardStoreOrderOpen, setCardStoreOrderOpen] = useState<Record<string, any>>({});
  const [cardSizingOpen, setCardSizingOpen] = useState<Record<string, any>>({});
  const [skuVersion, setSkuVersion] = useState('v3');
  const [skuVersions, setSkuVersions] = useState(SKU_VERSIONS);
  const [isSkuVersionOpen, setIsSkuVersionOpen] = useState(false);
  const [sizingVersion, setSizingVersion] = useState('choice-a');
  const [sizingChoices, setSizingChoices] = useState(SIZING_CHOICES);
  const [isSizingVersionOpen, setIsSizingVersionOpen] = useState(false);
  const skuVersionDropdownRef = useRef<any>(null);
  const sizingVersionDropdownRef = useRef<any>(null);

  // Close version dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (skuVersionDropdownRef.current && !skuVersionDropdownRef.current.contains(e.target)) {
        setIsSkuVersionOpen(false);
      }
      if (sizingVersionDropdownRef.current && !sizingVersionDropdownRef.current.contains(e.target)) {
        setIsSizingVersionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSetFinalVersion = (versionId: any, e: any) => {
    e.stopPropagation();
    setSkuVersions((prev: any) => prev.map((v: any) => ({ ...v, isFinal: v.id === versionId })));
  };

  const handleSetFinalSizing = (choiceId: any, e: any) => {
    e.stopPropagation();
    setSizingChoices((prev: any) => prev.map((c: any) => ({ ...c, isFinal: c.id === choiceId })));
  };

  const selectedSkuVersion = skuVersions.find((v: any) => v.id === skuVersion) || skuVersions[0];
  const selectedSizingChoice = sizingChoices.find((c: any) => c.id === sizingVersion) || sizingChoices[0];

  // Apply context from OTB Analysis when navigating here
  useEffect(() => {
    if (skuContext) {
      // Set filters based on context
      if (skuContext.budgetId) {
        setBudgetFilter(skuContext.budgetId);
      }
      if (skuContext.seasonGroup) {
        setSeasonGroupFilter(skuContext.seasonGroup);
      }
      if (skuContext.season) {
        setSeasonFilter(skuContext.season);
      }
      // Use lowercase gender name to match SKU data (e.g., 'female', 'male')
      if (skuContext.gender?.name) {
        setGenderFilter(skuContext.gender.name.toLowerCase());
      }
      // Use category name to match SKU data (e.g., 'RTW', 'Accessories')
      if (skuContext.category?.name) {
        setCategoryFilter(skuContext.category.name);
      }
      // Use subCategory name to match SKU data (e.g., 'W Outerwear', 'M Bags')
      if (skuContext.subCategory?.name) {
        setSubCategoryFilter(skuContext.subCategory.name);
      }

      // Set banner info
      setContextBanner({
        budgetName: skuContext.budgetName,
        fiscalYear: skuContext.fiscalYear,
        brandName: skuContext.brandName,
        seasonGroup: skuContext.seasonGroup,
        season: skuContext.season,
        gender: skuContext.gender?.name,
        category: skuContext.category?.name,
        subCategory: skuContext.subCategory?.name,
        otbData: skuContext.otbData
      });

      // Clear context after use
      if (onContextUsed) {
        onContextUsed();
      }
    }
  }, [skuContext, onContextUsed]);

  const [skuBlocks, setSkuBlocks] = useState<any[]>([]);

  // When context is provided and data loads but no proposal blocks exist,
  // build blocks from the SKU catalog matching the context's subCategory
  useEffect(() => {
    if (contextBanner?.subCategory && skuCatalog.length > 0 && skuBlocks.length === 0 && !skuDataLoading) {
      const subCat = contextBanner.subCategory;
      const matchingItems = skuCatalog.filter((item: any) => (item.productType || '').toLowerCase() === subCat.toLowerCase());
      if (matchingItems.length > 0) {
        const genderKey = (contextBanner.gender || '').toLowerCase();
        setSkuBlocks([{
          gender: genderKey,
          category: contextBanner.category || '',
          subCategory: subCat,
          items: matchingItems.map((item: any) => ({
            ...item,
            order: 0,
            storeQty: {},
            ttlValue: 0,
            customerTarget: 'New'
          }))
        }]);
      }
    }
  }, [contextBanner, skuCatalog, skuBlocks.length, skuDataLoading]);
  const [editingCell, setEditingCell] = useState<any>(null);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sizingPopup, setSizingPopup] = useState<any>({ open: false, blockKey: null, itemIdx: null, item: null });
  const [sizingData, setSizingData] = useState<Record<string, any>>({});

  const getDefaultSizing = () => ({
    choiceA: { s0002: 2, s0004: 4, s0006: 3, s0008: 2 },
    choiceB: { s0002: 1, s0004: 3, s0006: 3, s0008: 2 },
    choiceC: { s0002: 1, s0004: 2, s0006: 2, s0008: 1 }
  });

  const getSizingKey = (blockKey: any, itemIdx: any) => `${blockKey}_${itemIdx}`;

  const getSizing = (blockKey: any, itemIdx: any) => {
    const key = getSizingKey(blockKey, itemIdx);
    return sizingData[key] || getDefaultSizing();
  };

  const updateSizing = (blockKey: any, itemIdx: any, choice: any, size: any, value: any) => {
    const key = getSizingKey(blockKey, itemIdx);
    const currentSizing = sizingData[key] || getDefaultSizing();
    setSizingData((prev: any) => ({
      ...prev,
      [key]: {
        ...currentSizing,
        [choice]: {
          ...currentSizing[choice],
          [size]: parseInt(value) || 0
        }
      }
    }));
  };

  const calculateSum = (choiceData: any): number => {
    return Object.values(choiceData).reduce((sum: any, val: any) => sum + (parseInt(val) || 0), 0) as number;
  };

  const handleOpenSizing = (blockKey: any, itemIdx: any, item: any) => {
    setSizingPopup({ open: true, blockKey, itemIdx, item });
  };

  const handleCloseSizing = () => {
    setSizingPopup({ open: false, blockKey: null, itemIdx: null, item: null });
  };

  const budgetOptions = useMemo(() => {
    const options = [{ id: 'all', label: 'All Budgets' }];
    apiBudgets.forEach((b: any) => options.push({ id: b.id, label: b.budgetName }));
    return options;
  }, [apiBudgets]);

  const genderOptions = useMemo(() => {
    const fromBlocks = skuBlocks.map((s: any) => s.gender).filter(Boolean);
    const fromMaster = masterGenders.filter(Boolean);
    const genders = new Set([...fromBlocks, ...fromMaster]);
    return ['all', ...Array.from(genders)];
  }, [skuBlocks, masterGenders]);

  const categoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter((s: any) => genderFilter === 'all' || s.gender === genderFilter)
      .map((s: any) => s.category)
      .filter(Boolean);
    const fromMaster = masterCategories.map((c: any) => c.name || c.code || '').filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, skuBlocks, masterCategories]);

  const subCategoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter((s: any) => (genderFilter === 'all' || s.gender === genderFilter)
        && (categoryFilter === 'all' || s.category === categoryFilter))
      .map((s: any) => s.subCategory)
      .filter(Boolean);
    // Also extract sub-categories from master data
    const fromMaster = masterCategories
      .flatMap((c: any) => (c.subCategories || []).map((sc: any) => sc.name || sc.code || ''))
      .filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, categoryFilter, skuBlocks, masterCategories]);

  const filteredSkuBlocks = useMemo(() => {
    return skuBlocks.filter((block: any) => {
      if (genderFilter !== 'all' && block.gender !== genderFilter) return false;
      if (categoryFilter !== 'all' && block.category !== categoryFilter) return false;
      if (subCategoryFilter !== 'all' && block.subCategory !== subCategoryFilter) return false;
      return true;
    });
  }, [genderFilter, categoryFilter, subCategoryFilter, skuBlocks]);

  const grandTotals = useMemo(() => {
    return filteredSkuBlocks.reduce((acc: any, block: any) => {
      block.items.forEach((item: any) => {
        acc.skuCount += 1;
        acc.order += (item.order || 0);
        acc.ttlValue += (item.ttlValue || 0);
        acc.srp += (item.srp || 0);
        acc.unitCost += (item.unitCost || 0);
        // Aggregate per-store quantities
        const sq = item.storeQty || {};
        Object.keys(sq).forEach((code: string) => {
          acc.storeQty[code] = (acc.storeQty[code] || 0) + (sq[code] || 0);
        });
      });
      return acc;
    }, { skuCount: 0, order: 0, storeQty: {} as Record<string, number>, ttlValue: 0, srp: 0, unitCost: 0 });
  }, [filteredSkuBlocks]);

  // Card view available when there's data to show
  const canShowCardView = filteredSkuBlocks.length > 0 && filteredSkuBlocks.some((b: any) => b.items.length > 0);

  const handleStartEdit = (cellKey: any, currentValue: any) => {
    setEditingCell(cellKey);
    setEditValue(currentValue?.toString() ?? '');
  };

  const handleSaveEdit = (cellKey: any) => {
    const value = Number(editValue);
    const nextValue = Number.isFinite(value) ? value : 0;
    const [blockKey, itemIdx, field] = cellKey.split('|');

    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const bKey = `${block.gender}_${block.category}_${block.subCategory}`;
      if (bKey !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== itemIdx) return item;
        // Handle store_XXX fields → update storeQty map
        if (field.startsWith('store_')) {
          const storeCode = field.replace('store_', '');
          const newStoreQty = { ...(item.storeQty || {}), [storeCode]: nextValue };
          return { ...item, storeQty: newStoreQty };
        }
        return { ...item, [field]: nextValue };
      });
      return { ...block, items };
    }));
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: any, cellKey: any) => {
    if (e.key === 'Enter') {
      handleSaveEdit(cellKey);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSelectChange = (blockKey: any, itemIdx: any, field: any, value: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== String(itemIdx)) return item;
        return { ...item, [field]: value };
      });
      return { ...block, items };
    }));
  };

  const handleNumberChange = (blockKey: any, itemIdx: any, field: any, value: any) => {
    const nextValue = Number(value);
    const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const bKey = `${block.gender}_${block.category}_${block.subCategory}`;
      if (bKey !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== String(itemIdx)) return item;
        // Handle store_XXX fields → update storeQty map
        if (field.startsWith('store_')) {
          const storeCode = field.replace('store_', '');
          const newStoreQty = { ...(item.storeQty || {}), [storeCode]: safeValue };
          return { ...item, storeQty: newStoreQty };
        }
        return { ...item, [field]: safeValue };
      });
      return { ...block, items };
    }));
  };

  const handleToggle = (key: any) => {
    setCollapsed((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAll = () => {
    const newState = !allCollapsed;
    setAllCollapsed(newState);
    const newCollapsed: Record<string, boolean> = {};
    filteredSkuBlocks.forEach((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      newCollapsed[key] = newState;
    });
    setCollapsed(prev => ({ ...prev, ...newCollapsed }));
  };

  const handleAddSkuRow = (blockKey: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const newItem = {
        sku: '',
        name: '',
        collectionName: '',
        color: '',
        colorCode: '',
        division: block.category || '',
        productType: block.subCategory || '',
        departmentGroup: '',
        fsr: '',
        carryForward: 'NEW',
        composition: '',
        unitCost: 0,
        importTaxPct: 0,
        srp: 0,
        wholesale: 0,
        rrp: 0,
        regionalRrp: 0,
        theme: '',
        size: '',
        order: 0,
        storeQty: {},
        ttlValue: 0,
        customerTarget: 'New',
        isNew: true
      };
      return { ...block, items: [...block.items, newItem] };
    }));
  };

  const handleSkuSelect = (blockKey: any, itemIdx: any, selectedSku: any) => {
    const skuData = skuCatalog.find((s: any) => s.sku === selectedSku);
    if (!skuData) return;

    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (idx !== itemIdx) return item;
        return {
          ...item,
          sku: skuData.sku,
          name: skuData.name,
          collectionName: skuData.collectionName,
          color: skuData.color,
          colorCode: skuData.colorCode,
          division: skuData.division,
          productType: skuData.productType,
          departmentGroup: skuData.departmentGroup,
          fsr: skuData.fsr,
          carryForward: skuData.carryForward,
          composition: skuData.composition,
          unitCost: skuData.unitCost,
          importTaxPct: skuData.importTaxPct,
          srp: skuData.srp,
          wholesale: skuData.wholesale,
          rrp: skuData.rrp,
          regionalRrp: skuData.regionalRrp,
          theme: skuData.theme,
          size: skuData.size,
          isNew: false
        };
      });
      return { ...block, items };
    }));
  };

  const handleDeleteSkuRow = (blockKey: any, itemIdx: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = `${block.gender}_${block.category}_${block.subCategory}`;
      if (key !== blockKey) return block;
      const items = block.items.filter((_: any, idx: any) => idx !== itemIdx);
      return { ...block, items };
    }));
  };

  const filteredSkuItems = useMemo(() => {
    return filteredSkuBlocks.flatMap((block: any) => {
      const blockKey = `${block.gender}_${block.category}_${block.subCategory}`;
      return block.items.map((item: any, idx: any) => ({
        block,
        blockKey,
        item,
        idx,
        key: `${blockKey}_${item.sku || 'new'}_${idx}`
      }));
    });
  }, [filteredSkuBlocks]);

  const getCardBgClass = (index: any) => {
    const style = CARD_BG_CLASSES[index % CARD_BG_CLASSES.length];
    return darkMode ? style.dark : style.light;
  };

  return (
    <div className="space-y-2 md:space-y-3">
      <div className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-2 md:mb-3 border-b backdrop-blur-sm p-2 md:p-3 ${darkMode ? 'bg-[#121212]/90 border-[#2E2E2E]' : 'bg-white/90 border-[rgba(215,183,151,0.3)]'}`}>
        <div className="flex flex-wrap items-center justify-between mb-2 gap-2">

          {/* Mobile Filter Button */}
          {isMobile && (
            <button
              onClick={openFilter}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${darkMode ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'}`}
            >
              <SlidersHorizontal size={16} />
              {t('common.filters')}
            </button>
          )}

          {/* Context Banner from OTB Analysis */}
          {contextBanner && (
            <div className={`flex flex-wrap items-center gap-3 px-3 md:px-4 py-0.5 rounded-xl border ${darkMode ? 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)]' : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.3)]'}`}>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex flex-col">
                  <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.budget')}</span>
                  <span className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{contextBanner.budgetName || 'N/A'}</span>
                </div>
                <div className={`w-px h-8 hidden md:block ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.4)]'}`}></div>
                <div className="flex flex-col">
                  <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.season')}</span>
                  <span className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{contextBanner.seasonGroup} - {contextBanner.season}</span>
                </div>
                <div className={`w-px h-8 hidden md:block ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.4)]'}`}></div>
                <div className="flex flex-col">
                  <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.category')}</span>
                  <span className={`font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{contextBanner.gender} / {contextBanner.category} / {contextBanner.subCategory}</span>
                </div>
                {contextBanner.otbData && (
                  <>
                    <div className={`w-px h-8 hidden md:block ${darkMode ? 'bg-[rgba(215,183,151,0.25)]' : 'bg-[rgba(215,183,151,0.4)]'}`}></div>
                    <div className="flex flex-col">
                      <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.totalValue')}</span>
                      <span className={`font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(contextBanner.otbData.otbProposed || 0)}</span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setContextBanner(null)}
                className={`ml-2 p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.15)]' : 'hover:bg-[rgba(215,183,151,0.2)]'}`}
                title="Dismiss"
              >
                <X size={16} className={darkMode ? 'text-[#999999]' : 'text-[#666666]'} />
              </button>
            </div>
          )}
        </div>

        {!isMobile && <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.budget')}</label>
                <select
                  value={budgetFilter}
                  onChange={(e) => setBudgetFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {budgetOptions.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.seasonGroup')}</label>
                <select
                  value={seasonGroupFilter}
                  onChange={(e) => setSeasonGroupFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {SEASON_GROUPS.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.season')}</label>
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {SEASONS.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.gender')}</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {genderOptions.map((g: any) => (
                    <option key={g} value={g}>{g === 'all' ? 'All' : g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.category')}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {categoryOptions.map((c: any) => (
                    <option key={c} value={c}>{c === 'all' ? 'All' : c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{t('skuProposal.subCategory')}</label>
                <select
                  value={subCategoryFilter}
                  onChange={(e) => setSubCategoryFilter(e.target.value)}
                  className={`w-full border rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                >
                  {subCategoryOptions.map((s: any) => (
                    <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
                  ))}
                </select>
              </div>
        </div>}

        {/* Versions + View Mode - Single Row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* SKU Version Dropdown */}
              <div className="relative" ref={skuVersionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSkuVersionOpen(!isSkuVersionOpen)}
                  className={`flex items-center gap-2 px-4 py-1 rounded-lg text-sm font-medium transition-all border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.15)]'
                      : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#333333] hover:bg-[rgba(160,120,75,0.18)]'
                  }`}
                >
                  {selectedSkuVersion?.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />}
                  <span>{selectedSkuVersion?.name || t('common.version')}</span>
                  {selectedSkuVersion?.isFinal && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A]' : 'bg-[#D7B797] text-white'}`}>FINAL</span>
                  )}
                  <ChevronDown size={14} className={`transition-transform ${isSkuVersionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSkuVersionOpen && (
                  <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full rounded-xl shadow-xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'}`}>
                    <div className={`px-3 py-0.5 border-b ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
                      <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{t('common.version')}</span>
                    </div>
                    {skuVersions.map((version: any) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => { setSkuVersion(version.id); setIsSkuVersionOpen(false); }}
                        className={`w-full px-3 py-0.5 flex items-center justify-between transition-colors ${
                          version.id === skuVersion
                            ? darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-[rgba(160,120,75,0.12)]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.05)]' : 'hover:bg-[rgba(160,120,75,0.08)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {version.isFinal
                            ? <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />
                            : <Layers size={14} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                          }
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{version.name}</span>
                              {version.isFinal && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]">FINAL</span>
                              )}
                            </div>
                            <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Created: {version.createdAt}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!version.isFinal && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => handleSetFinalVersion(version.id, e)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSetFinalVersion(version.id, e); }}
                              className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
                            >
                              {t('planning.latestVersion')}
                            </span>
                          )}
                          {version.id === skuVersion && <Check size={16} className="text-[#2A9E6A]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Divider */}
            <div className={`h-6 w-px hidden sm:block ${darkMode ? 'bg-[#2E2E2E]' : 'bg-[rgba(215,183,151,0.3)]'}`} />

            {/* Sizing Choice Dropdown */}
              <div className="relative" ref={sizingVersionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSizingVersionOpen(!isSizingVersionOpen)}
                  className={`flex items-center gap-2 px-4 py-1 rounded-lg text-sm font-medium transition-all border ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.15)]'
                      : 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#333333] hover:bg-[rgba(160,120,75,0.18)]'
                  }`}
                >
                  {selectedSizingChoice?.isFinal && <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />}
                  <span>{selectedSizingChoice?.name || t('skuProposal.sizing')}</span>
                  {selectedSizingChoice?.isFinal && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A]' : 'bg-[#D7B797] text-white'}`}>FINAL</span>
                  )}
                  <ChevronDown size={14} className={`transition-transform ${isSizingVersionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSizingVersionOpen && (
                  <div className={`absolute top-full left-0 mt-1 whitespace-nowrap w-max min-w-full rounded-xl shadow-xl border z-50 overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.3)]'}`}>
                    <div className={`px-3 py-0.5 border-b ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
                      <span className={`text-xs font-semibold uppercase tracking-wide font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{t('skuProposal.sizing')}</span>
                    </div>
                    {sizingChoices.map((choice: any) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => { setSizingVersion(choice.id); setIsSizingVersionOpen(false); }}
                        className={`w-full px-3 py-0.5 flex items-center justify-between transition-colors ${
                          choice.id === sizingVersion
                            ? darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-[rgba(160,120,75,0.12)]'
                            : darkMode ? 'hover:bg-[rgba(215,183,151,0.05)]' : 'hover:bg-[rgba(160,120,75,0.08)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {choice.isFinal
                            ? <Star size={14} className={darkMode ? 'text-[#D7B797] fill-[#D7B797]' : 'text-[#6B4D30] fill-[#6B4D30]'} />
                            : <Layers size={14} className={darkMode ? 'text-[#666666]' : 'text-[#999999]'} />
                          }
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{choice.name}</span>
                            {choice.isFinal && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]">FINAL</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!choice.isFinal && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => handleSetFinalSizing(choice.id, e)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSetFinalSizing(choice.id, e); }}
                              className={`text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${darkMode ? 'text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
                            >
                              {t('planning.latestVersion')}
                            </span>
                          )}
                          {choice.id === sizingVersion && <Check size={16} className="text-[#2A9E6A]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* SKU Count + View Mode Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                {filteredSkuItems.length} SKUs
              </span>
              <div className={`flex items-center gap-1 rounded-lg p-0.5 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(160,120,75,0.12)]'}`}>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'table'
                      ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                      : darkMode ? 'text-[#999999] hover:text-[#D7B797]' : 'text-[#666666] hover:text-[#6B4D30]'
                  }`}
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => canShowCardView && setViewMode('card')}
                  disabled={!canShowCardView}
                  title={!canShowCardView ? 'Add SKUs to enable card view' : 'View SKUs as cards'}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'card'
                      ? darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797] shadow-sm' : 'bg-white text-[#6B4D30] shadow-sm'
                      : darkMode ? 'text-[#999999] hover:text-[#D7B797]' : 'text-[#666666] hover:text-[#6B4D30]'
                  } ${!canShowCardView ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Card
                </button>
              </div>
            </div>
        </div>
      </div>

      {filteredSkuBlocks.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
          <Package size={36} className={`mx-auto mb-3 ${darkMode ? 'text-[#666666]' : 'text-[rgba(215,183,151,0.5)]'}`} />
          <p className={`font-medium font-['Montserrat'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{t('skuProposal.noSkuData')}</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Try adjusting the filters above</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSkuItems.map(({ block, blockKey, item, idx, key }, cardIdx) => {
            const detailsOpen = !!cardDetailsOpen[key];
            const sizingOpen = !!cardSizingOpen[key];
            return (
              <div key={key} className={`rounded-2xl border p-4 ${getCardBgClass(cardIdx)}`}>
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getDemoImageSvg(block.subCategory, item.sku)}
                      alt={item.name || item.sku}
                      className="w-12 h-12 rounded-xl border object-cover"
                      style={{ borderColor: darkMode ? '#2E2E2E' : 'rgba(215,183,151,0.25)' }}
                    />
                    <div>
                      <div className={`text-sm font-semibold ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>
                        <span className="font-['JetBrains_Mono']">{item.sku || 'New SKU'}</span> <span className={darkMode ? 'text-[#999999]' : 'text-[#666666]'}>•</span> {item.name || 'Select SKU'}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                        {block.gender} • {block.category} • {block.subCategory}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCardDetailsOpen((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {detailsOpen ? t('skuProposal.hideDetails') : t('skuProposal.showDetails')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardStoreOrderOpen((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {cardStoreOrderOpen[key] ? t('skuProposal.hideStores') : t('skuProposal.storeOrder')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardSizingOpen((prev: any) => ({ ...prev, [key]: !prev[key] }))}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {sizingOpen ? t('skuProposal.hideSizing') : t('skuProposal.sizing')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkuRow(blockKey, idx)}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#666666] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'}`}
                      title={t('proposal.deleteSku')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {item.isNew && (
                  <div className="mt-3">
                    <select
                      value={item.sku}
                      onChange={(e) => handleSkuSelect(blockKey, idx, e.target.value)}
                      className={`w-full px-3 py-0.5 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 font-['JetBrains_Mono'] ${darkMode ? 'border-[#2A9E6A] bg-[#121212] text-[#F2F2F2] focus:ring-[rgba(42,158,106,0.3)]' : 'border-[#127749] bg-white text-[#333333] focus:ring-[rgba(18,119,73,0.3)]'}`}
                    >
                      <option value="">{t('proposal.selectSku')}</option>
                      {skuCatalog.map((sku: any) => (
                        <option key={sku.sku} value={sku.sku}>
                          {sku.sku} - {sku.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Rex/TTP/Order/Total Value summary removed — info shown in Store Order table below */}

                {detailsOpen && (
                  <div className={`mt-4 rounded-xl border p-4 ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Product type</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.productType}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Theme</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.theme}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Color</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.color}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Composition</span>
                        <div className={`font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.composition}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Unit cost</span>
                        <div className={`font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{formatCurrency(item.unitCost)}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>SRP</span>
                        <div className={`font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.srp)}</div>
                      </div>
                      <div>
                        <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>Customer target</span>
                        <select
                          value={item.customerTarget}
                          onChange={(e) => handleSelectChange(blockKey, idx, 'customerTarget', e.target.value)}
                          className={`mt-1 w-full px-3 py-0.5 rounded-lg border text-sm focus:outline-none focus:ring-2 ${darkMode ? 'bg-[#121212] border-[#2E2E2E] text-[#F2F2F2] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]' : 'bg-white border-[rgba(215,183,151,0.3)] text-[#333333] focus:ring-[rgba(215,183,151,0.3)] focus:border-[#D7B797]'}`}
                        >
                          <option value="New">New</option>
                          <option value="Existing">Existing</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {cardStoreOrderOpen[key] && (
                  <div className={`mt-4 rounded-xl border overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
                    <div className={`px-4 py-0.5 text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797] bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] bg-[rgba(160,120,75,0.12)]'}`}>
                      Store Order
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={darkMode ? 'bg-[#121212] text-[#999999]' : 'bg-[rgba(160,120,75,0.12)] text-[#666666]'}>
                            <th className="px-3 py-0.5 text-left">Store</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">ORDER</th>
                            <th className="px-3 py-0.5 text-right font-['JetBrains_Mono']">TTL VALUE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stores.map((st: any, si: number) => {
                            const storeVal = (item.storeQty || {})[st.code] || 0;
                            const colors = ['bg-[#D7B797]', 'bg-[#127749]', 'bg-[#58A6FF]', 'bg-[#A371F7]', 'bg-[#E3B341]'];
                            return (
                              <tr key={st.code} className={`border-t ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'}`}>
                                <td className={`px-3 py-0.5 ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-700'}`}>
                                  <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${colors[si % colors.length]}`} />{st.code}</span>
                                </td>
                                <td className="px-3 py-0.5 text-center">
                                  <div className="relative group inline-block">
                                    <input
                                      type="number"
                                      min="0"
                                      value={storeVal}
                                      onChange={(e) => handleNumberChange(blockKey, idx, `store_${st.code}`, e.target.value)}
                                      className={`w-16 pl-4 text-center font-['JetBrains_Mono'] text-sm rounded-lg border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${
                                        darkMode
                                          ? 'bg-[#121212] border-[rgba(215,183,151,0.3)] text-[#F2F2F2] focus:border-[#D7B797]'
                                          : 'bg-white border-[rgba(215,183,151,0.4)] text-gray-800 focus:border-[#D7B797]'
                                      }`}
                                    />
                                    <Pencil size={8} className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A6340]/30" />
                                  </div>
                                </td>
                                <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(storeVal * (item.srp || 0))}</td>
                              </tr>
                            );
                          })}
                          <tr className={`border-t-2 ${darkMode ? 'border-[#D7B797]/30 bg-[rgba(215,183,151,0.05)]' : 'border-[#D7B797]/40 bg-[rgba(160,120,75,0.12)]'}`}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{t('skuProposal.total')}</td>
                            <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{item.order || 0}</td>
                            <td className={`px-3 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-800'}`}>{formatCurrency(item.ttlValue || (item.order || 0) * (item.srp || 0))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {sizingOpen && (
                  <div className={`mt-4 rounded-xl border overflow-hidden ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
                    <div className={`px-4 py-0.5 text-xs font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797] bg-[rgba(215,183,151,0.1)]' : 'text-[#6B4D30] bg-[rgba(160,120,75,0.12)]'}`}>
                      Sizing
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={darkMode ? 'bg-[rgba(215,183,151,0.08)] text-[#D7B797]' : 'bg-[rgba(160,120,75,0.12)] text-[#6B4D30]'}>
                            <th className="px-3 py-0.5 text-left font-['Montserrat']">{item.productType}</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0002</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0004</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0006</th>
                            <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">0008</th>
                            <th className="px-3 py-0.5 text-center font-['Montserrat']">Sum</th>
                          </tr>
                        </thead>
                        <tbody className={darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E]' : 'border-t border-[rgba(215,183,151,0.2)]'}>
                            <td className="px-3 py-0.5">% Sales mix</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">6%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">28%</td>
                            <td className="px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono']">100%</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E]' : 'border-t border-[rgba(215,183,151,0.2)]'}>
                            <td className="px-3 py-0.5">% ST</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">50%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">43%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">30%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">63%</td>
                            <td className="px-3 py-0.5 text-center font-['JetBrains_Mono']">-</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E] bg-[rgba(215,183,151,0.08)]' : 'border-t border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.08)]'}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>Choice A</td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-1 py-0.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceA[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceA', size, e.target.value)}
                                  className={`w-10 text-center font-['JetBrains_Mono'] text-xs rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#D7B797]' : 'bg-emerald-50 border-emerald-200 text-[#6B4D30]'}`}
                                />
                              </td>
                            ))}
                            <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{calculateSum(getSizing(blockKey, idx).choiceA)}</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E] bg-[rgba(42,158,106,0.08)]' : 'border-t border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.03)]'}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice B</td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-1 py-0.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceB[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceB', size, e.target.value)}
                                  className={`w-10 text-center font-['JetBrains_Mono'] text-xs rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                                />
                              </td>
                            ))}
                            <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{calculateSum(getSizing(blockKey, idx).choiceB)}</td>
                          </tr>
                          <tr className={darkMode ? 'border-t border-[#2E2E2E] bg-[rgba(42,158,106,0.05)]' : 'border-t border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.02)]'}>
                            <td className={`px-3 py-0.5 font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice C</td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-1 py-0.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={getSizing(blockKey, idx).choiceC[size]}
                                  onChange={(e) => updateSizing(blockKey, idx, 'choiceC', size, e.target.value)}
                                  className={`w-10 text-center font-['JetBrains_Mono'] text-xs rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                                />
                              </td>
                            ))}
                            <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{calculateSum(getSizing(blockKey, idx).choiceC)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add SKU Card */}
          {filteredSkuBlocks.length > 0 && (
            <button
              onClick={() => {
                const firstBlock = filteredSkuBlocks[0];
                const blockKey = `${firstBlock.gender}_${firstBlock.category}_${firstBlock.subCategory}`;
                handleAddSkuRow(blockKey);
              }}
              className={`rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] ${
                darkMode
                  ? 'border-[rgba(215,183,151,0.3)] hover:border-[#D7B797] hover:bg-[rgba(215,183,151,0.05)]'
                  : 'border-[rgba(215,183,151,0.4)] hover:border-[#8A6340] hover:bg-[rgba(215,183,151,0.08)]'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-[rgba(215,183,151,0.2)]'
              }`}>
                <Plus size={24} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
              </div>
              <span className={`text-sm font-semibold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                Add New SKU
              </span>
              <span className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>
                Click to add a new SKU to {filteredSkuBlocks[0]?.subCategory}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rail Controls */}
          <div className={`flex flex-wrap items-center justify-between px-4 py-2 rounded-xl border ${darkMode ? 'bg-[#1A1A1A] border-[#2E2E2E]' : 'bg-[rgba(160,120,75,0.08)] border-[rgba(215,183,151,0.2)]'}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAll}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${darkMode ? 'border-[rgba(215,183,151,0.25)] text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
              >
                <ChevronDown size={12} className={`transition-transform ${allCollapsed ? '-rotate-90' : ''}`} />
                {allCollapsed ? 'Expand All' : 'Collapse All'}
              </button>
              <span className={`text-xs ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
                {filteredSkuBlocks.length} Rails • {grandTotals.skuCount} SKUs
              </span>
            </div>
            <div className={`flex items-center gap-4 text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>
              <span>Order: <span className={`font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.order}</span></span>
              {stores.map((s: any) => (
                <span key={s.code}>{s.code}: <span className={`font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.storeQty[s.code] || 0}</span></span>
              ))}
              <span>Value: <span className={`font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(grandTotals.ttlValue)}</span></span>
            </div>
          </div>

          {filteredSkuBlocks.map((block: any) => {
            const key = `${block.gender}_${block.category}_${block.subCategory}`;
            const isCollapsed = collapsed[key];
            return (
              <div key={key} className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-[rgba(215,183,151,0.2)]'}`}>
                <button
                  type="button"
                  onClick={() => handleToggle(key)}
                  className={`w-full flex items-center gap-0 ${
                    darkMode
                      ? 'bg-[rgba(215,183,151,0.12)] border-b border-[rgba(215,183,151,0.25)]'
                      : 'bg-[rgba(215,183,151,0.18)] border-b border-[rgba(215,183,151,0.3)]'
                  }`}
                >
                  <div className={`w-1.5 self-stretch rounded-l-xl ${darkMode ? 'bg-[#D7B797]' : 'bg-[#8A6340]'}`} />
                  <div className="flex items-center gap-3 px-4 py-2 flex-1">
                    <ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`} />
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${darkMode ? 'text-[#999999]' : 'text-[#8A6340]'}`}>RAIL</span>
                        <span className={`font-semibold text-sm ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{block.subCategory}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#999999]' : 'bg-[rgba(160,120,75,0.12)] text-[#6B5B4D]'}`}>
                          {block.items.length} SKUs
                        </span>
                      </div>
                      <div className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-[#8A6340]'}`}>
                        {block.gender} • {block.category}
                      </div>
                    </div>
                    <div className={`hidden md:flex items-center gap-4 text-xs font-['JetBrains_Mono'] ${darkMode ? 'text-[#999999]' : 'text-[#6B5B4D]'}`}>
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Order</span>
                        <span className={`font-semibold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{block.items.reduce((s: number, i: any) => s + (i.order || 0), 0)}</span>
                      </div>
                      {stores.map((st: any) => (
                        <div key={st.code} className="flex flex-col items-center">
                          <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{st.code}</span>
                          <span className="font-semibold">{block.items.reduce((s: number, i: any) => s + ((i.storeQty || {})[st.code] || 0), 0)}</span>
                        </div>
                      ))}
                      <div className={`h-6 w-px ${darkMode ? 'bg-[rgba(215,183,151,0.2)]' : 'bg-[rgba(215,183,151,0.4)]'}`} />
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Value</span>
                        <span className={`font-semibold ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(block.items.reduce((s: number, i: any) => s + (i.ttlValue || 0), 0))}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    {(() => {
                      const hlBg = darkMode ? 'bg-[rgba(215,183,151,0.12)]' : 'bg-[rgba(160,120,75,0.1)]';
                      const hlLabel = darkMode ? 'bg-[#1f1a14]' : 'bg-[#ede4d8]';
                      const normLabel = darkMode ? 'bg-[#121212]' : 'bg-white';
                      const labelBase = `px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 cursor-pointer select-none transition-colors`;
                      const labelBorder = darkMode ? '!border-r-[#555]' : '!border-r-[rgba(160,120,75,0.4)]';
                      const labelColor = darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]';
                      const isHl = (rowId: string) => highlightedRow === `${key}_${rowId}`;
                      const toggleHl = (rowId: string) => setHighlightedRow(prev => prev === `${key}_${rowId}` ? null : `${key}_${rowId}`);
                      const trCls = (rowId: string, extra?: string) => `${isHl(rowId) ? hlBg : ''} ${extra || ''}`;
                      const tdLabel = (rowId: string, extra?: string) => `${labelBase} ${labelColor} ${isHl(rowId) ? hlLabel : normLabel} ${labelBorder} ${extra || ''}`;
                      return (
                    <table className={`w-full text-xs border-collapse ${darkMode ? '[&_td]:border-[#2E2E2E]' : '[&_td]:border-[rgba(215,183,151,0.2)]'} [&_td]:border`}>
                      <tbody>
                        {/* Image row */}
                        <tr className={trCls('image')}>
                          <td className={tdLabel('image', 'py-2')} onClick={() => toggleHl('image')}>Image</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-2 text-center min-w-[140px]">
                              <img
                                src={getDemoImageSvg(block.subCategory, item.sku)}
                                alt={item.name || item.sku}
                                className="w-16 h-16 mx-auto rounded-lg border object-cover"
                                style={{ borderColor: darkMode ? '#2E2E2E' : 'rgba(215,183,151,0.25)' }}
                              />
                            </td>
                          ))}
                        </tr>
                        {/* SKU row */}
                        <tr className={trCls('sku')}>
                          <td className={tdLabel('sku')} onClick={() => toggleHl('sku')}>SKU</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>
                              {item.isNew ? (
                                <select
                                  value={item.sku}
                                  onChange={(e) => handleSkuSelect(key, idx, e.target.value)}
                                  className={`w-full px-1 py-0.5 rounded border text-xs font-['JetBrains_Mono'] ${darkMode ? 'border-[#2A9E6A] bg-[#121212] text-[#F2F2F2]' : 'border-[#127749] bg-white text-[#333333]'}`}
                                >
                                  <option value="">{t('proposal.selectSku')}</option>
                                  {skuCatalog.map((sku: any) => (
                                    <option key={sku.sku} value={sku.sku}>{sku.sku}</option>
                                  ))}
                                </select>
                              ) : item.sku}
                            </td>
                          ))}
                        </tr>
                        {/* Name row */}
                        <tr className={trCls('name')}>
                          <td className={tdLabel('name')} onClick={() => toggleHl('name')}>Name</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{item.name}</td>
                          ))}
                        </tr>
                        {/* Product Type (L3) row */}
                        <tr className={trCls('productType')}>
                          <td className={tdLabel('productType')} onClick={() => toggleHl('productType')}>Product Type (L3)</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.productType}</td>
                          ))}
                        </tr>
                        {/* Theme row */}
                        <tr className={trCls('theme')}>
                          <td className={tdLabel('theme')} onClick={() => toggleHl('theme')}>Theme</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.theme}</td>
                          ))}
                        </tr>
                        {/* Color row */}
                        <tr className={trCls('color')}>
                          <td className={tdLabel('color')} onClick={() => toggleHl('color')}>Color</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`}>{item.color}</td>
                          ))}
                        </tr>
                        {/* Composition row */}
                        <tr className={trCls('composition')}>
                          <td className={tdLabel('composition')} onClick={() => toggleHl('composition')}>Composition</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center max-w-[160px] ${darkMode ? 'text-[#999999]' : 'text-[#666666]'}`} title={item.composition}>{item.composition}</td>
                          ))}
                        </tr>
                        {/* Unit cost row */}
                        <tr className={trCls('unitCost')}>
                          <td className={tdLabel('unitCost')} onClick={() => toggleHl('unitCost')}>Unit cost</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>{formatCurrency(item.unitCost)}</td>
                          ))}
                        </tr>
                        {/* SRP row */}
                        <tr className={trCls('srp')}>
                          <td className={tdLabel('srp')} onClick={() => toggleHl('srp')}>SRP</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-medium font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.srp)}</td>
                          ))}
                        </tr>
                        {/* Order row - always highlighted + click highlight */}
                        <tr className={trCls('order', darkMode ? 'bg-[rgba(215,183,151,0.06)]' : 'bg-[rgba(160,120,75,0.06)]')}>
                          <td className={`${labelBase} font-bold cursor-pointer select-none transition-colors ${labelBorder} ${darkMode ? 'text-[#D7B797]' : 'text-[#c0392b]'} ${isHl('order') ? hlLabel : (darkMode ? 'bg-[#1a1714]' : 'bg-[#f5efe8]')}`} onClick={() => toggleHl('order')}>Order</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797]' : 'text-[#c0392b]'}`}>{item.order}</td>
                          ))}
                        </tr>
                        {/* Dynamic store rows */}
                        {stores.map((st: any) => (
                          <tr key={st.code} className={trCls(`store_${st.code}`)}>
                            <td className={tdLabel(`store_${st.code}`)} onClick={() => toggleHl(`store_${st.code}`)}>{st.code}</td>
                            {block.items.map((item: any, idx: number) => {
                              const storeKey = `${key}|${idx}|store_${st.code}`;
                              const isEditingStore = editingCell === storeKey;
                              const storeVal = (item.storeQty || {})[st.code] || 0;
                              return (
                                <td key={idx} className="px-3 py-1.5 text-center">
                                  {isEditingStore ? (
                                    <div className="relative group inline-block">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => handleSaveEdit(storeKey)}
                                        onKeyDown={(e) => handleKeyDown(e, storeKey)}
                                        className={`w-14 pl-4 py-0.5 text-center border-2 rounded-md text-xs font-semibold font-['JetBrains_Mono'] ${darkMode ? 'border-[#D7B797] bg-[#121212] text-[#F2F2F2]' : 'border-[#D7B797] bg-white text-[#333333]'}`}
                                        autoFocus
                                      />
                                      <Pencil size={8} className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A6340]/30" />
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(storeKey, storeVal)}
                                      className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono'] transition-colors ${darkMode ? 'text-[#F2F2F2] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#333333] hover:bg-[rgba(160,120,75,0.12)]'}`}
                                    >
                                      {storeVal}
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* TTL value row - always highlighted + click highlight */}
                        <tr className={trCls('ttlValue', darkMode ? 'bg-[rgba(215,183,151,0.06)]' : 'bg-[rgba(160,120,75,0.06)]')}>
                          <td className={`${labelBase} font-bold cursor-pointer select-none transition-colors ${labelBorder} ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} ${isHl('ttlValue') ? hlLabel : (darkMode ? 'bg-[#1a1714]' : 'bg-[#f5efe8]')}`} onClick={() => toggleHl('ttlValue')}>TTL value</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(item.ttlValue || (item.order * (item.srp || 0)))}</td>
                          ))}
                        </tr>
                        {/* Customer Target row */}
                        <tr className={trCls('customerTarget')}>
                          <td className={tdLabel('customerTarget')} onClick={() => toggleHl('customerTarget')}>Customer Target</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1.5 text-center">
                              <select
                                value={item.customerTarget}
                                onChange={(e) => handleSelectChange(key, idx, 'customerTarget', e.target.value)}
                                className={`px-1.5 py-0.5 rounded-md border text-xs ${darkMode ? 'border-[#2E2E2E] bg-[#1A1A1A] text-[#F2F2F2]' : 'border-[rgba(215,183,151,0.3)] bg-white text-[#333333]'}`}
                              >
                                <option value="New">New</option>
                                <option value="Existing">Existing</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                        {/* Actions row */}
                        <tr>
                          <td className={`px-3 py-1.5 sticky left-0 z-10 ${darkMode ? 'bg-[#121212] !border-r-[#555]' : 'bg-white !border-r-[rgba(160,120,75,0.4)]'}`}></td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={() => handleOpenSizing(key, idx, item)} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-[#999999] hover:text-[#D7B797] hover:bg-[rgba(215,183,151,0.1)]' : 'text-[#666666] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`} title="Sizing"><Ruler size={14} /></button>
                                <button type="button" onClick={() => handleDeleteSkuRow(key, idx)} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-[#999999] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]' : 'text-[#666666] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'}`} title={t('proposal.deleteSku')}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                      );
                    })()}
                    {/* Add new SKU button */}
                    <div className={`border-t border-dashed px-3 py-2 ${darkMode ? 'border-[#2E2E2E] bg-[rgba(215,183,151,0.03)]' : 'border-[rgba(215,183,151,0.3)] bg-[rgba(215,183,151,0.03)]'}`}>
                      <button
                        type="button"
                        onClick={() => handleAddSkuRow(key)}
                        className={`w-full flex items-center justify-center gap-2 py-1 text-xs rounded-lg transition-colors border border-dashed ${darkMode ? 'text-[#999999] hover:text-[#D7B797] hover:bg-[rgba(215,183,151,0.08)] border-[#2E2E2E]' : 'text-[#666666] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.3)]'}`}
                      >
                        <Plus size={14} />
                        <span>Add new SKU</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Total */}
          {filteredSkuBlocks.length > 0 && (
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-[#121212] border-[#D7B797]/30' : 'bg-white border-[#D7B797]/40'}`}>
              <div className={`flex items-center gap-0 ${darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-[rgba(215,183,151,0.25)]'}`}>
                <div className={`w-1.5 self-stretch rounded-l-xl ${darkMode ? 'bg-[#2A9E6A]' : 'bg-[#127749]'}`} />
                <div className="flex flex-wrap items-center justify-between flex-1 px-4 py-2.5 gap-3">
                  <span className={`text-xs font-semibold font-['Montserrat'] uppercase tracking-wide ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>
                    GRAND TOTAL — {filteredSkuBlocks.length} Rails • {grandTotals.skuCount} SKUs
                  </span>
                  <div className="flex items-center gap-5 text-xs font-['JetBrains_Mono']">
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Order</span>
                      <span className={`font-bold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.order}</span>
                    </div>
                    {stores.map((st: any) => (
                      <div key={st.code} className="flex flex-col items-center">
                        <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>{st.code}</span>
                        <span className={`font-bold ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{grandTotals.storeQty[st.code] || 0}</span>
                      </div>
                    ))}
                    <div className={`h-6 w-px ${darkMode ? 'bg-[rgba(215,183,151,0.3)]' : 'bg-[rgba(215,183,151,0.5)]'}`} />
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-['Montserrat'] ${darkMode ? 'text-[#666666]' : 'text-[#999999]'}`}>Total Value</span>
                      <span className={`font-bold text-sm ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>{formatCurrency(grandTotals.ttlValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sizing Popup Modal */}
      {sizingPopup.open && sizingPopup.item && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className={`rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${darkMode ? 'bg-[rgba(215,183,151,0.1)] border-b border-[rgba(215,183,151,0.2)]' : 'bg-[rgba(160,120,75,0.18)] border-b border-[rgba(215,183,151,0.3)]'}`}>
              <div>
                <h3 className={`text-lg font-bold font-['Montserrat'] ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>{sizingPopup.item.productType}</h3>
                <p className={`text-sm ${darkMode ? 'text-[#999999]' : 'text-[#6B5B4D]'}`}>
                  <span className="font-['JetBrains_Mono']">{sizingPopup.item.sku}</span> - {sizingPopup.item.name}
                </p>
              </div>
              <button
                onClick={handleCloseSizing}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[rgba(215,183,151,0.15)]' : 'hover:bg-[rgba(215,183,151,0.2)]'}`}
              >
                <X size={20} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
              </button>
            </div>

            {/* Sizing Table */}
            <div className="p-3 md:p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={darkMode ? 'bg-[rgba(215,183,151,0.15)] text-[#D7B797]' : 'bg-[rgba(215,183,151,0.2)] text-[#6B4D30]'}>
                      <th className="px-4 py-0.5 text-left font-semibold font-['Montserrat']">{sizingPopup.item.productType}</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0002</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0004</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0006</th>
                      <th className="px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono']">0008</th>
                      <th className={`px-4 py-0.5 text-center font-semibold font-['Montserrat'] ${darkMode ? 'bg-[rgba(215,183,151,0.2)]' : 'bg-[rgba(215,183,151,0.25)]'}`}>Sum</th>
                    </tr>
                  </thead>
                  <tbody className={darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E] bg-[#1A1A1A]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.08)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>% Sales mix</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">6%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">33%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">28%</td>
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'bg-[rgba(215,183,151,0.08)]' : 'bg-[rgba(160,120,75,0.12)]'}`}>100%</td>
                    </tr>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E]' : 'border-b border-[rgba(215,183,151,0.2)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-[#333333]'}`}>% ST</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">50%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">43%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">30%</td>
                      <td className="px-4 py-0.5 text-center font-['JetBrains_Mono']">63%</td>
                      <td className={`px-4 py-0.5 text-center font-['JetBrains_Mono'] ${darkMode ? 'text-[#666666] bg-[rgba(215,183,151,0.08)]' : 'text-[#999999] bg-[rgba(160,120,75,0.12)]'}`}>-</td>
                    </tr>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E] bg-[rgba(215,183,151,0.08)]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.12)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'}`}>Choice A:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                        <td key={size} className="px-2 py-0.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceA', size, e.target.value)}
                            className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#D7B797]' : 'bg-emerald-50 border-emerald-200 text-[#6B4D30]'}`}
                          />
                        </td>
                      ))}
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#D7B797] bg-[rgba(215,183,151,0.15)]' : 'text-[#6B4D30] bg-[rgba(215,183,151,0.2)]'}`}>{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceA)}</td>
                    </tr>
                    <tr className={darkMode ? 'border-b border-[#2E2E2E] bg-[rgba(42,158,106,0.08)]' : 'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.05)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice B:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                        <td key={size} className="px-2 py-0.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceB[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceB', size, e.target.value)}
                            className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                          />
                        </td>
                      ))}
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A] bg-[rgba(42,158,106,0.15)]' : 'text-[#127749] bg-[rgba(18,119,73,0.1)]'}`}>{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceB)}</td>
                    </tr>
                    <tr className={darkMode ? 'bg-[rgba(42,158,106,0.05)]' : 'bg-[rgba(18,119,73,0.03)]'}>
                      <td className={`px-4 py-0.5 font-medium ${darkMode ? 'text-[#2A9E6A]' : 'text-[#127749]'}`}>Choice C:</td>
                      {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                        <td key={size} className="px-2 py-0.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceC[size]}
                            onChange={(e) => updateSizing(sizingPopup.blockKey, sizingPopup.itemIdx, 'choiceC', size, e.target.value)}
                            className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${darkMode ? 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)] text-[#2A9E6A]' : 'bg-emerald-50 border-emerald-200 text-[#127749]'}`}
                          />
                        </td>
                      ))}
                      <td className={`px-4 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${darkMode ? 'text-[#2A9E6A] bg-[rgba(42,158,106,0.1)]' : 'text-[#127749] bg-[rgba(18,119,73,0.08)]'}`}>{calculateSum(getSizing(sizingPopup.blockKey, sizingPopup.itemIdx).choiceC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseSizing}
                  className={`px-4 py-0.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-[#999999] hover:bg-[rgba(215,183,151,0.1)] hover:text-[#D7B797]' : 'text-[#666666] hover:bg-[rgba(160,120,75,0.12)] hover:text-[#6B4D30]'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseSizing}
                  className={`px-4 py-0.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${darkMode ? 'bg-[#D7B797] text-[#0A0A0A] hover:bg-[#C4A584]' : 'bg-[#D7B797] text-[#333333] hover:bg-[#C4A584]'}`}
                >
                  Save Sizing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilter}
        filters={[
          {
            key: 'gender',
            label: 'Gender',
            type: 'single',
            options: genderOptions.filter((g: any) => g !== 'all').map((g: any) => ({ label: g, value: g })),
          },
          {
            key: 'category',
            label: 'Category',
            type: 'single',
            options: categoryOptions.filter((c: any) => c !== 'all').map((c: any) => ({ label: c, value: c })),
          },
          {
            key: 'subCategory',
            label: 'Sub-Category',
            type: 'single',
            options: subCategoryOptions.filter((sc: any) => sc !== 'all').map((sc: any) => ({ label: sc, value: sc })),
          },
          {
            key: 'seasonGroup',
            label: t('otbAnalysis.seasonGroup'),
            type: 'single',
            options: SEASON_GROUPS.filter((s: any) => s.id !== 'all').map((s: any) => ({ label: s.label, value: s.id })),
          },
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          setGenderFilter((mobileFilterValues.gender as string) || 'all');
          setCategoryFilter((mobileFilterValues.category as string) || 'all');
          setSubCategoryFilter((mobileFilterValues.subCategory as string) || 'all');
          setSeasonGroupFilter((mobileFilterValues.seasonGroup as string) || 'all');
        }}
        onReset={() => {
          setMobileFilterValues({});
          setGenderFilter('all');
          setCategoryFilter('all');
          setSubCategoryFilter('all');
          setSeasonGroupFilter('all');
        }}
      />
    </div>
  );
};

export default SKUProposalScreen;
