import { describe, expect, it } from 'vitest';
import * as consensus from '../../src/consensus/index.js';

describe('consensus public exports', () => {
  it('exports only the expected public API', () => {
    expect(Object.keys(consensus).sort()).toEqual([
      'AMERICAN_ROULETTE_NUMBERS',
      'AtRepAdapter',
      'BinaryStrategy',
      'CONSENSUS_CONFIG_VERSION',
      'CONSENSUS_SCHEMA_VERSION',
      'CONSENSUS_SOURCE_ENGINES',
      'CategoricalStrategy',
      'ConsensusEngine',
      'DEFAULT_CONSENSUS_CONFIG',
      'DEFAULT_FIELD_CONFIGURATION',
      'ENGINE_TO_FAMILY',
      'IdentityStrategy',
      'LabCon1Adapter',
      'LabConAdapter',
      'MinMaxStrategy',
      'PercentileStrategy',
      'RobustMinMaxStrategy',
      'SIGNAL_FAMILY',
      'SIGNAL_QUALITY',
      'SKIP_FIELDS',
      'SignalCollector',
      'SignalNormalizer',
      'WARNING_SEVERITY',
      'ZScoreStrategy',
      'cloneConsensusSignal',
      'createConsensusSignal',
      'normalizeRouletteNumber',
      'validateConsensusSignal',
    ]);
  });
});
