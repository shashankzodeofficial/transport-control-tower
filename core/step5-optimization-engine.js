/**
 * TRANSPORT CONTROL TOWER — STEP 5: LOAD PLANNING & OPTIMIZATION ENGINE
 * =======================================================================
 * Depends on: step1, step2, step3, step4
 *
 * Responsibilities:
 *  1. Vehicle capacity planning — weight / volume / HU utilization
 *  2. Load consolidation engine — multi-dispatch merging
 *  3. Route optimization — single + multi-stop, distance/time/cost/SLA
 *  4. Cost optimization engine — per dispatch/HU/km/route
 *  5. SLA vs Cost simulation — 3 scenario trade-off model
 *  6. Vehicle recommendation engine — type/carrier based on load profile
 *  7. Route performance scoring — reliability/SLA/delay/cost efficiency
 *  8. Planning analytics — utilization, empty capacity, savings
 */

'use strict';

if (!window.TCT?.DAL || !window.TCT?.ExceptionFactory) {
  throw new Error('[TCT Step 5] Steps 1–4 must be loaded first.');
}

const { DAL, KEYS, DB, KPIEngine, ExceptionAnalytics } = window.TCT;

/* ═══════════════════════════════════════════════════
   VEHICLE TYPE MASTER
   ─────────────────────────────────────────────────
   Physical and cost parameters per vehicle type.
   Costs in INR/km (base) + INR/day (fixed).
═══════════════════════════════════════════════════ */
const VEHICLE_TYPES = {
  'lcv': {
    label:        'Light Commercial Vehicle',
    maxWeightKg:  2000,
    maxCbm:       12,
    maxHU:        30,
    baseCostKm:   18,
    fixedCostDay: 800,
    speedKmh:     60,
  },
  '20ft-truck': {
    label:        '20 ft Truck',
    maxWeightKg:  5000,
    maxCbm:       30,
    maxHU:        80,
    baseCostKm:   28,
    fixedCostDay: 1500,
    speedKmh:     55,
  },
  '26ft-truck': {
    label:        '26 ft Truck',
    maxWeightKg:  7000,
    maxCbm:       42,
    maxHU:        120,
    baseCostKm:   35,
    fixedCostDay: 2000,
    speedKmh:     55,
  },
  '32ft-truck': {
    label:        '32 ft Truck',
    maxWeightKg:  10000,
    maxCbm:       62,
    maxHU:        180,
    baseCostKm:   45,
    fixedCostDay: 2800,
    speedKmh:     50,
  },
  'trailer': {
    label:        'Trailer / Semi',
    maxWeightKg:  20000,
    maxCbm:       90,
    maxHU:        350,
    baseCostKm:   60,
    fixedCostDay: 4500,
    speedKmh:     50,
  },
};

/* Carrier type surcharge multiplier on base cost */
const CARRIER_SURCHARGE = { express: 1.35, ftl: 1.0, ltl: 0.85, '3pl': 1.1 };

/* SLA risk buffer — percentage of transit time used as safety margin */
const SLA_BUFFER_PCT = 0.15;

/* Consolidation threshold — dispatches are candidates if same route
   and planned departure within this window (hours) */
const CONSOLIDATION_WINDOW_HRS = 6;

/* Minimum utilization % before recommending consolidation */
const MIN_UTILIZATION_PCT = 60;

