import { AMERICAN_WHEEL_ORDER } from './rouletteTracker.js';

export class ChiAnalysisEngine {
  constructor(tracker) {
    this.tracker = tracker;
  }

  /**
   * Calcula el estadístico Chi-cuadrado para un grupo de números.
   * Utiliza 1 Grado de Libertad (Grupo vs No-Grupo).
   */
  calculateGroupChi(spins, groupNumbers) {
    const N = spins.length;
    if (N === 0) return { chi: 0, p: 0.5, observed: 0, expected: 0 };

    // Contar impactos en el grupo
    const observed = spins.filter(s => groupNumbers.includes(s.number)).length;
    
    // Probabilidad teórica (k / 38)
    const pGroup = groupNumbers.length / 38;
    const expected = N * pGroup;

    if (expected === 0 || expected === N) return { chi: 0, p: 0.5, observed, expected };

    // Chi-cuadrado de 1 grado de libertad: sum((O-E)^2 / E)
    // Para 2 bins (Grupo y Resto):
    const oResto = N - observed;
    const eResto = N - expected;

    const chi = (Math.pow(observed - expected, 2) / expected) + 
                (Math.pow(oResto - eResto, 2) / eResto);

    // Mapeo simple de Chi (1 gl) a confianza aproximada
    // 3.84 es el valor crítico para p=0.05
    let confidence = 0;
    if (chi > 6.63) confidence = 0.99; // p < 0.01
    else if (chi > 3.84) confidence = 0.95; // p < 0.05
    else if (chi > 2.71) confidence = 0.90; // p < 0.10
    else confidence = Math.min(0.89, chi / 3.84);

    return {
      chi: chi,
      confidence: confidence,
      observed: observed,
      expected: expected,
      deviation: ((observed / expected) - 1) * 100
    };
  }

