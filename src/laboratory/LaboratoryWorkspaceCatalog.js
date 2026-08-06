import { LaboratoryWorkspace } from './LaboratoryWorkspace.js';

function nowIso() {
  return new Date().toISOString();
}

function normalizeWorkspace(workspace) {
  if (!workspace || typeof workspace !== 'object') {
    throw new TypeError('LaboratoryWorkspaceCatalog: workspace is required.');
  }

  return workspace instanceof LaboratoryWorkspace ? workspace : new LaboratoryWorkspace(workspace);
}

function serializeWorkspace(workspace) {
  return typeof workspace.toJSON === 'function' ? workspace.toJSON() : { ...workspace };
}

function cloneEntry(entry) {
  return {
    workspace: serializeWorkspace(entry.workspace),
    open: entry.open,
    registeredAt: entry.registeredAt,
    openedAt: entry.openedAt,
    closedAt: entry.closedAt,
    metadata: { ...entry.metadata },
  };
}

export class LaboratoryWorkspaceCatalog {
  constructor(options = {}) {
    this.entries = new Map();
    this.metadata = Object.freeze({ ...(options.metadata ?? {}) });

    for (const workspace of options.workspaces ?? []) {
      this.register(workspace);
    }
  }

  register(workspace, options = {}) {
    const current = normalizeWorkspace(workspace);
    const workspaceId = current.workspaceId;
    const existing = this.entries.get(workspaceId) ?? null;
    const registeredAt = existing?.registeredAt ?? options.registeredAt ?? nowIso();

    const entry = {
      workspace: current,
      open: existing?.open ?? false,
      registeredAt,
      openedAt: existing?.openedAt ?? null,
      closedAt: existing?.closedAt ?? null,
      metadata: {
        ...(existing?.metadata ?? {}),
        ...(options.metadata ?? {}),
      },
    };

    this.entries.set(workspaceId, entry);
    return cloneEntry(entry);
  }

  consult(workspaceId) {
    const entry = this.entries.get(workspaceId) ?? null;
    return entry ? cloneEntry(entry) : null;
  }

  list() {
    return [...this.entries.values()]
      .sort((left, right) => left.registeredAt.localeCompare(right.registeredAt) || left.workspace.workspaceId.localeCompare(right.workspace.workspaceId))
      .map(cloneEntry);
  }

  open(workspaceId, options = {}) {
    const entry = this.entries.get(workspaceId);
    if (!entry) {
      throw new Error(`LaboratoryWorkspaceCatalog: unknown workspace "${workspaceId}".`);
    }

    entry.open = true;
    entry.openedAt = options.openedAt ?? entry.openedAt ?? nowIso();
    entry.closedAt = null;
    entry.metadata = {
      ...entry.metadata,
      ...(options.metadata ?? {}),
    };
    this.entries.set(workspaceId, entry);
    return cloneEntry(entry);
  }

  close(workspaceId, options = {}) {
    const entry = this.entries.get(workspaceId);
    if (!entry) {
      throw new Error(`LaboratoryWorkspaceCatalog: unknown workspace "${workspaceId}".`);
    }

    entry.open = false;
    entry.closedAt = options.closedAt ?? nowIso();
    entry.metadata = {
      ...entry.metadata,
      ...(options.metadata ?? {}),
    };
    this.entries.set(workspaceId, entry);
    return cloneEntry(entry);
  }

  toJSON() {
    return {
      metadata: { ...this.metadata },
      entries: this.list(),
    };
  }
}

export function defineLaboratoryWorkspaceCatalog(options = {}) {
  return new LaboratoryWorkspaceCatalog(options);
}
