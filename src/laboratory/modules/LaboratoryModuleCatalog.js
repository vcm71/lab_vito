import { LaboratoryDataset } from '../LaboratoryDataset.js';
import { LaboratoryRegistry } from '../LaboratoryRegistry.js';
import { defineLaboratoryModuleManifest } from '../LaboratoryModuleManifest.js';
import { LabConAdapter } from '../../consensus/adapters/LabConAdapter.js';
import { LabCon1Adapter } from '../../consensus/adapters/LabCon1Adapter.js';
import { AtRepAdapter } from '../../consensus/adapters/AtRepAdapter.js';
import { SUBCONJUNTOS as LAB_CON_SUBCONJUNTOS, LabEngine } from '../../../labEngine.js';
import { LabCon1Engine } from '../../../labCon1Engine.js';
import { AtRepEngine } from '../../../atRepEngine.js';
import { WinWinEngine } from '../../engines/WinWin/index.js';
import { DAEngine } from '../../engines/DA/index.js';

const DEFAULT_VERSION = '6.0.0';

const LAB_CON_ACTIVE_SETS = Object.freeze(Object.keys(LAB_CON_SUBCONJUNTOS));
const LAB_CON1_ACTIVE_SETS = Object.freeze(Object.keys(LAB_CON_SUBCONJUNTOS));
const AT_REP_ACTIVE_SETS = Object.freeze(Object.keys(LAB_CON_SUBCONJUNTOS));

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
}

function normalizeSpinNumber(rawNumber) {
  if (rawNumber === null || rawNumber === undefined) return null;

  if (rawNumber === 37 || rawNumber === '37' || rawNumber === 90 || rawNumber === '90') {
    return '00';
  }

  if (rawNumber === 0 || rawNumber === '0' || rawNumber === '00') {
    return String(rawNumber) === '00' ? '00' : '0';
  }

  if (typeof rawNumber === 'number' && Number.isFinite(rawNumber)) {
    return String(Math.trunc(rawNumber));
  }

  if (typeof rawNumber === 'string') {
    const trimmed = rawNumber.trim();
    if (!trimmed) return null;
    return trimmed;
  }

  return String(rawNumber);
}

function normalizeSpinRecord(record, index) {
  if (record === null || record === undefined) return null;

  if (typeof record === 'number' || typeof record === 'string') {
    const number = normalizeSpinNumber(record);
    return number === null ? null : { id: index + 1, number };
  }

  if (typeof record !== 'object') return null;

  const rawNumber = record.number ?? record.value ?? record.spin ?? record.result;
  const number = normalizeSpinNumber(rawNumber);
  if (number === null) return null;

  const rawId = record.id ?? record.spinId ?? record.index ?? index + 1;
  const parsedId = Number(rawId);
  const id = Number.isFinite(parsedId) ? parsedId : index + 1;

  return {
    ...record,
    id,
    number,
  };
}

function extractRecords(source) {
  if (!source) return [];
  if (Array.isArray(source)) return [...source];
  if (Array.isArray(source.records)) return [...source.records];
  if (Array.isArray(source.spins)) return [...source.spins];
  if (Array.isArray(source.history)) return [...source.history];
  return [];
}

function resolveRecords(context) {
  const candidateSources = [
    context?.dataset,
    context?.metadata?.dataset,
    context?.metadata?.records,
    context?.metadata?.spins,
    context?.configuration?.records,
    context?.configuration?.spins,
  ];

  for (const source of candidateSources) {
    const records = extractRecords(source);
    if (records.length > 0) return records;
  }

  return [];
}

