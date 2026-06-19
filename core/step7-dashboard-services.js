/**
 * TRANSPORT CONTROL TOWER — STEP 7: DASHBOARD SERVICE LAYER
 * ==========================================================
 * Depends on: step1, step2, step3, step4, step5, step6
 *
 * Responsibilities:
 *  1. Executive Dashboard Services
 *  2. Dispatch Dashboard Services
 *  3. Exception Dashboard Services
 *  4. Route Dashboard Services
 *  5. Carrier Dashboard Services
 *  6. Reconciliation Dashboard Services
 *  7. Alert Services
 *  8. Drill-down Services
 *
 * Architecture notes
 * ──────────────────────────────────────────────────────────
 * Every service returns a plain serialisable object — no DOM
 * references, no closures retained in the result.  All data
 * is sourced from DAL (step 1) + engine modules (steps 2–6).
 *
 * Caching: each service result is memoised for CACHE_TTL_MS
 * (default 30 s) in localStorage so repeated renders hit
 * the same object without recomputing.  Call .invalidate()
 * or pass { fresh: true } to bypass the cache.
 *
 * Pagination: list services accept { page, pageSize } and
 * return { items, total, page, pageSize, totalPages }.
 *
 * Filters: most services accept a plain filter object whose
 * keys match dispatch/entity fields (routeId, carrierId,
 * status, dateFrom, dateTo, severity, etc.).
 */

'use strict';

(() => {
  const required = ['DAL','LifecycleEngine','KPIEngine','SLAClock',
    'ExceptionFactory','ExceptionAnalytics','ReconciliationKPIs',
    'CapacityEngine','RoutePerformanceScorer','CostEngine',
    'PlanningAnalytics','IntegrationMonitor'];

  required.forEach(key => {
    if (!window.TCT?.[key]) throw new Error(`[TCT Step 7] window.TCT.${key} missing — load steps 1–6 first.`);
  });
})();

const {
  DAL, KPIEngine, SLAClock, ExceptionAnalytics,
  ReconciliationKPIs, CapacityEngine, RoutePerformanceScorer,
  CostEngine, PlanningAnalytics, IntegrationMonitor,
  ConsolidationEngine, VehicleRecommendationEngine,
  DomainEventBus, NotificationEngine,
} = window.TCT;

/* ═══════════════════════════════════════════════════
   CACHE LAYER
═══════════════════════════════════════════════════ */
const CACHE_TTL_MS = 30_000;
const CACHE_KEY    = 'tct_dash_cache';

const Cache = {
  _store() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; } },
  _save(s)  { try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {} },

  get(key) {
    const store = this._store();
    const hit   = store[key];
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL_MS) { this._del(key); return null; }
    return hit.data;
  },

  set(key, data) {
    const store  = this._store();
    store[key]   = { ts: Date.now(), data };
    this._save(store);
    return data;
  },

  _del(key) {
    const store = this._store();
    delete store[key];
    this._save(store);
  },

  invalidate(prefix = '') {
    const store = this._store();
    Object.keys(store).forEach(k => { if (!prefix || k.startsWith(prefix)) delete store[k]; });
    this._save(store);
  },
};

function cached(key, fn, opts = {}) {
  if (!opts.fresh) {
    const hit = Cache.get(key);
    if (hit !== null) return hit;
  }
  return Cache.set(key, fn());
}

/* ═══════════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════════ */
function now() { return new Date().toISOString(); }

function pct(num, den) {
  return den > 0 ? Math.round(num / den * 100) : 0;
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
}

/**
 * Apply a flat filter object to an array of entities.
 * Supports: status, routeId, carrierId, vehicleId, severity,
 *           dateFrom / dateTo (against plannedDeparture),
 *           search (against id, routeCode, vehicleReg).
 */
