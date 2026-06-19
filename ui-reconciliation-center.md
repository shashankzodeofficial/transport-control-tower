# Enterprise Transport Control Tower — Reconciliation Center
## UI PHASE 5 · Reconciliation & Receiving Design Specification

**Persona primary:** Warehouse Manager · Gate Officer · Receiving Operator
**Persona secondary:** Transport Manager · Operations Executive
**Routes covered:** `/reconciliation/*`
**Data sources:** `ReconciliationDashboardService` · `HURegistry` · `ScanSession` · `HUValidator` · `HUReconciler` · `ExceptionFactory`
**Design reference:** Manhattan WMS Receiving · SAP EWM Inbound · Zebra WorkCloud · Blue Yonder WMS Scan UI

---

## WAREHOUSE UX DESIGN PRINCIPLES

```
DESIGN CONSTRAINTS FOR WAREHOUSE ENVIRONMENT:
  Device:        10–12" rugged tablet (primary) · Desktop (secondary) · Mobile scan gun
  Environment:   Bright warehouse floor, glare, one-handed use, gloves
  Input method:  Barcode scanner (USB HID / Bluetooth) · Touch · Keyboard
  Font minimum:  16px body · 20px labels · 28px primary values · 44px scan targets
  Touch target:  Minimum 48 × 48px — prefer 60 × 60px for gloved use
  Color:         High contrast — WCAG AA minimum on all status colors
  Layout:        Full-bleed, no sidebars on scan screens (maximize scan area)
  Navigation:    Maximum 2 taps to reach scan action from any screen
  Feedback:      Every scan: immediate visual + audible-class feedback (color flash)
  Error states:  Full-screen red flash for wrong-dispatch / tamper
  Success state: Full-screen green flash for valid scan

SCAN FEEDBACK PROTOCOL:
  ✅ VALID SCAN     → Full-screen green flash (200ms) + progress bar advances
  ⚠ DUPLICATE      → Amber flash (200ms) + "Already scanned" banner
  ❌ WRONG DISPATCH → Full-screen RED flash (500ms) + alarm banner persists
  🔒 TAMPER FLAG    → Full-screen RED flash (800ms) + lock icon overlay
  ❓ NOT REGISTERED → Amber flash + "Unknown barcode" prompt

STATUS COLOR TOKENS (warehouse optimized, high contrast):
  --wh-ok:        #16A34A    (Green — valid, received, match)
  --wh-warn:      #D97706    (Amber — warning, partial, pending)
  --wh-danger:    #DC2626    (Red — error, missing, tamper, mismatch)
  --wh-info:      #2563EB    (Blue — in progress, scanning)
  --wh-neutral:   #374151    (Dark gray — neutral state)
  --wh-surface:   #FFFFFF    (White — card surfaces)
  --wh-bg:        #F3F4F6    (Light gray — page background)
```

---

## TABLE OF CONTENTS

