const SESSION_STATUSES = Object.freeze([
  'CREATED',
  'READY',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

const TRANSITIONS = Object.freeze({
  CREATED: Object.freeze(['READY', 'CANCELLED']),
  READY: Object.freeze(['RUNNING', 'CANCELLED']),
  RUNNING: Object.freeze(['COMPLETED', 'FAILED', 'CANCELLED']),
  COMPLETED: Object.freeze([]),
  FAILED: Object.freeze([]),
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
    case 'COMPLETED': return 'completedAt';
    case 'FAILED': return 'failedAt';
    case 'CANCELLED': return 'cancelledAt';
    default: return null;
  }
}

export class LaboratorySessionLifecycle {
  constructor(options = {}) {
    const status = options.status ?? 'CREATED';
    if (!SESSION_STATUSES.includes(status)) {
      throw new TypeError(`LaboratorySessionLifecycle: unsupported status "${status}".`);
    }

    this.status = status;
    this.timestamps = freezeObject(options.timestamps);
    this.previousStatus = options.previousStatus ?? null;
    Object.freeze(this);
  }

  canTransitionTo(status) {
    return TRANSITIONS[this.status]?.includes(status) ?? false;
  }

  transitionTo(status, timestamp = nowIso()) {
    if (!SESSION_STATUSES.includes(status)) {
      throw new TypeError(`LaboratorySessionLifecycle: unsupported status "${status}".`);
    }

    if (!this.canTransitionTo(status) && status !== this.status) {
      throw new Error(`LaboratorySessionLifecycle: cannot transition from ${this.status} to ${status}.`);
    }

    const key = timestampKeyFor(status);
    const timestamps = key
      ? { ...this.timestamps, [key]: timestamp }
      : { ...this.timestamps };

    return new LaboratorySessionLifecycle({
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

export function defineLaboratorySessionLifecycle(options = {}) {
  return new LaboratorySessionLifecycle(options);
}

export { SESSION_STATUSES as LABORATORY_SESSION_STATUSES };
