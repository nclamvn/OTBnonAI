# RRI-UX AUDIT REPORT — OTBnonAI
**Date:** 2026-02-23
**Methodology:** RRI-UX v1.0 (5 Personas × 7 Dimensions × 8 Flow Physics Axes)
**Total Issues Found:** 112

---

## PHASE 3: SCORED UX MATRIX

### Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | 13 | BROKEN/MISSING — Fix immediately |
| **P1** | 43 | Universal FRICTION — Fix this sprint |
| **P2** | 46 | Common FRICTION — Fix next sprint |
| **P3** | 4 | Rare/Enhancement — Backlog |
| **FLOW** | 6 | Already working well |
| **TOTAL** | 112 | |

### P0 Issues (Fix Immediately)

| ID | Screen | Persona | Issue | Type |
|----|--------|---------|-------|------|
| BAS-U2-02 | BudgetAllocate | 🏃 Speed | Allocate footer NOT sticky — CTA scrolls away | BROKEN |
| SKU-U4-02 | SKUProposal | 🏃 Speed | Submit Ticket CTA not sticky — lost on scroll | BROKEN |
| TKT-U5-01 | TicketScreen | 🏃 Speed | No bulk approve/reject for pending tickets | MISSING |
| LOGIN-U1-02 | Login | 👁️ First | "Forgot password?" is dead link | BROKEN |
| BUDGET-U1-08 | BudgetMgmt | 👁️ First | Budget name looks clickable but has no onClick | BROKEN |
| SKU-U1-18 | SKUProposal | 👁️ First | Empty SKU catalog shows blank screen | MISSING |
| TICKET-U1-20 | TicketScreen | 👁️ First | Error duplicates message, no Retry button | BROKEN |
| CROSS-U1-24 | HomeScreen | 👁️ First | No "Getting Started" for first-run zero-data | MISSING |
| BAS-U2-01 | BudgetAllocate | 📊 Data | No sticky/frozen first column — row labels lost | BROKEN |
| PDP-U6-02 | ProposalDetail | 📊 Data | No frozen first column in SKU table | BROKEN |
| BUDGET-ALLOCATE-U2-1 | BudgetAllocate | 🔄 Multi | Two-tab concurrent edit overwrites silently | BROKEN |
| FAB-U11-011 | MobileBottomNav | 📱 Field | FAB hidden behind bottom nav bar | BROKEN |
| HOME-U5-005 | App-wide | 📱 Field | No offline/network status indicator | MISSING |
| HOME-U4-004 | HomeScreen | 📱 Field | Chart layout shift on 3G — no skeleton | BROKEN |

### UX Coverage Matrix (7 Dimensions)

| Dimension | Issues | ✅ FLOW | ⚠️ FRICTION | ❌ BROKEN | 🔲 MISSING | Score |
|-----------|--------|---------|-------------|----------|-----------|-------|
| U1: Flow Direction | 22 | 6 | 10 | 3 | 3 | 27% 🔴 |
| U2: Info Hierarchy | 14 | 3 | 8 | 1 | 2 | 21% 🔴 |
| U3: Cognitive Load | 10 | 4 | 4 | 0 | 2 | 40% 🔴 |
| U4: Feedback & State | 18 | 4 | 7 | 3 | 4 | 22% 🔴 |
| U5: Error Recovery | 12 | 2 | 5 | 3 | 2 | 17% 🔴 |
| U6: Accessibility | 16 | 2 | 12 | 1 | 1 | 13% 🔴 |
| U7: Context Preserve | 20 | 3 | 12 | 2 | 3 | 15% 🔴 |
| **TOTAL** | **112** | **24** | **58** | **13** | **17** | **21% 🔴** |

**Current UX Score: 21% FLOW — 🔴 RED (Block Release)**
**Target: ≥ 85% FLOW rate per dimension**

### Flow Physics Axes Breakdown

| Axis | Issues | Most Violated By |
|------|--------|------------------|
| 📏 SCROLL | 18 | No sticky headers (8 screens), no sticky CTAs |
| 🖱️ CLICK DEPTH | 8 | Row not clickable, hidden actions, collapsed nav |
| 👁️ EYE TRAVEL | 6 | Icon-only buttons, no labels |
| 🧠 DECISION LOAD | 5 | No progressive disclosure, no onboarding |
| 🔙 RETURN PATH | 7 | No undo, dead links, no error guidance |
| 📐 VIEWPORT | 12 | CTAs below fold, no frozen columns |
| ⏱️ TIME TO ACTION | 8 | No shortcuts, no auto-advance, slow loading |
| 🔄 TASK SWITCH | 14 | Filter state lost, no session persistence |

