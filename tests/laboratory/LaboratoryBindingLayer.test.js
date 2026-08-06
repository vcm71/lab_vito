import { describe, expect, it, vi } from 'vitest';
import { LaboratoryBindingLayer, defineLaboratoryBindingLayer } from '../../src/laboratory/application/LaboratoryBindingLayer.js';

describe('LaboratoryBindingLayer', () => {
  it('exposes isolated ViewModels without leaking raw domain entities', () => {
    const binding = defineLaboratoryBindingLayer({
      activeViewId: 'overview',
      clock: () => '2026-08-03T00:00:00.000Z',
    });

    binding.captureResult({
      ok: true,
      operation: 'createExperiment',
      data: {
        workspace: {
          workspaceId: 'ws-1',
          name: 'Workspace One',
          experiments: [{ experimentId: 'exp-1' }],
        },
        experiment: {
          experimentId: 'exp-1',
          workspaceId: 'ws-1',
          hypothesis: 'H1',
          objective: 'Validate binding',
          status: 'READY',
          sessions: [{ sessionId: 'ses-1' }],
        },
      },
    });

    binding.captureResult({
      ok: true,
      operation: 'compareResults',
      data: {
        comparison: {
          comparisonId: 'cmp-9',
          comparisonType: 'session-vs-session',
          criteriaCount: 3,
          metricKeys: ['delta', 'ratio'],
          differenceKeys: ['duration'],
          sessionIds: ['ses-9', 'ses-10'],
          timestamps: { comparedAt: '2026-08-03T00:01:00.000Z' },
        },
        experiment: {
          experimentId: 'exp-1',
          workspaceId: 'ws-1',
          hypothesis: 'H1',
          objective: 'Validate binding',
          status: 'READY',
          sessions: [{ sessionId: 'ses-1' }],
        },
      },
    });

    const overview = binding.getViewModel('overview');
    const experiments = binding.getViewModel('experiments');
    const comparison = binding.getViewModel('comparison');

    expect(binding).toBeInstanceOf(LaboratoryBindingLayer);
    expect(overview.viewId).toBe('overview');
    expect(overview.activeViewId).toBe('overview');
    expect(overview.kpis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Workspace', value: 'ws-1' }),
        expect.objectContaining({ label: 'Experiment', value: 'exp-1' }),
      ]),
    );
    expect(experiments.viewId).toBe('experiments');
    expect(experiments.activeViewId).toBe('overview');
    expect(experiments.activeExperiment).toEqual(
      expect.objectContaining({ experimentId: 'exp-1', workspaceId: 'ws-1' }),
    );
    expect(experiments.experiments[0]).toEqual(
      expect.objectContaining({ experimentId: 'exp-1', objective: 'Validate binding' }),
    );
    expect(comparison).toEqual(
      expect.objectContaining({
        viewId: 'comparison',
        activeViewId: 'overview',
        status: 'ready',
        loading: false,
        comparison: expect.objectContaining({ comparisonId: 'cmp-9' }),
        experiments: expect.any(Array),
        sessions: expect.any(Array),
        selection: expect.objectContaining({
          selectedCount: 0,
          status: 'insufficient-selection',
        }),
        summary: expect.objectContaining({
          state: 'insufficient-selection',
        }),
      }),
    );
    expect(comparison.comparisons[0]).toEqual(
      expect.objectContaining({ comparisonId: 'cmp-9', comparisonType: 'session-vs-session' }),
    );
    expect(comparison.items[0]).toEqual(
      expect.objectContaining({ comparisonId: 'cmp-9', itemKind: 'comparison' }),
    );
    expect(comparison.metrics).toEqual(
      expect.objectContaining({
        metricKeys: ['delta', 'ratio'],
        differenceKeys: ['duration'],
      }),
    );

    binding.setActiveView('comparison');
    expect(binding.getViewModel('comparison').activeViewId).toBe('comparison');

    binding.captureResult({
      ok: true,
      operation: 'generateEvidence',
      data: {
        evidence: {
          reportId: 'rep-1',
          title: 'Trace bundle',
          generatedAt: '2026-08-03T00:02:00.000Z',
          comparisonsCount: 2,
          sessionsCount: 1,
          resultsCount: 3,
          observationsCount: 4,
        },
      },
    });

    const evidence = binding.getViewModel('evidence');
    expect(evidence).toEqual(
      expect.objectContaining({
        viewId: 'evidence',
        reports: expect.arrayContaining([
          expect.objectContaining({ reportId: 'rep-1', title: 'Trace bundle' }),
        ]),
        selection: expect.objectContaining({
          selectedReportId: 'rep-1',
          activeFilter: 'all',
          selectedCount: 1,
        }),
        selectedReport: expect.objectContaining({ reportId: 'rep-1' }),
      }),
    );
    expect(overview.commands).toContain('createExperiment');
    expect(JSON.stringify(overview)).not.toContain('sessions:');
  });

  it('tracks comparison selection mutations for the shell', () => {
    const binding = defineLaboratoryBindingLayer({ activeViewId: 'comparison', clock: () => '2026-08-03T00:00:00.000Z' });

    binding.selectItem({ itemId: 'exp-1', itemKind: 'experiment', label: 'Experiment 1' });
    binding.selectItem({ itemId: 'exp-2', itemKind: 'experiment', label: 'Experiment 2' });
    const selected = binding.getViewModel('comparison');

    expect(selected.selection).toEqual(
      expect.objectContaining({
        selectedCount: 2,
        status: 'ready',
        canCompare: true,
      }),
    );

    binding.removeItem('exp-1', 'experiment');
    expect(binding.getViewModel('comparison').selection.selectedCount).toBe(1);

    binding.clearSelection();
    expect(binding.getViewModel('comparison').selection).toEqual(
      expect.objectContaining({
        selectedCount: 0,
        status: 'insufficient-selection',
      }),
    );

    expect(binding.refreshComparison()).toEqual(expect.objectContaining({ viewId: 'comparison' }));
  });

  it('tracks evidence explorer mutations for the shell', () => {
    const binding = defineLaboratoryBindingLayer({ activeViewId: 'evidence', clock: () => '2026-08-03T00:00:00.000Z' });

    binding.captureResult({
      ok: true,
      operation: 'generateEvidence',
      data: {
        evidence: {
          reportId: 'rep-1',
          title: 'Trace bundle',
          generatedAt: '2026-08-03T00:02:00.000Z',
          comparisonsCount: 2,
          sessionsCount: 1,
          resultsCount: 3,
          observationsCount: 4,
        },
      },
    });

    binding.searchEvidence('trace');
    binding.filterEvidence('comparisons');
    binding.selectEvidence('rep-1');

    const evidence = binding.getViewModel('evidence');
    expect(evidence).toEqual(
      expect.objectContaining({
        viewId: 'evidence',
        visibleReports: expect.arrayContaining([
          expect.objectContaining({ reportId: 'rep-1' }),
        ]),
        selectedReport: expect.objectContaining({ reportId: 'rep-1' }),
        selection: expect.objectContaining({
          selectedReportId: 'rep-1',
          searchQuery: 'trace',
          activeFilter: 'comparisons',
          selectedCount: 1,
        }),
      }),
    );

    binding.clearEvidenceSelection();
    expect(binding.getViewModel('evidence').selection).toEqual(
      expect.objectContaining({
        selectedReportId: null,
        status: 'idle',
      }),
    );

    expect(binding.refreshEvidence()).toEqual(expect.objectContaining({ viewId: 'evidence' }));
  });

  it('tracks replay timeline and playback controls from captured events', () => {
    const binding = defineLaboratoryBindingLayer({ activeViewId: 'replay', clock: () => '2026-08-03T00:00:00.000Z' });

    binding.captureEvent({
      type: 'session.executed',
      occurredAt: '2026-08-03T00:01:00.000Z',
      metadata: {
        operation: 'executeSession',
        sessionId: 'ses-1',
      },
      payload: {
        session: { sessionId: 'ses-1' },
      },
    });

    binding.captureEvent({
      type: 'comparison.completed',
      occurredAt: '2026-08-03T00:02:00.000Z',
      metadata: {
        operation: 'compareResults',
        comparisonId: 'cmp-1',
      },
      payload: {
        comparison: { comparisonId: 'cmp-1' },
      },
    });

    const replay = binding.getViewModel('replay');
    expect(replay).toEqual(
      expect.objectContaining({
        viewId: 'replay',
        replayId: 'replay-events',
        source: 'events',
        totalSteps: 2,
        metadata: expect.objectContaining({
          eventCount: 2,
          lastEventType: 'comparison.completed',
        }),
        selectedEvent: expect.objectContaining({
          eventId: 'comparison.completed-2',
          step: 2,
        }),
        controls: expect.objectContaining({
          canPlay: true,
          canStepBackward: true,
          canStepForward: false,
          canSeek: true,
        }),
      }),
    );

    binding.playReplay();
    expect(binding.getViewModel('replay').playbackState).toBe('playing');

    binding.stepBackward();
    expect(binding.getViewModel('replay').currentStep).toBe(1);

    binding.seekReplay('end');
    expect(binding.getViewModel('replay').currentStep).toBe(2);

    binding.pauseReplay();
    expect(binding.getViewModel('replay').playbackState).toBe('paused');
  });

  it('builds a dedicated timeline view model and selection helpers', () => {
    const binding = defineLaboratoryBindingLayer({ activeViewId: 'timeline', clock: () => '2026-08-03T00:00:00.000Z' });

    binding.captureEvent({
      type: 'session.executed',
      occurredAt: '2026-08-03T00:01:00.000Z',
      metadata: {
        operation: 'executeSession',
        sessionId: 'ses-1',
      },
      payload: {
        session: { sessionId: 'ses-1' },
      },
    });

    binding.captureEvent({
      type: 'comparison.completed',
      occurredAt: '2026-08-03T00:02:00.000Z',
      metadata: {
        operation: 'compareResults',
        comparisonId: 'cmp-1',
      },
      payload: {
        comparison: { comparisonId: 'cmp-1' },
      },
    });

    const timeline = binding.getViewModel('timeline');
    expect(timeline).toEqual(
      expect.objectContaining({
        viewId: 'timeline',
        totalSteps: 2,
        events: expect.arrayContaining([
          expect.objectContaining({ eventId: 'session.executed-1' }),
          expect.objectContaining({ eventId: 'comparison.completed-2' }),
        ]),
        statistics: expect.objectContaining({
          eventCount: 2,
          lastEventType: 'comparison.completed',
        }),
        selectedEvent: expect.objectContaining({
          eventId: 'comparison.completed-2',
          step: 2,
        }),
      }),
    );

    binding.searchTimeline('cmp-1');
    expect(binding.getViewModel('timeline').events).toHaveLength(1);

    binding.searchTimeline('');
    binding.filterTimeline('session.executed');
    expect(binding.getViewModel('timeline').events).toHaveLength(1);

    binding.selectTimelineEvent('session.executed-1');
    expect(binding.getViewModel('timeline').selectedEvent).toEqual(
      expect.objectContaining({ eventId: 'session.executed-1', step: 1 }),
    );

    expect(binding.loadTimeline({ replayId: 'replay-events' })).toEqual(expect.objectContaining({ viewId: 'timeline' }));
    expect(binding.refreshTimeline()).toEqual(expect.objectContaining({ viewId: 'timeline' }));
    expect(binding.publishTimelineEvent({ type: 'custom.event', occurredAt: '2026-08-03T00:03:00.000Z' })).toEqual(
      expect.objectContaining({ viewId: 'timeline' }),
    );
  });

  it('builds and executes the AI research workspace from structured laboratory context', async () => {
    const orchestrator = {
      executeResearch: vi.fn(async ({ request }) => ({
        providerId: 'local-research-provider',
        mode: 'local',
        generatedAt: '2026-08-03T00:00:02.000Z',
        requestId: request.requestId,
        summary: `Draft for ${request.scope.label} using ${request.context.totals.timelineEvents} timeline events.`,
        answer: 'Trace the selected context before proposing changes.',
        highlights: [{ sectionId: 'timeline', itemId: 'evt-1', label: 'Replay event' }],
      })),
    };

    const binding = new LaboratoryBindingLayer({ orchestrator, clock: () => '2026-08-03T00:00:01.000Z' });
    binding.updateResearchQuery('trace the latest comparison');
    binding.selectResearchItem('ai-scope-comparison', 'scope');
    binding.selectResearchItem('evt-1', 'timeline');
    binding.selectResearchItem('rep-1', 'evidence');

    const result = await binding.executeResearch();
    const viewModel = binding.getViewModel('ai-research');

    expect(orchestrator.executeResearch).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          query: 'trace the latest comparison',
          scope: expect.objectContaining({ kind: 'comparison-window' }),
          context: expect.objectContaining({
            sections: expect.any(Array),
            totals: expect.objectContaining({ timelineEvents: expect.any(Number), evidenceReports: expect.any(Number) }),
          }),
        }),
      }),
    );
    expect(result.response).toEqual(expect.objectContaining({ providerId: 'local-research-provider', mode: 'local' }));
    expect(viewModel).toEqual(
      expect.objectContaining({
        viewId: 'ai-research',
        status: 'ready',
        query: 'trace the latest comparison',
        scope: expect.objectContaining({ kind: 'comparison-window' }),
        provider: expect.objectContaining({ providerId: 'local-research-provider', mode: 'deterministic-local' }),
        response: expect.objectContaining({ summary: expect.stringContaining('Draft for') }),
      }),
    );
    expect(binding.getState()).toEqual(
      expect.objectContaining({
        lastOperation: 'executeResearch',
        status: 'ready',
      }),
    );
  });

  it('delegates commands to the orchestrator and captures the resulting state', async () => {
    const orchestrator = {
      executeSession: vi.fn(async () => ({
        ok: true,
        operation: 'executeSession',
        data: {
          session: {
            sessionId: 'ses-9',
            status: 'COMPLETED',
            executionMode: 'auto',
            modules: [{ id: 'mod-1' }],
            timestamps: { createdAt: '2026-08-03T00:00:00.000Z' },
          },
          result: {
            sessionId: 'ses-9',
            status: 'COMPLETED',
            durationMs: 42,
            errors: [],
            modulesExecuted: [{ id: 'mod-1' }],
            results: [{ id: 'res-1' }],
          },
          experiment: {
            experimentId: 'exp-9',
            status: 'RUNNING',
          },
        },
      })),
    };

    const binding = new LaboratoryBindingLayer({ orchestrator, clock: () => '2026-08-03T00:00:01.000Z' });
    const result = await binding.executeSession({ sessionId: 'ses-9' });

    expect(orchestrator.executeSession).toHaveBeenCalledWith({ sessionId: 'ses-9' });
    expect(result.operation).toBe('executeSession');
    expect(binding.getViewModel('sessions')).toEqual(
      expect.objectContaining({
        viewId: 'sessions',
        session: expect.objectContaining({ sessionId: 'ses-9', status: 'COMPLETED' }),
      }),
    );
    expect(binding.getState()).toEqual(
      expect.objectContaining({
        lastOperation: 'executeSession',
        status: 'ready',
      }),
    );
  });
});
