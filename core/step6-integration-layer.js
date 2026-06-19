/**
 * TRANSPORT CONTROL TOWER — STEP 6: ENTERPRISE INTEGRATION LAYER
 * ================================================================
 * Depends on: step1, step2, step3, step4, step5
 *
 * Responsibilities:
 *  1. ERP Integration Framework        (SAP / Oracle / Custom)
 *  2. WMS Integration Framework        (dispatch, HU, ASN, inventory)
 *  3. Carrier Integration Framework    (shipment, vehicle, tracking, POD)
 *  4. Notification Engine              (Email / SMS / WhatsApp)
 *  5. Webhook Framework                (publish, subscribe, retry, failure)
 *  6. Event Bus Layer                  (standardised domain events)
 *  7. API Security Layer               (API key / OAuth / JWT / rate limiting)
 *  8. Integration Monitoring           (success, failure, retry, latency)
 *
 * Architecture notes
 * ─────────────────────────────────────────────────────────────────
 * All outbound calls are SIMULATED (no real HTTP).  The IntegrationBus
 * dispatches calls through IntegrationMonitor, which records every
 * attempt, then hands off to the registered adapter.  Adapters are
 * pure functions that return { success, data, error, latencyMs }.
 * Real adapters (HTTP fetch) can be dropped in without changing callers.
 *
 * Persistence: all framework state (subscriptions, API keys, rate
 * limit counters, retry queues, event log) lives in localStorage
 * under the `tct_intg_*` key namespace so it survives page reload.
 */

'use strict';

if (!window.TCT?.DAL || !window.TCT?.LifecycleEngine || !window.TCT?.PlanningAnalytics) {
  throw new Error('[TCT Step 6] Steps 1–5 must be loaded first.');
}

const { DAL, DB, EventBus, EVENTS, ExceptionFactory } = window.TCT;

/* ═══════════════════════════════════════════════════
   STORAGE KEYS
═══════════════════════════════════════════════════ */
const IKEYS = {
  ADAPTERS:        'tct_intg_adapters',
  API_KEYS:        'tct_intg_api_keys',
  OAUTH_TOKENS:    'tct_intg_oauth_tokens',
  RATE_COUNTERS:   'tct_intg_rate_counters',
  WEBHOOK_SUBS:    'tct_intg_webhook_subs',
  RETRY_QUEUE:     'tct_intg_retry_queue',
  EVENT_LOG:       'tct_intg_event_log',
  MONITOR_LOG:     'tct_intg_monitor_log',
  NOTIF_LOG:       'tct_intg_notif_log',
};

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
const ERP_SYSTEMS   = { SAP: 'sap', ORACLE: 'oracle', CUSTOM: 'custom' };
const WMS_SYSTEMS   = { MANHATTAN: 'manhattan', BLUE_YONDER: 'blue-yonder', CUSTOM: 'custom' };
const CARRIER_SYSTEMS = { DTDC: 'dtdc', BLUEDART: 'bluedart', DELHIVERY: 'delhivery', CUSTOM: 'custom' };

const NOTIF_CHANNELS  = { EMAIL: 'email', SMS: 'sms', WHATSAPP: 'whatsapp' };
const NOTIF_EVENTS    = {
  DISPATCH_CREATED:       'dispatch.created',
  DISPATCH_DELAYED:       'dispatch.delayed',
  SLA_BREACH:             'dispatch.sla_breach',
  ARRIVAL:                'dispatch.arrived',
  RECONCILIATION_COMPLETE:'dispatch.reconciled',
};

const AUTH_METHODS  = { API_KEY: 'api_key', OAUTH2: 'oauth2', JWT: 'jwt' };
const MAX_RETRY     = 3;
const RETRY_DELAYS  = [5000, 15000, 60000];      // ms: 5s, 15s, 60s
const RATE_WINDOW   = 60000;                     // 1 minute rolling window

/* ═══════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════ */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function now() { return new Date().toISOString(); }

