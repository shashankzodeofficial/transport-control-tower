/**
 * TRANSPORT CONTROL TOWER — STEP 3: HU RECONCILIATION ENGINE
 * ============================================================
 * Depends on: step1-data-model.js, step2-dispatch-lifecycle.js
 *
 * Responsibilities:
 *  1. HU scanning — validate, deduplicate, register each scan
 *  2. HU validation — format check, dispatch membership check
 *  3. Dispatch vs Received matching engine
 *  4. Missing HU detection (dispatched but not received)
 *  5. Excess HU detection (received but not in manifest)
 *  6. Seal validation — match, mismatch, tamper detection
 *  7. ASN validation — format + registry lookup
 *  8. Invoice validation — format + cross-reference
 *  9. Reconciliation completion rules
 * 10. Reconciliation KPIs
 */

'use strict';

/* ─────────────────────────────────────────────────────
   GUARD
───────────────────────────────────────────────────── */
if (!window.TCT?.DAL || !window.TCT?.LifecycleEngine) {
  throw new Error('[TCT Step 3] step1 and step2 must be loaded first.');
}

const { DAL, KEYS, DB, LifecycleEngine, AuditLogger, EventBus, ExceptionHooks, EVENTS } = window.TCT;

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */

const HU_BARCODE_REGEX  = /^HU\d{7}$/i;          // Format: HU + 7 digits
const ASN_REGEX         = /^ASN-\d{4}-\d{4,}$/i; // Format: ASN-YYYY-NNNN
const INVOICE_REGEX     = /^INV-\d{4}-\d{4,}$/i; // Format: INV-YYYY-NNNN
const SEAL_REGEX        = /^SL-\d{5,}$/i;         // Format: SL-NNNNN

const RECON_STATUS = {
  PENDING:     'pending',
  IN_PROGRESS: 'in-progress',
  MATCHED:     'matched',
  DISCREPANCY: 'discrepancy',
  CLOSED:      'closed',
};

const SCAN_RESULT = {
  ACCEPTED:          'accepted',
  DUPLICATE:         'duplicate',
  NOT_IN_MANIFEST:   'not-in-manifest',
  INVALID_FORMAT:    'invalid-format',
  WRONG_DISPATCH:    'wrong-dispatch',
  ALREADY_RECEIVED:  'already-received',
};

/* ═══════════════════════════════════════════════════
   1. HU VALIDATION ENGINE
   ─────────────────────────────────────────────────
   Validates a single barcode against format rules
   and dispatch membership before accepting the scan.
═══════════════════════════════════════════════════ */
const HUValidator = {
  /**
   * Validate HU barcode format.
   * @param {string} barcode
   * @returns {{ valid: boolean, reason: string }}
   */
  validateFormat(barcode) {
    if (!barcode || typeof barcode !== 'string') {
      return { valid: false, reason: 'Barcode is empty or invalid.' };
    }
    const clean = barcode.trim().toUpperCase();
    if (!HU_BARCODE_REGEX.test(clean)) {
      return { valid: false, reason: `"${clean}" does not match HU barcode format (HU + 7 digits).` };
    }
    return { valid: true, reason: '', normalized: clean };
  },

  /**
   * Check if barcode belongs to the dispatch manifest.
   * @param {string} barcode
   * @param {object} dispatch
   * @returns {{ inManifest: boolean, alreadyReceived: boolean }}
   */
  checkManifest(barcode, dispatch) {
    const clean        = barcode.trim().toUpperCase();
    const inManifest   = (dispatch.huDispatched || []).map(h => h.toUpperCase()).includes(clean);
    const alreadyRcvd  = (dispatch.huReceived   || []).map(h => h.toUpperCase()).includes(clean);
    return { inManifest, alreadyReceived: alreadyRcvd };
  },

  /**
   * Check if a barcode belongs to a DIFFERENT dispatch (mis-routing risk).
   * @param {string} barcode
   * @param {string} currentDispatchId
   * @returns {{ foundIn: string|null }}  dispatchId if found elsewhere
   */
  checkCrossDispatch(barcode, currentDispatchId) {
    const clean = barcode.trim().toUpperCase();
    const all   = DAL.dispatches.getAll();
    for (const d of all) {
      if (d.id === currentDispatchId) continue;
      if ((d.huDispatched || []).map(h => h.toUpperCase()).includes(clean)) {
        return { foundIn: d.id };
      }
    }
    return { foundIn: null };
  },
};

/* ═══════════════════════════════════════════════════
   2. HU SCANNING ENGINE
   ─────────────────────────────────────────────────
   Stateful scan session for a single dispatch.
   Tracks accepted, rejected, and flagged barcodes.
═══════════════════════════════════════════════════ */

