# Enterprise Transport Control Tower — Exception Command Center
## UI PHASE 4 · Exception Management Design Specification

**Persona primary:** Transport Manager · Operations Executive
**Persona secondary:** Regional Manager · Supply Chain Head
**Routes covered:** `/exceptions/*`
**Data sources:** `ExceptionDashboardService` · `AlertService` · `DrillDownService` · `ExceptionManager` · `RootCauseAnalyzer` · `EscalationEngine`
**Design reference:** PagerDuty Incident Console · ServiceNow ITSM · Jira Service Management · Splunk On-Call

---

## SEVERITY & STATUS DESIGN SYSTEM

### Severity Tiers

```
SEVERITY    COLOR TOKEN          HEX       LABEL       SLA TO RESOLVE
──────────────────────────────────────────────────────────────────────
CRITICAL    --sev-critical       #DC2626   🔴 CRITICAL  ≤ 1 hour
HIGH        --sev-high           #EA580C   🟠 HIGH      ≤ 4 hours
MEDIUM      --sev-medium         #D97706   🟡 MEDIUM    ≤ 8 hours
LOW         --sev-low            #65A30D   🟢 LOW       ≤ 24 hours
INFO        --sev-info           #2563EB   🔵 INFO      ≤ 72 hours

SEVERITY VISUAL TREATMENT:
  Background tint:   severity-color at 8% opacity (card backgrounds)
  Left border:       4px solid severity-color (cards, rows)
  Badge:             severity-color bg, white text, 4px radius
  Pulse ring:        CRITICAL only — 2px ring animation (1.5s, infinite)
```

### Workflow States

```
STATE           COLOR TOKEN           ICON   DESCRIPTION
──────────────────────────────────────────────────────────────────────────
OPEN            --state-open          ⭕     Raised, not yet assigned
ASSIGNED        --state-assigned      👤     Assigned to an owner
IN PROGRESS     --state-inprogress    🔄     Owner actively working
ESCALATED       --state-escalated     🔺     Moved to higher authority
PENDING INFO    --state-pending       ⏳     Awaiting external input
RESOLVED        --state-resolved      ✅     Root cause fixed, closed
CLOSED          --state-closed        🔒     Archived, SLA recorded
AUTO-RESOLVED   --state-auto          🤖     System resolved (no action)

STATE TRANSITION RULES:
  OPEN          → ASSIGNED / ESCALATED / AUTO-RESOLVED
  ASSIGNED      → IN PROGRESS / ESCALATED / RESOLVED
  IN PROGRESS   → ESCALATED / PENDING INFO / RESOLVED
  PENDING INFO  → IN PROGRESS / ESCALATED
  ESCALATED     → IN PROGRESS / RESOLVED
  RESOLVED      → CLOSED (manual confirm or 24h auto-close)
  CLOSED        → (terminal — can reopen via action)
```

### Exception Type Taxonomy

```
TYPE CODE              LABEL                    DEFAULT SEVERITY
───────────────────────────────────────────────────────────────────
arrival-delay          Arrival Delay            HIGH
departure-delay        Departure Delay          MEDIUM
sla-breach             SLA Breach               CRITICAL
seal-mismatch          Seal Mismatch            CRITICAL
hu-shortage            HU Shortage              HIGH
hu-excess              HU Excess                MEDIUM
damaged-goods          Damaged Goods            HIGH
theft-risk             Theft Risk               CRITICAL
vehicle-breakdown       Vehicle Breakdown        HIGH
route-deviation        Route Deviation          HIGH
document-missing       Document Missing         MEDIUM
carrier-non-responsive Carrier Non-Responsive   HIGH
weight-variance        Weight Variance          MEDIUM
temperature-breach     Temperature Breach       HIGH
customs-hold           Customs Hold             HIGH
wrong-dispatch         Wrong Dispatch           CRITICAL
```

---

## TABLE OF CONTENTS

