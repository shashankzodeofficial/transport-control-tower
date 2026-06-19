# Enterprise Transport Control Tower — Administration Module
## UI PHASE 7 · Master Data & System Configuration Design Specification

**Persona primary:** Administrator · Supply Chain Head
**Persona secondary:** Regional Manager · Transport Manager (read-only on most masters)
**Routes covered:** `/admin/*`
**Data sources:** `DAL.*` (all entity stores) · `APISecurityLayer` · `RateLimiter` · `IntegrationMonitor`
**Design reference:** SAP S/4HANA Fiori Admin · Oracle Fusion Admin Console · Microsoft Dynamics 365 · Salesforce Admin Setup

---

## ADMIN MODULE DESIGN SYSTEM

### Enterprise Grid Principles

```
GRID-FIRST LAYOUT:
  All master screens follow: Filter Bar → Action Bar → Data Grid → Detail Panel
  Grid is the primary interaction surface — not forms
  Inline editing preferred for single-field changes
  Full form opens only for record creation or bulk edits

GRID SPECIFICATIONS:
  Row height:       44px (compact) / 56px (standard) / auto (expanded)
  Header:           48px, sticky, sortable, resizable columns
  Column min-width: 80px; max: depends on content
  Frozen columns:   First column (ID/Code) always frozen — horizontal scroll
  Density toggle:   [Compact] [Standard] [Comfortable] — user preference
  Zebra stripes:    Alternate rows at 2% opacity tint
  Hover:            Row highlight at 6% brand-primary tint
  Selected:         Row highlight at 12% brand-primary tint + left border accent

BULK OPERATIONS:
  Checkbox column: first column, 44×44px touch target
  [Select All]:    header checkbox — selects current page
  [Select All N]:  appears after page-select — selects across all pages
  Bulk action bar: slides up from bottom when ≥ 1 row selected
    Contains: Edit Selected | Delete Selected | Export Selected | [entity-specific actions]

EXCEL EXPORT:
  [⬇ Export] always visible in action bar
  Options modal:
    Export: ○ Current page  ○ All filtered  ○ All records
    Format: ● XLSX  ○ CSV  ○ JSON
    Include: ☑ All columns  ☐ Selected columns only
    [Export Now] — generates file from localStorage data

BULK UPLOAD:
  [⬆ Bulk Upload] in action bar → Upload Modal:
    [Download Template ⬇] — downloads pre-formatted XLSX template
    [Drag & drop XLSX here] or [Browse Files]
    Preview: shows first 10 rows, column mapping, validation results
    Errors highlighted in red; warnings in amber; valid rows in green
    [Skip errors & import valid] or [Fix errors first]
    Progress bar during import
    Result: "42 records imported. 3 skipped (errors). 0 duplicates."

COLOR TOKENS (admin-specific):
  --admin-active:    #16A34A   (green  — active / enabled records)
  --admin-inactive:  #6B7280   (gray   — inactive / disabled)
  --admin-new:       #2563EB   (blue   — newly added this session)
  --admin-modified:  #D97706   (amber  — modified but unsaved)
  --admin-deleted:   #DC2626   (red    — marked for deletion)
  --admin-header:    #1E293B   (dark   — grid header background)
  --admin-row-alt:   rgba(0,0,0,0.02)  (zebra stripe)

STATUS BADGE (universal admin):
  ● Active   = green dot + "Active"   label
  ● Inactive = gray dot  + "Inactive" label
  ● Draft    = amber dot + "Draft"    label
  ● Archived = dark dot  + "Archived" label
```

### Admin Shell Layout

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  TOP NAV — [TCT Admin]                                   [🔔] [❓] [👤 Admin]   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  ┌── LEFT SIDEBAR (220px, fixed) ──────┐                                        ║
║  │  MASTER DATA                        │  ← collapsible section headers         ║
║  │  ├ Route Master                     │                                        ║
║  │  ├ Schedule Master                  │  MAIN CONTENT AREA                     ║
║  │  ├ Carrier Master                   │  (fills remaining width)               ║
║  │  ├ Vehicle Master                   │                                        ║
║  │  ├ Location Master                  │                                        ║
║  │  ├ SLA Master                       │                                        ║
║  │  └ Exception Master                 │                                        ║
║  │                                     │                                        ║
║  │  USER & ACCESS                      │                                        ║
║  │  ├ User Management                  │                                        ║
║  │  └ Role Management                  │                                        ║
║  │                                     │                                        ║
║  │  SYSTEM                             │                                        ║
║  │  ├ System Configuration             │                                        ║
║  │  ├ Integration Monitor              │                                        ║
║  │  └ Audit Log                        │                                        ║
║  └─────────────────────────────────────┘                                        ║
╚══════════════════════════════════════════════════════════════════════════════════╝

SIDEBAR BEHAVIOR:
  Active item: blue left border (3px) + blue text + light blue bg
  Collapsed (mobile): icon-only strip (48px wide)
  Hamburger: [☰] top-left to toggle
  Breadcrumb: Admin › Route Master (always shown in content area header)
```

---

## TABLE OF CONTENTS

1. [Screen 1 — Route Master](#1-screen-1--route-master)
2. [Screen 2 — Schedule Master](#2-screen-2--schedule-master)
3. [Screen 3 — Carrier Master](#3-screen-3--carrier-master)
4. [Screen 4 — Vehicle Master](#4-screen-4--vehicle-master)
5. [Screen 5 — Location Master](#5-screen-5--location-master)
6. [Screen 6 — SLA Master](#6-screen-6--sla-master)
7. [Screen 7 — Exception Master](#7-screen-7--exception-master)
8. [Screen 8 — User Management](#8-screen-8--user-management)
9. [Screen 9 — Role Management](#9-screen-9--role-management)
10. [Screen 10 — System Configuration](#10-screen-10--system-configuration)
11. [Shared Admin Components](#11-shared-admin-components)
12. [React Component Hierarchy](#12-react-component-hierarchy)
13. [Data Contracts](#13-data-contracts)

---

## 1. SCREEN 1 — ROUTE MASTER

**Route:** `/admin/routes`
**DAL Key:** `tct_routes`
**Purpose:** Define and manage all transport routes — origin, destination, distance, SLA

### 1.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › Route Master                                                               ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ROUTE MASTER                                     12 routes  •  Last sync: 14:30   ║
║  ─────────────────────────────────────────────────────────────────────────────────  ║
║                                                                                      ║
║  FILTER BAR:                                                                         ║
║  [🔍 Search code, origin, destination...]   Status [All ▼]  Region [All ▼]          ║
║  Active filters: none                                         [Reset] [Save Filter] ║
║                                                                                      ║
║  ACTION BAR:                                                                         ║
║  [+ New Route]  [⬆ Bulk Upload]  [⬇ Export]  [⚙ Columns]   [Compact/Standard/Full]║
║                                                                                      ║
║  ┌── DATA GRID ──────────────────────────────────────────────────────────────────┐  ║
║  │☐│Code        │Name                │Origin      │Dest.       │Dist│SLA│Grade│St│  ║
║  │─┼────────────┼────────────────────┼────────────┼────────────┼────┼───┼─────┼──│  ║
║  │☐│DEL-MUM-01  │Delhi to Mumbai     │DC Delhi    │DC Mumbai   │1420│10h│ 🅐  │●A│  ║
║  │☐│BOM-PUN-03  │Mumbai to Pune      │DC Mumbai   │DC Pune     │ 150│ 4h│ 🅑  │●A│  ║
║  │☐│DEL-HYD-02  │Delhi to Hyderabad  │DC Delhi    │DC Hyderabad│1270│12h│ 🅒  │●A│  ║
║  │☐│MAA-BLR-01  │Chennai to Bangalore│DC Chennai  │DC Bangalore│ 346│ 6h│ 🅒  │●A│  ║
║  │☐│DEL-BLR-03  │Delhi to Bangalore  │DC Delhi    │DC Bangalore│2150│18h│ 🅓  │●A│  ║
║  │☐│HYD-BOM-02  │Hyderabad to Mumbai │DC Hyderabad│DC Mumbai   │ 711│ 8h│ 🅔  │●A│  ║
║  │☐│DEL-CCU-01  │Delhi to Kolkata    │DC Delhi    │DC Kolkata  │1531│14h│ 🅑  │●A│  ║
║  │☐│BLR-MAA-02  │Bangalore to Chennai│DC Bangalore│DC Chennai  │ 346│ 6h│—    │●I│  ║
║  │  [+ 4 more]                                                                    │  ║
║  └────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                      ║
║  Showing 8 of 12  •  Page 1 of 2  [← Prev] [1] [2] [Next →]  [Show 20 ▼]          ║
║                                                                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 1.2 Route Grid Columns

```
COLUMN DEFINITIONS:
  ☐         Checkbox (44px, frozen)
  Code      Route code — DEL-MUM-01 (120px, frozen, sortable, clickable → detail)
  Name      Full route name (200px, sortable)
  Origin    Origin location name (140px, sortable)
  Destination Dest. location name (140px, sortable)
  Dist.(km) Numeric, sortable (80px)
  SLA       SLA window hours (60px)
  Grade     RoutePerformanceScorer grade badge — 🅐 to 🅕 (60px)
            Shows "—" if < 5 dispatches (insufficient data)
  Region    Region code (80px, filterable)
  Carriers  Count of assigned carriers (60px, click → carrier list)
  Status    ●Active / ●Inactive pill (80px)
  Actions   [✏ Edit] [⋮] (80px, frozen right)

COLUMN RESIZE: drag column border
COLUMN REORDER: drag column header
COLUMN VISIBILITY: [⚙ Columns] popover — checkbox list of all columns

