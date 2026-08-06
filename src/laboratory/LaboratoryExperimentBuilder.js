import { LaboratoryComparison } from './LaboratoryComparison.js';
import { LaboratoryEvidenceReport } from './LaboratoryEvidenceReport.js';
import { LaboratoryExperiment } from './LaboratoryExperiment.js';
import { LaboratoryExperimentLifecycle } from './LaboratoryExperimentLifecycle.js';
import { LaboratorySession } from './LaboratorySession.js';

function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function nowIso() {
  return new Date().toISOString();
}

function serialize(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }

  return { ...value };
}

function normalizeExperiment(experiment, label = 'experiment') {
  if (!experiment || typeof experiment !== 'object') {
    throw new TypeError(`LaboratoryExperimentBuilder: ${label} is required.`);
  }

  if (experiment instanceof LaboratoryExperiment) {
    return experiment;
  }

  return new LaboratoryExperiment(experiment);
}

function extractId(value, keys = ['experimentId', 'id']) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  for (const key of keys) {
    if (typeof value[key] === 'string' && value[key]) {
      return value[key];
    }
  }

  return null;
}

function normalizeLifecycle(lifecycle, status, createdAt, readyAt) {
  if (lifecycle instanceof LaboratoryExperimentLifecycle) {
    return lifecycle;
  }

  if (lifecycle && typeof lifecycle === 'object' && typeof lifecycle.status === 'string') {
    return new LaboratoryExperimentLifecycle(lifecycle);
  }

  const base = new LaboratoryExperimentLifecycle({ status: 'CREATED', timestamps: { createdAt } });
  const targetStatus = status ?? 'READY';
  if (targetStatus === 'CREATED') {
    return base;
  }

  return base.transitionTo(targetStatus, readyAt ?? createdAt);
}

function normalizeList(value) {
  return freezeList((value ?? []).map(serialize).filter(Boolean));
}

function coerceSession(session) {
  if (!session || typeof session !== 'object') {
    throw new TypeError('LaboratoryExperimentBuilder: session is required.');
  }

  return session instanceof LaboratorySession ? session : session;
}

function coerceComparison(comparison) {
  if (!comparison || typeof comparison !== 'object') {
    throw new TypeError('LaboratoryExperimentBuilder: comparison is required.');
  }

  return comparison instanceof LaboratoryComparison ? comparison : comparison;
}

function coerceEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    throw new TypeError('LaboratoryExperimentBuilder: evidence is required.');
  }

  return evidence instanceof LaboratoryEvidenceReport ? evidence : evidence;
}

function getSerializedId(entry) {
  return extractId(entry, ['experimentId', 'sessionId', 'comparisonId', 'reportId', 'id']);
}

export class LaboratoryExperimentBuilder {
  constructor(options = {}) {
    this.metadata = freezeObject(options.metadata);
    this.provenance = freezeObject(options.provenance);
    Object.freeze(this);
  }

  build(options = {}) {
    const experimentId = options.experimentId ?? options.id ?? null;
    const workspaceId = options.workspaceId ?? null;

    if (!experimentId || typeof experimentId !== 'string') {
      throw new TypeError('LaboratoryExperimentBuilder: experimentId is required and must be a string.');
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new TypeError('LaboratoryExperimentBuilder: workspaceId is required and must be a string.');
    }

    const createdAt = options.createdAt ?? nowIso();
    const readyAt = options.readyAt ?? createdAt;
    const lifecycle = normalizeLifecycle(options.lifecycle, options.status, createdAt, readyAt);

    return new LaboratoryExperiment({
      experimentId,
      workspaceId,
      hypothesis: options.hypothesis ?? null,
      objective: options.objective ?? null,
      sessions: normalizeList(options.sessions),
      comparisons: normalizeList(options.comparisons),
      evidence: normalizeList(options.evidence),
      metadata: freezeObject({
        ...this.metadata,
        ...(options.metadata ?? {}),
      }),
      provenance: freezeObject({
        ...this.provenance,
        ...(options.provenance ?? {}),
      }),
      createdAt,
      updatedAt: options.updatedAt ?? createdAt,
      timestamps: freezeObject({
        createdAt,
        updatedAt: options.updatedAt ?? createdAt,
        ...(options.timestamps ?? {}),
      }),
      lifecycle,
      status: lifecycle.status,
    });
  }

