import {
  CONSENSUS_SCHEMA_VERSION,
  CONSENSUS_SOURCE_ENGINES,
  SIGNAL_QUALITY,
  WARNING_SEVERITY,
} from '../constants/consensusConstants.js';
import { normalizeRouletteNumber } from '../utils/normalizeRouletteNumber.js';

const freeze = value => Object.freeze(value);
const field = (kind, options = {}) => freeze({ kind, ...options });
const objectField = (properties, options = {}) => field('object', {
  allowUnknown: false,
  properties: freeze(properties),
  ...options,
});
const arrayField = (items, options = {}) => field('array', {
  items,
  ...options,
});
const stringField = (options = {}) => field('string', options);
const numberField = (options = {}) => field('number', options);
const integerField = (options = {}) => field('number', { integer: true, ...options });
const booleanField = (options = {}) => field('boolean', options);

const SOURCE_ENGINE_VALUES = Object.freeze(Object.values(CONSENSUS_SOURCE_ENGINES));
const SIGNAL_QUALITY_VALUES = Object.freeze(Object.values(SIGNAL_QUALITY));
const WARNING_SEVERITY_VALUES = Object.freeze(Object.values(WARNING_SEVERITY));

export const CONSENSUS_SIGNAL_WARNING_SCHEMA = objectField({
  code: stringField({ required: true }),
  message: stringField({ required: true }),
  severity: stringField({ required: true, enum: WARNING_SEVERITY_VALUES }),
  source: stringField({ required: false, nullable: true }),
});

export const CONSENSUS_SIGNAL_PROVENANCE_SCHEMA = objectField({
  engine: stringField({ required: true, enum: SOURCE_ENGINE_VALUES }),
  file: stringField({ required: true }),
  method: stringField({ required: true }),
  version: stringField({ required: false, nullable: true }),
});

const delaySchema = objectField({
  actualDelay: integerField({ required: true, min: 0 }),
  maxDelay: integerField({ required: true, min: 0 }),
  delayRatio: numberField({ required: true, nullable: true }),
  delayScore: numberField({ required: true, nullable: true }),
  probabilityDelay: numberField({ required: true, nullable: true }),
  pressure: numberField({ required: true, nullable: true }),
  activeSets: arrayField(stringField({ required: true }), { required: true }),
});

const winWinSchema = objectField({
  atraso: integerField({ required: true, min: 0 }),
  threshold: integerField({ required: true, min: 0 }),
  level: stringField({ required: true, nullable: true }),
  isActive: booleanField({ required: true }),
  streakLength: integerField({ required: true, min: 0 }),
  streakBonus: numberField({ required: true, nullable: true }),
  recencyBonus: numberField({ required: true, nullable: true }),
  winWinScore: numberField({ required: true, nullable: true }),
});

const pciBySetSchema = objectField({
  set: stringField({ required: true }),
  pci: numberField({ required: true, nullable: true }),
});

const pciSchema = objectField({
  occurrences: integerField({ required: true, min: 0 }),
  meanDist: numberField({ required: true, nullable: true }),
  expectedDist: numberField({ required: true, nullable: true }),
  pciIndividual: numberField({ required: true, nullable: true }),
  pciCombined: numberField({ required: true, nullable: true }),
  pciBySet: arrayField(pciBySetSchema, { required: true }),
});

export const CONSENSUS_SIGNAL_SCHEMA = objectField({
  schemaVersion: stringField({ required: true, enum: [CONSENSUS_SCHEMA_VERSION] }),
  number: stringField({
    required: true,
    check: value => {
      try {
        return normalizeRouletteNumber(value) === value;
      } catch {
        return false;
      }
    },
  }),
  sourceEngines: arrayField(stringField({ required: true, enum: SOURCE_ENGINE_VALUES }), { required: true }),
  rawSignals: objectField({
    delay: field('object', { required: true, nullable: true, properties: delaySchema.properties, allowUnknown: false }),
    winWin: field('object', { required: true, nullable: true, properties: winWinSchema.properties, allowUnknown: false }),
    pci: field('object', { required: true, nullable: true, properties: pciSchema.properties, allowUnknown: false }),
  }),
  evidence: objectField({
    occurrences: integerField({ required: true, min: 0 }),
    sampleSize: integerField({ required: true, min: 0 }),
    activeSets: arrayField(stringField({ required: true }), { required: true }),
    windowSize: integerField({ required: true, min: 0 }),
    historyLength: integerField({ required: true, min: 0 }),
    supportCount: integerField({ required: true, min: 0 }),
    signalQuality: stringField({ required: true, enum: SIGNAL_QUALITY_VALUES }),
  }),
  metadata: objectField({
    generatedAt: stringField({ required: true, nullable: true, check: value => value === null || !Number.isNaN(Date.parse(value)) }),
    valid: booleanField({ required: true }),
    warnings: arrayField(CONSENSUS_SIGNAL_WARNING_SCHEMA, { required: true }),
    missingSignals: arrayField(stringField({ required: true }), { required: true }),
    provenance: arrayField(CONSENSUS_SIGNAL_PROVENANCE_SCHEMA, { required: true }),
  }),
});

export const CONSENSUS_SIGNAL_SECTIONS = freeze({
  delay: delaySchema,
  winWin: winWinSchema,
  pci: pciSchema,
});