/**
 * Create a new scan session for a dispatch.
 * @param {string} dispatchId
 * @param {string} actor
 * @param {string} role
 * @returns {ScanSession}
 */
function createScanSession(dispatchId, actor = 'unknown', role = 'warehouse-op') {
  const dispatch = DAL.dispatches.getById(dispatchId);
  if (!dispatch) throw new Error(`Dispatch ${dispatchId} not found.`);
  if (!['unloading'].includes(dispatch.status)) {
    throw new Error(`Scan sessions only allowed in "unloading" status. Current: "${dispatch.status}".`);
  }

  return new ScanSession(dispatch, actor, role);
}

class ScanSession {
  constructor(dispatch, actor, role) {
    this.dispatch    = dispatch;
    this.dispatchId  = dispatch.id;
    this.actor       = actor;
    this.role        = role;
    this.startedAt   = new Date().toISOString();
    this.deviceId    = `SCAN-${Date.now().toString(36).toUpperCase()}`;

    /* Pull already-received HUs from persisted state */
    this.received    = new Set((dispatch.huReceived || []).map(h => h.toUpperCase()));

    this.log         = [];   // Per-session scan log
  }

  /**
   * Scan a single barcode.
   * Returns a detailed result object for UI feedback.
   * @param {string} rawBarcode
   * @returns {ScanResult}
   */
  scan(rawBarcode) {
    const ts    = new Date().toISOString();
    const input = (rawBarcode || '').trim().toUpperCase();

    /* ── Format validation ── */
    const fmt = HUValidator.validateFormat(input);
    if (!fmt.valid) {
      const result = this._buildResult(SCAN_RESULT.INVALID_FORMAT, input, fmt.reason, 'error');
      this.log.push(result);
      return result;
    }

    const barcode = fmt.normalized;

    /* ── Duplicate in this session ── */
    if (this.received.has(barcode)) {
      const result = this._buildResult(SCAN_RESULT.DUPLICATE, barcode,
        `${barcode} already scanned in this session.`, 'warning');
      this.log.push(result);
      return result;
    }

    /* ── Manifest check ── */
    const { inManifest, alreadyReceived } = HUValidator.checkManifest(barcode, this.dispatch);

    if (alreadyReceived) {
      const result = this._buildResult(SCAN_RESULT.ALREADY_RECEIVED, barcode,
        `${barcode} was already received in a prior session.`, 'warning');
      this.log.push(result);
      return result;
    }

    /* ── Cross-dispatch check (only if NOT in manifest) ── */
    if (!inManifest) {
      const cross = HUValidator.checkCrossDispatch(barcode, this.dispatchId);
      if (cross.foundIn) {
        const result = this._buildResult(SCAN_RESULT.WRONG_DISPATCH, barcode,
          `${barcode} belongs to dispatch ${cross.foundIn}. Possible mis-routing.`, 'error',
          { foundInDispatch: cross.foundIn, isExcess: true });
        this.log.push(result);
        this.received.add(barcode);   // Still record it — will appear as excess
        this._persist();
        return result;
      }
      /* Not in manifest and not from another dispatch → genuine excess */
      const result = this._buildResult(SCAN_RESULT.NOT_IN_MANIFEST, barcode,
        `${barcode} not found in dispatch manifest. Recorded as excess.`, 'warning',
        { isExcess: true });
      this.log.push(result);
      this.received.add(barcode);
      this._persist();
      return result;
    }

    /* ── Accepted ── */
    this.received.add(barcode);
    this._persist();

    const result = this._buildResult(SCAN_RESULT.ACCEPTED, barcode,
      `${barcode} accepted. (${this.received.size} / ${this.dispatch.huDispatched.length})`, 'success');
    this.log.push(result);

    /* Update HU registry custody */
    HURegistry.updateCustody(barcode, {
      event:      'received',
      user:       this.actor,
      role:       this.role,
      locationId: this.dispatch.destId,
      timestamp:  ts,
      note:       `Scanned at destination — ${this.dispatch.id}`,
      deviceId:   this.deviceId,
    });

    return result;
  }

  /**
   * Remove a scanned barcode (undo last scan or specific barcode).
   */
  removeScan(barcode) {
    const clean = barcode.trim().toUpperCase();
    if (!this.received.has(clean)) {
      return { success: false, reason: `${clean} not in current scan list.` };
    }
    this.received.delete(clean);
    this.log.push({ action: 'REMOVED', barcode: clean, timestamp: new Date().toISOString() });
    this._persist();
    return { success: true };
  }