---

## PHASE 4: FIX PLAN

### Batch 1: P0 BROKEN (13 fixes)
Priority order based on user impact and cross-persona frequency.

### Batch 2: P1 Universal FRICTION (43 fixes)
Grouped by systemic patterns to maximize code reuse.

### Systemic Fix Patterns (affect multiple issues)

1. **Sticky `<thead>` for all data tables** — Fixes 8 issues across BMS, BAS, OTB, SKU, TKT, PDP, OCS, MDS
2. **sessionStorage filter/state persistence** — Fixes 10+ issues across OTB, SKU, TKT, BMS, BAS
3. **Touch target minimum 44px** — Fixes 8 issues across BottomNav, FilterChips, Sidebar, Budget forms
4. **Toast feedback for all save/submit actions** — Fixes 4 issues
5. **Column sort wiring on all tables** — Fixes 6 issues (dead sort code in BMS, missing everywhere else)

---

## DETAILED ISSUES BY PERSONA

### 🏃 Speed Runner (27 issues)
- P0: 3 (BAS-U2-02, SKU-U4-02, TKT-U5-01)
- P1: 12
- P2: 10
- P3: 2

### 👁️ First-Timer (24 issues)
- P0: 5 (LOGIN-U1-02, BUDGET-U1-08, SKU-U1-18, TICKET-U1-20, CROSS-U1-24)
- P1: 11
- P2: 6
- P3: 2

### 📊 Data Scanner (26 issues)
- P0: 2 (BAS-U2-01, PDP-U6-02)
- P1: 11
- P2: 12
- P3: 1

### 🔄 Multi-Tasker (20 issues)
- P0: 1 (BUDGET-ALLOCATE-U2-1)
- P1: 9
- P2: 9
- P3: 1

### 📱 Field Worker (15 issues)
- P0: 3 (FAB-U11-011, HOME-U5-005, HOME-U4-004)
- P1: 7
- P2: 5
- P3: 0

---

## IMPLEMENTATION PRIORITY (Top 20 Fixes)

These fixes are ordered by impact (P0 first) and grouped by file to minimize context switches.

| # | Fix | File(s) | P0/P1 | Est. Lines |
|---|-----|---------|-------|-----------|
| 1 | Sticky thead for ALL tables | 8 screen files | P0+P1 | ~40 |
| 2 | Frozen first column (BAS + PDP) | BudgetAllocate, ProposalDetail | P0 | ~20 |
| 3 | Sticky bottom CTA (BAS + SKU) | BudgetAllocate, SKUProposal | P0 | ~30 |
| 4 | Budget name onClick handler | BudgetManagement | P0 | ~5 |
| 5 | FAB bottom offset fix | MobileBottomNav/FilterChips | P0 | ~3 |
| 6 | Forgot password → toast guidance | LoginScreen | P0 | ~5 |
| 7 | Ticket error → ErrorMessage + retry | TicketScreen | P0 | ~10 |
| 8 | Empty SKU catalog → EmptyState CTA | SKUProposalScreen | P0 | ~15 |
| 9 | Getting Started card on zero-data home | HomeScreen | P0 | ~40 |
| 10 | Chart skeleton loader | HomeScreen | P0 | ~10 |
| 11 | Offline network status banner | layout.tsx + new hook | P0 | ~40 |
| 12 | Ctrl+S keyboard shortcut | BudgetAllocate, OTBAnalysis | P1 | ~15 |
| 13 | sessionStorage filter persistence | OTB, SKU, TKT, BMS | P1 | ~60 |
| 14 | Toast feedback on save/submit | ProposalDetail, others | P1 | ~15 |
| 15 | Touch targets ≥ 44px | FilterChips, BottomNav, forms | P1 | ~30 |
| 16 | Sort wiring on table headers | BMS, TKT, OCS, MDS | P1 | ~80 |
| 17 | Editable cell pencil always visible | OTBAnalysis | P1 | ~5 |
| 18 | Auto-save status indicator | BudgetAllocate | P1 | ~10 |
| 19 | Unsaved changes guard (Planning) | PlanningDetailPage | P1 | ~10 |
| 20 | iOS BottomSheet scroll lock fix | BottomSheet.tsx | P1 | ~15 |