SORT: click header → asc; click again → desc; shift+click → multi-sort
SORT INDICATOR: ▲ / ▼ icon on sorted column header
```

### 1.3 Route Create / Edit Form (Right Drawer, 520px)

```
┌── NEW ROUTE / EDIT ROUTE ─────────────────────────────────────────────────────────┐
│                                                              [×] Close  [? Help]   │
│  ─────────────────────────────────────────────────────────────────────────────     │
│                                                                                    │
│  ROUTE CODE *                                                                      │
│  [DEL-MUM-01                    ]  ← auto-generated or manual; unique validation  │
│  Format: {ORIGIN_3}-{DEST_3}-{SEQ_2}   [Auto-generate]                            │
│                                                                                    │
│  ROUTE NAME *                                                                      │
│  [Delhi to Mumbai                                               ]                  │
│                                                                                    │
│  ORIGIN *                          DESTINATION *                                   │
│  [DC Delhi (NR)      ▼]            [DC Mumbai (WR)     ▼]                          │
│  (from Location Master)            (from Location Master)                          │
│                                                                                    │
│  DISTANCE (km) *                   SLA WINDOW (hours) *                            │
│  [1420          ]                  [10                 ]                            │
│                                                                                    │
│  REGION *                          ROUTE TYPE                                      │
│  [North Region ▼]                  [● FTL  ○ LTL  ○ Both]                         │
│                                                                                    │
│  ASSIGNED CARRIERS                                                                 │
│  [BlueDart ×]  [DTDC ×]  [+ Add Carrier ▼]                                        │
│  (multi-select from Carrier Master)                                                │
│                                                                                    │
│  PREFERRED VEHICLE TYPES                                                           │
│  ☑ 20ft  ☑ 26ft  ☑ 32ft  ☐ LCV  ☐ Trailer                                       │
│                                                                                    │
│  WAYPOINTS (optional)                                                              │
│  + Add Waypoint:  [Location ▼]  [Order: 1]  [Estimated stop time: 30 min]         │
│  Current: None                                                                     │
│                                                                                    │
│  NOTES                                                                             │
│  [Route-specific notes, hazards, toll gates, restrictions...]                      │
│                                                                                    │
│  STATUS                                                                            │
│  ● Active  ○ Inactive  ○ Draft                                                     │
│                                                                                    │
│  ─────────────────────────────────────────────────────────────────────────────     │
│  [Cancel]                          [Save Draft]  [Save & Activate]                 │
└────────────────────────────────────────────────────────────────────────────────────┘

VALIDATION:
  Route Code:  required, unique, format regex
  Name:        required, min 3 chars
  Origin:      required, must be in Location Master
  Destination: required, must be in Location Master, ≠ Origin
  Distance:    required, numeric, > 0
  SLA Window:  required, numeric, > 0
  Region:      required

INLINE VALIDATION: field-level on blur
SUBMIT VALIDATION: all fields before save
DUPLICATE CHECK: Route Code + (Origin + Destination) pair must be unique
```

### 1.4 Bulk Upload Template

```
XLSX TEMPLATE COLUMNS (Route Master):
  A: RouteCode*       B: RouteName*     C: OriginCode*    D: DestCode*
  E: DistanceKm*      F: SLAHours*      G: RegionCode*    H: RouteType (FTL/LTL/Both)
  I: Carriers         J: VehicleTypes   K: Notes          L: Status (Active/Inactive)

  * = required
  Carriers: pipe-separated carrier codes (BlueDart|DTDC)
  VehicleTypes: pipe-separated (20ft|26ft|32ft)

VALIDATION RULES IN TEMPLATE (row-level):
  RouteCode: unique across existing + new
  OriginCode: must exist in Location Master
  DestCode: must exist in Location Master
  DistanceKm: integer > 0
  SLAHours: integer > 0
  RegionCode: must exist in system config regions

PREVIEW (first 10 rows):
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Row  RouteCode   RouteName         OriginCode  DestCode  Dist  Status  │
  │  ──────────────────────────────────────────────────────────────────     │
  │  2    DEL-MUM-01  Delhi to Mumbai   DEL-DC-01   MUM-DC-01 1420  ✅     │
  │  3    BOM-PUN-99  ← duplicate       ← conflict  —         —     ❌     │
  │  4    DEL-HYD-99  Delhi Hyderabad   DEL-DC-01   HYD-DC-02 1270  ✅     │
  └─────────────────────────────────────────────────────────────────────────┘
  ✅ = valid   ❌ = error (hover for reason)   ⚠ = warning
```

---

## 2. SCREEN 2 — SCHEDULE MASTER

**Route:** `/admin/schedules`
**DAL Key:** `tct_schedules`
**Purpose:** Define dispatch frequency, departure windows, and blackout dates per route

### 2.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › Schedule Master                                                            ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  SCHEDULE MASTER                                  8 schedules  •  [+ New Schedule] ║
║                                                                                      ║
║  VIEW:  [● Grid View]  [○ Calendar View]          [⬆ Bulk Upload]  [⬇ Export]      ║
║                                                                                      ║
║  FILTER: Route [All ▼]  Day [All ▼]  Status [All ▼]  [🔍 Search...]                ║
║                                                                                      ║
║  ┌── DATA GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │☐│Sched.ID  │Route      │Days              │Dep.Window  │FreqType│HU Limit│Status│ ║
║  │─┼──────────┼───────────┼──────────────────┼────────────┼────────┼────────┼──────│ ║
║  │☐│SCH-001   │DEL-MUM-01 │Mon,Wed,Fri,Sun   │06:00–09:00 │3x/week │180     │● Act │ ║
║  │☐│SCH-002   │BOM-PUN-03 │Daily             │07:00–10:00 │Daily   │120     │● Act │ ║
║  │☐│SCH-003   │DEL-HYD-02 │Tue,Thu,Sat       │08:00–11:00 │3x/week │180     │● Act │ ║
║  │☐│SCH-004   │MAA-BLR-01 │Mon–Fri           │09:00–12:00 │5x/week │120     │● Act │ ║
║  │☐│SCH-005   │DEL-BLR-03 │Mon,Thu           │05:00–08:00 │2x/week │180     │● Act │ ║
║  │☐│SCH-006   │DEL-MUM-01 │Tue,Thu,Sat       │14:00–17:00 │3x/week │180     │● Act │ ║
║  │☐│SCH-007   │HYD-BOM-02 │Mon,Wed,Fri       │06:00–09:00 │3x/week │ 80     │● Ina │ ║
║  │☐│SCH-008   │DEL-CCU-01 │Mon,Thu           │04:00–07:00 │2x/week │180     │● Act │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 2.2 Schedule Form

```
┌── NEW / EDIT SCHEDULE ────────────────────────────────────────────────────────────┐
│  ROUTE *                                                                           │
│  [DEL-MUM-01 — Delhi to Mumbai  ▼]                                                │
│                                                                                    │
│  FREQUENCY TYPE *                                                                  │
│  ● Daily   ○ Selected Days   ○ Custom interval (every N days)                     │
│                                                                                    │
│  ACTIVE DAYS *  (shown if "Selected Days")                                        │
│  [☑ Mon] [☑ Tue] [☑ Wed] [☑ Thu] [☑ Fri] [☐ Sat] [☐ Sun]                       │
│                                                                                    │
│  DEPARTURE WINDOW *                                                                │
│  From [06:00  🕗]   To [09:00  🕗]                                                │
│  (Dispatches for this route must depart within this window)                       │
│                                                                                    │
│  MAX HU PER DISPATCH *           MAX DISPATCHES PER DAY                           │
│  [180                ]           [3                  ]                            │
│                                                                                    │
│  EFFECTIVE FROM *                EFFECTIVE TO                                      │
│  [01 Jun 2026  📅]               [31 Dec 2026  📅]  (blank = no end date)         │
│                                                                                    │
│  BLACKOUT DATES                                                                    │
│  [+ Add Date]  [+ Add Date Range]                                                  │
│  ┌────────────────────────────────────────┐                                       │
│  │  15 Aug 2026  Independence Day  [×]    │                                       │
│  │  25 Dec 2026  Christmas Day     [×]    │                                       │
│  └────────────────────────────────────────┘                                       │
│                                                                                    │
│  NOTES                                                                             │
│  [e.g. "Night schedule — driver bonus applicable"]                                 │
│                                                                                    │
│  STATUS   ● Active  ○ Inactive                                                     │
│                                                                                    │
│  [Cancel]                         [Save Draft]  [Save & Activate]                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Calendar View