  /**
   * Get current session summary.
   */
  summary() {
    const dispatched = (this.dispatch.huDispatched || []).map(h => h.toUpperCase());
    const received   = [...this.received];
    const missing    = dispatched.filter(h => !received.includes(h));
    const excess     = received.filter(h => !dispatched.includes(h));

    return {
      dispatchId:       this.dispatchId,
      totalDispatched:  dispatched.length,
      totalReceived:    received.length,
      totalMissing:     missing.length,
      totalExcess:      excess.length,
      missingBarcodes:  missing,
      excessBarcodes:   excess,
      receivedBarcodes: received,
      isComplete:       received.length === dispatched.length && missing.length === 0 && excess.length === 0,
      hasDiscrepancy:   missing.length > 0 || excess.length > 0,
      pctReceived:      dispatched.length ? Math.round(received.length / dispatched.length * 100) : 0,
      scanLog:          this.log,
      startedAt:        this.startedAt,
    };
  }

  /** Persist current received list back to dispatch */
  _persist() {
    const d = DAL.dispatches.getById(this.dispatchId);
    if (d) {
      d.huReceived = [...this.received];
      DAL.dispatches.save(d);
    }
  }

  _buildResult(status, barcode, message, level, extra = {}) {
    return {
      status,
      barcode,
      message,
      level,     // 'success' | 'warning' | 'error'
      timestamp: new Date().toISOString(),
      actor:     this.actor,
      ...extra,
    };
  }
}

/* ═══════════════════════════════════════════════════
   3. HU REGISTRY
   ─────────────────────────────────────────────────
   Global registry tracking every HU's lifecycle.
═══════════════════════════════════════════════════ */
const HURegistry = {
  /**
   * Register a set of HU barcodes when a dispatch is loaded at origin.
   * Sets each HU to "loaded" status with custody event.
   */
  registerLoading(dispatchId, barcodes, actor, role, locationId) {
    const existing = DB.get(KEYS.huRegistry) || {};
    const ts       = new Date().toISOString();

    barcodes.forEach(raw => {
      const barcode = raw.trim().toUpperCase();
      const record  = existing[barcode] || {
        barcode,
        dispatchId,
        status:     'loaded',
        description:'',
        weightKg:   0,
        cbm:        0,
        custody:    [],
        tamperFlag: false,
        createdAt:  ts,
      };

      record.dispatchId = dispatchId;
      record.status     = 'loaded';
      record.custody.push({
        event:      'loaded',
        user:       actor,
        role,
        locationId,
        timestamp:  ts,
        note:       `Loaded onto dispatch ${dispatchId}`,
        deviceId:   'WH-ORIGIN',
      });

      existing[barcode] = record;
    });

    DB.set(KEYS.huRegistry, existing);
    return Object.keys(existing).length;
  },

  /**
   * Update a single HU's custody trail.
   */
  updateCustody(barcode, custodyEvent) {
    const registry = DB.get(KEYS.huRegistry) || {};
    const clean    = barcode.trim().toUpperCase();
    if (!registry[clean]) {
      registry[clean] = {
        barcode: clean, dispatchId: null, status: custodyEvent.event,
        description: '', weightKg: 0, cbm: 0, custody: [], tamperFlag: false,
        createdAt: custodyEvent.timestamp,
      };
    }
    registry[clean].custody.push(custodyEvent);
    registry[clean].status = custodyEvent.event;
    DB.set(KEYS.huRegistry, registry);
  },

  /**
   * Get full custody trail for a single HU.
   */
  getCustody(barcode) {
    const registry = DB.get(KEYS.huRegistry) || {};
    return registry[barcode.trim().toUpperCase()] || null;
  },

  /**
   * Flag HU(s) as tampered (seal mismatch event).
   */
  flagTamper(barcodes, dispatchId, note = '') {
    const registry = DB.get(KEYS.huRegistry) || {};
    const ts       = new Date().toISOString();
    barcodes.forEach(b => {
      const clean = b.trim().toUpperCase();
      if (registry[clean]) {
        registry[clean].tamperFlag = true;
        registry[clean].custody.push({
          event: 'tamper-flag', user: 'System', role: 'system',
          locationId: null, timestamp: ts, note, deviceId: 'SYS',
        });
      }
    });
    DB.set(KEYS.huRegistry, registry);
  },

  /**
   * Mark HUs as "in-transit" when dispatch departs.
   */
  markInTransit(dispatchId, actor, role, locationId) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return;
    const registry = DB.get(KEYS.huRegistry) || {};
    const ts       = new Date().toISOString();
    (dispatch.huDispatched || []).forEach(raw => {
      const b = raw.trim().toUpperCase();
      if (registry[b]) {
        registry[b].status = 'in-transit';
        registry[b].custody.push({
          event: 'in-transit', user: actor, role, locationId,
          timestamp: ts, note: `Departed on ${dispatchId}`, deviceId: 'WH-GATE',
        });
      }
    });
    DB.set(KEYS.huRegistry, registry);
  },

  /**
   * Mark HUs as "closed" after reconciliation.
   */
  markClosed(dispatchId, actor, role, locationId) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return;
    const registry = DB.get(KEYS.huRegistry) || {};
    const ts       = new Date().toISOString();
    (dispatch.huReceived || []).forEach(raw => {
      const b = raw.trim().toUpperCase();
      if (registry[b]) {
        registry[b].status = 'closed';
        registry[b].custody.push({
          event: 'closed', user: actor, role, locationId,
          timestamp: ts, note: `Reconciled on ${dispatchId}`, deviceId: 'WH-DEST',
        });
      }
    });
    DB.set(KEYS.huRegistry, registry);
  },

  /**
   * Search HU registry by barcode prefix or full code.
   */
  search(query) {
    const registry = DB.get(KEYS.huRegistry) || {};
    const q        = (query || '').trim().toUpperCase();
    return Object.values(registry).filter(hu =>
      hu.barcode.includes(q) || hu.dispatchId?.includes(q)
    );
  },

  getAll() {
    return Object.values(DB.get(KEYS.huRegistry) || {});
  },
};