/* ═══════════════════════════════════════════════════
   1. VEHICLE CAPACITY PLANNING ENGINE
═══════════════════════════════════════════════════ */
const CapacityEngine = {

  /**
   * Compute utilization for a single dispatch against its vehicle.
   * @param {string} dispatchId
   * @returns {CapacityResult}
   */
  forDispatch(dispatchId) {
    const dispatch = DAL.dispatches.getById(dispatchId);
    if (!dispatch) return null;
    const vehicle  = DAL.vehicles.getById(dispatch.vehicleId);
    if (!vehicle)  return this._noVehicle(dispatch);

    return this._compute(
      vehicle.type,
      dispatch.totalWeightKg  || 0,
      dispatch.totalCbm       || 0,
      dispatch.huDispatched?.length || 0
    );
  },

  /**
   * Compute utilization for arbitrary load against a vehicle type.
   * @param {string} vehicleType   - Key from VEHICLE_TYPES
   * @param {number} weightKg
   * @param {number} cbm
   * @param {number} huCount
   * @returns {CapacityResult}
   */
  compute(vehicleType, weightKg, cbm, huCount) {
    return this._compute(vehicleType, weightKg, cbm, huCount);
  },

  /**
   * Detect if a load would overload a vehicle.
   */
  isOverloaded(vehicleType, weightKg, cbm, huCount) {
    const r = this._compute(vehicleType, weightKg, cbm, huCount);
    return r.overloaded;
  },

  /**
   * Remaining capacity on a vehicle given current load.
   */
  remaining(vehicleType, usedWeightKg, usedCbm, usedHU) {
    const spec = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['26ft-truck'];
    return {
      weightKg: Math.max(0, spec.maxWeightKg - usedWeightKg),
      cbm:      Math.max(0, spec.maxCbm      - usedCbm),
      hu:       Math.max(0, spec.maxHU       - usedHU),
    };
  },

  _compute(vehicleType, weightKg, cbm, huCount) {
    const spec = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['26ft-truck'];

    const weightPct  = spec.maxWeightKg > 0 ? Math.round(weightKg / spec.maxWeightKg * 100) : 0;
    const volumePct  = spec.maxCbm      > 0 ? Math.round(cbm      / spec.maxCbm      * 100) : 0;
    const huPct      = spec.maxHU       > 0 ? Math.round(huCount  / spec.maxHU       * 100) : 0;

    /* Overall utilization = max of the three constraints */
    const overallPct = Math.max(weightPct, volumePct, huPct);

    /* Binding constraint */
    const binding = weightPct >= volumePct && weightPct >= huPct ? 'weight'
      : volumePct >= huPct ? 'volume' : 'hu';

    const overloaded = weightPct > 100 || volumePct > 100 || huPct > 100;
    const status     = overloaded ? 'overloaded'
      : overallPct >= 90 ? 'full'
      : overallPct >= MIN_UTILIZATION_PCT ? 'optimal'
      : 'underutilized';

    return {
      vehicleType,
      spec,
      load: { weightKg, cbm, huCount },
      utilization: { weightPct, volumePct, huPct, overallPct },
      remaining: {
        weightKg: Math.max(0, spec.maxWeightKg - weightKg),
        cbm:      Math.max(0, spec.maxCbm      - cbm),
        hu:       Math.max(0, spec.maxHU       - huCount),
      },
      binding,
      overloaded,
      status,
      statusColor: overloaded ? 'danger' : overallPct >= 90 ? 'warning' : overallPct >= MIN_UTILIZATION_PCT ? 'success' : 'info',
    };
  },

  _noVehicle(dispatch) {
    return {
      vehicleType: null,
      spec:        null,
      load: {
        weightKg: dispatch.totalWeightKg || 0,
        cbm:      dispatch.totalCbm     || 0,
        huCount:  dispatch.huDispatched?.length || 0,
      },
      utilization: { weightPct: null, volumePct: null, huPct: null, overallPct: null },
      remaining:   null,
      binding:     null,
      overloaded:  false,
      status:      'no-vehicle',
      statusColor: 'neutral',
    };
  },

  /**
   * Fleet-wide utilization snapshot.
   */
  fleetSnapshot() {
    const dispatches = DAL.dispatches.getAll()
      .filter(d => ['dispatched','in-transit'].includes(d.status));
    return dispatches.map(d => ({
      dispatchId:  d.id,
      routeCode:   d.routeCode,
      vehicle:     d.vehicleReg,
      ...this.forDispatch(d.id),
    }));
  },
};

/* ═══════════════════════════════════════════════════
   2. LOAD CONSOLIDATION ENGINE
═══════════════════════════════════════════════════ */
const ConsolidationEngine = {

  /**
   * Find consolidation opportunities across all planned/ready dispatches.
   * Groups by route + planned departure window.
   * @returns {ConsolidationOpportunity[]}
   */
  findOpportunities() {
    const candidates = DAL.dispatches.getAll()
      .filter(d => ['planned','ready'].includes(d.status) && d.plannedDeparture);

    /* Group by routeId */
    const byRoute = {};
    candidates.forEach(d => {
      if (!byRoute[d.routeId]) byRoute[d.routeId] = [];
      byRoute[d.routeId].push(d);
    });

    const opportunities = [];

    Object.entries(byRoute).forEach(([routeId, dispatches]) => {
      if (dispatches.length < 2) return;

      /* Sort by plannedDeparture */
      dispatches.sort((a,b) => new Date(a.plannedDeparture) - new Date(b.plannedDeparture));

      /* Sliding window — find dispatches within CONSOLIDATION_WINDOW_HRS */
      const used = new Set();
      dispatches.forEach((anchor, i) => {
        if (used.has(anchor.id)) return;
        const anchorTime = new Date(anchor.plannedDeparture);
        const group      = [anchor];

        dispatches.slice(i + 1).forEach(d => {
          if (used.has(d.id)) return;
          const diff = Math.abs(new Date(d.plannedDeparture) - anchorTime) / 3600000;
          if (diff <= CONSOLIDATION_WINDOW_HRS) group.push(d);
        });

        if (group.length < 2) return;

        /* Compute combined load */
        const combined = {
          weightKg: group.reduce((s,d) => s + (d.totalWeightKg || 0), 0),
          cbm:      group.reduce((s,d) => s + (d.totalCbm     || 0), 0),
          huCount:  group.reduce((s,d) => s + (d.huDispatched?.length || 0), 0),
        };

        /* Recommend vehicle type for combined load */
        const recVehicle = VehicleRecommendationEngine.recommendType(
          combined.huCount, combined.weightKg, combined.cbm, null
        );

        /* Savings estimate */
        const savings = this._estimateSavings(group, recVehicle.vehicleType, routeId);

        if (savings.savingsINR > 0) {
          group.forEach(d => used.add(d.id));
          opportunities.push({
            id:              `CONSOL-${routeId}-${Date.now().toString(36)}`,
            routeId,
            routeCode:       group[0].routeCode,
            routeName:       group[0].routeName,
            dispatches:      group.map(d => ({
              id:           d.id,
              plannedDep:   d.plannedDeparture,
              huCount:      d.huDispatched?.length || 0,
              weightKg:     d.totalWeightKg || 0,
              cbm:          d.totalCbm     || 0,
              utilization:  CapacityEngine.forDispatch(d.id)?.utilization?.overallPct || 0,
            })),
            combinedLoad:    combined,
            recommendedVehicle: recVehicle,
            capacity:        CapacityEngine.compute(recVehicle.vehicleType, combined.weightKg, combined.cbm, combined.huCount),
            savings,
            feasible:        !CapacityEngine.isOverloaded(recVehicle.vehicleType, combined.weightKg, combined.cbm, combined.huCount),
            generatedAt:     new Date().toISOString(),
          });
        }
      });
    });

    return opportunities.sort((a,b) => b.savings.savingsINR - a.savings.savingsINR);
  },

  /**
   * Estimate cost savings from consolidating a group of dispatches.
   */
  _estimateSavings(dispatches, consolidatedType, routeId) {
    const route = DAL.routes.getById(routeId);
    const distKm = route?.distanceKm || 500;

    /* Current cost: each dispatch in its own vehicle */
    const currentCost = dispatches.reduce((sum, d) => {
      const veh  = DAL.vehicles.getById(d.vehicleId);
      const type = veh?.type || '26ft-truck';
      return sum + CostEngine.tripCost(type, distKm, d.carrierId);
    }, 0);

    /* Consolidated cost: one vehicle (use carrier of first dispatch) */
    const carrierId      = dispatches[0].carrierId;
    const consolidatedCost = CostEngine.tripCost(consolidatedType, distKm, carrierId);

    const savingsINR = Math.max(0, currentCost - consolidatedCost);
    const savingsPct = currentCost > 0 ? Math.round(savingsINR / currentCost * 100) : 0;

    return {
      currentCost:       Math.round(currentCost),
      consolidatedCost:  Math.round(consolidatedCost),
      savingsINR:        Math.round(savingsINR),
      savingsPct,
      co2SavedKg:        Math.round(savingsINR * 0.002),   // rough estimate
    };
  },
};

