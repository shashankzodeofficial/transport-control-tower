/**
 * TRANSPORT CONTROL TOWER — STEP 2: DISPATCH LIFECYCLE ENGINE
 * =============================================================
 * Depends on: step1-data-model.js (window.TCT must be loaded first)
 *
 * Responsibilities:
 *  1. State machine — valid transitions for 8-stage lifecycle
 *  2. Transition validation — entry/exit criteria per status
 *  3. Audit logging — every state change captured
 *  4. Event generation — pub/sub hooks for UI and exception engine
 *  5. SLA clock — start/stop/pause logic per dispatch
 *  6. OTD / OTA calculation engine
 *  7. Exception trigger hooks — auto-raise on rule match
 *  8. Status history tracking
 */

'use strict';

/* ─────────────────────────────────────────────────────
   GUARD: Ensure Step 1 is loaded
───────────────────────────────────────────────────── */
if (!window.TCT || !window.TCT.DAL) {
  throw new Error('[TCT Step 2] step1-data-model.js must be loaded first.');
}

const { DAL, KEYS, DB, DISPATCH_STATUSES, STATUS_LABELS } = window.TCT;

/* ═══════════════════════════════════════════════════
   1. STATE MACHINE — TRANSITION MAP
   ═══════════════════════════════════════════════════
   Key   = current status
   Value = array of statuses this dispatch CAN move TO
   ─────────────────────────────────────────────────── */
const TRANSITION_MAP = {
  'planned':    ['ready', 'closed'],          // Can be cancelled (→ closed)
  'ready':      ['dispatched', 'planned'],    // Can revert to planned
  'dispatched': ['in-transit', 'ready'],      // Can revert if not yet moving
  'in-transit': ['arrived'],                  // One-way from here
  'arrived':    ['unloading'],
  'unloading':  ['reconciled'],
  'reconciled': ['closed'],
  'closed':     [],                           // Terminal state
};

/* ─────────────────────────────────────────────────────
   STATUS METADATA — entry actions, clocks, SLA impact
───────────────────────────────────────────────────── */
const STATUS_META = {
  planned: {
    label:       'Planned',
    color:       'neutral',
    slaClockAction: null,
    custodyEvent:   'planned',
    description: 'Dispatch created and scheduled. Awaiting vehicle loading.',
  },
  ready: {
    label:       'Ready',
    color:       'info',
    slaClockAction: null,
    custodyEvent:   'loaded',
    description: 'Vehicle loaded, sealed, and ready for departure.',
  },
  dispatched: {
    label:       'Dispatched',
    color:       'accent',
    slaClockAction: 'start-otd',   // Triggers OTD calculation
    custodyEvent:   'dispatched',
    description: 'Departed from origin. Awaiting GPS ping / driver confirmation.',
  },
  'in-transit': {
    label:       'In Transit',
    color:       'warning',
    slaClockAction: 'start-sla',   // SLA clock starts when vehicle is moving
    custodyEvent:   'in-transit',
    description: 'Vehicle confirmed moving towards destination.',
  },
  arrived: {
    label:       'Arrived',
    color:       'info',
    slaClockAction: 'stop-sla',    // SLA clock stops on arrival
    custodyEvent:   'arrived',
    description: 'Vehicle arrived at destination gate. Awaiting dock allocation.',
  },
  unloading: {
    label:       'Unloading',
    color:       'warning',
    slaClockAction: null,
    custodyEvent:   'unloaded',
    description: 'Vehicle docked. Receiving checks done. Unloading in progress.',
  },
  reconciled: {
    label:       'Reconciled',
    color:       'success',
    slaClockAction: null,
    custodyEvent:   'received',
    description: 'HU reconciliation complete. Discrepancies (if any) logged.',
  },
  closed: {
    label:       'Closed',
    color:       'neutral',
    slaClockAction: null,
    custodyEvent:   'closed',
    description: 'Dispatch fully closed. All exceptions resolved or acknowledged.',
  },
};