function dbGet(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function dbSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

function appendLog(key, entry, limit = 500) {
  const log = dbGet(key, []);
  log.unshift(entry);
  if (log.length > limit) log.length = limit;
  dbSet(key, log);
}

/* Simulate network latency */
function fakeLatency() { return Math.round(80 + Math.random() * 320); }

/* Simulate 90% success rate for adapters in demo mode */
function simulateResponse(payload) {
  const ok = Math.random() > 0.10;
  return {
    success:   ok,
    data:      ok ? { ackId: uuid(), timestamp: now(), ...payload } : null,
    error:     ok ? null : 'Simulated adapter error: upstream timeout',
    latencyMs: fakeLatency(),
  };
}

/* ═══════════════════════════════════════════════════
   1. ERP INTEGRATION FRAMEWORK
   ─────────────────────────────────────────────────
   Adapter registry pattern.  Each ERP system has a
   named adapter (function).  Callers invoke send()
   with an object type + payload; the bus routes to
   the registered adapter or the default simulator.
═══════════════════════════════════════════════════ */
const ERPAdapter = {

  /* Object-type mappers — normalise TCT entities to generic ERP payload */
  _mappers: {
    dispatch(dispatch) {
      return {
        externalRef:   dispatch.id,
        type:          'SHIPMENT_ORDER',
        origin:        dispatch.originId,
        destination:   dispatch.destId,
        plannedDep:    dispatch.plannedDeparture,
        plannedArr:    dispatch.plannedArrival,
        huCount:       dispatch.huDispatched?.length || 0,
        weightKg:      dispatch.totalWeightKg || 0,
        status:        dispatch.status,
        carrierId:     dispatch.carrierId,
        vehicleReg:    dispatch.vehicleReg,
      };
    },
    shipment(dispatch) {
      return {
        externalRef:   dispatch.id,
        type:          'SHIPMENT',
        sealNo:        dispatch.sealNo,
        asnNo:         dispatch.asnNo,
        invoiceNo:     dispatch.invoiceNo,
        hu:            dispatch.huDispatched || [],
      };
    },
    invoice(dispatch) {
      return {
        externalRef:   dispatch.id,
        invoiceNo:     dispatch.invoiceNo,
        amount:        dispatch.invoiceValue,
        currency:      'INR',
        date:          dispatch.invoiceDate,
        status:        dispatch.status === 'closed' ? 'POSTED' : 'PENDING',
      };
    },
    inventory(dispatch) {
      return {
        externalRef:   dispatch.id,
        items:         (dispatch.huDispatched || []).map(hu => ({
          barcode:     hu,
          locationId:  dispatch.status === 'closed' ? dispatch.destId : dispatch.originId,
          status:      dispatch.status,
        })),
      };
    },
  },

  /**
   * Registered ERP adapter functions.
   * Key: `${erpSystem}:${objectType}`
   * Value: fn(payload) → { success, data, error, latencyMs }
   */
  _registry: {},

  /**
   * Register a custom adapter.
   * @param {string} erpSystem  - ERP_SYSTEMS value
   * @param {string} objectType - 'dispatch' | 'shipment' | 'invoice' | 'inventory'
   * @param {Function} adapterFn
   */
  register(erpSystem, objectType, adapterFn) {
    this._registry[`${erpSystem}:${objectType}`] = adapterFn;
    const cfg = dbGet(IKEYS.ADAPTERS, {});
    cfg[`${erpSystem}:${objectType}`] = { registered: now(), system: erpSystem, objectType };
    dbSet(IKEYS.ADAPTERS, cfg);
  },

  /**
   * Send an ERP object. Routes to registered adapter or simulator.
   * @param {string} erpSystem
   * @param {string} objectType  - 'dispatch' | 'shipment' | 'invoice' | 'inventory'
   * @param {string} dispatchId
   * @returns {IntegrationResult}
   */
  send(erpSystem, objectType, dispatchId) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return IntegrationMonitor._fail(`ERP:${erpSystem}`, 'Dispatch not found', dispatchId);

    const mapper  = this._mappers[objectType];
    if (!mapper)  return IntegrationMonitor._fail(`ERP:${erpSystem}`, `Unknown object type: ${objectType}`, dispatchId);

    const payload = mapper(dispatch);
    const key     = `${erpSystem}:${objectType}`;
    const adapter = this._registry[key] || (() => simulateResponse(payload));

    return IntegrationMonitor.execute({
      system:     `ERP:${erpSystem.toUpperCase()}`,
      objectType,
      dispatchId,
      payload,
      adapter,
    });
  },

  /**
   * Bulk sync all dispatches of a given status to ERP.
   */
  bulkSync(erpSystem, objectType, statusFilter = []) {
    const dispatches = DAL.dispatches.getAll()
      .filter(d => !statusFilter.length || statusFilter.includes(d.status));
    return dispatches.map(d => this.send(erpSystem, objectType, d.id));
  },

  listRegistered() {
    return dbGet(IKEYS.ADAPTERS, {});
  },
};

/* ═══════════════════════════════════════════════════
   2. WMS INTEGRATION FRAMEWORK
═══════════════════════════════════════════════════ */
const WMSAdapter = {

  _registry: {},

  register(wmsSystem, operation, adapterFn) {
    this._registry[`${wmsSystem}:${operation}`] = adapterFn;
  },

  /**
   * Push a new dispatch to WMS.
   */
  createDispatch(wmsSystem, dispatchId) {
    const d = DAL.dispatches.getById(dispatchId);
    if (!d) return IntegrationMonitor._fail(`WMS:${wmsSystem}`, 'Dispatch not found', dispatchId);

    const payload = {
      wmsRef:         uuid(),
      dispatchId:     d.id,
      routeCode:      d.routeCode,
      originId:       d.originId,
      destId:         d.destId,
      plannedDep:     d.plannedDeparture,
      hu:             d.huDispatched || [],
      huCount:        d.huDispatched?.length || 0,
      totalWeightKg:  d.totalWeightKg || 0,
      totalCbm:       d.totalCbm || 0,
    };

    return IntegrationMonitor.execute({
      system:     `WMS:${wmsSystem.toUpperCase()}`,
      objectType: 'dispatch-create',
      dispatchId,
      payload,
      adapter:    this._registry[`${wmsSystem}:dispatch-create`] || (() => simulateResponse(payload)),
    });
  },

  /**
   * Register one or more HUs in WMS inventory.
   */
  createHU(wmsSystem, dispatchId, barcodes = []) {
    const d = DAL.dispatches.getById(dispatchId);
    const payload = {
      dispatchId,
      barcodes,
      locationId: d?.originId,
      status:     'OUTBOUND',
      timestamp:  now(),
    };

    return IntegrationMonitor.execute({
      system:     `WMS:${wmsSystem.toUpperCase()}`,
      objectType: 'hu-create',
      dispatchId,
      payload,
      adapter:    this._registry[`${wmsSystem}:hu-create`] || (() => simulateResponse(payload)),
    });
  },

  /**
   * Validate inventory availability in WMS before dispatch.
   * Returns { valid, shortage, items }
   */
  validateInventory(wmsSystem, dispatchId) {
    const d = DAL.dispatches.getById(dispatchId);
    if (!d) return { valid: false, error: 'Dispatch not found' };

    const payload = {
      dispatchId,
      originId:   d.originId,
      hu:         d.huDispatched || [],
    };

    const result = IntegrationMonitor.execute({
      system:     `WMS:${wmsSystem.toUpperCase()}`,
      objectType: 'inventory-validate',
      dispatchId,
      payload,
      adapter:    this._registry[`${wmsSystem}:inventory-validate`] || (() => ({
        ...simulateResponse(payload),
        data: { valid: true, shortage: [], items: payload.hu.map(hu => ({ barcode: hu, available: true })) },
      })),
    });

    return result;
  },

  /**
   * Sync ASN from WMS.
   */
  syncASN(wmsSystem, dispatchId) {
    const d = DAL.dispatches.getById(dispatchId);
    const payload = { dispatchId, asnNo: d?.asnNo, timestamp: now() };

    return IntegrationMonitor.execute({
      system:     `WMS:${wmsSystem.toUpperCase()}`,
      objectType: 'asn-sync',
      dispatchId,
      payload,
      adapter:    this._registry[`${wmsSystem}:asn-sync`] || (() => simulateResponse(payload)),
    });
  },
};

