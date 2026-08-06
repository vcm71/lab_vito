/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LabRenderer } from '../../controlador_de_la_vista_lab.js';

function createBinding() {
  const viewModels = {
    overview: {
      viewId: 'overview',
      title: 'Overview',
      subtitle: 'Binding summary',
      status: 'ready',
      activeViewId: 'overview',
      kpis: [
        { label: 'Workspace', value: 'ws-1' },
        { label: 'Experiment', value: 'exp-1' },
      ],
      recentActivity: [
        {
          kind: 'experiment',
          summary: {
            experimentId: 'exp-1',
            workspaceId: 'ws-1',
            status: 'READY',
            sessions: [{ sessionId: 'ses-1' }],
            comparisons: [],
            evidence: [],
          },
        },
      ],
      commands: ['createExperiment'],
    },
    experiments: {
      viewId: 'experiments',
      title: 'Experiments',
      subtitle: 'Binding deck',
      status: 'ready',
      activeExperiment: {
        experimentId: 'exp-1',
        workspaceId: 'ws-1',
        status: 'READY',
        hypothesis: 'H1',
        objective: 'Validate binding',
        sessions: [{ sessionId: 'ses-1' }],
        comparisons: [{ comparisonId: 'cmp-1' }],
        evidence: [{ reportId: 'rep-1' }],
      },
      workspace: {
        workspaceId: 'ws-1',
        owner: 'qa',
        experiments: [{ experimentId: 'exp-1' }],
      },
      experiments: [
        {
          experimentId: 'exp-1',
          workspaceId: 'ws-1',
          status: 'READY',
          hypothesis: 'H1',
          objective: 'Validate binding',
          sessions: [{ sessionId: 'ses-1' }],
          comparisons: [{ comparisonId: 'cmp-1' }],
          evidence: [{ reportId: 'rep-1' }],
        },
      ],
    },
    sessions: {
      viewId: 'sessions',
      title: 'Sessions',
      subtitle: 'Session binding',
      status: 'ready',
      session: {
        sessionId: 'ses-9',
        executionMode: 'auto',
        status: 'COMPLETED',
        modules: ['mod-1'],
        executionPlan: [{ id: 'step-1' }],
        dataset: { datasetId: 'dataset-1' },
      },
      sessionResult: {
        status: 'COMPLETED',
        durationMs: 42,
        errors: [],
      },
      sessions: [
        {
          sessionId: 'ses-9',
          executionMode: 'auto',
          status: 'COMPLETED',
          modules: ['mod-1'],
          parameters: { seed: 1 },
          executionPlan: [{ id: 'step-1' }],
          timestamps: { createdAt: '2026-08-03T00:00:00.000Z' },
        },
      ],
    },
    comparison: {
      viewId: 'comparison',
      title: 'Comparison',
      subtitle: 'Comparison binding',
      status: 'ready',
      loading: false,
      lastError: null,
      comparison: {
        comparisonId: 'cmp-9',
        comparisonType: 'session-vs-session',
        criteriaCount: 3,
        metricKeys: ['delta', 'ratio'],
        differenceKeys: ['duration'],
        sessionIds: ['ses-9', 'ses-10'],
        timestamps: { comparedAt: '2026-08-03T00:01:00.000Z' },
      },
      experiments: [
        {
          itemId: 'exp-1',
          itemKind: 'experiment',
          experimentId: 'exp-1',
          title: 'Validate binding',
          objective: 'Validate binding',
          status: 'READY',
          sessionsCount: 1,
        },
      ],
      sessions: [
        {
          itemId: 'ses-9',
          itemKind: 'session',
          sessionId: 'ses-9',
          title: 'ses-9',
          status: 'COMPLETED',
          executionMode: 'auto',
          modulesCount: 1,
        },
      ],
      selection: {
        selectedCount: 0,
        selectedKinds: [],
        status: 'insufficient-selection',
        canCompare: false,
        selectedItems: [],
      },
      summary: {
        comparableCount: 2,
        selectedCount: 0,
        selectedKinds: [],
        totalCriteria: 3,
        differenceCount: 1,
        similarityCount: 2,
        state: 'insufficient-selection',
      },
      metrics: {
        metricKeys: ['delta', 'ratio'],
        differenceKeys: ['duration'],
      },
      comparisons: [
        {
          comparisonId: 'cmp-9',
          comparisonType: 'session-vs-session',
          criteriaCount: 3,
          metricKeys: ['delta', 'ratio'],
          differenceKeys: ['duration'],
          sessionIds: ['ses-9', 'ses-10'],
          timestamps: { comparedAt: '2026-08-03T00:01:00.000Z' },
        },
      ],
    },
    evidence: {
      viewId: 'evidence',
      title: 'Evidence',
      subtitle: 'Evidence binding',
      status: 'ready',
      evidence: {
        reportId: 'rep-1',
        title: 'Trace bundle',
        generatedAt: '2026-08-03T00:02:00.000Z',
        comparisonsCount: 2,
        sessionsCount: 1,
        resultsCount: 3,
        observationsCount: 4,
      },
      reports: [
        {
          reportId: 'rep-1',
          title: 'Trace bundle',
          generatedAt: '2026-08-03T00:02:00.000Z',
          comparisonsCount: 2,
          sessionsCount: 1,
          resultsCount: 3,
          observationsCount: 4,
        },
        {
          reportId: 'rep-2',
          title: 'Session recap',
          generatedAt: '2026-08-03T00:03:00.000Z',
          comparisonsCount: 0,
          sessionsCount: 2,
          resultsCount: 1,
          observationsCount: 0,
        },
      ],
      visibleReports: [
        {
          reportId: 'rep-1',
          title: 'Trace bundle',
          generatedAt: '2026-08-03T00:02:00.000Z',
          comparisonsCount: 2,
          sessionsCount: 1,
          resultsCount: 3,
          observationsCount: 4,
        },
        {
          reportId: 'rep-2',
          title: 'Session recap',
          generatedAt: '2026-08-03T00:03:00.000Z',
          comparisonsCount: 0,
          sessionsCount: 2,
          resultsCount: 1,
          observationsCount: 0,
        },
      ],
      selection: {
        selectedReportId: 'rep-1',
        searchQuery: '',
        activeFilter: 'all',
        status: 'ready',
        selectedCount: 2,
        totalCount: 2,
        hasSelection: true,
      },
      selectedReport: {
        reportId: 'rep-1',
        title: 'Trace bundle',
        generatedAt: '2026-08-03T00:02:00.000Z',
        comparisonsCount: 2,
        sessionsCount: 1,
        resultsCount: 3,
        observationsCount: 4,
      },
      summary: {
        reportCount: 2,
        visibleCount: 2,
        generatedCount: 2,
      },
    },
    replay: {
      viewId: 'replay',
      title: 'Replay',
      subtitle: 'Replay binding',
      replayId: 'replay-events',
      source: 'events',
      timestamp: '2026-08-03T00:02:00.000Z',
      currentStep: 2,
      totalSteps: 2,
      playbackState: 'paused',
      selectedEvent: {
        eventId: 'comparison.completed-2',
        step: 2,
        type: 'comparison.completed',
        label: 'Comparison event',
        occurredAt: '2026-08-03T00:02:00.000Z',
        metadata: { operation: 'compareResults' },
        payload: { comparison: { comparisonId: 'cmp-1' } },
        references: {
          session: null,
          experiment: null,
          comparison: { comparisonId: 'cmp-1' },
          evidence: null,
        },
      },
      metadata: {
        eventCount: 2,
        sourceCount: 1,
        lastEventType: 'comparison.completed',
      },
      timeline: [
        {
          eventId: 'session.executed-1',
          step: 1,
          type: 'session.executed',
          label: 'Session event',
          occurredAt: '2026-08-03T00:01:00.000Z',
          metadata: { operation: 'executeSession', sessionId: 'ses-1' },
          payload: { session: { sessionId: 'ses-1' } },
          references: {
            session: { sessionId: 'ses-1' },
            experiment: null,
            comparison: null,
            evidence: null,
          },
        },
        {
          eventId: 'comparison.completed-2',
          step: 2,
          type: 'comparison.completed',
          label: 'Comparison event',
          occurredAt: '2026-08-03T00:02:00.000Z',
          metadata: { operation: 'compareResults', comparisonId: 'cmp-1' },
          payload: { comparison: { comparisonId: 'cmp-1' } },
          references: {
            session: null,
            experiment: null,
            comparison: { comparisonId: 'cmp-1' },
            evidence: null,
          },
        },
      ],
      replays: [
        {
          replayId: 'replay-events',
          source: 'events',
          label: 'Recent event stream',
          timestamp: '2026-08-03T00:02:00.000Z',
        },
      ],
      related: {
        session: null,
        experiment: null,
        comparison: { comparisonId: 'cmp-1' },
        evidence: null,
      },
      controls: {
        canPlay: true,
        canPause: true,
        canStop: true,
        canStepForward: false,
        canStepBackward: true,
        canSeek: true,
      },
    },
    'ai-research': {
      viewId: 'ai-research',
      title: 'AI Research',
      subtitle: 'AI research binding',
      status: 'ready',
      query: 'trace the latest comparison',
      scope: { kind: 'comparison-window', label: 'Comparison window' },
      provider: {
        providerId: 'local-research-provider',
        mode: 'deterministic-local',
        label: 'Local research provider',
      },
      context: {
        previewLines: [
          'Timeline: 2 events available in the current replay/timeline view',
          'Evidence: 2 evidence reports exposed by the binding',
          'Comparison: 1 comparison snapshot available',
          'Replay: 2 replay steps available',
        ],
        preview: 'Timeline: 2 events available in the current replay/timeline view',
        truncated: false,
        totals: {
          timelineEvents: 2,
          evidenceReports: 2,
          comparisonCount: 1,
          replayCount: 2,
          estimatedCharacters: 203,
        },
        sections: [
          {
            id: 'timeline',
            title: 'Timeline',
            summary: '2 events available in the current replay/timeline view',
            items: [{ id: 'evt-1', label: 'Replay event', detail: '2026-08-03T00:00:01.000Z', kind: 'event' }],
          },
          {
            id: 'evidence',
            title: 'Evidence',
            summary: '2 evidence reports exposed by the binding',
            items: [{ id: 'rep-1', label: 'Trace bundle', detail: '2026-08-03T00:00:02.000Z', kind: 'report' }],
          },
          {
            id: 'comparison',
            title: 'Comparison',
            summary: '1 comparison snapshot available',
            items: [{ id: 'cmp-9', label: 'Comparison window', detail: '2026-08-03T00:01:00.000Z', kind: 'comparison' }],
          },
          {
            id: 'replay',
            title: 'Replay',
            summary: '2 replay steps available',
            items: [{ id: 'replay-events', label: 'Recent event stream', detail: 'events', kind: 'replay' }],
          },
        ],
      },
      response: {
        providerId: 'local-research-provider',
        mode: 'deterministic-local',
        generatedAt: '2026-08-03T00:00:02.000Z',
        summary: 'Draft for Comparison window using 2 timeline events.',
        answer: 'Trace the selected context before proposing changes.',
        highlights: [{ sectionId: 'timeline', itemId: 'evt-1', label: 'Replay event', detail: '2026-08-03T00:00:01.000Z' }],
      },
      selections: {
        selectedEventIds: ['evt-1'],
        selectedEvidenceIds: ['rep-1'],
        selectedComparisonId: 'cmp-9',
        selectedReplayId: 'replay-events',
      },
      validationErrors: [],
      commands: ['buildResearchContext', 'executeResearch', 'resetResearchWorkspace'],
    },
  };

  return {
    getViewModel: vi.fn((viewId) => viewModels[viewId] ?? null),
    setActiveView: vi.fn(),
  };
}