/* ═══════════════════════════════════════════════════
   2. TRANSITION VALIDATION RULES
   ═══════════════════════════════════════════════════
   Each rule is a function(dispatch) → { valid: bool, reason: string }
   Rules are checked BEFORE the transition executes.
───────────────────────────────────────────────────── */
const TRANSITION_RULES = {

  /* planned → ready */
  'planned→ready': [
    {
      id: 'R-PR-01',
      description: 'Vehicle must be assigned',
      check: d => ({ valid: !!d.vehicleId, reason: 'No vehicle assigned to dispatch.' }),
    },
    {
      id: 'R-PR-02',
      description: 'Carrier must be assigned',
      check: d => ({ valid: !!d.carrierId, reason: 'No carrier assigned to dispatch.' }),
    },
    {
      id: 'R-PR-03',
      description: 'At least one HU must be loaded',
      check: d => ({ valid: d.huDispatched && d.huDispatched.length > 0, reason: 'No Handling Units added to dispatch.' }),
    },
    {
      id: 'R-PR-04',
      description: 'Seal number must be entered',
      check: d => ({ valid: !!d.sealNo && d.sealNo.trim() !== '', reason: 'Seal number is required before marking Ready.' }),
    },
    {
      id: 'R-PR-05',
      description: 'ASN must be present',
      check: d => ({ valid: !!d.asn && d.asn.trim() !== '', reason: 'ASN number is required.' }),
    },
    {
      id: 'R-PR-06',
      description: 'Invoice must be present',
      check: d => ({ valid: !!d.invoice && d.invoice.trim() !== '', reason: 'Invoice number is required.' }),
    },
  ],

  /* ready → dispatched */
  'ready→dispatched': [
    {
      id: 'R-RD-01',
      description: 'Gate pass must be issued',
      check: d => ({ valid: !!d.gatepass && d.gatepass.trim() !== '', reason: 'Gate pass number is required for departure.' }),
    },
    {
      id: 'R-RD-02',
      description: 'Planned departure must be set',
      check: d => ({ valid: !!d.plannedDeparture, reason: 'Planned departure time is not set.' }),
    },
    {
      id: 'R-RD-03',
      description: 'Driver details must be present',
      check: d => ({ valid: !!d.driverName && d.driverName.trim() !== '', reason: 'Driver name is required.' }),
    },
  ],

  /* dispatched → in-transit */
  'dispatched→in-transit': [
    {
      id: 'R-DI-01',
      description: 'Actual departure time must be recorded',
      check: d => ({ valid: !!d.actualDeparture, reason: 'Actual departure time must be recorded before marking In Transit.' }),
    },
  ],

  /* in-transit → arrived */
  'in-transit→arrived': [
    {
      id: 'R-IA-01',
      description: 'Actual arrival time must be provided',
      check: d => ({ valid: !!d.actualArrival, reason: 'Actual arrival time must be recorded.' }),
    },
    {
      id: 'R-IA-02',
      description: 'Arrival must be after departure',
      check: d => {
        if (!d.actualArrival || !d.actualDeparture) return { valid: true, reason: '' };
        const valid = new Date(d.actualArrival) > new Date(d.actualDeparture);
        return { valid, reason: 'Actual arrival cannot be before actual departure.' };
      },
    },
  ],

  /* arrived → unloading */
  'arrived→unloading': [
    {
      id: 'R-AU-01',
      description: 'Vehicle verification must be completed',
      check: d => ({
        valid: d.receivingData?.vehicleVerified === true,
        reason: 'Vehicle registration verification is required.',
      }),
    },
    {
      id: 'R-AU-02',
      description: 'Seal verification must be completed',
      check: d => ({
        valid: d.receivingData?.sealVerified === true,
        reason: 'Seal verification (pass or fail) must be recorded.',
      }),
    },
    {
      id: 'R-AU-03',
      description: 'Invoice must be verified',
      check: d => ({
        valid: d.receivingData?.invoiceVerified === true,
        reason: 'Invoice verification is required before unloading.',
      }),
    },
    {
      id: 'R-AU-04',
      description: 'ASN must be verified',
      check: d => ({
        valid: d.receivingData?.asnVerified === true,
        reason: 'ASN verification is required before unloading.',
      }),
    },
  ],

  /* unloading → reconciled */
  'unloading→reconciled': [
    {
      id: 'R-UR-01',
      description: 'HU reconciliation must have been attempted',
      check: d => ({
        valid: d.huReceived !== null && Array.isArray(d.huReceived),
        reason: 'HU scan at destination has not been initiated.',
      }),
    },
    {
      id: 'R-UR-02',
      description: 'Reconciliation status must be set',
      check: d => ({
        valid: ['matched', 'discrepancy'].includes(d.reconciliationStatus),
        reason: 'Run the HU reconciliation engine before closing unloading.',
      }),
    },
  ],

  /* reconciled → closed */
  'reconciled→closed': [
    {
      id: 'R-RC-01',
      description: 'No critical open exceptions',
      check: d => {
        const openCritical = (d.exceptionIds || [])
          .map(id => DAL.exceptions.getById(id))
          .filter(e => e && e.severity === 'critical' && !['resolved','closed'].includes(e.status));
        return {
          valid: openCritical.length === 0,
          reason: `Cannot close: ${openCritical.length} critical exception(s) still open.`,
        };
      },
    },
  ],

  /* planned → closed (cancellation) */
  'planned→closed': [
    {
      id: 'R-PC-01',
      description: 'Only planned dispatches can be cancelled directly',
      check: d => ({ valid: d.status === 'planned', reason: 'Direct cancellation only allowed for planned dispatches.' }),
    },
  ],

  /* ready → planned (revert) */
  'ready→planned': [],   // No validation — always allowed to revert to planned

  /* dispatched → ready (revert) */
  'dispatched→ready': [
    {
      id: 'R-DR-01',
      description: 'Cannot revert once actual departure is recorded',
      check: d => ({
        valid: !d.actualDeparture,
        reason: 'Actual departure already recorded. Cannot revert to Ready.',
      }),
    },
  ],
};

/* ═══════════════════════════════════════════════════
   3. AUDIT LOGGING FRAMEWORK
───────────────────────────────────────────────────── */
const AuditLogger = {
  /**
   * Append an audit event to both the dispatch's local auditLog
   * and the global audit log table.
   */
  log(dispatchId, action, user, role, oldValue, newValue, note = '', sessionId = 'SYSTEM') {
    const event = {
      id:         `AL-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      entityType: 'dispatch',
      entityId:   dispatchId,
      action,
      user,
      role,
      oldValue,
      newValue,
      note,
      timestamp:  new Date().toISOString(),
      sessionId,
    };

    /* Append to global audit log */
    DAL.auditLog.append(event);

    /* Append to dispatch's own auditLog array */
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (dispatch) {
      dispatch.auditLog = dispatch.auditLog || [];
      dispatch.auditLog.push(event);
      DAL.dispatches.save(dispatch);
    }

    return event;
  },

  logException(exceptionId, action, user, role, oldValue, newValue, note = '') {
    const event = {
      id:         `AL-EX-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      entityType: 'exception',
      entityId:   exceptionId,
      action,
      user,
      role,
      oldValue,
      newValue,
      note,
      timestamp:  new Date().toISOString(),
      sessionId:  'SYSTEM',
    };
    DAL.auditLog.append(event);
    return event;
  },
};