/* ═══════════════════════════════════════════════════
   4. MATCHING ENGINE
   ─────────────────────────────────────────────────
   Pure function — compares two arrays and returns
   the full diff: matched, missing, excess.
═══════════════════════════════════════════════════ */
const MatchingEngine = {
  /**
   * Compare dispatched HUs vs received HUs.
   * @param {string[]} dispatched
   * @param {string[]} received
   * @returns {MatchResult}
   */
  compare(dispatched = [], received = []) {
    const dispSet = new Set(dispatched.map(h => h.trim().toUpperCase()));
    const rcvSet  = new Set(received.map(h  => h.trim().toUpperCase()));

    const matched = [...dispSet].filter(h => rcvSet.has(h));
    const missing = [...dispSet].filter(h => !rcvSet.has(h));   // dispatched but not received
    const excess  = [...rcvSet].filter(h  => !dispSet.has(h));  // received but not dispatched

    const totalDispatched = dispSet.size;
    const totalReceived   = rcvSet.size;
    const matchRate       = totalDispatched > 0
      ? Math.round(matched.length / totalDispatched * 100)
      : (totalReceived === 0 ? 100 : 0);

    const status = missing.length === 0 && excess.length === 0
      ? RECON_STATUS.MATCHED
      : RECON_STATUS.DISCREPANCY;

    return {
      status,
      totalDispatched,
      totalReceived,
      totalMatched:  matched.length,
      totalMissing:  missing.length,
      totalExcess:   excess.length,
      matched,
      missing,
      excess,
      matchRate,
      isClean: status === RECON_STATUS.MATCHED,
    };
  },

  /**
   * Generate line-item reconciliation report for a dispatch.
   */
  generateReport(dispatch) {
    const result = this.compare(dispatch.huDispatched, dispatch.huReceived);
    const registry = DB.get(KEYS.huRegistry) || {};

    const toDetail = (barcodes, source) => barcodes.map(b => {
      const reg = registry[b.toUpperCase()];
      return {
        barcode:   b,
        source,
        status:    reg?.status || 'unknown',
        tamper:    reg?.tamperFlag || false,
        custody:   reg?.custody || [],
        weightKg:  reg?.weightKg || 0,
        cbm:       reg?.cbm || 0,
      };
    });

    return {
      dispatchId:      dispatch.id,
      routeCode:       dispatch.routeCode,
      vehicle:         dispatch.vehicleReg,
      asn:             dispatch.asn,
      invoice:         dispatch.invoice,
      sealNo:          dispatch.sealNo,
      ...result,
      matchedDetail:   toDetail(result.matched, 'manifest'),
      missingDetail:   toDetail(result.missing, 'manifest-only'),
      excessDetail:    toDetail(result.excess,  'received-only'),
      generatedAt:     new Date().toISOString(),
      sealStatus:      dispatch.receivingData?.sealMatch === false ? 'mismatch' : 'ok',
      receivingChecks: dispatch.receivingData || null,
    };
  },
};

