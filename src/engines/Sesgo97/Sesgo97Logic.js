/**
 * Sesgo97Logic — Lógica de Análisis de Sesgo 97
 * Basado en el motor de detección de sesgo físico y auditoría estadística.
 * Extiende BaseEngine para integrarse al ciclo de vida del sistema ORION.
 */
import { BaseEngine } from '../../core/BaseEngine.js';
import { AMERICAN_WHEEL_ORDER } from '../../utils/numberMeta.js';

export class Sesgo97Logic extends BaseEngine {
  constructor(tracker) {
    super('Sesgo97');
    this.tracker = tracker;
  }

  /**
   * Realiza un análisis completo de la sesión actual.
   */
  analizar() {
    const settings = this.tracker.getSettings();
    const sectorSize = settings.sesgo97SectorSize || 5;
    const topSectorSize = settings.sesgo97TopSectorSize || 5;
    const topRanking = settings.sesgo97TopRanking || 10;
    const startRow = settings.sesgo97StartRow || 1;
    const endRow = settings.sesgo97EndRow || 0;

    let spins = this.tracker.getSpins();
    if (spins.length === 0) return null;

    // Lógica de Rango (Fila Inicial / Fila Final)
    const startIdx = Math.max(0, startRow - 1);
    const endIdx = (endRow === 0 || endRow > spins.length) ? spins.length : endRow;

    if (startIdx >= spins.length) return null;
    
    spins = spins.slice(startIdx, endIdx);
    if (spins.length === 0) return null;

    const sampleFreqs = {};
    AMERICAN_WHEEL_ORDER.forEach(n => sampleFreqs[n] = 0);
    spins.forEach(s => sampleFreqs[s.number]++);

    const totalSpins = spins.length;
    const expectedPerNumber = totalSpins / 38;

    return {
      totalSpins,
      startRow,
      endRow,
      sectorSize,
      topSectorSize,
      expectedPerNumber,
      dualSesgo: this.calcularDualSesgo(sampleFreqs, totalSpins, sectorSize),
      rankingSectores: this.generarRankingSectores(sampleFreqs, totalSpins, topSectorSize, topRanking),
      audit: this.realizarAuditoriaEstadistica(sampleFreqs, totalSpins)
    };
  }

  /**
   * Identifica el sector más caliente y el más frío.
   */
  calcularDualSesgo(freqs, totalSpins, sectorSize = 5) {
    const NUM_POSICIONES = AMERICAN_WHEEL_ORDER.length;
    let maxFreq = -1, bestOffsetMax = -1;
    let minFreq = totalSpins + 1, bestOffsetMin = -1;

    for (let offset = 0; offset < NUM_POSICIONES; offset++) {
      let currentFreq = 0;
      for (let i = 0; i < sectorSize; i++) {
        const num = AMERICAN_WHEEL_ORDER[(offset + i) % NUM_POSICIONES];
        currentFreq += (freqs[num] || 0);
      }

      if (currentFreq > maxFreq) {
        maxFreq = currentFreq;
        bestOffsetMax = offset;
      }
      if (currentFreq < minFreq) {
        minFreq = currentFreq;
        bestOffsetMin = offset;
      }
    }

    const expected = totalSpins * (sectorSize / NUM_POSICIONES);

    return {
      hot: {
        offset: bestOffsetMax,
        frecuencia: maxFreq,
        esperada: expected,
        numeros: this.getSectorNumbers(bestOffsetMax, sectorSize)
      },
      cold: {
        offset: bestOffsetMin,
        frecuencia: minFreq,
        esperada: expected,
        numeros: this.getSectorNumbers(bestOffsetMin, sectorSize)
      }
    };
  }