/* ═══════════════════════════════════════════════════
   4. EVENT FRAMEWORK (pub/sub)
───────────────────────────────────────────────────── */
const EventBus = {
  _handlers: {},

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {function} handler  fn(payload)
   */
  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
  },

  /**
   * Unsubscribe from an event.
   */
  off(event, handler) {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter(h => h !== handler);
  },

  /**
   * Emit an event to all subscribers.
   * @param {string} event
   * @param {object} payload
   */
  emit(event, payload) {
    (this._handlers[event] || []).forEach(h => {
      try { h(payload); }
      catch (err) { console.error(`[EventBus] Handler error for "${event}":`, err); }
    });
    /* Always emit wildcard */
    (this._handlers['*'] || []).forEach(h => {
      try { h({ event, ...payload }); }
      catch (err) { console.error(`[EventBus] Wildcard handler error:`, err); }
    });
  },
};

/* Standard events emitted by the lifecycle engine */
const EVENTS = {
  STATUS_CHANGED:        'dispatch:status_changed',
  DISPATCH_CREATED:      'dispatch:created',
  DISPATCH_CLOSED:       'dispatch:closed',
  DISPATCH_CANCELLED:    'dispatch:cancelled',
  DEPARTURE_RECORDED:    'dispatch:departure_recorded',
  ARRIVAL_RECORDED:      'dispatch:arrival_recorded',
  OTD_CALCULATED:        'dispatch:otd_calculated',
  OTA_CALCULATED:        'dispatch:ota_calculated',
  SLA_AT_RISK:           'dispatch:sla_at_risk',
  SLA_BREACHED:          'dispatch:sla_breached',
  EXCEPTION_TRIGGERED:   'dispatch:exception_triggered',
  CUSTODY_UPDATED:       'dispatch:custody_updated',
  VALIDATION_FAILED:     'dispatch:validation_failed',
};

/* ═══════════════════════════════════════════════════
   5. SLA CLOCK ENGINE
───────────────────────────────────────────────────── */
const SLAClock = {
  /**
   * Check if dispatch is currently at SLA risk.
   * Risk = planned arrival within `slaBreachAlertHrs` and not yet arrived.
   * @returns {object} { atRisk, breached, hoursRemaining, hoursOverdue }
   */
  check(dispatch) {
    const now        = new Date();
    const planned    = dispatch.plannedArrival ? new Date(dispatch.plannedArrival) : null;
    const sla        = DAL.slaConfig.forRoute(dispatch.routeId);
    const alertHrs   = sla?.slaBreachAlertHrs || 4;

    if (!planned) return { atRisk: false, breached: false, hoursRemaining: null, hoursOverdue: null };

    const diffMs          = planned - now;
    const diffHrs         = diffMs / 3600000;
    const isTerminal      = ['arrived','unloading','reconciled','closed'].includes(dispatch.status);
    const breached        = !isTerminal && diffHrs < 0;
    const atRisk          = !isTerminal && !breached && diffHrs <= alertHrs;
    const hoursRemaining  = breached ? null : Math.round(diffHrs * 10) / 10;
    const hoursOverdue    = breached ? Math.round(Math.abs(diffHrs) * 10) / 10 : null;

    return { atRisk, breached, hoursRemaining, hoursOverdue, plannedArrival: planned.toISOString() };
  },

  /**
   * Calculate elapsed transit time in hours.
   */
  elapsedTransitHours(dispatch) {
    if (!dispatch.actualDeparture) return null;
    const start = new Date(dispatch.actualDeparture);
    const end   = dispatch.actualArrival ? new Date(dispatch.actualArrival) : new Date();
    return Math.round((end - start) / 360000) / 10;   // 1dp
  },

  /**
   * Calculate % of SLA window consumed.
   */
  slaConsumptionPct(dispatch) {
    if (!dispatch.actualDeparture || !dispatch.plannedArrival) return null;
    const start    = new Date(dispatch.actualDeparture);
    const slaEnd   = new Date(dispatch.plannedArrival);
    const now      = dispatch.actualArrival ? new Date(dispatch.actualArrival) : new Date();
    const total    = slaEnd - start;
    const consumed = now - start;
    if (total <= 0) return 100;
    return Math.min(100, Math.round((consumed / total) * 100));
  },
};