/* ═══════════════════════════════════════════════════
   5. SEAL VALIDATION ENGINE
═══════════════════════════════════════════════════ */
const SealValidator = {
  /**
   * Validate seal number format.
   */
  validateFormat(sealNo) {
    if (!sealNo || typeof sealNo !== 'string') {
      return { valid: false, reason: 'Seal number is empty.' };
    }
    const clean = sealNo.trim().toUpperCase();
    if (!SEAL_REGEX.test(clean)) {
      return { valid: false, reason: `"${clean}" does not match seal format (SL-NNNNN).` };
    }
    return { valid: true, reason: '', normalized: clean };
  },

  /**
   * Compare origin seal vs destination observed seal.
   * @returns {SealCheckResult}
   */
  verify(originSeal, receivedSeal) {
    const origin   = (originSeal   || '').trim().toUpperCase();
    const received = (receivedSeal || '').trim().toUpperCase();

    if (!origin)   return { match: false, tamperRisk: true,  reason: 'Origin seal not recorded in dispatch.' };
    if (!received) return { match: false, tamperRisk: true,  reason: 'Received seal not scanned at destination.' };

    const match = origin === received;
    return {
      match,
      tamperRisk: !match,
      originSeal:   origin,
      receivedSeal: received,
      reason: match
        ? 'Seal verified — no tampering detected.'
        : `SEAL MISMATCH: expected "${origin}", received "${received}". Tamper risk flagged.`,
    };
  },

  /**
   * Run seal check as part of receiving and persist result.
   * Also triggers tamper flag on HU registry if mismatch.
   */
  runReceivingCheck(dispatch, receivedSeal, actor, role) {
    const result = this.verify(dispatch.sealNo, receivedSeal);

    if (!result.match) {
      /* Flag all HUs on this dispatch as potentially tampered */
      HURegistry.flagTamper(
        dispatch.huDispatched || [],
        dispatch.id,
        `Seal mismatch: ${dispatch.sealNo} vs ${receivedSeal}`
      );

      AuditLogger.log(dispatch.id, 'SEAL_MISMATCH', actor, role,
        dispatch.sealNo, receivedSeal,
        `Tamper risk — seal mismatch detected at destination`);
    } else {
      AuditLogger.log(dispatch.id, 'SEAL_VERIFIED', actor, role,
        null, receivedSeal, 'Seal matches origin manifest');
    }

    return result;
  },
};

/* ═══════════════════════════════════════════════════
   6. ASN VALIDATION ENGINE
═══════════════════════════════════════════════════ */
const ASNValidator = {
  /**
   * Validate ASN number format.
   */
  validateFormat(asn) {
    if (!asn || typeof asn !== 'string') {
      return { valid: false, reason: 'ASN is empty.' };
    }
    const clean = asn.trim().toUpperCase();
    if (!ASN_REGEX.test(clean)) {
      return { valid: false, reason: `"${clean}" does not match ASN format (ASN-YYYY-NNNN).` };
    }
    return { valid: true, reason: '', normalized: clean };
  },

  /**
   * Verify ASN at destination:
   * - Format check
   * - Cross-reference against dispatch record
   * - Duplicate check (same ASN on another open dispatch)
   */
  verify(dispatchId, receivedASN) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return { valid: false, reason: `Dispatch ${dispatchId} not found.` };

    const fmt = this.validateFormat(receivedASN);
    if (!fmt.valid) return { valid: false, reason: fmt.reason };

    const matches = fmt.normalized === (dispatch.asn || '').trim().toUpperCase();
    if (!matches) {
      return {
        valid:         false,
        match:         false,
        reason:        `ASN mismatch: dispatch has "${dispatch.asn}", received "${fmt.normalized}".`,
        dispatchASN:   dispatch.asn,
        receivedASN:   fmt.normalized,
      };
    }

    /* Duplicate check: same ASN on another active dispatch */
    const duplicate = DAL.dispatches.getAll().find(d =>
      d.id !== dispatchId &&
      d.asn?.toUpperCase() === fmt.normalized &&
      !['closed'].includes(d.status)
    );

    return {
      valid:       true,
      match:       true,
      reason:      'ASN verified.',
      duplicate:   duplicate ? duplicate.id : null,
      duplicateWarning: duplicate
        ? `Warning: ASN also active on dispatch ${duplicate.id}.`
        : null,
    };
  },
};