  /**
   * Genera un ranking de los N mejores sectores con sus vecinos.
   */
  generarRankingSectores(freqs, totalSpins, sectorSize = 5, topN = 10) {
    const NUM_POSICIONES = AMERICAN_WHEEL_ORDER.length;
    const sectores = [];

    for (let offset = 0; offset < NUM_POSICIONES; offset++) {
      let currentFreq = 0;
      for (let i = 0; i < sectorSize; i++) {
        const num = AMERICAN_WHEEL_ORDER[(offset + i) % NUM_POSICIONES];
        currentFreq += (freqs[num] || 0);
      }

      // Vecinos (1 a la izquierda, 1 a la derecha)
      const vecinosIndices = [];
      for (let i = -1; i <= sectorSize; i++) {
        vecinosIndices.push((offset + i + NUM_POSICIONES) % NUM_POSICIONES);
      }
      const vecinos = vecinosIndices.map(idx => AMERICAN_WHEEL_ORDER[idx]);

      sectores.push({
        offset,
        frecuencia: currentFreq,
        numeros: this.getSectorNumbers(offset, sectorSize),
        vecinos: vecinos.sort((a, b) => {
            const valA = (a === '0' || a === '00') ? -1 : parseInt(a);
            const valB = (b === '0' || b === '00') ? -1 : parseInt(b);
            return valA - valB;
        })
      });
    }

    sectores.sort((a, b) => b.frecuencia - a.frecuencia);
    return sectores.slice(0, topN);
  }

  /**
   * Auditoría estadística profunda (Prueba Chi-Cuadrado y Sesgos Angulares).
   */
  realizarAuditoriaEstadistica(sampleFreqs, totalSpins) {
    const totalNumeros = 38;
    const esperado = totalSpins / totalNumeros;
    const chiCritico = 50.999; 

    let chiTotal = 0;
    let maxContribValue = -1;
    let maxContribNum = null;

    AMERICAN_WHEEL_ORDER.forEach(num => {
      const obs = sampleFreqs[num] || 0;
      const d = obs - esperado;
      const contrib = (d * d) / esperado;
      chiTotal += contrib;

      if (contrib > maxContribValue) {
        maxContribValue = contrib;
        maxContribNum = num;
      }
    });

    // Sesgo Local (Ventana de 5)
    const local = this.calcularSesgoAngular(sampleFreqs, totalSpins, 5);
    // Sesgo Global (1/3 de la rueda ~ 12 números)
    const global = this.calcularSesgoAngular(sampleFreqs, totalSpins, 12);

    return {
      chiCuadrado: chiTotal,
      chiCritico,
      esSignificativo: chiTotal > chiCritico,
      porcentajeRespectoCritico: (chiTotal / chiCritico) * 100,
      maxChiContrib: {
        numero: maxContribNum,
        valor: maxContribValue
      },
      sesgoLocal: local,
      sesgoGlobal: global,
      significancia: "5%"
    };
  }

  calcularSesgoAngular(freqs, totalSpins, windowSize) {
    const totalNumeros = 38;
    const esperadoPorNumero = totalSpins / totalNumeros;
    const esperadoVentana = windowSize * esperadoPorNumero;
    
    let maxFreq = -1;
    let maxOffset = 0;

    for (let i = 0; i < totalNumeros; i++) {
      let suma = 0;
      for (let j = 0; j < windowSize; j++) {
        suma += (freqs[AMERICAN_WHEEL_ORDER[(i + j) % totalNumeros]] || 0);
      }
      if (suma > maxFreq) {
        maxFreq = suma;
        maxOffset = i;
      }
    }

    const desviacion = maxFreq - esperadoVentana;
    const porcentajeSesgo = (desviacion / esperadoVentana) * 100;

    return {
      inicio: AMERICAN_WHEEL_ORDER[maxOffset],
      numeros: this.getSectorNumbers(maxOffset, windowSize),
      frecuencia: maxFreq,
      esperado: esperadoVentana,
      desviacion: desviacion,
      porcentajeSesgo: porcentajeSesgo
    };
  }

  getSectorNumbers(offset, size) {
    const nums = [];
    for (let i = 0; i < size; i++) {
      nums.push(AMERICAN_WHEEL_ORDER[(offset + i) % 38]);
    }
    return nums;
  }

  // ─── BaseEngine lifecycle stubs ──────────────────────────────────────────

  async initialize() {
    await super.initialize();
  }

  async start() {
    await super.start();
  }

  async stop() {
    await super.stop();
  }

  async dispose() {
    await super.dispose();
  }
}