  fromJSON(json) {
    return this.build(json);
  }

  withSession(experiment, session, options = {}) {
    const current = normalizeExperiment(experiment, 'experiment');
    const nextSession = coerceSession(session);
    const sessionJson = serialize(nextSession);
    const sessionId = getSerializedId(sessionJson);

    if (!sessionId) {
      throw new TypeError('LaboratoryExperimentBuilder: session must include a sessionId.');
    }

    if (current.sessions.some(item => getSerializedId(item) === sessionId)) {
      throw new Error(`LaboratoryExperimentBuilder: session "${sessionId}" already exists in experiment ${current.experimentId}.`);
    }

    return this.build({
      ...current.toJSON(),
      sessions: [...current.sessions, sessionJson],
      updatedAt: options.updatedAt ?? nowIso(),
      provenance: {
        ...current.provenance,
        session: sessionJson,
        observedAt: options.observedAt ?? current.provenance.observedAt ?? null,
      },
    });
  }

  withComparison(experiment, comparison, options = {}) {
    const current = normalizeExperiment(experiment, 'experiment');
    const nextComparison = coerceComparison(comparison);
    const comparisonJson = serialize(nextComparison);
    const comparisonId = getSerializedId(comparisonJson);

    if (!comparisonId) {
      throw new TypeError('LaboratoryExperimentBuilder: comparison must include a comparisonId.');
    }

    if (current.comparisons.some(item => getSerializedId(item) === comparisonId)) {
      throw new Error(`LaboratoryExperimentBuilder: comparison "${comparisonId}" already exists in experiment ${current.experimentId}.`);
    }

    return this.build({
      ...current.toJSON(),
      comparisons: [...current.comparisons, comparisonJson],
      updatedAt: options.updatedAt ?? nowIso(),
      provenance: {
        ...current.provenance,
        comparison: comparisonJson,
        observedAt: options.observedAt ?? current.provenance.observedAt ?? null,
      },
    });
  }

  withEvidence(experiment, evidence, options = {}) {
    const current = normalizeExperiment(experiment, 'experiment');
    const nextEvidence = coerceEvidence(evidence);
    const evidenceJson = serialize(nextEvidence);
    const evidenceId = getSerializedId(evidenceJson);

    if (!evidenceId) {
      throw new TypeError('LaboratoryExperimentBuilder: evidence must include a reportId or id.');
    }

    if (current.evidence.some(item => getSerializedId(item) === evidenceId)) {
      throw new Error(`LaboratoryExperimentBuilder: evidence "${evidenceId}" already exists in experiment ${current.experimentId}.`);
    }

    return this.build({
      ...current.toJSON(),
      evidence: [...current.evidence, evidenceJson],
      updatedAt: options.updatedAt ?? nowIso(),
      provenance: {
        ...current.provenance,
        evidence: evidenceJson,
        observedAt: options.observedAt ?? current.provenance.observedAt ?? null,
      },
    });
  }

  validateConsistency(experiment) {
    const current = normalizeExperiment(experiment, 'experiment');
    const seen = new Set();

    const collections = [
      ['session', current.sessions],
      ['comparison', current.comparisons],
      ['evidence', current.evidence],
    ];

    for (const [kind, collection] of collections) {
      for (const item of collection) {
        const id = getSerializedId(item);
        if (!id) {
          throw new TypeError(`LaboratoryExperimentBuilder: every referenced artifact in ${current.experimentId} must expose an identifier.`);
        }

        const compositeId = `${kind}:${id}`;
        if (seen.has(compositeId)) {
          throw new Error(`LaboratoryExperimentBuilder: duplicate artifact "${id}" found in experiment ${current.experimentId}.`);
        }

        seen.add(compositeId);
      }
    }

    return {
      experimentId: current.experimentId,
      workspaceId: current.workspaceId,
      consistent: true,
      counts: {
        sessions: current.sessions.length,
        comparisons: current.comparisons.length,
        evidence: current.evidence.length,
      },
    };
  }
}

export function defineLaboratoryExperimentBuilder(options = {}) {
  return new LaboratoryExperimentBuilder(options);
}
