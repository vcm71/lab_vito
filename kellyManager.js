/**
 * Kelly Criterion Avanzado — Control de Caja
 * Integrado con RouletteTracker para análisis de sesgo en tiempo real.
 */

import { kellySettingsStore } from './kellySettingsStore.js';

// Convierte chi² (df=37) a confianza estadística [0..1]
// df=37: χ²=37 → p≈0.5 (normal), χ²=52.19 → p≈0.05 (sesgado)
function chiToConfidence(chiSquare, total) {
  if (total < 38) return 0;
  const chi = parseFloat(chiSquare) || 0;
  // Lineal entre χ²=37 (sin sesgo) y χ²=52 (sesgo significativo p<0.05)
  const raw = (chi - 37) / (52 - 37);
  return Math.max(0, Math.min(1, raw));
}

// Kelly clásico: f* = (b*p - q) / b
function kellyFraction(p, b) {
  const q = 1 - p;
  return Math.max(0, (b * p - q) / b);
}

// Tasa de crecimiento logarítmica esperada (Growth Rate)
function growthRate(p, b, f) {
  if (f <= 0) return 0;
  const q = 1 - p;
  return p * Math.log(1 + b * f) + q * Math.log(1 - f);
}

// Tiradas para doblar el bankroll (aprox)
function spinsToDouble(p, b, f) {
  const g = growthRate(p, b, f);
  if (g <= 0) return Infinity;
  return Math.ceil(Math.log(2) / g);
}

// Riesgo de Ruina analítico (apuesta como fracción del bankroll)
function riskOfRuin(p, b, f) {
  if (f <= 0 || p <= 0) return 1;
  const q = 1 - p;
  if (p >= q * b + 1) return 0; // Ventaja enorme, ruina imposible
  const ratio = q / (p * (1 + b * f) - q * 0); // Simplificado
  const base = (1 - f * b) / (1 + f);
  if (base <= 0 || base >= 1) return base <= 0 ? 0 : 1;
  return Math.pow(base, 20); // Aproximación para 20 unidades de bankroll
}

const BETS_CONFIG = [
  { label: 'Rojo',      key: 'red',   statPath: ['colorsPct', 'red'],    pTheo: 18/38, b: 1, type: 'color' },
  { label: 'Negro',     key: 'black', statPath: ['colorsPct', 'black'],  pTheo: 18/38, b: 1, type: 'color' },
  { label: 'Par',       key: 'even',  statPath: ['parityPct', 'even'],   pTheo: 18/38, b: 1, type: 'parity' },
  { label: 'Impar',     key: 'odd',   statPath: ['parityPct', 'odd'],    pTheo: 18/38, b: 1, type: 'parity' },
  { label: '1-18',      key: 'low',   statPath: ['highLowPct', 'low'],   pTheo: 18/38, b: 1, type: 'highlow' },
  { label: '19-36',     key: 'high',  statPath: ['highLowPct', 'high'],  pTheo: 18/38, b: 1, type: 'highlow' },
  { label: 'Docena 1',  key: 'd1',   statPath: ['dozensPct', 'd1'],     pTheo: 12/38, b: 2, type: 'dozen' },
  { label: 'Docena 2',  key: 'd2',   statPath: ['dozensPct', 'd2'],     pTheo: 12/38, b: 2, type: 'dozen' },
  { label: 'Docena 3',  key: 'd3',   statPath: ['dozensPct', 'd3'],     pTheo: 12/38, b: 2, type: 'dozen' },
  { label: 'Columna 1', key: 'c1',   statPath: ['columnsPct', 'c1'],    pTheo: 12/38, b: 2, type: 'column' },
  { label: 'Columna 2', key: 'c2',   statPath: ['columnsPct', 'c2'],    pTheo: 12/38, b: 2, type: 'column' },
  { label: 'Columna 3', key: 'c3',   statPath: ['columnsPct', 'c3'],    pTheo: 12/38, b: 2, type: 'column' },
];

export class KellyManager {
  constructor() {
    const stored = this._load();
    this.bankroll    = stored.bankroll    ?? 100;
    this.fraction    = stored.fraction    ?? 0.25;  // Quarter Kelly
    this.stopLossPct = stored.stopLossPct ?? 0.20;
    this.takeProfitPct = stored.takeProfitPct ?? 0.30;
    this.minConfidence = stored.minConfidence ?? 0.30;
    this._settingsRevision = 0;
    this._settingsPersistQueue = Promise.resolve();
    this.ready = this._hydratePersistedSettings();
  }

  _load() {
    return kellySettingsStore.getSnapshot();
  }