/* ═══════════════════════════════════════════════════
   7. INVOICE VALIDATION ENGINE
═══════════════════════════════════════════════════ */
const InvoiceValidator = {
  /**
   * Validate invoice number format.
   */
  validateFormat(invoice) {
    if (!invoice || typeof invoice !== 'string') {
      return { valid: false, reason: 'Invoice number is empty.' };
    }
    const clean = invoice.trim().toUpperCase();
    if (!INVOICE_REGEX.test(clean)) {
      return { valid: false, reason: `"${clean}" does not match invoice format (INV-YYYY-NNNN).` };
    }
    return { valid: true, reason: '', normalized: clean };
  },

  /**
   * Verify invoice at destination against dispatch record.
   */
  verify(dispatchId, receivedInvoice) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return { valid: false, reason: `Dispatch ${dispatchId} not found.` };

    const fmt = this.validateFormat(receivedInvoice);
    if (!fmt.valid) return { valid: false, reason: fmt.reason };

    const matches = fmt.normalized === (dispatch.invoice || '').trim().toUpperCase();
    return {
      valid:           matches,
      match:           matches,
      reason:          matches
        ? 'Invoice verified.'
        : `Invoice mismatch: dispatch has "${dispatch.invoice}", received "${fmt.normalized}".`,
      dispatchInvoice: dispatch.invoice,
      receivedInvoice: fmt.normalized,
    };
  },
};

/* ═══════════════════════════════════════════════════
   8. RECEIVING CHECKLIST ENGINE
   ─────────────────────────────────────────────────
   Orchestrates all destination checks before
   unloading begins.
═══════════════════════════════════════════════════ */
const ReceivingEngine = {
  /**
   * Run all receiving checks at once.
   * @param {string} dispatchId
   * @param {object} receivingInput
   *   { vehicleReg, sealReceived, invoiceReceived, asnReceived, receivedBy, notes }
   * @param {string} actor
   * @param {string} role
   * @returns {ReceivingResult}
   */
  runChecks(dispatchId, receivingInput, actor, role) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return { success: false, errors: [`Dispatch ${dispatchId} not found.`] };

    const errors   = [];
    const warnings = [];
    const checks   = {};

    /* ── Vehicle check ── */
    const inputReg     = (receivingInput.vehicleReg || '').trim().toUpperCase();
    const manifestReg  = (dispatch.vehicleReg || '').trim().toUpperCase();
    checks.vehicleVerified = inputReg === manifestReg;
    checks.vehicleRegReceived = inputReg;
    if (!checks.vehicleVerified) {
      errors.push(`Vehicle mismatch: expected "${manifestReg}", got "${inputReg}".`);
    }

    /* ── Seal check ── */
    const sealResult = SealValidator.runReceivingCheck(
      dispatch, receivingInput.sealReceived, actor, role
    );
    checks.sealVerified   = true;   // Always marked as "verified" (check was done)
    checks.sealMatch      = sealResult.match;
    checks.sealReceived   = receivingInput.sealReceived;
    if (!sealResult.match) {
      errors.push(sealResult.reason);
    }

    /* ── Invoice check ── */
    const invResult = InvoiceValidator.verify(dispatchId, receivingInput.invoiceReceived);
    checks.invoiceVerified = invResult.valid && invResult.match;
    if (!checks.invoiceVerified) {
      warnings.push(invResult.reason);
    }

    /* ── ASN check ── */
    const asnResult = ASNValidator.verify(dispatchId, receivingInput.asnReceived);
    checks.asnVerified = asnResult.valid && asnResult.match;
    if (!checks.asnVerified) {
      warnings.push(asnResult.reason);
    }
    if (asnResult.duplicateWarning) warnings.push(asnResult.duplicateWarning);

    /* ── Build receivingData object ── */
    const receivingData = {
      ...checks,
      receivedBy:  actor,
      receivedAt:  new Date().toISOString(),
      notes:       receivingInput.notes || '',
      errors,
      warnings,
    };

    /* ── Persist to dispatch (but don't change status yet) ── */
    dispatch.receivingData = receivingData;
    DAL.dispatches.save(dispatch);

    AuditLogger.log(dispatchId, 'RECEIVING_CHECKS_DONE', actor, role,
      null, JSON.stringify(checks),
      `V:${checks.vehicleVerified} S:${checks.sealMatch} I:${checks.invoiceVerified} A:${checks.asnVerified}`);

    const canProceed = checks.vehicleVerified && checks.sealVerified
                    && checks.invoiceVerified && checks.asnVerified;

    return {
      success:      true,
      canProceed,
      receivingData,
      checks,
      errors,
      warnings,
      sealMismatch: !checks.sealMatch,
    };
  },
};