1. [Reconciliation Shell](#1-reconciliation-shell)
2. [Screen 1 — Receiving Dashboard](#2-screen-1--receiving-dashboard)
3. [Screen 2 — ASN Verification](#3-screen-2--asn-verification)
4. [Screen 3 — Seal Verification](#4-screen-3--seal-verification)
5. [Screen 4 — Vehicle Verification](#5-screen-4--vehicle-verification)
6. [Screen 5 — HU Scan Screen](#6-screen-5--hu-scan-screen)
7. [Screen 6 — Reconciliation Dashboard](#7-screen-6--reconciliation-dashboard)
8. [Screen 7 — Missing HU Dashboard](#8-screen-7--missing-hu-dashboard)
9. [Screen 8 — Excess HU Dashboard](#9-screen-8--excess-hu-dashboard)
10. [Screen 9 — Discrepancy Resolution Screen](#10-screen-9--discrepancy-resolution-screen)
11. [React Component Hierarchy](#11-react-component-hierarchy)
12. [Scan Session State Machine](#12-scan-session-state-machine)
13. [UX Interactions & Scan Feedback](#13-ux-interactions--scan-feedback)
14. [Data Contracts](#14-data-contracts)

---

## 1. RECONCILIATION SHELL

### 1.1 Receiving Context Bar (persistent, full-width)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  RECEIVING CONTEXT BAR                              [DC: Delhi]  [Shift: 08-20] ║
║  ┌────────────────────────────────────────────────────────────────────────────┐ ║
║  │ ARRIVED TODAY: 6  │ PENDING RECEIVING: 4  │ IN SCAN: 1  │ COMPLETE: 2      │ ║
║  │ DISCREPANCIES: 3  │ UNRESOLVED EXC: 2     │              │ [My Session ▶]  │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

### 1.2 Reconciliation Sub-Navigation

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [Receiving]  [ASN Check]  [Seal Check]  [Vehicle Check]  [Scan HUs]            │
│  [Reconciliation]  [Missing]  [Excess]  [Discrepancies]   [+ Start Session]     │
└──────────────────────────────────────────────────────────────────────────────────┘

MOBILE / TABLET NAV (collapsed icon strip):
  [🏠] [📋] [🔒] [🚛] [📷] [📊] [❓] [➕] [⚠]
  Labels shown below icons, 12px
  Active tab: filled bg, white icon
```

---

## 2. SCREEN 1 — RECEIVING DASHBOARD

**Route:** `/reconciliation/receiving`
**Purpose:** Ground-zero for receiving team — all arrived dispatches needing action

### 2.1 Full Screen Wireframe (Tablet landscape — 1024px)

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  RECEIVING DASHBOARD                            [DC: Delhi]    [18 Jun  14:32]      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  CONTEXT BAR                                                                         ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ARRIVED & PENDING RECEIVING                               [⬇ Print List]           ║
║                                                                                      ║
║  ┌── DISPATCH RECEIVING CARD ─────────────────────────────────────────────────────┐ ║
║  │                                                                                 │ ║
║  │  TCT-0019                         [🔴 OVERDUE — Dwell: 4h 12m]                │ ║
║  │  Delhi DC → Mumbai DC  •  DEL-MUM-01  •  BlueDart FTL                         │ ║
║  │                                                                                 │ ║
║  │  ┌──────────────┬──────────────┬──────────────┬──────────────────────────────┐│ ║
║  │  │ ARRIVED      │ EXPECTED HUs │ SEAL STATUS  │ VERIFICATION STATUS           ││ ║
║  │  │ 10:20        │ 42           │ 🟢 Intact    │ ASN ✅  Seal ✅  Vehicle ✅  ││ ║
║  │  │ (4h 12m ago) │              │ SL-20240118  │ Ready to Scan                 ││ ║
║  │  └──────────────┴──────────────┴──────────────┴──────────────────────────────┘│ ║
║  │                                                                                 │ ║
║  │  ┌────────────────────────────────────────────────────────────────────────┐   │ ║
║  │  │                [▶  START UNLOADING / SCAN SESSION]                      │   │ ║
║  │  └────────────────────────────────────────────────────────────────────────┘   │ ║
║  │  [View Details]  [Run Verifications]  [Contact Carrier]                       │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── DISPATCH RECEIVING CARD ─────────────────────────────────────────────────────┐ ║
║  │  TCT-0022                         [🟡 Dwell: 1h 45m]                          │ ║
║  │  Mumbai DC → Pune DC  •  BOM-PUN-03  •  DTDC FTL                              │ ║
║  │                                                                                 │ ║
║  │  ┌──────────────┬──────────────┬──────────────┬──────────────────────────────┐│ ║
║  │  │ ARRIVED      │ EXPECTED HUs │ SEAL STATUS  │ VERIFICATION STATUS           ││ ║
║  │  │ 12:47        │ 36           │ ⚠ Not Done  │ ASN ✅  Seal ⚠  Vehicle ⚠  ││ ║
║  │  │ (1h 45m ago) │              │              │ Complete verifications first   ││ ║
║  │  └──────────────┴──────────────┴──────────────┴──────────────────────────────┘│ ║
║  │                                                                                 │ ║
║  │  ┌────────────────────────────────────────────────────────────────────────┐   │ ║
║  │  │             [▶  RUN VERIFICATIONS FIRST →]                              │   │ ║
║  │  └────────────────────────────────────────────────────────────────────────┘   │ ║
║  │  [View Details]  [Skip to Scan ⚠]  [Contact Carrier]                         │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── IN ACTIVE SCAN ──────────────────────────────────────────────────────────────┐ ║
║  │  TCT-0031   [🔵 SCANNING — 28 / 42 HUs scanned]                               │ ║
║  │  DEL-MUM-01  •  BlueDart  •  Started: 13:00  •  Operator: Ramesh K             │ ║
║  │  [Monitor Session ▶]  [Join Session]                                            │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── COMPLETED TODAY ─────────────────────────────────────────────────────────────┐ ║
║  │  TCT-0009  Complete  42/42 HUs ✅  No discrepancies      [View Report]         │ ║
║  │  TCT-0011  Complete  38/40 HUs ⚠  2 missing             [View Report]         │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 2.2 Receiving Card Specification

```
CARD STATES:
  ARRIVED — verifications pending:
    Primary CTA: [▶ Run Verifications First →]  (blue)
    CTA disabled: [Start Scanning] with tooltip "Complete ASN, Seal, and Vehicle checks first"
    Skip allowed with ⚠ confirmation: "Scanning without verification may affect compliance"

  ARRIVED — verifications complete:
    Primary CTA: [▶ Start Unloading / Scan Session]  (green, large)
    Secondary:   [View Details]  [Contact Carrier]

  IN ACTIVE SCAN:
    Primary CTA: [Monitor Session ▶]
    Secondary:   [Join Session] (multi-operator support)

  COMPLETED:
    Primary CTA: [View Report]
    Badge: 42/42 ✅ or 38/40 ⚠ 2 missing

DWELL TIME BADGE:
  < 2h:    🟢 Dwell: Xh Ym    (no urgency)
  2–4h:    🟡 Dwell: Xh Ym    (attention needed)
  > 4h:    🔴 OVERDUE — Dwell: Xh Ym  (exception territory)

VERIFICATION GRID (4 cells):
  ASN:     ✅ verified / ⚠ not done / ❌ failed
  Seal:    ✅ intact  / ⚠ not done / ❌ mismatch
  Vehicle: ✅ matched / ⚠ not done / ❌ mismatch
  Overall: "Ready to Scan" / "Complete verifications first" / "Scan blocked"

CTA BUTTON SIZES (tablet):
  Primary:  full-width, height 64px, font-size 20px, border-radius 8px
  Secondary: auto width, height 48px, font-size 16px
```

---

## 3. SCREEN 2 — ASN VERIFICATION

**Route:** `/reconciliation/:dispatchId/asn`
**Purpose:** Verify Advance Shipment Notice against dispatch data before unloading

### 3.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ← Receiving    ASN Verification — TCT-0019                    [14:35  18 Jun]  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  DISPATCH: TCT-0019  •  DEL-MUM-01  •  BlueDart  •  Arrived: 10:20             ║
║                                                                                  ║
║  ╔══ STEP 1 OF 3: ASN VERIFICATION ══════════════════════════════════════════╗  ║
║  ║  [●──────────○───────────○]  ASN  →  Seal  →  Vehicle                    ║  ║
║  ╚══════════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                  ║
║  ┌── ASN DETAILS ──────────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │  DISPATCH DATA             PHYSICAL / SYSTEM CHECK                          │║
║  │  ─────────────────         ──────────────────────────────────────────────   │║
║  │                                                                              │║
║  │  ASN Number:               SCAN OR ENTER ASN:                               │║
║  │  ASN-2024-0918             ┌───────────────────────────────────┐  [Scan 📷]│║
║  │                            │  ASN-2024-0918                    │           │║
║  │                            └───────────────────────────────────┘           │║
║  │                            Result: ✅ MATCH                                 │║
║  │                                                                              │║
║  │  ────────────────────────────────────────────────────────────────────────   │║
║  │                                                                              │║
║  │  CROSS-REFERENCE CHECKS:                                                    │║
║  │                                                                              │║
║  │  ┌────────────────────────────────────────────────────────────────────┐    │║
║  │  │  Check                        Expected          Found      Status   │    │║
║  │  │  ──────────────────────────────────────────────────────────────    │    │║
║  │  │  ASN matches dispatch         ASN-2024-0918     ✅ match    ✅      │    │║
║  │  │  HU count on ASN              42                42          ✅      │    │║
║  │  │  Origin on ASN                DC Delhi          DC Delhi    ✅      │    │║
║  │  │  Destination on ASN           DC Mumbai         DC Mumbai   ✅      │    │║
║  │  │  Carrier on ASN               BlueDart          BlueDart    ✅      │    │║
║  │  │  ASN not previously used      Unique check      ✅ Unique   ✅      │    │║
║  │  │  ASN not expired              Valid 48h         Valid       ✅      │    │║
║  │  └────────────────────────────────────────────────────────────────────┘    │║
║  │                                                                              │║
║  │  OVERALL: ✅  7/7 CHECKS PASSED                                             │║
║  │                                                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌──────────────────────────────────────────────────────────────────────────┐   ║
║  │  [← Back]                [⚠ Override & Continue]   [Next: Seal Check →]  │   ║
║  └──────────────────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 3.2 ASN Check Failure State

```
WHEN ASN MISMATCH DETECTED:
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ❌  ASN MISMATCH DETECTED                                                   │
│  ──────────────────────────────────────────────────────────────────────────  │
│  Entered:   ASN-2024-0920                                                    │
│  Expected:  ASN-2024-0918                                                    │
│                                                                              │
│  This ASN does not match the dispatch record.                                │
│                                                                              │
│  POSSIBLE CAUSES:                                                            │
│  • ASN printed for a different dispatch                                      │
│  • Data entry error in dispatch creation                                     │
│  • Wrong vehicle (check vehicle registration)                                │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────    │
│  ACTIONS:                                                                    │
│  [🔄 Re-enter ASN]    [🚨 Raise Exception]    [⚠ Override (requires reason)] │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

OVERRIDE FLOW:
  Click [⚠ Override]:
  → Reason dropdown: [data-entry-error / different-batch / carrier-error / other]
  → Note: required text
  → Supervisor PIN: [____] (4-digit confirmation)
  → Logs: AuditTrail.log('asn-override', { by, reason, overriddenValue })
  → Exception raised: type='document-missing' severity='medium' (auto)
  → Proceed to next step with ⚠ flag on session
```

### 3.3 Verification Step Progress Bar

```
PROGRESS INDICATOR (top of all 3 verification screens):

STEP 1 (ASN):
  [● ASN]────────[○ Seal]────────[○ Vehicle]
  Filled dot = current/complete
  Empty dot  = pending

STEP 2 (Seal):
  [✅ ASN]────────[● Seal]────────[○ Vehicle]

STEP 3 (Vehicle):
  [✅ ASN]────────[✅ Seal]────────[● Vehicle]

COMPLETE:
  [✅ ASN]────────[✅ Seal]────────[✅ Vehicle]
  Green connector lines between completed steps
  [▶ Start Scan Session] CTA appears

COMPONENT: VerificationStepper
  Props: steps (array), currentStep (number), completedSteps (array)
```

---

## 4. SCREEN 3 — SEAL VERIFICATION

**Route:** `/reconciliation/:dispatchId/seal`
**Purpose:** Physical seal number verification — camera scan or manual entry

### 4.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ← ASN Check    Seal Verification — TCT-0019                   [14:37  18 Jun]  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ╔══ STEP 2 OF 3: SEAL VERIFICATION ═════════════════════════════════════════╗  ║
║  ║  [✅ ASN]─────────[●──────────○]  ASN  →  Seal  →  Vehicle               ║  ║
║  ╚══════════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                  ║
║  ┌── SEAL CHECK ───────────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │  EXPECTED SEAL NUMBER                                                        │║
║  │  ┌────────────────────────────────────────────────────────────────────┐    │║
║  │  │                                                                      │    │║
║  │  │         SL-20240118-07                                               │    │║
║  │  │                                                                      │    │║
║  │  │   [From dispatch record — locked at time of dispatch]                │    │║
║  │  └────────────────────────────────────────────────────────────────────┘    │║
║  │                                                                              │║
║  │  SCAN PHYSICAL SEAL:                                                         │║
║  │                                                                              │║
║  │  ┌────────────────────────────────────────────────────────────────────┐    │║
║  │  │                                                                      │    │║
║  │  │   Aim scanner at seal barcode, or enter manually:                   │    │║
║  │  │                                                                      │    │║
║  │  │   ┌──────────────────────────────────────┐  [📷 Camera Scan]       │    │║
║  │  │   │  SL-20240118-07                      │                          │    │║
║  │  │   └──────────────────────────────────────┘  [🔦 Torch]             │    │║
║  │  │                                                                      │    │║
║  │  │   ✅  SEAL MATCH CONFIRMED                                           │    │║
║  │  │   Physical seal matches dispatch record.                            │    │║
║  │  │   Seal appears intact — no visible damage.                          │    │║
║  │  │                                                                      │    │║
║  │  └────────────────────────────────────────────────────────────────────┘    │║
║  │                                                                              │║
║  │  SEAL INTEGRITY CHECK:                                                       │║
║  │  Is the physical seal intact (no sign of tampering)?                         │║
║  │  ┌──────────────────────────────┐  ┌────────────────────────────────┐      │║
║  │  │  ✅  YES — Seal is intact    │  │  ❌  NO — Seal tampered / broken│      │║
║  │  └──────────────────────────────┘  └────────────────────────────────┘      │║
║  │                                                                              │║
║  │  PHOTO EVIDENCE:  [📷 Take Seal Photo]  (optional but recommended)          │║
║  │  [thumbnail if taken]                                                        │║
║  │                                                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌──────────────────────────────────────────────────────────────────────────┐   ║
║  │  [← Back to ASN]          [⚠ Override]           [Next: Vehicle Check →] │   ║
║  └──────────────────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 4.2 Seal Tamper / Mismatch State

```
SEAL BROKEN or NO selected:
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🔴  SEAL TAMPER DETECTED                                                    ║
║                                                                              ║
║  Expected seal: SL-20240118-07                                               ║
║  Physical seal: Reported BROKEN / TAMPERED by operator                       ║
║                                                                              ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  This is a CRITICAL exception. The dispatch cannot proceed to                ║
║  scanning until this is resolved.                                             ║
║                                                                              ║
║  MANDATORY ACTIONS:                                                          ║
║  ☐  1. Take photo of tampered seal           [📷 Take Photo]                ║
║  ☐  2. Do NOT open vehicle or unload HUs                                     ║
║  ☐  3. Contact carrier and driver immediately                                ║
║  ☐  4. Raise tamper exception                [🚨 Raise Exception]           ║
║  ☐  5. Notify supervisor on duty                                             ║
║                                                                              ║
║  Supervisor override required to proceed.                                    ║
║  [🔐 Enter Supervisor PIN to Override]                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

SEAL NUMBER MISMATCH (scan returns different number):
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠  SEAL NUMBER MISMATCH                                                    ║
║  Expected: SL-20240118-07                                                    ║
║  Scanned:  SL-20240118-09                                                   ║
║                                                                              ║
║  [Re-scan]  [Manual Override + Reason]  [Raise Exception & Continue]        ║
╚══════════════════════════════════════════════════════════════════════════════╝

ON TAMPER EXCEPTION RAISE:
  HURegistry.flagTamper(all HUs in dispatch, 'seal-tamper', operator)
  ExceptionFactory.raise('seal-mismatch', dispatchId, operator, 'Seal tampered at receiving')
  DomainEventBus.emit('TamperDetected')
  Transport Manager + Ops Exec notified immediately
```

---

## 5. SCREEN 4 — VEHICLE VERIFICATION

**Route:** `/reconciliation/:dispatchId/vehicle`
**Purpose:** Verify physical vehicle registration against dispatch record

### 5.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ← Seal Check    Vehicle Verification — TCT-0019               [14:39  18 Jun]  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ╔══ STEP 3 OF 3: VEHICLE VERIFICATION ══════════════════════════════════════╗  ║
║  ║  [✅ ASN]────────[✅ Seal]─────────[●──────────]  ASN → Seal → Vehicle   ║  ║
║  ╚══════════════════════════════════════════════════════════════════════════════╝  ║
║                                                                                  ║
║  ┌── VEHICLE CHECK ────────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │  EXPECTED VEHICLE (from dispatch)                                            │║
║  │  ┌────────────────────────────────────────────────────────────────────┐    │║
║  │  │   🚛  MH-01-AX-2341                                                 │    │║
║  │  │   32 ft Truck  •  BlueDart Logistics  •  Driver: Suresh Patil       │    │║
║  │  └────────────────────────────────────────────────────────────────────┘    │║
║  │                                                                              │║
║  │  PHYSICAL VEHICLE AT DOCK:                                                   │║
║  │  Enter or scan vehicle registration number:                                  │║
║  │                                                                              │║
║  │  ┌─────────────────────────────────────────┐  [📷 Scan Reg Plate]          │║
║  │  │  MH-01-AX-2341                          │                               │║
║  │  └─────────────────────────────────────────┘                               │║
║  │                                                                              │║
║  │  ✅  VEHICLE MATCH CONFIRMED                                                 │║
║  │  Registration matches dispatch record.                                       │║
║  │                                                                              │║
║  │  ────────────────────────────────────────────────────────────────────────   │║
║  │                                                                              │║
║  │  DRIVER CONFIRMATION:                                                        │║
║  │  Is the driver the same person on the dispatch?                              │║
║  │                                                                              │║
║  │  Driver on dispatch:  Suresh Patil  (DRV-0042)                              │║
║  │  Driver ID shown:     ┌─────────────────────┐   [Verify ID]                │║
║  │                       │  DRV-0042            │                              │║
║  │                       └─────────────────────┘                              │║
║  │  ┌────────────────────┐  ┌────────────────────────────────────────────┐   │║
║  │  │  ✅  Same driver    │  │  ⚠  Different driver (note reason)         │   │║
║  │  └────────────────────┘  └────────────────────────────────────────────┘   │║
║  │                                                                              │║
║  │  ADDITIONAL CHECKS:                                                          │║
║  │  ┌────────────────────────────────────────────────────────────────────┐    │║
║  │  │  Check                    Status           Action                   │    │║
║  │  │  ─────────────────────────────────────────────────────────────     │    │║
║  │  │  Vehicle fitness cert     ✅ Verified      —                        │    │║
║  │  │  Vehicle condition OK     ☐ Confirm        [Mark OK]                │    │║
║  │  │  Vehicle at correct dock  ☐ Confirm        [Mark OK]                │    │║
║  │  └────────────────────────────────────────────────────────────────────┘    │║
║  │                                                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ALL 3 VERIFICATIONS COMPLETE ✅                                                  ║
║  ┌────────────────────────────────────────────────────────────────────────────┐ ║
║  │               [▶▶  START SCAN SESSION →]                                    │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
║  [← Back to Seal]                                     [⚠ Override & Start Scan] ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 4.2 Vehicle Mismatch State

```
VEHICLE REG DOES NOT MATCH:
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠  VEHICLE MISMATCH                                                        ║
║                                                                              ║
║  Expected: MH-01-AX-2341 (BlueDart)                                         ║
║  Arrived:  MH-02-BX-9910                                                    ║
║                                                                              ║
║  This vehicle is NOT on the dispatch record.                                 ║
║                                                                              ║
║  POSSIBLE CAUSES:                                                            ║
║  • Carrier substituted vehicle last-minute                                   ║
║  • Wrong vehicle routed to this dock                                         ║
║  • Dispatch data not updated after vehicle change                            ║
║                                                                              ║
║  ACTIONS:                                                                    ║
║  [🔄 Re-enter Reg]     (typo fix)                                            ║
║  [📞 Call Carrier]     (verify vehicle change)                               ║
║  [✓ Accept & Note]     (carrier confirmed sub — enter reason + supervisor)  ║
║  [🚨 Raise Exception]  (create vehicle-mismatch exception)                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

ACCEPT & NOTE FLOW:
  Reason:   [Carrier confirmed vehicle substitution — breakdown / ops reason ▼]
  Update dispatch vehicle: ☑ Yes (updates DAL vehicle record)
  Supervisor: [PIN]
  On confirm: AuditTrail.log + Exception.raise('vehicle-breakdown', severity='medium')
```

---

## 6. SCREEN 5 — HU SCAN SCREEN

**Route:** `/reconciliation/:dispatchId/scan`
**Purpose:** Core operational screen — scan incoming HU barcodes, one by one

### 6.1 Full Screen Wireframe (Optimized for tablet, scan-first)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  SCAN SESSION — TCT-0019          [🔵 ACTIVE]     14:42  •  Operator: Ramesh K  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── PROGRESS BAR ────────────────────────────────────────────────────────────┐ ║
║  │  ████████████████████████░░░░░░░░░░░░░░░  28 / 42 scanned  (67%)           │ ║
║  │  ✅ 26 OK   ⚠ 2 Duplicates   ❌ 0 Wrong Dispatch   🔒 0 Tamper             │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                  ║
║  ┌── SCAN INPUT ZONE ─────────────────────────────────────────────────────────┐ ║
║  │                                                                              │ ║
║  │                   📷  READY TO SCAN                                          │ ║
║  │                                                                              │ ║
║  │   ┌──────────────────────────────────────────────────────────────────┐     │ ║
║  │   │                                                                    │     │ ║
║  │   │          Aim scanner at HU barcode                                │     │ ║
║  │   │          or type barcode below:                                   │     │ ║
║  │   │                                                                    │     │ ║
║  │   │   ┌──────────────────────────────────────┐  [SCAN ▶]             │     │ ║
║  │   │   │  _                                   │                        │     │ ║
║  │   │   └──────────────────────────────────────┘                        │     │ ║
║  │   │                                                                    │     │ ║
║  │   └──────────────────────────────────────────────────────────────────┘     │ ║
║  │                                                                              │ ║
║  │   LAST SCAN:  ✅  HU0012326  —  Valid  •  14:41:58                          │ ║
║  │                                                                              │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                  ║
║  ┌── SCAN RESULTS FEED ───────────────────────────────────────────────────────┐ ║
║  │  (most recent first)                                                         │ ║
║  │                                                                              │ ║
║  │  14:41:58  ✅  HU0012326   Valid — accepted                                  │ ║
║  │  14:41:40  ✅  HU0012325   Valid — accepted                                  │ ║
║  │  14:41:22  ⚠   HU0012318   Duplicate — already scanned (ignored)            │ ║
║  │  14:40:58  ✅  HU0012324   Valid — accepted                                  │ ║
║  │  14:40:34  ✅  HU0012323   Valid — accepted                                  │ ║
║  │  14:40:01  ✅  HU0012322   Valid — accepted                                  │ ║
║  │  [Show all 28 →]                                                             │ ║
║  │                                                                              │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                  ║
║  ┌── FOOTER ACTIONS ──────────────────────────────────────────────────────────┐ ║
║  │  [⏸ Pause Session]   [📋 View Manifest]   [⚠ Raise Exception]              │ ║
║  │  [✅ Complete Session]  (appears when scan ≥ expected OR manual trigger)    │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 6.2 Scan Feedback States (Full-Screen Flash)

```
VALID SCAN — Full screen flash green:
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                                                                              ║
║                         ✅                                                   ║
║                    HU0012326                                                 ║
║                     ACCEPTED                                                 ║
║                                                                              ║
║                    29 / 42                                                   ║
║                                                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
Background: #16A34A (green)
Duration:   200ms → auto-dismiss, ready for next scan
Font:       HU barcode 36px bold, status 48px bold, count 28px

──────────────────────────────────────────────────────────────────────────────

DUPLICATE SCAN — Amber flash:
╔══════════════════════════════════════════════════════════════════════════════╗
║                         ⚠                                                   ║
║                    HU0012318                                                 ║
║                  ALREADY SCANNED                                             ║
║              (First scan: 14:38:21)                                          ║
║            [Ignore — continue scanning]                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
Background: #D97706 (amber)
Duration:   500ms → auto-dismiss

──────────────────────────────────────────────────────────────────────────────

WRONG DISPATCH — Full screen RED, persists until dismissed:
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                         🚨                                                   ║
║                    WRONG DISPATCH                                            ║
║                                                                              ║
║                    HU0015441                                                 ║
║              Belongs to: TCT-0031                                            ║
║              This dispatch: TCT-0019                                         ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────┐            ║
║  │  DO NOT ACCEPT THIS HU. Set aside for correct dispatch.     │            ║
║  └─────────────────────────────────────────────────────────────┘            ║
║                                                                              ║
║  [📸 Photo Evidence]           [Dismiss — Do Not Accept]                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
Background: #DC2626 (red)
Vibration:  device vibrate(400ms) if supported
Auto-raises: HUValidator.checkCrossDispatch() → ExceptionFactory.raise(wrong-dispatch)

──────────────────────────────────────────────────────────────────────────────

NOT IN REGISTRY — Amber, persists:
╔══════════════════════════════════════════════════════════════════════════════╗
║                         ❓                                                   ║
║                    HU0099999                                                 ║
║                  NOT REGISTERED                                              ║
║              Not found in any dispatch                                       ║
║                                                                              ║
║  [Add as Excess HU]    [Re-scan]    [Raise Exception]                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

──────────────────────────────────────────────────────────────────────────────

SESSION COMPLETE — when all expected HUs scanned:
╔══════════════════════════════════════════════════════════════════════════════╗
║                         🎉                                                   ║
║                  SESSION COMPLETE                                            ║
║                    42 / 42 scanned                                           ║
║                  No discrepancies!                                           ║
║                                                                              ║
║             [✅ Complete & Submit Reconciliation]                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
Background: #16A34A with confetti-style particle animation
```

---

### 6.3 Scan Session Progress Bar

```
PROGRESS BAR ANATOMY (full width, 32px height):
  ┌────────────────────────────────────────────────────────────────────────┐
  │  ██████████████████████████████████████░░░░░░░░░░░  28 / 42  (67%)    │
  └────────────────────────────────────────────────────────────────────────┘

Bar segments:
  Green fill:  OK scans / total expected
  Red segment: if missing detected (appended at end of green)
  Amber segment: duplicates (shown as separate mini count, not in bar)

STATUS COUNTERS BELOW BAR:
  ✅ N OK  •  ⚠ N Duplicate  •  ❌ N Wrong  •  🔒 N Tamper

PROGRESS BAR ANIMATION:
  Each valid scan: bar width increases (250ms ease-out transition)
  Count number: count-up animation (+1, 200ms)

EXPECTED vs ACTUAL:
  If scanned > expected: bar turns amber beyond 100% (excess)
  "42 / 42 + 3 excess" displayed

COMPLETE THRESHOLD:
  Scan session completable when:
    scanned >= expected  (all received)
    OR operator manually triggers complete (with reason for incomplete scan)
```

---

### 6.4 Pause / Resume / Complete Session

```
PAUSE SESSION:
  [⏸ Pause] → ConfirmPopover: "Pause this scan session? You can resume later."
  State: ScanSession → PAUSED
  Shows on Receiving Dashboard as "Paused — Resume ▶"
  Operator can switch operators on resume

COMPLETE SESSION (early — before all HUs scanned):
  [✅ Complete Session] when scanned < expected:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  Complete session with 28 / 42 scanned?                               │
  │                                                                        │
  │  14 HUs not yet scanned will be marked as MISSING.                    │
  │  You can continue scanning or submit with missing HUs.                │
  │                                                                        │
  │  Reason for early completion:                                          │
  │  [Truck fully unloaded — HUs physically missing ▼]                   │
  │                                                                        │
  │  [Continue Scanning]        [Submit with 14 Missing]                 │
  └──────────────────────────────────────────────────────────────────────┘

ON SESSION COMPLETE:
  HUReconciler.reconcile(dispatchId, scannedBarcodes)
    → returns { received, missing, excess, duplicates }
  LifecycleEngine.transition(dispatchId, 'reconciled', operator)
  DomainEventBus.emit('ReconciliationComplete')
  → navigates to Reconciliation Dashboard for this dispatch
```

---

## 7. SCREEN 6 — RECONCILIATION DASHBOARD

**Route:** `/reconciliation/:dispatchId/summary`
**Purpose:** Post-scan reconciliation result for one dispatch

### 7.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  RECONCILIATION SUMMARY — TCT-0019              [14:55  18 Jun]  [⬇ Print POD] ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── OVERALL RESULT ───────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │    ⚠   RECONCILIATION COMPLETE — DISCREPANCIES FOUND                        │║
║  │                                                                              │║
║  │    Dispatch: TCT-0019  •  Route: DEL-MUM-01  •  BlueDart FTL               │║
║  │    Session:  Completed 14:55 by Ramesh Kumar  •  Duration: 42 min           │║
║  │                                                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── RESULT SCORECARD ─────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐ ┌──────────┐│║
║  │  │ EXPECTED         │ │ RECEIVED ✅      │ │ MISSING ❌     │ │ EXCESS ⚠ ││║
║  │  │     42 HUs       │ │     40 HUs       │ │     2 HUs      │ │   1 HU   ││║
║  │  │                  │ │   95.2% of exp   │ │   4.8% short   │ │          ││║
║  │  │                  │ │                  │ │                │ │          ││║
║  │  │                  │ │ [View Received →] │ │ [View Missing]  │ │[View Exc]││║
║  │  └──────────────────┘ └──────────────────┘ └────────────────┘ └──────────┘│║
║  │                                                                              │║
║  │  Duplicates scanned: 2  (ignored — not counted in received)                 │║
║  │  Tamper flags:        0                                                      │║
║  │  Wrong-dispatch scans:0                                                      │║
║  │                                                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── MISSING HUs (2) ─────────────────────────────────────────────────────────┐║
║  │  HU0012341   Not scanned at receiving   Dispatched from Delhi DC            │║
║  │  HU0012342   Not scanned at receiving   Dispatched from Delhi DC            │║
║  │  [View Full Missing Dashboard →]                                             │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── EXCESS HUs (1) ──────────────────────────────────────────────────────────┐║
║  │  HU0015441   Not on manifest — accepted as excess    Wrong dispatch scan?  │║
║  │  [View Full Excess Dashboard →]                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── AUTO-RAISED EXCEPTIONS ───────────────────────────────────────────────────┐║
║  │  EXC-0099   🟠 HIGH    hu-shortage   2 HUs missing   [View] [Resolve]       │║
║  │  EXC-0100   🟡 MEDIUM  hu-excess     1 excess HU     [View] [Resolve]       │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── SIGNATURE & POD ──────────────────────────────────────────────────────────┐║
║  │  Received by:   Ramesh Kumar (WM)     Time: 14:55  18 Jun 2026              │║
║  │  Carrier rep:   [Signature or skip ▼]                                        │║
║  │  Carrier POD:   [Signature pad / digital sign]   ← optional                  │║
║  │  Notes:         [Any final notes for this shipment...]                       │║
║  │                                                                              │║
║  │  [⬇ Download PDF Report]   [📧 Email to Transport Manager]   [✓ Close]      │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 7.2 Result Scorecard Variants

```
VARIANT 1 — PERFECT MATCH (no discrepancies):
  Banner: ✅  RECONCILIATION COMPLETE — PERFECT MATCH
  Background: --wh-ok at 10%
  Expected: 42  Received: 42 ✅  Missing: 0  Excess: 0
  No auto-exceptions raised
  [Complete & Close] button (primary green)

VARIANT 2 — PARTIAL DISCREPANCY (missing or excess):
  Banner: ⚠  RECONCILIATION COMPLETE — DISCREPANCIES FOUND
  Background: --wh-warn at 10%
  Exceptions auto-raised for missing (hu-shortage) and excess (hu-excess)
  [Resolve Discrepancies] and [Complete with Discrepancies] buttons

VARIANT 3 — SEVERE DISCREPANCY (>10% missing or tamper):
  Banner: 🔴  CRITICAL — SIGNIFICANT SHORTAGE DETECTED
  Background: --wh-danger at 10%
  Escalation triggered automatically
  [Complete] button disabled until supervisor override

SCORECARD TILE CLICK BEHAVIOR:
  RECEIVED tile:  → opens received HU list (all ✅ barcodes)
  MISSING tile:   → navigates to Missing HU Dashboard (Screen 7)
  EXCESS tile:    → navigates to Excess HU Dashboard (Screen 8)
```

---

### 7.3 Cross-Dispatch Reconciliation Summary (all dispatches)

```
ROUTE: /reconciliation/summary (no dispatchId — top-level)
Shows summary across ALL dispatches for the day/period

┌── ALL DISPATCHES RECONCILIATION STATUS ────────────────────────────────────┐
│  Period: Today  DC: Delhi                                    [⬇ Export]    │
│  ──────────────────────────────────────────────────────────────────────    │
│  Total dispatches: 8  •  Reconciled: 4  •  Pending: 2  •  In Scan: 1      │
│                                                                              │
│  ID        Status       Exp  Rec  Miss  Excess  Exceptions  Action          │
│  ───────────────────────────────────────────────────────────────────────── │
│  TCT-0009  ✅ Complete   42   42   0     0       0           [Report]       │
│  TCT-0011  ⚠  Discr.    40   38   2     0       1           [Resolve]      │
│  TCT-0019  ⚠  Discr.    42   40   2     1       2           [Resolve]      │
│  TCT-0031  🔵 In Scan   42   28   —     —       —           [Monitor]      │
│  TCT-0022  ⏳ Pending    36   —    —     —       —           [Start ▶]     │
│  TCT-0028  ⏳ Pending    18   —    —     —       —           [Start ▶]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. SCREEN 7 — MISSING HU DASHBOARD

**Route:** `/reconciliation/:dispatchId/missing`
**Purpose:** Identify, investigate, and action every missing HU

### 8.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ← Reconciliation Summary    MISSING HUs — TCT-0019           [⬇ Export List]  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── MISSING SUMMARY ──────────────────────────────────────────────────────────┐║
║  │  Dispatch: TCT-0019  •  DEL-MUM-01  •  BlueDart  •  Completed: 14:55       │║
║  │                                                                              │║
║  │  Expected: 42   •   Received: 40   •   MISSING: 2   •   Missing %: 4.76%   │║
║  │                                                                              │║
║  │  Auto-exception: EXC-0099  🟠 HIGH  hu-shortage  [View Exception →]          │║
║  │  Exception state: OPEN — Unresolved                                          │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  INVESTIGATION STATUS:  [⭕ Unresolved (2)]  [🔄 Under Investigation (0)]       ║
║                          [✅ Located (0)]     [🔒 Confirmed Lost (0)]            ║
║                                                                                  ║
║  ┌── MISSING HU TABLE ─────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │  Barcode    Dispatch  Origin     Last Seen          Status     Action        │║
║  │  ──────────────────────────────────────────────────────────────────────     │║
║  │                                                                              │║
║  │  HU0012341  TCT-0019  DC Delhi   Loaded 08:10       ⭕ MISSING   [Investigate]│║
║  │             Registered: 17 Jun   In-transit GPS —   (not found   [Mark Lost] │║
║  │             Carrier: BlueDart    no unload ping               [Found ✓]    │║
║  │                                                                              │║
║  │  HU0012342  TCT-0019  DC Delhi   Loaded 08:10       ⭕ MISSING   [Investigate]│║
║  │             Registered: 17 Jun   In-transit GPS —   (not found   [Mark Lost] │║
║  │             Carrier: BlueDart    no unload ping               [Found ✓]    │║
║  │                                                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── INVESTIGATION PANEL (expands per HU) ─────────────────────────────────────┐║
║  │  HU0012341 — Investigation                              [× Close]           │║
║  │                                                                              │║
║  │  CHAIN OF CUSTODY:                                                           │║
║  │  ✅ Packed      17 Jun 22:30   DC Delhi                                     │║
║  │  ✅ Loaded      18 Jun 08:10   Into MH-01-AX-2341                          │║
║  │  ✅ Dispatched  18 Jun 08:14   Gate pass scanned                            │║
║  │  ✅ In Transit  18 Jun 08:14 → 14:55   GPS tracked                         │║
║  │  ❌ Unloaded    NOT SCANNED at DC Mumbai                                    │║
║  │                                                                              │║
║  │  POSSIBLE LOCATIONS:                                                         │║
║  │  • Still in vehicle (vehicle not fully unloaded)                            │║
║  │  • Left at origin DC (loading error — not loaded)                           │║
║  │  • Unloaded at wrong dock                                                   │║
║  │  • Theft / loss in transit                                                   │║
║  │                                                                              │║
║  │  ACTIONS:                                                                    │║
║  │  [📞 Call Driver — check vehicle]                                            │║
║  │  [📞 Call Origin DC — check if loaded]                                       │║
║  │  [✓ Mark as Found — enter location]                                          │║
║  │  [🔒 Confirm Lost — raises theft-risk exception]                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── BULK ACTIONS ─────────────────────────────────────────────────────────────┐║
║  │  [☐ Select All]  [Mark All Lost]  [Mark All Found]  [Request Investigation] │║
║  │  [📧 Email Report to TM]  [⬇ Export Missing List]                            │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 8.2 Missing HU Investigation Statuses

```
INVESTIGATION STATE FLOW:
  ⭕ MISSING          → initial state after reconciliation
  🔄 UNDER INVESTIGATION → operator started investigation (called carrier/DC)
  ✅ LOCATED          → HU found (wrong dock, still in vehicle, etc.)
  🔒 CONFIRMED LOST   → after investigation, cannot be located

STATE TRANSITIONS:
  MISSING → UNDER INVESTIGATION: [Investigate] button → auto-logs timestamp + operator
  MISSING → LOCATED:             [Found ✓] → enter location + notes
  MISSING → CONFIRMED LOST:      [Mark Lost] → ConfirmPopover + supervisor PIN
  UNDER INVESTIGATION → LOCATED: [Mark Found]
  UNDER INVESTIGATION → CONFIRMED LOST: [Confirm Lost]

LOCATED FLOW:
  [✓ Mark as Found — enter location]:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  HU Found — Enter Details                                            │
  │  ──────────────────────────────────────────────────────────          │
  │  Found at:   [Wrong dock 3 ▼]  [Still in vehicle]  [Other...]       │
  │  Found by:   [___________________]                                   │
  │  Notes:      [___________________]                                   │
  │  HU condition: ○ Intact  ○ Damaged                                  │
  │  [Cancel]                  [Mark Found & Close]                      │
  └──────────────────────────────────────────────────────────────────────┘
  On submit: HURegistry.markReceived(barcode, sessionId)
             Exception EXC-0099 → resolved (auto, if all missing found)

CONFIRMED LOST FLOW:
  Supervisor PIN required
  Raises: ExceptionFactory.raise('theft-risk', dispatch, severity='critical')
          if not already raised
  Status: HURegistry entry flagged as CONFIRMED_LOST
  Audit: logged with operator, timestamp, investigation trail
```

---

## 9. SCREEN 8 — EXCESS HU DASHBOARD

**Route:** `/reconciliation/:dispatchId/excess`
**Purpose:** Manage HUs received that were not on the dispatch manifest

### 9.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ← Reconciliation Summary    EXCESS HUs — TCT-0019            [⬇ Export List]  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── EXCESS SUMMARY ───────────────────────────────────────────────────────────┐║
║  │  Dispatch: TCT-0019  •  DEL-MUM-01  •  BlueDart  •  Completed: 14:55       │║
║  │                                                                              │║
║  │  Expected: 42   •   Received: 40   •   EXCESS: 1   •   Extra HUs not on ASN│║
║  │                                                                              │║
║  │  Auto-exception: EXC-0100  🟡 MEDIUM  hu-excess  [View Exception →]         │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  RESOLUTION STATUS:  [⭕ Unresolved (1)]  [✅ Resolved (0)]                     ║
║                                                                                  ║
║  ┌── EXCESS HU TABLE ──────────────────────────────────────────────────────────┐║
║  │                                                                              │║
║  │  Barcode    Registry Lookup              Probable Source    Action           │║
║  │  ───────────────────────────────────────────────────────────────────────    │║
║  │                                                                              │║
║  │  HU0015441  Found on dispatch TCT-0031   Wrong dispatch     [Return to TCT-0031] │║
║  │             TCT-0031 shows as MISSING    scan              [Accept as Own]   │║
║  │             BlueDart same vehicle         this HU           [Reject — hold]   │║
║  │                                                                              │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── EXCESS HU DETAIL PANEL ───────────────────────────────────────────────────┐║
║  │  HU0015441 — Source Investigation                                            │║
║  │                                                                              │║
║  │  REGISTRY LOOKUP RESULT:                                                     │║
║  │  ┌────────────────────────────────────────────────────────────────────┐    │║
║  │  │  Barcode:    HU0015441                                              │    │║
║  │  │  Belongs to: TCT-0031  (DEL-MUM-01, same route, same vehicle)      │    │║
║  │  │  Status:     Listed as MISSING on TCT-0031 reconciliation           │    │║
║  │  │  ─────────────────────────────────────────────────────────────     │    │║
║  │  │  ✅  This is likely a wrong-dispatch scan.                          │    │║
║  │  │  The HU was on the same vehicle but on a different dispatch.        │    │║
║  │  └────────────────────────────────────────────────────────────────────┘    │║
║  │                                                                              │║
║  │  RECOMMENDED RESOLUTION:                                                     │║
║  │  Transfer this HU to TCT-0031 reconciliation as RECEIVED.                   │║
║  │                                                                              │║
║  │  ACTIONS:                                                                    │║
║  │  [✓ Transfer to TCT-0031 — mark received there]  ← RECOMMENDED              │║
║  │  [⚠ Accept on this dispatch — enter reason]                                  │║
║  │  [📦 Hold in quarantine — pending investigation]                              │║
║  │  [↩ Return to carrier]                                                        │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 9.2 Excess HU Resolution Actions

```
ACTIONS PER EXCESS HU:

1. TRANSFER TO CORRECT DISPATCH:
   [Transfer to TCT-0031]
   → HURegistry: mark HU0015441 received on TCT-0031
   → TCT-0031 missing count decrements (-1)
   → TCT-0019 excess count resolves
   → Both exceptions auto-resolved if no further discrepancies
   → Audit trail logged on both dispatches

2. ACCEPT ON THIS DISPATCH:
   [Accept as part of TCT-0019]
   → Requires reason: [Carrier added HU / replacement / customer agreement]
   → Note: required
   → Supervisor PIN: required
   → HURegistry: marks as accepted_excess on TCT-0019
   → Exception remains but state → PENDING INFO

3. HOLD IN QUARANTINE:
   [Hold — pending investigation]
   → Physical: HU set aside in quarantine bay
   → System: HURegistry → QUARANTINE state
   → Exception remains OPEN
   → 24h auto-follow-up alert

4. RETURN TO CARRIER:
   [Return to carrier]
   → Driver/carrier acknowledgement required (signature or PIN)
   → HURegistry → RETURNED state
   → Exception → AUTO-RESOLVED
   → Carrier notified via NotificationEngine

BULK ACTIONS (when multiple excess):
  [Return All to Carrier]
  [Transfer All by Dispatch ID]
  [Quarantine All]
```

---

## 10. SCREEN 9 — DISCREPANCY RESOLUTION SCREEN

**Route:** `/reconciliation/:dispatchId/discrepancies`
**Purpose:** Unified workspace to resolve all discrepancy types on one dispatch

### 10.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  DISCREPANCY RESOLUTION — TCT-0019              [⬇ Report]  [📧 Notify TM]     ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── DISCREPANCY SUMMARY ──────────────────────────────────────────────────────┐║
║  │  TCT-0019  DEL-MUM-01  BlueDart  Reconciled: 14:55  Operator: Ramesh K      │║
║  │  ────────────────────────────────────────────────────────────────────────   │║
║  │  Total discrepancies: 3   •   Resolved: 0   •   Pending: 3                  │║
║  │  Open exceptions:     2   •   Carrier fault: Pending determination           │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── DISCREPANCY TYPE TABS ────────────────────────────────────────────────────┐║
║  │  [❌ Missing (2)]  [➕ Excess (1)]  [⚠ Seal Issues (0)]  [📄 Doc Issues (0)] ║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ══ MISSING HUs (2) ══                                                           ║
║                                                                                  ║
║  ┌── RESOLUTION CARD: HU0012341 ─────────────────────────────────────────────┐ ║
║  │  ❌ MISSING  •  HU0012341  •  Dispatched from DC Delhi  •  Age: 1h         │ ║
║  │  Carrier: BlueDart  •  Driver: Suresh Patil                                 │ ║
║  │                                                                              │ ║
║  │  INVESTIGATION:  ⭕ Not started                                              │ ║
║  │  ──────────────────────────────────────────────────────────────────────     │ ║
║  │  Root Cause:     [Select root cause... ▼]                                    │ ║
║  │                  Loading error / In vehicle / Wrong dock / Lost / Other      │ ║
║  │                                                                              │ ║
║  │  Action Taken:   [Describe what was done... (min 20 chars)]                  │ ║
║  │                                                                              │ ║
║  │  Outcome:        ○ HU Located — found at: [_____]                           │ ║
║  │                  ○ HU Still Missing — next steps: [_____]                   │ ║
║  │                  ○ Confirmed Lost — raise theft-risk exception               │ ║
║  │                                                                              │ ║
║  │  Carrier Fault:  ○ Yes   ○ No   ○ Undetermined                              │ ║
║  │  Penalty:        [₹ ______]   ☐ Waive                                       │ ║
║  │                                                                              │ ║
║  │  [Save Draft]                                  [✅ Resolve HU0012341]       │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── RESOLUTION CARD: HU0012342 ─────────────────────────────────────────────┐ ║
║  │  ❌ MISSING  •  HU0012342  •  [collapsed — click to expand]          [▼]   │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ══ EXCESS HUs (1) ══                                                            ║
║                                                                                  ║
║  ┌── RESOLUTION CARD: HU0015441 ─────────────────────────────────────────────┐ ║
║  │  ➕ EXCESS  •  HU0015441  •  Belongs to: TCT-0031                          │ ║
║  │                                                                              │ ║
║  │  Resolution:  [Transfer to TCT-0031 ▼]                                      │ ║
║  │  Note:        [Wrong-dispatch scan — same vehicle, different manifest.]      │ ║
║  │                                                                              │ ║
║  │  [✅ Apply Resolution]                                                       │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘║
║                                                                                  ║
║  ┌── FINAL SUBMISSION ─────────────────────────────────────────────────────────┐║
║  │  Resolution Progress:  1 / 3 resolved  •  2 pending                         │║
║  │                                                                              │║
║  │  [Save All Drafts]  [Submit All Resolved]  [Escalate to TM for approval ▶]  │║
║  └──────────────────────────────────────────────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 10.2 Resolution Completion Flow

```
SUBMIT ALL RESOLVED:
  Validation:
    Each resolved card must have: root cause + action + outcome
    Missing with "Confirmed Lost": theft-risk exception raised (auto)
    Excess with "Transfer": transfer action queued

  Confirmation modal:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  Submit Reconciliation Resolution for TCT-0019?                       │
  │  ──────────────────────────────────────────────────────────────────   │
  │  ✅  HU0012341  Located — found in vehicle (back of truck)            │
  │  ⏳  HU0012342  Still missing — investigation ongoing                 │
  │  ✅  HU0015441  Transferred to TCT-0031                               │
  │  ──────────────────────────────────────────────────────────────────   │
  │  Pending items will remain in OPEN state.                            │
  │  Transport Manager will be notified.                                  │
  │  [Cancel]                          [Submit & Notify TM]              │
  └──────────────────────────────────────────────────────────────────────┘

ON SUBMIT:
  HUReconciler.resolve(discrepancies) executes per-HU actions
  ExceptionManager.resolve(EXC-0099, resolutionData) for resolved items
  LifecycleEngine.transition(dispatchId, 'closed') if all items resolved
  DomainEventBus.emit('ReconciliationResolved')
  NotificationEngine: TM + Ops Exec notified
  Reconciliation report generated (PDF-ready data object in localStorage)

ESCALATE TO TM:
  Sends all draft notes + HU list to Transport Manager
  Exception state → ASSIGNED (to TM)
  TM receives WhatsApp/Email notification with deep link
  TM can view and complete resolution from Exception Detail screen
```

---

## 11. REACT COMPONENT HIERARCHY

### 11.1 File Organization

```
src/
├── pages/
│   └── reconciliation/
│       ├── ReconciliationLayout.jsx         ← shell + context bar + subnav
│       ├── ReceivingDashboard.jsx
│       ├── ASNVerification.jsx
│       ├── SealVerification.jsx
│       ├── VehicleVerification.jsx
│       ├── HUScanScreen.jsx
│       ├── ReconciliationSummary.jsx
│       ├── MissingHUDashboard.jsx
│       ├── ExcessHUDashboard.jsx
│       └── DiscrepancyResolution.jsx
│
├── components/
│   └── reconciliation/
│       │
│       ├── shell/
│       │   ├── ReceivingContextBar.jsx
│       │   └── ReconSubNav.jsx
│       │
│       ├── receiving/
│       │   ├── ReceivingDispatchCard.jsx
│       │   │   ├── ArrivalDwellBadge.jsx
│       │   │   ├── VerificationGrid.jsx    ← 4-cell ASN/Seal/Vehicle/Ready
│       │   │   └── ReceivingCardCTA.jsx
│       │   ├── ActiveScanBanner.jsx
│       │   └── CompletedDispatchRow.jsx
│       │
│       ├── verification/
│       │   ├── VerificationStepper.jsx      ← ASN→Seal→Vehicle progress
│       │   ├── asn/
│       │   │   ├── ASNInputField.jsx
│       │   │   ├── ASNCheckTable.jsx       ← 7 cross-ref checks
│       │   │   └── ASNOverrideForm.jsx
│       │   ├── seal/
│       │   │   ├── SealExpectedDisplay.jsx
│       │   │   ├── SealScanInput.jsx
│       │   │   ├── SealIntegritySelector.jsx  ← YES/NO large buttons
│       │   │   ├── SealMatchResult.jsx
│       │   │   ├── SealMismatchPanel.jsx
│       │   │   └── SealTamperPanel.jsx
│       │   └── vehicle/
│       │       ├── VehicleExpectedCard.jsx
│       │       ├── VehicleRegInput.jsx
│       │       ├── VehicleMatchResult.jsx
│       │       ├── DriverConfirmSelector.jsx
│       │       ├── AdditionalChecksTable.jsx
│       │       └── VehicleMismatchPanel.jsx
│       │
│       ├── scan/
│       │   ├── ScanProgressBar.jsx
│       │   ├── ScanStatusCounters.jsx      ← OK / Dup / Wrong / Tamper
│       │   ├── ScanInputZone.jsx
│       │   │   ├── BarcodeInputField.jsx   ← auto-focus, scanner-ready
│       │   │   └── LastScanResult.jsx
│       │   ├── ScanFeedbackOverlay.jsx     ← full-screen flash states
│       │   │   ├── ValidScanFlash.jsx
│       │   │   ├── DuplicateScanFlash.jsx
│       │   │   ├── WrongDispatchFlash.jsx
│       │   │   └── UnknownBarcodeFlash.jsx
│       │   ├── ScanResultFeed.jsx
│       │   │   └── ScanResultRow.jsx
│       │   ├── SessionCompleteOverlay.jsx
│       │   ├── PauseSessionModal.jsx
│       │   └── EarlyCompleteModal.jsx
│       │
│       ├── summary/
│       │   ├── ReconciliationResultBanner.jsx  ← perfect/partial/severe
│       │   ├── ResultScorecardTiles.jsx         ← Expected/Received/Missing/Excess
│       │   ├── MissingHUSummaryStrip.jsx
│       │   ├── ExcessHUSummaryStrip.jsx
│       │   ├── AutoRaisedExceptionsList.jsx
│       │   ├── SignaturePODPanel.jsx
│       │   └── AllDispatchesReconTable.jsx     ← cross-dispatch summary view
│       │
│       ├── missing/
│       │   ├── MissingSummaryBar.jsx
│       │   ├── MissingStatusTabs.jsx           ← Unresolved/Investigating/Located/Lost
│       │   ├── MissingHUTable.jsx
│       │   ├── MissingHURow.jsx
│       │   │   └── MissingRowInlineActions.jsx
│       │   ├── InvestigationPanel.jsx
│       │   │   ├── CustodyTrailMini.jsx
│       │   │   ├── PossibleLocationsList.jsx
│       │   │   └── InvestigationActions.jsx
│       │   └── FoundHUModal.jsx
│       │
│       ├── excess/
│       │   ├── ExcessSummaryBar.jsx
│       │   ├── ExcessHUTable.jsx
│       │   ├── ExcessHURow.jsx
│       │   ├── ExcessDetailPanel.jsx
│       │   │   ├── RegistryLookupResult.jsx
│       │   │   └── ExcessResolutionActions.jsx
│       │   └── TransferConfirmModal.jsx
│       │
│       └── discrepancy/
│           ├── DiscrepancySummaryBar.jsx
│           ├── DiscrepancyTypeTabs.jsx
│           ├── DiscrepancyResolutionCard.jsx
│           │   ├── MissingResolutionForm.jsx
│           │   └── ExcessResolutionForm.jsx
│           ├── ResolutionProgressBar.jsx
│           └── SubmitResolutionModal.jsx
│
├── hooks/
│   ├── useReceivingDashboard.js
│   ├── useVerificationFlow.js         ← manages ASN→Seal→Vehicle state
│   ├── useScanSession.js              ← core scan session state machine
│   ├── useBarcodeScanner.js           ← keyboard/HID scanner input hook
│   ├── useReconciliationSummary.js
│   ├── useMissingHUs.js
│   ├── useExcessHUs.js
│   └── useDiscrepancyResolution.js
│
└── context/
    └── ScanSessionContext.jsx         ← active session state shared across components
```

---

### 11.2 Key Component Props

```jsx
// ── VerificationStepper ──────────────────────────────────────────────────────
VerificationStepper.propTypes = {
  steps: arrayOf(shape({
    key:    oneOf(['asn','seal','vehicle']).isRequired,
    label:  string.isRequired,
    status: oneOf(['pending','current','complete','overridden','failed']).isRequired,
    overrideReason: string,
  })).isRequired,
  currentStep: number.isRequired,
}

// ── ScanInputZone ─────────────────────────────────────────────────────────────
ScanInputZone.propTypes = {
  dispatchId:      string.isRequired,
  expectedBarcodes:arrayOf(string).isRequired,
  scannedBarcodes: arrayOf(string).isRequired,
  onScan:          func.isRequired,   // (barcode, result) => void
  disabled:        bool,              // true when session paused
  autoFocus:       bool,
}

// ── ScanFeedbackOverlay ───────────────────────────────────────────────────────
ScanFeedbackOverlay.propTypes = {
  visible:    bool.isRequired,
  result:     oneOf(['valid','duplicate','wrong-dispatch','unknown','tamper']),
  barcode:    string,
  scannedAt:  string,           // ISO timestamp
  metadata:   shape({
    correctDispatchId: string,  // for wrong-dispatch
    firstScanTime:     string,  // for duplicate
  }),
  onDismiss:  func,
  autoDismissMs: number,        // 0 = no auto-dismiss
}

// ── ScanProgressBar ──────────────────────────────────────────────────────────
ScanProgressBar.propTypes = {
  expected:   number.isRequired,
  received:   number.isRequired,
  excess:     number,
  duplicates: number,
  wrong:      number,
  tamper:     number,
  animated:   bool,
}

// ── MissingHURow ──────────────────────────────────────────────────────────────
MissingHURow.propTypes = {
  hu: shape({
    barcode:     string.isRequired,
    dispatchId:  string,
    origin:      string,
    lastSeen:    string,
    carrier:     string,
    status:      oneOf(['missing','investigating','located','confirmed-lost']),
  }).isRequired,
  onInvestigate: func,
  onMarkFound:   func,
  onMarkLost:    func,
  expanded:      bool,
  onExpand:      func,
}

// ── ExcessDetailPanel ─────────────────────────────────────────────────────────
ExcessDetailPanel.propTypes = {
  hu: shape({
    barcode:          string.isRequired,
    registryLookup:   shape({
      found:          bool,
      belongsToDispatchId: string,
      belongsToRoute: string,
      missingOnThat:  bool,
    }),
    recommendedAction:oneOf(['transfer','accept','quarantine','return']),
  }).isRequired,
  onResolve: func.isRequired,
}

// ── DiscrepancyResolutionCard ──────────────────────────────────────────────────
DiscrepancyResolutionCard.propTypes = {
  discrepancy: shape({
    type:     oneOf(['missing','excess','seal','document']).isRequired,
    barcode:  string,
    details:  object,
    status:   oneOf(['pending','in-progress','resolved']),
  }).isRequired,
  onSave:    func,
  onResolve: func,
  collapsed: bool,
  onToggle:  func,
}

// ── ResultScorecardTiles ───────────────────────────────────────────────────────
ResultScorecardTiles.propTypes = {
  expected:   number.isRequired,
  received:   number.isRequired,
  missing:    number.isRequired,
  excess:     number.isRequired,
  duplicates: number,
  tamper:     number,
  onClickMissing: func,
  onClickExcess:  func,
  onClickReceived:func,
}
```

---

### 11.3 useBarcodeScanner Hook Specification

```javascript
// hooks/useBarcodeScanner.js
// Handles USB HID barcode scanner input (fires as rapid keystrokes ending in Enter)
// Also accepts typed input with debounce

export function useBarcodeScanner({ onScan, minLength = 6, scanDelayMs = 50 }) {
  /*
  ALGORITHM:
  1. Attach keydown listener to document
  2. Accumulate chars at > N chars/sec (scanner fires very fast)
  3. On Enter key: flush buffer → call onScan(buffer)
  4. Detect scanner vs keyboard:
     - Scanner: chars arrive < scanDelayMs apart → treat as scanner input
     - Keyboard: chars arrive > scanDelayMs apart → treat as manual type
  5. Manual type input: debounce 300ms, require Enter to submit
  6. Buffer resets on: Enter, blur, 500ms idle

  RETURN:
  {
    inputRef:     ref,         // attach to <input> element
    lastScan:     string,      // last accepted barcode
    isScanning:   bool,        // true during rapid-input detection
    scanCount:    number,      // total scans this session
    clear:        () => void,  // reset buffer
  }

  USAGE:
  const { inputRef, lastScan } = useBarcodeScanner({ onScan: handleScan })
  <input ref={inputRef} autoFocus ... />
  */
}
```

---

## 12. SCAN SESSION STATE MACHINE

```
SCAN SESSION STATES:
                  ┌──────────┐
                  │  CREATED │  ← ScanSession.create(dispatchId, operatorId)
                  └────┬─────┘
                       │ operator starts scanning
                       ▼
                  ┌──────────┐
                  │  ACTIVE  │  ← barcodes being scanned
                  └────┬─────┘
                 pause │    │ resume
                  ┌────▼──┐  │
                  │PAUSED │──┘
                  └───────┘
                       │ complete triggered (all scanned OR manual)
                       ▼
                  ┌──────────────┐
                  │  PROCESSING  │  ← HUReconciler.reconcile() running
                  └──────┬───────┘
                         │ result ready
                         ▼
                  ┌───────────────┐
                  │   COMPLETED   │  ← result: received / missing / excess
                  └──────┬────────┘
                         │ discrepancies resolved
                         ▼
                  ┌──────────────┐
                  │   RESOLVED   │  ← all discrepancies actioned
                  └──────────────┘

SESSION OBJECT (in localStorage: tct_scan_sessions[]):
{
  sessionId:       "SS-2026-0618-001",
  dispatchId:      "TCT-0019",
  operatorId:      "USR-003",
  operatorName:    "Ramesh Kumar",
  status:          "active",
  startedAt:       "2026-06-18T14:12:00Z",
  completedAt:     null,
  expectedBarcodes:["HU0012301", ..., "HU0012342"],   // 42 items
  scannedBarcodes: ["HU0012301", ..., "HU0012326"],   // 28 so far
  scanEvents: [
    { barcode:"HU0012301", result:"valid",     scannedAt:"14:12:05Z" },
    { barcode:"HU0012318", result:"duplicate", scannedAt:"14:41:22Z" },
    ...
  ],
  duplicates:      ["HU0012318"],
  wrongDispatches: [],
  tamperFlags:     [],
  result:          null,    // populated on complete
  verifications: {
    asn:     { status:"verified", by:"Ramesh Kumar", at:"..." },
    seal:    { status:"verified", by:"Ramesh Kumar", at:"...", intact:true },
    vehicle: { status:"verified", by:"Ramesh Kumar", at:"..." },
  },
}

RECONCILIATION RESULT (from HUReconciler.reconcile()):
{
  dispatchId:      "TCT-0019",
  sessionId:       "SS-2026-0618-001",
  expected:        ["HU0012301", ..., "HU0012342"],
  received:        ["HU0012301", ..., "HU0012340"],    // 40 items
  missing:         ["HU0012341", "HU0012342"],          // set diff
  excess:          ["HU0015441"],                        // scanned but not expected
  duplicates:      ["HU0012318"],
  wrongDispatch:   [],
  tamper:          [],
  receivedCount:   40,
  missingCount:    2,
  excessCount:     1,
  matchPct:        95.24,
}
```

---

## 13. UX INTERACTIONS & SCAN FEEDBACK

### 13.1 Scan Input Behavior

```
KEYBOARD / SCANNER INPUT HANDLING:
  1. Page loads → ScanInputZone auto-focuses input field
  2. ANY keypress while on scan screen → focuses input field
     (user shouldn't need to tap input field between scans)
  3. Scanner fires chars at 5–10ms intervals + Enter
  4. Keyboard type: chars at human speed + Enter to submit
  5. Both modes: on Enter → process barcode

SCAN RESULT PROCESSING (in order):
  a. Format validate: /^HU\d{7}$/
     → fail: ScanFeedbackOverlay('invalid-format') amber, no count
  b. Already scanned check (in scannedBarcodes[])
     → true: ScanFeedbackOverlay('duplicate') amber, 500ms
  c. Cross-dispatch check: HUValidator.checkCrossDispatch(barcode, dispatchId)
     → true: ScanFeedbackOverlay('wrong-dispatch') RED, persists
     → auto-raises: ExceptionFactory.raise('wrong-dispatch', ...)
  d. In expected list check (expectedBarcodes[])
     → true: ScanFeedbackOverlay('valid') GREEN, 200ms
             scannedBarcodes.push(barcode)
             ScanSession.recordScan(barcode, 'valid')
             HURegistry.markReceived(barcode, sessionId)
             progress bar advances
     → false (not in expected, not wrong-dispatch): ScanFeedbackOverlay('unknown') amber
             prompt: "This HU is not on the manifest. Add as excess? [Yes / No]"

INPUT FIELD AUTO-CLEAR:
  After each scan result (valid or otherwise):
  inputField.value = ''
  inputField.focus()
  Ready for next scan immediately

SCANNER DEVICE HANDLING:
  USB HID: treated as keyboard, already handled above
  Bluetooth: same (standard HID profile)
  Camera: [📷 Camera Scan] button → opens camera modal (future implementation stub)
```

---

### 13.2 Verification Flow Interactions

```
ASN VERIFICATION:
  Input auto-focuses on page load
  On Enter: HUValidator.validateASN(entered, expected) → cross-reference run
  All 7 checks animate in one by one (stagger 100ms each)
  Passed checks: green ✅ appear with small check animation
  Failed check: red ❌ stops animation, failure panel slides down

SEAL VERIFICATION:
  Input auto-focuses
  On scan: SealValidator.checkSeal(entered, expected)
  Match result: large colored banner (green / red) slides in below input
  Integrity question (YES/NO): large 48px touch targets, full-width buttons
  YES selected → border turns green
  NO selected  → border turns red, tamper panel slides in

VEHICLE VERIFICATION:
  Input auto-focuses
  On Enter: VehicleValidator.check(entered, expected)
  Match: ✅ banner confirms
  Driver confirmation: YES / NO large buttons
  Additional checks: each checkbox confirms in sequence

ALL 3 COMPLETE STATE:
  Page bottom: [▶▶ Start Scan Session →] slides up from footer (300ms)
  Button: full-width, height 72px, green, font-size 22px, bold
  Pulse animation on button to draw attention
```

---

### 13.3 Session Progress Interactions

```
PROGRESS BAR ANIMATION:
  Each valid scan: width increases (250ms ease-out)
  Count text: count-up (+1, 150ms) via CSS counter

RESULT FEED:
  Each scan: new row slides in at top of feed (translateY -20px → 0, 150ms)
  Valid rows: white bg
  Duplicate rows: amber tint bg
  Wrong-dispatch rows: red tint bg (should be rare given flash overlay handles it)
  Feed max 10 rows visible, scrollable

SESSION PAUSE / RESUME:
  Pause: scan input disabled, input field grayed, "PAUSED" badge appears
  Resume: re-enabled, auto-focus, ready immediately

IDLE TIMEOUT WARNING:
  After 5 min with no scan:
  ┌──────────────────────────────────────────────┐
  │  ⏱ Session idle for 5 minutes               │
  │  Are you still scanning?                     │
  │  [Continue Scanning]  [Pause Session]        │
  └──────────────────────────────────────────────┘
  Auto-pause at 15 min idle
```

---

### 13.4 Discrepancy Resolution Interactions

```
CARD COLLAPSE / EXPAND:
  All cards start expanded
  [▼] toggle collapses to single-line header
  Expand restores form state (draft preserved in ScanSessionContext)

DRAFT AUTO-SAVE:
  ResolutionForm debounces changes → saves to localStorage tct_recon_drafts
  Draft restored on page refresh
  Draft cleared on successful submit

ROOT CAUSE SELECT:
  On select: resolution note template auto-fills
  Template per discrepancy type × root cause (same pattern as Exception resolution)

CARRIER FAULT:
  YES selected → penalty field appears (slide-down 150ms)
  Penalty = 0: valid (waiver with reason)
  Penalty > 0: amount in rupees, no validation max

SUBMIT SEQUENCE:
  [Submit & Notify TM]:
    1. ConfirmModal opens (review list)
    2. User confirms
    3. Progress bar shows (loading state)
    4. HUReconciler.resolve() fires
    5. ExceptionManager updates
    6. NotificationEngine fires
    7. Redirect to ReconciliationSummary
    8. Success toast: "TCT-0019 reconciliation submitted. Transport Manager notified."
```

---

### 13.5 Animation Spec

```
SCAN FLASH OVERLAYS:
  Animation: opacity 0 → 1 in 50ms, hold, then 1 → 0 in 100ms
  Valid:        50ms fade-in, 200ms hold, 100ms fade-out (total 350ms)
  Duplicate:    50ms fade-in, 500ms hold, 100ms fade-out (total 650ms)
  Wrong dispatch: 50ms fade-in, HOLDS until dismissed (no auto-fade)
  Unknown:      50ms fade-in, 800ms hold, 100ms fade-out

PROGRESS BAR:
  Width transition: 250ms cubic-bezier(0.34, 1.56, 0.64, 1)  ← spring feel
  Color change (at 100%): green fill transitions to amber if excess

SESSION COMPLETE OVERLAY:
  Scale: 0.8 → 1.0 (300ms spring)
  Background: slides up from bottom (translateY 100% → 0, 400ms ease-out)

VERIFICATION STEP COMPLETION:
  Step dot: ○ → ✅ with scale bounce (scale 1 → 1.3 → 1, 300ms)
  Connector line: draws from left (width 0 → 100%, 400ms)

SCORECARD TILES (reconciliation result):
  Count numbers: count-up animation from 0 to final value (600ms)
  Missing/Excess tiles: pulse on load if > 0 (draws attention)
```

---

## 14. DATA CONTRACTS

### 14.1 Receiving Dashboard ← ReconciliationDashboardService

```javascript
// ReconciliationDashboardService.getSummary()
{
  arrivedToday:   6,
  pendingReceiving:4,
  inScan:          1,
  completedToday:  2,
  totalDiscrepancies:3,
  unresolvedExceptions:2,
}

// ReconciliationDashboardService.getDispatchList()
// returns dispatches in received states
[
  {
    dispatchId:   "TCT-0019",
    status:       "arrived",
    arrivedAt:    "2026-06-18T10:20:00Z",
    dwellMs:      15120000,   // 4h 12m
    expectedHU:   42,
    routeCode:    "DEL-MUM-01",
    carrierName:  "BlueDart",
    sealStatus:   "intact",
    verifications:{
      asn:     "verified",
      seal:    "verified",
      vehicle: "verified",
    },
    scanSession:  null,    // or session object if active/complete
  },
  ...
]
```

### 14.2 Scan Session ← ScanSession + HURegistry

```javascript
// useScanSession hook maintains:
{
  session: {
    sessionId:       "SS-2026-0618-001",
    dispatchId:      "TCT-0019",
    status:          "active",
    expectedBarcodes:["HU0012301", ...],
    scannedBarcodes: ["HU0012301", ...],
    scanEvents:      [...],
    duplicates:      [...],
    wrongDispatches: [...],
    tamperFlags:     [...],
  },
  progress: {
    expected:  42,
    scanned:   28,
    valid:     26,
    duplicate: 2,
    wrong:     0,
    tamper:    0,
    pct:       66.67,
    complete:  false,
  },
  lastScanResult: {
    barcode: "HU0012326",
    result:  "valid",
    scannedAt: "2026-06-18T14:41:58Z",
  },
}

// HUValidator.validateScan(barcode, dispatchId, scannedList) returns:
{
  barcode:      "HU0012326",
  result:       "valid",          // valid / duplicate / wrong-dispatch / unknown / tamper
  dispatchMatch:true,
  isDuplicate:  false,
  correctDispatchId: null,
  registryEntry: { /* HURegistry record */ },
}
```

### 14.3 Reconciliation Result ← HUReconciler

```javascript
// HUReconciler.reconcile(dispatchId, scannedBarcodes)
{
  dispatchId:   "TCT-0019",
  sessionId:    "SS-2026-0618-001",
  status:       "complete",
  reconciledAt: "2026-06-18T14:55:00Z",
  operator:     "USR-003",
  expected:     ["HU0012301", ..., "HU0012342"],
  received:     ["HU0012301", ..., "HU0012340"],
  missing:      ["HU0012341", "HU0012342"],
  excess:       ["HU0015441"],
  duplicates:   ["HU0012318"],
  receivedCount:40,
  missingCount: 2,
  excessCount:  1,
  matchPct:     95.24,
  exceptions: [
    { id:"EXC-0099", type:"hu-shortage", severity:"high", huBarcodes:["HU0012341","HU0012342"] },
    { id:"EXC-0100", type:"hu-excess",   severity:"medium", huBarcodes:["HU0015441"] },
  ],
}
```

### 14.4 Missing HU Investigation ← HURegistry + ExceptionManager

```javascript
// HURegistry.getCustody("HU0012341")
{
  barcode:       "HU0012341",
  dispatchId:    "TCT-0019",
  status:        "missing",
  registeredAt:  "2026-06-17T22:30:00Z",
  loadedAt:      "2026-06-18T08:10:00Z",
  dispatchedAt:  "2026-06-18T08:14:00Z",
  receivedAt:    null,
  investigationStatus: "missing",
  investigationLog: [],
  custodyOwner:  "BlueDart / MH-01-AX-2341",
}

// Missing investigation resolution:
{
  barcode:      "HU0012341",
  dispatchId:   "TCT-0019",
  rootCause:    "loading-error",
  actionTaken:  "HU found still in vehicle rear section after full unload",
  outcome:      "located",
  foundAt:      "Vehicle rear — dock 3",
  carrierFault: false,
  penalty:      0,
  resolvedBy:   "USR-003",
  resolvedAt:   "2026-06-18T15:30:00Z",
}
```

### 14.5 Excess HU Resolution ← HUReconciler + HURegistry

```javascript
// Excess resolution:
{
  barcode:      "HU0015441",
  dispatchId:   "TCT-0019",    // dispatch where excess was found
  resolution:   "transfer",
  transferToDispatchId: "TCT-0031",
  note:         "Wrong-dispatch scan — same vehicle, different manifest",
  resolvedBy:   "USR-003",
  resolvedAt:   "2026-06-18T15:00:00Z",
}

// After transfer:
// HURegistry("HU0015441").dispatchId = "TCT-0031"
// HURegistry("HU0015441").receivedAt = "2026-06-18T15:00:00Z"
// TCT-0031 missing count -1
// TCT-0019 excess count -1
// Both exceptions check → if resolved, auto-close
```

---

*Document ends.*

---

**UI PHASE 5 COMPLETE**