/* ═══════════════════════════════════════════════════
   3. CARRIER INTEGRATION FRAMEWORK
═══════════════════════════════════════════════════ */
const CarrierAdapter = {

  _registry: {},

  register(carrierSystem, operation, adapterFn) {
    this._registry[`${carrierSystem}:${operation}`] = adapterFn;
  },

  /**
   * Create a shipment booking with the carrier.
   */
  createShipment(carrierSystem, dispatchId) {
    const d = DAL.dispatches.getById(dispatchId);
    if (!d) return IntegrationMonitor._fail(`CARRIER:${carrierSystem}`, 'Dispatch not found', dispatchId);

    const payload = {
      tctRef:       d.id,
      origin:       d.originId,
      destination:  d.destId,
      vehicleReg:   d.vehicleReg,
      sealNo:       d.sealNo,
      huCount:      d.huDispatched?.length || 0,
      weightKg:     d.totalWeightKg || 0,
      plannedDep:   d.plannedDeparture,
      plannedArr:   d.plannedArrival,
    };

    return IntegrationMonitor.execute({
      system:     `CARRIER:${carrierSystem.toUpperCase()}`,
      objectType: 'shipment-create',
      dispatchId,
      payload,
      adapter:    this._registry[`${carrierSystem}:shipment-create`] || (() => ({
        ...simulateResponse(payload),
        data: { docketNo: `DKT-${Date.now().toString(36).toUpperCase()}`, ...payload },
      })),
    });
  },

  /**
   * Assign a vehicle to a carrier shipment.
   */
  assignVehicle(carrierSystem, dispatchId, vehicleId) {
    const d = DAL.dispatches.getById(dispatchId);
    const v = DAL.vehicles.getById(vehicleId);
    const payload = {
      dispatchId,
      vehicleId,
      vehicleReg: v?.registration,
      vehicleType: v?.type,
      driverId:   v?.driverId,
      driverName: v?.driverName,
      driverPhone: v?.driverPhone,
    };

    return IntegrationMonitor.execute({
      system:     `CARRIER:${carrierSystem.toUpperCase()}`,
      objectType: 'vehicle-assign',
      dispatchId,
      payload,
      adapter:    this._registry[`${carrierSystem}:vehicle-assign`] || (() => simulateResponse(payload)),
    });
  },

  /**
   * Push a real-time tracking update.
   * @param {object} update { dispatchId, lat, lng, speedKmh, locationName, timestamp }
   */
  pushTrackingUpdate(carrierSystem, update) {
    const payload = { ...update, source: 'TCT', receivedAt: now() };

    const result = IntegrationMonitor.execute({
      system:     `CARRIER:${carrierSystem.toUpperCase()}`,
      objectType: 'tracking-update',
      dispatchId: update.dispatchId,
      payload,
      adapter:    this._registry[`${carrierSystem}:tracking-update`] || (() => simulateResponse(payload)),
    });

    /* Persist tracking snapshot on dispatch record */
    if (result.success && update.dispatchId) {
      const d = DAL.dispatches.getById(update.dispatchId);
      if (d) {
        const trail = d.trackingTrail || [];
        trail.push({ ...update, recordedAt: now() });
        DAL.dispatches.save({ ...d, trackingTrail: trail, lastTrackedAt: now() });
      }
    }

    return result;
  },

  /**
   * Receive and persist a Proof of Delivery (POD) update from carrier.
   * @param {object} pod { dispatchId, podRef, receivedBy, signatureUrl, timestamp, remarks }
   */
  receivePOD(carrierSystem, pod) {
    const d = DAL.dispatches.getById(pod.dispatchId);
    if (!d) return IntegrationMonitor._fail(`CARRIER:${carrierSystem}`, 'Dispatch not found', pod.dispatchId);

    const payload = { ...pod, carrier: carrierSystem, receivedAt: now() };

    const result = IntegrationMonitor.execute({
      system:     `CARRIER:${carrierSystem.toUpperCase()}`,
      objectType: 'pod-update',
      dispatchId: pod.dispatchId,
      payload,
      adapter:    this._registry[`${carrierSystem}:pod-update`] || (() => simulateResponse(payload)),
    });

    if (result.success) {
      DAL.dispatches.save({ ...d, pod: payload, podReceivedAt: now() });
    }

    return result;
  },
};