  /**
   * Obtiene el análisis para todas las series y externas
   */
  getAnalysis(windowSize = 'total') {
    let spins = this.tracker.getSpins();
    if (windowSize !== 'total') {
      const size = parseInt(windowSize);
      spins = spins.slice(-size);
    }

    const results = {
      series: [],
      externals: []
    };

    // 1. Series Maestras (de Ajustes)
    const customSeries = this.tracker.settings.customSeries || [];
    customSeries.forEach(s => {
      if (!s.active) return;
      results.series.push({
        name: s.name,
        numbers: s.numbers,
        stats: this.calculateGroupChi(spins, s.numbers)
      });
    });

    // 2. Apuestas Externas
    const externals = [
      { name: 'Rojo', nums: ["1","3","5","7","9","12","14","16","18","19","21","23","25","27","30","32","34","36"] },
      { name: 'Negro', nums: ["2","4","6","8","10","11","13","15","17","20","22","24","26","28","29","31","33","35"] },
      { name: 'Par', nums: ["2","4","6","8","10","12","14","16","18","20","22","24","26","28","30","32","34","36"] },
      { name: 'Impar', nums: ["1","3","5","7","9","11","13","15","17","19","21","23","25","27","29","31","33","35"] },
      { name: '1-18', nums: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18"] },
      { name: '19-36', nums: ["19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36"] },
      { name: 'Docena 1', nums: ["1","2","3","4","5","6","7","8","9","10","11","12"] },
      { name: 'Docena 2', nums: ["13","14","15","16","17","18","19","20","21","22","23","24"] },
      { name: 'Docena 3', nums: ["25","26","27","28","29","30","31","32","33","34","35","36"] },
      { name: 'Columna 1', nums: ["1","4","7","10","13","16","19","22","25","28","31","34"] },
      { name: 'Columna 2', nums: ["2","5","8","11","14","17","20","23","26","29","32","35"] },
      { name: 'Columna 3', nums: ["3","6","9","12","15","18","21","24","27","30","33","36"] },
      { name: '0 / 00', nums: ["0", "00"] }
    ];

    externals.forEach(e => {
      results.externals.push({
        name: e.name,
        numbers: e.nums,
        stats: this.calculateGroupChi(spins, e.nums)
      });
    });

    // 3. Sesgo Media Ruleta (38 sectores de 19 números)
    results.halfWheels = this.getHalfWheelAnalysis(spins);

    // 4. Correlación Estratégica (Serie vs Media Ruleta)
    results.confluence = this.getStrategicConfluence(results.series, results.halfWheels);

    // 5. Presión de Reversión
    results.reversion = this.getReversionAnalysis(results.series, results.externals);

    return results;
  }

  /**
   * CÁLCULO DE PRESIÓN DE REVERSIÓN
   * -------------------------------------------------------------------------
   * Define la probabilidad de que una racha fría (atraso) termine basándose en:
   * 1. Factor de Ciclo: (Atraso Actual / Ciclo Teórico). 
   *    Ej: Si el ciclo es 8 y lleva 40 sin salir, el factor es 5.0.
   * 2. Factor de Anomalía: Valor Chi-cuadrado acumulado por ese vacío.
   * 
   * PRESIÓN = Factor de Ciclo * (Chi-cuadrado / 3.84)
   * -------------------------------------------------------------------------
   */
  getReversionAnalysis(series, externals) {
    const allGroups = [...series, ...externals];
    const spins = this.tracker.getSpins();
    
    const analysis = allGroups
      .map(group => {
        // Calcular atraso actual del grupo
        let delay = 0;
        for (let i = spins.length - 1; i >= 0; i--) {
          if (group.numbers.includes(spins[i].number)) break;
          delay++;
        }

        const cycle = 38 / group.numbers.length;
        const cycleFactor = delay / cycle;
        const chiFactor = group.stats.chi / 3.84; // 3.84 es el umbral de p=0.05

        // Solo nos interesan grupos en racha fría (observed < expected)
        if (group.stats.observed >= group.stats.expected) return null;

        const pressureScore = (cycleFactor * chiFactor) * 10; 

        return {
          name: group.name,
          delay: delay,
          cycle: cycle.toFixed(1),
          cycleFactor: cycleFactor.toFixed(1),
          pressure: Math.min(100, pressureScore).toFixed(0),
          chi: group.stats.chi.toFixed(2)
        };
      })
      .filter(a => a !== null && a.pressure > 10) // Filtrar solo los que tienen tensión real
      .sort((a, b) => b.pressure - a.pressure);

    return analysis.slice(0, 8); // Retornar top 8 con más presión
  }

  getStrategicConfluence(seriesResults, halfWheelData) {
    if (!seriesResults.length || !halfWheelData) return null;

    // Encontrar la serie más caliente que tenga números en la mitad caliente
    const hotHalfNums = halfWheelData.hot.numbers;
    const coldHalfNums = halfWheelData.cold.numbers;

    const findConfluence = (targetNums, isHot) => {
      return seriesResults
        .map(s => {
          // Calculamos cuántos números de la serie están en el sector objetivo
          const overlap = s.numbers.filter(n => targetNums.includes(n)).length;
          const overlapPct = (overlap / s.numbers.length) * 100;
          return { ...s, overlapPct };
        })
        // Filtramos series que tengan al menos el 50% de sus números en ese sector
        .filter(s => s.overlapPct >= 50)
        // Ordenamos por desviación (si es hot, mayor; si es cold, menor)
        .sort((a, b) => isHot ? b.stats.deviation - a.stats.deviation : a.stats.deviation - b.stats.deviation)[0];
    };

    return {
      hotSeries: findConfluence(hotHalfNums, true),
      coldSeries: findConfluence(coldHalfNums, false)
    };
  }

  getHalfWheelAnalysis(spins) {
    const halves = [];
    const wheelSize = AMERICAN_WHEEL_ORDER.length; // 38

    for (let i = 0; i < wheelSize; i++) {
      // Obtener sector de 19 números contiguos
      const sector = [];
      for (let j = 0; j < 19; j++) {
        sector.push(AMERICAN_WHEEL_ORDER[(i + j) % wheelSize]);
      }

      const stats = this.calculateGroupChi(spins, sector);
      halves.push({
        startNum: AMERICAN_WHEEL_ORDER[i],
        endNum: AMERICAN_WHEEL_ORDER[(i + 18) % wheelSize],
        numbers: sector,
        stats: stats
      });
    }

    // Ordenar por desviación para encontrar la más caliente y la más fría
    const sorted = [...halves].sort((a, b) => b.stats.deviation - a.stats.deviation);

    return {
      all: halves,
      hot: sorted[0],
      cold: sorted[sorted.length - 1]
    };
  }
}
