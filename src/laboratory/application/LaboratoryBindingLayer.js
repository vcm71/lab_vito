function freezeObject(value) {
  return Object.freeze({ ...(value ?? {}) });
}

function freezeList(value) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

function serialize(value) {
  if (value === null || value === undefined) return null;
  if (typeof value?.toJSON === 'function') return value.toJSON();
  if (Array.isArray(value)) return value.map(serialize).filter((item) => item !== null);
  if (typeof value === 'object') return { ...value };
  return value;
}

function countItems(value) {
  return Array.isArray(value) ? value.length : 0;
}

function summarizeWorkspace(workspace) {
  if (!workspace) return null;
  const snapshot = serialize(workspace);
  return freezeObject({
    workspaceId: snapshot.workspaceId ?? snapshot.id ?? null,
    name: snapshot.name ?? null,
    description: snapshot.description ?? null,
    experimentsCount: countItems(snapshot.experiments),
    createdAt: snapshot.createdAt ?? null,
    updatedAt: snapshot.updatedAt ?? null,
    timestamps: freezeObject(snapshot.timestamps),
  });
}

function summarizeExperiment(experiment) {
  if (!experiment) return null;
  const snapshot = serialize(experiment);
  return freezeObject({
    experimentId: snapshot.experimentId ?? snapshot.id ?? null,
    workspaceId: snapshot.workspaceId ?? null,
    hypothesis: snapshot.hypothesis ?? null,
    objective: snapshot.objective ?? null,
    status: snapshot.status ?? null,
    sessionsCount: countItems(snapshot.sessions),
    comparisonsCount: countItems(snapshot.comparisons),
    evidenceCount: countItems(snapshot.evidence),
    createdAt: snapshot.createdAt ?? null,
    updatedAt: snapshot.updatedAt ?? null,
    timestamps: freezeObject(snapshot.timestamps),
  });
}

function summarizeSession(session) {
  if (!session) return null;
  const snapshot = serialize(session);
  return freezeObject({
    sessionId: snapshot.sessionId ?? snapshot.id ?? null,
    status: snapshot.status ?? null,
    executionMode: snapshot.executionMode ?? null,
    modulesCount: countItems(snapshot.modules),
    stepsCount: countItems(snapshot.executionPlan),
    createdAt: snapshot.timestamps?.createdAt ?? null,
    updatedAt: snapshot.timestamps?.updatedAt ?? null,
    timestamps: freezeObject(snapshot.timestamps),
  });
}

function summarizeSessionResult(sessionResult) {
  if (!sessionResult) return null;
  const snapshot = serialize(sessionResult);
  return freezeObject({
    sessionId: snapshot.sessionId ?? null,
    status: snapshot.status ?? null,
    durationMs: snapshot.durationMs ?? null,
    ok: snapshot.status === 'COMPLETED' && countItems(snapshot.errors) === 0,
    modulesExecutedCount: countItems(snapshot.modulesExecuted),
    resultCount: countItems(snapshot.results),
    errorCount: countItems(snapshot.errors),
    startedAt: snapshot.startedAt ?? null,
    finishedAt: snapshot.finishedAt ?? null,
  });
}

function summarizeComparison(comparison) {
  if (!comparison) return null;
  const snapshot = serialize(comparison);
  return freezeObject({
    comparisonId: snapshot.comparisonId ?? snapshot.id ?? null,
    comparisonType: snapshot.comparisonType ?? null,
    criteriaCount: countItems(snapshot.criteria),
    criteria: freezeList(snapshot.criteria),
    metricKeys: Object.keys(snapshot.metrics ?? {}),
    differenceKeys: Object.keys(snapshot.differences ?? {}),
    metrics: freezeObject(snapshot.metrics),
    differences: freezeObject(snapshot.differences),
    conclusions: freezeList(snapshot.conclusions),
    leftSession: freezeObject(snapshot.leftSession),
    rightSession: freezeObject(snapshot.rightSession),
    sessionIds: (snapshot.sessions ?? [])
      .map((session) => session?.sessionId ?? session?.id ?? null)
      .filter(Boolean),
    timestamps: freezeObject(snapshot.timestamps),
  });
}

function inferComparisonKindFromId(itemId) {
  if (typeof itemId !== 'string') return null;
  if (itemId.startsWith('experiment')) return 'experiment';
  if (itemId.startsWith('session')) return 'session';
  if (itemId.startsWith('comparison')) return 'comparison';
  return null;
}

function normalizeComparisonSelectionItem(value, fallbackKind = null) {
  if (!value) return null;

  if (typeof value === 'string') {
    return freezeObject({
      itemId: value,
      itemKind: fallbackKind ?? inferComparisonKindFromId(value),
      label: value,
    });
  }

  if (typeof value !== 'object') return null;

  const snapshot = serialize(value);
  const itemId = snapshot.itemId ?? snapshot.experimentId ?? snapshot.sessionId ?? snapshot.comparisonId ?? snapshot.id ?? null;
  const itemKind = snapshot.itemKind ?? snapshot.kind ?? fallbackKind ?? inferComparisonKindFromId(itemId);

  if (!itemId) return null;

  return freezeObject({
    itemId,
    itemKind,
    label: snapshot.label ?? snapshot.title ?? snapshot.name ?? itemId,
    summary: freezeObject(snapshot.summary),
  });
}

function summarizeComparisonCandidate(candidate, kind) {
  if (!candidate) return null;
  const snapshot = serialize(candidate);

  if (kind === 'experiment') {
    return freezeObject({
      itemId: snapshot.experimentId ?? snapshot.id ?? null,
      itemKind: 'experiment',
      experimentId: snapshot.experimentId ?? snapshot.id ?? null,
      workspaceId: snapshot.workspaceId ?? null,
      hypothesis: snapshot.hypothesis ?? null,
      objective: snapshot.objective ?? null,
      status: snapshot.status ?? null,
      sessionsCount: countItems(snapshot.sessions),
      comparisonsCount: countItems(snapshot.comparisons),
      evidenceCount: countItems(snapshot.evidence),
      createdAt: snapshot.createdAt ?? null,
      updatedAt: snapshot.updatedAt ?? null,
      timestamps: freezeObject(snapshot.timestamps),
      title: snapshot.objective ?? snapshot.hypothesis ?? snapshot.experimentId ?? snapshot.id ?? null,
    });
  }

  if (kind === 'session') {
    return freezeObject({
      itemId: snapshot.sessionId ?? snapshot.id ?? null,
      itemKind: 'session',
      sessionId: snapshot.sessionId ?? snapshot.id ?? null,
      status: snapshot.status ?? null,
      executionMode: snapshot.executionMode ?? null,
      modulesCount: countItems(snapshot.modules),
      stepsCount: countItems(snapshot.executionPlan),
      createdAt: snapshot.timestamps?.createdAt ?? null,
      updatedAt: snapshot.timestamps?.updatedAt ?? null,
      timestamps: freezeObject(snapshot.timestamps),
      title: snapshot.sessionId ?? snapshot.id ?? null,
    });
  }

  if (kind === 'comparison') {
    return freezeObject({
      itemId: snapshot.comparisonId ?? snapshot.id ?? null,
      itemKind: 'comparison',
      comparisonId: snapshot.comparisonId ?? snapshot.id ?? null,
      comparisonType: snapshot.comparisonType ?? null,
      criteriaCount: countItems(snapshot.criteria),
      metricKeys: Object.keys(snapshot.metrics ?? {}),
      differenceKeys: Object.keys(snapshot.differences ?? {}),
      sessionIds: (snapshot.sessions ?? [])
        .map((session) => session?.sessionId ?? session?.id ?? null)
        .filter(Boolean),
      timestamps: freezeObject(snapshot.timestamps),
      title: snapshot.comparisonId ?? snapshot.id ?? null,
    });
  }

  return freezeObject({
    itemId: snapshot.id ?? snapshot.itemId ?? null,
    itemKind: kind ?? snapshot.kind ?? null,
    label: snapshot.label ?? snapshot.title ?? snapshot.name ?? snapshot.id ?? null,
    summary: freezeObject(snapshot.summary),
  });
}

function summarizeComparisonSelection(selection = {}) {
  const selectedItems = freezeList((selection.selectedItems ?? []).map((item) => normalizeComparisonSelectionItem(item)).filter(Boolean));
  const kinds = [...new Set(selectedItems.map((item) => item.itemKind).filter(Boolean))];
  return freezeObject({
    mode: selection.mode ?? null,
    status: selection.status ?? (selectedItems.length === 0 ? 'insufficient-selection' : kinds.length > 1 ? 'incompatible-selection' : selectedItems.length < 2 ? 'insufficient-selection' : 'ready'),
    selectedCount: selectedItems.length,
    selectedKinds: freezeList(kinds),
    canCompare: selectedItems.length >= 2 && kinds.length <= 1,
    selectedItems,
  });
}

