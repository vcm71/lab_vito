const EXPERIMENT_STATUSES = Object.freeze([
  'CREATED',
  'READY',
  'RUNNING',
  'ANALYZING',
  'COMPLETED',
  'ARCHIVED',
  'CANCELLED',
]);

const TRANSITIONS = Object.freeze({
  CREATED: Object.freeze(['READY', 'CANCELLED']),
  READY: Object.freeze(['RUNNING', 'CANCELLED']),
  RUNNING: Object.freeze(['ANALYZING', 'COMPLETED', 'CANCELLED']),
  ANALYZING: Object.freeze(['COMPLETED', 'CANCELLED']),
  COMPLETED: Object.freeze(['ARCHIVED']),
  ARCHIVED: Object.freeze([]),
  CANCELLED: Object.freeze([]),
});

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function nowIso() {
  return new Date().toISOString();
}

function timestampKeyFor(status) {
  switch (status) {
    case 'READY': return 'readyAt';
    case 'RUNNING': return 'startedAt';
    case 'ANALYZING': return 'analyzingAt';
    case 'COMPLETED': return 'completedAt';
    case 'ARCHIVED': return 'archivedAt';
    case 'CANCELLED': return 'cancelledAt';
    default: return null;
  }
}

export class LaboratoryExperimentLifecycle {
  constructor(options = {}) {
    const status = options.status ?? 'CREATED';
    if (!EXPERIMENT_STATUSES.includes(status)) {
      throw new TypeError(`LaboratoryExperimentLifecycle: unsupported status "${status}".`);
    }

    this.status = status;
    this.previousStatus = options.previousStatus ?? null;
    this.timestamps = freezeObject(options.timestamps);
    Object.freeze(this);
  }

  canTransitionTo(status) {
    return TRANSITIONS[this.status]?.includes(status) ?? false;
  }

  transitionTo(status, timestamp = nowIso()) {
    if (!EXPERIMENT_STATUSES.includes(status)) {
      throw new TypeError(`LaboratoryExperimentLifecycle: unsupported status "${status}".`);
    }

    if (!this.canTransitionTo(status) && status !== this.status) {
      throw new Error(`LaboratoryExperimentLifecycle: cannot transition from ${this.status} to ${status}.`);
    }

    const key = timestampKeyFor(status);
    const timestamps = key
      ? { ...this.timestamps, [key]: timestamp }
      : { ...this.timestamps };

    return new LaboratoryExperimentLifecycle({
      status,
      previousStatus: this.status,
      timestamps,
    });
  }

  toJSON() {
    return {
      status: this.status,
      previousStatus: this.previousStatus,
      timestamps: { ...this.timestamps },
    };
  }
}

export function defineLaboratoryExperimentLifecycle(options = {}) {
  return new LaboratoryExperimentLifecycle(options);
}

export { EXPERIMENT_STATUSES as LABORATORY_EXPERIMENT_STATUSES };