/* ═══════════════════════════════════════════════════
   9. RECONCILIATION ENGINE
   ─────────────────────────────────────────────────
   Orchestrates the full reconciliation workflow:
   1. Run matching engine
   2. Compute discrepancies
   3. Trigger exception hooks
   4. Advance dispatch to "reconciled"
═══════════════════════════════════════════════════ */
const ReconciliationEngine = {
  /**
   * Complete the reconciliation for a dispatch.
   * Computes diff, raises exceptions, advances status.
   *
   * @param {string} dispatchId
   * @param {string[]} receivedHU   - Final list of scanned HUs at destination
   * @param {object} options
   * @param {string} options.actor
   * @param {string} options.role
   * @param {string} options.note
   * @returns {ReconciliationResult}
   */
  complete(dispatchId, receivedHU, options = {}) {
    const { actor = 'System', role = 'warehouse-op', note = '' } = options;

    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return { success: false, errors: [`Dispatch ${dispatchId} not found.`] };

    if (dispatch.status !== 'unloading') {
      return { success: false, errors: [`Cannot reconcile — dispatch is "${dispatch.status}", expected "unloading".`] };
    }

    /* ── Run matching engine ── */
    const matchResult = MatchingEngine.compare(dispatch.huDispatched, receivedHU);

    /* ── Update dispatch with reconciliation data ── */
    dispatch.huReceived           = receivedHU;
    dispatch.huMissing            = matchResult.missing;
    dispatch.huExcess             = matchResult.excess;
    dispatch.reconciliationStatus = matchResult.status;
    dispatch.reconciliationNote   = note || (matchResult.isClean
      ? `All ${matchResult.totalMatched} HUs matched.`
      : `${matchResult.totalMissing} missing, ${matchResult.totalExcess} excess.`);

    DAL.dispatches.save(dispatch);

    /* ── Advance lifecycle to "reconciled" ── */
    const transition = LifecycleEngine.transition(dispatchId, 'reconciled', {
      actor, role, note,
      payload: {
        huReceived:           receivedHU,
        huMissing:            matchResult.missing,
        huExcess:             matchResult.excess,
        reconciliationStatus: matchResult.status,
        reconciliationNote:   dispatch.reconciliationNote,
      },
    });

    if (!transition.success) {
      return { success: false, errors: transition.errors };
    }

    /* ── Mark HU registry as closed ── */
    HURegistry.markClosed(dispatchId, actor, role, dispatch.destId);

    /* ── Generate full report ── */
    const report = MatchingEngine.generateReport(transition.dispatch);

    AuditLogger.log(dispatchId, 'RECONCILIATION_COMPLETE', actor, role,
      'unloading', matchResult.status,
      `${matchResult.totalMatched}/${matchResult.totalDispatched} matched. Missing:${matchResult.totalMissing} Excess:${matchResult.totalExcess}`);

    return {
      success:          true,
      dispatch:         transition.dispatch,
      matchResult,
      report,
      exceptionsRaised: transition.exceptions || [],
    };
  },

  /**
   * Get reconciliation summary for a dispatch.
   */
  getSummary(dispatchId) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return null;
    return {
      dispatchId,
      status:               dispatch.reconciliationStatus,
      totalDispatched:      dispatch.huDispatched?.length || 0,
      totalReceived:        dispatch.huReceived?.length   || 0,
      totalMissing:         dispatch.huMissing?.length    || 0,
      totalExcess:          dispatch.huExcess?.length     || 0,
      missingBarcodes:      dispatch.huMissing   || [],
      excessBarcodes:       dispatch.huExcess    || [],
      reconciledAt:         dispatch.reconciledAt,
      reconciledBy:         dispatch.reconciledBy,
      note:                 dispatch.reconciliationNote,
      sealMatch:            dispatch.receivingData?.sealMatch ?? null,
      receivingChecks:      dispatch.receivingData || null,
    };
  },
};