function resolveSettings(context) {
  const configuration = context?.configuration ?? {};
  const metadata = context?.metadata ?? {};
  const atrasosMaxWindow = [configuration.atrasosMaxWindow, metadata.atrasosMaxWindow]
    .find(value => Number.isFinite(Number(value)));

  const customSeries = Array.isArray(configuration.customSeries)
    ? configuration.customSeries
    : Array.isArray(metadata.customSeries)
      ? metadata.customSeries
      : [];

  const moduleThresholds = configuration.moduleThresholds && typeof configuration.moduleThresholds === 'object'
    ? configuration.moduleThresholds
    : metadata.moduleThresholds && typeof metadata.moduleThresholds === 'object'
      ? metadata.moduleThresholds
      : {};

  return {
    atrasosMaxWindow: toPositiveInteger(atrasosMaxWindow, 100),
    customSeries,
    moduleThresholds,
  };
}

function createTrackerFromContext(context) {
  const spins = resolveRecords(context)
    .map((record, index) => normalizeSpinRecord(record, index))
    .filter(Boolean);
  const settings = resolveSettings(context);

  return {
    getSpins() {
      return spins.map(spin => ({ ...spin }));
    },
    getSettings() {
      return {
        ...settings,
        customSeries: Array.isArray(settings.customSeries)
          ? settings.customSeries.map(series => ({ ...series, numbers: Array.isArray(series?.numbers) ? [...series.numbers] : [] }))
          : [],
        moduleThresholds: { ...settings.moduleThresholds },
      };
    },
  };
}

function resolveActiveSets(context, fallbackSets) {
  const candidate = context?.configuration?.activeSets ?? context?.metadata?.activeSets;
  if (Array.isArray(candidate) && candidate.length > 0) {
    return candidate;
  }
  return [...fallbackSets];
}

