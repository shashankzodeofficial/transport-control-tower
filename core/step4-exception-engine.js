/**
 * TRANSPORT CONTROL TOWER — STEP 4: ENTERPRISE EXCEPTION MANAGEMENT ENGINE
 * =========================================================================
 * Depends on: step1, step2, step3
 *
 * Responsibilities:
 *  1. Exception framework — 5 entity types, 12 categories
 *  2. Auto-classification engine — Critical/High/Medium/Low
 *  3. Root cause inference engine with confidence scoring
 *  4. SLA impact engine — delay minutes, breach severity, business/customer impact
 *  5. Escalation workflow — 4-tier matrix (time + severity triggered)
 *  6. Resolution workflow — Open → Assigned → Investigating → Resolved → Closed
 *  7. Exception analytics — metrics, distributions, carrier scoring
 */

'use strict';

if (!window.TCT?.DAL || !window.TCT?.LifecycleEngine || !window.TCT?.SealValidator) {
  throw new Error('[TCT Step 4] Steps 1–3 must be loaded first.');
}

const { DAL, KEYS, DB, AuditLogger, EventBus, EVENTS, SLAClock, KPIEngine } = window.TCT;

/* ═══════════════════════════════════════════════════
   EXCEPTION TAXONOMY
═══════════════════════════════════════════════════ */

/**
 * All supported exception categories with classification metadata.
 * autoSeverity: default severity when auto-raised
 * autoOwner:    default responsible party
 * slaImpact:    multiplier for SLA impact calculation (hrs)
 * businessImpact: base business impact score (1-10)
 */
const EXCEPTION_TAXONOMY = {
  /* ── Delay exceptions ── */
  'departure-delay': {
    label: 'Departure Delay', entityType: 'dispatch', group: 'delay',
    autoSeverity: 'medium', autoOwner: 'carrier',
    slaImpact: 1.0, businessImpact: 5, customerImpact: 4,
    resolutionSLA: 4,   // hours to resolve
  },
  'arrival-delay': {
    label: 'Arrival Delay', entityType: 'dispatch', group: 'delay',
    autoSeverity: 'high', autoOwner: 'carrier',
    slaImpact: 1.5, businessImpact: 7, customerImpact: 7,
    resolutionSLA: 6,
  },
  'sla-breach': {
    label: 'SLA Breach', entityType: 'dispatch', group: 'delay',
    autoSeverity: 'critical', autoOwner: 'carrier',
    slaImpact: 2.0, businessImpact: 9, customerImpact: 9,
    resolutionSLA: 2,
  },
  'unloading-delay': {
    label: 'Unloading Delay', entityType: 'dispatch', group: 'delay',
    autoSeverity: 'medium', autoOwner: 'store',
    slaImpact: 0.5, businessImpact: 4, customerImpact: 3,
    resolutionSLA: 8,
  },

  /* ── HU exceptions ── */
  'missing-hu': {
    label: 'Missing HU', entityType: 'hu', group: 'shortage',
    autoSeverity: 'high', autoOwner: 'carrier',
    slaImpact: 0, businessImpact: 7, customerImpact: 8,
    resolutionSLA: 24,
  },
  'excess-hu': {
    label: 'Excess HU', entityType: 'hu', group: 'shortage',
    autoSeverity: 'medium', autoOwner: 'warehouse',
    slaImpact: 0, businessImpact: 5, customerImpact: 3,
    resolutionSLA: 12,
  },
  'damaged-hu': {
    label: 'Damaged HU', entityType: 'hu', group: 'damage',
    autoSeverity: 'high', autoOwner: 'carrier',
    slaImpact: 0, businessImpact: 6, customerImpact: 8,
    resolutionSLA: 48,
  },

  /* ── Security exceptions ── */
  'seal-mismatch': {
    label: 'Seal Mismatch', entityType: 'dispatch', group: 'security',
    autoSeverity: 'critical', autoOwner: 'carrier',
    slaImpact: 2.0, businessImpact: 10, customerImpact: 10,
    resolutionSLA: 1,
  },
  'theft-risk': {
    label: 'Theft Risk', entityType: 'dispatch', group: 'security',
    autoSeverity: 'critical', autoOwner: 'ops',
    slaImpact: 2.0, businessImpact: 10, customerImpact: 10,
    resolutionSLA: 1,
  },

  /* ── Vehicle exceptions ── */
  'vehicle-breakdown': {
    label: 'Vehicle Breakdown', entityType: 'vehicle', group: 'delay',
    autoSeverity: 'high', autoOwner: 'carrier',
    slaImpact: 1.5, businessImpact: 8, customerImpact: 7,
    resolutionSLA: 4,
  },

  /* ── Route exceptions ── */
  'route-deviation': {
    label: 'Route Deviation', entityType: 'route', group: 'security',
    autoSeverity: 'high', autoOwner: 'carrier',
    slaImpact: 1.0, businessImpact: 7, customerImpact: 6,
    resolutionSLA: 2,
  },

  /* ── Compliance exceptions ── */
  'carrier-non-compliance': {
    label: 'Carrier Non-Compliance', entityType: 'dispatch', group: 'compliance',
    autoSeverity: 'high', autoOwner: 'carrier',
    slaImpact: 0.5, businessImpact: 6, customerImpact: 5,
    resolutionSLA: 24,
  },
};

/* Severity order for comparisons */
const SEVERITY_ORDER = { low: 1, medium: 2, high: 3, critical: 4 };

/* Resolution workflow states */
const RESOLUTION_STATES = ['open', 'assigned', 'investigating', 'resolved', 'closed'];

/* Allowed state transitions for exceptions */
const RESOLUTION_TRANSITIONS = {
  open:          ['assigned', 'investigating', 'resolved', 'closed'],
  assigned:      ['investigating', 'resolved', 'closed'],
  investigating: ['resolved', 'closed'],
  resolved:      ['closed'],
  closed:        [],
};

