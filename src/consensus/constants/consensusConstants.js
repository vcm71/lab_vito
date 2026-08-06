/**
 * Core constants for the consensus infrastructure.
 */

export const CONSENSUS_SCHEMA_VERSION = '1.0.0';

export const CONSENSUS_SOURCE_ENGINES = Object.freeze({
  LAB_CON: 'Lab_Con',
  LAB_CON_1: 'Lab_Con1',
  AT_REP: 'AtRep',
});

export const SIGNAL_QUALITY = Object.freeze({
  INSUFFICIENT: 'INSUFFICIENT',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
});

export const SIGNAL_FAMILY = Object.freeze({
  DELAY: 'delay',
  WIN_WIN: 'winWin',
  PCI: 'pci',
});

export const WARNING_SEVERITY = Object.freeze({
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
});

export const AMERICAN_ROULETTE_NUMBERS = Object.freeze([
  '0',
  '00',
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '10', '11', '12', '13', '14', '15', '16', '17', '18',
  '19', '20', '21', '22', '23', '24', '25', '26', '27', '28',
  '29', '30', '31', '32', '33', '34', '35', '36',
]);