function resolveRunLimit(context) {
  const candidate = context?.configuration?.limit ?? context?.metadata?.limit;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

function buildConsensusModule({
  id,
  name,
  description,
  category,
  manifestCapabilities,
  supportedContracts,
  compatibility,
  implementation,
  adapter,
  execute,
}) {
  const manifest = defineLaboratoryModuleManifest({
    id,
    name,
    version: DEFAULT_VERSION,
    description,
    category,
    capabilities: manifestCapabilities,
    supportedContracts,
    compatibility,
  });

  return {
    manifest,
    implementation: Object.freeze({ ...implementation }),
    adapter: adapter ? Object.freeze({ ...adapter }) : undefined,
    execute,
  };
}

async function awaitReady(instance) {
  if (instance && typeof instance.ready?.then === 'function') {
    await instance.ready;
  }
}

function buildLabConModule() {
  return buildConsensusModule({
    id: 'lab.con',
    name: 'Lab_Con',
    description: 'Analytical consensus module for delay-weighted set scoring.',
    category: 'consensus',
    manifestCapabilities: ['analysis', 'consensus', 'set-scoring'],
    supportedContracts: ['LaboratoryContext', 'LaboratoryResult', 'LaboratoryMetric'],
    compatibility: { dataSource: 'LaboratoryDataset', trackerMode: 'dataset-backed' },
    implementation: {
      type: 'engine',
      className: 'LabEngine',
      source: 'labEngine.js',
    },
    adapter: {
      type: 'adapter',
      className: 'LabConAdapter',
      source: 'src/consensus/adapters/LabConAdapter.js',
    },
    execute: ({ context, options }) => {
      const tracker = createTrackerFromContext(context);
      const engine = new LabEngine(tracker);
      const adapter = new LabConAdapter(engine, {
        activeSets: resolveActiveSets(context, LAB_CON_ACTIVE_SETS),
        topK: options?.topK,
      });
      return adapter.adapt(resolveActiveSets(context, LAB_CON_ACTIVE_SETS));
    },
  });
}

function buildLabCon1Module() {
  return buildConsensusModule({
    id: 'lab.con1',
    name: 'Lab_Con1',
    description: 'Win-Win weighted consensus module backed by dataset composition.',
    category: 'consensus',
    manifestCapabilities: ['analysis', 'consensus', 'win-win'],
    supportedContracts: ['LaboratoryContext', 'LaboratoryResult', 'LaboratoryMetric'],
    compatibility: { dataSource: 'LaboratoryDataset', trackerMode: 'dataset-backed' },
    implementation: {
      type: 'engine',
      className: 'LabCon1Engine',
      source: 'labCon1Engine.js',
    },
    adapter: {
      type: 'adapter',
      className: 'LabCon1Adapter',
      source: 'src/consensus/adapters/LabCon1Adapter.js',
    },
    execute: ({ context, options }) => {
      const tracker = createTrackerFromContext(context);
      const engine = new LabCon1Engine(tracker);
      const adapter = new LabCon1Adapter(engine, {
        activeSets: resolveActiveSets(context, LAB_CON1_ACTIVE_SETS),
        topK: options?.topK,
      });
      return adapter.adapt(resolveActiveSets(context, LAB_CON1_ACTIVE_SETS));
    },
  });
}

function buildAtRepModule() {
  return buildConsensusModule({
    id: 'at.rep',
    name: 'AtRep',
    description: 'Attraction and repulsion module over roulette subsets.',
    category: 'consensus',
    manifestCapabilities: ['analysis', 'consensus', 'pci'],
    supportedContracts: ['LaboratoryContext', 'LaboratoryResult', 'LaboratoryMetric'],
    compatibility: { dataSource: 'LaboratoryDataset', trackerMode: 'dataset-backed' },
    implementation: {
      type: 'engine',
      className: 'AtRepEngine',
      source: 'atRepEngine.js',
    },
    adapter: {
      type: 'adapter',
      className: 'AtRepAdapter',
      source: 'src/consensus/adapters/AtRepAdapter.js',
    },
    execute: ({ context, options }) => {
      const tracker = createTrackerFromContext(context);
      const engine = new AtRepEngine(tracker);
      const adapter = new AtRepAdapter(engine, {
        activeSets: resolveActiveSets(context, AT_REP_ACTIVE_SETS),
      });
      return adapter.adapt(resolveActiveSets(context, AT_REP_ACTIVE_SETS));
    },
  });
}

function buildWinWinModule() {
  return buildConsensusModule({
    id: 'win.win',
    name: 'WinWin',
    description: 'Historical Win-Win analytics module for tables and streaks.',
    category: 'analytics',
    manifestCapabilities: ['analysis', 'tables', 'streaks'],
    supportedContracts: ['LaboratoryContext', 'LaboratoryResult', 'LaboratoryMetric'],
    compatibility: { dataSource: 'LaboratoryDataset', trackerMode: 'dataset-backed' },
    implementation: {
      type: 'engine',
      className: 'WinWinEngine',
      source: 'src/engines/WinWin/WinWinEngine.js',
    },
    adapter: {
      type: 'composition',
      className: 'dataset-backed-tracker',
      source: 'src/laboratory/modules/LaboratoryModuleCatalog.js',
    },
    execute: async ({ context, options }) => {
      const tracker = createTrackerFromContext(context);
      const engine = new WinWinEngine(tracker);
      await awaitReady(engine);
      const spins = tracker.getSpins();
      const settings = tracker.getSettings();
      const windowSize = resolveRunLimit(context) ?? options?.limit ?? null;
      const threshold = Number.isFinite(settings.threshold) ? settings.threshold : 20;
      const activeSeries = Array.isArray(settings.customSeries) ? settings.customSeries : [];
      const evaluationWindow = windowSize && Number.isFinite(windowSize)
        ? Math.min(windowSize, spins.length)
        : Math.min(spins.length, 38);

      return {
        module: 'WinWin',
        chi: engine.getCHIDetails(),
        externals: engine.analyzeExternals(spins, threshold, windowSize),
        dozens: engine.analyzeDozens(spins, threshold, windowSize),
        seisenas: engine.analyzeSeisenas(spins, threshold, windowSize),
        winWin: engine.analyzeWinWin(spins, activeSeries, windowSize),
        seriesAtrasadas: engine.analyzeSeriesAtrasadas(spins, activeSeries, windowSize, threshold),
        leyDelTercio: evaluationWindow > 0 ? engine.analyzeLeyDelTercio(spins, evaluationWindow) : null,
        settings,
      };
    },
  });
}

function buildDAModule() {
  return buildConsensusModule({
    id: 'da',
    name: 'DA',
    description: 'Absolute distance analytics module for spin timing tables.',
    category: 'analytics',
    manifestCapabilities: ['analysis', 'tables', 'distance'],
    supportedContracts: ['LaboratoryContext', 'LaboratoryResult', 'LaboratoryMetric'],
    compatibility: { dataSource: 'LaboratoryDataset', trackerMode: 'dataset-backed' },
    implementation: {
      type: 'engine',
      className: 'DAEngine',
      source: 'src/engines/DA/DAEngine.js',
    },
    adapter: {
      type: 'composition',
      className: 'dataset-backed-tracker',
      source: 'src/laboratory/modules/LaboratoryModuleCatalog.js',
    },
    execute: ({ context, options }) => {
      const tracker = createTrackerFromContext(context);
      const engine = new DAEngine(tracker);
      const limit = resolveRunLimit(context) ?? options?.limit ?? null;
      return {
        module: 'DA',
        tables: engine.getAllTableData(limit),
        settings: tracker.getSettings(),
      };
    },
  });
}

function buildHistoricalEvidenceDatasetProvider() {
  return {
    manifest: defineLaboratoryModuleManifest({
      id: 'historical-evidence.dataset-provider',
      name: 'Historical Evidence Dataset Provider',
      version: DEFAULT_VERSION,
      description: 'Official dataset provider for the laboratory runner.',
      category: 'dataset-provider',
      capabilities: ['dataset', 'snapshot', 'historical-evidence'],
      supportedContracts: ['LaboratoryDataset'],
      compatibility: { dataSource: 'HistoricalEvidence', trackerMode: 'none' },
    }),
    implementation: Object.freeze({
      type: 'dataset-provider',
      source: 'src/historical-evidence',
    }),
    adapter: Object.freeze({
      type: 'dataset-context-adapter',
      source: 'src/laboratory/modules/LaboratoryModuleCatalog.js',
    }),
    execute: ({ context }) => {
      if (context?.dataset instanceof LaboratoryDataset) {
        return context.dataset;
      }

      const records = resolveRecords(context);
      const datasetVersion = context?.metadata?.datasetVersion
        ?? context?.configuration?.datasetVersion
        ?? 'historical-evidence';
      const datasetId = context?.metadata?.datasetId
        ?? context?.configuration?.datasetId
        ?? context?.runId
        ?? 'historical-evidence.dataset';
      const createdAt = context?.metadata?.createdAt
        ?? context?.configuration?.createdAt
        ?? datasetId;

      return new LaboratoryDataset({
        id: datasetId,
        datasetVersion,
        records,
        metadata: {
          source: 'historical-evidence',
          ...(context?.metadata ?? {}),
        },
        createdAt,
      });
    },
  };
}

export function createLaboratoryModules() {
  return Object.freeze([
    buildLabConModule(),
    buildLabCon1Module(),
    buildAtRepModule(),
    buildWinWinModule(),
    buildDAModule(),
    buildHistoricalEvidenceDatasetProvider(),
  ]);
}

export function registerLaboratoryModules(registry) {
  if (!registry || typeof registry.register !== 'function') {
    throw new TypeError('registerLaboratoryModules requires a LaboratoryRegistry instance.');
  }

  const modules = createLaboratoryModules();
  for (const moduleDefinition of modules) {
    registry.register(moduleDefinition);
  }
  return registry;
}

export function createLaboratoryRegistry(registry = null) {
  if (registry) {
    return registerLaboratoryModules(registry);
  }

  const freshRegistry = new LaboratoryRegistry();
  registerLaboratoryModules(freshRegistry);
  return freshRegistry;
}