/* Escalation tier definitions */
const ESCALATION_TIERS = [
  { level: 0, role: 'none',             label: 'Unescalated' },
  { level: 1, role: 'ops-exec',         label: 'Ops Executive' },
  { level: 2, role: 'ops-manager',      label: 'Operations Manager' },
  { level: 3, role: 'regional-manager', label: 'Regional Manager' },
  { level: 4, role: 'sc-head',          label: 'Supply Chain Head' },
];

/* ═══════════════════════════════════════════════════
   1. AUTO-CLASSIFICATION ENGINE
   ─────────────────────────────────────────────────
   Determines severity, owner and category from
   dispatch context without human input.
═══════════════════════════════════════════════════ */
const ClassificationEngine = {
  /**
   * Classify an exception given its category and dispatch context.
   * @param {string} category   - Key from EXCEPTION_TAXONOMY
   * @param {object} context    - { dispatch, varianceMin, huCount, ... }
   * @returns {Classification}
   */
  classify(category, context = {}) {
    const taxonomy   = EXCEPTION_TAXONOMY[category];
    if (!taxonomy) throw new Error(`Unknown exception category: "${category}"`);

    const dispatch   = context.dispatch || null;
    const carrier    = dispatch ? DAL.carriers.getById(dispatch.carrierId) : null;
    const slaConfig  = dispatch ? DAL.slaConfig?.forRoute?.(dispatch.routeId) : null;

    /* Start with taxonomy default */
    let severity = taxonomy.autoSeverity;

    /* ── Severity escalation rules ── */

    /* Departure delay — escalate based on variance */
    if (category === 'departure-delay') {
      const v = context.varianceMin || dispatch?.otdVarianceMin || 0;
      if (v > 480) severity = 'critical';       // > 8 hours
      else if (v > 240) severity = 'high';      // > 4 hours
      else if (v > 60)  severity = 'medium';
      else              severity = 'low';
    }

    /* Arrival delay — escalate based on SLA consumption */
    if (category === 'arrival-delay') {
      const v = context.varianceMin || dispatch?.otaVarianceMin || 0;
      if (v > 720) severity = 'critical';        // > 12 hours
      else if (v > 240) severity = 'high';
      else if (v > 60)  severity = 'medium';
      else              severity = 'low';
    }

    /* Missing HU — escalate based on count */
    if (category === 'missing-hu') {
      const count = context.huCount || (dispatch?.huMissing?.length || 0);
      if (count >= 5)   severity = 'critical';
      else if (count >= 3) severity = 'high';
      else if (count >= 1) severity = 'medium';
    }

    /* Carrier with poor track record → bump severity one level */
    if (carrier && carrier.otdRate < 75 && SEVERITY_ORDER[severity] < 4) {
      const levels  = Object.keys(SEVERITY_ORDER);
      const current = SEVERITY_ORDER[severity];
      const bumped  = levels.find(k => SEVERITY_ORDER[k] === current + 1);
      if (bumped) severity = bumped;
    }

    /* ── Owner determination ── */
    let owner = taxonomy.autoOwner;
    if (category === 'departure-delay' && (context.warehouseDelay || context.varianceMin < 60)) {
      owner = 'warehouse';
    }
    if (category === 'excess-hu' && context.warehouseError) owner = 'warehouse';

    /* ── Business / customer impact ── */
    const { businessImpact, customerImpact } = this._computeImpactScores(
      category, taxonomy, context, dispatch
    );

    return {
      category,
      categoryLabel:    taxonomy.label,
      group:            taxonomy.group,
      severity,
      owner,
      entityType:       taxonomy.entityType,
      businessImpact,
      customerImpact,
      resolutionSLAHrs: taxonomy.resolutionSLA,
      slaImpactMultiplier: taxonomy.slaImpact,
      autoClassified:   true,
      classifiedAt:     new Date().toISOString(),
    };
  },

  /**
   * Re-classify a manually created exception with partial context.
   */
  reclassify(exception, updatedContext = {}) {
    const ctx = {
      dispatch:       DAL.dispatches.getById(exception.dispatchId),
      varianceMin:    exception.slaImpactHrs * 60,
      huCount:        exception.huAffected?.length || 0,
      ...updatedContext,
    };
    return this.classify(exception.category || exception.type, ctx);
  },

  _computeImpactScores(category, taxonomy, context, dispatch) {
    let business  = taxonomy.businessImpact;
    let customer  = taxonomy.customerImpact;

    /* Scale by HU count for shortage types */
    if (['missing-hu','excess-hu','damaged-hu'].includes(category)) {
      const count = context.huCount || 1;
      business = Math.min(10, business + Math.floor(count / 3));
      customer = Math.min(10, customer + Math.floor(count / 2));
    }

    /* Scale by delay duration for delay types */
    if (['departure-delay','arrival-delay','sla-breach'].includes(category)) {
      const hrs = (context.varianceMin || 0) / 60;
      business  = Math.min(10, business + Math.floor(hrs / 4));
      customer  = Math.min(10, customer + Math.floor(hrs / 2));
    }

    return { businessImpact: business, customerImpact: customer };
  },
};