/* ═══════════════════════════════════════════════════
   3. ROUTE OPTIMIZATION ENGINE
═══════════════════════════════════════════════════ */
const RouteOptimizer = {

  /**
   * Evaluate a single-stop route plan.
   * @param {string} originId
   * @param {string} destId
   * @param {string} vehicleType
   * @param {string} carrierId
   * @param {object} load  { weightKg, cbm, huCount }
   * @returns {RoutePlan}
   */
  evaluateSingleStop(originId, destId, vehicleType, carrierId, load = {}) {
    const route     = this._findRoute(originId, destId);
    const spec      = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['26ft-truck'];
    const distKm    = route?.distanceKm || this._estimateDistance(originId, destId);
    const transitHrs = distKm / spec.speedKmh;
    const slaHrs    = route?.slaHours || Math.ceil(transitHrs * (1 + SLA_BUFFER_PCT));
    const capacity  = CapacityEngine.compute(vehicleType, load.weightKg||0, load.cbm||0, load.huCount||0);
    const cost      = CostEngine.tripCost(vehicleType, distKm, carrierId);
    const slaRisk   = this._slaRisk(transitHrs, slaHrs);

    return {
      type:       'single-stop',
      originId,
      destId,
      routeId:    route?.id || null,
      routeCode:  route?.code || `${originId}→${destId}`,
      distanceKm: distKm,
      transitHrs: Math.round(transitHrs * 10) / 10,
      slaHrs,
      slaRisk,
      cost,
      capacity,
      score:      this._planScore(capacity.utilization.overallPct, slaRisk.riskPct, cost.totalINR),
    };
  },

  /**
   * Evaluate a multi-stop route plan.
   * Stops are evaluated in order: origin → stop1 → stop2 → ... → dest
   * @param {string[]} locationIds   - Ordered stop IDs including origin and dest
   * @param {string}   vehicleType
   * @param {string}   carrierId
   * @param {object[]} loadsPerLeg  - Load dropped at each stop [{ weightKg, cbm, huCount }]
   * @returns {MultiStopPlan}
   */
  evaluateMultiStop(locationIds, vehicleType, carrierId, loadsPerLeg = []) {
    if (locationIds.length < 2) {
      return { error: 'At least 2 locations required for a route plan.' };
    }

    const spec = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['26ft-truck'];
    const legs = [];
    let cumulativeWeightKg = loadsPerLeg.reduce((s,l) => s + (l.weightKg||0), 0);
    let cumulativeCbm      = loadsPerLeg.reduce((s,l) => s + (l.cbm||0), 0);
    let cumulativeHU       = loadsPerLeg.reduce((s,l) => s + (l.huCount||0), 0);
    let totalDistKm        = 0;
    let totalCostINR       = 0;
    let totalTransitHrs    = 0;
    let maxSlaRiskPct      = 0;

    for (let i = 0; i < locationIds.length - 1; i++) {
      const fromId    = locationIds[i];
      const toId      = locationIds[i + 1];
      const route     = this._findRoute(fromId, toId);
      const distKm    = route?.distanceKm || this._estimateDistance(fromId, toId);
      const legDrop   = loadsPerLeg[i] || {};

      /* Drop load at this stop */
      if (i > 0) {
        cumulativeWeightKg = Math.max(0, cumulativeWeightKg - (legDrop.weightKg || 0));
        cumulativeCbm      = Math.max(0, cumulativeCbm      - (legDrop.cbm     || 0));
        cumulativeHU       = Math.max(0, cumulativeHU       - (legDrop.huCount || 0));
      }

      const transitHrs  = distKm / spec.speedKmh;
      const legCost     = CostEngine.tripCost(vehicleType, distKm, carrierId);
      const capacity    = CapacityEngine.compute(vehicleType, cumulativeWeightKg, cumulativeCbm, cumulativeHU);
      const slaRisk     = this._slaRisk(totalTransitHrs + transitHrs, route?.slaHours || 48);

      totalDistKm    += distKm;
      totalCostINR   += legCost.totalINR;
      totalTransitHrs += transitHrs;
      maxSlaRiskPct   = Math.max(maxSlaRiskPct, slaRisk.riskPct);

      legs.push({
        legNo:       i + 1,
        fromId,
        toId,
        routeCode:   route?.code || `L${i+1}`,
        distanceKm:  distKm,
        transitHrs:  Math.round(transitHrs * 10) / 10,
        loadAtLeg:   { weightKg: cumulativeWeightKg, cbm: cumulativeCbm, huCount: cumulativeHU },
        dropAtStop:  legDrop,
        capacity,
        legCostINR:  legCost.totalINR,
        slaRisk,
      });
    }

    /* Multi-stop penalty: +15% cost per additional stop */
    const stopPenalty    = 1 + (locationIds.length - 2) * 0.15;
    const adjustedCost   = Math.round(totalCostINR * stopPenalty);
    const extraStopCost  = adjustedCost - Math.round(totalCostINR);

    return {
      type:           'multi-stop',
      locationIds,
      stopCount:      locationIds.length,
      legs,
      totalDistanceKm: Math.round(totalDistKm),
      totalTransitHrs: Math.round(totalTransitHrs * 10) / 10,
      totalCostINR:    adjustedCost,
      baseRouteCost:   Math.round(totalCostINR),
      multiStopPenalty: extraStopCost,
      maxSlaRiskPct,
      slaRiskLabel:   maxSlaRiskPct > 75 ? 'high' : maxSlaRiskPct > 40 ? 'medium' : 'low',
      overallScore:   this._planScore(
        legs[0]?.capacity?.utilization?.overallPct || 0,
        maxSlaRiskPct,
        adjustedCost
      ),
    };
  },

  _findRoute(originId, destId) {
    return DAL.routes.getAll().find(r =>
      r.active && r.originId === originId && r.destId === destId
    ) || null;
  },

  _estimateDistance(originId, destId) {
    /* Fallback: lookup from any dispatch on this lane */
    const d = DAL.dispatches.getAll().find(x =>
      x.originId === originId && x.destId === destId
    );
    return 800;   // Default when no route record
  },

  _slaRisk(transitHrs, slaHrs) {
    const buffer    = slaHrs - transitHrs;
    const riskPct   = slaHrs > 0 ? Math.max(0, Math.round((1 - buffer / slaHrs) * 100)) : 50;
    const riskLabel = riskPct > 80 ? 'critical' : riskPct > 60 ? 'high' : riskPct > 40 ? 'medium' : 'low';
    return { buffer: Math.round(buffer * 10) / 10, riskPct, riskLabel };
  },

  _planScore(utilizationPct, slaRiskPct, costINR) {
    /* Composite score: higher is better */
    const utilScore  = Math.min(100, utilizationPct);
    const slaScore   = 100 - slaRiskPct;
    const costScore  = Math.max(0, 100 - Math.round(costINR / 1000));  // rough normalisation
    return Math.round((utilScore * 0.4 + slaScore * 0.4 + costScore * 0.2));
  },
};

