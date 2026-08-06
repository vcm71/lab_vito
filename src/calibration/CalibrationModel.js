/**
 * CalibrationModel — immutable trained-model data object.
 *
 * No logic, only structured data. Hash is computed once at creation
 * from the stable serialization of parameters + datasetVersion + strategy.
 */

import { createHash } from 'node:crypto';

export class CalibrationModel {
  constructor(options = {}) {
    this.id = options.id ?? null;
    this.strategy = options.strategy ?? null;
    this.strategyVersion = options.strategyVersion ?? null;
    this.modelVersion = options.modelVersion ?? null;
    this.datasetVersion = options.datasetVersion ?? null;
    this.trainedAt = options.trainedAt ?? new Date().toISOString();
    this.trainingSamples = options.trainingSamples ?? 0;
    this.parameters = Object.freeze({ ...(options.parameters ?? {}) });
    this.metrics = Object.freeze({ ...(options.metrics ?? {}) });
    this.hash = options.hash ?? null;
    this.metadata = Object.freeze({ ...(options.metadata ?? {}) });
    Object.freeze(this);
  }

  /**
   * Compute a collision-resistant SHA-256 hash from the stable fields.
   *
   * Uses node:crypto in Node.js (sync), SubtleCrypto in browser (async fallback).
   * The sync path is preferred for test determinism; browser code should
   * use computeHashAsync if SubtleCrypto is the only available backend.
   */
  static computeHash(parameters, datasetVersion, strategy, strategyVersion) {
    const payload = JSON.stringify({
      parameters,
      datasetVersion,
      strategy,
      strategyVersion,
    });

    const digest = createHash('sha256').update(payload, 'utf8').digest('hex');
    return digest;
  }

  /**
   * Async SHA-256 hash — works in browser via SubtleCrypto, Node.js via node:crypto.
   */
  static async computeHashAsync(parameters, datasetVersion, strategy, strategyVersion) {
    const payload = JSON.stringify({
      parameters,
      datasetVersion,
      strategy,
      strategyVersion,
    });

    let digest;
    try {
      // eslint-disable-next-line no-eval
      const crypto = (1, eval)('require')?.('node:crypto');
      if (crypto && crypto.createHash) {
        digest = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
      }
    } catch (_) { /* browser */ }

    if (!digest) {
      if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        digest = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        throw new Error('CalibrationModel.computeHashAsync: no SHA-256 implementation available.');
      }
    }

    return 'mdl_' + digest.substring(0, 16);
  }

  toJSON() {
    return {
      id: this.id,
      strategy: this.strategy,
      strategyVersion: this.strategyVersion,
      modelVersion: this.modelVersion,
      datasetVersion: this.datasetVersion,
      trainedAt: this.trainedAt,
      trainingSamples: this.trainingSamples,
      parameters: { ...this.parameters },
      metrics: { ...this.metrics },
      hash: this.hash,
      metadata: { ...this.metadata },
    };
  }
}
