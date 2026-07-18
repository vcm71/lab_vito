/**
 * Orion - Lab UI Renderer Component (ES6 Module)
 * Estética idéntica a la pestaña ORION (Colores oscuros, bordes cristalinos, var(--color-gold), #60a5fa).
 */

import { LabEngine, SUBCONJUNTOS, UNIVERSO_RULETA } from './labEngine.js';

function formatPct(value) {
    return `${Math.round(value * 100)}%`;
}

function getPressureTone(weight, pressure) {
    if (pressure >= 0.95 || weight >= 1) return { label: 'CRÍTICO', color: '#ef4444' };
    if (pressure >= 0.75 || weight >= 0.55) return { label: 'ALTO', color: '#f59e0b' };
    return { label: 'BAJO', color: '#10b981' };
}

function renderCompactNode(num, score) {
    let bg = 'rgba(0,0,0,0.3)';
    let border = 'rgba(255,255,255,0.05)';
    let text = 'var(--text-muted)';
    let shadow = 'none';

    if (num === '0' || num === '00') {
        bg = 'rgba(16, 185, 129, 0.15)';
        border = 'rgba(16, 185, 129, 0.4)';
        text = '#10b981';
    } else if (score > 0.8) {
        bg = 'rgba(239, 68, 68, 0.2)';
        border = '#ef4444';
        text = '#ef4444';
        shadow = '0 0 10px rgba(239,68,68,0.5)';
    } else if (score > 0.2) {
        bg = 'rgba(245, 158, 11, 0.2)';
        border = '#f59e0b';
        text = '#f59e0b';
        shadow = '0 0 8px rgba(245, 158, 11, 0.3)';
    }

    return `
        <div style="display: flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 4px; border: 1px solid ${border}; background: ${bg}; color: ${text}; box-shadow: ${shadow}; transition: all 0.3s ease;" title="Score: ${score.toFixed(2)}">
            <span style="font-size: 0.85rem; font-weight: bold;">${num}</span>
        </div>`;
}

function renderMiniBar(value, max, color) {
    const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    return `
        <div style="height: 4px; width: 100%; background: rgba(0,0,0,0.5); border-radius: 2px; overflow: hidden; margin-top: 4px;">
            <div style="height: 100%; border-radius: 2px; width: ${pct}%; background: ${color};"></div>
        </div>`;
}

export class LabRenderer {
    constructor(containerId, trackerInstance) {
        this.container = document.getElementById(containerId);
        this.engine = new LabEngine(trackerInstance);
        this.selectedSets = Object.keys(SUBCONJUNTOS);
        this.scores = {};
        this.setDetails = [];
        this.overview = { activeCount: 0, totalWeight: 0, topIntersection: null };
    }

    init() {
        if (!this.container) return;
        this.renderLayout();
        this.update();
        this.setupEventListeners();
    }