/* ═══════════════════════════════════════════════════
   4. COST ENGINE
═══════════════════════════════════════════════════ */
const CostEngine = {

  /**
   * Calculate full trip cost.
   * @param {string} vehicleType
   * @param {number} distanceKm
   * @param {string} carrierId
   * @returns {TripCost}
   */
  tripCost(vehicleType, distanceKm, carrierId) {
    const spec     = VEHICLE_TYPES[vehicleType] || VEHICLE_TYPES['26ft-truck'];
    const carrier  = DAL.carriers.getById(carrierId);
    const surcharge = CARRIER_SURCHARGE[carrier?.type] || 1.0;
    const transitDays = distanceKm / (spec.speedKmh * 10);  // ~10 driving hrs/day

    const runningCost = spec.baseCostKm * distanceKm * surcharge;
    const fixedCost   = spec.fixedCostDay * Math.ceil(transitDays);
    const tollEstimate = distanceKm * 1.2;         // ₹1.2/km toll estimate
    const total        = runningCost + fixedCost + tollEstimate;

    return {
      vehicleType,
      distanceKm,
      carrierId:     carrierId || null,
      carrierName:   carrier?.name || 'Unknown',
      runningCostINR: Math.round(runningCost),
      fixedCostINR:   Math.round(fixedCost),
      tollEstimateINR:Math.round(tollEstimate),
      totalINR:       Math.round(total),
      surcharge,
      transitDays:    Math.round(transitDays * 10) / 10,
    };
  },

  /**
   * Cost per HU for a dispatch.
   */
  costPerHU(dispatchId) {
    const d = DAL.dispatches.getById(dispatchId);
    if (!d) return null;
    const v     = DAL.vehicles.getById(d.vehicleId);
    const route = DAL.routes.getById(d.routeId);
    const cost  = this.tripCost(v?.type || '26ft-truck', route?.distanceKm || 500, d.carrierId);
    const hus   = d.huDispatched?.length || 1;
    return {
      ...cost,
      huCount:      hus,
      costPerHU:    Math.round(cost.totalINR / hus),
      costPerKm:    Math.round(cost.totalINR / (route?.distanceKm || 1)),
    };
  },

  /**
   * Route-level cost aggregation.
   */
  routeCost(routeId) {
    const dispatches = DAL.dispatches.getAll()
      .filter(d => d.routeId === routeId && d.actualDeparture);
    const route      = DAL.routes.getById(routeId);
    const distKm     = route?.distanceKm || 500;

    const costs = dispatches.map(d => {
      const v = DAL.vehicles.getById(d.vehicleId);
      return this.tripCost(v?.type || '26ft-truck', distKm, d.carrierId);
    });

    const total     = costs.reduce((s,c) => s + c.totalINR, 0);
    const totalHU   = dispatches.reduce((s,d) => s + (d.huDispatched?.length||0), 0);
    const avgPerDsp = dispatches.length ? Math.round(total / dispatches.length) : 0;
    const avgPerHU  = totalHU ? Math.round(total / totalHU) : 0;
    const avgPerKm  = dispatches.length ? Math.round(total / (distKm * dispatches.length)) : 0;

    return {
      routeId,
      routeCode:          route?.code,
      distanceKm:         distKm,
      totalDispatches:    dispatches.length,
      totalCostINR:       Math.round(total),
      avgCostPerDispatch: avgPerDsp,
      avgCostPerHU:       avgPerHU,
      avgCostPerKm:       avgPerKm,
      totalHU,
    };
  },

  /**
   * All routes cost summary table.
   */
  allRoutesCost() {
    return DAL.routes.getAll().map(r => this.routeCost(r.id));
  },
};