```
CALENDAR VIEW (toggle from grid):
  Month calendar grid (7 columns × 5–6 rows)
  Each day cell: shows routes that have scheduled departures
  Color coding: per route (each route gets a consistent color dot)
  Blackout dates: red × overlay on cell
  Day click → popover: list of schedules for that day
  [← Prev Month]  [Jun 2026]  [Next Month →]

┌──────────────────────────────────────────────────────────────────────────────────┐
│  Jun 2026                                                                        │
│  Mon      Tue      Wed      Thu      Fri      Sat      Sun                      │
│  1        2        3        4        5        6        7                        │
│  ●DEL-MUM ●BOM-PUN ●DEL-MUM ●BOM-PUN ●DEL-MUM          ●DEL-MUM               │
│  ●BOM-PUN          ●BOM-PUN          ●BOM-PUN          ●BOM-PUN               │
│  ●DEL-HYD          ●DEL-HYD          ●DEL-HYD                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SCREEN 3 — CARRIER MASTER

**Route:** `/admin/carriers`
**DAL Key:** `tct_carriers`
**Purpose:** Full carrier profile — contacts, performance, SLA clauses, integration config

### 3.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › Carrier Master                                                             ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  CARRIER MASTER                                   9 carriers  •  [+ New Carrier]   ║
║                                                                                      ║
║  FILTER: Type [All ▼]  Region [All ▼]  Status [All ▼]  Grade [All ▼]              ║
║  [🔍 Search name, code...]                                                           ║
║                                                                                      ║
║  ACTION BAR: [+ New Carrier]  [⬆ Bulk Upload]  [⬇ Export]  [⚙ Columns]            ║
║                                                                                      ║
║  ┌── DATA GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │☐│Code   │Name              │Type │OTA%│OTD%│Score│Exc%│Routes│Integr.│Status │ ║
║  │─┼───────┼──────────────────┼─────┼────┼────┼─────┼────┼──────┼───────┼───────│ ║
║  │☐│CAR-001│BlueDart Logistics│FTL  │96% │94% │ 92  │0.8%│  3   │✅ Live│●Active│ ║
║  │☐│CAR-002│DTDC Courier      │FTL  │91% │89% │ 78  │1.2%│  4   │✅ Live│●Active│ ║
║  │☐│CAR-003│Delhivery         │LTL  │88% │85% │ 74  │1.8%│  3   │⚠ Err │●Active│ ║
║  │☐│CAR-004│XpressBees Express│Expr │91% │88% │ 81  │1.0%│  2   │✅ Live│●Active│ ║
║  │☐│CAR-005│Gati KWE          │3PL  │83% │80% │ 69  │2.4%│  2   │○ None │●Active│ ║
║  │☐│CAR-006│Mahindra Logistics│FTL  │89% │86% │ 76  │1.5%│  1   │✅ Live│●Active│ ║
║  │☐│CAR-007│TCI Express       │FTL  │85% │82% │ 71  │2.0%│  2   │○ None │●Active│ ║
║  │☐│CAR-008│Ecom Express      │Expr │79% │76% │ 58  │3.1%│  1   │○ None │●Inact │ ║
║  │☐│CAR-009│Test Carrier      │FTL  │ — % │ —  │  — │  — │  0   │○ None │●Draft │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 3.2 Carrier Form (Tabbed, full-page drawer 720px)

```
┌── CARRIER PROFILE: BlueDart Logistics ────────────────────────────────────────────┐
│  [Profile]  [Contacts]  [Performance]  [SLA Clauses]  [Integration]  [Documents]  │
│  ─────────────────────────────────────────────────────────────────────────────     │
│                                                                                    │
│  ── TAB: PROFILE ──                                                                │
│                                                                                    │
│  CARRIER CODE *        CARRIER NAME *                                              │
│  [CAR-001         ]    [BlueDart Logistics Ltd               ]                     │
│                                                                                    │
│  CARRIER TYPE *        CARRIER TIER                                                │
│  [● FTL  ○ LTL  ○ Express  ○ 3PL]   [Tier 1 (Preferred) ▼]                       │
│                                                                                    │
│  GST NUMBER            PAN NUMBER                                                  │
│  [27AABCB1234A1Z5 ]    [AABCB1234A  ]                                              │
│                                                                                    │
│  REGISTERED ADDRESS                                                                │
│  [12, Nehru Place, New Delhi 110019                                          ]     │
│                                                                                    │
│  OPERATING REGIONS                                                                 │
│  [North ×]  [West ×]  [South ×]  [+ Add Region ▼]                                 │
│                                                                                    │
│  PREFERRED ROUTES                                                                  │
│  [DEL-MUM-01 ×]  [BOM-PUN-03 ×]  [DEL-HYD-02 ×]  [+ Add Route ▼]               │
│                                                                                    │
│  SURCHARGE TYPE *                                                                  │
│  ● FTL (×1.00)  ○ LTL (×0.85)  ○ Express (×1.35)  ○ 3PL (×1.10)                │
│  Custom override factor: [1.00   ] (leave at 1.00 for standard)                   │
│                                                                                    │
│  STATUS   ● Active  ○ Inactive  ○ Blacklisted                                     │
│  BLACKLIST REASON (if blacklisted): [_______________________]                     │
│                                                                                    │
│  ── TAB: CONTACTS ──                                                               │
│                                                                                    │
│  CONTACT TABLE:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │  Name               Role           Phone          Email         Channel     │  │
│  │  ───────────────────────────────────────────────────────────────────────── │  │
│  │  Rajesh Sharma      Ops Head       +91-9800000001  rajesh@bd.com ☑W ☑E ○S  │  │
│  │  Priya Nair         Account Mgr    +91-9800000002  priya@bd.com  ☑W ☐E ○S  │  │
│  │  Control Center     24×7 Hotline   1800-XXX-XXXX   ops@bd.com   ☐W ☑E ○S  │  │
│  │  [+ Add Contact]                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  Channel: W=WhatsApp  E=Email  S=SMS                                              │
│                                                                                    │
│  ── TAB: SLA CLAUSES ──                                                            │
│                                                                                    │
│  SLA PENALTY CLAUSES:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │  Clause   Type        Threshold    Penalty         Cap                      │  │
│  │  ──────────────────────────────────────────────────────────────────────    │  │
│  │  §4.1     OTA breach  > 30 min     ₹20,000/trip   ₹1,00,000/month          │  │
│  │  §4.2     OTD breach  > 0 min      ₹40,000/trip   ₹2,00,000/month          │  │
│  │  §4.3     Shortage    > 2 HU       ₹5,000/HU      ₹50,000/trip             │  │
│  │  §5.1     Seal breach Any          ₹10,000/trip   —                        │  │
│  │  [+ Add Clause]  [Download SLA PDF ⬇]                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
│  ── TAB: INTEGRATION ──                                                            │
│                                                                                    │
│  ADAPTER TYPE:  ● REST API  ○ SFTP  ○ EDI  ○ Manual (no integration)             │
│  ENDPOINT URL:  [https://api.carrier.com/v2/                               ]      │
│  API KEY:       [••••••••••••••••••  ] [Rotate Key]  [Test Connection]            │
│  WEBHOOK URL:   [https://tct.yourdomain.com/webhooks/CAR-001              ]       │
│  TRACKING:      ● Push (carrier pushes GPS)  ○ Pull (we poll every N min)         │
│                                                                                    │
│  INTEGRATION STATUS:  ✅ Active  •  Last ping: 2 min ago  •  Latency: 142ms       │
│  [Test Now]  [View Integration Logs →]                                             │
│                                                                                    │
│  [Cancel]                    [Save Draft]        [Save & Update]                  │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. SCREEN 4 — VEHICLE MASTER

**Route:** `/admin/vehicles`
**DAL Key:** `tct_vehicles`
**Purpose:** Vehicle registry — registration, fitness, capacity, carrier assignment

### 4.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › Vehicle Master                                                             ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  VEHICLE MASTER                                  28 vehicles  •  [+ New Vehicle]   ║
║                                                                                      ║
║  FILTER: Type [All ▼]  Carrier [All ▼]  Fitness [All ▼]  Status [All ▼]           ║
║  [🔍 Search reg. number, carrier...]                                                 ║
║                                                                                      ║
║  ACTION BAR: [+ New Vehicle]  [⬆ Bulk Upload]  [⬇ Export]  [⚙ Columns]            ║
║                                                                                      ║
║  ┌── DATA GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │☐│Reg. Number  │Type  │Carrier          │MaxWt│MaxCBM│MaxHU│Fitness   │Status  │ ║
║  │─┼─────────────┼──────┼─────────────────┼─────┼──────┼─────┼──────────┼────────│ ║
║  │☐│MH-01-AX-2341│32ft  │BlueDart         │10t  │62    │180  │✅ Nov 26 │●Active │ ║
║  │☐│MH-01-AX-2342│32ft  │BlueDart         │10t  │62    │180  │✅ Dec 26 │●Active │ ║
║  │☐│MH-12-BX-8834│26ft  │DTDC             │7.5t │42    │120  │✅ Sep 26 │●Active │ ║
║  │☐│AP-05-CY-1192│26ft  │BlueDart         │7.5t │42    │120  │⚠ Aug 26 │●Active │ ║
║  │☐│KA-01-DX-4421│32ft  │Mahindra Logist. │10t  │62    │180  │✅ Mar 27 │●Active │ ║
║  │☐│DL-01-EF-2211│Trlr  │BlueDart         │25t  │120   │400  │✅ Jun 27 │●Active │ ║
║  │☐│MH-05-GH-9912│20ft  │DTDC             │5t   │28    │80   │❌ EXPIRE │●Suspen │ ║
║  │  [+ 21 more]                                                                    │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  FITNESS EXPIRY ALERT BANNER (when any vehicle expires within 30 days):             ║
║  ⚠  3 vehicles have fitness expiring within 30 days. [View Expiring →]             ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 4.2 Vehicle Form

```
┌── NEW / EDIT VEHICLE ─────────────────────────────────────────────────────────────┐
│                                                                                    │
│  REGISTRATION NUMBER *                                                             │
│  [MH-01-AX-2341           ]  ← uppercase enforced; unique validation              │
│                                                                                    │
│  VEHICLE TYPE *               CARRIER *                                            │
│  [32ft Truck          ▼]      [BlueDart Logistics (CAR-001) ▼]                    │
│                                                                                    │
│  CAPACITY (auto-filled from vehicle type; override if custom):                    │
│  Max Weight (kg): [10000   ]  Max Volume (CBM): [62   ]  Max HU: [180   ]         │
│  [Reset to type defaults]                                                          │
│                                                                                    │
│  COMPLIANCE DOCUMENTS:                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │  Document          Number             Expiry          Status    Upload       │  │
│  │  ─────────────────────────────────────────────────────────────────────────  │  │
│  │  RC Book           MH01AX2341         Perpetual       ✅        [Update]    │  │
│  │  Fitness Cert.     FC-2024-88812      15 Nov 2026     ✅        [Update]    │  │
│  │  Insurance         INS-2024-44012     30 Sep 2026     ✅        [Update]    │  │
│  │  PUCC              PUCC-2024-77321    18 Mar 2026     ⚠ Expiring[Update]    │  │
│  │  National Permit   NP-2024-12234      30 Jun 2026     ✅        [Update]    │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
│  ASSIGNED DRIVER (current / default):                                              │
│  [Suresh Patil (DRV-0042) ▼]  (from driver registry — optional)                  │
│                                                                                    │
│  GPS DEVICE ID                TELEMATICS PROVIDER                                  │
│  [GPS-MH01AX2341     ]        [Verizon Connect   ▼]  (or "Manual" for no GPS)    │
│                                                                                    │
│  STATUS   ● Active  ○ Inactive  ○ Suspended  ○ In Maintenance                    │
│  STATUS REASON (if not Active): [Fitness expired — renewal in progress]            │
│                                                                                    │
│  [Cancel]              [Save Draft]              [Save & Activate]                 │
└────────────────────────────────────────────────────────────────────────────────────┘

EXPIRY ALERTS (auto-generated):
  If any document expires within 30 days → amber badge on vehicle row
  If expired → red badge, vehicle suspended automatically
  Alert raised in AlertService.getAll() → shows in executive dashboard
```

---

## 5. SCREEN 5 — LOCATION MASTER

**Route:** `/admin/locations`
**DAL Key:** `tct_locations`
**Purpose:** All DCs, warehouses, plants, customer sites used as dispatch origins/destinations

### 5.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › Location Master                                                            ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  LOCATION MASTER                                 24 locations  •  [+ New Location]  ║
║                                                                                      ║
║  FILTER: Type [All ▼]  Region [All ▼]  State [All ▼]  Status [All ▼]              ║
║  [🔍 Search code, name, city...]                                                     ║
║                                                                                      ║
║  ┌── DATA GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │☐│Code       │Name               │Type      │City      │State│Region│PinCode│St│ ║
║  │─┼───────────┼───────────────────┼──────────┼──────────┼─────┼──────┼───────┼──│ ║
║  │☐│DEL-DC-01  │DC Delhi           │DC        │New Delhi │DL   │North │110019 │●A│ ║
║  │☐│MUM-DC-01  │DC Mumbai          │DC        │Mumbai    │MH   │West  │400070 │●A│ ║
║  │☐│BOM-WH-02  │Mumbai Warehouse 2 │Warehouse │Mumbai    │MH   │West  │400701 │●A│ ║
║  │☐│PUN-DC-01  │DC Pune            │DC        │Pune      │MH   │West  │411001 │●A│ ║
║  │☐│HYD-DC-02  │DC Hyderabad       │DC        │Hyderabad │TG   │South │500001 │●A│ ║
║  │☐│BLR-DC-01  │DC Bangalore       │DC        │Bengaluru │KA   │South │560001 │●A│ ║
║  │☐│MAA-DC-01  │DC Chennai         │DC        │Chennai   │TN   │South │600001 │●A│ ║
║  │☐│CCU-DC-01  │DC Kolkata         │DC        │Kolkata   │WB   │East  │700001 │●A│ ║
║  │☐│DEL-PLT-01 │Delhi Plant        │Plant     │Noida     │UP   │North │201301 │●A│ ║
║  │☐│MUM-CUST-03│Reliance Retail MBD│Customer  │Mumbai    │MH   │West  │400054 │●A│ ║
║  │  [+ 14 more]                                                                    │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 5.2 Location Form

```
┌── NEW / EDIT LOCATION ────────────────────────────────────────────────────────────┐
│                                                                                    │
│  LOCATION CODE *              LOCATION NAME *                                      │
│  [DEL-DC-01          ]        [DC Delhi                           ]                │
│  Format: {CITY}-{TYPE}-{SEQ}  [Auto-generate]                                     │
│                                                                                    │
│  LOCATION TYPE *              REGION *                                             │
│  [DC              ▼]          [North Region ▼]                                     │
│   Options: DC / Warehouse / Plant / Customer Site / Port / Airport / Other         │
│                                                                                    │
│  ADDRESS                                                                           │
│  Line 1: [Sector 18, NSEZ, Noida                                       ]          │
│  Line 2: [Near Noida Toll, National Highway 24                         ]          │
│  City:   [New Delhi            ]  State: [Delhi ▼]  PIN: [110019  ]               │
│  Country:[India               ]                                                    │
│                                                                                    │
│  GPS COORDINATES                                                                   │
│  Latitude: [28.5355   ]  Longitude: [77.3910   ]  [📍 Pick on Map] (stub)         │
│                                                                                    │
│  OPERATIONAL DETAILS                                                               │
│  Operating Hours:  From [06:00] To [22:00]  ☑ 24/7 override                      │
│  Dock Count:       [12                    ]                                        │
│  Handling Capacity:[5000 HU/day           ]                                        │
│  WMS Code:         [NSEZ-DC-001           ]  (for WMS integration mapping)        │
│                                                                                    │
│  CONTACTS                                                                          │
│  DC Manager:  [Ramesh Kumar       ]  [+91-98XXXXXXXX]  [ramesh@dc.com    ]        │
│  Gate Officer:[Arvind Sharma      ]  [+91-97XXXXXXXX]                              │
│  [+ Add Contact]                                                                   │
│                                                                                    │
│  STATUS   ● Active  ○ Inactive  ○ Temporarily Closed                              │
│  CLOSURE REASON: [__________________________]  REOPEN DATE: [📅]                  │
│                                                                                    │
│  [Cancel]              [Save Draft]              [Save & Activate]                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. SCREEN 6 — SLA MASTER

**Route:** `/admin/sla`
**DAL Key:** `tct_sla_configs`
**Purpose:** Define SLA windows, OTA/OTD thresholds, and penalty structures per route/carrier

### 6.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › SLA Master                                                                 ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  SLA MASTER                                       16 SLA configs  •  [+ New SLA]   ║
║                                                                                      ║
║  FILTER: Route [All ▼]  Carrier [All ▼]  Type [All ▼]  Status [All ▼]             ║
║  [🔍 Search...]                                                                      ║
║                                                                                      ║
║  ┌── DATA GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │☐│SLA ID  │Route      │Carrier    │SLA Type│Window│OTA%Tgt│OTD%Tgt│Penalty│St │ ║
║  │─┼────────┼───────────┼───────────┼────────┼──────┼───────┼───────┼───────┼───│ ║
║  │☐│SLA-001 │DEL-MUM-01 │BlueDart   │Route   │10h   │95%    │93%    │₹20k   │●A │ ║
║  │☐│SLA-002 │DEL-MUM-01 │DTDC       │Route   │10h   │92%    │90%    │₹15k   │●A │ ║
║  │☐│SLA-003 │BOM-PUN-03 │ALL        │Route   │4h    │97%    │95%    │₹10k   │●A │ ║
║  │☐│SLA-004 │ALL        │BlueDart   │Carrier │—     │96%    │94%    │₹20k   │●A │ ║
║  │☐│SLA-005 │ALL        │ALL        │Global  │—     │90%    │88%    │₹5k    │●A │ ║
║  │☐│SLA-006 │DEL-BLR-03 │ALL        │Route   │18h   │88%    │85%    │₹15k   │●A │ ║
║  │  [+ 10 more]                                                                    │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  SLA PRECEDENCE RULE:                                                               ║
║  Route+Carrier specific > Route specific > Carrier specific > Global default        ║
║  [View Precedence Logic →]                                                           ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 6.2 SLA Form

```
┌── NEW / EDIT SLA CONFIG ──────────────────────────────────────────────────────────┐
│                                                                                    │
│  SLA SCOPE *                                                                       │
│  ● Route + Carrier specific                                                        │
│  ○ Route specific (applies to all carriers on route)                               │
│  ○ Carrier specific (applies to all routes for carrier)                            │
│  ○ Global default (fallback for all)                                               │
│                                                                                    │
│  ROUTE (if applicable)         CARRIER (if applicable)                             │
│  [DEL-MUM-01 ▼]                [BlueDart (CAR-001) ▼]                              │
│                                                                                    │
│  SLA WINDOW                                                                        │
│  Delivery window (hours): [10  ]  from planned departure                           │
│  ☑ Override route default SLA window                                               │
│                                                                                    │
│  PERFORMANCE TARGETS:                                                              │
│  OTA target (%): [95   ]  (On-Time Arrival within SLA window)                     │
│  OTD target (%): [93   ]  (On-Time Delivery confirmed by POD)                     │
│                                                                                    │
│  GRACE PERIOD:               MEASUREMENT PERIOD:                                   │
│  Arrival: [30  ] minutes     [● Monthly  ○ Weekly  ○ Per-trip]                    │
│  Dept.:   [15  ] minutes                                                           │
│                                                                                    │
│  PENALTY STRUCTURE:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │  Trigger              Threshold     Penalty Per Trip   Monthly Cap           │  │
│  │  ─────────────────────────────────────────────────────────────────────     │  │
│  │  OTA breach           > 30 min      ₹[20,000  ]        ₹[1,00,000 ]        │  │
│  │  OTD breach           > 0 min       ₹[40,000  ]        ₹[2,00,000 ]        │  │
│  │  Unresolved shortage  > 2 HU        ₹[5,000  ]/HU      ₹[50,000  ]         │  │
│  │  Seal breach          Any           ₹[10,000  ]        —                    │  │
│  │  [+ Add Penalty Clause]                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
│  EFFECTIVE FROM *             EFFECTIVE TO                                         │
│  [01 Jun 2026  📅]            [31 Mar 2027  📅]  (blank = perpetual)              │
│                                                                                    │
│  NOTES / CONTRACT REFERENCE                                                        │
│  [Contract ref: MSA-2026-BD-001, Schedule A, Clause 4]                             │
│                                                                                    │
│  STATUS   ● Active  ○ Inactive  ○ Draft                                            │
│                                                                                    │
│  [Cancel]              [Save Draft]              [Save & Activate]                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. SCREEN 7 — EXCEPTION MASTER

**Route:** `/admin/exception-types`
**DAL Key:** `tct_exception_types`
**Purpose:** Configure exception types — default severity, resolution SLAs, escalation rules, auto-detection

### 7.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › Exception Type Master                                                      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  EXCEPTION TYPE MASTER              16 types  •  [+ New Type]  [↺ Reset Defaults]  ║
║                                                                                      ║
║  ┌── DATA GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │☐│Type Code         │Label              │Def.Sev│Res.SLA│Auto│Esc.Hr│Status     │ ║
║  │─┼──────────────────┼───────────────────┼───────┼───────┼────┼──────┼───────────│ ║
║  │☐│arrival-delay     │Arrival Delay      │🟠HIGH │4h     │✅  │4h    │●Active    │ ║
║  │☐│departure-delay   │Departure Delay    │🟡MED  │8h     │✅  │8h    │●Active    │ ║
║  │☐│sla-breach        │SLA Breach         │🔴CRIT │1h     │✅  │1h    │●Active    │ ║
║  │☐│seal-mismatch     │Seal Mismatch      │🔴CRIT │1h     │✅  │1h    │●Active    │ ║
║  │☐│hu-shortage       │HU Shortage        │🟠HIGH │4h     │✅  │4h    │●Active    │ ║
║  │☐│hu-excess         │HU Excess          │🟡MED  │8h     │✅  │8h    │●Active    │ ║
║  │☐│damaged-goods     │Damaged Goods      │🟠HIGH │4h     │☐   │4h    │●Active    │ ║
║  │☐│theft-risk        │Theft Risk         │🔴CRIT │1h     │✅  │1h    │●Active    │ ║
║  │☐│vehicle-breakdown │Vehicle Breakdown  │🟠HIGH │4h     │☐   │4h    │●Active    │ ║
║  │☐│route-deviation   │Route Deviation    │🟠HIGH │4h     │✅  │4h    │●Active    │ ║
║  │☐│document-missing  │Document Missing   │🟡MED  │8h     │✅  │8h    │●Active    │ ║
║  │☐│carrier-nonresp   │Carrier Non-Resp.  │🟠HIGH │4h     │☐   │4h    │●Active    │ ║
║  │☐│weight-variance   │Weight Variance    │🟡MED  │8h     │✅  │8h    │●Active    │ ║
║  │☐│temperature-breach│Temperature Breach │🟠HIGH │4h     │☐   │4h    │●Active    │ ║
║  │☐│customs-hold      │Customs Hold       │🟠HIGH │4h     │☐   │4h    │●Active    │ ║
║  │☐│wrong-dispatch    │Wrong Dispatch     │🔴CRIT │1h     │✅  │1h    │●Active    │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 7.2 Exception Type Form

```
┌── EDIT EXCEPTION TYPE: arrival-delay ─────────────────────────────────────────────┐
│                                                                                    │
│  TYPE CODE *                  DISPLAY LABEL *                                      │
│  [arrival-delay         ]     [Arrival Delay                        ]              │
│  (read-only for system types; editable for custom)                                 │
│                                                                                    │
│  DEFAULT SEVERITY *                                                                │
│  ○ 🔴 CRITICAL   ● 🟠 HIGH   ○ 🟡 MEDIUM   ○ 🟢 LOW   ○ 🔵 INFO                 │
│                                                                                    │
│  RESOLUTION SLA *             AUTO-ESCALATION AFTER *                              │
│  [4    ] hours                [4    ] hours (from time of raise, if unresolved)   │
│                                                                                    │
│  ESCALATION PATH:                                                                  │
│  L1: [Operations Executive ▼]  → L2: [Regional Manager ▼]  → L3: [SC Head ▼]    │
│                                                                                    │
│  AUTO-DETECTION                                                                    │
│  ☑ System can auto-raise this exception type                                       │
│  Trigger condition: [Actual arrival > planned arrival + grace period]              │
│  Auto-raise when: [Dispatch SLA clock shows at-risk (< 2h remaining)]             │
│  Auto-notification: ☑ Carrier  ☑ Transport Manager  ☐ Regional Manager           │
│                                                                                    │
│  NOTIFICATION TEMPLATES:                                                           │
│  WhatsApp: [🚨 Arrival delay on dispatch {dispatchId}. ETA now {eta}. ...]        │
│  Email:    [Subject: Arrival Delay — {dispatchId}  Body: {template_id}]           │
│                                                                                    │
│  RESOLUTION TEMPLATES (root cause → resolution note template):                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │  Root Cause         Template                                                 │  │
│  │  ──────────────────────────────────────────────────────────────────────    │  │
│  │  carrier-delay      "Carrier {name} delayed departure/arrival by {X}h..."  │  │
│  │  weather            "Weather disruption on {route} caused {X}h delay..."   │  │
│  │  vehicle-breakdown  "Vehicle {reg} broke down at {location}..."             │  │
│  │  [+ Add Template]                                                            │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
│  AFFECTS METRICS:                                                                  │
│  ☑ OTA  ☑ OTD  ☐ Reconciliation  ☐ Seal integrity                               │
│                                                                                    │
│  CARRIER FAULT DEFAULT:  ● Assumed yes  ○ Assumed no  ○ Case-by-case             │
│  BILLABLE BY DEFAULT:    ● Yes  ○ No                                              │
│                                                                                    │
│  STATUS   ● Active  ○ Inactive                                                    │
│                                                                                    │
│  [Cancel]                          [Save Changes]                                  │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. SCREEN 8 — USER MANAGEMENT

**Route:** `/admin/users`
**DAL Key:** `tct_users`
**Purpose:** Create, manage, and deactivate platform users; assign roles and DCs

### 8.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › User Management                                                            ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  USER MANAGEMENT                                  18 users  •  [+ Invite User]     ║
║                                                                                      ║
║  FILTER: Role [All ▼]  DC [All ▼]  Status [All ▼]                                 ║
║  [🔍 Search name, email, ID...]                                                      ║
║                                                                                      ║
║  ACTION BAR: [+ Invite User]  [⬆ Bulk Upload]  [⬇ Export]  [⚙ Columns]            ║
║              [Reset Passwords (selected)]  [Deactivate (selected)]                  ║
║                                                                                      ║
║  ┌── DATA GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │☐│User ID  │Name            │Email                │Role       │DC       │Last  │St│ ║
║  │─┼─────────┼────────────────┼─────────────────────┼───────────┼─────────┼──────┼──│ ║
║  │☐│USR-001  │Rahul Kumar     │rahul@company.com    │Trans. Mgr │Delhi DC │14:28 │●A│ ║
║  │☐│USR-002  │Priya Mehta     │priya@company.com    │Ops Exec   │Delhi DC │13:52 │●A│ ║
║  │☐│USR-003  │Ramesh Kumar    │ramesh@company.com   │WH Manager │Delhi DC │14:30 │●A│ ║
║  │☐│USR-004  │Vikram Raju     │vikram@company.com   │Trans. Mgr │Mumbai DC│10:14 │●A│ ║
║  │☐│USR-005  │Sneha Iyer      │sneha@company.com    │Reg. Mgr   │All (NR) │09:45 │●A│ ║
║  │☐│USR-006  │Arun Singh      │arun@company.com     │SC Head    │All      │08:30 │●A│ ║
║  │☐│USR-007  │Kavitha Nair    │kavitha@company.com  │Gate Off.  │Delhi DC │14:01 │●A│ ║
║  │☐│USR-008  │Dev Sharma      │dev@company.com      │Admin      │All      │13:00 │●A│ ║
║  │☐│USR-009  │Ritu Saxena     │ritu@company.com     │Ops Exec   │Mumbai DC│—     │●I│ ║
║  │☐│USR-010  │Pending invite  │new.user@company.com │—          │—        │—     │⏳│ ║
║  │  [+ 8 more]                                                                    │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 8.2 User Form

```
┌── NEW USER / EDIT USER ───────────────────────────────────────────────────────────┐
│  [Profile]  [Access & Permissions]  [Notifications]  [Activity Log]               │
│  ─────────────────────────────────────────────────────────────────────────────     │
│                                                                                    │
│  ── TAB: PROFILE ──                                                                │
│                                                                                    │
│  FIRST NAME *                 LAST NAME *                                          │
│  [Rahul                 ]     [Kumar                   ]                           │
│                                                                                    │
│  EMAIL ADDRESS *              PHONE                                                │
│  [rahul@company.com     ]     [+91-9800000001          ]                           │
│  (used for login + notifications)                                                  │
│                                                                                    │
│  EMPLOYEE ID                  DEPARTMENT                                           │
│  [EMP-00142             ]     [Supply Chain            ]                           │
│                                                                                    │
│  ── TAB: ACCESS & PERMISSIONS ──                                                   │
│                                                                                    │
│  PRIMARY ROLE *                                                                    │
│  [Transport Manager ▼]                                                             │
│  Role permissions: [View Role Details →]                                           │
│                                                                                    │
│  ADDITIONAL ROLES (optional)                                                       │
│  [+ Add Role ▼]                                                                    │
│  (useful for cross-functional users)                                               │
│                                                                                    │
│  DC / LOCATION ACCESS *                                                            │
│  ● Specific DCs:   [DC Delhi ×]  [DC Mumbai ×]  [+ Add ▼]                        │
│  ○ All DCs in region: [North Region ▼]                                             │
│  ○ All DCs (system-wide)                                                           │
│                                                                                    │
│  CARRIER ACCESS                                                                    │
│  ● All carriers   ○ Specific: [+ Select carriers ▼]                               │
│                                                                                    │
│  ROUTE ACCESS                                                                      │
│  ● All routes     ○ Specific routes: [+ Select routes ▼]                          │
│                                                                                    │
│  ── TAB: NOTIFICATIONS ──                                                          │
│                                                                                    │
│  NOTIFICATION PREFERENCES:                                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  Event                      WhatsApp    Email    SMS    In-App              │   │
│  │  ──────────────────────────────────────────────────────────────────────    │   │
│  │  CRITICAL exceptions        ☑           ☑        ☑      ☑                 │   │
│  │  HIGH exceptions            ☑           ☐        ☐      ☑                 │   │
│  │  SLA breach                 ☑           ☑        ☐      ☑                 │   │
│  │  Dispatch assigned to me    ☑           ☐        ☐      ☑                 │   │
│  │  Reconciliation complete    ☐           ☑        ☐      ☑                 │   │
│  │  Shift handoff              ☐           ☑        ☐      ☐                 │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  STATUS   ● Active  ○ Inactive  ○ Suspended                                       │
│  SUSPENSION REASON: [_____________________________]                               │
│                                                                                    │
│  [Cancel]         [Reset Password]         [Save Changes]                          │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Invite User Flow

```
[+ Invite User] → INVITE MODAL:
┌──────────────────────────────────────────────────────────────────────────┐
│  Invite New User                                                          │
│  ─────────────────────────────────────────────────────────────────────   │
│  Email: [new.user@company.com                              ]              │
│  Role:  [Transport Manager ▼]                                             │
│  DC:    [DC Delhi ▼]                                                      │
│  Note:  [Welcome to TCT platform. Your login details follow.]             │
│                                                                            │
│  Invite expires in: ● 24h  ○ 72h  ○ 7 days                               │
│                                                                            │
│  [Cancel]                               [Send Invitation Email]           │
└──────────────────────────────────────────────────────────────────────────┘

ON INVITE SEND:
  User record created: status = PENDING_INVITE
  Temporary password generated, stored hashed in localStorage
  NotificationEngine.notify(email, 'user-invite', { tempPassword, expiry })
  Pending invite row appears in grid with ⏳ status badge

USER ACCEPTS INVITE:
  (simulated in current localStorage model)
  First login → forces password change
  Status changes: PENDING → ACTIVE
```

---

## 9. SCREEN 9 — ROLE MANAGEMENT

**Route:** `/admin/roles`
**DAL Key:** `tct_roles`
**Purpose:** Define roles, their module-level permissions, and UI access control

### 9.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › Role Management                                                            ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ROLE MANAGEMENT                                  8 roles  •  [+ New Role]         ║
║                                                                                      ║
║  ┌── ROLE GRID ────────────────────────────────────────────────────────────────────┐ ║
║  │  Role Name              Users  Modules  Type            Last Modified   Status  │ ║
║  │  ─────────────────────────────────────────────────────────────────────────────  │ ║
║  │  Supply Chain Head      1      All      System (locked) 01 Jan 2026     ●Active │ ║
║  │  Regional Manager       2      12/13    System (locked) 01 Jan 2026     ●Active │ ║
║  │  Transport Manager      4      10/13    System (locked) 01 Jan 2026     ●Active │ ║
║  │  Warehouse Manager      3      6/13     System (locked) 01 Jan 2026     ●Active │ ║
║  │  Operations Executive   3      8/13     System (locked) 01 Jan 2026     ●Active │ ║
║  │  Gate Officer           2      3/13     System (locked) 01 Jan 2026     ●Active │ ║
║  │  Administrator          1      All+Admin System (locked) 01 Jan 2026    ●Active │ ║
║  │  Read-Only Viewer       2      8/13     Custom          12 Jun 2026     ●Active │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 9.2 Role Permission Matrix

```
CLICK ROLE ROW → opens Role Detail (full page or 80% drawer):

┌── ROLE: Transport Manager ────────────────────────────────────────────────────────┐
│  System role — base permissions locked. Custom overrides allowed.                  │
│  Users with this role: Rahul Kumar, Vikram Raju (+ 2 more)                        │
│  [+ Assign User]  [Clone Role]                                                     │
│  ─────────────────────────────────────────────────────────────────────────────     │
│                                                                                    │
│  MODULE PERMISSION MATRIX:                                                         │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  Module                    View  Create  Edit  Delete  Export  Admin       │   │
│  │  ──────────────────────────────────────────────────────────────────────   │   │
│  │  Executive Dashboard        ✅    —       —     —       ✅      —          │   │
│  │  Dispatch Management        ✅    ✅      ✅    —       ✅      —          │   │
│  │  Operations Workbench       ✅    ✅      ✅    —       ✅      —          │   │
│  │  Exception Center           ✅    ✅      ✅    —       ✅      —          │   │
│  │  Reconciliation Center      ✅    —       ✅    —       ✅      —          │   │
│  │  Planning Workbench         ✅    ✅      ✅    —       ✅      —          │   │
│  │  Carrier Management         ✅    —       —     —       ✅      —          │   │
│  │  Route Analytics            ✅    —       —     —       ✅      —          │   │
│  │  Reports                    ✅    —       —     —       ✅      —          │   │
│  │  Administration             —     —       —     —       —       —          │   │
│  │  System Configuration       —     —       —     —       —       —          │   │
│  │  Integration Monitor        ✅    —       —     —       —       —          │   │
│  │  Audit Log                  ✅    —       —     —       ✅      —          │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  FIELD-LEVEL RESTRICTIONS:                                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  Screen              Field             Access                               │   │
│  │  ──────────────────────────────────────────────────────────────────────   │   │
│  │  Carrier Master      API Keys          Hidden (not visible)                 │   │
│  │  Carrier Master      SLA Penalty Amt   Read-only                           │   │
│  │  Dispatch            Delete            Blocked                              │   │
│  │  [+ Add Restriction]                                                        │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  DATA SCOPE:                                                                       │
│  ○ Global (all DCs, all regions)                                                   │
│  ● Restricted to assigned DCs only                                                 │
│  ○ Restricted to assigned region only                                              │
│                                                                                    │
│  [Save Custom Overrides]                                                           │
└────────────────────────────────────────────────────────────────────────────────────┘

PERMISSION CELL VALUES:
  ✅  = allowed (green checkmark)
  —   = not applicable / hidden (dash, gray)
  🔒  = blocked (red lock icon) — for explicitly denied permissions
  ⚙   = admin-only permission
  [Custom override toggle per cell for non-system roles]
```

---

## 10. SCREEN 10 — SYSTEM CONFIGURATION

**Route:** `/admin/config`
**DAL Key:** `tct_system_config`
**Purpose:** Platform-wide settings — thresholds, integrations, notification config, regional settings

### 10.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  Admin › System Configuration                                    [💾 Save All]      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ┌── SETTINGS CATEGORIES (left nav, 200px) ──────────────────────────────────────┐ ║
║  │  ● General                                                                    │ ║
║  │  ○ Thresholds & Alerts                                                        │ ║
║  │  ○ Regional Settings                                                          │ ║
║  │  ○ Integration Settings                                                       │ ║
║  │  ○ Notification Templates                                                     │ ║
║  │  ○ Dashboard & Cache                                                          │ ║
║  │  ○ Audit & Compliance                                                         │ ║
║  └────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── GENERAL SETTINGS ────────────────────────────────────────────────────────────┐ ║
║  │                                                                                  │ ║
║  │  PLATFORM NAME          [Transport Control Tower                          ]      │ ║
║  │  COMPANY NAME           [Acme Supply Chain Ltd                            ]      │ ║
║  │  DEFAULT CURRENCY       [INR (₹)    ▼]                                          │ ║
║  │  DEFAULT DATE FORMAT    [DD MMM YYYY ▼]                                         │ ║
║  │  DEFAULT TIME FORMAT    [24h (HH:MM) ▼]                                         │ ║
║  │  DEFAULT TIMEZONE       [Asia/Kolkata (IST, UTC+5:30) ▼]                       │ ║
║  │  FISCAL YEAR START      [April ▼]                                               │ ║
║  │  LANGUAGE               [English ▼]                                             │ ║
║  │  DECIMAL SEPARATOR      [. (period) ▼]                                          │ ║
║  │                                                                                  │ ║
║  │  BARCODE FORMAT         [HU\d{7} ▼]   Custom: [                         ]      │ ║
║  │  DISPATCH ID PREFIX     [TCT-           ]                                        │ ║
║  │  EXCEPTION ID PREFIX    [EXC-           ]                                        │ ║
║  │  SESSION ID PREFIX      [SS-            ]                                        │ ║
║  │                                                                                  │ ║
║  └──────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

### 10.2 Thresholds & Alerts Settings

```
┌── THRESHOLDS & ALERTS ─────────────────────────────────────────────────────────────┐
│                                                                                      │
│  SLA RISK THRESHOLDS:                                                               │
│  AT RISK when SLA time remaining ≤ [4    ] hours                                   │
│  CRITICAL when SLA time remaining ≤ [1    ] hours                                  │
│                                                                                      │
│  UTILIZATION THRESHOLDS:                                                            │
│  OPTIMAL utilization ≥ [80 ]%  (green)                                             │
│  ACCEPTABLE utilization ≥ [60 ]%  (amber)   MINIMUM threshold: [60]%              │
│  POOR utilization < 60%  (red, triggers optimization suggestion)                   │
│                                                                                      │
│  CONSOLIDATION ENGINE:                                                              │
│  Default time window: [6     ] hours                                                │
│  Minimum utilization after merge: [60    ]%                                         │
│  Auto-suggest consolidation: ● Yes  ○ No                                            │
│                                                                                      │
│  DISPATCH DWELL TIME ALERTS (at receiving):                                         │
│  Amber alert after: [2     ] hours dwell at destination                             │
│  Red alert after:   [4     ] hours dwell at destination                             │
│                                                                                      │
│  EXCEPTION AUTO-ESCALATION DEFAULTS:                                                │
│  CRITICAL: escalate after [1   ] hours if unresolved                               │
│  HIGH:     escalate after [4   ] hours if unresolved                               │
│  MEDIUM:   escalate after [8   ] hours if unresolved                               │
│  LOW:      escalate after [24  ] hours if unresolved                               │
│                                                                                      │
│  DASHBOARD AUTO-REFRESH:                                                            │
│  Situation bars: [15   ] seconds                                                    │
│  KPI tiles:      [30   ] seconds                                                    │
│  Dispatch list:  [60   ] seconds                                                    │
│  Analytics:      [300  ] seconds (5 min)                                            │
│                                                                                      │
│  GPS FRESHNESS THRESHOLDS:                                                          │
│  Stale after: [60    ] minutes                                                      │
│  No data after: [240  ] minutes                                                     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Regional Settings

```
┌── REGIONAL SETTINGS ───────────────────────────────────────────────────────────────┐
│                                                                                      │
│  REGIONS                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Code  Name           States                              DCs      Status   │   │
│  │  ────────────────────────────────────────────────────────────────────────  │   │
│  │  NR    North Region   DL, UP, HR, PB, RJ, HP, UK, JK     3        ●Active  │   │
│  │  WR    West Region    MH, GJ                              4        ●Active  │   │
│  │  SR    South Region   KA, TN, TG, AP, KL                 3        ●Active  │   │
│  │  ER    East Region    WB, OR, AS, BR, JH                 2        ●Active  │   │
│  │  CR    Central Region MP, CG                              1        ●Active  │   │
│  │  [+ Add Region]                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ZONE → REGION MAPPING:                                                             │
│  [Edit Mapping →]  (maps GST zones to TCT regions)                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.4 Integration Settings

```
┌── INTEGRATION SETTINGS ────────────────────────────────────────────────────────────┐
│                                                                                      │
│  WEBHOOK GLOBAL CONFIG:                                                              │
│  Retry attempts: [3   ]   Intervals: [5s  ] [15s  ] [60s  ]                        │
│  Dead letter queue: ● Enabled  ○ Disabled                                           │
│  HMAC Secret:  [••••••••••••••••••••••]  [Rotate]                                  │
│                                                                                      │
│  RATE LIMITING:                                                                      │
│  API calls per window: [100   ]  Window size: [60   ] seconds                      │
│  Rate limit exceeded response: [429 Too Many Requests + Retry-After header]         │
│                                                                                      │
│  ERP INTEGRATION:                                                                    │
│  System:    [SAP S/4HANA ▼]   Version: [2023.3  ]                                  │
│  Object Map: ● Using default adapter  ○ Custom mapping                             │
│  [View Adapter Config →]  [Test ERP Connection]                                    │
│  Status: ✅ Connected  •  Last sync: 5 min ago                                      │
│                                                                                      │
│  WMS INTEGRATION:                                                                    │
│  System: [Manhattan Associates ▼]                                                   │
│  [View Adapter Config →]  [Test WMS Connection]                                    │
│  Status: ✅ Connected  •  Last sync: 3 min ago                                      │
│                                                                                      │
│  API KEYS:                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  Key Name          Created      Last Used   Requests  Status   Actions      │   │
│  │  ───────────────────────────────────────────────────────────────────────   │   │
│  │  Production API    01 Jan 2026  14:28 today 12,441    ●Active  [Revoke]    │   │
│  │  Staging API       01 Mar 2026  10:14 today 844       ●Active  [Revoke]    │   │
│  │  Webhook Validator 01 Jun 2026  —           0         ●Active  [Revoke]    │   │
│  │  [+ Generate New Key]                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.5 Audit & Compliance Settings

```
┌── AUDIT & COMPLIANCE ──────────────────────────────────────────────────────────────┐
│                                                                                      │
│  AUDIT LOG RETENTION:                                                               │
│  Keep audit logs for: [365   ] days                                                 │
│  Purge older logs:    ● Auto (on threshold)  ○ Manual only                         │
│                                                                                      │
│  SENSITIVE FIELDS (masked in audit log):                                            │
│  ☑ API Keys        ☑ OAuth Tokens      ☑ Carrier Passwords                        │
│  ☑ User Passwords  ☐ Phone Numbers     ☐ Email Addresses                           │
│                                                                                      │
│  COMPLIANCE MODE:                                                                   │
│  ● Standard   ○ GDPR   ○ SOC2   ○ ISO27001                                         │
│  Data residency: [India (in-country only) ▼]                                       │
│                                                                                      │
│  SESSION TIMEOUT:                                                                   │
│  Inactivity timeout: [30   ] minutes                                                │
│  Absolute timeout:   [8    ] hours (re-login required)                              │
│  Warehouse scan sessions: exempt from timeout ● Yes  ○ No                          │
│                                                                                      │
│  PASSWORD POLICY:                                                                   │
│  Minimum length: [12  ]  Complexity: ☑ Upper ☑ Lower ☑ Number ☑ Symbol           │
│  Expiry: [90   ] days   History: last [5   ] passwords                              │
│  Failed login lockout: after [5   ] attempts  Lockout for: [30   ] minutes         │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. SHARED ADMIN COMPONENTS

### 11.1 AdminDataGrid (universal grid component)

```
AdminDataGrid accepts:
  columns:       ColumnDef[]       ← column definitions
  data:          object[]          ← row data
  totalCount:    number
  page:          number
  pageSize:      number
  onPageChange:  func
  onSort:        func
  onFilter:      func
  onRowClick:    func
  onBulkAction:  func
  selectable:    bool
  exportConfig:  ExportConfig
  bulkUpload:    BulkUploadConfig
  density:       'compact'|'standard'|'comfortable'
  frozenLeft:    number            ← cols frozen from left (incl. checkbox)
  frozenRight:   number            ← cols frozen from right (actions)

COLUMN DEFINITION (ColumnDef):
  key:           string
  label:         string
  width:         number (px)
  minWidth:      number
  sortable:      bool
  filterable:    bool
  resizable:     bool
  hidden:        bool             ← starts hidden (show/hide via column picker)
  frozen:        'left'|'right'|false
  render:        (value, row) => ReactNode  ← custom cell renderer
  align:         'left'|'center'|'right'

BUILT-IN CELL RENDERERS (pass as render):
  StatusCell:    renders ●Active / ●Inactive pill
  GradeBadge:    renders 🅐-🅕 grade badge
  DateCell:      formatted date + relative time on hover
  ActionCell:    [✏ Edit] [⋮ More] buttons
  SeverityCell:  renders severity color pill
  LinkCell:      clickable blue text → onRowClick
  BarCell:       mini progress bar (for utilization %)
  CountBadge:    number with optional color threshold
  BoolCell:      ✅ / ❌ / — based on boolean value
```

### 11.2 BulkUploadModal

```
BulkUploadModal.propTypes = {
  isOpen:         bool,
  onClose:        func,
  entityName:     string,          // "Route", "Carrier", etc.
  templateColumns:arrayOf(shape({  // for template generation
    key:      string,
    label:    string,
    required: bool,
    type:     string,
    example:  string,
    validation:string,
  })),
  onValidate:   func,   // (rows) => Promise<ValidationResult[]>
  onImport:     func,   // (validRows) => Promise<ImportResult>
}

MODAL STEPS:
  Step 1: Download template / drag-drop file
  Step 2: Preview & validate (show first 10 rows + error summary)
  Step 3: Import + progress + result summary

VALIDATION RESULT per row:
  { row: number, status: 'valid'|'error'|'warning', errors: string[] }

IMPORT RESULT:
  { imported: number, skipped: number, errors: number, duplicates: number }
```

### 11.3 ExportModal

```
ExportModal.propTypes = {
  isOpen:       bool,
  onClose:      func,
  entityName:   string,
  totalCount:   number,
  filteredCount:number,
  selectedCount:number,
  onExport:     func,   // (config) => void
}

EXPORT CONFIG:
  scope:   'page' | 'filtered' | 'selected' | 'all'
  format:  'xlsx' | 'csv' | 'json'
  columns: 'all' | 'visible' | 'selected' (column picker)

FILE NAMING:
  {EntityName}_{YYYYMMDD}_{HHmm}.xlsx
  Example: Routes_20260618_1432.xlsx
```

### 11.4 AdminFilterBar

```
AdminFilterBar.propTypes = {
  filters:       object,
  filterDefs:    arrayOf(shape({
    key:     string,
    label:   string,
    type:    'text'|'select'|'multiselect'|'date'|'daterange'|'boolean',
    options: array,    // for select/multiselect
  })),
  onFilterChange:func,
  onReset:       func,
  onSave:        func,
  activeCount:   number,
  savedFilters:  array,
}

FILTER BAR LAYOUT:
  [🔍 Search text input] [Select filters inline] [+ More ▼] [Reset] [Save Filter]
  Active filter chips shown below bar: [Route: DEL-MUM-01 ×] [Status: Active ×]
  Chip × = remove that filter
  [Reset] = clear all filters
  [Save Filter] = save current filter set with a name (reusable filter presets)
```

### 11.5 AuditLog Drawer

```
Accessible from any master record via [View History] or [Audit Log] button.

┌── AUDIT LOG: DEL-MUM-01 (Route) ─────────────────────────────────────────────────┐
│                                                              [× Close] [⬇ Export] │
│  ─────────────────────────────────────────────────────────────────────────────     │
│                                                                                    │
│  18 Jun 2026  14:30  Rahul Kumar (TM)      UPDATED                                │
│    SLA Window: 8h → 10h                                                           │
│    Carriers: added DTDC                                                            │
│                                                                                    │
│  15 Jun 2026  09:12  Dev Sharma (Admin)    UPDATED                                │
│    Region: Central → North                                                        │
│                                                                                    │
│  01 Jun 2026  08:00  Dev Sharma (Admin)    CREATED                                │
│    Route created with status: Active                                               │
│                                                                                    │
│  [Load more history...]                                                            │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. REACT COMPONENT HIERARCHY

### 12.1 File Organization

```
src/
├── pages/
│   └── admin/
│       ├── AdminLayout.jsx              ← left sidebar + breadcrumb
│       ├── RouteMaster.jsx
│       ├── ScheduleMaster.jsx
│       ├── CarrierMaster.jsx
│       ├── VehicleMaster.jsx
│       ├── LocationMaster.jsx
│       ├── SLAMaster.jsx
│       ├── ExceptionMaster.jsx
│       ├── UserManagement.jsx
│       ├── RoleManagement.jsx
│       └── SystemConfiguration.jsx
│
├── components/
│   └── admin/
│       │
│       ├── shell/
│       │   ├── AdminSidebar.jsx
│       │   ├── AdminBreadcrumb.jsx
│       │   └── AdminPageHeader.jsx      ← title + record count + primary CTA
│       │
│       ├── grid/
│       │   ├── AdminDataGrid.jsx        ← universal grid (all masters use this)
│       │   ├── GridHeader.jsx
│       │   ├── GridRow.jsx
│       │   ├── GridCell.jsx
│       │   ├── GridCheckbox.jsx
│       │   ├── GridPagination.jsx
│       │   ├── GridDensityToggle.jsx
│       │   ├── ColumnPicker.jsx
│       │   └── BulkActionBar.jsx        ← slides up from bottom
│       │
│       ├── cells/                       ← built-in cell renderers
│       │   ├── StatusCell.jsx
│       │   ├── GradeBadgeCell.jsx
│       │   ├── DateCell.jsx
│       │   ├── ActionCell.jsx
│       │   ├── SeverityCell.jsx
│       │   ├── LinkCell.jsx
│       │   ├── BarCell.jsx
│       │   ├── CountBadgeCell.jsx
│       │   └── BoolCell.jsx
│       │
│       ├── toolbar/
│       │   ├── AdminFilterBar.jsx
│       │   ├── FilterChip.jsx
│       │   ├── SavedFiltersDropdown.jsx
│       │   └── AdminActionBar.jsx       ← New / Upload / Export / Columns
│       │
│       ├── upload/
│       │   ├── BulkUploadModal.jsx
│       │   ├── UploadDropzone.jsx
│       │   ├── UploadPreviewTable.jsx
│       │   ├── ValidationResultRow.jsx
│       │   └── ImportProgressBar.jsx
│       │
│       ├── export/
│       │   ├── ExportModal.jsx
│       │   └── ExportScopeSelector.jsx
│       │
│       ├── forms/
│       │   ├── AdminDrawer.jsx          ← right-side form drawer (all masters)
│       │   ├── AdminModal.jsx           ← center modal (small forms)
│       │   ├── FormSection.jsx          ← labeled section with border
│       │   ├── FormFieldGrid.jsx        ← 2-col field layout
│       │   ├── TagInput.jsx             ← multi-value chip input (regions, routes)
│       │   ├── ContactTable.jsx         ← contacts sub-table
│       │   ├── PenaltyClauseTable.jsx   ← SLA clauses sub-table
│       │   ├── PermissionMatrix.jsx     ← Role → Module grid
│       │   ├── NotificationMatrix.jsx   ← Event → Channel grid
│       │   ├── DocumentsTable.jsx       ← Vehicle compliance docs
│       │   └── BlackoutDates.jsx
│       │
│       ├── audit/
│       │   ├── AuditLogDrawer.jsx
│       │   └── AuditLogEntry.jsx
│       │
│       ├── config/
│       │   ├── ConfigSidebar.jsx        ← settings category nav
│       │   ├── ConfigSection.jsx        ← labeled settings group
│       │   ├── ThresholdSettings.jsx
│       │   ├── RegionSettings.jsx
│       │   ├── IntegrationSettings.jsx
│       │   ├── APIKeyTable.jsx
│       │   ├── NotificationTemplates.jsx
│       │   ├── CacheSettings.jsx
│       │   └── AuditComplianceSettings.jsx
│       │
│       └── schedule/
│           ├── DaySelector.jsx          ← Mon-Sun checkbox group
│           ├── TimeWindowPicker.jsx
│           ├── BlackoutDateList.jsx
│           └── ScheduleCalendar.jsx     ← monthly calendar view
│
├── hooks/
│   ├── useAdminCRUD.js               ← generic create/read/update/delete hook
│   ├── useBulkUpload.js
│   ├── useExport.js
│   ├── useColumnConfig.js            ← persist column visibility/order per user
│   ├── useGridFilter.js
│   ├── useSavedFilters.js
│   ├── useAuditLog.js
│   └── usePermissionMatrix.js
│
└── utils/
    ├── xlsxExporter.js               ← generates XLSX from data array
    ├── xlsxParser.js                 ← parses uploaded XLSX → row objects
    ├── bulkValidator.js              ← row-level validation engine
    └── templateGenerator.js         ← generates download template per entity
```

---

### 12.2 Key Component Props

```jsx
// ── AdminDataGrid ─────────────────────────────────────────────────────────────────
AdminDataGrid.propTypes = {
  columns:      arrayOf(shape({
    key:        string.isRequired,
    label:      string.isRequired,
    width:      number,
    minWidth:   number,
    sortable:   bool,
    filterable: bool,
    resizable:  bool,
    hidden:     bool,
    frozen:     oneOf(['left','right',false]),
    render:     func,
    align:      oneOf(['left','center','right']),
  })).isRequired,
  data:           array.isRequired,
  totalCount:     number,
  page:           number,
  pageSize:       number,
  onPageChange:   func,
  onSort:         func,
  onRowClick:     func,
  selectable:     bool,
  selectedRows:   arrayOf(string),
  onSelectChange: func,
  density:        oneOf(['compact','standard','comfortable']),
  frozenLeft:     number,
  frozenRight:    number,
  loading:        bool,
  emptyMessage:   string,
}

// ── AdminDrawer ──────────────────────────────────────────────────────────────────
AdminDrawer.propTypes = {
  isOpen:    bool.isRequired,
  onClose:   func.isRequired,
  title:     string.isRequired,
  subtitle:  string,
  width:     number,         // default 520
  tabs:      arrayOf(shape({ key: string, label: string })),
  activeTab: string,
  onTabChange:func,
  footer:    node,           // cancel + save buttons
  children:  node,
}

// ── BulkUploadModal ──────────────────────────────────────────────────────────────
BulkUploadModal.propTypes = {
  isOpen:          bool,
  onClose:         func,
  entityName:      string,
  templateColumns: arrayOf(shape({
    key:        string,
    label:      string,
    required:   bool,
    type:       string,
    example:    string,
    validation: string,
  })),
  onValidate:      func,
  onImport:        func,
  existingKeys:    arrayOf(string),  // for duplicate detection
}

// ── PermissionMatrix ─────────────────────────────────────────────────────────────
PermissionMatrix.propTypes = {
  modules: arrayOf(shape({
    key:        string,
    label:      string,
    permissions:arrayOf(oneOf(['view','create','edit','delete','export','admin'])),
  })).isRequired,
  values:   object,          // { modulKey: { view: bool, create: bool, ... } }
  onChange: func,
  readOnly: bool,
  lockedRows:arrayOf(string), // modules that can't be modified
}

// ── ConfigSection ────────────────────────────────────────────────────────────────
ConfigSection.propTypes = {
  title:    string.isRequired,
  subtitle: string,
  icon:     node,
  children: node.isRequired,
  onSave:   func,            // if provided, shows [Save Section] button
  modified: bool,            // shows unsaved indicator
}

// ── useAdminCRUD ─────────────────────────────────────────────────────────────────
// Generic hook for all master CRUD operations against localStorage DAL

// useAdminCRUD(entityConfig)
// entityConfig: { storageKey, idField, defaultValues, validators }
// Returns: { records, loading, create, update, delete, bulkCreate, reload }
```

---

## 13. DATA CONTRACTS

### 13.1 Route Master DAL Schema

```javascript
// DAL key: tct_routes — array of:
{
  id:            "DEL-MUM-01",
  name:          "Delhi to Mumbai",
  originId:      "DEL-DC-01",
  destinationId: "MUM-DC-01",
  distanceKm:    1420,
  slaHours:      10,
  regionCode:    "NR",
  routeType:     "FTL",             // FTL | LTL | Both
  carrierIds:    ["CAR-001","CAR-002"],
  vehicleTypes:  ["26ft","32ft"],
  waypoints:     [],
  notes:         "",
  status:        "active",          // active | inactive | draft
  createdAt:     "2026-01-01T00:00:00Z",
  createdBy:     "USR-008",
  updatedAt:     "2026-06-18T14:30:00Z",
  updatedBy:     "USR-001",
}
```

### 13.2 Carrier Master DAL Schema

```javascript
// DAL key: tct_carriers — array of:
{
  id:            "CAR-001",
  name:          "BlueDart Logistics Ltd",
  type:          "FTL",             // FTL | LTL | Express | 3PL
  tier:          "preferred",       // preferred | standard | restricted
  gstNo:         "27AABCB1234A1Z5",
  panNo:         "AABCB1234A",
  address:       "12, Nehru Place, New Delhi 110019",
  regions:       ["NR","WR","SR"],
  routeIds:      ["DEL-MUM-01","BOM-PUN-03"],
  surcharge:     1.0,               // from CARRIER_SURCHARGE
  contacts:      [
    { name:"Rajesh Sharma", role:"Ops Head", phone:"+91-9800000001",
      email:"rajesh@bd.com", channels:["whatsapp","email"] }
  ],
  slaClauses:    [
    { clause:"§4.1", type:"ota-breach", thresholdMin:30,
      penaltyPerTrip:20000, monthlyCap:100000 }
  ],
  integration:   {
    adapterType: "rest",            // rest | sftp | edi | manual
    endpoint:    "https://api.bluedart.com/v2/",
    apiKeyId:    "AK-001",
    trackingMode:"push",
    status:      "active",
    lastPing:    "2026-06-18T14:28:00Z",
    latencyMs:   142,
  },
  status:        "active",          // active | inactive | blacklisted
  blacklistReason:"",
  performance:   {                  // computed by CarrierDashboardService
    otaPct:      96, otdPct: 94, score: 92, excRate: 0.8
  },
  createdAt:     "2026-01-01T00:00:00Z",
  updatedAt:     "2026-06-18T14:30:00Z",
}
```

### 13.3 User & Role DAL Schema

```javascript
// DAL key: tct_users — array of:
{
  id:            "USR-001",
  firstName:     "Rahul",
  lastName:      "Kumar",
  email:         "rahul@company.com",
  phone:         "+91-9800000001",
  employeeId:    "EMP-00142",
  department:    "Supply Chain",
  roleId:        "ROLE-TM",
  additionalRoles:[],
  dcAccess:      ["DEL-DC-01","MUM-DC-01"],  // [] = all
  regionAccess:  [],                           // [] = all
  carrierAccess: [],                           // [] = all
  notifications: {
    criticalExceptions: { whatsapp:true, email:true, sms:true, inApp:true },
    highExceptions:     { whatsapp:true, email:false, sms:false, inApp:true },
    slaBreaches:        { whatsapp:true, email:true, sms:false, inApp:true },
  },
  status:        "active",          // active | inactive | suspended | pending_invite
  lastLoginAt:   "2026-06-18T14:28:00Z",
  passwordHash:  "••••",            // hashed, never exposed to UI
  inviteToken:   null,
  inviteExpiry:  null,
  createdAt:     "2026-01-01T00:00:00Z",
}

// DAL key: tct_roles — array of:
{
  id:            "ROLE-TM",
  name:          "Transport Manager",
  type:          "system",          // system (locked) | custom
  userCount:     4,
  permissions:   {
    executive:      { view:true,  create:false, edit:false, delete:false, export:true,  admin:false },
    dispatch:       { view:true,  create:true,  edit:true,  delete:false, export:true,  admin:false },
    operations:     { view:true,  create:true,  edit:true,  delete:false, export:true,  admin:false },
    exceptions:     { view:true,  create:true,  edit:true,  delete:false, export:true,  admin:false },
    reconciliation: { view:true,  create:false, edit:true,  delete:false, export:true,  admin:false },
    planning:       { view:true,  create:true,  edit:true,  delete:false, export:true,  admin:false },
    admin:          { view:false, create:false, edit:false, delete:false, export:false, admin:false },
    config:         { view:false, create:false, edit:false, delete:false, export:false, admin:false },
  },
  fieldRestrictions:[
    { screen:"carrier", field:"apiKey", access:"hidden" },
    { screen:"carrier", field:"slaPenaltyAmt", access:"read" },
  ],
  dataScope:     "assigned-dc",     // global | assigned-dc | assigned-region
  createdAt:     "2026-01-01T00:00:00Z",
  updatedAt:     "2026-01-01T00:00:00Z",
}
```

### 13.4 System Config DAL Schema

```javascript
// DAL key: tct_system_config — single object:
{
  general: {
    platformName:      "Transport Control Tower",
    companyName:       "Acme Supply Chain Ltd",
    currency:          "INR",
    dateFormat:        "DD MMM YYYY",
    timeFormat:        "24h",
    timezone:          "Asia/Kolkata",
    fiscalYearStart:   "April",
    language:          "en",
    barcodeFormat:     "HU\\d{7}",
    dispatchIdPrefix:  "TCT-",
    exceptionIdPrefix: "EXC-",
    sessionIdPrefix:   "SS-",
  },
  thresholds: {
    slaAtRiskHours:         4,
    slaCriticalHours:       1,
    utilOptimalPct:         80,
    utilAcceptablePct:      60,
    consolidationWindowHrs: 6,
    consolidationMinUtil:   60,
    dwellAmberHours:        2,
    dwellRedHours:          4,
    escalationHours:        { critical:1, high:4, medium:8, low:24 },
    refresh: {
      situationBarSec:  15,
      kpiTilesSec:      30,
      dispatchListSec:  60,
      analyticsSec:     300,
    },
    gpsFreshnessMinutes:   60,
    gpsNoDataMinutes:      240,
  },
  regions: [
    { code:"NR", name:"North Region", states:["DL","UP","HR","PB","RJ","HP","UK","JK"] },
    ...
  ],
  integration: {
    webhookRetryAttempts:  3,
    webhookRetryIntervals: [5000, 15000, 60000],
    hmacSecret:            "••••",
    rateLimitPerWindow:    100,
    rateLimitWindowSec:    60,
    erpSystem:             "sap-s4",
    wmsSystem:             "manhattan",
  },
  audit: {
    retentionDays:   365,
    autoPurge:       true,
    sensitiveFields: ["apiKey","oauthToken","passwordHash"],
    complianceMode:  "standard",
    dataResidency:   "india",
  },
  security: {
    sessionTimeoutMin:  30,
    absoluteTimeoutHrs: 8,
    scanSessionExempt:  true,
    passwordMinLength:  12,
    passwordComplexity: { upper:true, lower:true, number:true, symbol:true },
    passwordExpiryDays: 90,
    passwordHistoryCount:5,
    failedLoginLockout:  5,
    lockoutDurationMin:  30,
  },
}
```

### 13.5 Bulk Upload Validation Result Schema

```javascript
// Used by BulkUploadModal for all entity types:
{
  totalRows:    45,
  validRows:    42,
  errorRows:    2,
  warningRows:  1,
  duplicates:   0,
  rows: [
    {
      rowNumber:  2,
      data:       { RouteCode:"DEL-MUM-01", RouteName:"Delhi to Mumbai", ... },
      status:     "valid",
      errors:     [],
      warnings:   [],
    },
    {
      rowNumber:  8,
      data:       { RouteCode:"BOM-PUN-99", OriginCode:"INVALID-DC", ... },
      status:     "error",
      errors:     ["OriginCode 'INVALID-DC' does not exist in Location Master"],
      warnings:   [],
    },
    {
      rowNumber:  23,
      data:       { RouteCode:"DEL-HYD-03", DistanceKm:1270, SLAHours:10, ... },
      status:     "warning",
      errors:     [],
      warnings:   ["SLA of 10h is unusually high for this distance. Verify."],
    },
  ],
}
```

---

*Document ends.*

---

**UI PHASE 7 COMPLETE**