function summarizeComparisonMetrics(comparison) {
  if (!comparison) return null;
  const snapshot = serialize(comparison);
  const comparatorMetrics = snapshot.metrics?.comparator?.differences ?? snapshot.comparatorMetrics ?? snapshot.metricKeys ?? [];
  const aggregateMetrics = snapshot.metrics?.aggregate?.metrics ?? snapshot.aggregateMetrics ?? snapshot.metrics?.aggregate ?? snapshot.aggregate ?? null;
  const metricKeys = snapshot.metricKeys ?? Object.keys(snapshot.metrics ?? {});
  const differenceKeys = snapshot.differenceKeys ?? Object.keys(snapshot.differences ?? {});

  return freezeObject({
    comparator: freezeObject(snapshot.metrics?.comparator ?? snapshot.comparator ?? null),
    aggregate: freezeObject(snapshot.metrics?.aggregate ?? snapshot.aggregate ?? null),
    decision: freezeObject(snapshot.metrics?.decision ?? snapshot.decision ?? null),
    comparatorMetrics: freezeList(comparatorMetrics),
    aggregateMetrics: freezeObject(aggregateMetrics),
    metricKeys: freezeList(metricKeys),
    differenceKeys: freezeList(differenceKeys),
  });
}

function summarizeComparisonSummary(comparison, selection) {
  const criteria = freezeList(comparison?.criteria);
  const selectedCount = selection?.selectedCount ?? 0;
  const selectedKinds = freezeList(selection?.selectedKinds);
  const comparableCount = comparison ? countItems(comparison.sessions) : selectedCount;
  const totalCriteria = comparison?.criteriaCount ?? criteria.length;
  const satisfiedCriteria = criteria.length > 0 ? criteria.filter((criterion) => criterion?.satisfied !== false).length : Math.max(totalCriteria - countItems(comparison?.differenceKeys), 0);
  const differenceCount = criteria.length > 0 ? criteria.filter((criterion) => criterion?.satisfied === false).length : countItems(comparison?.differenceKeys);

  return freezeObject({
    comparableCount,
    selectedCount,
    selectedKinds,
    totalCriteria,
    differenceCount,
    similarityCount: criteria.length > 0 ? satisfiedCriteria : Math.max(totalCriteria - differenceCount, 0),
    state: selection?.status ?? (comparison ? 'ready' : 'insufficient-selection'),
  });
}

function summarizeEvidence(evidence) {
  if (!evidence) return null;
  const snapshot = serialize(evidence);
  return freezeObject({
    reportId: snapshot.reportId ?? snapshot.id ?? null,
    title: snapshot.title ?? null,
    comparisonsCount: snapshot.comparisonsCount ?? countItems(snapshot.comparisons),
    sessionsCount: snapshot.sessionsCount ?? countItems(snapshot.sessions),
    resultsCount: snapshot.resultsCount ?? countItems(snapshot.results),
    observationsCount: snapshot.observationsCount ?? countItems(snapshot.observations),
    generatedAt: snapshot.generatedAt ?? snapshot.timestamps?.generatedAt ?? null,
  });
}

function summarizeEvidenceSelection(snapshot = {}) {
  return freezeObject({
    selectedReportId: snapshot.selectedReportId ?? null,
    searchQuery: snapshot.searchQuery ?? '',
    activeFilter: snapshot.activeFilter ?? 'all',
    status: snapshot.status ?? 'idle',
  });
}

function summarizeReplaySelection(snapshot = {}) {
  return freezeObject({
    selectedReplayId: snapshot.selectedReplayId ?? null,
    selectedEventId: snapshot.selectedEventId ?? null,
    playbackState: snapshot.playbackState ?? 'paused',
    currentStep: snapshot.currentStep ?? 0,
    totalSteps: snapshot.totalSteps ?? 0,
    speed: snapshot.speed ?? 1,
    loop: Boolean(snapshot.loop),
    status: snapshot.status ?? 'idle',
  });
}

function summarizeResearchSelection(snapshot = {}) {
  return freezeObject({
    query: snapshot.query ?? '',
    scope: freezeObject(snapshot.scope),
    selectedEventIds: freezeList(snapshot.selectedEventIds ?? []),
    selectedEvidenceIds: freezeList(snapshot.selectedEvidenceIds ?? []),
    selectedComparisonId: snapshot.selectedComparisonId ?? null,
    selectedReplayId: snapshot.selectedReplayId ?? null,
    status: snapshot.status ?? 'idle',
    providerId: snapshot.providerId ?? null,
  });
}

function summarizeTimelineSelection(snapshot = {}) {
  return freezeObject({
    selectedReplayId: snapshot.selectedReplayId ?? null,
    selectedEventId: snapshot.selectedEventId ?? null,
    searchQuery: snapshot.searchQuery ?? '',
    activeFilter: snapshot.activeFilter ?? 'all',
    status: snapshot.status ?? 'idle',
  });
}

function summarizeEvent(event) {
  if (!event) return null;
  const snapshot = serialize(event);
  return freezeObject({
    type: snapshot.type ?? null,
    occurredAt: snapshot.occurredAt ?? null,
    metadata: freezeObject(snapshot.metadata),
  });
}

function toList(items, mapper) {
  return freezeList((items ?? []).map(mapper).filter(Boolean));
}

function tail(list, limit = 3) {
  return Array.isArray(list) ? list.slice(-limit) : [];
}

export class LaboratoryBindingLayer {
  constructor(options = {}) {
    this.orchestrator = options.orchestrator ?? null;
    this.clock = typeof options.clock === 'function' ? options.clock : () => new Date().toISOString();
    this.state = Object.freeze({
      activeViewId: options.activeViewId ?? 'overview',
      status: options.status ?? 'ready',
      lastSyncAt: this.clock(),
      lastOperation: null,
      lastError: null,
      lastEvent: null,
    });
    this.cache = {
      workspace: null,
      experiment: null,
      session: null,
      sessionResult: null,
      comparison: null,
      comparisonSelection: { mode: null, selectedItems: [] },
      evidence: null,
      evidenceSelection: { selectedReportId: null, searchQuery: '', activeFilter: 'all', status: 'idle' },
      timelineSelection: { selectedReplayId: null, selectedEventId: null, searchQuery: '', activeFilter: 'all', status: 'idle' },
      replaySelection: { selectedReplayId: null, selectedEventId: null, playbackState: 'paused', currentStep: 0, totalSteps: 0, speed: 1, loop: false, status: 'idle' },
      researchSelection: {
        query: '',
        scope: { kind: 'current-experiment', label: 'Current experiment' },
        selectedEventIds: [],
        selectedEvidenceIds: [],
        selectedComparisonId: null,
        selectedReplayId: null,
        providerId: 'local-research-provider',
        status: 'idle',
      },
      researchState: {
        context: null,
        response: null,
        executionError: null,
        isContextTruncated: false,
        validationErrors: [],
        lastExecutedAt: null,
        status: 'idle',
      },
      recentExperiments: [],
      recentSessions: [],
      recentComparisons: [],
      recentEvidence: [],
      recentEvents: [],
      lastCommandResult: null,
    };
  }

  setActiveView(viewId) {
    if (typeof viewId !== 'string' || !viewId) return;
    this.state = Object.freeze({
      ...this.state,
      activeViewId: viewId,
      lastSyncAt: this.clock(),
    });
  }

  getState() {
    return this.state;
  }

  getSnapshot() {
    return freezeObject({
      state: this.getState(),
      workspace: summarizeWorkspace(this.cache.workspace),
      experiment: summarizeExperiment(this.cache.experiment),
      session: summarizeSession(this.cache.session),
      sessionResult: summarizeSessionResult(this.cache.sessionResult),
      comparison: summarizeComparison(this.cache.comparison),
      comparisonSelection: summarizeComparisonSelection(this.cache.comparisonSelection),
      evidence: summarizeEvidence(this.cache.evidence),
      evidenceSelection: summarizeEvidenceSelection(this.cache.evidenceSelection),
      timelineSelection: summarizeTimelineSelection(this.cache.timelineSelection),
      replaySelection: summarizeReplaySelection(this.cache.replaySelection),
      researchSelection: summarizeResearchSelection(this.cache.researchSelection),
      researchState: freezeObject({
        ...serialize(this.cache.researchState),
        context: serialize(this.cache.researchState?.context),
        response: serialize(this.cache.researchState?.response),
      }),
      recentExperiments: toList(this.cache.recentExperiments, summarizeExperiment),
      recentSessions: toList(this.cache.recentSessions, summarizeSession),
      recentComparisons: toList(this.cache.recentComparisons, summarizeComparison),
      recentEvidence: toList(this.cache.recentEvidence, summarizeEvidence),
      recentEvents: toList(this.cache.recentEvents, summarizeEvent),
      lastCommandResult: serialize(this.cache.lastCommandResult),
    });
  }
  getCommands() {
    return freezeList([
      'createExperiment',
      'startExperiment',
      'executeSession',
      'executeSessions',
      'compareResults',
      'generateEvidence',
      'executeResearch',
      'updateExperiment',
      'finishExperiment',
    ]);
  }

  attachOrchestrator(orchestrator) {
    this.orchestrator = orchestrator ?? null;
    return this;
  }