/* ═══════════════════════════════════════════════════
   2. ROOT CAUSE ENGINE
   ─────────────────────────────────────────────────
   Infers most likely root cause from multiple signals.
   Returns ordered list of candidates with confidence %.
═══════════════════════════════════════════════════ */
const RootCauseEngine = {

  ROOT_CAUSES: {
    'carrier-delay':   { label: 'Carrier Delay',      owner: 'carrier' },
    'warehouse-delay': { label: 'Warehouse Delay',    owner: 'warehouse' },
    'store-delay':     { label: 'Store / Destination Delay', owner: 'store' },
    'system-error':    { label: 'System / ERP Error', owner: 'ops' },
    'external-factor': { label: 'External Factor (Traffic / Weather)', owner: 'ops' },
    'driver-error':    { label: 'Driver Error',       owner: 'carrier' },
    'packing-error':   { label: 'Packing / Loading Error', owner: 'warehouse' },
    'documentation':   { label: 'Documentation Error', owner: 'warehouse' },
  },

  /**
   * Infer root cause candidates for an exception.
   * @param {string}  category  - Exception category
   * @param {object}  context   - { dispatch, varianceMin, huCount, ... }
   * @returns {RootCauseInference}
   *   { primary, candidates: [{ cause, confidence, rationale }] }
   */
  infer(category, context = {}) {
    const dispatch = context.dispatch || null;
    const carrier  = dispatch ? DAL.carriers.getById(dispatch.carrierId) : null;
    const scores   = {};  // cause → raw score (higher = more likely)

    /* ── Signal: carrier historical OTD rate ── */
    if (carrier) {
      const otdRate = carrier.otdRate || 85;
      if (otdRate < 75) {
        scores['carrier-delay'] = (scores['carrier-delay'] || 0) + 40;
      } else if (otdRate < 85) {
        scores['carrier-delay'] = (scores['carrier-delay'] || 0) + 20;
      }
    }

    /* ── Signal: category-specific priors ── */
    const priors = this._categoryPriors(category);
    Object.entries(priors).forEach(([cause, weight]) => {
      scores[cause] = (scores[cause] || 0) + weight;
    });

    /* ── Signal: time of day (departure delays at 05:00–08:00 → traffic) ── */
    if (dispatch?.plannedDeparture) {
      const hr = new Date(dispatch.plannedDeparture).getHours();
      if (hr >= 5 && hr <= 9) {
        scores['external-factor'] = (scores['external-factor'] || 0) + 15;
      }
    }

    /* ── Signal: small OTD variance → warehouse more likely ── */
    if (['departure-delay'].includes(category)) {
      const v = context.varianceMin || 0;
      if (v < 60) scores['warehouse-delay'] = (scores['warehouse-delay'] || 0) + 25;
      if (v > 180) scores['carrier-delay']  = (scores['carrier-delay']  || 0) + 20;
    }

    /* ── Signal: HU packing errors → warehouse ── */
    if (['excess-hu'].includes(category)) {
      scores['packing-error'] = (scores['packing-error'] || 0) + 50;
    }
    if (['missing-hu'].includes(category)) {
      scores['carrier-delay'] = (scores['carrier-delay']  || 0) + 30;
      scores['packing-error'] = (scores['packing-error']  || 0) + 20;
    }

    /* ── Signal: seal mismatch / theft → driver error ── */
    if (['seal-mismatch','theft-risk'].includes(category)) {
      scores['driver-error']  = (scores['driver-error']  || 0) + 40;
      scores['carrier-delay'] = (scores['carrier-delay'] || 0) + 30;
    }

    /* ── Convert to confidence percentages ── */
    const total = Object.values(scores).reduce((s, v) => s + v, 0) || 1;
    const candidates = Object.entries(scores)
      .map(([cause, score]) => ({
        cause,
        label:      this.ROOT_CAUSES[cause]?.label || cause,
        owner:      this.ROOT_CAUSES[cause]?.owner || 'ops',
        confidence: Math.round((score / total) * 100),
        score,
        rationale:  this._rationale(cause, context, carrier),
      }))
      .sort((a, b) => b.confidence - a.confidence);

    /* Normalise so top candidates sum to ~100% */
    const topCandidates = candidates.slice(0, 3);

    return {
      primary:    topCandidates[0] || null,
      candidates: topCandidates,
      inferredAt: new Date().toISOString(),
      autoInferred: true,
    };
  },

  _categoryPriors(category) {
    const priors = {
      'departure-delay':       { 'carrier-delay': 40, 'warehouse-delay': 30, 'external-factor': 20, 'driver-error': 10 },
      'arrival-delay':         { 'carrier-delay': 50, 'external-factor': 30, 'driver-error': 20 },
      'sla-breach':            { 'carrier-delay': 60, 'external-factor': 25, 'warehouse-delay': 15 },
      'missing-hu':            { 'carrier-delay': 45, 'packing-error': 35, 'driver-error': 20 },
      'excess-hu':             { 'packing-error': 60, 'warehouse-delay': 30, 'documentation': 10 },
      'damaged-hu':            { 'carrier-delay': 50, 'driver-error': 30, 'packing-error': 20 },
      'seal-mismatch':         { 'driver-error': 40, 'carrier-delay': 40, 'external-factor': 20 },
      'theft-risk':            { 'driver-error': 50, 'carrier-delay': 35, 'external-factor': 15 },
      'vehicle-breakdown':     { 'carrier-delay': 70, 'driver-error': 20, 'external-factor': 10 },
      'route-deviation':       { 'driver-error': 50, 'carrier-delay': 30, 'external-factor': 20 },
      'unloading-delay':       { 'store-delay': 60, 'warehouse-delay': 30, 'system-error': 10 },
      'carrier-non-compliance':{ 'carrier-delay': 80, 'driver-error': 20 },
    };
    return priors[category] || { 'carrier-delay': 50, 'warehouse-delay': 30, 'external-factor': 20 };
  },

  _rationale(cause, context, carrier) {
    const name = carrier?.name || 'Carrier';
    const map  = {
      'carrier-delay':   `${name} has historical OTD < 85%. Transit pattern suggests operational issue.`,
      'warehouse-delay': 'Short variance at departure suggests origin loading delay, not in-transit.',
      'store-delay':     'Destination receiving time exceeded standard dock-to-dock window.',
      'external-factor': 'Departure time window and route corridor indicate traffic / weather risk.',
      'driver-error':    'Driver behaviour pattern (seal / route) suggests human error.',
      'packing-error':   'HU discrepancy type (excess/missing) is consistent with loading dock error.',
      'documentation':   'Document mismatch detected — likely clerical error at origin.',
      'system-error':    'No field evidence; possible ERP/WMS sync failure.',
    };
    return map[cause] || 'Inferred from historical exception patterns.';
  },
};