  save() {
    const snapshot = {
      bankroll: this.bankroll,
      fraction: this.fraction,
      stopLossPct: this.stopLossPct,
      takeProfitPct: this.takeProfitPct,
      minConfidence: this.minConfidence,
    };
    this._settingsRevision += 1;
    this._settingsPersistQueue = this._settingsPersistQueue
      .then(() => kellySettingsStore.setSettings(snapshot))
      .catch(() => kellySettingsStore.setSettings(snapshot))
      .catch((e) => {
        console.warn('No se pudieron persistir los ajustes de Kelly en IndexedDB:', e);
      });
    return this._settingsPersistQueue;
  }

  async _hydratePersistedSettings() {
    try {
      const revisionAtStart = this._settingsRevision;
      const { settings: persisted } = await kellySettingsStore.load();
      if (this._settingsRevision !== revisionAtStart) return;
      if (persisted) {
        this.bankroll = persisted.bankroll ?? this.bankroll;
        this.fraction = persisted.fraction ?? this.fraction;
        this.stopLossPct = persisted.stopLossPct ?? this.stopLossPct;
        this.takeProfitPct = persisted.takeProfitPct ?? this.takeProfitPct;
        this.minConfidence = persisted.minConfidence ?? this.minConfidence;
      }
    } catch (e) {
      console.warn('No se pudieron hidratar los ajustes de Kelly desde IndexedDB:', e);
    }
  }