/* ═══════════════════════════════════════════════════
   10. RECONCILIATION KPIs
═══════════════════════════════════════════════════ */
const ReconciliationKPIs = {
  /**
   * Global reconciliation metrics across all dispatches.
   */
  global() {
    const all          = DAL.dispatches.getAll();
    const reconciled   = all.filter(d => ['reconciled','closed'].includes(d.status));
    const matched      = reconciled.filter(d => d.reconciliationStatus === 'matched');
    const discrepancy  = reconciled.filter(d => d.reconciliationStatus === 'discrepancy');
    const pending      = all.filter(d => d.status === 'unloading');

    const totalMissing = all.reduce((s,d) => s + (d.huMissing?.length  || 0), 0);
    const totalExcess  = all.reduce((s,d) => s + (d.huExcess?.length   || 0), 0);
    const totalHUDisp  = all.reduce((s,d) => s + (d.huDispatched?.length || 0), 0);
    const totalHURcvd  = all.reduce((s,d) => s + (d.huReceived?.length  || 0), 0);

    const sealMismatches = all.filter(d => d.receivingData?.sealMatch === false).length;

    return {
      totalReconciled:    reconciled.length,
      cleanMatches:       matched.length,
      discrepancies:      discrepancy.length,
      pendingReconcile:   pending.length,
      reconcileRate:      reconciled.length
        ? Math.round(matched.length / reconciled.length * 100)
        : null,
      totalHUDispatched:  totalHUDisp,
      totalHUReceived:    totalHURcvd,
      totalHUMissing:     totalMissing,
      totalHUExcess:      totalExcess,
      huAccuracyRate:     totalHUDisp
        ? Math.round((totalHUDisp - totalMissing) / totalHUDisp * 100)
        : null,
      sealMismatches,
      byRoute: this._byRoute(all),
      byCarrier: this._byCarrier(all),
    };
  },

  /** Per-route reconciliation breakdown */
  _byRoute(all) {
    const routes = DAL.routes.getAll();
    return routes.map(r => {
      const rDisp = all.filter(d => d.routeId === r.id && ['reconciled','closed'].includes(d.status));
      const miss  = rDisp.reduce((s,d) => s + (d.huMissing?.length || 0), 0);
      const exc   = rDisp.reduce((s,d) => s + (d.huExcess?.length  || 0), 0);
      return {
        routeId:   r.id,
        routeCode: r.code,
        total:     rDisp.length,
        matched:   rDisp.filter(d => d.reconciliationStatus === 'matched').length,
        missing:   miss,
        excess:    exc,
        rate:      rDisp.length
          ? Math.round(rDisp.filter(d => d.reconciliationStatus === 'matched').length / rDisp.length * 100)
          : null,
      };
    });
  },

  /** Per-carrier reconciliation breakdown */
  _byCarrier(all) {
    const carriers = DAL.carriers.getAll();
    return carriers.map(c => {
      const cDisp = all.filter(d => d.carrierId === c.id && ['reconciled','closed'].includes(d.status));
      const miss  = cDisp.reduce((s,d) => s + (d.huMissing?.length || 0), 0);
      return {
        carrierId:   c.id,
        carrierName: c.name,
        total:       cDisp.length,
        matched:     cDisp.filter(d => d.reconciliationStatus === 'matched').length,
        missing:     miss,
        rate:        cDisp.length
          ? Math.round(cDisp.filter(d => d.reconciliationStatus === 'matched').length / cDisp.length * 100)
          : null,
      };
    });
  },

  /**
   * Per-dispatch reconciliation report list (for data tables).
   */
  dispatchList(filters = {}) {
    let all = DAL.dispatches.getAll()
      .filter(d => ['reconciled','closed','unloading'].includes(d.status));

    if (filters.routeId)   all = all.filter(d => d.routeId   === filters.routeId);
    if (filters.carrierId) all = all.filter(d => d.carrierId === filters.carrierId);
    if (filters.status)    all = all.filter(d => d.reconciliationStatus === filters.status);

    return all.map(d => ({
      dispatchId:      d.id,
      routeCode:       d.routeCode,
      vehicle:         d.vehicleReg,
      carrier:         DAL.carriers.getById(d.carrierId)?.name || d.carrierId,
      dispatched:      d.huDispatched?.length  || 0,
      received:        d.huReceived?.length    || 0,
      missing:         d.huMissing?.length     || 0,
      excess:          d.huExcess?.length      || 0,
      status:          d.reconciliationStatus,
      sealMatch:       d.receivingData?.sealMatch ?? null,
      reconciledAt:    d.reconciledAt,
      reconciledBy:    d.reconciledBy,
    }));
  },

  /**
   * Export-ready flat array for CSV/Excel.
   */
  exportData() {
    return this.dispatchList().map(r => ({
      'Dispatch ID':         r.dispatchId,
      'Route':               r.routeCode,
      'Vehicle':             r.vehicle,
      'Carrier':             r.carrier,
      'HU Dispatched':       r.dispatched,
      'HU Received':         r.received,
      'HU Missing':          r.missing,
      'HU Excess':           r.excess,
      'Recon Status':        r.status,
      'Seal Match':          r.sealMatch === null ? 'N/A' : r.sealMatch ? 'Yes' : 'No',
      'Reconciled At':       r.reconciledAt || '',
      'Reconciled By':       r.reconciledBy || '',
    }));
  },
};

/* ═══════════════════════════════════════════════════
   EXPOSE TO WINDOW.TCT
═══════════════════════════════════════════════════ */
Object.assign(window.TCT, {
  HUValidator,
  HURegistry,
  MatchingEngine,
  SealValidator,
  ASNValidator,
  InvoiceValidator,
  ReceivingEngine,
  ReconciliationEngine,
  ReconciliationKPIs,
  createScanSession,
  ScanSession,
  RECON_STATUS,
  SCAN_RESULT,
});

console.log('[TCT Step 3] HU Reconciliation Engine loaded.');
// → Next module: STEP 4 (await instruction)
