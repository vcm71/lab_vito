/**
 * Orion - Set Theory Analytical Engine (ES6 Module)
 * Procesa la teoría de conjuntos y calcula intersecciones de estrés estocástico.
 */

import { rouletteSettingsStore } from './rouletteSettingsStore.js';

export const UNIVERSO_RULETA = new Set([
    "0", "00", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36"
]);

export const SUBCONJUNTOS = {
    "Rojo": new Set(["1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"]),
    "Negro": new Set(["2", "4", "6", "8", "10", "11", "13", "15", "17", "20", "22", "24", "26", "28", "29", "31", "33", "35"]),
    "Par": new Set(["2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36"]),
    "Impar": new Set(["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23", "25", "27", "29", "31", "33", "35"]),
    "1a Docena": new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]),
    "2a Docena": new Set(["13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"]),
    "3a Docena": new Set(["25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36"]),
    "Columna 1": new Set(["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31", "34"]),
    "Columna 2": new Set(["2", "5", "8", "11", "14", "17", "20", "23", "26", "29", "32", "35"]),
    "Columna 3": new Set(["3", "6", "9", "12", "15", "18", "21", "24", "27", "30", "33", "36"]),
    "S1 (1-6)": new Set(["1", "2", "3", "4", "5", "6"]),
    "S2 (7-12)": new Set(["7", "8", "9", "10", "11", "12"]),
    "S3 (13-18)": new Set(["13", "14", "15", "16", "17", "18"]),
    "S4 (19-24)": new Set(["19", "20", "21", "22", "23", "24"]),
    "S5 (25-30)": new Set(["25", "26", "27", "28", "29", "30"]),
    "S6 (31-36)": new Set(["31", "32", "33", "34", "35", "36"]),
    "Series S1": new Set(["1", "27", "2", "26", "7"]),
    "Series S11": new Set(["12", "19", "11", "17", "34"]),
    "Series S14": new Set(["15", "24", "16", "14", "28"]),
    "Series S5": new Set(["32", "5", "31", "33", "23"]),
    "Series S0": new Set(["00", "10", "0", "30", "20"]),
    "Series S3": new Set(["3", "4", "6", "8", "9", "13", "18"]),
    "Series S21": new Set(["21", "22", "25", "29", "35", "36"])
};

// Map each set name to its module key for per-module thresholds
const SET_TO_MODULE = {
  "Rojo": "suertesSencillas",
  "Negro": "suertesSencillas",
  "Par": "suertesSencillas",
  "Impar": "suertesSencillas",
  "1a Docena": "docenas",
  "2a Docena": "docenas",
  "3a Docena": "docenas",
  "Columna 1": "columnas",
  "Columna 2": "columnas",
  "Columna 3": "columnas",
  "S1 (1-6)": "sixenas",
  "S2 (7-12)": "sixenas",
  "S3 (13-18)": "sixenas",
  "S4 (19-24)": "sixenas",
  "S5 (25-30)": "sixenas",
  "S6 (31-36)": "sixenas",
  "Series S1": "seriesSectores",
  "Series S11": "seriesSectores",
  "Series S14": "seriesSectores",
  "Series S5": "seriesSectores",
  "Series S0": "seriesSectores",
  "Series S3": "seriesSectores",
  "Series S21": "seriesSectores",
};

export class LabEngine {
    constructor(trackerInstance) {
        this.tracker = trackerInstance;
    }

    _getSetStats(setName) {
        const targetSet = SUBCONJUNTOS[setName];
        if (!targetSet) return { actualDelay: 0, maxDelay: 1 };
        
        const spins = (this.tracker && typeof this.tracker.getSpins === 'function') ? this.tracker.getSpins() : [];
        if (spins.length === 0) return { actualDelay: 0, maxDelay: 1 };

        const settings = rouletteSettingsStore.getSnapshot();
        const moduleKey = SET_TO_MODULE[setName] || 'suertesSencillas';
        const thresholds = settings.moduleThresholds || {};
        const modThresh = thresholds[moduleKey] || {};
        const windowSize = Number.isFinite(settings.atrasosMaxWindow) ? Math.max(0, Math.floor(settings.atrasosMaxWindow)) : 100;
        const windowSpins = windowSize > 0 ? spins.slice(-windowSize) : spins;

        let actualDelay = 0;
        for (let i = windowSpins.length - 1; i >= 0; i--) {
            const numStr = String(windowSpins[i].number);
            if (targetSet.has(numStr)) break;
            actualDelay++;
        }

        let maxDelay = 0;
        let windowDelay = 0;

        for (const spin of windowSpins) {
            const numStr = String(spin.number);
            if (targetSet.has(numStr)) {
                if (windowDelay > maxDelay) maxDelay = windowDelay;
                windowDelay = 0;
            } else {
                windowDelay++;
            }
        }
        
        if (windowDelay > maxDelay) maxDelay = windowDelay;
        return { actualDelay: actualDelay, maxDelay: maxDelay === 0 ? 1 : maxDelay };
    }