  getViewModel(viewId = this.state.activeViewId) {
    const snapshot = this.getSnapshot();
    switch (viewId) {
      case 'experiments':
        return this.buildExperimentsViewModel(snapshot);
      case 'sessions':
        return this.buildSessionsViewModel(snapshot);
      case 'comparison':
        return this.buildComparisonViewModel(snapshot);
      case 'evidence':
        return this.buildEvidenceViewModel(snapshot);
      case 'replay':
        return this.buildReplayViewModel(snapshot);
      case 'timeline':
        return this.buildTimelineViewModel(snapshot);
      case 'ai-research':
        return this.buildAiResearchViewModel(snapshot);
      case 'settings':
        return this.buildSettingsViewModel(snapshot);
      case 'overview':
      default:
        return this.buildOverviewViewModel(snapshot);
    }
  }

  buildOverviewViewModel(snapshot) {
    return freezeObject({
      viewId: 'overview',
      title: 'Overview',
      subtitle: 'Resumen de la actividad expuesta por LaboratoryOrchestrator',
      status: snapshot.state.status,
      activeViewId: snapshot.state.activeViewId,
      kpis: freezeList([
        { id: 'workspace', label: 'Workspace', value: snapshot.workspace?.workspaceId ?? '—' },
        { id: 'experiment', label: 'Experiment', value: snapshot.experiment?.experimentId ?? '—' },
        { id: 'session', label: 'Session', value: snapshot.session?.sessionId ?? '—' },
        { id: 'comparison', label: 'Comparison', value: snapshot.comparison?.comparisonId ?? '—' },
        { id: 'evidence', label: 'Evidence', value: snapshot.evidence?.reportId ?? '—' },
      ]),
      recentActivity: freezeList([
        snapshot.experiment ? { kind: 'experiment', summary: snapshot.experiment } : null,
        snapshot.session ? { kind: 'session', summary: snapshot.session } : null,
        snapshot.comparison ? { kind: 'comparison', summary: snapshot.comparison } : null,
        snapshot.evidence ? { kind: 'evidence', summary: snapshot.evidence } : null,
      ].filter(Boolean)),
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  buildExperimentsViewModel(snapshot) {
    return freezeObject({
      viewId: 'experiments',
      title: 'Experiments',
      subtitle: 'Sesiones de experimentación y ciclo de vida expuestos por la capa de aplicación',
      activeViewId: snapshot.state.activeViewId,
      workspace: snapshot.workspace,
      activeExperiment: snapshot.experiment,
      experiments: freezeList([
        snapshot.experiment,
        ...snapshot.recentExperiments.filter((item) => item?.experimentId !== snapshot.experiment?.experimentId),
      ].filter(Boolean)),
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  buildSessionsViewModel(snapshot) {
    return freezeObject({
      viewId: 'sessions',
      title: 'Sessions',
      subtitle: 'Timeline de ejecuciones y resultados de sesión',
      activeViewId: snapshot.state.activeViewId,
      session: snapshot.session,
      sessionResult: snapshot.sessionResult,
      sessions: freezeList([
        snapshot.session,
        ...snapshot.recentSessions.filter((item) => item?.sessionId !== snapshot.session?.sessionId),
      ].filter(Boolean)),
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  buildTimelineViewModel(snapshot) {
    const selection = snapshot.timelineSelection ?? summarizeTimelineSelection(this.cache.timelineSelection);
    const selectedReplay = this.getReplaySources(snapshot).find((item) => item.replayId === selection.selectedReplayId)
      ?? this.getReplaySources(snapshot).find((item) => item.source === 'events')
      ?? this.getReplaySources(snapshot)[0]
      ?? null;
    const rawEvents = tail(this.cache.recentEvents, 20);
    const events = this.getReplayTimeline(snapshot, selectedReplay, rawEvents);
    const activeFilter = String(selection.activeFilter ?? 'all').trim() || 'all';
    const searchQuery = String(selection.searchQuery ?? '').trim();
    const normalizedSearch = searchQuery.toLowerCase();
    const filteredEvents = events.filter((event) => {
      const matchesFilter = activeFilter === 'all'
        || event.type === activeFilter
        || event.references?.[activeFilter]
        || event.metadata?.operation === activeFilter;
      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;
      const haystack = JSON.stringify({
        eventId: event.eventId,
        type: event.type,
        label: event.label,
        metadata: event.metadata,
        payload: event.payload,
        references: event.references,
      }).toLowerCase();
      return haystack.includes(normalizedSearch);
    });
    const selectedEventId = selection.selectedEventId
      ?? filteredEvents[filteredEvents.length - 1]?.eventId
      ?? events[events.length - 1]?.eventId
      ?? null;
    const selectedEvent = filteredEvents.find((item) => item.eventId === selectedEventId)
      ?? events.find((item) => item.eventId === selectedEventId)
      ?? filteredEvents[filteredEvents.length - 1]
      ?? events[events.length - 1]
      ?? null;
    const typeCounts = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] ?? 0) + 1;
      return acc;
    }, {});

    return freezeObject({
      viewId: 'timeline',
      title: 'Timeline',
      subtitle: 'Secuencia normalizada de eventos, filtros y referencias cruzadas',
      activeViewId: snapshot.state.activeViewId,
      source: selectedReplay?.source ?? 'events',
      replayId: selectedReplay?.replayId ?? 'replay-events',
      events: filteredEvents,
      allEvents: events,
      selectedEvent,
      currentStep: selectedEvent?.step ?? 0,
      totalSteps: filteredEvents.length,
      filters: freezeObject({
        searchQuery,
        activeFilter,
        status: selection.status ?? (filteredEvents.length > 0 ? 'ready' : 'empty'),
      }),
      statistics: freezeObject({
        eventCount: events.length,
        filteredCount: filteredEvents.length,
        lastEventType: events[events.length - 1]?.type ?? null,
        typeCounts: freezeObject(typeCounts),
      }),
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  buildComparisonViewModel(snapshot) {
    const comparison = snapshot.comparison;
    const selection = snapshot.comparisonSelection;
    const comparisonStatus = snapshot.state.status === 'loading'
      ? 'loading'
      : snapshot.state.status === 'error'
        ? 'error'
        : selection.status === 'incompatible-selection'
          ? 'incompatible-selection'
          : selection.status === 'insufficient-selection' && !comparison
            ? 'insufficient-selection'
            : snapshot.state.status ?? (comparison ? 'ready' : selection.status);

    const experiments = toList([
      this.cache.experiment,
      ...this.cache.recentExperiments.filter((item) => item?.experimentId !== this.cache.experiment?.experimentId),
    ], (item) => summarizeComparisonCandidate(item, 'experiment'));

    const sessions = toList([
      this.cache.session,
      ...this.cache.recentSessions.filter((item) => item?.sessionId !== this.cache.session?.sessionId),
    ], (item) => summarizeComparisonCandidate(item, 'session'));

    const comparisons = toList([
      this.cache.comparison,
      ...this.cache.recentComparisons.filter((item) => item?.comparisonId !== this.cache.comparison?.comparisonId),
    ], (item) => summarizeComparisonCandidate(item, 'comparison'));

    return freezeObject({
      viewId: 'comparison',
      title: 'Comparison',
      subtitle: 'Comparaciones y diferencias normalizadas por el binding layer',
      activeViewId: snapshot.state.activeViewId,
      status: comparisonStatus,
      lastError: snapshot.state.lastError,
      loading: comparisonStatus === 'loading',
      comparison,
      items: comparisons,
      comparisons,
      experiments,
      sessions,
      selection,
      metrics: summarizeComparisonMetrics(this.cache.comparison),
      summary: summarizeComparisonSummary(this.cache.comparison, selection),
      timelineSummary: this.buildTimelineViewModel(snapshot).statistics,
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  buildEvidenceViewModel(snapshot) {
    const selection = summarizeEvidenceSelection(this.cache.evidenceSelection);
    const reports = freezeList([
      snapshot.evidence,
      ...snapshot.recentEvidence.filter((item) => item?.reportId !== snapshot.evidence?.reportId),
    ].filter(Boolean));
    const normalizedQuery = selection.searchQuery.trim().toLowerCase();
    const filterId = selection.activeFilter ?? 'all';
    const matchesFilter = (report) => {
      if (filterId === 'all') return true;
      if (filterId === 'comparisons') return (report.comparisonsCount ?? 0) > 0;
      if (filterId === 'sessions') return (report.sessionsCount ?? 0) > 0;
      if (filterId === 'results') return (report.resultsCount ?? 0) > 0;
      if (filterId === 'observations') return (report.observationsCount ?? 0) > 0;
      return true;
    };
    const visibleReports = freezeList(reports.filter((report) => {
      const haystack = `${report.reportId ?? ''} ${report.title ?? ''}`.toLowerCase();
      return (!normalizedQuery || haystack.includes(normalizedQuery)) && matchesFilter(report);
    }));
    const selectedReport = visibleReports.find((report) => report.reportId === selection.selectedReportId)
      ?? visibleReports[0]
      ?? reports[0]
      ?? null;

    return freezeObject({
      viewId: 'evidence',
      title: 'Evidence',
      subtitle: 'Evidencia, trazabilidad y reproducibilidad encapsuladas',
      activeViewId: snapshot.state.activeViewId,
      evidence: snapshot.evidence,
      reports,
      visibleReports,
      selection: freezeObject({
        ...selection,
        selectedCount: visibleReports.length,
        totalCount: reports.length,
        hasSelection: Boolean(selectedReport),
      }),
      selectedReport,
      summary: freezeObject({
        reportCount: reports.length,
        visibleCount: visibleReports.length,
        generatedCount: countItems(reports.map((report) => report.generatedAt).filter(Boolean)),
      }),
      timelineSummary: this.buildTimelineViewModel(snapshot).statistics,
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  buildReplayViewModel(snapshot) {
    const replaySelection = summarizeReplaySelection(this.cache.replaySelection);
    const selectedReplay = this.getReplaySources(snapshot).find((item) => item.replayId === replaySelection.selectedReplayId)
      ?? this.getReplaySources(snapshot).find((item) => item.source === 'events')
      ?? this.getReplaySources(snapshot)[0]
      ?? null;
    const timelineModel = this.buildTimelineViewModel(snapshot);
    const timeline = timelineModel.events;
    const selectedEvent = timeline.find((item) => item.eventId === replaySelection.selectedEventId)
      ?? timelineModel.selectedEvent
      ?? timeline[Math.max(0, timeline.length - 1)]
      ?? null;
    const currentStep = selectedEvent?.step ?? (timeline.length > 0 ? 1 : 0);
    const resolvedPlaybackState = timeline.length === 0
      ? 'empty'
      : replaySelection.status && replaySelection.status !== 'idle'
        ? replaySelection.status
        : replaySelection.playbackState === 'playing'
          ? 'playing'
          : replaySelection.playbackState === 'paused'
            ? 'paused'
            : 'ready';
    const relatedSession = this.findReplayReference(selectedEvent, snapshot.session, 'sessionId');
    const relatedExperiment = this.findReplayReference(selectedEvent, snapshot.experiment, 'experimentId');
    const relatedComparison = this.findReplayReference(selectedEvent, snapshot.comparison, 'comparisonId');
    const relatedEvidence = this.findReplayReference(selectedEvent, snapshot.evidence, 'reportId');

    return freezeObject({
      viewId: 'replay',
      title: 'Replay',
      subtitle: 'Revisión cronológica de eventos reales expuestos por Application',
      activeViewId: snapshot.state.activeViewId,
      replayId: selectedReplay?.replayId ?? 'replay-events',
      source: selectedReplay?.source ?? 'events',
      timeline: timelineModel,
      timestamp: selectedEvent?.occurredAt ?? snapshot.state.lastSyncAt,
      currentStep,
      totalSteps: timeline.length,
      playbackState: resolvedPlaybackState,
      selectedEvent,
      metadata: freezeObject({
        eventCount: timeline.length,
        sourceCount: this.getReplaySources(snapshot).length,
        lastEventType: timeline[timeline.length - 1]?.type ?? null,
      }),
      timeline,
      replays: freezeList(this.getReplaySources(snapshot)),
      related: freezeObject({
        experiment: relatedExperiment,
        session: relatedSession,
        comparison: relatedComparison,
        evidence: relatedEvidence,
      }),
      controls: freezeObject({
        canPlay: timeline.length > 0,
        canPause: timeline.length > 0,
        canStop: timeline.length > 0,
        canStepForward: currentStep < timeline.length,
        canStepBackward: currentStep > 1,
        canSeek: timeline.length > 0,
      }),
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  getReplaySources(snapshot) {
    const sources = [];
    if (snapshot.session) {
      sources.push({
        replayId: snapshot.session.sessionId ?? 'session-replay',
        source: 'session',
        label: snapshot.session.sessionId ?? 'Current session',
        timestamp: snapshot.session.completedAt ?? snapshot.session.startedAt ?? null,
      });
    }
    if (snapshot.experiment) {
      sources.push({
        replayId: snapshot.experiment.experimentId ?? 'experiment-replay',
        source: 'experiment',
        label: snapshot.experiment.experimentId ?? 'Current experiment',
        timestamp: snapshot.experiment.updatedAt ?? snapshot.experiment.startedAt ?? null,
      });
    }
    if (snapshot.comparison) {
      sources.push({
        replayId: snapshot.comparison.comparisonId ?? 'comparison-replay',
        source: 'comparison',
        label: snapshot.comparison.comparisonId ?? 'Current comparison',
        timestamp: snapshot.comparison.generatedAt ?? null,
      });
    }
    if (snapshot.evidence) {
      sources.push({
        replayId: snapshot.evidence.reportId ?? 'evidence-replay',
        source: 'evidence',
        label: snapshot.evidence.reportId ?? 'Current evidence',
        timestamp: snapshot.evidence.generatedAt ?? null,
      });
    }
    if (!sources.length) {
      sources.push({
        replayId: 'replay-events',
        source: 'events',
        label: 'Recent event stream',
        timestamp: this.cache.recentEvents.at?.(-1)?.occurredAt ?? null,
      });
    }
    return freezeList(sources);
  }

  getReplayTimeline(snapshot, selectedReplay = null, rawEvents = []) {
    const selectedSource = selectedReplay?.source ?? 'events';
    const referenceId = selectedReplay?.replayId ?? null;
    const matchesSource = (event) => {
      if (!referenceId || selectedSource === 'events') return true;
      const serialized = JSON.stringify(serialize(event)).toLowerCase();
      return serialized.includes(String(referenceId).toLowerCase());
    };

    return freezeList(rawEvents.filter(matchesSource).map((event, index) => {
      const snapshotEvent = serialize(event);
      const type = snapshotEvent.type ?? 'event';
      const occurredAt = snapshotEvent.occurredAt ?? null;
      const payload = serialize(snapshotEvent.payload ?? {});
      const metadata = freezeObject(snapshotEvent.metadata);
      const eventId = snapshotEvent.eventId ?? `${type}-${index + 1}`;
      const references = freezeObject({
        experiment: this.findReplayReference({ payload, metadata }, snapshot.experiment, 'experimentId'),
        session: this.findReplayReference({ payload, metadata }, snapshot.session, 'sessionId'),
        comparison: this.findReplayReference({ payload, metadata }, snapshot.comparison, 'comparisonId'),
        evidence: this.findReplayReference({ payload, metadata }, snapshot.evidence, 'reportId'),
      });
      return freezeObject({
        eventId,
        step: index + 1,
        type,
        label: this.labelReplayEvent(type, payload, metadata),
        occurredAt,
        metadata,
        payload: freezeObject(payload),
        references,
      });
    }));
  }

  labelReplayEvent(type, payload, metadata) {
    const lower = String(type ?? '').toLowerCase();
    if (lower.includes('session')) return 'Session event';
    if (lower.includes('experiment')) return 'Experiment event';
    if (lower.includes('comparison')) return 'Comparison event';
    if (lower.includes('evidence') || lower.includes('report')) return 'Evidence event';
    const detail = metadata?.operation ?? payload?.operation ?? payload?.action ?? null;
    return detail ? `${type} · ${detail}` : type ?? 'event';
  }

  findReplayReference(event, reference, key) {
    if (!event || !reference || !key) return null;
    const referenceId = reference?.[key] ?? null;
    if (!referenceId) return null;
    const haystack = JSON.stringify(serialize(event)).toLowerCase();
    return haystack.includes(String(referenceId).toLowerCase()) ? reference : null;
  }

  buildAiResearchViewModel(snapshot) {
    const researchSelection = summarizeResearchSelection(this.cache.researchSelection);
    const researchState = freezeObject({
      ...serialize(this.cache.researchState),
      context: serialize(this.cache.researchState?.context),
      response: serialize(this.cache.researchState?.response),
    });
    const context = researchState.context ?? this.buildResearchContext(snapshot);
    const timeline = this.buildTimelineViewModel(snapshot);
    const evidence = this.buildEvidenceViewModel(snapshot);
    const comparison = this.buildComparisonViewModel(snapshot);
    const replay = this.buildReplayViewModel(snapshot);
    const activeSelections = freezeList([
      researchSelection.selectedReplayId ? { kind: 'replay', id: researchSelection.selectedReplayId } : null,
      researchSelection.selectedComparisonId ? { kind: 'comparison', id: researchSelection.selectedComparisonId } : null,
      ...researchSelection.selectedEvidenceIds.map((id) => ({ kind: 'evidence', id })),
      ...researchSelection.selectedEventIds.map((id) => ({ kind: 'event', id })),
    ].filter(Boolean));

    return freezeObject({
      viewId: 'ai-research',
      title: 'AI Research',
      subtitle: 'Context builder, provider adapter y borrador asistido sobre vistas del laboratorio',
      activeViewId: snapshot.state.activeViewId,
      status: snapshot.state.status,
      query: researchSelection.query,
      scope: researchSelection.scope,
      researchSelection,
      researchState,
      response: researchState.response ?? null,
      provider: freezeObject({
        providerId: researchSelection.providerId ?? 'local-research-provider',
        mode: 'deterministic-local',
        label: 'Local research provider',
      }),
      activeSelections,
      context,
      contextPreview: context?.preview ?? null,
      validationErrors: freezeList(researchState.validationErrors ?? []),
      executionError: researchState.executionError ?? null,
      isContextTruncated: Boolean(researchState.isContextTruncated),
      canExecute: Boolean((researchSelection.query ?? '').trim()) && !(researchState.validationErrors ?? []).length,
      canCancel: researchState.status === 'running',
      contextSources: freezeObject({
        timeline: timeline.statistics,
        evidence: evidence.summary,
        comparison: comparison.summary,
        replay: replay.summary,
      }),
      prompts: freezeList([
        'Summarize the current laboratory situation using only view models.',
        'Explain what should be inspected next and why.',
        'Produce a short safe draft with traceable references.',
      ]),
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  buildResearchContext(snapshot) {
    const researchSelection = summarizeResearchSelection(this.cache.researchSelection);
    const timeline = this.buildTimelineViewModel(snapshot);
    const evidence = this.buildEvidenceViewModel(snapshot);
    const comparison = this.buildComparisonViewModel(snapshot);
    const replay = this.buildReplayViewModel(snapshot);
    const sections = freezeList([
      {
        id: 'timeline',
        label: 'Timeline',
        summary: `${timeline.statistics.eventCount} events, ${timeline.statistics.filteredCount} visible, last ${timeline.statistics.lastEventType ?? 'n/a'}`,
        items: freezeList((timeline.events ?? []).slice(0, 4).map((event) => ({
          id: event.eventId ?? null,
          label: event.type ?? event.eventId ?? 'event',
          detail: event.occurredAt ?? null,
        })).filter((item) => item.id)),
      },
      {
        id: 'evidence',
        label: 'Evidence',
        summary: `${evidence.summary.reportCount} reports, ${evidence.summary.visibleCount} visible`,
        items: freezeList((evidence.visibleReports ?? []).slice(0, 4).map((report) => ({
          id: report.reportId ?? null,
          label: report.title ?? report.reportId ?? 'report',
          detail: report.generatedAt ?? null,
        })).filter((item) => item.id)),
      },
      {
        id: 'comparison',
        label: 'Comparison',
        summary: `${comparison.summary.comparisonCount} comparisons, status ${comparison.status}`,
        items: freezeList((comparison.comparisons ?? []).slice(0, 4).map((item) => ({
          id: item.comparisonId ?? null,
          label: item.label ?? item.comparisonId ?? 'comparison',
          detail: item.updatedAt ?? item.generatedAt ?? null,
        })).filter((item) => item.id)),
      },
      {
        id: 'replay',
        label: 'Replay',
        summary: `${replay.metadata.eventCount} replay events, state ${replay.playbackState}`,
        items: freezeList((replay.timeline ?? []).slice(0, 4).map((event) => ({
          id: event.eventId ?? null,
          label: event.type ?? event.eventId ?? 'step',
          detail: event.occurredAt ?? null,
        })).filter((item) => item.id)),
      },
    ]);
    const preview = sections.map((section) => `${section.label}: ${section.summary}`).join(' | ');
    const truncated = preview.length > 480;

    return freezeObject({
      generatedAt: this.clock(),
      scope: researchSelection.scope,
      query: researchSelection.query,
      selections: freezeObject({
        eventIds: researchSelection.selectedEventIds,
        evidenceIds: researchSelection.selectedEvidenceIds,
        comparisonId: researchSelection.selectedComparisonId,
        replayId: researchSelection.selectedReplayId,
      }),
      sections,
      preview: truncated ? `${preview.slice(0, 477)}…` : preview,
      totals: freezeObject({
        timelineEvents: timeline.statistics.eventCount,
        evidenceReports: evidence.summary.reportCount,
        comparisons: comparison.summary.comparisonCount,
        replayEvents: replay.metadata.eventCount,
      }),
      truncated,
    });
  }

  buildSettingsViewModel(snapshot) {
    return freezeObject({
      viewId: 'settings',
      title: 'Settings',
      subtitle: 'Estado del binding y opciones de presentación',
      activeViewId: snapshot.state.activeViewId,
      preferences: freezeObject({
        activeViewId: snapshot.state.activeViewId,
        status: snapshot.state.status,
        lastSyncAt: snapshot.state.lastSyncAt,
        commandCount: this.getCommands().length,
      }),
      commands: this.getCommands(),
      lastCommandResult: snapshot.lastCommandResult,
    });
  }

  updateReplaySelection(patch = {}) {
    this.cache.replaySelection = {
      ...(this.cache.replaySelection ?? {}),
      ...patch,
    };
    this.state = Object.freeze({
      ...this.state,
      lastSyncAt: this.clock(),
    });
    return summarizeReplaySelection(this.cache.replaySelection);
  }

  loadReplay(replayId = null) {
    const sources = this.getReplaySources(this.getSnapshot());
    const nextReplayId = replayId ?? this.cache.replaySelection?.selectedReplayId ?? sources.find((item) => item.source === 'events')?.replayId ?? sources[0]?.replayId ?? null;
    return this.updateReplaySelection({
      selectedReplayId: nextReplayId,
      selectedEventId: null,
      playbackState: 'ready',
      status: sources.length ? 'ready' : 'empty',
    });
  }

  refreshReplay() {
    const snapshot = this.getSnapshot();
    const sources = this.getReplaySources(snapshot);
    const current = summarizeReplaySelection(this.cache.replaySelection);
    const nextReplayId = current.selectedReplayId ?? sources.find((item) => item.source === 'events')?.replayId ?? sources[0]?.replayId ?? null;
    return this.updateReplaySelection({
      selectedReplayId: nextReplayId,
      status: sources.length ? current.status : 'empty',
    });
  }

  selectReplay(replayId) {
    return this.loadReplay(replayId);
  }

  updateResearchSelection(patch = {}) {
    const current = summarizeResearchSelection(this.cache.researchSelection);
    const nextScope = patch.scope
      ? {
          kind: patch.scope.kind ?? current.scope?.kind ?? 'current-experiment',
          label: patch.scope.label ?? current.scope?.label ?? 'Current experiment',
        }
      : current.scope;

    this.cache.researchSelection = {
      ...(this.cache.researchSelection ?? {}),
      ...patch,
      scope: nextScope,
    };
    this.cache.researchState = {
      ...(this.cache.researchState ?? {}),
      status: patch.status ?? this.cache.researchState?.status ?? 'idle',
      validationErrors: patch.validationErrors ?? this.cache.researchState?.validationErrors ?? [],
      executionError: patch.executionError ?? this.cache.researchState?.executionError ?? null,
      isContextTruncated: patch.isContextTruncated ?? this.cache.researchState?.isContextTruncated ?? false,
      context: patch.context ?? this.cache.researchState?.context ?? null,
      response: patch.response ?? this.cache.researchState?.response ?? null,
      lastExecutedAt: patch.lastExecutedAt ?? this.cache.researchState?.lastExecutedAt ?? null,
    };
    this.state = Object.freeze({
      ...this.state,
      lastSyncAt: this.clock(),
    });
    return summarizeResearchSelection(this.cache.researchSelection);
  }

  selectResearchItem(item, itemKind = null) {
    const itemId = typeof item === 'string' ? item : item?.id ?? item?.itemId ?? item?.reportId ?? item?.eventId ?? item?.comparisonId ?? item?.replayId ?? null;
    const kind = String(itemKind ?? item?.itemKind ?? item?.kind ?? '').trim().toLowerCase();
    if (!itemId && kind !== 'scope') return this.getViewModel('ai-research');

    const current = summarizeResearchSelection(this.cache.researchSelection);
    const selectedEventIds = [...current.selectedEventIds];
    const selectedEvidenceIds = [...current.selectedEvidenceIds];
    const toggle = (list, value) => {
      const index = list.indexOf(value);
      if (index >= 0) list.splice(index, 1);
      else list.push(value);
    };

    if (kind === 'scope') {
      const scopeKinds = {
        'ai-scope-current': { kind: 'current-experiment', label: 'Current experiment' },
        'ai-scope-session': { kind: 'selected-session', label: 'Selected session' },
        'ai-scope-comparison': { kind: 'comparison-window', label: 'Comparison window' },
      };
      const scope = typeof item === 'object' && item !== null
        ? { kind: item.scopeKind ?? item.scopeId ?? itemId, label: item.label ?? item.title ?? String(itemId) }
        : (scopeKinds[itemId] ?? { kind: itemId, label: String(itemId).replace(/-/g, ' ').replace(/^./, (char) => char.toUpperCase()) });
      this.updateResearchSelection({ scope, status: 'ready' });
    } else if (kind === 'replay') {
      this.updateResearchSelection({ selectedReplayId: itemId, status: 'ready' });
    } else if (kind === 'comparison') {
      this.updateResearchSelection({ selectedComparisonId: itemId, status: 'ready' });
    } else if (kind === 'evidence' || kind === 'report') {
      toggle(selectedEvidenceIds, itemId);
      this.updateResearchSelection({ selectedEvidenceIds, status: 'ready' });
    } else if (kind === 'event' || kind === 'timeline') {
      toggle(selectedEventIds, itemId);
      this.updateResearchSelection({ selectedEventIds, status: 'ready' });
    } else if (kind === 'query' || kind === 'prompt') {
      this.updateResearchSelection({ query: String(itemId), status: 'ready' });
    } else {
      this.updateResearchSelection({ query: String(itemId), status: 'ready' });
    }

    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'selectResearchItem',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('ai-research');
  }

  updateResearchQuery(query) {
    this.updateResearchSelection({ query: String(query ?? ''), status: 'ready' });
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'updateResearchQuery',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('ai-research');
  }

  setResearchScope(scope) {
    const normalizedScope = typeof scope === 'string'
      ? { kind: scope, label: scope.replace(/-/g, ' ').replace(/^./, (char) => char.toUpperCase()) }
      : {
          kind: scope?.kind ?? scope?.scopeId ?? 'current-experiment',
          label: scope?.label ?? scope?.title ?? 'Current experiment',
        };
    this.updateResearchSelection({ scope: normalizedScope, status: 'ready' });
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'setResearchScope',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('ai-research');
  }

  clearResearchSelection(kind = null) {
    const current = summarizeResearchSelection(this.cache.researchSelection);
    const nextSelection = {
      ...current,
      query: kind === 'query' ? '' : current.query,
      scope: kind === 'scope' ? { kind: 'current-experiment', label: 'Current experiment' } : current.scope,
      selectedEventIds: kind && kind !== 'event' ? current.selectedEventIds : [],
      selectedEvidenceIds: kind && kind !== 'evidence' ? current.selectedEvidenceIds : [],
      selectedComparisonId: kind && kind !== 'comparison' ? current.selectedComparisonId : null,
      selectedReplayId: kind && kind !== 'replay' ? current.selectedReplayId : null,
      status: 'idle',
    };
    if (!kind) {
      nextSelection.query = '';
      nextSelection.scope = { kind: 'current-experiment', label: 'Current experiment' };
      nextSelection.selectedEventIds = [];
      nextSelection.selectedEvidenceIds = [];
      nextSelection.selectedComparisonId = null;
      nextSelection.selectedReplayId = null;
    }
    this.cache.researchSelection = nextSelection;
    this.cache.researchState = {
      ...(this.cache.researchState ?? {}),
      status: 'idle',
      validationErrors: [],
      executionError: null,
      isContextTruncated: false,
      context: null,
      response: null,
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'clearResearchSelection',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('ai-research');
  }

  buildResearchContext(snapshot = this.getSnapshot()) {
    const researchSelection = summarizeResearchSelection(this.cache.researchSelection);
    const timeline = this.buildTimelineViewModel(snapshot);
    const evidence = this.buildEvidenceViewModel(snapshot);
    const comparison = this.buildComparisonViewModel(snapshot);
    const replay = this.buildReplayViewModel(snapshot);

    const selectedTimelineEvents = researchSelection.selectedEventIds
      .map((eventId) => (timeline.events ?? []).find((event) => event.eventId === eventId))
      .filter(Boolean)
      .map((event) => freezeObject({
        id: event.eventId,
        label: event.label ?? event.eventId,
        detail: event.metadata?.operation ?? event.metadata?.action ?? event.type ?? 'timeline event',
        kind: 'timeline',
      }));
    const selectedEvidenceReports = researchSelection.selectedEvidenceIds
      .map((reportId) => (evidence.reports ?? []).find((report) => report.reportId === reportId))
      .filter(Boolean)
      .map((report) => freezeObject({
        id: report.reportId,
        label: report.title ?? report.reportId,
        detail: report.summary ?? report.status ?? 'evidence report',
        kind: 'evidence',
      }));
    const selectedComparison = researchSelection.selectedComparisonId
      ? (comparison.comparisons ?? []).find((item) => item.comparisonId === researchSelection.selectedComparisonId) ?? comparison.comparison ?? null
      : comparison.comparison ?? null;
    const selectedReplay = researchSelection.selectedReplayId
      ? (replay.replays ?? []).find((item) => item.replayId === researchSelection.selectedReplayId) ?? replay.replay ?? null
      : replay.replay ?? null;

    const sections = freezeList([
      freezeObject({
        id: 'timeline',
        title: 'Timeline',
        summary: `${timeline.events?.length ?? 0} events available in the current replay/timeline view`,
        items: freezeList(selectedTimelineEvents.length > 0 ? selectedTimelineEvents : (timeline.events ?? []).slice(0, 4).map((event) => freezeObject({
          id: event.eventId,
          label: event.label ?? event.eventId,
          detail: event.metadata?.operation ?? event.metadata?.action ?? event.type ?? 'timeline event',
          kind: 'timeline',
        }))),
      }),
      freezeObject({
        id: 'evidence',
        title: 'Evidence',
        summary: `${evidence.reports?.length ?? 0} evidence reports exposed by the binding`,
        items: freezeList(selectedEvidenceReports.length > 0 ? selectedEvidenceReports : (evidence.reports ?? []).slice(0, 4).map((report) => freezeObject({
          id: report.reportId,
          label: report.title ?? report.reportId,
          detail: report.summary ?? report.status ?? 'evidence report',
          kind: 'evidence',
        }))),
      }),
      freezeObject({
        id: 'comparison',
        title: 'Comparison',
        summary: `${comparison.comparisons?.length ?? 0} comparison snapshots available`,
        items: freezeList(selectedComparison ? [freezeObject({
          id: selectedComparison.comparisonId ?? 'comparison-summary',
          label: selectedComparison.title ?? selectedComparison.comparisonId ?? 'Comparison',
          detail: selectedComparison.summary ?? selectedComparison.label ?? 'comparison snapshot',
          kind: 'comparison',
        })] : (comparison.comparisons ?? []).slice(0, 3).map((item) => freezeObject({
          id: item.comparisonId,
          label: item.title ?? item.comparisonId,
          detail: item.summary ?? item.label ?? 'comparison snapshot',
          kind: 'comparison',
        }))),
      }),
      freezeObject({
        id: 'replay',
        title: 'Replay',
        summary: `${replay.totalSteps ?? replay.timeline?.length ?? 0} replay steps available`,
        items: freezeList(selectedReplay ? [freezeObject({
          id: selectedReplay.replayId ?? 'replay-summary',
          label: selectedReplay.label ?? selectedReplay.replayId ?? 'Replay',
          detail: selectedReplay.summary ?? selectedReplay.source ?? 'replay source',
          kind: 'replay',
        })] : (replay.replays ?? []).slice(0, 3).map((item) => freezeObject({
          id: item.replayId,
          label: item.label ?? item.replayId,
          detail: item.summary ?? item.source ?? 'replay source',
          kind: 'replay',
        }))),
      }),
    ]);

    const previewLines = freezeList(sections.map((section) => `${section.title}: ${section.summary}`));
    const estimatedCharacters = sections.reduce((count, section) => count + section.summary.length + (section.items ?? []).reduce((itemCount, item) => itemCount + String(item.label ?? '').length + String(item.detail ?? '').length, 0), 0) + String(researchSelection.query ?? '').length;

    return freezeObject({
      query: researchSelection.query,
      scope: researchSelection.scope,
      selections: freezeObject({
        selectedEventIds: freezeList(researchSelection.selectedEventIds ?? []),
        selectedEvidenceIds: freezeList(researchSelection.selectedEvidenceIds ?? []),
        selectedComparisonId: researchSelection.selectedComparisonId ?? null,
        selectedReplayId: researchSelection.selectedReplayId ?? null,
      }),
      sections,
      previewLines,
      totals: freezeObject({
        timelineEvents: timeline.events?.length ?? 0,
        evidenceReports: evidence.reports?.length ?? 0,
        comparisonCount: comparison.comparisons?.length ?? 0,
        replayCount: replay.replays?.length ?? 0,
        estimatedCharacters,
      }),
      truncated: estimatedCharacters > 4000,
    });
  }

  buildResearchRequest(snapshot = this.getSnapshot()) {
    const researchSelection = summarizeResearchSelection(this.cache.researchSelection);
    const context = this.buildResearchContext(snapshot);
    const validationErrors = [];
    if (!String(researchSelection.query ?? '').trim()) {
      validationErrors.push('Research query is required.');
    }
    return freezeObject({
      requestId: `research-${Date.now()}`,
      query: researchSelection.query,
      scope: researchSelection.scope,
      selections: context.selections,
      context,
      providerId: researchSelection.providerId ?? 'local-research-provider',
      validationErrors: freezeList(validationErrors),
    });
  }

  createLocalResearchResponse(request) {
    const highlights = request.context.sections.flatMap((section) => (section.items ?? []).slice(0, 2).map((item) => ({
      sectionId: section.id,
      itemId: item.id,
      label: item.label,
      detail: item.detail,
    })));
    return freezeObject({
      providerId: request.providerId,
      mode: 'deterministic-local',
      generatedAt: this.clock(),
      requestId: request.requestId,
      summary: `Draft for ${request.scope?.label ?? request.scope?.kind ?? 'current scope'} using ${request.context.totals.timelineEvents} timeline events and ${request.context.totals.evidenceReports} evidence reports.`,
      answer: `Focus the next review on ${request.query.trim() || 'the active laboratory state'} and trace the most relevant evidence before proposing changes.`,
      highlights: freezeList(highlights),
      limitations: freezeList([
        'This response is generated locally from the laboratory view models.',
        'It does not call an external LLM provider in this environment.',
      ]),
    });
  }

  async executeResearch(input = {}) {
    if (input.query !== undefined) {
      this.updateResearchQuery(input.query);
    }
    if (input.scope !== undefined) {
      this.setResearchScope(input.scope);
    }
    const snapshot = this.getSnapshot();
    const request = this.buildResearchRequest(snapshot);
    if (request.validationErrors.length > 0) {
      this.updateResearchSelection({
        status: 'invalid',
        validationErrors: request.validationErrors,
        executionError: request.validationErrors[0] ?? null,
        context: request.context,
      });
      this.state = Object.freeze({
        ...this.state,
        lastOperation: 'executeResearch',
        lastSyncAt: this.clock(),
      });
      return this.getViewModel('ai-research');
    }

    const response = this.orchestrator && typeof this.orchestrator.executeResearch === 'function'
      ? await this.orchestrator.executeResearch({ request, snapshot })
      : this.createLocalResearchResponse(request);

    this.cache.researchState = {
      ...(this.cache.researchState ?? {}),
      status: 'ready',
      validationErrors: [],
      executionError: null,
      isContextTruncated: Boolean(request.context.truncated),
      context: request.context,
      response,
      lastExecutedAt: this.clock(),
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'executeResearch',
      lastSyncAt: this.clock(),
      lastError: null,
    });
    return this.getViewModel('ai-research');
  }

  cancelResearch() {
    this.cache.researchState = {
      ...(this.cache.researchState ?? {}),
      status: 'cancelled',
      executionError: null,
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'cancelResearch',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('ai-research');
  }

  resetResearchWorkspace() {
    this.cache.researchSelection = {
      query: '',
      scope: { kind: 'current-experiment', label: 'Current experiment' },
      selectedEventIds: [],
      selectedEvidenceIds: [],
      selectedComparisonId: null,
      selectedReplayId: null,
      providerId: 'local-research-provider',
      status: 'idle',
    };
    this.cache.researchState = {
      context: null,
      response: null,
      executionError: null,
      isContextTruncated: false,
      validationErrors: [],
      lastExecutedAt: null,
      status: 'idle',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'resetResearchWorkspace',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('ai-research');
  }

  playReplay() {
    const snapshot = this.getSnapshot();
    const selectedReplay = this.getReplaySources(snapshot).find((item) => item.replayId === this.cache.replaySelection?.selectedReplayId)
      ?? this.getReplaySources(snapshot).find((item) => item.source === 'events')
      ?? this.getReplaySources(snapshot)[0]
      ?? null;
    const timeline = this.getReplayTimeline(snapshot, selectedReplay, tail(this.cache.recentEvents, 20));
    const selectedEvent = timeline.find((item) => item.eventId === this.cache.replaySelection?.selectedEventId) ?? timeline[0] ?? null;
    if (!selectedEvent) {
      return this.updateReplaySelection({
        selectedReplayId: selectedReplay?.replayId ?? null,
        selectedEventId: null,
        playbackState: 'playing',
        status: timeline.length === 0 ? 'empty' : 'playing',
        currentStep: 0,
        totalSteps: timeline.length,
      });
    }
    return this.updateReplaySelection({
      selectedReplayId: selectedReplay?.replayId ?? null,
      selectedEventId: selectedEvent.eventId,
      playbackState: 'playing',
      status: 'playing',
      currentStep: selectedEvent.step,
      totalSteps: timeline.length,
    });
  }

  pauseReplay() {
    const current = summarizeReplaySelection(this.cache.replaySelection);
    return this.updateReplaySelection({
      playbackState: current.totalSteps > 0 ? 'paused' : 'idle',
      status: current.totalSteps > 0 ? 'paused' : 'empty',
    });
  }

  stepForward() {
    return this.seekReplay(1);
  }

  stepBackward() {
    return this.seekReplay(-1);
  }

  seekReplay(target) {
    const snapshot = this.getSnapshot();
    const selectedReplay = this.getReplaySources(snapshot).find((item) => item.replayId === this.cache.replaySelection?.selectedReplayId)
      ?? this.getReplaySources(snapshot).find((item) => item.source === 'events')
      ?? this.getReplaySources(snapshot)[0]
      ?? null;
    const timeline = this.getReplayTimeline(snapshot, selectedReplay, tail(this.cache.recentEvents, 20));
    if (!timeline.length) {
      return this.updateReplaySelection({
        selectedEventId: null,
        currentStep: 0,
        totalSteps: 0,
        playbackState: 'empty',
        status: 'empty',
      });
    }

    const currentIndex = Math.max(0, timeline.findIndex((item) => item.eventId === this.cache.replaySelection?.selectedEventId));
    let nextIndex = currentIndex;
    if (target === 'beginning' || target === 'start') {
      nextIndex = 0;
    } else if (target === 'end') {
      nextIndex = timeline.length - 1;
    } else if (typeof target === 'number' && Number.isFinite(target)) {
      nextIndex = Math.min(timeline.length - 1, Math.max(0, target - 1));
    } else if (target === 1 || target === 'forward') {
      nextIndex = Math.min(timeline.length - 1, currentIndex + 1);
    } else if (target === -1 || target === 'backward') {
      nextIndex = Math.max(0, currentIndex - 1);
    }

    const nextEvent = timeline[nextIndex];
    return this.updateReplaySelection({
      selectedReplayId: selectedReplay?.replayId ?? null,
      selectedEventId: nextEvent?.eventId ?? null,
      currentStep: nextEvent?.step ?? 0,
      totalSteps: timeline.length,
      playbackState: target === 'end' ? 'finished' : 'paused',
      status: target === 'end' ? 'finished' : 'paused',
    });
  }


  stopReplay() {
    const snapshot = this.getSnapshot();
    const selectedReplay = this.getReplaySources(snapshot).find((item) => item.replayId === this.cache.replaySelection?.selectedReplayId)
      ?? this.getReplaySources(snapshot)[0]
      ?? null;
    const timeline = this.getReplayTimeline(snapshot, selectedReplay, tail(this.cache.recentEvents, 20));
    const firstEvent = timeline[0] ?? null;
    return this.updateReplaySelection({
      selectedEventId: firstEvent?.eventId ?? null,
      currentStep: firstEvent?.step ?? 0,
      totalSteps: timeline.length,
      playbackState: timeline.length > 0 ? 'paused' : 'empty',
      status: timeline.length > 0 ? 'paused' : 'empty',
    });
  }

  captureEvent(event) {

    if (!event) return;
    this.cache.recentEvents = [...this.cache.recentEvents, serialize(event)].slice(-20);
    this.cache.timelineSelection = {
      ...(this.cache.timelineSelection ?? {}),
      selectedEventId: null,
      status: 'ready',
    };
    this.state = Object.freeze({
      ...this.state,
      lastEvent: summarizeEvent(event),
      lastSyncAt: this.clock(),
    });
  }

  captureResult(result) {
    if (!result || typeof result !== 'object') return result;

    this.cache.lastCommandResult = serialize(result);
    this.state = Object.freeze({
      ...this.state,
      status: result.ok === false ? 'error' : 'ready',
      lastOperation: result.operation ?? this.state.lastOperation,
      lastError: result.ok === false ? serialize(result.error) : null,
      lastSyncAt: this.clock(),
    });

    const data = result.data ?? {};
    switch (result.operation) {
      case 'createExperiment':
        this.cache.workspace = data.workspace ?? this.cache.workspace;
        this.cache.experiment = data.experiment ?? this.cache.experiment;
        this.cache.recentExperiments = this.pushUnique(this.cache.recentExperiments, data.experiment, 'experimentId');
        break;
      case 'startExperiment':
      case 'updateExperiment':
      case 'finishExperiment':
        this.cache.experiment = data.experiment ?? this.cache.experiment;
        this.cache.recentExperiments = this.pushUnique(this.cache.recentExperiments, data.experiment, 'experimentId');
        break;
      case 'executeSession':
        this.cache.session = data.session ?? this.cache.session;
        this.cache.sessionResult = data.result ?? this.cache.sessionResult;
        this.cache.experiment = data.experiment ?? this.cache.experiment;
        this.cache.recentSessions = this.pushUnique(this.cache.recentSessions, data.session, 'sessionId');
        break;
      case 'executeSessions':
        this.cache.recentSessions = this.pushManyUnique(this.cache.recentSessions, data.sessions, 'sessionId');
        this.cache.experiment = data.experiment ?? this.cache.experiment;
        break;
      case 'compareResults':
        this.cache.comparison = data.comparison ?? this.cache.comparison;
        this.cache.recentComparisons = this.pushUnique(this.cache.recentComparisons, data.comparison, 'comparisonId');
        this.cache.experiment = data.experiment ?? this.cache.experiment;
        break;
      case 'generateEvidence':
        this.cache.evidence = data.evidence ?? this.cache.evidence;
        this.cache.recentEvidence = this.pushUnique(this.cache.recentEvidence, data.evidence, 'reportId');
        this.cache.evidenceSelection = {
          ...(this.cache.evidenceSelection ?? {}),
          selectedReportId: data.evidence?.reportId ?? data.evidence?.id ?? this.cache.evidenceSelection?.selectedReportId ?? null,
        };
        this.cache.experiment = data.experiment ?? this.cache.experiment;
        break;
      default:
        break;
    }

    this.cache.timelineSelection = {
      ...(this.cache.timelineSelection ?? {}),
      status: 'ready',
    };

    return result;
  }

  pushUnique(list, value, key) {
    if (!value) return list;
    const item = serialize(value);
    const id = item?.[key] ?? null;
    const next = Array.isArray(list) ? [...list.filter((entry) => entry?.[key] !== id), item] : [item];
    return next.slice(-10);
  }

  pushManyUnique(list, values, key) {
    return (values ?? []).reduce((acc, value) => this.pushUnique(acc, value, key), list ?? []);
  }

  setComparisonSelection(selection) {
    const normalized = summarizeComparisonSelection(selection);
    this.cache.comparisonSelection = {
      mode: normalized.mode,
      selectedItems: normalized.selectedItems,
      status: normalized.status,
    };
    this.state = Object.freeze({
      ...this.state,
      lastSyncAt: this.clock(),
    });
    return normalized;
  }

  selectItem(item, itemKind = null) {
    const normalized = normalizeComparisonSelectionItem(item, itemKind);
    if (!normalized) return this.getViewModel('comparison');

    const current = summarizeComparisonSelection(this.cache.comparisonSelection);
    const nextKind = normalized.itemKind ?? current.mode ?? null;
    const sameKind = current.selectedItems.length === 0 || current.selectedKinds.length === 0 || current.selectedKinds[0] === nextKind;
    const nextItems = sameKind
      ? [...current.selectedItems.filter((entry) => entry.itemId !== normalized.itemId), normalized]
      : [normalized];

    this.cache.comparisonSelection = {
      mode: nextKind,
      selectedItems: nextItems,
      status: sameKind ? (nextItems.length < 2 ? 'insufficient-selection' : 'ready') : 'incompatible-selection',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'selectItem',
      lastSyncAt: this.clock(),
      lastError: sameKind ? null : this.state.lastError,
    });

    return this.getViewModel('comparison');
  }

  removeItem(item, itemKind = null) {
    const normalized = normalizeComparisonSelectionItem(item, itemKind);
    if (!normalized) return this.getViewModel('comparison');

    const current = summarizeComparisonSelection(this.cache.comparisonSelection);
    const nextItems = current.selectedItems.filter((entry) => entry.itemId !== normalized.itemId);
    this.cache.comparisonSelection = {
      mode: nextItems[0]?.itemKind ?? null,
      selectedItems: nextItems,
      status: nextItems.length < 2 ? 'insufficient-selection' : 'ready',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'removeItem',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('comparison');
  }

  clearSelection() {
    this.cache.comparisonSelection = { mode: null, selectedItems: [], status: 'insufficient-selection' };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'clearSelection',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('comparison');
  }

  refreshComparison() {
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'refreshComparison',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('comparison');
  }

  loadEvidence(input = {}) {
    const evidence = input.evidence ?? input.report ?? null;
    if (evidence) {
      this.cache.evidence = evidence;
      this.cache.recentEvidence = this.pushUnique(this.cache.recentEvidence, evidence, 'reportId');
      this.cache.evidenceSelection = {
        ...(this.cache.evidenceSelection ?? {}),
        selectedReportId: evidence.reportId ?? evidence.id ?? null,
      };
    }

    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'loadEvidence',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('evidence');
  }

  refreshEvidence() {
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'refreshEvidence',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('evidence');
  }

  selectEvidence(itemOrId) {
    const selectedReportId = typeof itemOrId === 'string'
      ? itemOrId
      : itemOrId?.reportId ?? itemOrId?.id ?? null;
    if (!selectedReportId) return this.getViewModel('evidence');

    this.cache.evidenceSelection = {
      ...(this.cache.evidenceSelection ?? {}),
      selectedReportId,
      status: 'ready',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'selectEvidence',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('evidence');
  }

  clearEvidenceSelection() {
    this.cache.evidenceSelection = {
      ...(this.cache.evidenceSelection ?? {}),
      selectedReportId: null,
      status: 'idle',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'clearEvidenceSelection',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('evidence');
  }

  searchEvidence(query = '') {
    this.cache.evidenceSelection = {
      ...(this.cache.evidenceSelection ?? {}),
      searchQuery: String(query ?? ''),
      status: 'searching',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'searchEvidence',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('evidence');
  }

  loadTimeline(options = {}) {
    const snapshot = this.getSnapshot();
    const sources = this.getReplaySources(snapshot);
    const nextReplayId = typeof options === 'string'
      ? options
      : options.replayId ?? this.cache.timelineSelection?.selectedReplayId ?? sources.find((item) => item.source === 'events')?.replayId ?? sources[0]?.replayId ?? null;
    this.cache.timelineSelection = {
      ...(this.cache.timelineSelection ?? {}),
      selectedReplayId: nextReplayId,
      selectedEventId: typeof options === 'object' ? options.selectedEventId ?? null : null,
      searchQuery: typeof options === 'object' ? String(options.searchQuery ?? this.cache.timelineSelection?.searchQuery ?? '') : this.cache.timelineSelection?.searchQuery ?? '',
      activeFilter: typeof options === 'object' ? String(options.activeFilter ?? this.cache.timelineSelection?.activeFilter ?? 'all') || 'all' : this.cache.timelineSelection?.activeFilter ?? 'all',
      status: sources.length ? 'ready' : 'empty',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'loadTimeline',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('timeline');
  }

  refreshTimeline() {
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'refreshTimeline',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('timeline');
  }

  selectTimelineEvent(itemOrId) {
    const selectedEventId = typeof itemOrId === 'string'
      ? itemOrId
      : itemOrId?.eventId ?? itemOrId?.id ?? null;
    if (!selectedEventId) return this.getViewModel('timeline');

    this.cache.timelineSelection = {
      ...(this.cache.timelineSelection ?? {}),
      selectedEventId,
      status: 'ready',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'selectTimelineEvent',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('timeline');
  }

  searchTimeline(query = '') {
    this.cache.timelineSelection = {
      ...(this.cache.timelineSelection ?? {}),
      searchQuery: String(query ?? ''),
      status: 'searching',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'searchTimeline',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('timeline');
  }

  filterTimeline(filterId = 'all') {
    this.cache.timelineSelection = {
      ...(this.cache.timelineSelection ?? {}),
      activeFilter: typeof filterId === 'string' && filterId ? filterId : 'all',
      status: 'filtering',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'filterTimeline',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('timeline');
  }

  publishTimelineEvent(event) {
    this.captureEvent(event);
    return this.getViewModel('timeline');
  }

  filterEvidence(filterId = 'all') {
    this.cache.evidenceSelection = {
      ...(this.cache.evidenceSelection ?? {}),
      activeFilter: typeof filterId === 'string' && filterId ? filterId : 'all',
      status: 'filtering',
    };
    this.state = Object.freeze({
      ...this.state,
      lastOperation: 'filterEvidence',
      lastSyncAt: this.clock(),
    });
    return this.getViewModel('evidence');
  }

  async run(commandName, input = {}) {
    if (!this.orchestrator || typeof this.orchestrator[commandName] !== 'function') {
      throw new TypeError(`LaboratoryBindingLayer: orchestrator command "${commandName}" is not available.`);
    }

    const result = await this.orchestrator[commandName](input);
    return this.captureResult(result);
  }

  createExperiment(input = {}) { return this.run('createExperiment', input); }
  startExperiment(input = {}) { return this.run('startExperiment', input); }
  executeSession(input = {}) { return this.run('executeSession', input); }
  executeSessions(input = {}) { return this.run('executeSessions', input); }
  compareResults(input = {}) { return this.run('compareResults', input); }
  generateEvidence(input = {}) { return this.run('generateEvidence', input); }
  updateExperiment(input = {}) { return this.run('updateExperiment', input); }
  finishExperiment(input = {}) { return this.run('finishExperiment', input); }
}

export function defineLaboratoryBindingLayer(options = {}) {
  return new LaboratoryBindingLayer(options);
}