function applyFilters(items, filters = {}) {
  return items.filter(item => {
    if (filters.status    && item.status    !== filters.status)    return false;
    if (filters.routeId   && item.routeId   !== filters.routeId)   return false;
    if (filters.carrierId && item.carrierId !== filters.carrierId)  return false;
    if (filters.vehicleId && item.vehicleId !== filters.vehicleId)  return false;
    if (filters.severity  && item.severity  !== filters.severity)   return false;
    if (filters.regionId  && item.regionId  !== filters.regionId)   return false;
    if (filters.dateFrom) {
      const d = item.plannedDeparture || item.createdAt;
      if (!d || new Date(d) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const d = item.plannedDeparture || item.createdAt;
      if (!d || new Date(d) > new Date(filters.dateTo)) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [item.id, item.routeCode, item.vehicleReg, item.name]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function paginate(items, page = 1, pageSize = 20) {
  const total      = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const start      = (safePage - 1) * pageSize;
  return {
    items:      items.slice(start, start + pageSize),
    total,
    page:       safePage,
    pageSize,
    totalPages,
  };
}

function trend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round((current - previous) / previous * 100);
}

/* ═══════════════════════════════════════════════════
   1. EXECUTIVE DASHBOARD SERVICES
═══════════════════════════════════════════════════ */
const ExecutiveDashboardService = {

  /**
   * Primary KPI card data for the executive view.
   * @param {{ fresh?: boolean }} opts
   * @returns {ExecutiveKPIs}
   */
  getKPIs(opts = {}) {
    return cached('exec:kpis', () => {
      const all        = DAL.dispatches.getAll();
      const agg        = KPIEngine.aggregateKPIs(all);
      const exceptions = DAL.exceptions.getAll();
      const fleet      = CapacityEngine.fleetSnapshot();
      const carriers   = DAL.carriers.getAll().filter(c => c.active);

      /* SLA compliance — dispatches that breached vs total closed */
      const closed     = all.filter(d => ['reconciled','closed'].includes(d.status));
      const slaBreach  = closed.filter(d => {
        const chk = SLAClock.check(d);
        return chk.breached;
      }).length;
      const slaPct     = pct(closed.length - slaBreach, closed.length);

      /* Vehicle utilization average */
      const activeUtil = fleet.filter(f => f.utilization?.overallPct != null);
      const avgUtil    = avg(activeUtil.map(f => f.utilization.overallPct));

      /* Carrier composite score average */
      const carrierScores = carriers.map(c => {
        const s = ExceptionAnalytics.carrierExceptionScore(c.id);
        return s?.compositeScore || 80;
      });
      const avgCarrierScore = avg(carrierScores);

      /* Exception counts */
      const openExc   = exceptions.filter(e => !['resolved','closed'].includes(e.resolutionState));
      const closedExc = exceptions.filter(e =>  ['resolved','closed'].includes(e.resolutionState));

      return {
        generatedAt:       now(),
        totalDispatches:   all.length,
        activeDispatches:  all.filter(d => ['dispatched','in-transit'].includes(d.status)).length,
        otdPct:            agg.otdPct,
        otaPct:            agg.otaPct,
        slaPct,
        openExceptions:    openExc.length,
        criticalExceptions:openExc.filter(e => e.severity === 'critical').length,
        closedExceptions:  closedExc.length,
        vehicleUtilPct:    avgUtil,
        avgCarrierScore:   avgCarrierScore,
        /* Trend badges (vs previous 24 hrs window — seeded as +/- stub) */
        trends: {
          otdPct:           agg.otdPct >= 85 ? 'up' : 'down',
          otaPct:           agg.otaPct >= 85 ? 'up' : 'down',
          openExceptions:   openExc.length > 5  ? 'up' : 'stable',
          vehicleUtilPct:   avgUtil >= 70 ? 'good' : 'low',
        },
        breakdown: agg,
      };
    }, opts);
  },

  /**
   * Time-series data points for sparklines.
   * Returns last N days of dispatch counts grouped by status.
   * @param {number} days
   */
  getTimeSeries(days = 7, opts = {}) {
    return cached(`exec:timeseries:${days}`, () => {
      const all    = DAL.dispatches.getAll();
      const series = [];
      for (let i = days - 1; i >= 0; i--) {
        const d     = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toISOString().slice(0, 10);
        const inDay = all.filter(dispatch => {
          const dep = dispatch.plannedDeparture || dispatch.createdAt;
          return dep && dep.slice(0, 10) === label;
        });
        series.push({
          date:       label,
          total:      inDay.length,
          planned:    inDay.filter(x => x.status === 'planned').length,
          inTransit:  inDay.filter(x => x.status === 'in-transit').length,
          arrived:    inDay.filter(x => x.status === 'arrived').length,
          reconciled: inDay.filter(x => x.status === 'reconciled').length,
          exceptions: inDay.filter(x => (x.exceptionIds||[]).length > 0).length,
        });
      }
      return { days, series, generatedAt: now() };
    }, opts);
  },

  /**
   * Top-5 risk dispatches for the executive alert strip.
   */
  getTopRisks(opts = {}) {
    return cached('exec:toprisks', () => AlertService.getCriticalSLABreaches({ limit: 5 }), opts);
  },
};

/* ═══════════════════════════════════════════════════
   2. DISPATCH DASHBOARD SERVICES
═══════════════════════════════════════════════════ */
const DispatchDashboardService = {

  /**
   * Status funnel counts for the Kanban-style board header.
   */
  getStatusFunnel(opts = {}) {
    return cached('dispatch:funnel', () => {
      const all      = DAL.dispatches.getAll();
      const statuses = ['planned','ready','dispatched','in-transit','arrived','unloading','reconciled','closed'];
      const funnel   = {};
      statuses.forEach(s => {
        funnel[s] = all.filter(d => d.status === s).length;
      });
      return { funnel, total: all.length, generatedAt: now() };
    }, opts);
  },

  /**
   * Paginated dispatch list with optional filters.
   * @param {object} filters
   * @param {number} page
   * @param {number} pageSize
   */
  getList(filters = {}, page = 1, pageSize = 20, opts = {}) {
    const cacheKey = `dispatch:list:${JSON.stringify(filters)}:${page}:${pageSize}`;
    return cached(cacheKey, () => {
      const all      = DAL.dispatches.getAll();
      const filtered = applyFilters(all, filters);

      /* Enrich each dispatch with derived fields */
      const enriched = filtered.map(d => this._enrich(d));
      return paginate(enriched, page, pageSize);
    }, opts);
  },

  /**
   * Single dispatch detail (full enrichment).
   */
  getDetail(dispatchId, opts = {}) {
    return cached(`dispatch:detail:${dispatchId}`, () => {
      const d = DAL.dispatches.getById(dispatchId);
      if (!d) return null;
      return this._enrichFull(d);
    }, opts);
  },

  /**
   * Dispatches with an SLA at-risk or breached flag.
   */
  getAtRisk(opts = {}) {
    return cached('dispatch:atrisk', () => {
      const live = DAL.dispatches.getAll()
        .filter(d => ['dispatched','in-transit','arrived'].includes(d.status));
      return live
        .map(d => ({ ...d, sla: SLAClock.check(d) }))
        .filter(d => d.sla.atRisk || d.sla.breached)
        .map(d => ({
          id:              d.id,
          routeCode:       d.routeCode,
          status:          d.status,
          vehicleReg:      d.vehicleReg,
          plannedArrival:  d.plannedArrival,
          sla:             d.sla,
          severity:        d.sla.breached ? 'critical' : 'high',
        }));
    }, opts);
  },

  /* ── enrichment helpers ── */
  _enrich(d) {
    const route   = DAL.routes.getById(d.routeId);
    const carrier = DAL.carriers.getById(d.carrierId);
    const vehicle = DAL.vehicles.getById(d.vehicleId);
    const sla     = SLAClock.check(d);
    return {
      id:             d.id,
      status:         d.status,
      routeCode:      d.routeCode || route?.code,
      routeName:      route?.name,
      originId:       d.originId,
      destId:         d.destId,
      carrierName:    carrier?.name,
      vehicleReg:     vehicle?.registration || d.vehicleReg,
      plannedDeparture: d.plannedDeparture,
      plannedArrival:   d.plannedArrival,
      actualDeparture:  d.actualDeparture,
      actualArrival:    d.actualArrival,
      huCount:          d.huDispatched?.length || 0,
      exceptionCount:   d.exceptionIds?.length || 0,
      sla:              { atRisk: sla.atRisk, breached: sla.breached, hoursRemaining: sla.hoursRemaining },
      otaStatus:        d.otaStatus,
      otdStatus:        d.otdStatus,
    };
  },

  _enrichFull(d) {
    const base     = this._enrich(d);
    const capacity = CapacityEngine.forDispatch(d.id);
    const route    = DAL.routes.getById(d.routeId);
    const carrier  = DAL.carriers.getById(d.carrierId);
    const vehicle  = DAL.vehicles.getById(d.vehicleId);
    const sla      = SLAClock.check(d);
    const ota      = KPIEngine.calculateOTA(d);
    const otd      = KPIEngine.calculateOTD(d);
    const exceptions = (d.exceptionIds || [])
      .map(id => DAL.exceptions.getById(id)).filter(Boolean);

    return {
      ...d,
      ...base,
      route,
      carrier,
      vehicle,
      slaDetail:   sla,
      otaDetail:   ota,
      otdDetail:   otd,
      capacity,
      exceptions,
      auditLog:    d.auditLog || [],
      trackingTrail: d.trackingTrail || [],
      pod:         d.pod || null,
    };
  },
};

/* ═══════════════════════════════════════════════════
   3. EXCEPTION DASHBOARD SERVICES
═══════════════════════════════════════════════════ */
const ExceptionDashboardService = {

  /**
   * Summary counts for the exception overview panel.
   */
  getSummary(opts = {}) {
    return cached('exc:summary', () => {
      const all    = DAL.exceptions.getAll();
      const open   = all.filter(e => !['resolved','closed'].includes(e.resolutionState));
      const closed = all.filter(e =>  ['resolved','closed'].includes(e.resolutionState));

      const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
      open.forEach(e => { bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1; });

      const byCategory = {};
      open.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + 1; });

      const byState = {};
      all.forEach(e => { byState[e.resolutionState] = (byState[e.resolutionState] || 0) + 1; });

      const avgResolutionHrs = (() => {
        const resolved = all.filter(e => e.resolvedAt && e.raisedAt);
        if (!resolved.length) return null;
        const hrs = resolved.map(e =>
          (new Date(e.resolvedAt) - new Date(e.raisedAt)) / 3_600_000
        );
        return Math.round(avg(hrs) * 10) / 10;
      })();

      return {
        total:           all.length,
        open:            open.length,
        closed:          closed.length,
        bySeverity,
        byCategory,
        byState,
        avgResolutionHrs,
        generatedAt:     now(),
      };
    }, opts);
  },

  /**
   * Open exceptions grouped by region (origin location's regionId).
   */
  getOpenByRegion(opts = {}) {
    return cached('exc:byregion', () => {
      const open    = DAL.exceptions.getAll()
        .filter(e => !['resolved','closed'].includes(e.resolutionState));
      const byRegion = {};

      open.forEach(e => {
        const d      = DAL.dispatches.getById(e.dispatchId);
        const origin = d ? DAL.locations.getById(d.originId) : null;
        const region = origin?.region || 'Unknown';
        if (!byRegion[region]) byRegion[region] = { region, count: 0, critical: 0, high: 0, exceptions: [] };
        byRegion[region].count++;
        if (e.severity === 'critical') byRegion[region].critical++;
        if (e.severity === 'high')     byRegion[region].high++;
        byRegion[region].exceptions.push(e.id);
      });

      return {
        regions:     Object.values(byRegion).sort((a,b) => b.count - a.count),
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Open exceptions grouped by carrier.
   */
  getOpenByCarrier(opts = {}) {
    return cached('exc:bycarrier', () => {
      const open    = DAL.exceptions.getAll()
        .filter(e => !['resolved','closed'].includes(e.resolutionState));
      const byCarrier = {};

      open.forEach(e => {
        const d       = DAL.dispatches.getById(e.dispatchId);
        const carrier = d ? DAL.carriers.getById(d.carrierId) : null;
        const cid     = carrier?.id || 'unknown';
        const cname   = carrier?.name || 'Unknown';
        if (!byCarrier[cid]) byCarrier[cid] = { carrierId: cid, carrierName: cname, count: 0, critical: 0, categories: {} };
        byCarrier[cid].count++;
        if (e.severity === 'critical') byCarrier[cid].critical++;
        byCarrier[cid].categories[e.category] = (byCarrier[cid].categories[e.category] || 0) + 1;
      });

      return {
        carriers:    Object.values(byCarrier).sort((a,b) => b.count - a.count),
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Root cause analysis — top causes across all open exceptions.
   */
  getRootCauseAnalysis(opts = {}) {
    return cached('exc:rootcause', () => {
      const open   = DAL.exceptions.getAll()
        .filter(e => !['resolved','closed'].includes(e.resolutionState));
      const causes = {};

      open.forEach(e => {
        const primary = e.rootCause?.primary || 'Unknown';
        if (!causes[primary]) causes[primary] = { cause: primary, count: 0, avgConfidence: 0, _conf: [] };
        causes[primary].count++;
        if (e.rootCause?.confidence) causes[primary]._conf.push(e.rootCause.confidence);
      });

      return {
        causes: Object.values(causes)
          .map(c => ({
            cause:         c.cause,
            count:         c.count,
            pct:           pct(c.count, open.length),
            avgConfidencePct: c._conf.length ? avg(c._conf) : null,
          }))
          .sort((a,b) => b.count - a.count),
        sampleSize:  open.length,
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Paginated exception list.
   */
  getList(filters = {}, page = 1, pageSize = 20, opts = {}) {
    const cacheKey = `exc:list:${JSON.stringify(filters)}:${page}:${pageSize}`;
    return cached(cacheKey, () => {
      const all      = DAL.exceptions.getAll();
      const filtered = applyFilters(all, filters);
      const enriched = filtered.map(e => this._enrich(e));
      return paginate(enriched.sort((a,b) => new Date(b.raisedAt) - new Date(a.raisedAt)), page, pageSize);
    }, opts);
  },

  _enrich(e) {
    const d = DAL.dispatches.getById(e.dispatchId);
    return {
      ...e,
      routeCode:   d?.routeCode,
      carrierName: DAL.carriers.getById(d?.carrierId)?.name,
      ageHrs:      e.raisedAt ? Math.round((Date.now() - new Date(e.raisedAt)) / 3_600_000) : null,
    };
  },
};

/* ═══════════════════════════════════════════════════
   4. ROUTE DASHBOARD SERVICES
═══════════════════════════════════════════════════ */
const RouteDashboardService = {

  /**
   * All routes performance table.
   */
  getPerformanceTable(opts = {}) {
    return cached('route:performance', () => {
      const scores  = RoutePerformanceScorer.scoreAll();
      const costMap = {};
      CostEngine.allRoutesCost().forEach(c => { costMap[c.routeId] = c; });

      return {
        routes: scores.map(s => ({
          ...s,
          cost: costMap[s.routeId] || null,
        })),
        avgComposite: avg(scores.map(s => s.composite)),
        topRoute:     scores[0] || null,
        bottomRoute:  scores[scores.length - 1] || null,
        generatedAt:  now(),
      };
    }, opts);
  },

  /**
   * SLA compliance breakdown per route.
   */
  getSLABreakdown(opts = {}) {
    return cached('route:sla', () => {
      const routes = DAL.routes.getAll().filter(r => r.active);
      return {
        routes: routes.map(r => {
          const dispatches = DAL.dispatches.getAll().filter(d => d.routeId === r.id);
          const withArr    = dispatches.filter(d => d.actualArrival);
          const onTime     = withArr.filter(d => d.otaStatus === 'on-time');
          const breached   = dispatches.filter(d => SLAClock.check(d).breached);
          return {
            routeId:        r.id,
            routeCode:      r.code,
            routeName:      r.name,
            totalDispatches:dispatches.length,
            slaCompliancePct: pct(onTime.length, withArr.length),
            slaBreaches:    breached.length,
            breachPct:      pct(breached.length, dispatches.length),
          };
        }).sort((a,b) => b.slaCompliancePct - a.slaCompliancePct),
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Delay analysis per route.
   */
  getDelayAnalysis(opts = {}) {
    return cached('route:delays', () => {
      const routes = DAL.routes.getAll().filter(r => r.active);
      return {
        routes: routes.map(r => {
          const dispatches = DAL.dispatches.getAll()
            .filter(d => d.routeId === r.id && d.actualArrival);
          const late       = dispatches.filter(d => d.otaStatus === 'late');
          const variances  = dispatches
            .map(d => d.otaVarianceMin || 0)
            .filter(v => v > 0);

          return {
            routeId:       r.id,
            routeCode:     r.code,
            routeName:     r.name,
            totalArrived:  dispatches.length,
            lateCount:     late.length,
            delayRatePct:  pct(late.length, dispatches.length),
            avgDelayMin:   avg(variances),
            maxDelayMin:   variances.length ? Math.max(...variances) : 0,
          };
        }).sort((a,b) => b.delayRatePct - a.delayRatePct),
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Utilization per route (vehicle fill rate of dispatches on route).
   */
  getUtilizationBreakdown(opts = {}) {
    return cached('route:utilization', () => {
      const routes = DAL.routes.getAll().filter(r => r.active);
      return {
        routes: routes.map(r => {
          const dispatches = DAL.dispatches.getAll()
            .filter(d => d.routeId === r.id && ['dispatched','in-transit'].includes(d.status));
          const utils = dispatches
            .map(d => CapacityEngine.forDispatch(d.id)?.utilization?.overallPct || 0);
          return {
            routeId:        r.id,
            routeCode:      r.code,
            routeName:      r.name,
            activeDispatches: dispatches.length,
            avgUtilPct:     avg(utils),
            underutilized:  utils.filter(u => u < 60).length,
            overloaded:     utils.filter(u => u > 100).length,
          };
        }),
        generatedAt: now(),
      };
    }, opts);
  },
};

/* ═══════════════════════════════════════════════════
   5. CARRIER DASHBOARD SERVICES
═══════════════════════════════════════════════════ */
const CarrierDashboardService = {

  /**
   * Carrier ranking table (composite score).
   */
  getRanking(opts = {}) {
    return cached('carrier:ranking', () => {
      const carriers = DAL.carriers.getAll().filter(c => c.active);
      const ranked   = carriers.map(c => {
        const kpis  = KPIEngine.carrierKPIs(c.id);
        const score = ExceptionAnalytics.carrierExceptionScore(c.id);
        const cost  = this._avgCost(c.id);
        return {
          carrierId:      c.id,
          carrierName:    c.name,
          carrierType:    c.type,
          otdPct:         kpis.otdPct,
          otaPct:         kpis.otaPct,
          totalDispatches:kpis.totalDispatches,
          openExceptions: score?.openExceptions || 0,
          compositeScore: score?.compositeScore || 80,
          avgCostPerKm:   cost.avgCostPerKm,
        };
      }).sort((a,b) => b.compositeScore - a.compositeScore);

      return {
        carriers:    ranked,
        topCarrier:  ranked[0] || null,
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * SLA compliance per carrier.
   */
  getSLACompliance(opts = {}) {
    return cached('carrier:sla', () => {
      const carriers = DAL.carriers.getAll().filter(c => c.active);
      return {
        carriers: carriers.map(c => {
          const kpis = KPIEngine.carrierKPIs(c.id);
          return {
            carrierId:      c.id,
            carrierName:    c.name,
            otaPct:         kpis.otaPct,
            otdPct:         kpis.otdPct,
            slaBreaches:    kpis.slaBreaches || 0,
            totalDispatches:kpis.totalDispatches,
          };
        }).sort((a,b) => b.otaPct - a.otaPct),
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Delay % and avg delay per carrier.
   */
  getDelayProfile(opts = {}) {
    return cached('carrier:delays', () => {
      const carriers = DAL.carriers.getAll().filter(c => c.active);
      return {
        carriers: carriers.map(c => {
          const dispatches = DAL.dispatches.getAll()
            .filter(d => d.carrierId === c.id && d.actualArrival);
          const late       = dispatches.filter(d => d.otaStatus === 'late');
          const variances  = dispatches.map(d => d.otaVarianceMin || 0).filter(v => v > 0);
          return {
            carrierId:    c.id,
            carrierName:  c.name,
            totalArrived: dispatches.length,
            lateCount:    late.length,
            delayPct:     pct(late.length, dispatches.length),
            avgDelayMin:  avg(variances),
          };
        }).sort((a,b) => b.delayPct - a.delayPct),
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Cost efficiency per carrier.
   */
  getCostEfficiency(opts = {}) {
    return cached('carrier:cost', () => {
      const carriers = DAL.carriers.getAll().filter(c => c.active);
      return {
        carriers: carriers.map(c => ({
          carrierId:   c.id,
          carrierName: c.name,
          carrierType: c.type,
          ...this._avgCost(c.id),
        })).sort((a,b) => a.avgCostPerKm - b.avgCostPerKm),
        generatedAt: now(),
      };
    }, opts);
  },

  _avgCost(carrierId) {
    const dispatches = DAL.dispatches.getAll()
      .filter(d => d.carrierId === carrierId && d.actualDeparture);
    if (!dispatches.length) return { avgCostPerKm: 0, avgCostPerHU: 0, totalCostINR: 0 };

    const costs = dispatches.map(d => {
      const v     = DAL.vehicles.getById(d.vehicleId);
      const route = DAL.routes.getById(d.routeId);
      return CostEngine.tripCost(v?.type || '26ft-truck', route?.distanceKm || 500, carrierId);
    });

    const totalCost = costs.reduce((s,c) => s + c.totalINR, 0);
    const totalHU   = dispatches.reduce((s,d) => s + (d.huDispatched?.length||0), 0);
    const totalKm   = dispatches.reduce((s,d) => {
      const r = DAL.routes.getById(d.routeId);
      return s + (r?.distanceKm || 500);
    }, 0);

    return {
      totalCostINR:  Math.round(totalCost),
      avgCostPerKm:  totalKm ? Math.round(totalCost / totalKm) : 0,
      avgCostPerHU:  totalHU ? Math.round(totalCost / totalHU) : 0,
    };
  },
};

/* ═══════════════════════════════════════════════════
   6. RECONCILIATION DASHBOARD SERVICES
═══════════════════════════════════════════════════ */
const ReconciliationDashboardService = {

  /**
   * Global reconciliation health metrics.
   */
  getSummary(opts = {}) {
    return cached('reco:summary', () => {
      const global = ReconciliationKPIs.global();
      const all    = DAL.dispatches.getAll()
        .filter(d => ['reconciled','closed'].includes(d.status));

      const withReport = all.filter(d => d.reconciliationReport);

      const missingPct = withReport.length
        ? Math.round(withReport.reduce((s,d) =>
            s + pct(d.reconciliationReport?.missing?.length || 0, d.reconciliationReport?.dispatched?.length || 1)
          , 0) / withReport.length)
        : 0;

      const excessPct = withReport.length
        ? Math.round(withReport.reduce((s,d) =>
            s + pct(d.reconciliationReport?.excess?.length || 0, d.reconciliationReport?.dispatched?.length || 1)
          , 0) / withReport.length)
        : 0;

      const damagedPct = (() => {
        const exceptions = DAL.exceptions.getAll()
          .filter(e => e.category === 'damaged-hu');
        return all.length ? pct(exceptions.length, all.length) : 0;
      })();

      return {
        ...global,
        missingHUPct:  missingPct,
        excessHUPct:   excessPct,
        damagedHUPct:  damagedPct,
        generatedAt:   now(),
      };
    }, opts);
  },

  /**
   * Per-dispatch reconciliation list with match rates.
   */
  getDispatchList(filters = {}, page = 1, pageSize = 20, opts = {}) {
    const cacheKey = `reco:list:${JSON.stringify(filters)}:${page}:${pageSize}`;
    return cached(cacheKey, () => {
      const dispatches = DAL.dispatches.getAll()
        .filter(d => ['reconciled','closed'].includes(d.status));
      const filtered = applyFilters(dispatches, filters);

      const enriched = filtered.map(d => {
        const report = d.reconciliationReport || {};
        return {
          id:               d.id,
          routeCode:        d.routeCode,
          status:           d.status,
          reconciliationStatus: d.reconciliationStatus,
          dispatched:       report.dispatched?.length || d.huDispatched?.length || 0,
          received:         report.received?.length   || d.huReceived?.length   || 0,
          matched:          report.matched?.length    || 0,
          missing:          report.missing?.length    || 0,
          excess:           report.excess?.length     || 0,
          matchRate:        d.matchRate || report.matchRate || 0,
          reconciliationDate: d.reconciliationDate,
          carrierName:      DAL.carriers.getById(d.carrierId)?.name,
        };
      });

      return paginate(enriched.sort((a,b) => new Date(b.reconciliationDate||0) - new Date(a.reconciliationDate||0)), page, pageSize);
    }, opts);
  },

  /**
   * Exception-linked reconciliation issues.
   */
  getReconciliationExceptions(opts = {}) {
    return cached('reco:exceptions', () => {
      const excCategories = ['missing-hu','excess-hu','damaged-hu','seal-mismatch'];
      const exceptions    = DAL.exceptions.getAll()
        .filter(e => excCategories.includes(e.category));

      const byCategory = {};
      excCategories.forEach(cat => { byCategory[cat] = 0; });
      exceptions.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + 1; });

      return {
        total:      exceptions.length,
        byCategory,
        recent:     exceptions
          .sort((a,b) => new Date(b.raisedAt) - new Date(a.raisedAt))
          .slice(0, 10),
        generatedAt: now(),
      };
    }, opts);
  },
};

/* ═══════════════════════════════════════════════════
   7. ALERT SERVICES
═══════════════════════════════════════════════════ */
const AlertService = {

  /**
   * All active alerts in priority order.
   */
  getAll(opts = {}) {
    return cached('alerts:all', () => {
      return {
        critical:   this.getCriticalSLABreaches(),
        highRisk:   this.getHighRiskDispatches(),
        escalated:  this.getEscalatedExceptions(),
        generatedAt: now(),
      };
    }, opts);
  },

  /**
   * Dispatches that have already breached SLA.
   * @param {{ limit?: number }} opts
   */
  getCriticalSLABreaches(opts = {}) {
    const live = DAL.dispatches.getAll()
      .filter(d => !['reconciled','closed'].includes(d.status));

    const breached = live
      .map(d => {
        const sla = SLAClock.check(d);
        return sla.breached ? {
          alertType:     'SLA_BREACH',
          severity:      'critical',
          dispatchId:    d.id,
          routeCode:     d.routeCode,
          status:        d.status,
          vehicleReg:    d.vehicleReg,
          carrierId:     d.carrierId,
          plannedArrival:d.plannedArrival,
          hoursOverdue:  sla.hoursOverdue,
          message:       `Dispatch ${d.id} is ${sla.hoursOverdue?.toFixed(1)} hrs overdue on route ${d.routeCode}.`,
        } : null;
      })
      .filter(Boolean)
      .sort((a,b) => b.hoursOverdue - a.hoursOverdue);

    return opts.limit ? breached.slice(0, opts.limit) : breached;
  },

  /**
   * Dispatches that are at-risk (not yet breached) with high exception count.
   */
  getHighRiskDispatches(opts = {}) {
    const live = DAL.dispatches.getAll()
      .filter(d => ['dispatched','in-transit'].includes(d.status));

    return live
      .map(d => {
        const sla    = SLAClock.check(d);
        const excCount = (d.exceptionIds||[]).length;
        const riskScore = (sla.atRisk ? 40 : 0) + (excCount * 10);
        return riskScore >= 20 ? {
          alertType:    'HIGH_RISK',
          severity:     riskScore >= 60 ? 'high' : 'medium',
          dispatchId:   d.id,
          routeCode:    d.routeCode,
          status:       d.status,
          riskScore,
          slaAtRisk:    sla.atRisk,
          hoursRemaining: sla.hoursRemaining,
          exceptionCount: excCount,
          message:      `Dispatch ${d.id} has risk score ${riskScore}. ${excCount} exceptions, SLA ${sla.atRisk?'at risk':'ok'}.`,
        } : null;
      })
      .filter(Boolean)
      .sort((a,b) => b.riskScore - a.riskScore);
  },

  /**
   * Exceptions at escalation tier 2+.
   */
  getEscalatedExceptions(opts = {}) {
    return DAL.exceptions.getAll()
      .filter(e => (e.escalationLevel || 0) >= 2 && !['resolved','closed'].includes(e.resolutionState))
      .map(e => ({
        alertType:      'ESCALATED_EXCEPTION',
        severity:       e.severity,
        exceptionId:    e.id,
        dispatchId:     e.dispatchId,
        category:       e.category,
        escalationLevel:e.escalationLevel,
        escalatedTo:    e.escalatedTo,
        raisedAt:       e.raisedAt,
        ageHrs:         Math.round((Date.now() - new Date(e.raisedAt)) / 3_600_000),
        message:        `Exception ${e.id} (${e.category}) escalated to L${e.escalationLevel} — ${e.escalatedTo}.`,
      }))
      .sort((a,b) => b.escalationLevel - a.escalationLevel || b.ageHrs - a.ageHrs);
  },

  /**
   * Overdue reconciliations — arrived but not reconciled after N hours.
   * @param {number} thresholdHrs  - default 24 hrs
   */
  getOverdueReconciliations(thresholdHrs = 24) {
    const now_ms = Date.now();
    return DAL.dispatches.getAll()
      .filter(d => ['arrived','unloading'].includes(d.status) && d.actualArrival)
      .map(d => {
        const ageHrs = (now_ms - new Date(d.actualArrival)) / 3_600_000;
        return ageHrs >= thresholdHrs ? {
          alertType:   'OVERDUE_RECONCILIATION',
          severity:    ageHrs >= 48 ? 'high' : 'medium',
          dispatchId:  d.id,
          routeCode:   d.routeCode,
          status:      d.status,
          arrivedAt:   d.actualArrival,
          ageHrs:      Math.round(ageHrs),
          message:     `Dispatch ${d.id} arrived ${Math.round(ageHrs)} hrs ago but not yet reconciled.`,
        } : null;
      })
      .filter(Boolean)
      .sort((a,b) => b.ageHrs - a.ageHrs);
  },
};

/* ═══════════════════════════════════════════════════
   8. DRILL-DOWN SERVICES
   ─────────────────────────────────────────────────
   Navigation path: Executive KPI → Route → Dispatch → HU → Audit
   Each level returns the data for that level and the available
   drill-down targets for the next level.
═══════════════════════════════════════════════════ */
const DrillDownService = {

  /**
   * Level 0 — Executive KPI drill-down entry point.
   * Returns top routes sorted by SLA risk.
   */
  fromExecutive(kpiKey) {
    const routeTable = RouteDashboardService.getPerformanceTable();
    const excSummary = ExceptionDashboardService.getSummary();

    const context = {
      kpiKey,
      level:       'executive → route',
      description: `Drill into routes contributing to ${kpiKey}`,
    };

    /* Route list sorted by the relevant KPI */
    let routes = routeTable.routes;
    if (kpiKey === 'otaPct')  routes = [...routes].sort((a,b) => (a.subScores?.slaCompliance?.score||0) - (b.subScores?.slaCompliance?.score||0));
    if (kpiKey === 'openExceptions') routes = [...routes].sort((a,b) => b.totalDispatches - a.totalDispatches);

    return {
      context,
      routes:      routes.slice(0, 10),
      drillTargets: routes.map(r => ({ routeId: r.routeId, routeCode: r.routeCode, score: r.composite })),
      exceptions:  excSummary.bySeverity,
    };
  },

  /**
   * Level 1 — Route drill-down.
   * Returns dispatches on the route + route performance detail.
   */
  fromRoute(routeId, filters = {}) {
    const route      = DAL.routes.getById(routeId);
    if (!route)      return { error: `Route ${routeId} not found.` };

    const score      = RoutePerformanceScorer.score(routeId);
    const dispatches = DAL.dispatches.getAll()
      .filter(d => d.routeId === routeId);
    const filtered   = applyFilters(dispatches, filters)
      .map(d => DispatchDashboardService._enrich(d));

    return {
      level:       'route → dispatch',
      route,
      performance: score,
      cost:        CostEngine.routeCost(routeId),
      dispatches:  filtered,
      drillTargets: filtered.map(d => ({ dispatchId: d.id, status: d.status, slaAtRisk: d.sla?.atRisk })),
      consolidation: ConsolidationEngine.findOpportunities().filter(o => o.routeId === routeId),
    };
  },

  /**
   * Level 2 — Dispatch drill-down.
   * Returns full dispatch detail + HU list + exceptions.
   */
  fromDispatch(dispatchId) {
    const detail = DispatchDashboardService.getDetail(dispatchId);
    if (!detail)  return { error: `Dispatch ${dispatchId} not found.` };

    const capacity = CapacityEngine.forDispatch(dispatchId);
    const registry = window.TCT.HURegistry
      ? detail.huDispatched?.map(b => window.TCT.HURegistry.getCustody(b)).filter(Boolean)
      : [];

    return {
      level:     'dispatch → HU',
      dispatch:  detail,
      capacity,
      hu:        {
        dispatched: detail.huDispatched || [],
        received:   detail.huReceived   || [],
        registry,
      },
      drillTargets: (detail.huDispatched || []).map(b => ({ barcode: b })),
      exceptions:   detail.exceptions,
    };
  },

  /**
   * Level 3 — HU drill-down.
   * Returns chain of custody + all scan events for a barcode.
   */
  fromHU(barcode) {
    const registry = window.TCT.HURegistry;
    if (!registry) return { error: 'HURegistry (step 3) not loaded.' };

    const custody = registry.getCustody(barcode);
    if (!custody)  return { error: `HU ${barcode} not found in registry.` };

    const dispatch = DAL.dispatches.getById(custody.dispatchId);

    return {
      level:       'HU → audit trail',
      barcode,
      custody,
      dispatch:    dispatch ? DispatchDashboardService._enrich(dispatch) : null,
      drillTargets: [{ dispatchId: custody.dispatchId }],
    };
  },

  /**
   * Level 4 — Audit Trail.
   * Returns full audit log for a dispatch, optionally filtered by action.
   * @param {string} dispatchId
   * @param {string|null} actionFilter
   */
  auditTrail(dispatchId, actionFilter = null) {
    const d = DAL.dispatches.getById(dispatchId);
    if (!d) return { error: `Dispatch ${dispatchId} not found.` };

    let log = d.auditLog || [];
    if (actionFilter) log = log.filter(e => e.action === actionFilter);

    /* Also pull from global audit log */
    const globalLog = (() => {
      try {
        return JSON.parse(localStorage.getItem('tct_audit_log')) || [];
      } catch { return []; }
    })().filter(e => e.dispatchId === dispatchId);

    const merged = [...log, ...globalLog]
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    /* Deduplicate by timestamp+action */
    const seen = new Set();
    const deduped = merged.filter(e => {
      const key = `${e.timestamp}:${e.action}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      level:       'audit trail',
      dispatchId,
      routeCode:   d.routeCode,
      totalEntries:deduped.length,
      entries:     deduped,
      actions:     [...new Set(deduped.map(e => e.action))],
    };
  },
};

/* ═══════════════════════════════════════════════════
   MASTER DASHBOARD SERVICE
   ─────────────────────────────────────────────────
   Single entry point to hydrate an entire dashboard
   in one call.  Runs sub-services in a defined order
   and collects results into a named payload map.
═══════════════════════════════════════════════════ */
const DashboardMaster = {

  /**
   * Hydrate all executive-level panels at once.
   */
  hydrateExecutive(opts = {}) {
    return {
      kpis:        ExecutiveDashboardService.getKPIs(opts),
      timeSeries:  ExecutiveDashboardService.getTimeSeries(7, opts),
      topRisks:    ExecutiveDashboardService.getTopRisks(opts),
      alerts:      AlertService.getAll(opts),
      funnel:      DispatchDashboardService.getStatusFunnel(opts),
      generatedAt: now(),
    };
  },

  /**
   * Hydrate all dispatch panel data.
   */
  hydrateDispatch(filters = {}, page = 1, pageSize = 20, opts = {}) {
    return {
      funnel:    DispatchDashboardService.getStatusFunnel(opts),
      list:      DispatchDashboardService.getList(filters, page, pageSize, opts),
      atRisk:    DispatchDashboardService.getAtRisk(opts),
      generatedAt: now(),
    };
  },

  /**
   * Hydrate all exception panel data.
   */
  hydrateExceptions(filters = {}, page = 1, pageSize = 20, opts = {}) {
    return {
      summary:     ExceptionDashboardService.getSummary(opts),
      byRegion:    ExceptionDashboardService.getOpenByRegion(opts),
      byCarrier:   ExceptionDashboardService.getOpenByCarrier(opts),
      rootCause:   ExceptionDashboardService.getRootCauseAnalysis(opts),
      list:        ExceptionDashboardService.getList(filters, page, pageSize, opts),
      generatedAt: now(),
    };
  },

  /**
   * Hydrate all route panel data.
   */
  hydrateRoutes(opts = {}) {
    return {
      performance:  RouteDashboardService.getPerformanceTable(opts),
      sla:          RouteDashboardService.getSLABreakdown(opts),
      delays:       RouteDashboardService.getDelayAnalysis(opts),
      utilization:  RouteDashboardService.getUtilizationBreakdown(opts),
      generatedAt:  now(),
    };
  },

  /**
   * Hydrate all carrier panel data.
   */
  hydrateCarriers(opts = {}) {
    return {
      ranking:        CarrierDashboardService.getRanking(opts),
      slaCompliance:  CarrierDashboardService.getSLACompliance(opts),
      delayProfile:   CarrierDashboardService.getDelayProfile(opts),
      costEfficiency: CarrierDashboardService.getCostEfficiency(opts),
      generatedAt:    now(),
    };
  },

  /**
   * Hydrate all reconciliation panel data.
   */
  hydrateReconciliation(filters = {}, page = 1, pageSize = 20, opts = {}) {
    return {
      summary:    ReconciliationDashboardService.getSummary(opts),
      list:       ReconciliationDashboardService.getDispatchList(filters, page, pageSize, opts),
      exceptions: ReconciliationDashboardService.getReconciliationExceptions(opts),
      generatedAt:now(),
    };
  },

  /**
   * Invalidate all dashboard caches (call after any state mutation).
   */
  invalidateAll() {
    Cache.invalidate();
  },
};

/* ═══════════════════════════════════════════════════
   EXPOSE TO WINDOW.TCT
═══════════════════════════════════════════════════ */
Object.assign(window.TCT, {
  /* Services */
  ExecutiveDashboardService,
  DispatchDashboardService,
  ExceptionDashboardService,
  RouteDashboardService,
  CarrierDashboardService,
  ReconciliationDashboardService,
  AlertService,
  DrillDownService,
  DashboardMaster,
  /* Utilities exposed for UI layer */
  DashboardCache: Cache,
  applyFilters,
  paginate,
});

console.log('[TCT Step 7] Dashboard Service Layer loaded.');
// → Next module: STEP 8