/* ═══════════════════════════════════════════════════
   4. NOTIFICATION ENGINE
   ─────────────────────────────────────────────────
   Template-driven, channel-agnostic.
   Channel adapters are registered per channel.
   Supports per-event recipient lists.
═══════════════════════════════════════════════════ */
const NotificationEngine = {

  /* Templates per event × channel */
  _templates: {
    [NOTIF_EVENTS.DISPATCH_CREATED]: {
      email:     (d) => ({
        subject: `[TCT] Dispatch ${d.id} Created — ${d.routeCode}`,
        body:    `Dispatch ${d.id} has been created for route ${d.routeCode}.\n\nPlanned Departure: ${d.plannedDeparture}\nPlanned Arrival: ${d.plannedArrival}\nHU Count: ${d.huDispatched?.length||0}\nVehicle: ${d.vehicleReg||'TBA'}`,
      }),
      sms:       (d) => `TCT: Dispatch ${d.id} created. Route ${d.routeCode}. Dep: ${d.plannedDeparture?.slice(0,10)}.`,
      whatsapp:  (d) => `*New Dispatch* 📦\nID: ${d.id}\nRoute: ${d.routeCode}\nDep: ${d.plannedDeparture?.slice(0,10)}\nHU: ${d.huDispatched?.length||0} units`,
    },
    [NOTIF_EVENTS.DISPATCH_DELAYED]: {
      email:     (d) => ({
        subject: `⚠️ [TCT] Dispatch ${d.id} DELAYED — ${d.routeCode}`,
        body:    `Dispatch ${d.id} on route ${d.routeCode} has been delayed.\n\nExpected: ${d.plannedArrival}\nCurrent Status: ${d.status}\nPlease take corrective action.`,
      }),
      sms:       (d) => `ALERT: Dispatch ${d.id} delayed. Route ${d.routeCode}. Check TCT.`,
      whatsapp:  (d) => `*⚠️ Dispatch Delayed*\nID: ${d.id}\nRoute: ${d.routeCode}\nStatus: ${d.status}`,
    },
    [NOTIF_EVENTS.SLA_BREACH]: {
      email:     (d) => ({
        subject: `🚨 [TCT] SLA BREACH — Dispatch ${d.id}`,
        body:    `CRITICAL: Dispatch ${d.id} has breached its SLA commitment.\n\nRoute: ${d.routeCode}\nPlanned Arrival: ${d.plannedArrival}\nImmediate escalation required.`,
      }),
      sms:       (d) => `🚨 SLA BREACH: Dispatch ${d.id} Route ${d.routeCode}. Immediate action needed.`,
      whatsapp:  (d) => `*🚨 SLA BREACH — CRITICAL*\nDispatch: ${d.id}\nRoute: ${d.routeCode}\nPlanned Arrival: ${d.plannedArrival}\nACTION REQUIRED`,
    },
    [NOTIF_EVENTS.ARRIVAL]: {
      email:     (d) => ({
        subject: `✅ [TCT] Dispatch ${d.id} Arrived — ${d.routeCode}`,
        body:    `Dispatch ${d.id} has arrived at destination.\n\nActual Arrival: ${d.actualArrival}\nRoute: ${d.routeCode}\nOTA Status: ${d.otaStatus||'pending'}`,
      }),
      sms:       (d) => `TCT: Dispatch ${d.id} arrived. OTA: ${d.otaStatus||'TBD'}.`,
      whatsapp:  (d) => `*✅ Dispatch Arrived*\nID: ${d.id}\nRoute: ${d.routeCode}\nOTA: ${d.otaStatus||'TBD'}`,
    },
    [NOTIF_EVENTS.RECONCILIATION_COMPLETE]: {
      email:     (d) => ({
        subject: `[TCT] Reconciliation Complete — Dispatch ${d.id}`,
        body:    `Reconciliation for Dispatch ${d.id} is complete.\n\nStatus: ${d.reconciliationStatus||'N/A'}\nMatch Rate: ${d.matchRate||0}%\nRoute: ${d.routeCode}`,
      }),
      sms:       (d) => `TCT: Dispatch ${d.id} reconciled. Match: ${d.matchRate||0}%.`,
      whatsapp:  (d) => `*Reconciliation Done*\nDispatch: ${d.id}\nMatch Rate: ${d.matchRate||0}%\nStatus: ${d.reconciliationStatus}`,
    },
  },

  /* Channel adapter registry */
  _channelAdapters: {},

  /**
   * Register a channel delivery adapter.
   * fn(to, message) → { success, messageId }
   */
  registerChannel(channel, adapterFn) {
    this._channelAdapters[channel] = adapterFn;
  },

  /**
   * Override a template for a specific event + channel.
   */
  setTemplate(event, channel, templateFn) {
    if (!this._templates[event]) this._templates[event] = {};
    this._templates[event][channel] = templateFn;
  },

  /**
   * Send a notification for an event.
   * @param {string} event     - NOTIF_EVENTS value
   * @param {string} dispatchId
   * @param {object[]} recipients  - [{ channel: 'email'|'sms'|'whatsapp', to: string }]
   */
  send(event, dispatchId, recipients = []) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return [{ success: false, error: 'Dispatch not found' }];
    if (!recipients.length) return [{ success: false, error: 'No recipients specified' }];

    const results = [];

    recipients.forEach(({ channel, to }) => {
      const templateMap = this._templates[event];
      if (!templateMap || !templateMap[channel]) {
        results.push({ channel, to, success: false, error: `No template for ${event}:${channel}` });
        return;
      }

      const message = templateMap[channel](dispatch);
      const adapter = this._channelAdapters[channel] || this._defaultAdapter;
      const result  = adapter(to, message, channel);
      const logEntry = {
        id:         uuid(),
        event,
        dispatchId,
        channel,
        to,
        message,
        ...result,
        sentAt:     now(),
      };

      appendLog(IKEYS.NOTIF_LOG, logEntry);
      results.push(logEntry);
    });

    return results;
  },

  _defaultAdapter(to, message, channel) {
    /* Simulated delivery — replace with real Twilio/SES/etc in production */
    const ok = Math.random() > 0.05;
    return {
      success:   ok,
      messageId: ok ? `MSG-${uuid().slice(0,8)}` : null,
      error:     ok ? null : `Simulated ${channel} delivery failure to ${to}`,
      latencyMs: fakeLatency(),
    };
  },

  /**
   * Send to all default contacts of a dispatch's carrier.
   */
  notifyCarrierContacts(event, dispatchId) {
    const d       = DAL.dispatches.getById(dispatchId);
    const carrier = d ? DAL.carriers.getById(d.carrierId) : null;
    if (!carrier) return [];

    const recipients = [];
    if (carrier.contactEmail) recipients.push({ channel: NOTIF_CHANNELS.EMAIL,    to: carrier.contactEmail });
    if (carrier.contactPhone) recipients.push({ channel: NOTIF_CHANNELS.SMS,      to: carrier.contactPhone });
    if (carrier.whatsapp)     recipients.push({ channel: NOTIF_CHANNELS.WHATSAPP, to: carrier.whatsapp });

    return this.send(event, dispatchId, recipients);
  },

  getLog(limit = 100) {
    return dbGet(IKEYS.NOTIF_LOG, []).slice(0, limit);
  },
};