/* ═══════════════════════════════════════════════════
   3. SLA IMPACT ENGINE
   ─────────────────────────────────────────────────
   Calculates quantified SLA and business impact
   for each exception.
═══════════════════════════════════════════════════ */
const SLAImpactEngine = {
  /**
   * Calculate full SLA impact for an exception.
   * @param {string} category
   * @param {object} dispatch
   * @param {object} context   { varianceMin, huCount, ... }
   * @returns {SLAImpact}
   */
  calculate(category, dispatch, context = {}) {
    const taxonomy      = EXCEPTION_TAXONOMY[category];
    if (!taxonomy)      return this._nullImpact();
    const slaConfig     = DAL.slaConfig?.forRoute?.(dispatch?.routeId) || { slaBreachAlertHrs: 4 };

    /* Delay minutes */
    const delayMin      = context.varianceMin
                       || (dispatch ? (dispatch.otaVarianceMin || dispatch.otdVarianceMin || 0) : 0);
    const delayHrs      = delayMin / 60;

    /* SLA impact hours */
    const slaImpactHrs  = Math.round(delayHrs * taxonomy.slaImpact * 10) / 10;

    /* Breach severity (how badly the SLA was missed) */
    const slaWindowHrs  = dispatch?.slaHours || 48;
    const breachPct     = slaWindowHrs > 0
      ? Math.round((slaImpactHrs / slaWindowHrs) * 100)
      : 0;

    let breachSeverity;
    if (breachPct >= 50)    breachSeverity = 'critical';
    else if (breachPct >= 25) breachSeverity = 'high';
    else if (breachPct >= 10) breachSeverity = 'medium';
    else                    breachSeverity = 'low';

    /* Business impact score (1–10, weighted by multiple factors) */
    const huWeight      = Math.min(3, (context.huCount || 0) * 0.5);
    const businessScore = Math.min(10,
      taxonomy.businessImpact
      + Math.floor(delayHrs / 4)
      + huWeight
    );

    /* Customer impact score */
    const customerScore = Math.min(10,
      taxonomy.customerImpact
      + Math.floor(delayHrs / 2)
      + huWeight
    );

    /* Financial impact estimate (₹ per hour delay × carrier rate) */
    const carrier       = dispatch ? DAL.carriers.getById(dispatch.carrierId) : null;
    const baseRate      = { express: 800, ftl: 500, ltl: 300, '3pl': 400 }[carrier?.type] || 400;
    const financialEstimate = Math.round(delayHrs * baseRate);

    /* Resolution SLA */
    const resolutionDeadline = new Date(
      Date.now() + taxonomy.resolutionSLA * 3600000
    ).toISOString();

    return {
      delayMin,
      delayHrs:          Math.round(delayHrs * 10) / 10,
      slaImpactHrs,
      slaWindowHrs,
      breachPct,
      breachSeverity,
      businessScore,
      customerScore,
      financialEstimate,
      financialCurrency: 'INR',
      resolutionSLAHrs:  taxonomy.resolutionSLA,
      resolutionDeadline,
      calculatedAt:      new Date().toISOString(),
    };
  },

  _nullImpact() {
    return {
      delayMin: 0, delayHrs: 0, slaImpactHrs: 0, slaWindowHrs: 0,
      breachPct: 0, breachSeverity: 'low', businessScore: 0,
      customerScore: 0, financialEstimate: 0, financialCurrency: 'INR',
      resolutionSLAHrs: 24, resolutionDeadline: null, calculatedAt: new Date().toISOString(),
    };
  },
};

