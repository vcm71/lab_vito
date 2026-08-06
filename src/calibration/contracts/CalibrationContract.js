/**
 * @fileoverview Type contracts for the ProbabilityCalibrator.
 *
 * Defines the input contract (what ConsensusEngine must produce) and the
 * output contract (what ProbabilityCalibrator adds on top).
 *
 * These are JSDoc-only typedefs matching the runtime shapes validated by
 * CalibrationInputValidator and produced by CalibrationResultFactory.
 */

/**
 * Input contract — per-number entry produced by ConsensusEngine.compute().
 *
 * @typedef {Object} CalibrationInputEntry
 * @property {string} number
 * @property {number|null} rawConsensusScore
 * @property {boolean} valid
 * @property {string|null} invalidReason
 * @property {Object<string,{score:number|null,signals:Array,excluded:Array,coverage:Object}>} engineScores
 * @property {Object<string,{configuredWeight:number,effectiveWeight:number,score:number,weightedContribution:number}>} engineContributions
 * @property {{score:number|null,calculable:boolean,reason:string|null,dispersion:number|null,engineCount:number}} agreement
 * @property {Array<{type:string,severity:string,engines:string[],scoreDifference:number|null,threshold:number|null,messageCode:string,blocking:boolean}>} conflicts
 * @property {{score:number,level:string,components:{coverage:number,participation:number,agreement:number,conflictPenalty:number}}} confidence
 * @property {{configuredEngines:number,participatingEngines:number,configuredWeight:number,availableWeight:number,coverageRatio:number}} coverage
 * @property {{summaryCode:string,dominantEngine:string|null,dominantSignals:Array,positiveFactors:string[],limitingFactors:string[],warningCodes:string[]}} explanation
 */

/**
 * Top-level input — what ProbabilityCalibrator.calibrate() receives.
 *
 * @typedef {Object} CalibrationInput
 * @property {Object<string,CalibrationInputEntry>} numbers
 * @property {{consensus:{appliedAt:string,schemaVersion:string,mode:string,aggregationStrategy:string,missingPolicy:string,processedNumbers:number,validNumbers:number,invalidNumbers:number,configurationVersion:string,configurationSummary:Object,warnings:Array}}} metadata
 */

/**
 * Calibration strategy metadata.
 *
 * @typedef {Object} CalibrationStrategyMeta
 * @property {string} name — unique key, e.g. 'IdentityCalibration'
 * @property {string} strategyVersion — semver string
 * @property {string|null} trainingDataset — path or identifier; null when untrained
 * @property {string|null} trainedAt — ISO timestamp; null when untrained
 * @property {string|null} modelVersion — null when no learned model
 * @property {string} calibrationVersion — semver of the calibration system
 */

/**
 * Per-number calibrated output.
 *
 * @typedef {Object} CalibratedEntry
 * @property {string} number
 * @property {number|null} rawConsensusScore — preserved from input
 * @property {number|null} calibratedProbability — the calibrated value
 * @property {boolean} valid
 * @property {string|null} invalidReason
 * @property {Object<string,{score:number|null,signals:Array,excluded:Array,coverage:Object}>} engineScores
 * @property {Object<string,{configuredWeight:number,effectiveWeight:number,score:number,weightedContribution:number}>} engineContributions
 * @property {{score:number|null,calculable:boolean,reason:string|null,dispersion:number|null,engineCount:number}} agreement
 * @property {Array<{type:string,severity:string,engines:string[],scoreDifference:number|null,threshold:number|null,messageCode:string,blocking:boolean}>} conflicts
 * @property {{score:number,level:string,components:{coverage:number,participation:number,agreement:number,conflictPenalty:number}}} confidence
 * @property {{configuredEngines:number,participatingEngines:number,configuredWeight:number,availableWeight:number,coverageRatio:number}} coverage
 * @property {{summaryCode:string,dominantEngine:string|null,dominantSignals:Array,positiveFactors:string[],limitingFactors:string[],warningCodes:string[]}} explanation
 * @property {CalibrationStrategyMeta} calibration — strategy metadata for this entry
 */

/**
 * Top-level output from ProbabilityCalibrator.calibrate().
 *
 * @typedef {Object} CalibrationOutput
 * @property {Object<string,CalibratedEntry>} numbers
 * @property {{consensus:Object,calibration:CalibrationStrategyMeta}} metadata
 */

export {};