/* ═══════════════════════════════════════════════════
   5. WEBHOOK FRAMEWORK
   ─────────────────────────────────────────────────
   Subscriptions stored in localStorage.
   Retry queue processed via processRetryQueue().
   No real HTTP — simulated; swap simulateResponse
   for fetch() in production.
═══════════════════════════════════════════════════ */
const WebhookFramework = {

  /**
   * Subscribe to an event.
   * @param {string} event       - Domain event name (from DomainEventBus.EVENTS)
   * @param {string} callbackUrl - Webhook endpoint URL
   * @param {object} options     - { secret, headers, active }
   * @returns {string} subscriptionId
   */
  subscribe(event, callbackUrl, options = {}) {
    const subs = dbGet(IKEYS.WEBHOOK_SUBS, {});
    const id   = uuid();
    subs[id] = {
      id,
      event,
      callbackUrl,
      secret:    options.secret   || null,
      headers:   options.headers  || {},
      active:    options.active   !== false,
      createdAt: now(),
      stats:     { success: 0, failure: 0, retries: 0 },
    };
    dbSet(IKEYS.WEBHOOK_SUBS, subs);
    return id;
  },

  /**
   * Unsubscribe.
   */
  unsubscribe(subscriptionId) {
    const subs = dbGet(IKEYS.WEBHOOK_SUBS, {});
    if (!subs[subscriptionId]) return false;
    delete subs[subscriptionId];
    dbSet(IKEYS.WEBHOOK_SUBS, subs);
    return true;
  },

  /**
   * Pause / resume a subscription.
   */
  setActive(subscriptionId, active) {
    const subs = dbGet(IKEYS.WEBHOOK_SUBS, {});
    if (!subs[subscriptionId]) return false;
    subs[subscriptionId].active = active;
    dbSet(IKEYS.WEBHOOK_SUBS, subs);
    return true;
  },

  /**
   * Publish an event to all active matching subscribers.
   * @param {string} event
   * @param {object} payload
   */
  publish(event, payload) {
    const subs    = dbGet(IKEYS.WEBHOOK_SUBS, {});
    const results = [];

    Object.values(subs)
      .filter(s => s.active && (s.event === event || s.event === '*'))
      .forEach(sub => {
        const result = this._deliver(sub, event, payload);
        results.push({ subscriptionId: sub.id, ...result });

        /* Update stats */
        const fresh = dbGet(IKEYS.WEBHOOK_SUBS, {});
        if (fresh[sub.id]) {
          if (result.success) fresh[sub.id].stats.success++;
          else {
            fresh[sub.id].stats.failure++;
            this._enqueueRetry(sub, event, payload, 0);
          }
          dbSet(IKEYS.WEBHOOK_SUBS, fresh);
        }
      });

    return results;
  },

  /**
   * Process the retry queue (call from a setInterval or periodic job).
   */
  processRetryQueue() {
    const queue = dbGet(IKEYS.RETRY_QUEUE, []);
    const now_ms = Date.now();
    const remaining = [];
    const processed = [];

    queue.forEach(item => {
      if (item.nextRetryAt > now_ms) { remaining.push(item); return; }

      const subs = dbGet(IKEYS.WEBHOOK_SUBS, {});
      const sub  = subs[item.subscriptionId];
      if (!sub || !sub.active) return;   // dropped

      const result = this._deliver(sub, item.event, item.payload);
      processed.push({ ...item, result });

      if (result.success) {
        if (subs[item.subscriptionId]) {
          subs[item.subscriptionId].stats.success++;
          subs[item.subscriptionId].stats.retries++;
          dbSet(IKEYS.WEBHOOK_SUBS, subs);
        }
      } else if (item.attempt < MAX_RETRY - 1) {
        remaining.push({
          ...item,
          attempt:     item.attempt + 1,
          nextRetryAt: Date.now() + RETRY_DELAYS[item.attempt + 1],
        });
        if (subs[item.subscriptionId]) {
          subs[item.subscriptionId].stats.retries++;
          dbSet(IKEYS.WEBHOOK_SUBS, subs);
        }
      } else {
        /* Max retries exhausted — mark dead */
        IntegrationMonitor._log({
          system:   'WEBHOOK',
          status:   'dead-letter',
          event:    item.event,
          subId:    item.subscriptionId,
          attempts: MAX_RETRY,
          lastError:result.error,
          timestamp: now(),
        });
      }
    });

    dbSet(IKEYS.RETRY_QUEUE, remaining);
    return { processed: processed.length, remaining: remaining.length };
  },

  _deliver(sub, event, payload) {
    /* Build canonical webhook body */
    const body = {
      id:          uuid(),
      event,
      timestamp:   now(),
      callbackUrl: sub.callbackUrl,
      payload,
      signature:   sub.secret ? this._sign(JSON.stringify(payload), sub.secret) : null,
    };

    /* Simulate HTTP POST */
    const result = simulateResponse(body);
    appendLog(IKEYS.EVENT_LOG, {
      subId:    sub.id,
      event,
      success:  result.success,
      latencyMs:result.latencyMs,
      timestamp: now(),
    });

    return result;
  },

  _enqueueRetry(sub, event, payload, attempt) {
    const queue = dbGet(IKEYS.RETRY_QUEUE, []);
    queue.push({
      subscriptionId: sub.id,
      event,
      payload,
      attempt,
      nextRetryAt: Date.now() + RETRY_DELAYS[attempt],
      enqueuedAt: now(),
    });
    dbSet(IKEYS.RETRY_QUEUE, queue);
  },

  _sign(data, secret) {
    /* HMAC simulation — replace with SubtleCrypto in production */
    let hash = 0;
    const str = secret + data;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `sha256=${Math.abs(hash).toString(16).padStart(8,'0')}`;
  },

  listSubscriptions() {
    return Object.values(dbGet(IKEYS.WEBHOOK_SUBS, {}));
  },

  getRetryQueue() {
    return dbGet(IKEYS.RETRY_QUEUE, []);
  },
};

