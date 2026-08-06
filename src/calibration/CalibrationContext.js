/**
 * CalibrationContext — single, immutable contract object passed to every
 * strategy during training and inference.
 *
 * ALL strategies receive exactly this shape — never loose parameters.
 */

export class CalibrationContext {
  constructor(options = {}) {
    this.configuration = Object.freeze({ ...(options.configuration ?? {}) });
    this.strategy = options.strategy ?? null;
    this.model = options.model ?? null;
    this.datasetVersion = options.datasetVersion ?? null;
    this.evaluationMode = options.evaluationMode ?? 'inference';
    this.consensusVersion = options.consensusVersion ?? null;
    this.engineVersion = options.engineVersion ?? null;
    this.metadata = Object.freeze({ ...(options.metadata ?? {}) });
    this.futureExtensions = Object.freeze({ ...(options.futureExtensions ?? {}) });
    Object.freeze(this);
  }

  toJSON() {
    return {
      configuration: { ...this.configuration },
      strategy: this.strategy,
      model: this.model ? this.model.toJSON() : null,
      datasetVersion: this.datasetVersion,
      evaluationMode: this.evaluationMode,
      consensusVersion: this.consensusVersion,
      engineVersion: this.engineVersion,
      metadata: { ...this.metadata },
      futureExtensions: { ...this.futureExtensions },
    };
  }
}