/* ═══════════════════════════════════════════════════
   5. SLA vs COST SIMULATION ENGINE
   ─────────────────────────────────────────────────
   Generates 3 scenarios for a given load + route:
   A — Lowest Cost
   B — Balanced (optimal)
   C — Fastest / Best SLA
═══════════════════════════════════════════════════ */
const ScenarioSimulator = {

  /**
   * Run all 3 scenarios for a load profile + route.
   * @param {object} load   { weightKg, cbm, huCount }
   * @param {string} routeId
   * @param {string[]} availableCarrierIds   - Subset to evaluate (empty = all active)
   * @returns {{ scenarioA, scenarioB, scenarioC, comparison }}
   */
  simulate(load, routeId, availableCarrierIds = []) {
    const route   = DAL.routes.getById(routeId);
    if (!route)   return { error: `Route ${routeId} not found.` };

    const carriers = (availableCarrierIds.length
      ? availableCarrierIds.map(id => DAL.carriers.getById(id)).filter(Boolean)
      : DAL.carriers.getAll().filter(c => c.active));

    /* Vehicle types suitable for this load */
    const suitableTypes = Object.entries(VEHICLE_TYPES)
      .filter(([, spec]) =>
        spec.maxWeightKg >= (load.weightKg || 0) &&
        spec.maxCbm      >= (load.cbm      || 0) &&
        spec.maxHU       >= (load.huCount  || 0)
      )
      .map(([type]) => type);

    if (!suitableTypes.length) {
      return { error: 'No suitable vehicle type for this load. Load exceeds all vehicle capacities.' };
    }

    /* Build option matrix: each vehicle type × each carrier */
    const options = [];
    suitableTypes.forEach(vType => {
      carriers.forEach(carrier => {
        const cost      = CostEngine.tripCost(vType, route.distanceKm, carrier.id);
        const spec      = VEHICLE_TYPES[vType];
        const transitHrs = route.distanceKm / spec.speedKmh;
        const capacity  = CapacityEngine.compute(vType, load.weightKg||0, load.cbm||0, load.huCount||0);
        const slaRisk   = this._slaRiskScore(transitHrs, route.slaHours);
        const otaScore  = carrier.otaRate || 80;

        options.push({
          vehicleType:  vType,
          vehicleLabel: spec.label,
          carrierId:    carrier.id,
          carrierName:  carrier.name,
          carrierType:  carrier.type,
          cost,
          transitHrs:   Math.round(transitHrs * 10) / 10,
          slaHrs:       route.slaHours,
          slaBuffer:    Math.round((route.slaHours - transitHrs) * 10) / 10,
          slaRisk,
          otaScore,
          capacity,
          utilizationPct: capacity.utilization.overallPct,
        });
      });
    });

    /* ── Scenario A: Lowest Cost ── */
    const scenarioA = this._buildScenario(
      'A', 'Lowest Cost',
      'Minimise transport spend. May sacrifice SLA buffer.',
      options.sort((a,b) => a.cost.totalINR - b.cost.totalINR)[0],
      load, route
    );

    /* ── Scenario C: Fastest / Best SLA ── */
    const scenarioC = this._buildScenario(
      'C', 'Fastest Delivery (Best SLA)',
      'Maximise delivery speed and SLA compliance. Higher cost.',
      options.sort((a,b) => a.transitHrs - b.transitHrs || b.otaScore - a.otaScore)[0],
      load, route
    );

    /* ── Scenario B: Balanced ── */
    /* Score = 0.4×utilization + 0.3×SLA + 0.3×(1-costNorm) */
    const maxCost = Math.max(...options.map(o => o.cost.totalINR));
    const minCost = Math.min(...options.map(o => o.cost.totalINR));
    const costRange = maxCost - minCost || 1;
    const balanced  = options
      .map(o => ({
        ...o,
        balanceScore: Math.round(
          0.4 * o.utilizationPct +
          0.3 * o.otaScore +
          0.3 * (1 - (o.cost.totalINR - minCost) / costRange) * 100
        ),
      }))
      .sort((a,b) => b.balanceScore - a.balanceScore)[0];

    const scenarioB = this._buildScenario(
      'B', 'Balanced (Recommended)',
      'Optimal balance of cost, SLA compliance and vehicle utilization.',
      balanced, load, route, balanced.balanceScore
    );

    /* ── Comparison table ── */
    const comparison = {
      costDiff_AtoB:   scenarioB.cost.totalINR - scenarioA.cost.totalINR,
      costDiff_AtoC:   scenarioC.cost.totalINR - scenarioA.cost.totalINR,
      transitDiff_AtoC: (scenarioA.transitHrs   - scenarioC.transitHrs),
      slaBufferDiff_AtoC: (scenarioC.slaBuffer  - scenarioA.slaBuffer),
      recommendation: 'B',
    };

    return { scenarioA, scenarioB, scenarioC, comparison, generatedAt: new Date().toISOString() };
  },

  _buildScenario(id, name, rationale, option, load, route, score = null) {
    return {
      scenarioId:     id,
      name,
      rationale,
      vehicleType:    option.vehicleType,
      vehicleLabel:   option.vehicleLabel,
      carrierId:      option.carrierId,
      carrierName:    option.carrierName,
      cost:           option.cost,
      transitHrs:     option.transitHrs,
      slaHrs:         route.slaHours,
      slaBuffer:      option.slaBuffer,
      slaRisk:        option.slaRisk,
      utilizationPct: option.utilizationPct,
      capacity:       option.capacity,
      otaScore:       option.otaScore,
      balanceScore:   score,
      load,
    };
  },

  _slaRiskScore(transitHrs, slaHrs) {
    const ratio = slaHrs > 0 ? transitHrs / slaHrs : 1;
    const pct   = Math.min(100, Math.round(ratio * 100));
    return {
      riskPct:   pct,
      riskLabel: pct > 90 ? 'critical' : pct > 75 ? 'high' : pct > 50 ? 'medium' : 'low',
    };
  },
};