/* ═══════════════════════════════════════════════════
   6. DOMAIN EVENT BUS
   ─────────────────────────────────────────────────
   Standardised domain events that bridge the internal
   EventBus (step 2) with the Webhook + Notification
   layers.  Every domain event:
     - Logs to event log
     - Fires through NotificationEngine
     - Publishes through WebhookFramework
═══════════════════════════════════════════════════ */
const DomainEventBus = {

  EVENTS: {
    DISPATCH_CREATED:         'DispatchCreated',
    DISPATCH_DEPARTED:        'DispatchDeparted',
    DISPATCH_ARRIVED:         'DispatchArrived',
    EXCEPTION_RAISED:         'ExceptionRaised',
    RECONCILIATION_COMPLETED: 'ReconciliationCompleted',
    DISPATCH_DELAYED:         'DispatchDelayed',
    SLA_BREACHED:             'SLABreached',
    POD_RECEIVED:             'PODReceived',
    TRACKING_UPDATED:         'TrackingUpdated',
  },

  /* Notification event mapping: domain event → NOTIF_EVENTS */
  _notifMap: {
    DispatchCreated:         NOTIF_EVENTS.DISPATCH_CREATED,
    DispatchDelayed:         NOTIF_EVENTS.DISPATCH_DELAYED,
    SLABreached:             NOTIF_EVENTS.SLA_BREACH,
    DispatchArrived:         NOTIF_EVENTS.ARRIVAL,
    ReconciliationCompleted: NOTIF_EVENTS.RECONCILIATION_COMPLETE,
  },

  /* Default recipient resolver — override for real contact directory */
  _recipientResolver: null,

  setRecipientResolver(fn) {
    this._recipientResolver = fn;
  },

  /**
   * Emit a standardised domain event.
   * @param {string} eventName  - DomainEventBus.EVENTS value
   * @param {object} context    - { dispatchId, ...extra }
   */
  emit(eventName, context = {}) {
    const envelope = {
      id:        uuid(),
      event:     eventName,
      version:   '1.0',
      source:    'TCT',
      timestamp: now(),
      context,
    };

    appendLog(IKEYS.EVENT_LOG, envelope);

    /* Forward to webhook subscribers */
    WebhookFramework.publish(eventName, envelope);

    /* Forward to notification engine if mapped */
    const notifEvent = this._notifMap[eventName];
    if (notifEvent && context.dispatchId) {
      const recipients = this._recipientResolver
        ? this._recipientResolver(eventName, context.dispatchId)
        : [];
      if (recipients.length) {
        NotificationEngine.send(notifEvent, context.dispatchId, recipients);
      }
      /* Always notify carrier contacts for key events */
      if ([
        DomainEventBus.EVENTS.SLA_BREACHED,
        DomainEventBus.EVENTS.DISPATCH_ARRIVED,
      ].includes(eventName)) {
        NotificationEngine.notifyCarrierContacts(notifEvent, context.dispatchId);
      }
    }

    return envelope;
  },

  getEventLog(limit = 200) {
    return dbGet(IKEYS.EVENT_LOG, []).slice(0, limit);
  },

  /* Wire into internal EventBus (step 2) */
  _wireInternalBus() {
    if (!EventBus) return;
    EventBus.on(EVENTS.STATUS_CHANGED, ({ dispatchId, toStatus }) => {
      if (toStatus === 'dispatched') {
        this.emit(this.EVENTS.DISPATCH_DEPARTED, { dispatchId, toStatus });
      } else if (toStatus === 'arrived') {
        this.emit(this.EVENTS.DISPATCH_ARRIVED, { dispatchId, toStatus });
      } else if (toStatus === 'planned') {
        this.emit(this.EVENTS.DISPATCH_CREATED, { dispatchId, toStatus });
      }
    });
    EventBus.on(EVENTS.SLA_BREACHED, ({ dispatchId }) => {
      this.emit(this.EVENTS.SLA_BREACHED, { dispatchId });
    });
    EventBus.on(EVENTS.EXCEPTION_TRIGGERED, ({ dispatchId, exceptionId }) => {
      this.emit(this.EVENTS.EXCEPTION_RAISED, { dispatchId, exceptionId });
    });
  },
};

