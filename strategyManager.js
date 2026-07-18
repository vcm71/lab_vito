/**
 * STRATEGY & PROGRESSION MANAGER
 * Biblioteca de estrategias y motor de aprendizaje de rendimiento.
 */

export class StrategyManager {
  constructor() {
    this.strategies = this._initStrategies();
    this.history = []; // Historial de rendimiento de cada estrategia
  }

  _initStrategies() {
    return [
      {
        id: 'FLAT',
        name: 'Apuesta Plana',
        description: 'Misma unidad siempre. Bajo riesgo.',
        logic: (lastBet, won) => lastBet,
        performance: 0
      },
      {
        id: 'MARTINGALE',
        name: 'Martingala Clásica',
        description: 'Doblar tras pérdida. Riesgo alto.',
        logic: (lastBet, won) => won ? 1 : lastBet * 2,
        performance: 0
      },
      {
        id: 'DALEMBERT',
        name: 'D\'Alembert',
        description: '+1 tras pérdida, -1 tras victoria. Equilibrio.',
        logic: (lastBet, won) => won ? Math.max(1, lastBet - 1) : lastBet + 1,
        performance: 0
      },
      {
        id: 'PAROLI',
        name: 'Paroli (Anti-Martingala)',
        description: 'Doblar tras victoria. Busca rachas.',
        logic: (lastBet, won) => won ? lastBet * 2 : 1,
        performance: 0
      }
    ];
  }

  // --- MOTOR DE APRENDIZAJE ---
  // Evalúa cómo habrían funcionado todas las estrategias con el último número
  learn(lastNumber, currentBetType, winners) {
    const isWin = winners.includes(lastNumber);
    
    this.strategies.forEach(strat => {
      // Simulamos el resultado para esta estrategia
      if (isWin) {
        strat.performance += 1;
      } else {
        strat.performance -= 1;
      }
    });

    this.history.push({
      num: lastNumber,
      best: this.getBestStrategy().id
    });
  }

  getBestStrategy() {
    return [...this.strategies].sort((a, b) => b.performance - a.performance)[0];
  }

  getNextBet(strategyId, lastBet, won) {
    const strat = this.strategies.find(s => s.id === strategyId);
    return strat ? strat.logic(lastBet, won) : lastBet;
  }
}