/* ═══════════════════════════════════════════════════
   6. VEHICLE RECOMMENDATION ENGINE
═══════════════════════════════════════════════════ */
const VehicleRecommendationEngine = {

  /**
   * Recommend the optimal vehicle type for a given load + SLA.
   * @param {number} huCount
   * @param {number} weightKg
   * @param {number} cbm
   * @param {number|null} slaHours  - null = ignore SLA constraint
   * @returns {VehicleRecommendation}
   */
  recommendType(huCount, weightKg, cbm, slaHours) {
    const entries = Object.entries(VEHICLE_TYPES);

    /* Filter: must fit the load */
    const suitable = entries.filter(([, spec]) =>
      spec.maxWeightKg >= (weightKg || 0) &&
      spec.maxCbm      >= (cbm      || 0) &&
      spec.maxHU       >= (huCount  || 0)
    );

    if (!suitable.length) {
      return {
        vehicleType: 'trailer',
        reason: 'Load exceeds standard vehicle capacity. Trailer recommended.',
        utilization: null,
        alternatives: [],
      };
    }

    /* Score each suitable type:
       - Prefer 70–90% utilization (not underloaded, not too full)
       - If SLA is tight, prefer faster vehicles  */
    const scored = suitable.map(([type, spec]) => {
      const weightPct = spec.maxWeightKg > 0 ? weightKg / spec.maxWeightKg * 100 : 0;
      const volPct    = spec.maxCbm      > 0 ? cbm      / spec.maxCbm      * 100 : 0;
      const huPct     = spec.maxHU       > 0 ? huCount  / spec.maxHU       * 100 : 0;
      const util      = Math.max(weightPct, volPct, huPct);

      /* Penalise underutilization heavily */
      const utilScore = util >= 90 ? 60 : util >= 70 ? 100 : util >= 50 ? 75 : 40;

      /* SLA score: faster vehicle = higher score when SLA is tight */
      const slaScore = slaHours
        ? (spec.speedKmh / 60) * 100
        : 50;

      /* Cost efficiency: smaller = cheaper (prefer smallest fitting vehicle) */
      const costScore = 100 - (Object.keys(VEHICLE_TYPES).indexOf(type) * 15);

      return {
        vehicleType:  type,
        label:        spec.label,
        utilization:  Math.round(util),
        score:        Math.round(utilScore * 0.5 + slaScore * 0.3 + costScore * 0.2),
        spec,
      };
    }).sort((a,b) => b.score - a.score);

    const best = scored[0];
    const capacity = CapacityEngine.compute(best.vehicleType, weightKg||0, cbm||0, huCount||0);

    return {
      vehicleType:     best.vehicleType,
      vehicleLabel:    best.label,
      score:           best.score,
      utilization:     best.utilization,
      capacity,
      reason:          this._reason(best.vehicleType, best.utilization, slaHours),
      alternatives:    scored.slice(1, 3).map(s => ({
        vehicleType: s.vehicleType,
        label:       s.label,
        utilization: s.utilization,
        score:       s.score,
      })),
    };
  },

  /**
   * Recommend best available carrier for a route + vehicle type.
   * @param {string} routeId
   * @param {string} vehicleType
   * @returns {CarrierRecommendation}
   */
  recommendCarrier(routeId, vehicleType) {
    const route      = DAL.routes.getById(routeId);
    const preferred  = route?.preferredCarrierIds || [];
    const allCarriers = DAL.carriers.getAll().filter(c => c.active);

    /* Score carriers: OTA rate, OTD rate, exception rate, preference */
    const scored = allCarriers.map(c => {
      const prefBonus   = preferred.includes(c.id) ? 20 : 0;
      const hasVehicle  = DAL.vehicles.getAll().some(v => v.carrierId === c.id && v.type === vehicleType && v.active);
      const vehicleBonus = hasVehicle ? 15 : -30;
      const score = Math.round(
        (c.otaRate || 80) * 0.4 +
        (c.otdRate || 80) * 0.3 +
        (100 - (c.exceptionRate || 5)) * 0.3 +
        prefBonus +
        vehicleBonus
      );
      return { ...c, score, hasVehicle, isPreferred: preferred.includes(c.id) };
    }).sort((a,b) => b.score - a.score);

    const best = scored[0];
    if (!best) return { carrierId: null, reason: 'No active carriers available.' };

    return {
      carrierId:     best.id,
      carrierName:   best.name,
      carrierType:   best.type,
      score:         best.score,
      otaRate:       best.otaRate,
      otdRate:       best.otdRate,
      exceptionRate: best.exceptionRate,
      isPreferred:   best.isPreferred,
      hasVehicle:    best.hasVehicle,
      reason:        best.isPreferred
        ? `${best.name} is the preferred carrier for this route with ${best.otaRate}% OTA.`
        : `${best.name} has the best performance score (${best.score}) for this route.`,
      alternatives: scored.slice(1, 3),
    };
  },

  _reason(vehicleType, utilPct, slaHours) {
    const label = VEHICLE_TYPES[vehicleType]?.label || vehicleType;
    if (utilPct >= 80) return `${label} is the right fit — ${utilPct}% utilization is optimal.`;
    if (utilPct >= 60) return `${label} provides good utilization (${utilPct}%) with room for last-minute additions.`;
    return `${label} is the smallest vehicle that fits this load (${utilPct}% utilized). Consider consolidation.`;
  },
};

