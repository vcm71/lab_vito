/**
 * Orion - Set Theory Analytical Engine (ES6 Module)
 * Procesa la teoría de conjuntos y calcula intersecciones de estrés estocástico.
 */

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
    "S1 (1-6)": new Set(["1", "2", "3", "4", "5", "6"]),
    "S2 (7-12)": new Set(["7", "8", "9", "10", "11", "12"]),
    "Series S1": new Set(["1", "27", "2", "26", "7"]),
    "Series S11": new Set(["12", "19", "11", "17", "34"]),
    "Series S14": new Set(["15", "24", "16", "14", "28"]),
    "Series S5": new Set(["32", "5", "31", "33", "23"]),
    "Series S0": new Set(["00", "10", "0", "30", "20"]),
    "Series S3": new Set(["3", "4", "6", "8", "9", "13", "18"]),
    "Series S21": new Set(["21", "22", "25", "29", "35", "36"])
};

export class LabEngine {
    constructor(trackerInstance) {
        this.tracker = trackerInstance;
    }

    /**
     * Calcula la ponderación de estrés usando la fórmula:
     * $$w(S) = \frac{\text{atraso\_actual}}{\text{atraso\_maximo}} \cdot (1.0 - (1 - p)^d)$$
     */
    calcularPesoRetraso(setName) {
        const stats = this.tracker.getStatsForSet ? this.tracker.getStatsForSet(setName) : null;
        
        const actual = stats ? stats.actualDelay : (this.tracker.delays?.[setName] || 0);
        const max = stats ? stats.maxDelay : (this.tracker.maxDelays?.[setName] || 1);

        if (max === 0) return 0.0;

        const p_hit = SUBCONJUNTOS[setName].size / UNIVERSO_RULETA.size;
        const probabilidad_demora = Math.pow(1.0 - p_hit, actual);
        const ratio_limite = actual / max;

        return ratio_limite * (1.0 - probabilidad_demora);
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