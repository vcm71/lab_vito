
import { LogicEngine } from './ORION_logicEngine.js';
import { RouletteTracker } from './rouletteTracker.js';

// MOCK LOCALSTORAGE FOR NODE
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

/**
 * ORION v4 STRESS TEST SCRIPT
 * Configurable por parámetros de consola
 */

const args = process.argv.slice(2);
const CONFIG = {
  iterations: parseInt(args[0]) || 5000,
  biasPower: parseFloat(args[1]) || 0.12, // 12% de probabilidad para el target
  target: args[2] || "17",
  scenario: args[3] || "H1" // H0 o H1
};

const ALL_NUMS = [
  "00","0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18",
  "19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36"
];

function runSimulation(config) {
    console.log(`\n🚀 INICIANDO SIMULACIÓN: ${config.scenario} | Giros: ${config.iterations} | Bias: ${config.biasPower}`);
    
    const tracker = new RouletteTracker();
    const orion = new LogicEngine(tracker, null);
    
    const stats = {
        bets: 0,
        wins: 0,
        bankrollHistory: [200],
        seriesHits: {},
        regimes: { R1: 0, R2: 0, R3: 0, R4: 0 }
    };

    for (let i = 0; i < config.iterations; i++) {
        let spin;
        if (config.scenario === 'H0') {
            spin = ALL_NUMS[Math.floor(Math.random() * 38)];
        } else {
            // H1: Sesgo agresivo para validar detección R4
            const r = Math.random();
            if (r < config.biasPower) {
                spin = config.target;
            } else if (r < config.biasPower + 0.08) {
                // Clustering: vecinos físicos de la americana
                spin = Math.random() > 0.5 ? "32" : "5"; 
            } else {
                spin = ALL_NUMS[Math.floor(Math.random() * 38)];
            }
        }

        tracker.addSpin(spin);
        const result = orion.simulateBankroll(spin);
        stats.regimes[orion.regime]++;

        if (result.betting) {
            stats.bets++;
            if (orion.seriesMaster[result.opportunity]?.includes(spin)) {
                stats.wins++;
            }
            if (!stats.seriesHits[result.opportunity]) stats.seriesHits[result.opportunity] = 0;
            stats.seriesHits[result.opportunity]++;
        }
        stats.bankrollHistory.push(orion.bankroll);
    }

    const finalBR = orion.bankroll;
    const genetic = orion.geneticOptimize();

    console.log("\n--- RESULTADOS ORION v4 ---");
    console.log(`Bankroll Final: ${finalBR.toFixed(2)}`);
    console.log(`Win Rate: ${(stats.wins / stats.bets * 100 || 0).toFixed(2)}%`);
    console.log(`Total Apuestas: ${stats.bets}`);
    console.log(`Distribución Regímenes:`, stats.regimes);
    console.log(`\nTOP 10 GENÉTICO (REPORTE):`);
    genetic.forEach((g, i) => {
        console.log(`${i+1}. [${g.nums.join(',')}] | Fitness: ${g.fitness.toFixed(4)} | EV: ${g.ev}`);
    });
}

runSimulation(CONFIG);