/* ═══════════════════════════════════════════════════
   7. ROUTE PERFORMANCE SCORING
═══════════════════════════════════════════════════ */
const RoutePerformanceScorer = {

  /**
   * Compute composite performance score for a route.
   * All sub-scores 0–100. Higher = better.
   * @param {string} routeId
   * @returns {RoutePerformanceScore}
   */
  score(routeId) {
    const route      = DAL.routes.getById(routeId);
    if (!route)      return null;
    const dispatches = DAL.dispatches.getAll().filter(d => d.routeId === routeId);
    if (!dispatches.length) {
      return { routeId, routeCode: route.code, score: null, reason: 'No dispatch history.' };
    }

    /* ── Reliability Score ── */
    /* % of dispatches that completed without exceptions */
    const withExc   = dispatches.filter(d => (d.exceptionIds||[]).length > 0).length;
    const relScore  = Math.round((1 - withExc / dispatches.length) * 100);

    /* ── SLA Score ── */
    const withArr   = dispatches.filter(d => d.actualArrival);
    const otaScore  = withArr.length
      ? Math.round(withArr.filter(d => d.otaStatus === 'on-time').length / withArr.length * 100)
      : null;

    /* ── Delay Score ── */
    /* Average OTA variance (lower is better) */
    const variances = withArr.map(d => d.otaVarianceMin || 0);
    const avgVariance = variances.length
      ? variances.reduce((s,v) => s+v, 0) / variances.length : 0;
    /* Map avg variance to 0–100: 0 min late = 100, 120 min late = 0 */
    const delayScore = Math.max(0, Math.round(100 - (avgVariance / 1.2)));

    /* ── Cost Efficiency Score ── */
    const costData    = CostEngine.routeCost(routeId);
    const avgCostPerKm = costData.avgCostPerKm || 0;
    /* Benchmark: ₹30/km = 100 score, ₹60/km = 0 score */
    const costScore   = Math.max(0, Math.min(100, Math.round((60 - avgCostPerKm) / 30 * 100)));

    /* ── Reconciliation Score ── */
    const reconciled  = dispatches.filter(d => ['reconciled','closed'].includes(d.status));
    const recoScore   = reconciled.length
      ? Math.round(reconciled.filter(d => d.reconciliationStatus === 'matched').length / reconciled.length * 100)
      : 100;

    /* ── Composite score ── */
    const composite = Math.round(
      relScore  * 0.25 +
      (otaScore || 80) * 0.30 +
      delayScore * 0.20 +
      costScore  * 0.15 +
      recoScore  * 0.10
    );

    const grade = composite >= 90 ? 'A' : composite >= 75 ? 'B' : composite >= 60 ? 'C' : composite >= 45 ? 'D' : 'F';

    return {
      routeId,
      routeCode:       route.code,
      routeName:       route.name,
      totalDispatches: dispatches.length,
      subScores: {
        reliability: { score: relScore,   weight: '25%', label: 'Exception-free dispatches' },
        slaCompliance:{ score: otaScore,  weight: '30%', label: 'On-Time Arrival %' },
        delayIndex:   { score: delayScore,weight: '20%', label: 'Delay performance (variance)' },
        costEfficiency:{ score: costScore,weight: '15%', label: 'Cost per km vs benchmark' },
        reconciliation:{ score: recoScore,weight: '10%', label: 'HU reconciliation match rate' },
      },
      composite,
      grade,
      avgVarianceMin: Math.round(avgVariance),
      avgCostPerKm,
      scoredAt: new Date().toISOString(),
    };
  },

  /**
   * Score all active routes and rank them.
   */
  scoreAll() {
    return DAL.routes.getAll()
      .filter(r => r.active)
      .map(r => this.score(r.id))
      .filter(Boolean)
      .sort((a,b) => (b.composite || 0) - (a.composite || 0));
  },
};