    renderLayout() {
        this.container.innerHTML = `
            <section class="panel" style="border-color: #60a5fa; background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); min-height: 80vh; padding: 1rem;">
                <h2 class="panel-title" style="color: #60a5fa; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span>🧠 ORION LAB: Teoría de Conjuntos</span>
                    <span style="font-size: 0.7rem; background: rgba(96, 165, 250, 0.2); padding: 0.2rem 0.5rem; border-radius: 4px;">v2.0 PRO</span>
                </h2>

                <!-- Status Banner -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-radius: 8px; border: 1px solid rgba(96, 165, 250, 0.2); margin-bottom: 1.5rem; background: rgba(15, 23, 42, 0.5);">
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="font-size: 1.5rem;">🔬</div>
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Estado del Análisis</div>
                            <div style="font-size: 0.85rem; font-weight: 800; color: #60a5fa;">Filtros: <span id="lab-active-count">0</span> Activos</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1.5rem; text-align: right;">
                        <div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Peso Global</div>
                            <div id="lab-total-weight" style="font-size: 0.85rem; font-weight: bold; color: var(--color-gold);">0.00</div>
                        </div>
                        <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 1.5rem;">
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Mejor Cruce</div>
                            <div id="lab-top-cruce" style="font-size: 0.85rem; font-weight: bold; color: #ef4444;">--</div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    
                    <!-- Columna Izquierda -->
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        
                        <!-- Tapete Estocástico -->
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <h3 style="font-size: 0.65rem; color: var(--color-gold); text-transform: uppercase; margin-bottom: 0.75rem;">🎡 Tapete Estocástico</h3>
                            <div id="lab-heatmap-grid" style="display: flex; flex-wrap: wrap; gap: 0.3rem; justify-content: center;"></div>
                        </div>

                        <!-- Filtros -->
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <h3 style="font-size: 0.65rem; color: var(--color-gold); text-transform: uppercase; margin-bottom: 0.75rem;">🎛️ Filtros de Conjunto</h3>
                            <div id="lab-set-filters" style="display: flex; flex-wrap: wrap; gap: 0.5rem; max-height: 150px; overflow-y: auto;"></div>
                        </div>
                    </div>

                    <!-- Columna Derecha -->
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        
                        <!-- Top Números Sugeridos -->
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <h3 style="font-size: 0.65rem; color: #10b981; text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                                🎯 NÚMEROS INDIVIDUALES MÁS CALIENTES
                            </h3>
                            <div id="lab-top-numbers" style="display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center;"></div>
                        </div>

                        <!-- Recomendaciones de Alta Eficiencia -->
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <h3 style="font-size: 0.65rem; color: #ef4444; text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                                🚨 ALTA EFICIENCIA (SPRT)
                            </h3>
                            <div id="lab-recommendations" style="display: flex; flex-direction: column; gap: 0.75rem;"></div>
                        </div>

                        <!-- Perfiles de Presión -->
                        <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                            <h3 style="font-size: 0.65rem; color: var(--color-gold); text-transform: uppercase; margin-bottom: 0.75rem;">📊 Presión de Conjuntos Activos</h3>
                            <div id="lab-set-profile" style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 300px; overflow-y: auto; padding-right: 0.5rem;"></div>
                        </div>
                    </div>

                </div>
            </section>
        `;
    }