/* ═══════════════════════════════════════════════════
   4. ESCALATION ENGINE
   ─────────────────────────────────────────────────
   Manages time- and severity-driven escalation
   across 4 tiers.
═══════════════════════════════════════════════════ */
const EscalationEngine = {
  /**
   * Determine the correct escalation level for an open exception.
   * Considers both elapsed time and exception severity.
   */
  computeLevel(exception) {
    const dispatch   = DAL.dispatches.getById(exception.dispatchId);
    const slaConfig  = DAL.slaConfig?.forRoute?.(dispatch?.routeId) || {
      escalationL1Hrs: 4, escalationL2Hrs: 8, escalationL3Hrs: 16,
    };
    const openHrs    = (Date.now() - new Date(exception.raisedAt)) / 3600000;
    const severity   = SEVERITY_ORDER[exception.severity] || 1;

    /* Critical exceptions skip straight to L3 if open > 1 hr */
    if (exception.severity === 'critical' && openHrs > 1)  return 3;
    if (exception.severity === 'critical')                  return 2;

    /* High severity gets L2 at threshold / 2 */
    if (severity >= 3) {
      if (openHrs >= slaConfig.escalationL3Hrs / 2) return 3;
      if (openHrs >= slaConfig.escalationL2Hrs / 2) return 2;
      if (openHrs >= slaConfig.escalationL1Hrs / 2) return 1;
    }

    /* Standard escalation by time */
    if (openHrs >= (slaConfig.escalationL3Hrs || 16)) return 3;
    if (openHrs >= (slaConfig.escalationL2Hrs || 8))  return 2;
    if (openHrs >= (slaConfig.escalationL1Hrs || 4))  return 1;

    return 0;
  },

  /**
   * Escalate an exception to a specific level.
   * @returns {{ success, exception, tier }}
   */
  escalate(exceptionId, toLevel, actor = 'System', note = '') {
    const exc = DAL.exceptions.getById(exceptionId);
    if (!exc) return { success: false, reason: `Exception ${exceptionId} not found.` };
    if (['resolved','closed'].includes(exc.status)) {
      return { success: false, reason: 'Cannot escalate a resolved/closed exception.' };
    }
    if (toLevel <= exc.escalationLevel) {
      return { success: false, reason: `Already at escalation level ${exc.escalationLevel}.` };
    }

    const tier = ESCALATION_TIERS[toLevel] || ESCALATION_TIERS[3];

    exc.escalationLevel = toLevel;
    exc.status          = 'escalated';
    exc.auditLog        = exc.auditLog || [];
    exc.auditLog.push({
      action:    'ESCALATED',
      from:      exc.escalationLevel,
      to:        toLevel,
      toRole:    tier.role,
      actor,
      note,
      timestamp: new Date().toISOString(),
    });

    DAL.exceptions.save(exc);
    AuditLogger.logException(exceptionId, 'ESCALATED', actor, 'system',
      exc.escalationLevel - 1, toLevel,
      `Escalated to ${tier.label}. ${note}`);

    EventBus.emit('exception:escalated', { exception: exc, tier, actor });

    return { success: true, exception: exc, tier };
  },

  /**
   * Run escalation check across ALL open exceptions.
   * Call this on a timer (every 30 min in production).
   */
  runAutoEscalation() {
    const escalated = [];
    const open = DAL.exceptions.getAll()
      .filter(e => !['resolved','closed'].includes(e.status));

    open.forEach(exc => {
      const required = this.computeLevel(exc);
      if (required > exc.escalationLevel) {
        const result = this.escalate(exc.id, required, 'System',
          `Auto-escalated: open ${Math.round((Date.now() - new Date(exc.raisedAt)) / 3600000)}h, severity ${exc.severity}`);
        if (result.success) escalated.push(result);
      }
    });

    return escalated;
  },

  /**
   * Get escalation summary (who owns what).
   */
  escalationSummary() {
    const open = DAL.exceptions.getAll().filter(e => !['resolved','closed'].includes(e.status));
    return ESCALATION_TIERS.map(tier => ({
      level: tier.level,
      role:  tier.role,
      label: tier.label,
      count: open.filter(e => e.escalationLevel === tier.level).length,
      exceptions: open.filter(e => e.escalationLevel === tier.level),
    }));
  },
};

/* ═══════════════════════════════════════════════════
   5. RESOLUTION WORKFLOW ENGINE
   ─────────────────────────────────────────────────
   Manages the exception status lifecycle:
   open → assigned → investigating → resolved → closed
═══════════════════════════════════════════════════ */
const ResolutionEngine = {
  /**
   * Validate a resolution state transition.
   */
  validateTransition(exception, toState) {
    const allowed = RESOLUTION_TRANSITIONS[exception.status] || [];
    if (!allowed.includes(toState)) {
      return {
        valid:  false,
        reason: `Cannot move exception from "${exception.status}" to "${toState}".`,
      };
    }
    return { valid: true };
  },

  /**
   * Assign exception to a user/role.
   */
  assign(exceptionId, assignedTo, assignedRole, actor, note = '') {
    return this._transition(exceptionId, 'assigned', actor, assignedRole, {
      assignedTo, assignedRole, note,
    });
  },

  /**
   * Mark as "investigating" with optional root cause update.
   */
  investigate(exceptionId, actor, role, rootCause = null, note = '') {
    return this._transition(exceptionId, 'investigating', actor, role, {
      rootCause, note,
    });
  },

  /**
   * Resolve exception with mandatory resolution text.
   */
  resolve(exceptionId, actor, role, resolution, rootCause = null) {
    if (!resolution || resolution.trim().length < 10) {
      return { success: false, reason: 'Resolution description must be at least 10 characters.' };
    }
    return this._transition(exceptionId, 'resolved', actor, role, {
      resolution,
      rootCause,
      resolvedBy:  actor,
      resolvedAt:  new Date().toISOString(),
    });
  },

  /**
   * Close exception (final state).
   */
  close(exceptionId, actor, role, note = '') {
    return this._transition(exceptionId, 'closed', actor, role, {
      closedBy: actor, closedAt: new Date().toISOString(), note,
    });
  },

  /**
   * Internal: apply a status transition.
   */
  _transition(exceptionId, toState, actor, role, extraFields = {}) {
    const exc = DAL.exceptions.getById(exceptionId);
    if (!exc) return { success: false, reason: `Exception ${exceptionId} not found.` };

    const check = this.validateTransition(exc, toState);
    if (!check.valid) return { success: false, reason: check.reason };

    const fromState = exc.status;

    /* Apply extra fields */
    Object.assign(exc, extraFields);
    exc.status    = toState;
    exc.auditLog  = exc.auditLog || [];
    exc.auditLog.push({
      action:    'STATUS_CHANGED',
      from:      fromState,
      to:        toState,
      actor,
      role,
      timestamp: new Date().toISOString(),
      note:      extraFields.note || extraFields.resolution || '',
    });

    DAL.exceptions.save(exc);
    AuditLogger.logException(exceptionId, `EXCEPTION_${toState.toUpperCase()}`, actor, role,
      fromState, toState, extraFields.note || extraFields.resolution || '');

    EventBus.emit('exception:status_changed', { exception: exc, fromState, toState, actor });

    return { success: true, exception: exc };
  },

  /**
   * Calculate time-to-resolution for closed exceptions.
   * @returns {number|null} Hours
   */
  timeToResolution(exception) {
    if (!exception.raisedAt || !exception.resolvedAt) return null;
    const ms = new Date(exception.resolvedAt) - new Date(exception.raisedAt);
    return Math.round(ms / 3600000 * 10) / 10;
  },
};