/* ═══════════════════════════════════════════════════
   7. API SECURITY LAYER
   ─────────────────────────────────────────────────
   All security objects stored in localStorage.
   JWTs use a simple base64+HMAC simulation.
   OAuth2 stores tokens with expiry.
   Rate limiter uses a sliding-window counter.
═══════════════════════════════════════════════════ */
const APISecurityLayer = {

  /* ── API Key management ── */
  APIKeys: {
    generate(label, scopes = [], rateLimit = 100) {
      const keys = dbGet(IKEYS.API_KEYS, {});
      const key  = `tct-${uuid().replace(/-/g,'')}`;
      const meta = {
        key,
        label,
        scopes,          // e.g. ['read:dispatch', 'write:dispatch']
        rateLimit,       // requests per minute
        active:    true,
        createdAt: now(),
        lastUsed:  null,
        callCount: 0,
      };
      keys[key] = meta;
      dbSet(IKEYS.API_KEYS, keys);
      return meta;
    },

    validate(key, requiredScope = null) {
      const keys = dbGet(IKEYS.API_KEYS, {});
      const meta = keys[key];
      if (!meta || !meta.active) return { valid: false, reason: 'API key not found or inactive' };
      if (requiredScope && !meta.scopes.includes(requiredScope) && !meta.scopes.includes('*')) {
        return { valid: false, reason: `Insufficient scope. Required: ${requiredScope}` };
      }
      /* Rate limit check */
      const ratePassed = RateLimiter.check(key, meta.rateLimit);
      if (!ratePassed.allowed) return { valid: false, reason: ratePassed.reason };

      /* Update usage */
      meta.lastUsed = now();
      meta.callCount++;
      keys[key] = meta;
      dbSet(IKEYS.API_KEYS, keys);
      return { valid: true, meta };
    },

    revoke(key) {
      const keys = dbGet(IKEYS.API_KEYS, {});
      if (!keys[key]) return false;
      keys[key].active = false;
      dbSet(IKEYS.API_KEYS, keys);
      return true;
    },

    list() { return Object.values(dbGet(IKEYS.API_KEYS, {})); },
  },

  /* ── OAuth 2.0 token store ── */
  OAuth: {
    storeToken(clientId, tokenData) {
      const tokens = dbGet(IKEYS.OAUTH_TOKENS, {});
      tokens[clientId] = {
        clientId,
        accessToken:  tokenData.access_token || uuid(),
        refreshToken: tokenData.refresh_token || uuid(),
        expiresAt:    Date.now() + (tokenData.expires_in || 3600) * 1000,
        scopes:       tokenData.scope?.split(' ') || [],
        storedAt:     now(),
      };
      dbSet(IKEYS.OAUTH_TOKENS, tokens);
      return tokens[clientId];
    },

    getToken(clientId) {
      const tokens = dbGet(IKEYS.OAUTH_TOKENS, {});
      const token  = tokens[clientId];
      if (!token) return { valid: false, reason: 'No token for client' };
      if (Date.now() > token.expiresAt) return { valid: false, reason: 'Token expired', expired: true };
      return { valid: true, token };
    },

    revokeToken(clientId) {
      const tokens = dbGet(IKEYS.OAUTH_TOKENS, {});
      delete tokens[clientId];
      dbSet(IKEYS.OAUTH_TOKENS, tokens);
    },

    /* Simulate token refresh */
    refreshToken(clientId) {
      const result = this.getToken(clientId);
      if (result.valid) return result;
      /* Simulate re-auth */
      return this.storeToken(clientId, { expires_in: 3600 });
    },
  },

  /* ── JWT ── */
  JWT: {
    _secret: 'TCT_JWT_SECRET_CHANGE_IN_PRODUCTION',

    setSecret(s) { this._secret = s; },

    sign(payload, expiresInSec = 3600) {
      const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body    = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + expiresInSec }));
      const sig     = this._hmac(`${header}.${body}`, this._secret);
      return `${header}.${body}.${sig}`;
    },

    verify(token) {
      try {
        const [header, body, sig] = token.split('.');
        const expectedSig = this._hmac(`${header}.${body}`, this._secret);
        if (sig !== expectedSig) return { valid: false, reason: 'Invalid signature' };
        const claims = JSON.parse(atob(body));
        if (claims.exp < Math.floor(Date.now()/1000)) return { valid: false, reason: 'Token expired', claims };
        return { valid: true, claims };
      } catch {
        return { valid: false, reason: 'Malformed token' };
      }
    },

    _hmac(data, secret) {
      /* Same simulation as WebhookFramework._sign */
      let hash = 0;
      const str = secret + data;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).padStart(16, '0');
    },
  },
};

/* ── Rate Limiter (sliding window) ── */
const RateLimiter = {

  check(identifier, limitPerMinute) {
    const counters = dbGet(IKEYS.RATE_COUNTERS, {});
    const now_ms   = Date.now();
    const window   = RATE_WINDOW;

    if (!counters[identifier]) {
      counters[identifier] = { requests: [], blocked: false };
    }

    /* Prune old requests outside the window */
    counters[identifier].requests = counters[identifier].requests
      .filter(ts => now_ms - ts < window);

    const count = counters[identifier].requests.length;

    if (count >= limitPerMinute) {
      dbSet(IKEYS.RATE_COUNTERS, counters);
      return {
        allowed:     false,
        reason:      `Rate limit exceeded. ${limitPerMinute} req/min allowed. Try again in ${Math.ceil((counters[identifier].requests[0] + window - now_ms)/1000)}s.`,
        count,
        limit:       limitPerMinute,
        resetAt:     new Date(counters[identifier].requests[0] + window).toISOString(),
      };
    }

    counters[identifier].requests.push(now_ms);
    dbSet(IKEYS.RATE_COUNTERS, counters);
    return { allowed: true, count: count + 1, limit: limitPerMinute };
  },

  resetIdentifier(identifier) {
    const counters = dbGet(IKEYS.RATE_COUNTERS, {});
    delete counters[identifier];
    dbSet(IKEYS.RATE_COUNTERS, counters);
  },

  status(identifier) {
    const counters = dbGet(IKEYS.RATE_COUNTERS, {});
    const now_ms   = Date.now();
    const rec      = counters[identifier];
    if (!rec) return { identifier, requestsInWindow: 0 };
    const active = rec.requests.filter(ts => now_ms - ts < RATE_WINDOW);
    return { identifier, requestsInWindow: active.length, windowMs: RATE_WINDOW };
  },
};