    setupEventListeners() {
        const filterContainer = document.getElementById('lab-set-filters');
        if (filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-set-name]');
                if (btn) {
                    const name = btn.dataset.setName;
                    if (this.selectedSets.includes(name)) {
                        this.selectedSets = this.selectedSets.filter(s => s !== name);
                    } else {
                        this.selectedSets.push(name);
                    }
                    this.update();
                }
            });
        }
    }

    update() {
        this.scores = this.engine.resolverScoresIndividuales(this.selectedSets);
        this.setDetails = this.engine.getSetDetails(this.selectedSets);
        const totalWeight = this.setDetails.reduce((acc, item) => acc + item.weight, 0);
        const topIntersection = this.engine.buscarInterseccionesOptimas(this.selectedSets, 1)[0] || null;
        
        this.overview = {
            activeCount: this.selectedSets.length,
            totalWeight,
            topIntersection
        };
        
        this.renderOverview();
        this.renderFilters();
        this.renderHeatmap();
        this.renderTopNumbers();
        this.renderSetProfile();
        this.renderRecommendations();
    }

    renderOverview() {
        const countEl = document.getElementById('lab-active-count');
        const weightEl = document.getElementById('lab-total-weight');
        const cruceEl = document.getElementById('lab-top-cruce');
        
        if(countEl) countEl.textContent = this.overview.activeCount;
        if(weightEl) weightEl.textContent = this.overview.totalWeight.toFixed(2);
        if(cruceEl) {
            if (this.overview.topIntersection) {
                cruceEl.textContent = this.overview.topIntersection.combinacion;
                cruceEl.title = `Eficiencia: ${this.overview.topIntersection.eficiencia_ratio.toFixed(2)}`;
            } else {
                cruceEl.textContent = '--';
            }
        }
    }

    renderFilters() {
        const filterContainer = document.getElementById('lab-set-filters');
        if (!filterContainer) return;
        
        filterContainer.innerHTML = Object.keys(SUBCONJUNTOS).map(name => {
            const isSelected = this.selectedSets.includes(name);
            const style = isSelected 
                ? 'border-color: #60a5fa; color: #60a5fa; background: rgba(96, 165, 250, 0.1);' 
                : 'border-color: rgba(255,255,255,0.1); color: var(--text-muted); background: transparent;';
            return `
                <button data-set-name="${name}" class="btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.65rem; ${style}">
                    ${name}
                </button>
            `;
        }).join('');
    }

    renderHeatmap() {
        const grid = document.getElementById('lab-heatmap-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const sortedNumbers = Array.from(UNIVERSO_RULETA).sort((a, b) => {
            if (a === "0" || a === "00") return -1;
            if (b === "0" || b === "00") return 1;
            return parseInt(a) - parseInt(b);
        });

        sortedNumbers.forEach(num => {
            const score = this.scores[num] || 0.0;
            grid.innerHTML += renderCompactNode(num, score);
        });
    }

    renderSetProfile() {
        const container = document.getElementById('lab-set-profile');
        if (!container) return;

        const details = [...this.setDetails].sort((a, b) => b.weight - a.weight);
        const maxWeight = Math.max(...details.map(item => item.weight), 0.0001);
        const maxPressure = Math.max(...details.map(item => item.pressure), 0.0001);

        container.innerHTML = details.map(item => {
            const tone = getPressureTone(item.weight, item.pressure);
            return `
                <div class="stat-card" style="border-left: 3px solid ${tone.color}; padding: 0.75rem; background: rgba(255,255,255,0.02); border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div style="font-size: 0.8rem; font-weight: bold; color: var(--color-gold);">${item.name}</div>
                        <div style="font-size: 0.6rem; font-weight: bold; padding: 0.15rem 0.4rem; border-radius: 4px; background: rgba(0,0,0,0.5); color: ${tone.color};">${tone.label}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.55rem; color: var(--text-muted); display: flex; justify-content: space-between;"><span>PESO</span> <span>${item.weight.toFixed(2)}</span></div>
                            ${renderMiniBar(item.weight, maxWeight, tone.color)}
                        </div>
                        <div>
                            <div style="font-size: 0.55rem; color: var(--text-muted); display: flex; justify-content: space-between;"><span>ATRASO</span> <span>${item.actualDelay}/${item.maxDelay}</span></div>
                            ${renderMiniBar(item.pressure, maxPressure, tone.color)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRecommendations() {
        const container = document.getElementById('lab-recommendations');
        if (!container) return;

        const optimalIntersections = this.engine.buscarInterseccionesOptimas(this.selectedSets, 4);

        if (optimalIntersections.length === 0) {
            container.innerHTML = `<div style="font-size: 0.7rem; color: var(--text-muted); text-align: center;">Sin solapamientos críticos detectados.</div>`;
            return;
        }

        container.innerHTML = optimalIntersections.map(item => {
            const toneColor = item.eficiencia_ratio >= 0.6 ? '#ef4444' : item.eficiencia_ratio >= 0.35 ? '#f59e0b' : '#10b981';

            return `
                <div class="stat-card" style="border-left: 4px solid ${toneColor}; padding: 0.85rem; background: rgba(255,255,255,0.02); border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div style="font-size: 0.9rem; font-weight: 900; color: var(--color-gold);">${item.combinacion}</div>
                        <div style="font-size: 1rem; font-weight: 900; color: ${toneColor};">${item.eficiencia_ratio.toFixed(2)} <span style="font-size: 0.5rem; font-weight: 400; color: var(--text-muted);">EFI</span></div>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: 4px;">
                        <div style="font-size: 0.55rem; color: var(--text-muted); margin-bottom: 0.2rem;">NÚMEROS IMPLICADOS [${item.numeros.length}]</div>
                        <div style="font-size: 0.75rem; font-weight: bold; color: #fff; word-break: break-all; letter-spacing: 1px;">
                            ${item.numeros.join(', ')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTopNumbers() {
        const container = document.getElementById('lab-top-numbers');
        if (!container) return;

        const scoreArray = Array.from(UNIVERSO_RULETA)
            .map(num => ({ num, score: this.scores[num] || 0 }))
            .filter(item => item.score > 0 && item.num !== "0" && item.num !== "00")
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        if (scoreArray.length === 0) {
            container.innerHTML = `<div style="font-size: 0.7rem; color: var(--text-muted); text-align: center; width: 100%;">Esperando datos...</div>`;
            return;
        }

        container.innerHTML = scoreArray.map(item => {
            const toneColor = item.score > 0.8 ? '#ef4444' : item.score > 0.4 ? '#f59e0b' : '#10b981';
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 3.5rem; height: 3.5rem; border-radius: 8px; border: 1px solid ${toneColor}; background: rgba(0,0,0,0.5); box-shadow: 0 0 10px ${toneColor}40;">
                    <span style="font-size: 1.2rem; font-weight: 900; color: #ffffff;">${item.num}</span>
                    <span style="font-size: 0.55rem; color: ${toneColor}; font-weight: bold; margin-top: 0.1rem;">SCORE ${item.score.toFixed(1)}</span>
                </div>
            `;
        }).join('');
    }
}