  /**
   * Análisis completo integrado con RouletteTracker y LogicEngine.
   * @param {RouletteTracker} tracker
   * @param {Array} logicSignals Señales provenientes del Oráculo
   */
  analyze(tracker, logicSignals = []) {
    const stats    = tracker.getStats();
    const advStats = tracker.getAdvancedStats();
    const total    = stats.total;

    const confidence = chiToConfidence(advStats.chiSquare, total);

    const stopLossAmount   = +(this.bankroll * this.stopLossPct).toFixed(2);
    const takeProfitAmount = +(this.bankroll * this.takeProfitPct).toFixed(2);

    if (total < 20) {
      return {
        insufficient: true,
        total,
        needed: 20,
        confidence: 0,
        chiSquare: advStats.chiSquare,
        chiDiagnosis: advStats.chiDiagnosis,
        stopLossAmount,
        takeProfitAmount,
        recommendations: [],
      };
    }

    // --- Recomendaciones Base (Color, Docenas, etc) ---
    const recommendations = BETS_CONFIG.map(cfg => {
      const pObs = parseFloat(stats[cfg.statPath[0]]?.[cfg.statPath[1]] ?? 0) / 100;
      const edge  = pObs - cfg.pTheo;

      const fullKelly     = kellyFraction(pObs, cfg.b);
      const adjKelly      = fullKelly * confidence;           // Ajustado por confianza estadística
      const fracKelly     = adjKelly * this.fraction;         // Fracción elegida (1/4, etc.)
      const betAmount     = +(this.bankroll * fracKelly).toFixed(2);

      const ror  = riskOfRuin(pObs, cfg.b, fracKelly);
      const s2d  = spinsToDouble(pObs, cfg.b, fracKelly);
      const gr   = growthRate(pObs, cfg.b, fracKelly);

      const viable = fullKelly > 0.001 && confidence >= this.minConfidence && pObs > cfg.pTheo;

      return {
        label:           cfg.label,
        type:            cfg.type,
        pObs:            +(pObs * 100).toFixed(2),
        pTheo:           +(cfg.pTheo * 100).toFixed(2),
        edge:            +(edge * 100).toFixed(2),
        b:               cfg.b,
        fullKellyPct:    +(fullKelly * 100).toFixed(2),
        adjKellyPct:     +(adjKelly * 100).toFixed(2),
        fracKellyPct:    +(fracKelly * 100).toFixed(2),
        betAmount,
        riskOfRuinPct:   +(Math.min(ror, 1) * 100).toFixed(1),
        spinsToDouble:   s2d === Infinity ? '∞' : s2d,
        growthRatePct:   +(gr * 100).toFixed(4),
        viable,
      };
    });

    // Zona caliente como apuesta de 5 números (pago 35:1 → edge por número)
    if (advStats.hotZone?.center !== '-' && total > 0) {
      const hotCount  = advStats.hotZone.sum;
      const pObsZone  = hotCount / (total * 5); // probabilidad promedio por número de la zona
      const pTheoZone = 1 / 38;
      const bHot      = 35;
      const edgeHot   = pObsZone - pTheoZone;
      const fkHot     = kellyFraction(pObsZone, bHot);
      const adjFkHot  = fkHot * confidence * this.fraction;
      const betHot    = +(this.bankroll * adjFkHot * 5).toFixed(2); // 5 fichas (una por número)

      recommendations.push({
        label:         `Zona Hot [${advStats.hotZone.members.join('•')}]`,
        type:          'hotzone',
        pObs:          +(pObsZone * 100).toFixed(2),
        pTheo:         +(pTheoZone * 100).toFixed(2),
        edge:          +(edgeHot * 100).toFixed(2),
        b:             bHot,
        fullKellyPct:  +(fkHot * 100).toFixed(2),
        adjKellyPct:   +(fkHot * confidence * 100).toFixed(2),
        fracKellyPct:  +(adjFkHot * 100).toFixed(2),
        betAmount:     betHot,
        riskOfRuinPct: +(Math.min(riskOfRuin(pObsZone, bHot, adjFkHot), 1) * 100).toFixed(1),
        spinsToDouble: (() => { const s = spinsToDouble(pObsZone, bHot, adjFkHot); return s === Infinity ? '∞' : s; })(),
        growthRatePct: +(growthRate(pObsZone, bHot, adjFkHot) * 100).toFixed(4),
        viable:        fkHot > 0.001 && confidence >= this.minConfidence && edgeHot > 0,
        note:          '5 fichas (1 por número)',
      });
    }

    // --- INTEGRACIÓN ORÁCULO: Recomendaciones de Series Maestras ---
    logicSignals.forEach(sig => {
      // Cálculo de probabilidad observada para esta serie
      const hitCount = tracker.spins.filter(sp => sig.numbers.includes(sp.number)).length;
      const pObsSerie = hitCount / Math.max(1, total);
      
      // El pago 'b' depende de cuántos números tiene la serie: b = (36/n) - 1
      const n = sig.numbers.length;
      const bSerie = (36 / n) - 1;
      const pTheoSerie = n / 38;
      
      const edgeSerie = pObsSerie - pTheoSerie;
      const fkSerie = kellyFraction(pObsSerie, bSerie);
      
      // Usamos la confianza del Oráculo combinada con la confianza CHI global
      const combinedConf = (sig.confidence + confidence) / 2;
      const adjFkSerie = fkSerie * combinedConf * this.fraction;
      const betSerie = +(this.bankroll * adjFkSerie).toFixed(2);

      recommendations.push({
        label:         `ORION: ${sig.id || sig.name}`,
        type:          'orion',
        pObs:          +(pObsSerie * 100).toFixed(2),
        pTheo:         +(pTheoSerie * 100).toFixed(2),
        edge:          +(edgeSerie * 100).toFixed(2),
        b:             bSerie.toFixed(2),
        fullKellyPct:  +(fkSerie * 100).toFixed(2),
        adjKellyPct:   +(fkSerie * combinedConf * 100).toFixed(2),
        fracKellyPct:  +(adjFkSerie * 100).toFixed(2),
        betAmount:     betSerie,
        riskOfRuinPct: +(Math.min(riskOfRuin(pObsSerie, bSerie, adjFkSerie), 1) * 100).toFixed(1),
        spinsToDouble: (() => { const s = spinsToDouble(pObsSerie, bSerie, adjFkSerie); return s === Infinity ? '∞' : s; })(),
        growthRatePct: +(growthRate(pObsSerie, bSerie, adjFkSerie) * 100).toFixed(4),
        viable:        fkSerie > 0.001 && combinedConf >= this.minConfidence && edgeSerie > 0,
        note:          `Basado en ${sig.risk} / Conf. Oráculo: ${(sig.confidence*100).toFixed(0)}%`
      });
    });
    recommendations.sort((a, b) => {
      if (a.viable !== b.viable) return a.viable ? -1 : 1;
      return b.edge - a.edge;
    });

    return {
      insufficient:      false,
      total,
      bankroll:          this.bankroll,
      fraction:          this.fraction,
      fractionLabel:     this._fractionLabel(),
      confidence:        +(confidence * 100).toFixed(0),
      minConfidence:     +(this.minConfidence * 100).toFixed(0),
      chiSquare:         advStats.chiSquare,
      chiDiagnosis:      advStats.chiDiagnosis,
      stopLossAmount,
      takeProfitAmount,
      stopLossPct:       +(this.stopLossPct * 100).toFixed(0),
      takeProfitPct:     +(this.takeProfitPct * 100).toFixed(0),
      recommendations,
    };
  }

  _fractionLabel() {
    const map = { 1: 'Full Kelly', 0.5: 'Half Kelly', 0.25: 'Quarter Kelly', 0.1: 'Tenth Kelly' };
    return map[this.fraction] ?? `${(this.fraction * 100).toFixed(0)}% Kelly`;
  }
}