function render(viewId) {
  document.body.innerHTML = '<div id="lab-root"></div>';
  const binding = createBinding();
  const renderer = new LabRenderer('lab-root', binding, { initialViewId: viewId });
  renderer.init();
  return { binding, renderer, container: document.getElementById('lab-root') };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('LabRenderer functional binding views', () => {
  it('renders Overview with binding-driven KPIs and activity cards', () => {
    const { container, binding } = render('overview');

    expect(binding.getViewModel).toHaveBeenCalledWith('overview');
    expect(container.textContent).toContain('Binding summary');
    expect(container.textContent).toContain('Workspace: ws-1');
    expect(container.textContent).toContain('Experiment: exp-1');
    expect(container.querySelector('[data-select-item="overview-activity-1"]')).toBeTruthy();
    expect(container.textContent).not.toContain('No binding layer detected');
  });

  it('selects an overview activity card and updates the workspace state', () => {
    const { container, binding } = render('overview');
    const activityCard = container.querySelector('[data-select-item="overview-activity-1"]');

    expect(activityCard).toBeTruthy();

    activityCard.click();

    expect(container.textContent).toContain('Selected item: overview-activity-1');
    expect(container.querySelector('[data-select-item="overview-activity-1"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(binding.getViewModel).toHaveBeenCalledWith('overview');
  });

  it('renders Experiments with the active experiment and experiment list', () => {
    const { container, binding } = render('experiments');

    expect(binding.getViewModel).toHaveBeenCalledWith('experiments');
    expect(container.textContent).toContain('Experiment list');
    expect(container.textContent).toContain('Workspace: ws-1');
    expect(container.textContent).toContain('Validate binding');
    expect(container.querySelector('[data-select-item="experiment-active"]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="experiment-exp-1"]')).toBeTruthy();
    expect(container.textContent).not.toContain('Placeholder para definir lotes');
  });

  it('renders Sessions with the active session, result, and session list', () => {
    const { container, binding } = render('sessions');

    expect(binding.getViewModel).toHaveBeenCalledWith('sessions');
    expect(container.textContent).toContain('Session timeline');
    expect(container.textContent).toContain('Result: COMPLETED');
    expect(container.textContent).toContain('Duration: 42 ms');
    expect(container.querySelector('[data-select-item="sessions-active"]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="sessions-ses-9"]')).toBeTruthy();
    expect(container.textContent).not.toContain('Placeholder para la línea temporal de sesiones');
  });

  it('renders Comparison with the active comparison and comparison list', () => {
    const { container, binding } = render('comparison');

    expect(binding.getViewModel).toHaveBeenCalledWith('comparison');
    expect(container.textContent).toContain('Comparison binding');
    expect(container.textContent).toContain('Selection targets');
    expect(container.textContent).toContain('Selected items: 0');
    expect(container.textContent).toContain('Summary: insufficient-selection');
    expect(container.querySelector('[data-select-item="exp-1"]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="ses-9"]')).toBeTruthy();
    expect(container.querySelector('[data-refresh-comparison]')).toBeTruthy();
    expect(container.querySelector('[data-clear-selection]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="comparison-cmp-9"]')).toBeTruthy();
    expect(container.textContent).not.toContain('Placeholder para comparación visual');
  });

  it('renders Evidence with the active report and report list', () => {
    const { container, binding } = render('evidence');

    expect(binding.getViewModel).toHaveBeenCalledWith('evidence');
    expect(container.textContent).toContain('Evidence explorer');
    expect(container.textContent).toContain('Evidence binding');
    expect(container.textContent).toContain('Selected: rep-1');
    expect(container.textContent).toContain('Trace bundle');
    expect(container.querySelector('[data-select-item="rep-1"]')).toBeTruthy();
    expect(container.querySelector('[data-refresh-evidence]')).toBeTruthy();
    expect(container.textContent).not.toContain('Placeholder para explorar reportes');
  });

  it('renders Replay with the selected event and timeline controls', () => {
    const { container, binding } = render('replay');

    expect(binding.getViewModel).toHaveBeenCalledWith('replay');
    expect(container.textContent).toContain('Replay binding');
    expect(container.textContent).toContain('Replay: replay-events');
    expect(container.textContent).toContain('Step: 2 of 2');
    expect(container.textContent).toContain('comparison.completed');
    expect(container.querySelector('[data-replay-action="play"]')).toBeTruthy();
    expect(container.querySelector('[data-replay-action="step-forward"]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="comparison.completed-2"]')).toBeTruthy();
    expect(container.textContent).not.toContain('Placeholder para análisis de reproducibilidad');
  });

  it('renders AI Research with context, response, and action controls', () => {
    const { container, binding } = render('ai-research');

    expect(binding.getViewModel).toHaveBeenCalledWith('ai-research');
    expect(container.textContent).toContain('AI research binding');
    expect(container.textContent).toContain('Query: trace the latest comparison');
    expect(container.textContent).toContain('Scope: Comparison window');
    expect(container.textContent).toContain('Provider: local-research-provider');
    expect(container.textContent).toContain('Build context');
    expect(container.textContent).toContain('Trace the selected context before proposing changes.');
    expect(container.textContent).toContain('Draft for Comparison window using 2 timeline events.');
    expect(container.querySelector('[data-toolbar-action="build-research-context"]')).toBeTruthy();
    expect(container.querySelector('[data-toolbar-action="execute-research"]')).toBeTruthy();
    expect(container.querySelector('[data-toolbar-action="reset-research"]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="ai-scope-current"]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="evt-1"]')).toBeTruthy();
    expect(container.querySelector('[data-select-item="rep-1"]')).toBeTruthy();
    expect(container.textContent).toContain('Ready. Vista sincronizada con el binding. Overview, Experiments y Sessions consumen ViewModels reales.');
    expect(container.textContent).toContain('Workspace: ai-research');
  });

  it('renders Comparison loading, empty, and error states with binding fallback content', () => {
    document.body.innerHTML = '<div id="lab-root"></div>';
    const binding = {
      getViewModel: vi.fn((viewId) => (viewId === 'comparison'
        ? {
            viewId: 'comparison',
            title: 'Comparison',
            subtitle: 'Binding fallback',
            loading: true,
            lastError: 'comparison unavailable',
            comparison: null,
            comparisons: [],
          }
        : null)),
      setActiveView: vi.fn(),
    };
    const renderer = new LabRenderer('lab-root', binding, { initialViewId: 'comparison' });
    renderer.init();

    const container = document.getElementById('lab-root');
    expect(container.textContent).toContain('Loading comparison snapshot');
    expect(container.textContent).toContain('comparison unavailable');
    expect(container.textContent).toContain('No comparison selected in the binding snapshot.');
    expect(container.textContent).toContain('No comparisons available in the binding snapshot.');
  });
});