/* ═══════════════════════════════════════════════════
   8. PLANNING ANALYTICS ENGINE
═══════════════════════════════════════════════════ */
const PlanningAnalytics = {

  /**
   * Global planning metrics for dashboard.
   */
  globalMetrics() {
    const dispatches = DAL.dispatches.getAll();
    const active     = dispatches.filter(d => ['dispatched','in-transit'].includes(d.status));
    const planned    = dispatches.filter(d => ['planned','ready'].includes(d.status));

    /* Fleet utilization */
    const fleetData   = CapacityEngine.fleetSnapshot();
    const avgUtil     = fleetData.length
      ? Math.round(fleetData.reduce((s,f) => s + (f.utilization?.overallPct||0), 0) / fleetData.length)
      : 0;
    const underutil   = fleetData.filter(f => (f.utilization?.overallPct||0) < MIN_UTILIZATION_PCT).length;
    const overloaded  = fleetData.filter(f => f.overloaded).length;

    /* Consolidation opportunities */
    const opportunities = ConsolidationEngine.findOpportunities();
    const totalSavings  = opportunities.reduce((s,o) => s + o.savings.savingsINR, 0);

    /* Route utilization */
    const routeScores   = RoutePerformanceScorer.scoreAll();
    const avgRouteScore = routeScores.length
      ? Math.round(routeScores.reduce((s,r) => s + r.composite, 0) / routeScores.length)
      : null;

    /* Cost overview */
    const allCosts      = CostEngine.allRoutesCost();
    const totalCostINR  = allCosts.reduce((s,c) => s + c.totalCostINR, 0);
    const totalHU       = allCosts.reduce((s,c) => s + c.totalHU, 0);
    const avgCostPerHU  = totalHU ? Math.round(totalCostINR / totalHU) : 0;

    return {
      fleet: {
        active:             active.length,
        plannedDispatches:  planned.length,
        avgUtilization:     avgUtil,
        underutilized:      underutil,
        overloaded,
        emptyCapacityPct:   100 - avgUtil,
      },
      consolidation: {
        opportunities:      opportunities.length,
        potentialSavingsINR: Math.round(totalSavings),
        topOpportunities:   opportunities.slice(0, 5),
      },
      routing: {
        avgRouteScore,
        routeScores:        routeScores.slice(0, 5),
        bottomRoutes:       routeScores.slice(-3),
      },
      cost: {
        totalCostINR:       Math.round(totalCostINR),
        avgCostPerHU,
        byRoute:            allCosts.sort((a,b) => b.totalCostINR - a.totalCostINR).slice(0, 5),
      },
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Export-ready consolidation opportunities for Excel.
   */
  exportConsolidationData() {
    return ConsolidationEngine.findOpportunities().map(o => ({
      'Opportunity ID':      o.id,
      'Route':               o.routeCode,
      'Route Name':          o.routeName,
      'Dispatch Count':      o.dispatches.length,
      'Dispatch IDs':        o.dispatches.map(d => d.id).join('; '),
      'Combined HU Count':   o.combinedLoad.huCount,
      'Combined Weight (kg)':o.combinedLoad.weightKg,
      'Combined Volume (CBM)':o.combinedLoad.cbm,
      'Recommended Vehicle': o.recommendedVehicle.vehicleLabel,
      'Current Cost (₹)':    o.savings.currentCost,
      'Consolidated Cost (₹)':o.savings.consolidatedCost,
      'Savings (₹)':         o.savings.savingsINR,
      'Savings %':           o.savings.savingsPct,
      'Feasible':            o.feasible ? 'Yes' : 'No',
    }));
  },

  /**
   * Export route performance scores for Excel.
   */
  exportRouteScores() {
    return RoutePerformanceScorer.scoreAll().map(r => ({
      'Route Code':         r.routeCode,
      'Route Name':         r.routeName,
      'Dispatches':         r.totalDispatches,
      'Composite Score':    r.composite,
      'Grade':              r.grade,
      'Reliability %':      r.subScores.reliability.score,
      'SLA Compliance %':   r.subScores.slaCompliance.score,
      'Delay Index':        r.subScores.delayIndex.score,
      'Cost Efficiency':    r.subScores.costEfficiency.score,
      'Reconciliation %':   r.subScores.reconciliation.score,
      'Avg Delay (min)':    r.avgVarianceMin,
      'Avg Cost/km (₹)':    r.avgCostPerKm,
    }));
  },
};

/* ═══════════════════════════════════════════════════
   EXPOSE TO WINDOW.TCT
═══════════════════════════════════════════════════ */
Object.assign(window.TCT, {
  VEHICLE_TYPES,
  CARRIER_SURCHARGE,
  CapacityEngine,
  ConsolidationEngine,
  RouteOptimizer,
  CostEngine,
  ScenarioSimulator,
  VehicleRecommendationEngine,
  RoutePerformanceScorer,
  PlanningAnalytics,
});

console.log('[TCT Step 5] Load Planning & Optimization Engine loaded.');
// → Next module: STEP 6 (await instruction)