/* ═══════════════════════════════════════════════════
   6. EXCEPTION FACTORY
   ─────────────────────────────────────────────────
   Central factory for creating exceptions of any type.
   Runs classification, root cause, and SLA impact
   automatically.
═══════════════════════════════════════════════════ */
const ExceptionFactory = {
  /**
   * Create a fully classified exception.
   *
   * @param {object} input
   * @param {string} input.category     - Key from EXCEPTION_TAXONOMY
   * @param {string} input.dispatchId   - FK → Dispatch
   * @param {string} input.title        - Short description
   * @param {string} input.description  - Full description
   * @param {string[]} input.huAffected - HU barcodes (if any)
   * @param {object} input.context      - { varianceMin, huCount, warehouseDelay, ... }
   * @param {string} actor
   * @param {string} role
   * @param {boolean} autoRaised
   * @returns {{ success, exception }}
   */
  create(input, actor = 'System', role = 'system', autoRaised = false) {
    const { category, dispatchId, title, description, huAffected = [], context = {} } = input;

    const taxonomy = EXCEPTION_TAXONOMY[category];
    if (!taxonomy) return { success: false, reason: `Unknown category: ${category}` };

    const dispatch = DAL.dispatches.getById(dispatchId);
    const ctx      = { dispatch, ...context };

    /* ── Dedup check: same category + dispatch + open ── */
    const existing = DAL.exceptions.getAll().find(e =>
      e.dispatchId === dispatchId &&
      e.category   === category &&
      !['resolved','closed'].includes(e.status)
    );
    if (existing) {
      return { success: false, reason: `Duplicate: exception ${existing.id} already open for this category on ${dispatchId}.`, existing };
    }

    /* ── Classification ── */
    const classification = ClassificationEngine.classify(category, ctx);

    /* ── Root cause inference ── */
    const rootCause = RootCauseEngine.infer(category, ctx);

    /* ── SLA Impact ── */
    const slaImpact = SLAImpactEngine.calculate(category, dispatch, context);

    /* ── Determine initial escalation level ── */
    const severity = classification.severity;
    const initLevel = severity === 'critical' ? 2 : severity === 'high' ? 1 : 0;

    const excId = `EXC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;

    const exception = {
      id:                  excId,
      category,
      categoryLabel:       taxonomy.label,
      group:               taxonomy.group,
      entityType:          taxonomy.entityType,
      dispatchId:          dispatchId || null,
      routeId:             dispatch?.routeId || null,
      vehicleId:           dispatch?.vehicleId || null,

      /* Classification */
      severity:            classification.severity,
      owner:               classification.owner,
      businessImpact:      classification.businessImpact,
      customerImpact:      classification.customerImpact,
      autoClassified:      autoRaised,

      /* Content */
      title,
      description,
      huAffected,

      /* Root cause */
      suggestedCause:      rootCause.primary?.cause || null,
      suggestedCauseLabel: rootCause.primary?.label || null,
      causeConfidence:     rootCause.primary?.confidence || 0,
      causeRationale:      rootCause.primary?.rationale || null,
      causeCandidates:     rootCause.candidates,
      rootCause:           null,          // Confirmed by human later
      confirmedCause:      false,

      /* SLA Impact */
      slaImpactHrs:        slaImpact.slaImpactHrs,
      delayMin:            slaImpact.delayMin,
      breachSeverity:      slaImpact.breachSeverity,
      businessScore:       slaImpact.businessScore,
      customerScore:       slaImpact.customerScore,
      financialEstimate:   slaImpact.financialEstimate,
      resolutionDeadline:  slaImpact.resolutionDeadline,
      resolutionSLAHrs:    slaImpact.resolutionSLAHrs,

      /* Workflow */
      status:              'open',
      escalationLevel:     initLevel,
      assignedTo:          null,
      assignedRole:        null,

      /* Timestamps */
      raisedBy:            actor,
      raisedAt:            new Date().toISOString(),
      acknowledgedBy:      null,
      acknowledgedAt:      null,
      resolvedBy:          null,
      resolvedAt:          null,
      closedBy:            null,
      closedAt:            null,
      resolution:          null,

      auditLog: [{
        action:    'EXCEPTION_CREATED',
        actor,
        role,
        timestamp: new Date().toISOString(),
        note:      autoRaised ? 'Auto-raised by system rule' : 'Manually raised',
      }],
    };

    /* If critical, immediately add audit note about escalation */
    if (initLevel > 0) {
      exception.auditLog.push({
        action:    'AUTO_ESCALATED',
        actor:     'System',
        role:      'system',
        timestamp: new Date().toISOString(),
        note:      `Initial escalation level ${initLevel} due to ${severity} severity`,
      });
    }

    DAL.exceptions.save(exception);

    /* Link to dispatch */
    if (dispatch) {
      dispatch.exceptionIds = dispatch.exceptionIds || [];
      if (!dispatch.exceptionIds.includes(excId)) {
        dispatch.exceptionIds.push(excId);
        DAL.dispatches.save(dispatch);
      }
    }

    AuditLogger.logException(excId, 'EXCEPTION_CREATED', actor, role,
      null, exception.status,
      `[${exception.severity.toUpperCase()}] ${title}`);

    EventBus.emit('exception:created', { exception, dispatch });

    /* Auto-trigger immediate escalation if critical */
    if (exception.severity === 'critical') {
      EscalationEngine.escalate(excId, initLevel, 'System',
        'Auto-escalated on creation: critical severity');
    }

    return { success: true, exception };
  },

  /**
   * Quick factory methods for common exception types.
   */
  raiseDelay(dispatchId, varianceMin, actor = 'System') {
    const category = varianceMin > dispatch?.slaHours * 60 ? 'sla-breach'
      : varianceMin > 240 ? 'arrival-delay' : 'departure-delay';
    const dispatch = DAL.dispatches.getById(dispatchId);
    return this.create({
      category,
      dispatchId,
      title: `${EXCEPTION_TAXONOMY[category].label}: ${Math.round(varianceMin/60)}h variance`,
      description: `Dispatch departed/arrived ${varianceMin} minutes ${varianceMin > 0 ? 'late' : 'early'}.`,
      context: { varianceMin, dispatch },
    }, actor, 'system', true);
  },

  raiseSealMismatch(dispatchId, originSeal, receivedSeal, actor = 'System') {
    return this.create({
      category: 'seal-mismatch',
      dispatchId,
      title: `SEAL MISMATCH: expected ${originSeal}, received ${receivedSeal}`,
      description: `Seal number mismatch at destination. Origin: ${originSeal}. Received: ${receivedSeal}. Tamper risk flagged.`,
      context: { varianceMin: 0 },
    }, actor, 'system', true);
  },

  raiseMissingHU(dispatchId, missingBarcodes, actor = 'System') {
    return this.create({
      category:   'missing-hu',
      dispatchId,
      title:      `${missingBarcodes.length} HU(s) not received at destination`,
      description:`HU barcodes in dispatch manifest not scanned at destination: ${missingBarcodes.join(', ')}`,
      huAffected: missingBarcodes,
      context:    { huCount: missingBarcodes.length },
    }, actor, 'system', true);
  },

  raiseExcessHU(dispatchId, excessBarcodes, actor = 'System') {
    return this.create({
      category:   'excess-hu',
      dispatchId,
      title:      `${excessBarcodes.length} unmanifested HU(s) received`,
      description:`HU barcodes received but not in dispatch manifest: ${excessBarcodes.join(', ')}`,
      huAffected: excessBarcodes,
      context:    { huCount: excessBarcodes.length, warehouseError: true },
    }, actor, 'system', true);
  },

  raiseVehicleBreakdown(dispatchId, location, actor) {
    return this.create({
      category:    'vehicle-breakdown',
      dispatchId,
      title:       `Vehicle Breakdown Reported En Route`,
      description: `Driver reported breakdown near ${location}. Recovery vehicle dispatched.`,
      context:     { varianceMin: 240 },   // assume 4hr impact
    }, actor, 'ops-exec', false);
  },
};

/* ═══════════════════════════════════════════════════
   7. EXCEPTION ANALYTICS ENGINE
═══════════════════════════════════════════════════ */
const ExceptionAnalytics = {
  /**
   * Global exception metrics dashboard data.
   */
  globalMetrics() {
    const all      = DAL.exceptions.getAll();
    const open     = all.filter(e => !['resolved','closed'].includes(e.status));
    const resolved = all.filter(e => e.status === 'resolved');
    const closed   = all.filter(e => e.status === 'closed');

    /* Resolution time stats */
    const resolutionTimes = resolved.concat(closed)
      .map(e => ResolutionEngine.timeToResolution(e))
      .filter(t => t !== null);
    const avgResolutionHrs = resolutionTimes.length
      ? Math.round(resolutionTimes.reduce((s,t) => s+t, 0) / resolutionTimes.length * 10) / 10
      : null;
    const maxResolutionHrs = resolutionTimes.length ? Math.max(...resolutionTimes) : null;

    /* Overdue (open past resolution SLA) */
    const overdue = open.filter(e => {
      if (!e.resolutionDeadline) return false;
      return new Date(e.resolutionDeadline) < new Date();
    });

    return {
      total:               all.length,
      open:                open.length,
      resolved:            resolved.length,
      closed:              closed.length,
      overdue:             overdue.length,
      escalated:           open.filter(e => e.escalationLevel > 0).length,

      bySeverity: {
        critical: open.filter(e => e.severity === 'critical').length,
        high:     open.filter(e => e.severity === 'high').length,
        medium:   open.filter(e => e.severity === 'medium').length,
        low:      open.filter(e => e.severity === 'low').length,
      },

      byCategory:        this._groupBy(all, 'category'),
      byGroup:           this._groupBy(all, 'group'),
      byOwner:           this._groupBy(open, 'owner'),
      byStatus:          this._groupBy(all, 'status'),
      byEscalationLevel: this._groupBy(open, 'escalationLevel'),

      resolutionMetrics: {
        avgHrs:  avgResolutionHrs,
        maxHrs:  maxResolutionHrs,
        count:   resolutionTimes.length,
      },

      rootCauseDistribution: this._rootCauseDist(all),
      slaImpact:             this._slaImpactSummary(all),
    };
  },

  /**
   * Carrier Exception Score (0–100, lower is better).
   * Used in carrier performance dashboard.
   */
  carrierExceptionScore(carrierId) {
    const dispatches = DAL.dispatches.getAll().filter(d => d.carrierId === carrierId);
    if (!dispatches.length) return { score: 0, details: {} };

    const excIds = [...new Set(dispatches.flatMap(d => d.exceptionIds || []))];
    const excs   = excIds.map(id => DAL.exceptions.getById(id)).filter(Boolean);

    /* Weighted score: critical=10, high=5, medium=2, low=1 per exception */
    const weights = { critical: 10, high: 5, medium: 2, low: 1 };
    const raw     = excs.reduce((s, e) => s + (weights[e.severity] || 1), 0);

    /* Normalise against dispatch volume */
    const normalised = dispatches.length > 0
      ? Math.min(100, Math.round((raw / dispatches.length) * 10))
      : 0;

    return {
      carrierId,
      score:          normalised,          // 0 = clean, 100 = terrible
      rating:         normalised <= 10 ? 'excellent' : normalised <= 25 ? 'good' : normalised <= 50 ? 'average' : 'poor',
      totalExceptions:excs.length,
      byCategory:     this._groupBy(excs, 'category'),
      bySeverity:     this._groupBy(excs, 'severity'),
      exceptionRate:  dispatches.length
        ? Math.round(excs.length / dispatches.length * 100)
        : 0,
    };
  },

  /**
   * Per-route exception breakdown.
   */
  routeExceptions(routeId) {
    const dispatches = DAL.dispatches.getAll().filter(d => d.routeId === routeId);
    const excIds     = [...new Set(dispatches.flatMap(d => d.exceptionIds || []))];
    const excs       = excIds.map(id => DAL.exceptions.getById(id)).filter(Boolean);

    return {
      routeId,
      totalExceptions: excs.length,
      openExceptions:  excs.filter(e => !['resolved','closed'].includes(e.status)).length,
      byCategory:      this._groupBy(excs, 'category'),
      bySeverity:      this._groupBy(excs, 'severity'),
      exceptionRate:   dispatches.length
        ? Math.round(excs.length / dispatches.length * 100)
        : 0,
    };
  },

  /**
   * Exception list with full context for data tables.
   */
  list(filters = {}) {
    let all = DAL.exceptions.getAll();

    if (filters.status)     all = all.filter(e => e.status     === filters.status);
    if (filters.severity)   all = all.filter(e => e.severity   === filters.severity);
    if (filters.category)   all = all.filter(e => e.category   === filters.category);
    if (filters.owner)      all = all.filter(e => e.owner      === filters.owner);
    if (filters.routeId)    all = all.filter(e => e.routeId    === filters.routeId);
    if (filters.carrierId) {
      const dspIds = new Set(
        DAL.dispatches.getAll()
          .filter(d => d.carrierId === filters.carrierId)
          .map(d => d.id)
      );
      all = all.filter(e => dspIds.has(e.dispatchId));
    }
    if (filters.escalated)  all = all.filter(e => e.escalationLevel > 0);

    return all
      .sort((a,b) => {
        /* Sort: critical first, then by raisedAt desc */
        const sv = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
        if (sv !== 0) return sv;
        return new Date(b.raisedAt) - new Date(a.raisedAt);
      })
      .map(e => ({
        ...e,
        dispatch:        DAL.dispatches.getById(e.dispatchId),
        openHrs:         Math.round((Date.now() - new Date(e.raisedAt)) / 360000) / 10,
        isOverdue:       e.resolutionDeadline && new Date(e.resolutionDeadline) < new Date(),
        escalationLabel: ESCALATION_TIERS[e.escalationLevel]?.label || 'None',
      }));
  },

  /**
   * Export-ready flat array for CSV.
   */
  exportData(filters = {}) {
    return this.list(filters).map(e => ({
      'Exception ID':       e.id,
      'Category':           e.categoryLabel || e.category,
      'Severity':           e.severity,
      'Status':             e.status,
      'Dispatch ID':        e.dispatchId || '',
      'Route':              e.dispatch?.routeCode || '',
      'Vehicle':            e.dispatch?.vehicleReg || '',
      'Title':              e.title,
      'Owner':              e.owner,
      'Escalation Level':   e.escalationLevel,
      'Suggested Cause':    e.suggestedCauseLabel || '',
      'Cause Confidence %': e.causeConfidence || 0,
      'SLA Impact Hrs':     e.slaImpactHrs || 0,
      'Business Score':     e.businessScore || 0,
      'Financial Est (₹)':  e.financialEstimate || 0,
      'Open Hours':         e.openHrs,
      'Overdue':            e.isOverdue ? 'Yes' : 'No',
      'Raised By':          e.raisedBy,
      'Raised At':          e.raisedAt,
      'Resolved By':        e.resolvedBy || '',
      'Resolved At':        e.resolvedAt || '',
      'Resolution':         e.resolution || '',
    }));
  },

  /* ── Private helpers ── */
  _groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = String(item[key] ?? 'unknown');
      acc[k]  = (acc[k] || 0) + 1;
      return acc;
    }, {});
  },

  _rootCauseDist(exceptions) {
    const causes = exceptions
      .map(e => e.suggestedCause || e.rootCause || 'unknown')
      .filter(Boolean);
    const dist   = this._groupBy(causes.map(c => ({ suggestedCause: c })), 'suggestedCause');
    const total  = causes.length || 1;
    return Object.entries(dist).map(([cause, count]) => ({
      cause,
      label:  RootCauseEngine.ROOT_CAUSES[cause]?.label || cause,
      count,
      pct:    Math.round(count / total * 100),
    })).sort((a,b) => b.count - a.count);
  },

  _slaImpactSummary(exceptions) {
    const withImpact = exceptions.filter(e => e.slaImpactHrs > 0);
    const total      = withImpact.reduce((s,e) => s + e.slaImpactHrs, 0);
    const financial  = exceptions.reduce((s,e) => s + (e.financialEstimate || 0), 0);
    return {
      totalImpactHrs:   Math.round(total * 10) / 10,
      avgImpactHrs:     withImpact.length ? Math.round(total / withImpact.length * 10) / 10 : 0,
      totalFinancialINR: financial,
    };
  },
};

/* ═══════════════════════════════════════════════════
   EXPOSE TO WINDOW.TCT
═══════════════════════════════════════════════════ */
Object.assign(window.TCT, {
  EXCEPTION_TAXONOMY,
  SEVERITY_ORDER,
  RESOLUTION_STATES,
  RESOLUTION_TRANSITIONS,
  ESCALATION_TIERS,
  ClassificationEngine,
  RootCauseEngine,
  SLAImpactEngine,
  EscalationEngine,
  ResolutionEngine,
  ExceptionFactory,
  ExceptionAnalytics,
});

console.log('[TCT Step 4] Exception Management Engine loaded.');
// → Next module: STEP 5 (await instruction)