1. [Exception Shell Layout](#1-exception-shell-layout)
2. [Screen 1 — Exception Dashboard](#2-screen-1--exception-dashboard)
3. [Screen 2 — Exception Queue](#3-screen-2--exception-queue)
4. [Screen 3 — Exception Details](#4-screen-3--exception-details)
5. [Screen 4 — Root Cause Analysis](#5-screen-4--root-cause-analysis)
6. [Screen 5 — Escalation Workflow](#6-screen-5--escalation-workflow)
7. [Screen 6 — SLA Impact Screen](#7-screen-6--sla-impact-screen)
8. [Screen 7 — Resolution Center](#8-screen-7--resolution-center)
9. [React Component Hierarchy](#9-react-component-hierarchy)
10. [UX Interactions & Workflow Transitions](#10-ux-interactions--workflow-transitions)
11. [Data Contracts](#11-data-contracts)

---

## 1. EXCEPTION SHELL LAYOUT

### 1.1 Exception Situation Bar

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  EXCEPTION SITUATION BAR                                        [always visible] ║
║  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────────┐║
║  │ OPEN     │ CRITICAL │ HIGH     │ ESCALATED│MY QUEUE  │ BREACH RISK          │║
║  │  9 total │  🔴 2    │  🟠 4   │  🔺 1    │  3 items │ [3 dispatches at SLA]│║
║  │          │          │          │          │          │ [View Critical →]    │║
║  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════════╝

CRITICAL count: pulses (background flashes every 3s if > 0)
MY QUEUE count: exceptions assigned to logged-in user
BREACH RISK: count of dispatches whose SLA will breach if exception unresolved
```

### 1.2 Exception Sub-Navigation

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [Dashboard]  [Exception Queue]  [Root Cause Analysis]  [SLA Impact]            │
│  [Escalation Workflow]  [Resolution Center]                      [+ Raise Exc]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SCREEN 1 — EXCEPTION DASHBOARD

**Route:** `/exceptions/dashboard`
**Purpose:** Command-center overview — situational awareness at a glance

### 2.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  TOP NAV                                                             [🔔] [👤]      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  EXCEPTION SITUATION BAR                                                             ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  Dashboard  Queue  Root Cause  SLA Impact  Escalation  Resolution   [+ Raise Exc]   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  EXCEPTION COMMAND CENTER                    [Last updated: 14:32] [↻ Refresh]      ║
║  ──────────────────────────────────────────────────────────────────────────────────  ║
║                                                                                      ║
║  ROW 1: CRITICAL ALERT BANNER (only visible if CRITICAL exceptions exist)            ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  🔴  2 CRITICAL exceptions require immediate attention                        │   ║
║  │  EXC-0088 — Seal Mismatch · TCT-0019          [Assign Now] [View]            │   ║
║  │  EXC-0091 — SLA Breach · TCT-0022             [Assign Now] [View]            │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                      ║
║  ROW 2: KPI TILES (5 across)                                                         ║
║  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐  ║
║  │  TOTAL OPEN      │ │  AVG RESOLUTION  │ │  SLA COMPLIANCE  │ │  ESCALATED     │  ║
║  │       9          │ │     3h 24m       │ │      87.4%       │ │      1         │  ║
║  │  ── by severity ─│ │  vs target: 4h   │ │  target: 95%     │ │  ── Level 2   │  ║
║  │  🔴 2  🟠 4      │ │  ✅ Under target  │ │  🔴 Below target  │ │  Since 2h ago │  ║
║  │  🟡 2  🟢 1      │ │  Trend: ↑ -18m  │ │  Trend: ↓ -2.1%  │ │  [View →]     │  ║
║  └──────────────────┘ └──────────────────┘ └──────────────────┘ └────────────────┘  ║
║  ┌──────────────────┐                                                                 ║
║  │  TODAY RESOLVED  │                                                                 ║
║  │       14         │                                                                 ║
║  │  Auto: 3  Manual:11│                                                               ║
║  │  Trend: ↑ +3 vs yday│                                                              ║
║  └──────────────────┘                                                                 ║
║                                                                                      ║
║  ROW 3: CHARTS (3 panels)                                                            ║
║  ┌──────────────────────────────┐ ┌───────────────────────────┐ ┌────────────────┐  ║
║  │  OPEN BY TYPE                │ │  OPEN BY REGION           │ │  RESOLUTION    │  ║
║  │  ─────────────────────────   │ │  ───────────────────────  │ │  TREND (7d)    │  ║
║  │  arrival-delay    ██████ 4   │ │  North   ████████ 4       │ │  ─────────────  │  ║
║  │  sla-breach       ████   2   │ │  West    ████ 2           │ │  Raised:  🔵   │  ║
║  │  seal-mismatch    ██     1   │ │  South   ██ 1             │ │  Resolved:🟢   │  ║
║  │  hu-shortage      ██     1   │ │  East    ██ 1             │ │                │  ║
║  │  carrier-nonresp  ██     1   │ │  Central — 0              │ │  Mon ▃▄▂▃▅▄▃  │  ║
║  │  [View All Types →]          │ │  [Drill Region →]         │ │  7d avg: 12/d  │  ║
║  └──────────────────────────────┘ └───────────────────────────┘ └────────────────┘  ║
║                                                                                      ║
║  ROW 4: OPEN BY CARRIER + MY QUEUE                                                   ║
║  ┌──────────────────────────────────────────────┐ ┌──────────────────────────────┐  ║
║  │  OPEN EXCEPTIONS BY CARRIER                  │ │  MY QUEUE (3)                │  ║
║  │  ─────────────────────────────────────────── │ │  ─────────────────────────── │  ║
║  │  BlueDart     🔴 1  🟠 2  —  —     3 total   │ │  EXC-0084  🟠 HIGH           │  ║
║  │  DTDC         —    🟠 1  🟡 1  —   2 total   │ │  arrival-delay · TCT-0031    │  ║
║  │  Delhivery    —    —    🟡 1  —   1 total    │ │  Assigned to me · 1h ago     │  ║
║  │  XpressBees   🔴 1  —    —   —    1 total    │ │  [View] [Update] [Escalate]  │  ║
║  │  Others       —    🟠 1  —   🟢 1  2 total   │ │  ─────────────────────────── │  ║
║  │  ──────────────────────────────────────────  │ │  EXC-0079  🟡 MEDIUM         │  ║
║  │  [View Full Carrier Breakdown →]             │ │  hu-shortage · TCT-0028      │  ║
║  └──────────────────────────────────────────────┘ │  Assigned to me · 3h ago     │  ║
║                                                   │  [View] [Update] [Resolve]   │  ║
║                                                   └──────────────────────────────┘  ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 2.2 Critical Alert Banner

```
VISIBILITY: Only rendered if CRITICAL severity exceptions exist in OPEN / ASSIGNED / ESCALATED state
STYLE:
  background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)
  border: 1.5px solid #DC2626
  border-left: 6px solid #DC2626
  border-radius: 8px
  padding: 12px 16px
  animation: criticalPulse 3s ease-in-out infinite

EACH CRITICAL ROW:
  [EXC ID] — [Type label] · [Dispatch ID]    [Assign Now] [View]

DISMISS RULE: Banner auto-hides when all critical exceptions leave OPEN state
              Manual dismiss: [× Dismiss] in top right (session only)

ANIMATION:
  @keyframes criticalPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.2); }
    50%       { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
  }
```

---

### 2.3 KPI Tile Specification

```
TILE ANATOMY:
┌────────────────────────────────────┐
│  [TILE LABEL]           [?] tooltip│
│  ──────────────────────────────    │
│  [LARGE NUMBER / VALUE]            │
│  [SECONDARY LINE]                  │
│  [TARGET LINE]                     │
│  [TREND BADGE: ↑ / ↓ / → + delta] │
└────────────────────────────────────┘

TILE: TOTAL OPEN
  Value:       9 (count of OPEN + ASSIGNED + IN PROGRESS + ESCALATED + PENDING)
  Secondary:   Severity breakdown (color dots + counts)
  Target:      None (descriptive)
  Trend:       vs yesterday same time

TILE: AVG RESOLUTION TIME
  Value:       3h 24m (average time from raised to resolved, rolling 7d)
  Secondary:   "vs target: 4h"
  Status dot:  🟢 under target / 🔴 above target
  Trend:       +/- vs prior 7d

TILE: SLA COMPLIANCE
  Value:       87.4%  (exceptions resolved within type SLA / total resolved)
  Secondary:   "Target: 95%"
  Status dot:  🔴 below target
  Trend:       ↓ -2.1% vs prior week

TILE: ESCALATED
  Value:       1 (currently in ESCALATED state)
  Secondary:   "Level 2 — since Xh ago"
  Click:       → Escalation Workflow screen filtered to escalated

TILE: TODAY RESOLVED
  Value:       14
  Secondary:   Auto: 3  Manual: 11
  Trend:       vs yesterday
```

---

## 3. SCREEN 2 — EXCEPTION QUEUE

**Route:** `/exceptions/queue`
**Purpose:** Master list of all exceptions — primary operational screen for triaging

### 3.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  EXCEPTION QUEUE                                      [⬇ Export] [⚙ Columns]       ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  VIEW TABS:  [🔴 All Open (9)]  [👤 My Queue (3)]  [🔺 Escalated (1)]              ║
║              [🔄 In Progress (2)]  [✅ Resolved Today (14)]  [🔒 Closed]            ║
║                                                                                      ║
║  FILTER BAR:                                                                         ║
║  Severity: [All ▼]  Type: [All Types ▼]  Assignee: [All ▼]  Region: [All ▼]       ║
║  Carrier: [All ▼]   Date: [Today ▼]      [+ More]    [Reset All]  [💾 Save Filter] ║
║  Active: [CRITICAL ×] [HIGH ×]                                   [2 filters active] ║
║                                                                                      ║
║  BULK ACTIONS (when rows selected):                                                  ║
║  [✓ 3 selected]  [Assign To ▼]  [Escalate]  [Mark Resolved]  [Export]               ║
║                                                                                      ║
║  ──────────────────────────────────────────────────────────────────────────────────  ║
║                                                                                      ║
║  ┌─────────────────────────────────────────────────────────────────────────────────┐ ║
║  │☐ │SEV  │ ID      │TYPE           │DISPATCH │CARRIER  │ASSIGNEE │STATE    │AGE   │ ║
║  │  │     │         │               │         │         │         │         │      │ ║
║  ├─────────────────────────────────────────────────────────────────────────────────┤ ║
║  │☐ │🔴   │EXC-0091 │sla-breach     │TCT-0022 │DTDC     │—Unassign│⭕ OPEN  │2h 10m│ ║
║  │  │CRIT │         │SLA Breach     │BOM-PUN-3│         │         │         │      │ ║
║  │  │     │         │               │         │         │[Assign] │[Escalate│[View]│ ║
║  ├─────────────────────────────────────────────────────────────────────────────────┤ ║
║  │☐ │🔴   │EXC-0088 │seal-mismatch  │TCT-0019 │BlueDart │Rahul K  │👤ASSIGN │4h 30m│ ║
║  │  │CRIT │         │Seal Mismatch  │DEL-MUM-1│         │         │         │      │ ║
║  │  │     │         │               │         │         │         │[Escalate│[View]│ ║
║  ├─────────────────────────────────────────────────────────────────────────────────┤ ║
║  │☐ │🟠   │EXC-0090 │arrival-delay  │TCT-0019 │BlueDart │Rahul K  │🔄IN PRG │1h 45m│ ║
║  │  │HIGH │         │Arrival Delay  │DEL-MUM-1│         │         │         │      │ ║
║  │  │     │         │               │         │         │         │[Pending │[View]│ ║
║  ├─────────────────────────────────────────────────────────────────────────────────┤ ║
║  │☐ │🟠   │EXC-0085 │carrier-nonrsp │TCT-0033 │XpressBee│Priya M  │🔺ESCLTD │6h 00m│ ║
║  │  │HIGH │         │Carrier Non-Re │DEL-BLR-3│         │         │         │      │ ║
║  │  │     │         │               │         │         │         │[De-Escl │[View]│ ║
║  ├─────────────────────────────────────────────────────────────────────────────────┤ ║
║  │☐ │🟠   │EXC-0084 │arrival-delay  │TCT-0031 │BlueDart │Me       │🔄IN PRG │3h 15m│ ║
║  │  │HIGH │         │Arrival Delay  │DEL-MUM-1│         │         │         │      │ ║
║  │  │     │         │               │         │         │[Update] │[Resolve │[View]│ ║
║  ├─────────────────────────────────────────────────────────────────────────────────┤ ║
║  │☐ │🟡   │EXC-0082 │hu-shortage    │TCT-0028 │Delhivery│Vikram R │👤ASSIGN │5h 20m│ ║
║  │  │MED  │         │HU Shortage    │DEL-HYD-2│         │         │         │      │ ║
║  │  │     │         │               │         │         │         │         │[View]│ ║
║  ├─────────────────────────────────────────────────────────────────────────────────┤ ║
║  │  [+ 3 more exceptions]                                                           │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  Showing 6 of 9  •  Page 1 of 2  [← Prev]  [1] [2]  [Next →]  [Show 20 ▼]         ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 3.2 Exception Queue Row Anatomy

```
ROW STRUCTURE:
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [CHECKBOX] [SEV BADGE] [EXC ID] [TYPE CODE / LABEL] [DISPATCH] [CARRIER]      │
│             [STATE BADGE] [ASSIGNEE] [AGE / SLA remaining]  [INLINE ACTIONS]   │
└─────────────────────────────────────────────────────────────────────────────────┘

ROW LEFT BORDER: 4px solid --sev-[severity]
ROW BACKGROUND:  --sev-[severity] at 4% opacity (very subtle)
ROW HOVER:       background at 10% opacity, cursor pointer

SEV BADGE (column 2):
  Pill: [🔴 CRITICAL] [🟠 HIGH] [🟡 MEDIUM] [🟢 LOW] [🔵 INFO]
  Width: 80px fixed, center-aligned

AGE DISPLAY:
  < 1h:     "42m" (green)
  1–4h:     "2h 10m" (amber if approaching type SLA)
  > 4h:     "6h" (red if past type SLA)
  SLA % bar: thin bar below age showing time consumed vs resolution SLA

INLINE ACTIONS (contextual, 1–3 buttons per row):
  OPEN, unassigned:    [Assign ▼]  [Escalate]  [View →]
  OPEN, assigned:      [Reassign]  [Escalate]  [View →]
  IN PROGRESS:         [Update]    [Resolve ✓] [View →]
  ESCALATED:           [De-Escalate]           [View →]
  PENDING:             [Resume]                [View →]

ASSIGN DROPDOWN (inline):
  Shows team member list from a lookup
  Search in dropdown
  On select → ExceptionManager.assignException(id, userId)
  Optimistic UI update before confirmation

BULK ACTIONS:
  Triggered by selecting 1+ checkbox
  [Assign To ▼] → dropdown of assignees → applies to all selected
  [Escalate]    → ConfirmPopover with count
  [Mark Resolved] → ConfirmPopover — "Resolve 3 exceptions?"
  [Export]      → downloads CSV of selected rows
```

---

### 3.3 My Queue Panel / Tab

```
MY QUEUE shows only exceptions assigned to the logged-in user.

PRIORITY ORDER WITHIN MY QUEUE:
  1. CRITICAL, oldest first
  2. HIGH, oldest first
  3. MEDIUM, oldest first
  4. LOW
  5. INFO

MY QUEUE EMPTY STATE:
┌──────────────────────────────────────────────────────┐
│                                                      │
│          ✅  All clear — no exceptions in your queue │
│          Check back in 15 minutes.                   │
│          [View All Open Exceptions →]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 4. SCREEN 3 — EXCEPTION DETAILS

**Route:** `/exceptions/:id`
**Entry points:** Queue row click · Dashboard critical banner · Alert link
**Layout:** Full-page (content volume warrants it)

### 4.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ← Exception Queue    Exceptions › EXC-0088                                     ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── EXCEPTION HEADER ─────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │  [🔴 CRITICAL]  EXC-0088                    [👤ASSIGNED]  [⚠ BREACH RISK]  │║
║  │  Seal Mismatch                                                               │║
║  │  Dispatch: TCT-0019  •  Route: DEL-MUM-01  •  Carrier: BlueDart             │║
║  │                                                                              │║
║  │  ┌──────────────────────────────────────────────────────────────────────┐   │║
║  │  │ Raised:   18 Jun 2026  10:45  by System (Gate Auto-detection)        │   │║
║  │  │ Assigned: 18 Jun 2026  11:00  to Rahul Kumar (Transport Manager)     │   │║
║  │  │ Age:      4h 30m   •   Resolution SLA: 1h  •  OVERDUE by 3h 30m 🔴  │   │║
║  │  └──────────────────────────────────────────────────────────────────────┘   │║
║  │                                                                              │║
║  │  SLA BREACH BAR: ████████████████████████████████████  OVERDUE 3h 30m       │║
║  │                                                                              │║
║  │  [🔺 Escalate]  [👤 Reassign]  [✅ Mark Resolved]  [⏳ Pending Info]  [⋮]  │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── TABS ──────────────────────────────────────────────────────────────────┐   ║
║  │ Overview │ Timeline │ Root Cause │ SLA Impact │ Actions │ Comments       │   ║
║  └──────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                  ║
║  [TAB CONTENT AREA — see per-tab detail below]                                   ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 4.2 Exception Detail — Overview Tab

```
┌── OVERVIEW TAB ─────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  LEFT (55%)                              RIGHT (45%)                             │
│  ──────────────────────────────────      ──────────────────────────────────────  │
│                                                                                  │
│  EXCEPTION SUMMARY                       LINKED DISPATCH                         │
│  ┌────────────────────────────────┐      ┌────────────────────────────────────┐  │
│  │ ID:          EXC-0088          │      │  TCT-0019  •  IN TRANSIT 🔵        │  │
│  │ Type:        seal-mismatch     │      │  DEL-MUM-01  Delhi → Mumbai        │  │
│  │ Severity:    🔴 CRITICAL       │      │  Vehicle: MH-01-AX-2341            │  │
│  │ Status:      👤 ASSIGNED       │      │  Driver: Suresh Patil              │  │
│  │ Assignee:    Rahul Kumar (TM)  │      │  ETA: 19:30  •  SLA: BREACHED 🔴  │  │
│  │ Region:      North             │      │  ─────────────────────────────     │  │
│  │ Route:       DEL-MUM-01        │      │  HUs at risk: 42                   │  │
│  │ Carrier:     BlueDart          │      │  Cost exposure: ₹1,20,000 est.     │  │
│  │ Raised By:   System (Gate)     │      │  [View Full Dispatch →]            │  │
│  │ Raised At:   10:45  18 Jun     │      └────────────────────────────────────┘  │
│  │ Resolved At: —                 │                                               │
│  │ Resolution:  —                 │      ESCALATION STATUS                        │
│  └────────────────────────────────┘      ┌────────────────────────────────────┐  │
│                                           │  Level:    1 (Transport Manager)   │  │
│  EXCEPTION DESCRIPTION                    │  Escalated: Not yet                │  │
│  ┌────────────────────────────────────┐   │  Auto-escalate at: 15:00 (1h left) │  │
│  │  Seal SL-20240118-07 was found     │   │  [Escalate Now →]                  │  │
│  │  mismatched at the gate. Expected  │   └────────────────────────────────────┘  │
│  │  seal number on ASN: SL-20240118-  │                                           │
│  │  07. Scanned seal: SL-20240118-09. │      AFFECTED HUs (if type=seal/shortage) │
│  │  Variance detected by gate         │      ┌────────────────────────────────┐   │
│  │  scanner at 10:45.                 │      │  All 42 HUs in this dispatch   │   │
│  │  ─────────────────────────────     │      │  are at risk until seal         │   │
│  │  Raw data:                         │      │  discrepancy is resolved.       │   │
│  │  expected_seal: SL-20240118-07     │      │  [View HU Manifest →]           │   │
│  │  actual_seal:   SL-20240118-09     │      └────────────────────────────────┘   │
│  └────────────────────────────────────┘                                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Exception Detail — Timeline Tab

```
┌── TIMELINE TAB ─────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  EXCEPTION LIFECYCLE TIMELINE                          [⬇ Export Timeline]      │
│                                                                                  │
│  10:45  🔴  RAISED          System (Gate Auto-detection)                         │
│  │          Event: Seal mismatch detected at gate                               │
│  │          Expected: SL-20240118-07  •  Actual: SL-20240118-09                │
│  │          Severity auto-set: CRITICAL (seal-mismatch default)                 │
│  │          Notification: Transport Manager + Ops Exec notified via WhatsApp    │
│  │                                                                              │
│  11:00  👤  ASSIGNED        Ops Executive (Priya M)                             │
│  │          Assigned to: Rahul Kumar (Transport Manager)                        │
│  │          Note: "Verify with carrier immediately"                             │
│  │                                                                              │
│  11:15  🔄  IN PROGRESS     Rahul Kumar                                          │
│  │          Update: "Called BlueDart ops. They are checking the seal at origin" │
│  │          External action: Carrier contact at 11:15                           │
│  │                                                                              │
│  12:00  ⏳  PENDING INFO    Rahul Kumar                                          │
│  │          Note: "Awaiting carrier confirmation of seal number. Will update    │
│  │          by 13:00."                                                          │
│  │          Waiting on: Carrier (BlueDart)                                      │
│  │                                                                              │
│  ⏰  AUTO-ESCALATE:  15:00   (1h from now)                                      │
│     If still unresolved, will escalate to Regional Manager                      │
│                                                                                  │
│  ──────────── NO FURTHER EVENTS YET ────────────                                 │
│                                                                                  │
│  ADD EVENT:                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐             │
│  │ Add update note...                                              │             │
│  │                                                                 │             │
│  └────────────────────────────────────────────────────────────────┘             │
│  [Add Note]  [Mark In Progress]  [Mark Pending]  [Resolve ✓]                    │
└──────────────────────────────────────────────────────────────────────────────────┘

TIMELINE NODE TYPES:
  🔴 RAISED:         Red dot, large
  👤 ASSIGNED:       Blue dot, person icon
  🔄 IN PROGRESS:    Cyan dot, spinner icon
  ⏳ PENDING:        Amber dot, clock icon
  🔺 ESCALATED:      Orange dot, up-arrow icon
  ✅ RESOLVED:       Green dot, check icon
  🔒 CLOSED:         Gray dot, lock icon
  💬 COMMENT:        Gray dot, chat icon (user notes)
  🤖 AUTO-EVENT:     Purple dot (system-generated: auto-assign, auto-escalate)
  ⏰ SCHEDULED:      Dashed border dot (future auto-action)
```

---

### 4.4 Exception Detail — Actions Tab

```
┌── ACTIONS TAB ──────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  AVAILABLE ACTIONS                                                               │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  👤  REASSIGN                                                             │    │
│  │  Change the assigned owner for this exception                            │    │
│  │  Current: Rahul Kumar                                                     │    │
│  │  [Assignee: ________________________ ▼]      [Reassign]                 │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  🔺  ESCALATE                                                             │    │
│  │  Escalate to next level (Regional Manager)                               │    │
│  │  Reason: [_____________________________________ ▼]                       │    │
│  │  Message to escalate-to: [Optional note...]                              │    │
│  │  Notify via: ☑ WhatsApp  ☑ Email  ☐ SMS                                 │    │
│  │  [Escalate to Regional Manager]                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  ⏳  REQUEST INFORMATION                                                  │    │
│  │  Mark as Pending Information and set a deadline for response             │    │
│  │  Waiting on: [Carrier ▼]  [Driver]  [Warehouse]  [Custom...]            │    │
│  │  Deadline: [18 Jun 2026  13:00  📅]                                     │    │
│  │  Note: [______________________________________________]                  │    │
│  │  [Mark Pending — await response]                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  📞  CONTACT CARRIER                                                     │    │
│  │  BlueDart Logistics — Ops Control: 1800-XXX-XXXX                        │    │
│  │  [📞 Call]  [💬 WhatsApp]  [📧 Email]                                   │    │
│  │  Template: [seal-mismatch-carrier ▼]  [Send Notification]               │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  ✅  MARK RESOLVED                                                        │    │
│  │  Root Cause:  [seal-mismatch-data-entry-error ▼]                        │    │
│  │  Resolution:  [Carrier confirmed seal SL-20240118-07 is intact. ASN had │    │
│  │               a typo. Verified physically. Dispatch continues.          │    │
│  │  Preventive Action: [_________________________________]                  │    │
│  │  Billable to carrier: ☑ Yes  Penalty: [₹5,000]                          │    │
│  │  [Mark as Resolved]                                                      │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Exception Detail — Comments Tab

```
┌── COMMENTS TAB ─────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  DISCUSSION THREAD                                                               │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  Rahul Kumar  (Transport Manager)                      11:15  18 Jun       │  │
│  │  "Called BlueDart ops control. Seal was applied at Delhi DC.              │  │
│  │  They are checking internal records. Will revert by 12:30."               │  │
│  │                                                         [Reply] [Quote]   │  │
│  ├───────────────────────────────────────────────────────────────────────────┤  │
│  │  Priya Mehta  (Operations Executive)                   12:00  18 Jun       │  │
│  │  "@Rahul — please get written confirmation from carrier.                  │  │
│  │  CC me on email when received. This is a CRITICAL — do not close          │  │
│  │  without physical verification."                                           │  │
│  │                                                         [Reply] [Quote]   │  │
│  ├───────────────────────────────────────────────────────────────────────────┤  │
│  │  Rahul Kumar  (Transport Manager)                       12:02  18 Jun      │  │
│  │  "@Priya — Acknowledged. Escalation on standby. Carrier reverts by 13:00" │  │
│  │                                                         [Reply] [Quote]   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ADD COMMENT:                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐     │
│  │ Type a comment... (@mention to notify)                                  │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│  [Internal only ☑]                                   [Cancel]  [Post Comment]   │
│                                                                                  │
│  INTERNAL NOTE BADGE: "Internal" label on notes not visible to carrier contacts │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. SCREEN 4 — ROOT CAUSE ANALYSIS

**Route:** `/exceptions/root-cause`
**Purpose:** Bayesian inference results + pattern analysis across all exceptions

### 5.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  ROOT CAUSE ANALYSIS CENTER                              [⬇ Export] [📊 View Report]║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  FILTER:  Dispatch: [TCT-0088 ▼]  Type: [All Types ▼]  Period: [Last 30 days ▼]    ║
║           OR  [Analyze specific exception: EXC-____ ]  [Run Analysis]               ║
║                                                                                      ║
║  ┌── MODE TABS ────────────────────────────────────────────────────────────────┐    ║
║  │  [Single Exception Analysis]  [Aggregate Pattern Analysis]  [Trend View]   │    ║
║  └─────────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                      ║
║  ══════════════ SINGLE EXCEPTION ANALYSIS: EXC-0088 ══════════════                  ║
║                                                                                      ║
║  ┌── BAYESIAN ROOT CAUSE INFERENCE ─────────────────────────────────────────────┐  ║
║  │  RootCauseAnalyzer.infer('EXC-0088')                                          │  ║
║  │  ──────────────────────────────────────────────────────────────────────────   │  ║
║  │                                                                                │  ║
║  │  CONFIDENCE SCORES:                                                            │  ║
║  │                                                                                │  ║
║  │  ▐ Cause: DATA ENTRY ERROR (ASN seal field)                     87% ████████  │  ║
║  │    Evidence: Seal physically present. Number mismatch only.                   │  ║
║  │    Pattern: 3 of last 5 seal-mismatch on BlueDart-DEL-MUM were data errors   │  ║
║  │    Recommendation: Verify ASN seal field → correct if typo                   │  ║
║  │                                                                                │  ║
║  │  ▐ Cause: WRONG SEAL APPLIED AT LOADING                          9% █          │  ║
║  │    Evidence: Low — physical check not yet done                                │  ║
║  │    Pattern: 1 prior incident of wrong seal in last 6 months                  │  ║
║  │    Recommendation: Request photo of seal from driver                         │  ║
║  │                                                                                │  ║
║  │  ▐ Cause: SEAL TAMPERED IN TRANSIT                                4%           │  ║
║  │    Evidence: Very low — GPS trail shows no unscheduled stops                  │  ║
║  │    Pattern: 0 prior tamper incidents on this route                            │  ║
║  │    Recommendation: Low priority — continue monitoring                        │  ║
║  │                                                                                │  ║
║  │  ┌── INFERENCE FACTORS USED ────────────────────────────────────────────┐    │  ║
║  │  │  historicalRate(seal-mismatch, BlueDart, DEL-MUM-01) = 0.12           │    │  ║
║  │  │  historicalRate(data-entry-error, seal-mismatch) = 0.72               │    │  ║
║  │  │  GPSAnomalyScore = 0.02 (no route deviation detected)                 │    │  ║
║  │  │  dispatchAge = 6h (mismatch detected at loading, not in-transit)       │    │  ║
║  │  └──────────────────────────────────────────────────────────────────────┘    │  ║
║  │                                                                                │  ║
║  │  RECOMMENDED ACTION:                                                           │  ║
║  │  [✓ Verify ASN seal field — likely data entry error]                          │  ║
║  │  [Send corrected ASN to carrier]                                               │  ║
║  │  [Mark root cause: data-entry-error]                                           │  ║
║  └────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                      ║
║  ══════════════ AGGREGATE PATTERN ANALYSIS (Last 30 days) ══════════════            ║
║                                                                                      ║
║  ┌── ROOT CAUSE FREQUENCY TABLE ────────────────────────────────────────────────┐  ║
║  │                                                                                │  ║
║  │  Root Cause            Count  % Total  Top Type          Top Carrier          │  ║
║  │  ──────────────────────────────────────────────────────────────────────────── │  ║
║  │  carrier-delay         18     34%      arrival-delay     BlueDart             │  ║
║  │  data-entry-error      12     22%      seal-mismatch     Multiple             │  ║
║  │  vehicle-breakdown      7     13%      vehicle-breakdown DTDC                 │  ║
║  │  weather               6     11%      arrival-delay     Multiple             │  ║
║  │  loading-delay          5      9%      departure-delay   Delhivery            │  ║
║  │  wrong-seal-applied     3      6%      seal-mismatch     XpressBees           │  ║
║  │  other / unknown        2      4%      —                 —                   │  ║
║  │  ─────────────────────────────────────────────────────────────────────────── │  ║
║  │  Total:                53                                                     │  ║
║  └────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                      ║
║  ┌── TOP SYSTEMIC ISSUES (requires structural fix) ─────────────────────────────┐  ║
║  │                                                                                │  ║
║  │  ⚠ ISSUE 1: Data Entry Errors on Seal Field (12 exceptions, 22%)             │  ║
║  │    Affected: BlueDart, DTDC on DEL-MUM-01 primarily                          │  ║
║  │    Suggested Fix: Add seal-field validation at ASN creation (WMS integration) │  ║
║  │    [Raise System Improvement Ticket →]                                        │  ║
║  │                                                                                │  ║
║  │  ⚠ ISSUE 2: DTDC Vehicle Reliability on Western Routes (7 breakdown exc.)    │  ║
║  │    Affected: BOM-PUN-03, DEL-MUM-01                                          │  ║
║  │    Suggested Fix: Review DTDC vehicle fitness requirements. Consider TIR.     │  ║
║  │    [Flag to Carrier Performance Review →]                                     │  ║
║  │                                                                                │  ║
║  └────────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 5.2 Root Cause Confidence Bar Specification

```
CONFIDENCE BAR ANATOMY:
  ▐ [CAUSE LABEL]                           [CONFIDENCE %]  [BAR █████░░░]
    [EVIDENCE description]
    [PATTERN: N prior similar incidents]
    [RECOMMENDATION: actionable text]

BAR COLORS:
  ≥ 80% confidence: --status-success (green)
  50–79%:           --status-warning (amber)
  < 50%:            --status-danger  (red)
  Remaining %:      --border-default (gray fill background)

BAR WIDTH: percentage of container width

CAUSE LABEL STYLE:
  font-weight: 600
  font-size: 14px
  color: --text-primary

EVIDENCE / PATTERN lines:
  font-size: 12px
  color: --text-muted
  margin-left: 12px

RECOMMENDATION:
  font-size: 12px
  color: --text-link
  cursor: pointer → opens action panel
```

---

### 5.3 Aggregate Pattern View

```
FILTER OPTIONS:
  Date range: [Today] [7 days] [30 days] [Custom]
  Type filter: [All Types ▼] — multiselect
  Carrier filter: [All Carriers ▼]
  Route filter:   [All Routes ▼]
  Min confidence: [≥ 70% ▼]

ROOT CAUSE TABLE SORTING: click any column header
  Default sort: Count desc

SYSTEMIC ISSUES PANEL:
  Auto-identified: root causes with > 10% frequency AND > 5 occurrences
  Each issue shows:
    - Pattern summary
    - Affected entities (carrier/route/type)
    - Suggested corrective action
    - [Raise Ticket] CTA → stores improvement ticket in localStorage

EXPORT:
  [⬇ Export] → CSV with: exception ID, type, root cause, confidence, resolved
```

---

## 6. SCREEN 5 — ESCALATION WORKFLOW

**Route:** `/exceptions/escalation`
**Purpose:** Multi-level escalation management and tracking

### 6.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  ESCALATION WORKFLOW CENTER                                         [⬇ Export]      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ┌── ESCALATION SUMMARY BAR ──────────────────────────────────────────────────┐    ║
║  │  Currently Escalated: 1  •  Auto-Escalate Pending: 2  •  Avg Esc. Time: 6h║    ║
║  └──────────────────────────────────────────────────────────────────────────── ┘   ║
║                                                                                      ║
║  VIEW:  [Currently Escalated]  [Pending Auto-Escalation]  [Escalation History]     ║
║                                                                                      ║
║  ══════ CURRENTLY ESCALATED (1) ══════                                               ║
║                                                                                      ║
║  ┌── ESCALATION CARD ─────────────────────────────────────────────────────────────┐ ║
║  │  🔺 ESCALATED  •  EXC-0085                                                     │ ║
║  │  carrier-non-responsive  •  TCT-0033  •  XpressBees  •  DEL-BLR-03            │ ║
║  │                                                                                 │ ║
║  │  ESCALATION CHAIN:                                                              │ ║
║  │                                                                                 │ ║
║  │  [LEVEL 1: Transport Manager] ──────▶ [LEVEL 2: Regional Manager] ──▶ [L3]   │ ║
║  │       Vikram Raju                         Priya Mehta                 SCH     │ ║
║  │       Escalated from L1                   ← CURRENT LEVEL               —     │ ║
║  │       6h ago                              Assigned 6h ago              —      │ ║
║  │       [✓ Notified]                        [✓ Notified]               —       │ ║
║  │                                                                                 │ ║
║  │  ESCALATION REASON:                                                             │ ║
║  │  "Carrier not responding to calls or WhatsApp for 6 hours. Dispatch          │ ║
║  │  TCT-0033 is now 4h delayed. Unilateral escalation to RM required."           │ ║
║  │                                                                                 │ ║
║  │  ESCALATION AGE: 6h  •  SLA for L2 resolution: 4h  •  OVERDUE BY 2h 🔴      │ ║
║  │                                                                                 │ ║
║  │  [📞 Contact RM Now]  [Escalate to L3 (SCH)]  [De-Escalate]  [Resolve ✓]    │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ══════ PENDING AUTO-ESCALATION (2) ══════                                           ║
║                                                                                      ║
║  ┌────────────────────────────────────────────────────────────────────────────────┐ ║
║  │  ⏰ EXC-0088  seal-mismatch  •  TCT-0019    Auto-escalate at: 15:00 (1h left) │ ║
║  │  Currently: Rahul Kumar (L1 TM)  →  Will escalate to: Priya Mehta (RM)       │ ║
║  │  [Resolve before escalation]  [Escalate Now]  [Delay by 1h]                  │ ║
║  ├────────────────────────────────────────────────────────────────────────────────┤ ║
║  │  ⏰ EXC-0091  sla-breach  •  TCT-0022       Auto-escalate at: 16:00 (2h left) │ ║
║  │  Currently: Unassigned  →  Will escalate to: Ops Exec (L1 auto-assign)       │ ║
║  │  [Assign Before Escalation]  [Escalate Now]                                   │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 6.2 Escalation Chain Visualization

```
ESCALATION CHAIN (horizontal stepper):

  ┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
  │  LEVEL 1   │────▶│  LEVEL 2   │────▶│  LEVEL 3   │────▶│  LEVEL 4   │
  │ Ops Exec / │     │ Reg. Mgr   │     │ SC Head    │     │ MD / CEO   │
  │ Trans. Mgr │     │            │     │            │     │            │
  │ ────────── │     │ ────────── │     │ ────────── │     │ ────────── │
  │ [NAME]     │     │ [NAME]     │     │ —          │     │ —          │
  │ [TIMESTAMP]│     │ [TIMESTAMP]│     │ —          │     │ —          │
  │ ✅ Notified│     │ ✅ Notified│     │ ○ Pending  │     │ ○ Pending  │
  └────────────┘     └────────────┘     └────────────┘     └────────────┘
   Escalated from     CURRENT LEVEL      Not reached         Not reached

CONNECTOR LINE COLORS:
  Past levels (completed escalation):   --status-success (green solid)
  Current level:                        --sev-high (orange solid)
  Future levels:                        --border-default (gray dashed)

CURRENT LEVEL NODE:
  border: 2px solid --sev-high
  background: --sev-high at 10%
  [Contact] button visible below name

EACH NODE TOOLTIP (hover):
  "Level 2 — Regional Manager
   Assigned to: Priya Mehta
   Escalated at: 08:15 18 Jun
   SLA for this level: 4h
   Overdue by: 2h"
```

---

### 6.3 Escalation Levels Configuration

```
ESCALATION MATRIX:
  Level 1: Operations Executive / Transport Manager (default first responder)
  Level 2: Regional Manager (if L1 unresolved in type SLA)
  Level 3: Supply Chain Head (if L2 unresolved in 4h)
  Level 4: Managing Director (CRITICAL only, if L3 unresolved in 2h)

AUTO-ESCALATION TRIGGERS (ExceptionManager.checkEscalation()):
  Condition: exception age > type resolution SLA AND state != RESOLVED / CLOSED
  Action: EscalationEngine.escalate(exceptionId, nextLevel)
          → DomainEventBus.emit('ExceptionEscalated')
          → NotificationEngine fires for all channels

MANUAL ESCALATION (from Actions tab or Escalation screen):
  Reason required (dropdown + free text)
  Notification channels selectable
  Escalate-to person auto-resolved from level matrix
  ConfirmPopover before firing

DE-ESCALATION:
  Available when in ESCALATED state
  Requires resolution note OR "false escalation" reason
  Sets state back to IN PROGRESS at previous level
```

---

### 6.4 Escalation History View

```
ESCALATION HISTORY (table):
  Columns: EXC ID | Exception Type | Dispatch | Levels Reached | Escalated At | Resolved At | Total Time | Resolution

  HISTORY FILTERS:
    Period: [7 days] [30 days] [Custom]
    Level reached: [L1] [L2] [L3] [L4]
    Type:  [All ▼]
    Carrier: [All ▼]

  METRICS PANEL (above table):
    Average escalation time to resolution: 6h 42m
    Escalation rate: 12% of all exceptions
    L1 resolved %:  82%
    L2 resolved %:  14%
    L3+ resolved %:  4%
    [View as Chart →]
```

---

## 7. SCREEN 6 — SLA IMPACT SCREEN

**Route:** `/exceptions/sla-impact`
**Purpose:** Quantify financial and SLA consequence of open exceptions

### 7.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  SLA IMPACT ANALYSIS                                        [⬇ Export] [📊 Report]  ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  FILTER:  Period: [Today ▼]  Region: [All ▼]  Carrier: [All ▼]  Type: [All ▼]     ║
║                                                                                      ║
║  ══════ KPI IMPACT SUMMARY ══════                                                    ║
║                                                                                      ║
║  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌───────────┐ ║
║  │  OTA IMPACT        │ │  OTD IMPACT        │ │  COST EXPOSURE     │ │ HUs AT    │ ║
║  │  ─────────────     │ │  ─────────────     │ │  ─────────────     │ │ RISK      │ ║
║  │  Exceptions with   │ │  Exceptions with   │ │  Penalty exposure  │ │           │ ║
║  │  OTA breach risk:  │ │  OTD breach risk:  │ │  from open exc:    │ │  42 HUs   │ ║
║  │      3 dispatch    │ │      2 dispatch    │ │   ₹2,40,000 est.  │ │ on 3 disp │ ║
║  │                    │ │                    │ │                    │ │           │ ║
║  │  Dispatches        │ │  Dispatches        │ │  Already penalized │ │ [View HUs]│ ║
║  │  already breached: │ │  already breached: │ │  today: ₹45,000   │ │           │ ║
║  │      1             │ │      1             │ │                    │ │           │ ║
║  └────────────────────┘ └────────────────────┘ └────────────────────┘ └───────────┘ ║
║                                                                                      ║
║  ══════ DISPATCH-LEVEL SLA STATUS TABLE ══════                                       ║
║                                                                                      ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  Dispatch │ Route     │ Exc Count │ SLA Status  │ Hours Overdue │ Est. Penalty║   ║
║  │  ──────────────────────────────────────────────────────────────────────────  │   ║
║  │  TCT-0022 │ BOM-PUN-3 │ 1 (CRIT) │ 🔴 BREACHED │ +1h 30m       │ ₹80,000    │   ║
║  │  TCT-0019 │ DEL-MUM-1 │ 2 (CRIT) │ 🔴 AT RISK  │ +30m est.     │ ₹60,000    │   ║
║  │  TCT-0033 │ DEL-BLR-3 │ 1 (HIGH) │ 🟡 AT RISK  │ —             │ ₹40,000    │   ║
║  │  TCT-0031 │ DEL-MUM-1 │ 1 (HIGH) │ 🟡 AT RISK  │ —             │ ₹30,000    │   ║
║  │  TCT-0028 │ DEL-HYD-2 │ 1 (MED)  │ 🟢 ON TRACK │ —             │ ₹0         │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                      ║
║  ══════ RESOLUTION PRIORITY MATRIX ══════                                            ║
║                                                                                      ║
║  ┌── PRIORITY QUADRANT CHART ──────────────────────────────────────────────────┐   ║
║  │                                                                              │   ║
║  │  HIGH SLA     │  [EXC-0091] sla-breach    │  [EXC-0088] seal-mismatch       │   ║
║  │  IMPACT       │  TCT-0022 · CRITICAL       │  TCT-0019 · CRITICAL            │   ║
║  │               │  ← RESOLVE FIRST →         │                                 │   ║
║  │  ─────────────┼────────────────────────────┼─────────────────────────────── │   ║
║  │  LOW SLA      │  [EXC-0082] hu-shortage    │  [EXC-0079] hu-shortage         │   ║
║  │  IMPACT       │  TCT-0028 · MEDIUM          │  TCT-0031 · MEDIUM              │   ║
║  │               │                             │  Resolve if time allows →       │   ║
║  │               │                             │                                 │   ║
║  │               │  LOW EXCEPTION SEVERITY     │  HIGH EXCEPTION SEVERITY        │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                      ║
║  ══════ EXCEPTION → SLA CAUSATION DETAIL ══════                                     ║
║                                                                                      ║
║  ┌────────────────────────────────────────────────────────────────────────────────┐ ║
║  │  EXC-0088 (seal-mismatch, TCT-0019)                                            │ ║
║  │  SLA Impact:  Dispatch paused at gate. 30 min delay added.                     │ ║
║  │  If unresolved by 15:00 → OTA breach (SLA window closes 18:00)                │ ║
║  │  Estimated penalty if breached: ₹60,000 (carrier SLA clause §4.2)             │ ║
║  │  [Resolve Now →]  [View Exception →]                                           │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 7.2 Priority Matrix Specification

```
QUADRANT AXES:
  Y axis: SLA Impact (LOW bottom → HIGH top)
  X axis: Exception Severity (LOW left → HIGH right)

QUADRANT LABELS:
  Top-right (HIGH impact, HIGH severity): "RESOLVE FIRST 🔴"
  Top-left  (HIGH impact, LOW severity):  "RESOLVE NEXT 🟠"
  Bottom-right (LOW impact, HIGH severity):"MONITOR CLOSELY 🟡"
  Bottom-left  (LOW impact, LOW severity): "RESOLVE WHEN ABLE 🟢"

EXCEPTION BUBBLE SIZING:
  Bubble size = HU count at risk (larger = more HUs)
  Bubble color = severity color token
  Bubble label = EXC ID (hover → tooltip with details)
  Bubble click → navigate to Exception Detail page

SLA IMPACT SCORE (y-axis value):
  HIGH if dispatch SLA hoursRemaining < 4h
  MEDIUM if 4–8h
  LOW if > 8h

MATRIX SVG:
  Dimensions: 600 × 400
  Grid lines: 1px dashed --border-default
  Quadrant shading: subtle fill at 5% opacity per quadrant
  Axis labels: font-size 11px, --text-muted
```

---

## 8. SCREEN 7 — RESOLUTION CENTER

**Route:** `/exceptions/resolution`
**Purpose:** Mass-triage workspace — resolve, classify, and close multiple exceptions efficiently

### 8.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  RESOLUTION CENTER                                          [⬇ Export] [📊 Stats]   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ┌── RESOLUTION SUMMARY ──────────────────────────────────────────────────────────┐ ║
║  │  Pending Resolution: 6  •  Avg Age: 3h 42m  •  CRIT unresolved: 2             │ ║
║  │  Resolved Today: 14  •  Auto-resolved: 3  •  Avg resolution time: 3h 24m      │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  VIEW:  [Pending Resolution (6)]  [Resolved Today (14)]  [All Closed]               ║
║                                                                                      ║
║  ══════ PENDING RESOLUTION ══════                                                    ║
║                                                                                      ║
║  BATCH ACTIONS:  [✓ Select All]  [Bulk Assign Root Cause ▼]  [Bulk Resolve]         ║
║                                                                                      ║
║  ┌── RESOLUTION CARD: EXC-0088 ───────────────────────────────────────────────────┐ ║
║  │  [☐]  🔴 CRITICAL  •  seal-mismatch  •  TCT-0019  •  BlueDart  •  4h 30m ago  │ ║
║  │  ──────────────────────────────────────────────────────────────────────────── │ ║
║  │                                                                                 │ ║
║  │  RESOLUTION FORM:                                                               │ ║
║  │                                                                                 │ ║
║  │  Root Cause:       [data-entry-error ▼]  ← RCA inference: 87% confidence      │ ║
║  │  Resolution Note:  [Carrier confirmed seal SL-20240118-07 is intact.           │ ║
║  │                     ASN had a typo on seal number. Corrected in system.       │ ║
║  │                     Dispatch continues without physical intervention.      ]   │ ║
║  │  Preventive Action:[Add seal number validation to ASN form (WMS)          ]   │ ║
║  │  Carrier Fault:    ☑ Yes  ☐ No    Penalty: [₹ 5,000]   [Waive Penalty ☐]    │ ║
║  │  Docs Attached:    [+ Attach Evidence]                                          │ ║
║  │                                                                                 │ ║
║  │  [Cancel]                                              [✅ Mark Resolved]      │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── RESOLUTION CARD: EXC-0091 ───────────────────────────────────────────────────┐ ║
║  │  [☐]  🔴 CRITICAL  •  sla-breach  •  TCT-0022  •  DTDC  •  2h 10m ago        │ ║
║  │  ──────────────────────────────────────────────────────────────────────────── │ ║
║  │  UNASSIGNED — must assign before resolving                                     │ ║
║  │  [Assign to Me]  [Assign To ▼]                                                 │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── RESOLUTION CARD: EXC-0090 ───────────────────────────────────────────────────┐ ║
║  │  [☐]  🟠 HIGH  •  arrival-delay  •  TCT-0019  •  BlueDart  •  1h 45m ago     │ ║
║  │  ──────────────────────────────────────────────────────────────────────────── │ ║
║  │  Root Cause:       [carrier-delay ▼]                                           │ ║
║  │  Resolution Note:  [Dispatch arrived 1h 30m late. OTA breached. Penalty       │ ║
║  │                     applicable as per §4.2 SLA clause.                    ]   │ ║
║  │  Carrier Fault:    ☑ Yes  Penalty: [₹ 20,000]                                 │ ║
║  │  [✅ Mark Resolved]                                                             │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ══════ RESOLVED TODAY (14) ══════                                                   ║
║                                                                                      ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  ID       Type            Dispatch  Root Cause            Resolved By  Time   │   ║
║  │  ───────────────────────────────────────────────────────────────────────     │   ║
║  │  EXC-0077 arrival-delay   TCT-0011  carrier-delay         Rahul K      09:15  │   ║
║  │  EXC-0078 departure-delay TCT-0009  loading-delay         Auto         08:40  │   ║
║  │  EXC-0075 hu-excess       TCT-0007  data-entry            Vikram R     08:10  │   ║
║  │  [+ 11 more]              [View All →]                                        │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 8.2 Resolution Form Specification

```
RESOLUTION FORM FIELDS:

1. ROOT CAUSE (required)
   Type: dropdown
   Options: from RootCauseCategories constant:
     carrier-delay · vehicle-breakdown · weather · data-entry-error
     loading-delay · wrong-seal-applied · route-deviation
     carrier-non-responsive · system-error · other
   Hint: shows RCA inference confidence if available:
         "[Auto-suggested: data-entry-error (87% confidence)]"
   On select: updates resolution note template if field is empty

2. RESOLUTION NOTE (required)
   Type: textarea, min 20 chars
   Placeholder: "Describe how the exception was resolved..."
   Template auto-fills based on type × root cause (EditableTemplate)

3. PREVENTIVE ACTION (optional)
   Type: textarea
   Placeholder: "What should be done to prevent recurrence?"

4. CARRIER FAULT (required)
   Type: radio — Yes / No
   If Yes: Penalty field appears:
     Penalty amount: [number input, ₹ prefix]
     [Waive Penalty] checkbox (requires waiver reason)

5. ATTACH EVIDENCE (optional)
   Type: file upload (image/PDF, max 5 files, 10MB each)
   Files stored in localStorage as base64 (stub — size limited in real impl)

RESOLUTION NOTE TEMPLATES (auto-fill on root cause select):
  carrier-delay:       "Carrier [name] delayed departure/arrival by [X]h due to [reason]."
  data-entry-error:    "Identified data entry error in [field]. Corrected by [actor]."
  vehicle-breakdown:   "Vehicle [reg] broke down at [location]. Alternate arrangement: [action]."
  weather:             "Weather disruption on [route] caused [X]h delay. No fault of carrier."
  loading-delay:       "Loading at [DC] was delayed by [X]h due to [reason]."

VALIDATION:
  Root cause: required
  Resolution note: required, min 20 chars
  If carrier fault = Yes: penalty required (can be ₹0 with waiver)
  On submit: ExceptionManager.resolve(id, { rootCause, note, preventiveAction, penalty })
             → state → RESOLVED
             → DomainEventBus.emit('ExceptionResolved')
             → NotificationEngine.notify carriers/team per template
```

---

### 8.3 Raise Exception Modal

```
ACCESSIBLE FROM: [+ Raise Exception] button in sub-nav header

┌── RAISE NEW EXCEPTION ─────────────────────────────────────────────────────────┐
│                                                              [×] Close          │
│  ─────────────────────────────────────────────────────────────────────────     │
│                                                                                  │
│  Dispatch:         [TCT-____ 🔍 Search...]            (required)                │
│  Exception Type:   [Select type... ▼]                  (required)               │
│  Severity:         [AUTO ▼] ← pre-fills based on type; can override             │
│                    ○ 🔴 CRITICAL  ○ 🟠 HIGH  ○ 🟡 MEDIUM  ○ 🟢 LOW             │
│  Description:      [___________________________________________]                 │
│                    (What happened? Be specific.)                                 │
│  Assign To:        [Auto-assign ▼] (or select person)                           │
│  Notify:           ☑ Carrier  ☑ Transport Manager  ☐ Regional Manager          │
│  Attach Evidence:  [+ Upload (optional)]                                         │
│                                                                                  │
│  PREVIEW:                                                                        │
│  "This will raise a 🟠 HIGH exception of type arrival-delay on TCT-0019         │
│   and assign to Rahul Kumar. Carrier BlueDart will be notified."                │
│                                                                                  │
│  [Cancel]                                        [Raise Exception →]            │
└──────────────────────────────────────────────────────────────────────────────────┘

ON SUBMIT: ExceptionFactory.raise(type, dispatchId, raisedBy, description)
           → ExceptionManager.assignException (if auto-assign: duty officer)
           → DomainEventBus.emit('ExceptionRaised')
           → NotificationEngine fires per selected channels
```

---

## 9. REACT COMPONENT HIERARCHY

### 9.1 File Organization

```
src/
├── pages/
│   └── exceptions/
│       ├── ExceptionsLayout.jsx          ← shell + situation bar + subnav
│       ├── ExceptionDashboard.jsx
│       ├── ExceptionQueue.jsx
│       ├── ExceptionDetail.jsx
│       ├── RootCauseAnalysis.jsx
│       ├── EscalationWorkflow.jsx
│       ├── SLAImpact.jsx
│       └── ResolutionCenter.jsx
│
├── components/
│   └── exceptions/
│       │
│       ├── shell/
│       │   ├── ExceptionSituationBar.jsx
│       │   └── ExceptionSubNav.jsx
│       │
│       ├── dashboard/
│       │   ├── CriticalAlertBanner.jsx
│       │   ├── CriticalAlertRow.jsx
│       │   ├── ExceptionKPITile.jsx
│       │   ├── OpenByTypeChart.jsx
│       │   ├── OpenByRegionChart.jsx
│       │   ├── ResolutionTrendChart.jsx
│       │   ├── OpenByCarrierTable.jsx
│       │   └── MyQueuePanel.jsx
│       │       └── MyQueueCard.jsx
│       │
│       ├── queue/
│       │   ├── ExceptionQueueViewTabs.jsx
│       │   ├── ExceptionFilterBar.jsx
│       │   ├── BulkActionBar.jsx
│       │   ├── ExceptionQueueTable.jsx
│       │   ├── ExceptionQueueRow.jsx
│       │   │   ├── SeverityBadge.jsx
│       │   │   ├── StateBadge.jsx
│       │   │   ├── InlineAssignDropdown.jsx
│       │   │   ├── AgeBadge.jsx           ← colored by age vs SLA
│       │   │   └── InlineRowActions.jsx
│       │   └── ExceptionEmptyState.jsx
│       │
│       ├── detail/
│       │   ├── ExceptionDetailHeader.jsx
│       │   │   ├── SeverityStateBanner.jsx
│       │   │   ├── ExceptionMeta4Grid.jsx  ← raised/assigned/age/SLA
│       │   │   ├── ExceptionSLABar.jsx
│       │   │   └── ExceptionQuickActions.jsx
│       │   ├── ExceptionDetailTabStrip.jsx
│       │   └── tabs/
│       │       ├── ExceptionOverviewTab.jsx
│       │       │   ├── ExceptionSummaryCard.jsx
│       │       │   ├── LinkedDispatchCard.jsx
│       │       │   ├── EscalationStatusCard.jsx
│       │       │   └── AffectedHUsCard.jsx
│       │       ├── ExceptionTimelineTab.jsx
│       │       │   ├── ExceptionTimelineNode.jsx
│       │       │   └── AddTimelineNoteForm.jsx
│       │       ├── ExceptionActionsTab.jsx
│       │       │   ├── ReassignForm.jsx
│       │       │   ├── EscalateForm.jsx
│       │       │   ├── PendingInfoForm.jsx
│       │       │   ├── ContactCarrierPanel.jsx
│       │       │   └── ResolveForm.jsx
│       │       └── ExceptionCommentsTab.jsx
│       │           ├── CommentThread.jsx
│       │           ├── CommentBubble.jsx
│       │           └── AddCommentForm.jsx
│       │
│       ├── rca/
│       │   ├── RCAModeTabStrip.jsx
│       │   ├── SingleExceptionRCA.jsx
│       │   │   ├── BayesianCauseBar.jsx
│       │   │   ├── InferenceFactorsPanel.jsx
│       │   │   └── RCARecommendedActions.jsx
│       │   ├── AggregatePatternRCA.jsx
│       │   │   ├── RootCauseFrequencyTable.jsx
│       │   │   └── SystemicIssuesPanel.jsx
│       │   └── RCATrendView.jsx
│       │
│       ├── escalation/
│       │   ├── EscalationSummaryBar.jsx
│       │   ├── EscalationViewTabs.jsx
│       │   ├── EscalationCard.jsx
│       │   │   ├── EscalationChainStepper.jsx
│       │   │   ├── EscalationChainNode.jsx
│       │   │   └── EscalationCardActions.jsx
│       │   ├── PendingAutoEscalationList.jsx
│       │   │   └── PendingEscalationRow.jsx
│       │   └── EscalationHistoryTable.jsx
│       │
│       ├── sla-impact/
│       │   ├── SLAImpactKPIBar.jsx
│       │   ├── DispatchSLATable.jsx
│       │   ├── ResolutionPriorityMatrix.jsx   ← SVG quadrant chart
│       │   │   └── ExceptionBubble.jsx
│       │   └── ExceptionSLACausationList.jsx
│       │
│       ├── resolution/
│       │   ├── ResolutionSummaryBar.jsx
│       │   ├── ResolutionViewTabs.jsx
│       │   ├── BulkResolutionActionBar.jsx
│       │   ├── ResolutionCard.jsx
│       │   │   └── ResolutionForm.jsx
│       │   │       ├── RootCauseSelect.jsx
│       │   │       ├── ResolutionNoteArea.jsx
│       │   │       ├── PenaltyFields.jsx
│       │   │       └── EvidenceUpload.jsx
│       │   └── ResolvedTodayTable.jsx
│       │
│       └── shared/
│           ├── RaiseExceptionModal.jsx
│           ├── SeverityBadge.jsx          ← global reuse
│           ├── StateBadge.jsx             ← global reuse
│           ├── ExceptionTypePill.jsx
│           ├── AgeBadge.jsx
│           └── ExceptionMiniCard.jsx      ← used in workbench / alerts
│
├── hooks/
│   ├── useExceptionDashboard.js
│   ├── useExceptionQueue.js
│   ├── useExceptionDetail.js
│   ├── useRootCauseAnalysis.js
│   ├── useEscalationWorkflow.js
│   ├── useSLAImpact.js
│   ├── useResolutionCenter.js
│   └── useRaiseException.js
│
└── context/
    └── ExceptionCommandContext.jsx       ← shared filter state across all screens
```

---

### 9.2 Key Component Props

```jsx
// ── SeverityBadge ─────────────────────────────────────────────────────────────
SeverityBadge.propTypes = {
  severity:  oneOf(['critical','high','medium','low','info']).isRequired,
  size:      oneOf(['xs','sm','md','lg']),
  pulse:     bool,    // true for CRITICAL → CSS pulse ring animation
  showIcon:  bool,    // show emoji icon before label
}

// ── StateBadge ────────────────────────────────────────────────────────────────
StateBadge.propTypes = {
  state:     oneOf(['open','assigned','in-progress','escalated',
                    'pending-info','resolved','closed','auto-resolved']).isRequired,
  size:      oneOf(['sm','md','lg']),
}

// ── ExceptionQueueRow ─────────────────────────────────────────────────────────
ExceptionQueueRow.propTypes = {
  exception: shape({
    id:          string.isRequired,
    type:        string.isRequired,
    typeLabel:   string,
    severity:    string.isRequired,
    state:       string.isRequired,
    dispatchId:  string,
    carrierId:   string,
    carrierName: string,
    assigneeId:  string,
    assigneeName:string,
    raisedAt:    string,
    ageMs:       number,
    slaMs:       number,          // resolution SLA in ms
    slaOverdue:  bool,
  }).isRequired,
  selected:       bool,
  onSelect:       func,
  onView:         func,
  onAssign:       func,
  onEscalate:     func,
  onResolve:      func,
  availableUsers: arrayOf(shape({ id: string, name: string, role: string })),
}

// ── ExceptionTimelineNode ─────────────────────────────────────────────────────
ExceptionTimelineNode.propTypes = {
  type:      oneOf(['raised','assigned','in-progress','escalated','pending',
                    'resolved','closed','comment','auto-event','scheduled']).isRequired,
  datetime:  string,
  actor:     string,
  role:      string,
  note:      string,
  metadata:  object,     // type-specific extra data (e.g., seal numbers for raise)
  scheduled: bool,       // future/pending node → dashed border
}

// ── BayesianCauseBar ──────────────────────────────────────────────────────────
BayesianCauseBar.propTypes = {
  cause:          string.isRequired,
  confidence:     number.isRequired,  // 0–100
  evidence:       string,
  pattern:        string,
  recommendation: string,
  onActionClick:  func,
  rank:           number,             // 1 = top cause
}

// ── EscalationChainStepper ────────────────────────────────────────────────────
EscalationChainStepper.propTypes = {
  levels: arrayOf(shape({
    levelNo:      number,
    label:        string,       // 'Transport Manager'
    personName:   string,
    escalatedAt:  string,
    notified:     bool,
    slaDurationH: number,
    slaStatus:    oneOf(['within','overdue','not-reached']),
  })).isRequired,
  currentLevel: number.isRequired,
  onContactClick: func,
}

// ── ResolutionPriorityMatrix ──────────────────────────────────────────────────
ResolutionPriorityMatrix.propTypes = {
  exceptions: arrayOf(shape({
    id:          string,
    severity:    string,
    slaImpact:   oneOf(['high','medium','low']),    // computed from dispatch SLA remaining
    huAtRisk:    number,
    dispatchId:  string,
  })).isRequired,
  onBubbleClick: func,
}

// ── ResolutionForm ────────────────────────────────────────────────────────────
ResolutionForm.propTypes = {
  exception:         object.isRequired,
  rcaSuggestion:     shape({ rootCause: string, confidence: number }),
  onSubmit:          func.isRequired,
  onCancel:          func,
}

// ── RaiseExceptionModal ────────────────────────────────────────────────────────
RaiseExceptionModal.propTypes = {
  isOpen:        bool.isRequired,
  onClose:       func.isRequired,
  defaultDispatchId: string,    // pre-fill if opened from dispatch context
  onSuccess:     func,
}

// ── ExceptionMiniCard ─────────────────────────────────────────────────────────
// Reused in Workbench dispatch card exceptions badge + alert widgets
ExceptionMiniCard.propTypes = {
  exception: shape({
    id:        string,
    type:      string,
    severity:  string,
    state:     string,
    ageMs:     number,
  }).isRequired,
  onView:    func,
  compact:   bool,    // single-line mode for inline usage
}
```

---

## 10. UX INTERACTIONS & WORKFLOW TRANSITIONS

### 10.1 State Machine Transition Interactions

```
TRANSITION: OPEN → ASSIGNED
  Trigger:  InlineAssignDropdown select in queue row
  Action:   ExceptionManager.assignException(id, userId)
  UI:       Row's state badge flips OPEN → ASSIGNED (200ms crossfade)
            Assignee cell fills with name
            My Queue count in situation bar +1 if assigned to self
  Toast:    "EXC-0088 assigned to Rahul Kumar"

TRANSITION: ASSIGNED → IN PROGRESS
  Trigger:  [Mark In Progress] in timeline add-note form
  Action:   ExceptionManager.updateState(id, 'in-progress', note, actor)
  UI:       State badge changes, timeline node added

TRANSITION: → ESCALATED
  Trigger:  [Escalate] button in header quick actions or Actions tab
  Flow:     EscalateForm fills: reason + notify + escalate-to (auto-resolved)
            ConfirmPopover: "Escalate to Priya Mehta (Regional Manager)?"
            On confirm: EscalationEngine.escalate()
                        → DomainEventBus.emit('ExceptionEscalated')
                        → NotificationEngine fires
  UI:       State badge → 🔺 ESCALATED (orange pulse briefly)
            Exception detail header banner turns orange
            Situation bar ESCALATED count +1
            Escalation screen gains row in "Currently Escalated"

TRANSITION: → RESOLVED
  Trigger:  Resolve button → ResolutionForm submit
  Validation: rootCause required, note min 20 chars, penalty if carrier fault
  Action:   ExceptionManager.resolve(id, resolutionData)
            → state → RESOLVED
            → OTA/OTD KPIs recalculate (KPIEngine)
            → Penalty logged if applicable
  UI:       State badge → ✅ RESOLVED (green)
            Card slides out of PENDING list (300ms)
            RESOLVED TODAY count +1
            Situation bar OPEN count -1

TRANSITION: RESOLVED → CLOSED
  Trigger:  Auto (24h after resolution) OR manual [Close] action
  Action:   ExceptionManager.close(id)
  UI:       Moves to CLOSED tab, no further actions

AUTO-ESCALATION TRIGGER:
  Polling: useExceptionQueue polls every 60s → calls ExceptionManager.checkEscalation()
  When auto-escalate fires: notification appears in situation bar
  Toast: "⚠ EXC-0088 auto-escalated to Regional Manager (Priya Mehta)"
```

---

### 10.2 Exception Queue Interactions

```
ROW CLICK (not on action buttons):
  → Navigate to /exceptions/:id (full page)
  Exception ID in URL for deep-linking and browser back support

INLINE ASSIGN DROPDOWN:
  Opens on [Assign ▼] click
  Search in dropdown (min 2 chars)
  Shows: Name + Role + Currently assigned count ("Rahul Kumar (TM) — 3 open")
  On select: optimistic UI update (no spinner), then API call
  On error: rollback + error toast

BULK SELECT:
  [✓ Select All] → selects all on current page
  Each checkbox click: row background shifts to --state-selected (blue tint)
  BULK ACTIONS bar appears from bottom (slide-up 200ms)

ESCALATE (inline):
  Opens ConfirmPopover anchored to button:
  "Escalate EXC-0088 to Regional Manager? Reason required:"
  [Text input for reason]
  [Cancel]  [Escalate →]

SORT (column headers):
  Click → sorts asc
  Click again → sorts desc
  Active sort column shows ▲ / ▼ icon
  Sorts: SEV (severity rank), ID, TYPE, DISPATCH, CARRIER, STATE, AGE

AGE TIMER (live):
  Age column updates every 60s (useInterval)
  Color changes as age approaches resolution SLA:
    <50% of SLA: gray
    50–80%: amber
    >80% or overdue: red
```

---

### 10.3 Root Cause Analysis Interactions

```
SINGLE EXCEPTION MODE:
  Enter EXC ID in search → [Run Analysis]
  Loading: skeleton bars for confidence scores (500ms)
  Results render: bars animate from 0 → final width (600ms stagger, 100ms delay per bar)
  Cause click: expands to show full evidence detail + recommendation actions

RECOMMENDATION ACTION CLICK:
  [✓ Verify ASN seal field] → opens action popover:
  "This recommendation suggests: Contact carrier to verify seal field in ASN.
   Would you like to add this as a timeline note on EXC-0088?
   [Add to Timeline]  [Copy to Clipboard]  [Dismiss]"

AGGREGATE MODE:
  Filters apply immediately (300ms debounce)
  Table sorts by Count desc by default
  Row click → drill to exception list filtered by that root cause
  [Raise System Improvement Ticket] → localStorage stub
    Creates object: { id, title, rootCause, count, suggestedFix, raisedAt }
    Success toast: "Improvement ticket SIT-001 created"
```

---

### 10.4 Resolution Center Interactions

```
RESOLUTION FORM AUTO-FILL:
  Root cause select → note template auto-fills if textarea empty
  If textarea has content → warning popover:
  "This will replace your current note. Continue? [Keep current] [Replace]"

ATTACH EVIDENCE:
  [+ Attach Evidence] → file picker
  Accepted: image/*, application/pdf
  Max 5 files, 10MB each
  Thumbnail preview row appears below upload button
  [×] on thumbnail removes file

BATCH RESOLVE:
  Select multiple cards via checkboxes
  [Bulk Resolve] → opens batch resolution modal:
  ┌────────────────────────────────────────────────────────────────┐
  │  Resolve 3 Exceptions                                          │
  │  ──────────────────────────────────────────────────────────    │
  │  EXC-0090  🟠  arrival-delay  TCT-0019                        │
  │  EXC-0082  🟡  hu-shortage    TCT-0028                        │
  │  EXC-0079  🟡  hu-shortage    TCT-0031                        │
  │  ──────────────────────────────────────────────────────────    │
  │  Common Root Cause: [Select... ▼]                             │
  │  Common Note: [Optional shared resolution note...]            │
  │  Each will keep its own individual note if already entered.    │
  │  [Cancel]                    [Resolve All 3 ✓]               │
  └────────────────────────────────────────────────────────────────┘

CARD COLLAPSE / EXPAND:
  Resolution cards start expanded for CRITICAL
  MEDIUM/LOW cards start collapsed (show header + [Expand ▼])
  [Expand] → form slides open (280ms)
  Card stack is scrollable, not paginated
```

---

### 10.5 Animation Spec

```
CRITICAL ALERT BANNER PULSE:
  background-color: alternates between #FEE2E2 and #FEF2F2
  box-shadow: pulsing red glow (criticalPulse, 3s infinite)

SEVERITY BADGE PULSE (CRITICAL only):
  ::after pseudo-element: expanding ring animation
  @keyframes severityRing {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  Duration: 1.5s, infinite

STATE BADGE TRANSITION:
  All state badge changes: 200ms crossfade
  ESCALATED transition: additionally shakes briefly (2 cycles of ±4px horizontal)

EXCEPTION QUEUE ROW (new exception arrives via polling):
  New row: background flash --sev-[severity] at 30% for 1s, then normalizes
  Row slides in from top (translateY -20px → 0, 250ms)

RESOLUTION FORM SUBMIT:
  Submit button: spinner replaces label
  Card: fades out on success (opacity 1→0, 300ms)
  RESOLVED TODAY count: count-up animation (+1)

SLA BAR (overdue state):
  Bar fill: red, full width
  Text: "OVERDUE +3h 30m" — text blinks (opacity 1→0.4, 800ms, 3 times then stays on)
```

---

## 11. DATA CONTRACTS

### 11.1 Exception Dashboard ← ExceptionDashboardService

```javascript
// ExceptionDashboardService.getSummary()
{
  totalOpen:        9,
  critical:         2,
  high:             4,
  medium:           2,
  low:              1,
  escalated:        1,
  avgResolutionMs:  12240000,     // 3h 24m in ms
  resolutionTarget: 14400000,     // 4h target in ms
  slaCompliance:    87.4,
  resolvedToday:    14,
  autoResolvedToday:3,
}

// ExceptionDashboardService.getOpenByRegion()
[
  { regionId: 'NR', regionName: 'North', critical:2, high:2, medium:1, low:0, total:5 },
  { regionId: 'WR', regionName: 'West',  critical:0, high:1, medium:0, low:1, total:2 },
  ...
]

// ExceptionDashboardService.getOpenByCarrier()
[
  { carrierId:'CAR-001', carrierName:'BlueDart', critical:1, high:2, total:3 },
  { carrierId:'CAR-002', carrierName:'DTDC',     critical:0, high:1, total:2 },
  ...
]

// ExceptionDashboardService.getRootCauseAnalysis()
[
  { rootCause:'carrier-delay', count:18, pct:34, topType:'arrival-delay', topCarrier:'BlueDart' },
  ...
]
```

### 11.2 Exception Queue ← ExceptionDashboardService.getList()

```javascript
// getList({ severity: ['critical','high'], state: ['open','assigned'] }, 1, 20)
{
  items: [
    {
      id:           'EXC-0088',
      type:         'seal-mismatch',
      typeLabel:    'Seal Mismatch',
      severity:     'critical',
      state:        'assigned',
      dispatchId:   'TCT-0019',
      carrierId:    'CAR-001',
      carrierName:  'BlueDart Logistics',
      routeCode:    'DEL-MUM-01',
      assigneeId:   'USR-001',
      assigneeName: 'Rahul Kumar',
      raisedBy:     'system',
      raisedAt:     '2026-06-18T10:45:00Z',
      ageMs:        16200000,     // 4.5h
      resolutionSlaSec: 3600,     // 1h for CRITICAL
      slaOverdue:   true,
      slaOverdueMs: 12600000,     // 3.5h overdue
      escalated:    false,
      escalationLevel: 1,
    },
    ...
  ],
  total: 9, page: 1, pageSize: 20, totalPages: 1
}
```

### 11.3 Exception Detail ← ExceptionManager + DrillDownService

```javascript
// ExceptionManager.getDetail('EXC-0088')
{
  id:            'EXC-0088',
  type:          'seal-mismatch',
  severity:      'critical',
  state:         'assigned',
  dispatchId:    'TCT-0019',
  raisedBy:      'system',
  raisedAt:      '2026-06-18T10:45:00Z',
  assignedTo:    'USR-001',
  description:   'Seal SL-20240118-07 expected; SL-20240118-09 found.',
  rawData:       { expected_seal:'SL-20240118-07', actual_seal:'SL-20240118-09' },
  timeline:      [ /* ordered ExceptionEvent objects */ ],
  comments:      [ /* ExceptionComment objects */ ],
  escalations:   [ /* EscalationRecord objects */ ],
  resolution:    null,
  metadata:      { source:'gate-scanner', location:'DC Delhi Gate 3' },
  // enriched by service:
  dispatch:      { /* linked dispatch object */ },
  carrier:       { /* linked carrier object */ },
  slaDetail:     { resolutionSlaSec:3600, ageMs:16200000, overdue:true, overdueMs:12600000 },
  slaImpact:     { dispatchSlaAtRisk: true, dispatchBreached: false, estimatedPenalty: 60000 },
}
```

### 11.4 Root Cause Analysis ← RootCauseAnalyzer

```javascript
// RootCauseAnalyzer.infer('EXC-0088') — from Step 4 engine
{
  exceptionId: 'EXC-0088',
  causes: [
    {
      cause:          'data-entry-error',
      confidence:     87,
      evidence:       'Seal physically present. Number mismatch only.',
      pattern:        '3 of last 5 seal-mismatch on BlueDart DEL-MUM were data errors',
      recommendation: 'Verify ASN seal field. Correct if typo.',
    },
    {
      cause:          'wrong-seal-applied',
      confidence:     9,
      evidence:       'Physical check not yet done.',
      pattern:        '1 prior wrong seal incident in last 6 months',
      recommendation: 'Request driver photo of physical seal.',
    },
    {
      cause:          'tamper',
      confidence:     4,
      evidence:       'GPS trail shows no unscheduled stops.',
      pattern:        '0 prior tamper incidents on this route',
      recommendation: 'Low priority — continue monitoring.',
    },
  ],
  factors: {
    historicalRate: 0.12,
    dataEntryRate:  0.72,
    gpsAnomalyScore:0.02,
    dispatchAgeH:   6,
  },
}
```

### 11.5 SLA Impact ← ExceptionDashboardService + DispatchDashboardService

```javascript
// ExceptionDashboardService.getOpenByCarrier() + DispatchDashboardService.getAtRisk()
// Cross-join: for each open exception, find linked dispatch SLA status

// SLA Impact Table row:
{
  dispatchId:         'TCT-0022',
  routeCode:          'BOM-PUN-03',
  exceptionCount:     1,
  exceptionSeverity:  'critical',
  slaStatus:          'breached',
  hoursOverdue:       1.5,
  estimatedPenalty:   80000,
}

// Priority Matrix bubble:
{
  id:         'EXC-0091',
  severity:   'critical',
  slaImpact:  'high',       // computed: dispatch SLA < 4h remaining
  huAtRisk:   36,
  dispatchId: 'TCT-0022',
  x:          0.9,          // 0–1 (severity axis)
  y:          0.85,         // 0–1 (SLA impact axis)
}
```

---

*Document ends.*

---

**UI PHASE 4 COMPLETE**