/* ═══════════════════════════════════════════════════
   6. OTD / OTA CALCULATION ENGINE
───────────────────────────════════════════════════ */
const KPIEngine = {
  /**
   * Calculate On-Time Departure status.
   * Requires: dispatch.plannedDeparture + dispatch.actualDeparture
   * Tolerance sourced from SLA config (default 30 min).
   *
   * @returns {{ status: string, varianceMin: number, toleranceMin: number }}
   *   status: 'on-time' | 'delayed' | 'early' | 'pending'
   */
  calculateOTD(dispatch) {
    if (!dispatch.actualDeparture || !dispatch.plannedDeparture) {
      return { status: 'pending', varianceMin: null, toleranceMin: null };
    }

    const planned      = new Date(dispatch.plannedDeparture);
    const actual       = new Date(dispatch.actualDeparture);
    const varianceMin  = Math.round((actual - planned) / 60000);   // +ve = late
    const sla          = DAL.slaConfig.forRoute(dispatch.routeId);
    const toleranceMin = sla?.otdToleranceMin ?? 30;

    let status;
    if (varianceMin < -10)              status = 'early';
    else if (varianceMin <= toleranceMin) status = 'on-time';
    else                                  status = 'delayed';

    return { status, varianceMin, toleranceMin };
  },

  /**
   * Calculate On-Time Arrival status.
   * Requires: dispatch.plannedArrival + dispatch.actualArrival
   * Tolerance sourced from SLA config (default 60 min).
   */
  calculateOTA(dispatch) {
    if (!dispatch.actualArrival || !dispatch.plannedArrival) {
      return { status: 'pending', varianceMin: null, toleranceMin: null };
    }

    const planned      = new Date(dispatch.plannedArrival);
    const actual       = new Date(dispatch.actualArrival);
    const varianceMin  = Math.round((actual - planned) / 60000);
    const sla          = DAL.slaConfig.forRoute(dispatch.routeId);
    const toleranceMin = sla?.otaToleranceMin ?? 60;

    let status;
    if (varianceMin < -30)               status = 'early';
    else if (varianceMin <= toleranceMin) status = 'on-time';
    else                                  status = 'delayed';

    return { status, varianceMin, toleranceMin };
  },

  /**
   * Compute aggregate OTD% and OTA% for a list of dispatches.
   */
  aggregateKPIs(dispatches = []) {
    const withDep   = dispatches.filter(d => d.actualDeparture);
    const withArr   = dispatches.filter(d => d.actualArrival);
    const otdOnTime = withDep.filter(d => d.otdStatus === 'on-time').length;
    const otaOnTime = withArr.filter(d => d.otaStatus === 'on-time').length;

    const slaChecks = dispatches.map(d => SLAClock.check(d));
    const atRisk    = slaChecks.filter(c => c.atRisk).length;
    const breached  = slaChecks.filter(c => c.breached).length;

    const exceptions = DAL.exceptions.getAll();
    const openExc    = exceptions.filter(e => !['resolved','closed'].includes(e.status));

    const reconciled = dispatches.filter(d => ['reconciled','closed'].includes(d.status));
    const matched    = reconciled.filter(d => d.reconciliationStatus === 'matched').length;
    const recoRate   = reconciled.length ? Math.round(matched / reconciled.length * 100) : 100;

    return {
      total:            dispatches.length,
      active:           dispatches.filter(d => !['closed'].includes(d.status)).length,
      byStatus:         DISPATCH_STATUSES.reduce((acc, s) => {
                          acc[s] = dispatches.filter(d => d.status === s).length;
                          return acc;
                        }, {}),
      otd: {
        measured:       withDep.length,
        onTime:         otdOnTime,
        rate:           withDep.length ? Math.round(otdOnTime / withDep.length * 100) : null,
      },
      ota: {
        measured:       withArr.length,
        onTime:         otaOnTime,
        rate:           withArr.length ? Math.round(otaOnTime / withArr.length * 100) : null,
      },
      sla: {
        atRisk,
        breached,
        clear:          dispatches.length - atRisk - breached,
      },
      exceptions: {
        total:          exceptions.length,
        open:           openExc.length,
        critical:       openExc.filter(e => e.severity === 'critical').length,
        escalated:      openExc.filter(e => e.escalationLevel > 0).length,
        bySeverity: {
          low:          openExc.filter(e => e.severity === 'low').length,
          medium:       openExc.filter(e => e.severity === 'medium').length,
          high:         openExc.filter(e => e.severity === 'high').length,
          critical:     openExc.filter(e => e.severity === 'critical').length,
        },
      },
      reconciliation: {
        total:          reconciled.length,
        matched,
        discrepancy:    reconciled.length - matched,
        rate:           recoRate,
      },
    };
  },

  /**
   * Carrier-level performance aggregation.
   */
  carrierKPIs(carrierId) {
    const all     = DAL.dispatches.getAll().filter(d => d.carrierId === carrierId);
    const withDep = all.filter(d => d.actualDeparture);
    const withArr = all.filter(d => d.actualArrival);
    const excIds  = [...new Set(all.flatMap(d => d.exceptionIds || []))];
    const excs    = excIds.map(id => DAL.exceptions.getById(id)).filter(Boolean);

    return {
      carrierId,
      totalDispatches: all.length,
      otdRate: withDep.length ? Math.round(all.filter(d => d.otdStatus === 'on-time').length / withDep.length * 100) : null,
      otaRate: withArr.length ? Math.round(all.filter(d => d.otaStatus === 'on-time').length / withArr.length * 100) : null,
      exceptionCount:  excs.length,
      exceptionRate:   all.length ? Math.round(excs.length / all.length * 100) : 0,
      shortageCount:   excs.filter(e => e.type === 'shortage').length,
      criticalCount:   excs.filter(e => e.severity === 'critical').length,
      avgTransitHrs:   (() => {
        const timed = all.filter(d => d.actualDeparture && d.actualArrival);
        if (!timed.length) return null;
        const avg = timed.reduce((s, d) => {
          return s + (new Date(d.actualArrival) - new Date(d.actualDeparture)) / 3600000;
        }, 0) / timed.length;
        return Math.round(avg * 10) / 10;
      })(),
    };
  },

  /**
   * Route-level performance aggregation.
   */
  routeKPIs(routeId) {
    const all     = DAL.dispatches.getAll().filter(d => d.routeId === routeId);
    const withArr = all.filter(d => d.actualArrival);
    const route   = DAL.routes.getById(routeId);

    return {
      routeId,
      routeCode:       route?.code,
      totalDispatches: all.length,
      otdRate:         (() => { const w = all.filter(d => d.actualDeparture); return w.length ? Math.round(w.filter(d => d.otdStatus === 'on-time').length / w.length * 100) : null; })(),
      otaRate:         (() => { return withArr.length ? Math.round(all.filter(d => d.otaStatus === 'on-time').length / withArr.length * 100) : null; })(),
      avgTransitHrs:   (() => {
        const t = all.filter(d => d.actualDeparture && d.actualArrival);
        if (!t.length) return null;
        return Math.round(t.reduce((s,d) => s+(new Date(d.actualArrival)-new Date(d.actualDeparture))/3600000, 0) / t.length * 10) / 10;
      })(),
      plannedTransitHrs: route ? route.slaHours : null,
      exceptionCount:  [...new Set(all.flatMap(d => d.exceptionIds||[]))].length,
      recoRate:        (() => {
        const r = all.filter(d => ['reconciled','closed'].includes(d.status));
        return r.length ? Math.round(r.filter(d => d.reconciliationStatus === 'matched').length / r.length * 100) : null;
      })(),
      slaBreaches:     all.filter(d => d.otaStatus === 'delayed').length,
    };
  },
};

