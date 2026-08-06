/**
 * Bootstrap — inicialización del proyecto ORION.
 * Crea Domain Tracker, Stores, Renderers y Motores.
 * Retorna { tracker, domainTracker, services, engines } para que el Kernel registre los motores.
 *
 * NO registra motores en EngineRegistry. Solo los construye.
 * NO crea TomadorRenderer (depende de callbacks de UI que pertenecen a main.js).
 *
 * Fase3 — imports normalizados hacia src/engines/
 * Fase4 — crea el nuevo Dominio RouletteTracker en src/tracker/
 * Fase5.5.2 — Domain Tracker es primario
 * Fase5.5.4 — Legacy rouletteTracker.js eliminado. Domain Tracker es el único tracker.
 */
import { LabRenderer } from '../../controlador_de_la_vista_lab.js';
import { LabCon1Renderer } from '../../labCon1Renderer.js';
import { ConjuntosRenderer } from '../../conjuntosRenderer.js';
import { AtRepRenderer } from '../../atRepRenderer.js';
import { rouletteSettingsStore } from '../../rouletteSettingsStore.js';
import { tomadorStateStore } from '../../tomadorStateStore.js';
import { defineLaboratoryBindingLayer, LaboratoryOrchestrator } from '../laboratory/index.js';

// Motores normalizados (Fase3)
import { WinWinEngine } from '../engines/WinWin/index.js';
import { DAEngine } from '../engines/DA/index.js';
import { LogicEngine } from '../engines/Orion/index.js';
import { Sesgo97Logic } from '../engines/Sesgo97/index.js';
import { ChiAnalysisEngine } from '../engines/Chi/index.js';
import { KellyManager } from '../engines/Kelly/index.js';

// Dominio Roulette Tracker (Fase4)
import {
  RouletteTracker as DomainTracker,
  TrackerState,
  SpinManager,
  SessionManager,
  HistoryManager,
  SettingsManager,
  DelayManager
} from '../tracker/index.js';

export class Bootstrap {
  /**
   * Inicializar servicios y motores del sistema.
   * @param {import('./ServiceContainer.js').ServiceContainer} container
   * @returns {Promise<{tracker: RouletteTracker, services: object[], engines: {name:string, instance:object}[]}>}
   */
  static async init(container) {
    // ── Dominio Roulette Tracker (Fase4) ────────────────────
    // CREADO PRIMERO — Domain Tracker es el primario (Fase5.5.2)
    const trackerState = new TrackerState();
    const spinManager = new SpinManager(trackerState);
    const sessionManager = new SessionManager(trackerState);
    const historyManager = new HistoryManager(trackerState);
    const settingsManager = new SettingsManager(trackerState);
    const domainTracker = new DomainTracker(
      trackerState,
      spinManager,
      sessionManager,
      historyManager,
      settingsManager
    );

    // Vincular DelayManager para caché de atrasos
    const delayManager = new DelayManager(() => domainTracker.getSpins());
    domainTracker.setDelayManager(delayManager);

    // Vincular EventBus si está disponible en el container
    const eventBus = container.resolve('eventBus');
    if (eventBus) {
      domainTracker.setEventBus(eventBus);
    }

    container.register('domainTracker', domainTracker);

    // ── Stores ──────────────────────────────────────────────
    container.register('settingsStore', rouletteSettingsStore);
    container.register('tomadorStateStore', tomadorStateStore);

    // ── Laboratory binding layer + renderer ─────────────────
    const laboratoryBinding = defineLaboratoryBindingLayer({
      activeViewId: 'overview',
    });
    const laboratoryOrchestrator = new LaboratoryOrchestrator({
      eventSink: (event) => laboratoryBinding.captureEvent(event),
    });
    laboratoryBinding.attachOrchestrator(laboratoryOrchestrator);

    const labRenderer = new LabRenderer('view-lab', laboratoryBinding);
    labRenderer.init();
    container.register('laboratoryOrchestrator', laboratoryOrchestrator);
    container.register('laboratoryBinding', laboratoryBinding);
    container.register('labRenderer', labRenderer);

    // Vincular actualizaciones del lab al EventBus del dominio
    if (eventBus && typeof eventBus.on === 'function') {
      eventBus.on('update', () => {
        const laboratoryEnabled = domainTracker.getSettings?.()?.laboratory?.enabled === true;
        if (laboratoryEnabled) {
          labRenderer.update();
        }
      });
    } else {
      console.warn('[Orion Lab] EventBus no disponible para sincronizar LabRenderer.');
    }

    // ── LabCon1Renderer (Win-Win Data) ─────────────────────
    const labCon1Renderer = new LabCon1Renderer('view-lab-con1', domainTracker);
    labCon1Renderer.init();
    container.register('labCon1Renderer', labCon1Renderer);

    // Vincular actualizaciones del lab-con1 al EventBus del dominio
    if (eventBus && typeof eventBus.on === 'function') {
      eventBus.on('update', () => labCon1Renderer.update());
    } else {
      console.warn('[Orion LabCon1] EventBus no disponible para sincronizar LabCon1Renderer.');
    }

    // ── ConjuntosRenderer (Teoría de Atrasos) ───────────────
    const conjuntosRenderer = new ConjuntosRenderer('view-conjuntos', domainTracker);
    conjuntosRenderer.init();
    container.register('conjuntosRenderer', conjuntosRenderer);

    // Vincular actualizaciones de conjuntos al EventBus del dominio
    if (eventBus && typeof eventBus.on === 'function') {
      eventBus.on('update', () => conjuntosRenderer.update());
    } else {
      console.warn('[Orion Conjuntos] EventBus no disponible para sincronizar ConjuntosRenderer.');
    }

    // ── AtRepRenderer (Atracción / Repulsión) ──────────────
    const atRepRenderer = new AtRepRenderer('view-at-rep', domainTracker);
    atRepRenderer.init();
    container.register('atRepRenderer', atRepRenderer);

    // Vincular actualizaciones de at-rep al EventBus del dominio
    if (eventBus && typeof eventBus.on === 'function') {
      eventBus.on('update', () => atRepRenderer.update());
    } else {
      console.warn('[Orion AtRep] EventBus no disponible para sincronizar AtRepRenderer.');
    }

    // ── Motores ─────────────────────────────────────────────
    // Orden de creación importa: Orion necesita WinWin
    // Todos los motores reciben domainTracker (Fase4+)
    const winWinEngine = new WinWinEngine(domainTracker);
    const daEngine = new DAEngine(domainTracker);
    const orion = new LogicEngine(domainTracker, winWinEngine);
    const sesgo97Engine = new Sesgo97Logic(domainTracker);
    const chiEngine = new ChiAnalysisEngine(domainTracker);
    const kelly = new KellyManager();

    // Registrar en container
    container.register('winWin', winWinEngine);
    container.register('da', daEngine);
    container.register('orion', orion);
    container.register('sesgo97', sesgo97Engine);
    container.register('chi', chiEngine);
    container.register('kelly', kelly);
    container.register('labRenderer', labRenderer);

    // Estructura para auto-registro en EngineRegistry
    const engines = [
      { name: 'winWin',  instance: winWinEngine },
      { name: 'da',      instance: daEngine },
      { name: 'orion',   instance: orion },
      { name: 'sesgo97', instance: sesgo97Engine },
      { name: 'chi',     instance: chiEngine },
      { name: 'kelly',   instance: kelly }
    ];

    return { tracker: domainTracker, domainTracker, services: [], engines };
  }
}
