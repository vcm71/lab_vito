/**
 * DAEngine - Motor de Cálculo de Distancia Absoluta (Atraso Inter-Impacto)
 * Basado en la metodología de Google Sheets del usuario.
 * Extiende BaseEngine para integrarse al ciclo de vida del sistema ORION.
 */
import { BaseEngine } from '../../core/BaseEngine.js';

export class DAEngine extends BaseEngine {
  constructor(tracker) {
    super('DA');
    this.tracker = tracker;
    this.groups = {
      series: {
        S1:  ["1", "27", "2", "26", "7"],
        S11: ["12", "19", "11", "17", "34"],
        S14: ["15", "24", "16", "14", "28"],
        S5:  ["32", "5", "31", "33", "23"],
        S0:  ["00", "10", "0", "30", "20"], // 90 -> 00
        S3:  ["3", "4", "6", "8", "9", "13", "18"],
        S21: ["21", "22", "25", "29", "35", "36"],
        S71: ["1", "27", "2", "26", "7", "13", "9"],
        S72: ["12", "19", "11", "17", "34", "8", "29"],
        S73: ["15", "24", "16", "14", "28", "3", "36"],
        S74: ["00", "10", "0", "30", "20", "25", "22"],
        S81: ["32", "5", "31", "33", "23", "4", "35", "18"],
        S82: ["13", "18", "21", "22", "25", "29", "35", "36"],
        S91: ["00", "10", "0", "30", "20", "32", "5", "31", "33", "23"],
        S92: ["1", "27", "2", "26", "7", "12", "19", "11", "17", "34"],
        S93: ["15", "24", "16", "14", "28", "3", "4", "6", "8", "9"],
        S99: ["3", "4", "6", "8", "9", "13", "18", "21", "22", "25", "29", "35", "36"]
      },
      externals: {
        Rojo:    ["1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36", "0"],
        Negro:   ["2", "4", "6", "8", "10", "11", "13", "15", "17", "20", "22", "24", "26", "28", "29", "31", "33", "35", "00"],
        Pares:   ["2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36"],
        Impares: ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23", "25", "27", "29", "31", "33", "35"],
        Menores: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
        Mayores: ["19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]
      },
      groups: {
        D1: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
        D2: ["13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"],
        D3: ["00", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"],
        C1: ["0", "1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31", "34"],
        C2: ["0", "2", "5", "8", "11", "14", "17", "20", "23", "26", "29", "32", "35"],
        C3: ["00", "3", "6", "9", "12", "15", "18", "21", "24", "27", "30", "33", "36"]
      }
    };
  }

  /**
   * Calcula la secuencia de DA (atrasos) para un conjunto de números.
   */
  calculateDASequence(groupNumbers, limit = null) {
    let spins = this.tracker.getSpins();
    if (limit && limit !== 'total') {
      const nLimit = parseInt(limit);
      if (!isNaN(nLimit)) {
        spins = spins.slice(-nLimit);
      }
    }
    const hits = [];
    
    spins.forEach((spin) => {
      if (groupNumbers.includes(spin.number)) {
        hits.push({ id: spin.id, number: spin.number });
      }
    });

    const daValues = [];
    for (let i = 1; i < hits.length; i++) {
      daValues.push({
        hitNumber: i,
        spinId: hits[i].id,
        da: hits[i].id - hits[i - 1].id
      });
    }
    
    // Si la muestra es Total, devolvemos todo. 
    // Si es una ventana específica (100, 200), mostramos solo los últimos 20 para enfoque.
    if (limit === 'total' || !limit) {
      return daValues;
    }
    
    return daValues.slice(-20);
  }

  /**
   * Obtiene todos los datos para las tablas de la pestaña Series_Tablas.
   */
  getAllTableData(limit = null) {
    const results = {};
    
    // 1. Cargar Series desde Ajustes (Tracker)
    const customSeries = this.tracker.getSettings().customSeries || [];
    const activeSeries = customSeries.filter(s => s.active !== false);
    
    const seriesToEvaluate = {};
    if (activeSeries.length > 0) {
      activeSeries.forEach(s => {
        seriesToEvaluate[s.name] = s.numbers;
      });
    } else {
      // Si no hay series personalizadas activas, usar las base
      Object.assign(seriesToEvaluate, this.groups.series);
    }

    // 2. Procesar Categorías
    const finalGroups = {
      series: seriesToEvaluate,
      externals: this.groups.externals,
      groups: this.groups.groups
    };

    for (const category in finalGroups) {
      results[category] = {};
      const currentCategory = finalGroups[category];
      for (const name in currentCategory) {
        results[category][name] = {
          name: name,
          numbers: currentCategory[name],
          history: this.calculateDASequence(currentCategory[name], limit)
        };
      }
    }
    return results;
  }

  /**
   * Retorna el color CSS basado en el valor de DA.
   */
  getDAColor(value) {
    if (value === null || value === undefined || value === '') return 'transparent';
    const val = parseInt(value);
    if (val >= 1 && val <= 9) return '#ffffff';   // Blanco
    if (val >= 10 && val <= 18) return '#87ceeb'; // Celeste
    if (val >= 19 && val <= 30) return '#ffff00'; // Amarillo
    if (val >= 31 && val <= 40) return '#ffa500'; // Naranja
    if (val > 40) return '#ff0000';                // Rojo
    return 'transparent';
  }
}