/* ═══════════════════════════════════════════════════
   7. EXCEPTION TRIGGER HOOKS
───────────────────────────────────────────────────── */
const ExceptionHooks = {
  /**
   * After a status transition, evaluate rules and auto-raise exceptions.
   * @param {object} dispatch  - Updated dispatch object
   * @param {string} newStatus
   * @param {string} actor     - User performing the action
   */
  evaluate(dispatch, newStatus, actor = 'System') {
    const raised = [];

    /* Hook: OTD delay > 30 min */
    if (newStatus === 'in-transit' && dispatch.otdVarianceMin > 30) {
      const severity  = dispatch.otdVarianceMin > 240 ? 'high' : 'medium';
      const codeId    = dispatch.otdVarianceMin > 240 ? 'EC002' : 'EC001';
      const exc = this._raise(dispatch, codeId, severity, actor,
        `Vehicle departed ${dispatch.otdVarianceMin} min late`,
        `OTD variance: ${dispatch.otdVarianceMin} minutes`,
        Math.round(dispatch.otdVarianceMin / 60 * 10) / 10);
      if (exc) raised.push(exc);
    }

    /* Hook: OTA delay (past plannedArrival while in-transit) */
    if (newStatus === 'in-transit' && dispatch.otaVarianceMin !== null && dispatch.otaVarianceMin > 60) {
      const exc = this._raise(dispatch, 'EC003', 'high', actor,
        `Arrival delayed — ${dispatch.otaVarianceMin} min overdue`,
        `Planned arrival exceeded by ${dispatch.otaVarianceMin} minutes`,
        Math.round(dispatch.otaVarianceMin / 60 * 10) / 10);
      if (exc) raised.push(exc);
    }

    /* Hook: Seal mismatch at unloading */
    if (newStatus === 'unloading' && dispatch.receivingData?.sealMatch === false) {
      const exc = this._raise(dispatch, 'EC007', 'critical', actor,
        `SEAL MISMATCH DETECTED — Expected: ${dispatch.sealNo}, Received: ${dispatch.receivingData.sealReceived}`,
        `Seal number at destination does not match origin manifest. Tamper risk flagged.`,
        8, dispatch.huDispatched);
      if (exc) raised.push(exc);

      /* If seal mismatch + HUs missing → theft risk */
      if (dispatch.huMissing && dispatch.huMissing.length > 0) {
        const exc2 = this._raise(dispatch, 'EC009', 'critical', actor,
          `THEFT RISK: Seal mismatch + ${dispatch.huMissing.length} missing HU(s)`,
          `Combined seal tampering and shortage detected.`, 12, dispatch.huMissing);
        if (exc2) raised.push(exc2);
      }
    }

    /* Hook: Missing HUs after reconciliation */
    if (newStatus === 'reconciled' && dispatch.huMissing && dispatch.huMissing.length > 0) {
      const exc = this._raise(dispatch, 'EC005', 'high', actor,
        `${dispatch.huMissing.length} HU(s) not received at destination`,
        `HU barcodes dispatched but not scanned at destination: ${dispatch.huMissing.join(', ')}`,
        0, dispatch.huMissing);
      if (exc) raised.push(exc);
    }

    /* Hook: Excess HUs after reconciliation */
    if (newStatus === 'reconciled' && dispatch.huExcess && dispatch.huExcess.length > 0) {
      const exc = this._raise(dispatch, 'EC006', 'medium', actor,
        `${dispatch.huExcess.length} unmanifested HU(s) received`,
        `HU barcodes received but not in dispatch manifest: ${dispatch.huExcess.join(', ')}`,
        2, dispatch.huExcess);
      if (exc) raised.push(exc);
    }

    /* Hook: SLA breach on arrival */
    if (newStatus === 'arrived' && dispatch.otaVarianceMin > (dispatch.slaHours * 60)) {
      const exc = this._raise(dispatch, 'EC004', 'critical', actor,
        `SLA BREACH — Arrived ${Math.round(dispatch.otaVarianceMin/60)}h past SLA window`,
        `Dispatch SLA was ${dispatch.slaHours}h. Actual exceeded by ${Math.round(dispatch.otaVarianceMin/60)}h.`,
        Math.round(dispatch.otaVarianceMin / 60));
      if (exc) raised.push(exc);
    }

    return raised;
  },

  /**
   * Internal: create and persist an exception record.
   */
  _raise(dispatch, codeId, severity, actor, title, description, slaImpactHrs = 0, huAffected = []) {
    /* Prevent duplicate: same type + dispatch + open */
    const existing = DAL.exceptions.getAll().find(e =>
      e.dispatchId === dispatch.id && e.codeId === codeId &&
      !['resolved','closed'].includes(e.status));
    if (existing) return null;

    const code   = DAL.exceptionCodes.getById(codeId);
    const excId  = `EXC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;

    /* Infer suggested cause */
    const { suggestedCause, confidence } = this._inferCause(dispatch, code?.type || 'delay');

    const exc = {
      id:              excId,
      codeId,
      code:            code?.code || codeId,
      dispatchId:      dispatch.id,
      routeId:         dispatch.routeId,
      type:            code?.type || 'delay',
      subType:         code?.subType || '',
      severity,
      title,
      description,
      autoClassified:  'yes',
      suggestedCause,
      causeConfidence: confidence,
      rootCause:       null,
      slaImpactHrs,
      status:          'open',
      owner:           code?.defaultOwner || 'ops',
      escalationLevel: 0,
      raisedBy:        actor,
      raisedAt:        new Date().toISOString(),
      acknowledgedBy:  null,
      acknowledgedAt:  null,
      resolvedBy:      null,
      resolvedAt:      null,
      resolution:      null,
      huAffected:      huAffected || [],
      auditLog:        [],
    };

    DAL.exceptions.save(exc);

    /* Link exception back to dispatch */
    const d = DAL.dispatches.getById(dispatch.id);
    if (d) {
      d.exceptionIds = d.exceptionIds || [];
      if (!d.exceptionIds.includes(excId)) d.exceptionIds.push(excId);
      DAL.dispatches.save(d);
    }

    AuditLogger.log(dispatch.id, 'EXCEPTION_RAISED', actor, 'system',
      null, excId, `Auto-raised: ${title}`);

    EventBus.emit(EVENTS.EXCEPTION_TRIGGERED, { dispatch, exception: exc });

    return exc;
  },

  /**
   * Rule-based cause inference (smart classification).
   * Returns { suggestedCause: string, confidence: number }
   */
  _inferCause(dispatch, type) {
    const otdVariance = dispatch.otdVarianceMin || 0;
    const carrier     = DAL.carriers.getById(dispatch.carrierId);
    const carrierOTD  = carrier?.otdRate || 85;

    if (type === 'seal-mismatch') {
      return { suggestedCause: 'carrier-delay', confidence: 91 };
    }
    if (type === 'theft-risk') {
      return { suggestedCause: 'carrier-delay', confidence: 85 };
    }
    if (type === 'delay') {
      /* Low carrier OTD rate → likely carrier-delay */
      if (carrierOTD < 80) return { suggestedCause: 'carrier-delay', confidence: 82 };
      /* Large OTD variance → carrier */
      if (otdVariance > 180) return { suggestedCause: 'carrier-delay', confidence: 75 };
      /* Small variance → warehouse delay more likely */
      if (otdVariance < 60) return { suggestedCause: 'warehouse-delay', confidence: 65 };
      return { suggestedCause: 'carrier-delay', confidence: 60 };
    }
    if (type === 'shortage') {
      return { suggestedCause: 'carrier-delay', confidence: 70 };
    }
    return { suggestedCause: 'unknown', confidence: 40 };
  },
};

/* ═══════════════════════════════════════════════════
   8. STATUS HISTORY TRACKER
───────────────────────────────────────────────────── */
const StatusHistory = {
  /**
   * Record a status change in the dispatch's custody trail.
   */
  record(dispatch, newStatus, user, role, note = '', locationId = null, deviceId = 'WEB') {
    const custodyEvent = {
      event:      STATUS_META[newStatus]?.custodyEvent || newStatus,
      user,
      role,
      locationId: locationId || (newStatus === 'arrived' || newStatus === 'unloading' || newStatus === 'reconciled'
        ? dispatch.destId
        : dispatch.originId),
      timestamp:  new Date().toISOString(),
      note,
      deviceId,
    };

    dispatch.custody = dispatch.custody || [];
    dispatch.custody.push(custodyEvent);
    return custodyEvent;
  },

  /**
   * Get all status changes for a dispatch in chronological order.
   */
  getTimeline(dispatchId) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return [];
    return (dispatch.auditLog || [])
      .filter(e => e.action === 'STATUS_CHANGED')
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
};

/* ═══════════════════════════════════════════════════
   9. MAIN LIFECYCLE ENGINE
───────────────────────────────────────────────────── */
const LifecycleEngine = {

  /**
   * Validate a proposed transition.
   * @param {object} dispatch
   * @param {string} toStatus
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(dispatch, toStatus) {
    const fromStatus = dispatch.status;
    const errors     = [];

    /* 1. Check transition is defined */
    const allowed = TRANSITION_MAP[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      return {
        valid:  false,
        errors: [`Transition from "${STATUS_LABELS[fromStatus]}" to "${STATUS_LABELS[toStatus]}" is not permitted.`],
      };
    }

    /* 2. Run field-level validation rules */
    const ruleKey = `${fromStatus}→${toStatus}`;
    const rules   = TRANSITION_RULES[ruleKey] || [];
    rules.forEach(rule => {
      const result = rule.check(dispatch);
      if (!result.valid) errors.push(`[${rule.id}] ${result.reason}`);
    });

    return { valid: errors.length === 0, errors };
  },

  /**
   * Execute a status transition.
   *
   * @param {string} dispatchId
   * @param {string} toStatus
   * @param {object} options
   * @param {string} options.actor          - Username performing the action
   * @param {string} options.role           - Role of actor
   * @param {string} options.note           - Optional note
   * @param {string} options.sessionId
   * @param {object} options.payload        - Additional data for the transition
   *   For 'dispatched'/'in-transit': { actualDeparture: ISOString }
   *   For 'arrived':                 { actualArrival: ISOString }
   *   For 'unloading':               { receivingData: {...} }
   *   For 'reconciled':              { huReceived: [], huMissing: [], huExcess: [] }
   *
   * @returns {{ success: boolean, dispatch?: object, errors?: string[], exceptions?: object[] }}
   */
  transition(dispatchId, toStatus, options = {}) {
    const { actor = 'System', role = 'system', note = '', sessionId = 'SYSTEM', payload = {} } = options;

    /* Load dispatch */
    let dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return { success: false, errors: [`Dispatch ${dispatchId} not found.`] };

    const fromStatus = dispatch.status;

    /* Merge payload into dispatch before validation
       (so validators can see actualDeparture etc.) */
    const merged = { ...dispatch, ...this._extractPayloadFields(toStatus, payload) };

    /* Validate */
    const { valid, errors } = this.validate(merged, toStatus);
    if (!valid) {
      EventBus.emit(EVENTS.VALIDATION_FAILED, { dispatchId, toStatus, errors });
      return { success: false, errors };
    }

    /* ── Apply transition ── */
    dispatch = { ...dispatch, ...this._extractPayloadFields(toStatus, payload) };
    dispatch.status    = toStatus;
    dispatch.updatedAt = new Date().toISOString();

    /* OTD calculation when dispatching */
    if (['dispatched','in-transit'].includes(toStatus) && dispatch.actualDeparture) {
      const otd = KPIEngine.calculateOTD(dispatch);
      dispatch.otdStatus     = otd.status;
      dispatch.otdVarianceMin = otd.varianceMin;
      EventBus.emit(EVENTS.OTD_CALCULATED, { dispatch, otd });
    }

    /* OTA calculation when arrived */
    if (toStatus === 'arrived' && dispatch.actualArrival) {
      const ota = KPIEngine.calculateOTA(dispatch);
      dispatch.otaStatus     = ota.status;
      dispatch.otaVarianceMin = ota.varianceMin;
      EventBus.emit(EVENTS.OTA_CALCULATED, { dispatch, ota });
      EventBus.emit(EVENTS.ARRIVAL_RECORDED, { dispatch });
    }

    /* Reconciliation fields when reconciled */
    if (toStatus === 'reconciled') {
      dispatch.reconciledAt = new Date().toISOString();
      dispatch.reconciledBy = actor;
      if (!dispatch.reconciliationStatus || dispatch.reconciliationStatus === 'pending') {
        dispatch.reconciliationStatus = (dispatch.huMissing?.length || dispatch.huExcess?.length) ? 'discrepancy' : 'matched';
      }
    }

    /* Closed timestamp */
    if (toStatus === 'closed') {
      dispatch.closedAt = new Date().toISOString();
      dispatch.closedBy = actor;
    }

    /* Update status history */
    StatusHistory.record(dispatch, toStatus, actor, role, note);

    /* Persist */
    DAL.dispatches.save(dispatch);

    /* Audit log */
    AuditLogger.log(dispatchId, 'STATUS_CHANGED', actor, role,
      fromStatus, toStatus, note, sessionId);

    /* Emit event */
    EventBus.emit(EVENTS.STATUS_CHANGED, { dispatch, fromStatus, toStatus, actor });
    if (toStatus === 'closed')     EventBus.emit(EVENTS.DISPATCH_CLOSED,    { dispatch });
    if (toStatus === 'dispatched') EventBus.emit(EVENTS.DEPARTURE_RECORDED, { dispatch });

    /* Exception hooks */
    const raisedExceptions = ExceptionHooks.evaluate(dispatch, toStatus, actor);

    /* SLA risk check */
    const slaCheck = SLAClock.check(dispatch);
    if (slaCheck.breached) EventBus.emit(EVENTS.SLA_BREACHED, { dispatch, slaCheck });
    else if (slaCheck.atRisk) EventBus.emit(EVENTS.SLA_AT_RISK, { dispatch, slaCheck });

    return { success: true, dispatch, exceptions: raisedExceptions };
  },

  /**
   * Create a new dispatch from user input.
   * Sets status to 'planned' and seeds custody log.
   */
  createDispatch(data, actor = 'System', role = 'system', sessionId = 'SYSTEM') {
    const id = `DSP-${new Date().getFullYear()}-${String(DAL.dispatches.getAll().length + 1).padStart(4,'0')}`;

    /* Derive plannedArrival from schedule/route */
    let plannedArrival = data.plannedArrival;
    if (!plannedArrival && data.plannedDeparture && data.slaHours) {
      plannedArrival = new Date(new Date(data.plannedDeparture).getTime() + data.slaHours * 3600000).toISOString();
    }

    const now = new Date().toISOString();
    const dispatch = {
      id,
      scheduleId:           data.scheduleId || null,
      routeId:              data.routeId,
      routeCode:            data.routeCode,
      routeName:            data.routeName,
      originId:             data.originId,
      destId:               data.destId,
      carrierId:            data.carrierId,
      vehicleId:            data.vehicleId || null,
      vehicleReg:           data.vehicleReg || '',
      driverName:           data.driverName || '',
      driverPhone:          data.driverPhone || '',
      asn:                  data.asn || '',
      invoice:              data.invoice || '',
      gatepass:             data.gatepass || '',
      sealNo:               data.sealNo || '',
      plannedDeparture:     data.plannedDeparture || null,
      plannedArrival:       plannedArrival || null,
      actualDeparture:      null,
      actualArrival:        null,
      slaHours:             data.slaHours || 48,
      status:               'planned',
      otdStatus:            null,
      otaStatus:            null,
      otdVarianceMin:       null,
      otaVarianceMin:       null,
      huDispatched:         data.huDispatched || [],
      huReceived:           [],
      huMissing:            [],
      huExcess:             [],
      reconciliationStatus: 'pending',
      reconciliationNote:   '',
      reconciledAt:         null,
      reconciledBy:         null,
      receivingData:        null,
      exceptionIds:         [],
      totalWeightKg:        data.totalWeightKg || 0,
      totalCbm:             data.totalCbm || 0,
      notes:                data.notes || '',
      createdBy:            actor,
      createdAt:            now,
      updatedAt:            now,
      custody: [{
        event:      'planned',
        user:       actor,
        role,
        locationId: data.originId,
        timestamp:  now,
        note:       'Dispatch created',
        deviceId:   'WEB',
      }],
      auditLog: [],
    };

    DAL.dispatches.save(dispatch);
    AuditLogger.log(id, 'DISPATCH_CREATED', actor, role, null, 'planned', 'New dispatch', sessionId);
    EventBus.emit(EVENTS.DISPATCH_CREATED, { dispatch });

    return { success: true, dispatch };
  },

  /**
   * Helper: extract relevant fields from payload based on target status.
   */
  _extractPayloadFields(toStatus, payload) {
    const fields = {};
    if (!payload) return fields;

    /* Copy all scalar payload fields (except nested objects handled below) */
    const directFields = ['actualDeparture','actualArrival','notes','driverName','driverPhone',
                          'vehicleId','vehicleReg','carrierId','sealNo','gatepass',
                          'totalWeightKg','totalCbm'];
    directFields.forEach(f => { if (payload[f] !== undefined) fields[f] = payload[f]; });

    /* Structured payload */
    if (toStatus === 'unloading' && payload.receivingData) {
      fields.receivingData = payload.receivingData;
    }
    if (toStatus === 'reconciled') {
      if (payload.huReceived  !== undefined) fields.huReceived  = payload.huReceived;
      if (payload.huMissing   !== undefined) fields.huMissing   = payload.huMissing;
      if (payload.huExcess    !== undefined) fields.huExcess    = payload.huExcess;
      if (payload.reconciliationStatus !== undefined) fields.reconciliationStatus = payload.reconciliationStatus;
      if (payload.reconciliationNote   !== undefined) fields.reconciliationNote   = payload.reconciliationNote;
    }

    return fields;
  },

  /**
   * Check if a transition is allowed (without executing it).
   * @returns {string[]} List of allowed next statuses
   */
  allowedTransitions(dispatch) {
    return (TRANSITION_MAP[dispatch.status] || []).filter(toStatus => {
      const merged = { ...dispatch, ...this._extractPayloadFields(toStatus, {}) };
      /* Run only structural checks, not data-completeness checks */
      return TRANSITION_MAP[dispatch.status]?.includes(toStatus);
    });
  },

  /**
   * Bulk SLA risk scan — returns all dispatches at risk or breached.
   */
  scanSLARisks() {
    return DAL.dispatches.getAll()
      .filter(d => !['closed','reconciled'].includes(d.status))
      .map(d => ({ dispatch: d, sla: SLAClock.check(d) }))
      .filter(({ sla }) => sla.atRisk || sla.breached);
  },

  /**
   * Auto-escalate open exceptions that have exceeded time thresholds.
   * Should be called on a timer (e.g. every 30 min).
   */
  runEscalationCheck(actor = 'System') {
    const escalated = [];
    const exceptions = DAL.exceptions.getAll().filter(e => ['open','acknowledged','in-progress'].includes(e.status));
    const now = new Date();

    exceptions.forEach(exc => {
      const dispatch = DAL.dispatches.getById(exc.dispatchId);
      if (!dispatch) return;
      const sla       = DAL.slaConfig.forRoute(dispatch.routeId);
      if (!sla) return;
      const openHrs   = (now - new Date(exc.raisedAt)) / 3600000;
      let   newLevel  = exc.escalationLevel;

      if (openHrs >= sla.escalationL3Hrs && exc.escalationLevel < 3) newLevel = 3;
      else if (openHrs >= sla.escalationL2Hrs && exc.escalationLevel < 2) newLevel = 2;
      else if (openHrs >= sla.escalationL1Hrs && exc.escalationLevel < 1) newLevel = 1;

      if (newLevel > exc.escalationLevel) {
        exc.escalationLevel = newLevel;
        exc.status = 'escalated';
        DAL.exceptions.save(exc);
        AuditLogger.logException(exc.id, 'ESCALATED', actor, 'system',
          exc.escalationLevel, newLevel, `Auto-escalated to Level ${newLevel} (${sla[`escalationL${newLevel}Role`]})`);
        escalated.push(exc);
      }
    });

    return escalated;
  },
};

/* ═══════════════════════════════════════════════════
   EXPOSE TO WINDOW.TCT
═══════════════════════════════════════════════════ */
Object.assign(window.TCT, {
  LifecycleEngine,
  KPIEngine,
  SLAClock,
  ExceptionHooks,
  AuditLogger,
  EventBus,
  StatusHistory,
  EVENTS,
  TRANSITION_MAP,
  TRANSITION_RULES,
  STATUS_META,
});

console.log('[TCT Step 2] Dispatch Lifecycle Engine loaded.');
console.log('[TCT Step 2] Available: TCT.LifecycleEngine, TCT.KPIEngine, TCT.SLAClock, TCT.EventBus');
// → Next module: STEP 3 (await instruction)