    /**
     * Calcula la ponderación de estrés usando la fórmula:
     * $$w(S) = \frac{\text{atraso\_actual}}{\text{atraso\_maximo}} \cdot (1.0 - (1 - p)^d)$$
     */
    calcularPesoRetraso(setName) {
        const stats = this._getSetStats(setName);
        const actual = stats.actualDelay;
        const max = stats.maxDelay;

        if (max === 0) return 0.0;

        const p_hit = SUBCONJUNTOS[setName].size / UNIVERSO_RULETA.size;
        const probabilidad_demora = Math.pow(1.0 - p_hit, actual);
        const ratio_limite = actual / max;

        return ratio_limite * (1.0 - probabilidad_demora);
    }

    getSetDetails(activeSets) {
        return activeSets
            .filter(setName => SUBCONJUNTOS[setName])
            .map(setName => {
                const stats = this._getSetStats(setName);
                const actualDelay = stats.actualDelay;
                const maxDelay = stats.maxDelay;
                
                const weight = this.calcularPesoRetraso(setName);
                const size = SUBCONJUNTOS[setName].size;
                const hitProbability = size / UNIVERSO_RULETA.size;
                const pressure = maxDelay > 0 ? actualDelay / maxDelay : 0;

                return {
                    name: setName,
                    actualDelay,
                    maxDelay,
                    weight,
                    size,
                    hitProbability,
                    pressure
                };
            })
            .sort((a, b) => b.weight - a.weight || b.pressure - a.pressure);
    }

    /**
     * Resuelve el score ponderado para cada número individual del universo
     * $$Score(n) = \sum_{S_j} \mathbb{I}(n \in S_j) \cdot w(S_j)$$
     */
    resolverScoresIndividuales(activeSets) {
        const scores = {};
        UNIVERSO_RULETA.forEach(num => scores[num] = 0.0);

        activeSets.forEach(setName => {
            if (SUBCONJUNTOS[setName]) {
                const weight = this.calcularPesoRetraso(setName);
                SUBCONJUNTOS[setName].forEach(num => {
                    scores[num] += weight;
                });
            }
        });

        return scores;
    }

    /**
     * Encuentra las intersecciones binarias óptimas basándose en la eficiencia:
     * $$\text{Eficiencia} = \frac{w(A) + w(B)}{|A \cap B|}$$
     */
    buscarInterseccionesOptimas(activeSets, topK = 5) {
        const listadoPonderado = activeSets.map(name => ({
            name,
            weight: this.calcularPesoRetraso(name),
            elements: SUBCONJUNTOS[name]
        })).filter(set => set.weight > 0.1);

        const resultados = [];

        for (let i = 0; i < listadoPonderado.length; i++) {
            for (let j = i + 1; j < listadoPonderado.length; j++) {
                const A = listadoPonderado[i];
                const B = listadoPonderado[j];

                const interseccion = new Set([...A.elements].filter(x => B.elements.has(x)));

                if (interseccion.size > 0) {
                    const pesoCombinado = A.weight + B.weight;
                    const eficiencia = pesoCombinado / interseccion.size;

                    resultados.push({
                        combinacion: `${A.name} ∩ ${B.name}`,
                        numeros: Array.from(interseccion).sort((x, y) => parseInt(x) - parseInt(y)),
                        tamano_cobertura: interseccion.size,
                        peso_retraso: pesoCombinado,
                        eficiencia_ratio: eficiencia
                    });
                }
            }
        }

        return resultados
            .sort((a, b) => b.eficiencia_ratio - a.eficiencia_ratio)
            .slice(0, topK);
    }
}