/* ═══════════════════════════════════════════════════
   8. INTEGRATION MONITORING
═══════════════════════════════════════════════════ */
const IntegrationMonitor = {

  /**
   * Core execution wrapper — all integration calls go through here.
   * @param {object} opts { system, objectType, dispatchId, payload, adapter }
   * @returns {IntegrationResult}
   */
  execute(opts) {
    const { system, objectType, dispatchId, payload, adapter } = opts;
    const t0     = Date.now();
    const result = adapter(payload);
    const latency = result.latencyMs || (Date.now() - t0);

    const logEntry = {
      id:         uuid(),
      system,
      objectType,
      dispatchId,
      success:    result.success,
      error:      result.error || null,
      latencyMs:  latency,
      timestamp:  now(),
    };

    appendLog(IKEYS.MONITOR_LOG, logEntry);
    return { ...result, ...logEntry };
  },

  _fail(system, error, dispatchId) {
    const entry = {
      id:         uuid(),
      system,
      objectType: 'error',
      dispatchId,
      success:    false,
      error,
      latencyMs:  0,
      timestamp:  now(),
    };
    appendLog(IKEYS.MONITOR_LOG, entry);
    return entry;
  },

  _log(entry) {
    appendLog(IKEYS.MONITOR_LOG, { id: uuid(), timestamp: now(), ...entry });
  },

  /**
   * Aggregated metrics for a given time range.
   * @param {number} windowMs  - ms back from now (default 24 hrs)
   */
  metrics(windowMs = 86400000) {
    const cutoff = Date.now() - windowMs;
    const log    = dbGet(IKEYS.MONITOR_LOG, [])
      .filter(e => new Date(e.timestamp).getTime() > cutoff);

    const bySystem = {};
    log.forEach(e => {
      if (!bySystem[e.system]) {
        bySystem[e.system] = { success: 0, failure: 0, retries: 0, latencies: [] };
      }
      const s = bySystem[e.system];
      if (e.success) s.success++;
      else s.failure++;
      if (e.latencyMs) s.latencies.push(e.latencyMs);
    });

    /* Compute percentile latencies */
    Object.values(bySystem).forEach(s => {
      s.latencies.sort((a,b) => a-b);
      const n = s.latencies.length;
      s.avgLatencyMs  = n ? Math.round(s.latencies.reduce((x,y) => x+y,0)/n) : 0;
      s.p95LatencyMs  = n ? s.latencies[Math.floor(n * 0.95)] : 0;
      s.p99LatencyMs  = n ? s.latencies[Math.floor(n * 0.99)] : 0;
      s.totalCalls    = s.success + s.failure;
      s.successRate   = s.totalCalls ? Math.round(s.success / s.totalCalls * 100) : 0;
      delete s.latencies;
    });

    const retryQueue = dbGet(IKEYS.RETRY_QUEUE, []);

    return {
      windowHrs:      Math.round(windowMs / 3600000),
      totalCalls:     log.length,
      overallSuccess: log.filter(e => e.success).length,
      overallFailure: log.filter(e => !e.success).length,
      successRate:    log.length ? Math.round(log.filter(e=>e.success).length/log.length*100) : 0,
      bySystem,
      retryQueueDepth: retryQueue.length,
      generatedAt:    now(),
    };
  },

  /**
   * Per-system health check (last 50 calls).
   */
  systemHealth(system) {
    const log = dbGet(IKEYS.MONITOR_LOG, [])
      .filter(e => e.system === system)
      .slice(0, 50);

    if (!log.length) return { system, status: 'no-data' };

    const successRate = Math.round(log.filter(e => e.success).length / log.length * 100);
    const latencies   = log.map(e => e.latencyMs||0).filter(Boolean).sort((a,b)=>a-b);
    const avgLatency  = latencies.length ? Math.round(latencies.reduce((s,l)=>s+l,0)/latencies.length) : 0;
    const status      = successRate >= 95 ? 'healthy' : successRate >= 75 ? 'degraded' : 'down';

    return {
      system,
      status,
      successRate,
      avgLatencyMs: avgLatency,
      last50Calls:  log.length,
      lastCall:     log[0]?.timestamp || null,
    };
  },

  /**
   * Get raw log (useful for admin UI).
   */
  getLog(limit = 200) {
    return dbGet(IKEYS.MONITOR_LOG, []).slice(0, limit);
  },

  /**
   * Clear old log entries beyond a retention window.
   * @param {number} retainDays
   */
  purgeOldLogs(retainDays = 30) {
    const cutoff = Date.now() - retainDays * 86400000;
    [IKEYS.MONITOR_LOG, IKEYS.EVENT_LOG, IKEYS.NOTIF_LOG].forEach(key => {
      const log = dbGet(key, []).filter(e => new Date(e.timestamp).getTime() > cutoff);
      dbSet(key, log);
    });
  },
};

/* ═══════════════════════════════════════════════════
   BOOT: wire domain events into internal EventBus
═══════════════════════════════════════════════════ */
DomainEventBus._wireInternalBus();

/* ═══════════════════════════════════════════════════
   EXPOSE TO WINDOW.TCT
═══════════════════════════════════════════════════ */
Object.assign(window.TCT, {
  ERP_SYSTEMS,
  WMS_SYSTEMS,
  CARRIER_SYSTEMS,
  NOTIF_CHANNELS,
  NOTIF_EVENTS,
  AUTH_METHODS,
  ERPAdapter,
  WMSAdapter,
  CarrierAdapter,
  NotificationEngine,
  WebhookFramework,
  DomainEventBus,
  APISecurityLayer,
  RateLimiter,
  IntegrationMonitor,
  IKEYS,
});

console.log('[TCT Step 6] Enterprise Integration Layer loaded.');
// → Next module: STEP 7
