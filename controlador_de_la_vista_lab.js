/**
 * Orion - Laboratory UI Shell renderer.
 *
 * Fase 6.C.3 — shell navegable con estado local:
 * - No domain access
 * - No statistical logic
 * - No experiment execution
 * - No data consumption
 * - Persist only visual preferences
 */

const SHELL_STORAGE_KEY = 'orion.laboratory.shell.preferences.v2';

const LAB_SHELL_VIEWS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '◌',
    title: 'Overview',
    subtitle: 'Resumen visual del laboratorio',
    badge: 'Shell',
    breadcrumb: ['Home', 'Laboratory', 'Overview'],
    defaultItem: 'overview-canvas',
  },
  {
    id: 'experiments',
    label: 'Experiments',
    icon: '⚗️',
    title: 'Experiments',
    subtitle: 'Placeholder para experimentos futuros',
    badge: 'C.3',
    breadcrumb: ['Home', 'Laboratory', 'Experiments'],
    defaultItem: 'experiment-launcher',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: '🗂️',
    title: 'Sessions',
    subtitle: 'Placeholder para sesiones y ciclos',
    badge: 'C.4',
    breadcrumb: ['Home', 'Laboratory', 'Sessions'],
    defaultItem: 'sessions-timeline',
  },
  {
    id: 'comparison',
    label: 'Comparison',
    icon: '⇄',
    title: 'Comparison',
    subtitle: 'Workspace de comparación con ViewModels reales',
    badge: 'C.5',
    breadcrumb: ['Home', 'Laboratory', 'Comparison'],
    defaultItem: 'comparison-matrix',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    icon: '🧾',
    title: 'Evidence',
    subtitle: 'Evidence explorer for traceability and reproducibility',
    badge: 'C.5',
    breadcrumb: ['Home', 'Laboratory', 'Evidence'],
    defaultItem: 'evidence-trace',
  },
  {
    id: 'replay',
    label: 'Replay',
    icon: '▶',
    title: 'Replay',
    subtitle: 'Placeholder para replay y revisión',
    badge: 'C.6',
    breadcrumb: ['Home', 'Laboratory', 'Replay'],
    defaultItem: 'replay-lane',
  },
  {
    id: 'ai-research',
    label: 'AI Research',
    icon: '⌬',
    title: 'AI Research',
    subtitle: 'Placeholder para investigación asistida',
    badge: 'C.7',
    breadcrumb: ['Home', 'Laboratory', 'AI Research'],
    defaultItem: 'ai-prompt',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙',
    title: 'Settings',
    subtitle: 'Placeholder para ajustes del shell',
    badge: 'Visual',
    breadcrumb: ['Home', 'Laboratory', 'Settings'],
    defaultItem: 'settings-theme',
  },
];

const LAB_SHELL_FILTERS = ['All', 'Open', 'Pinned', 'Archived'];
const LAB_SHELL_SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'alpha', label: 'Alphabetical' },
  { id: 'status', label: 'Status' },
];

const LAB_SHELL_STATUS = [
  { id: 'ready', label: 'Ready', tone: 'emerald' },
  { id: 'searching', label: 'Searching', tone: 'blue' },
  { id: 'filtering', label: 'Filtering', tone: 'amber' },
  { id: 'refreshing', label: 'Refreshing', tone: 'violet' },
  { id: 'placeholder-updated', label: 'Placeholder Updated', tone: 'emerald' },
  { id: 'offline', label: 'Offline', tone: 'slate' },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeJsonParse(text, fallback) {
  try {
    const parsed = JSON.parse(text);
    return parsed ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function loadPreferences() {
  if (typeof localStorage === 'undefined') return {};

  const raw = localStorage.getItem(SHELL_STORAGE_KEY);
  if (!raw) return {};

  const parsed = safeJsonParse(raw, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function savePreferences(preferences) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SHELL_STORAGE_KEY, JSON.stringify(preferences));
  } catch (_) {
    // Persistencia visual best-effort.
  }
}

function getView(viewId) {
  return LAB_SHELL_VIEWS.find((view) => view.id === viewId) ?? LAB_SHELL_VIEWS[0];
}

function joinBreadcrumb(breadcrumb) {
  return breadcrumb.map((item) => escapeHtml(item)).join(' <span aria-hidden="true">›</span> ');
}

function buildMetricCard(title, value, note, itemId, selectedItem) {
  const selectedClass = itemId === selectedItem ? ' is-selected' : '';
  return `
    <button type="button" class="laboratory-shell-metric panel${selectedClass}" data-select-item="${escapeHtml(itemId)}" aria-pressed="${itemId === selectedItem ? 'true' : 'false'}">
      <span class="laboratory-shell-metric-title">${escapeHtml(title)}</span>
      <span class="laboratory-shell-metric-value">${escapeHtml(value)}</span>
      <span class="laboratory-shell-metric-note">${escapeHtml(note)}</span>
    </button>
  `;
}

function buildToggleGroup({ id, title, summary, body, expanded, selectedItem }) {
  const isExpanded = expanded ? 'true' : 'false';
  return `
    <section class="panel laboratory-shell-toggle-group ${expanded ? 'is-expanded' : 'is-collapsed'}" data-group-id="${escapeHtml(id)}">
      <div class="laboratory-shell-toggle-header">
        <div>
          <h4 class="panel-title">${escapeHtml(title)}</h4>
          <p class="laboratory-shell-empty-copy">${escapeHtml(summary)}</p>
        </div>
        <button type="button" class="laboratory-shell-group-toggle" data-toggle-group="${escapeHtml(id)}" aria-expanded="${isExpanded}">
          ${expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div class="laboratory-shell-toggle-body" ${expanded ? '' : 'hidden'}>
        ${body(selectedItem)}
      </div>
    </section>
  `;
}

function buildSkeletonRows(count, labelPrefix, selectedItem, prefix) {
  return Array.from({ length: count }, (_, index) => {
    const itemId = `${prefix}-${index + 1}`;
    const selectedClass = itemId === selectedItem ? ' is-selected' : '';
    return `
      <button type="button" class="laboratory-shell-skeleton-row${selectedClass}" data-select-item="${escapeHtml(itemId)}" aria-pressed="${itemId === selectedItem ? 'true' : 'false'}">
        <span class="laboratory-shell-skeleton-dot"></span>
        <span class="laboratory-shell-skeleton-line short"></span>
        <span class="laboratory-shell-skeleton-line long"></span>
        <span class="laboratory-shell-skeleton-tag">${escapeHtml(labelPrefix)} ${index + 1}</span>
      </button>
    `;
  }).join('');
}

function buildOverlayMarkup(overlay) {
  if (!overlay) return '';

  const tone = escapeHtml(overlay.tone ?? 'emerald');
  const kind = escapeHtml(overlay.kind ?? 'toast');
  const role = overlay.kind === 'toast' ? 'status' : 'dialog';
  const ariaModal = overlay.kind === 'toast' ? 'false' : 'true';
  const actions = overlay.actions ?? [];

  return `
    <div class="laboratory-shell-overlay-backdrop" data-overlay-action="dismiss">
      <section class="laboratory-shell-overlay tone-${tone} kind-${kind}" role="${role}" aria-modal="${ariaModal}" aria-labelledby="laboratory-shell-overlay-title">
        <header class="laboratory-shell-overlay-header">
          <div>
            <p class="laboratory-shell-kicker">${escapeHtml(overlay.kicker ?? 'Placeholder')}</p>
            <h4 class="panel-title" id="laboratory-shell-overlay-title">${escapeHtml(overlay.title)}</h4>
          </div>
          <button type="button" class="laboratory-shell-overlay-close" data-overlay-action="close" aria-label="Close overlay">×</button>
        </header>
        <div class="laboratory-shell-overlay-body">
          <p class="laboratory-shell-empty-copy">${escapeHtml(overlay.message)}</p>
        </div>
        ${actions.length > 0 ? `
          <footer class="laboratory-shell-overlay-actions">
            ${actions.map((action) => `
              <button type="button" class="laboratory-shell-overlay-button ${action.variant ? `variant-${escapeHtml(action.variant)}` : ''}" data-overlay-action="${escapeHtml(action.action)}">
                ${escapeHtml(action.label)}
              </button>
            `).join('')}
          </footer>
        ` : ''}
      </section>
    </div>
  `;
}

function buildBindingSummaryMarkup(viewModel) {
  if (!viewModel) {
    return `
      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Laboratory binding</h3>
        <p class="laboratory-shell-empty-copy">No binding layer detected. The shell remains visual-only.</p>
      </section>
    `;
  }

  const kpis = Array.isArray(viewModel.kpis) ? viewModel.kpis : [];
  const activity = Array.isArray(viewModel.recentActivity) ? viewModel.recentActivity : [];
  const commands = Array.isArray(viewModel.commands) ? viewModel.commands : [];
  const snapshotLines = [];

  if (viewModel.workspace) snapshotLines.push(`Workspace ${viewModel.workspace.workspaceId ?? '—'} · ${viewModel.workspace.status ?? 'unknown'}`);
  if (viewModel.activeExperiment) snapshotLines.push(`Experiment ${viewModel.activeExperiment.experimentId ?? '—'} · ${viewModel.activeExperiment.status ?? 'unknown'}`);
  if (viewModel.session) snapshotLines.push(`Session ${viewModel.session.sessionId ?? '—'} · ${viewModel.session.status ?? 'unknown'}`);
  if (viewModel.comparison) snapshotLines.push(`Comparison ${viewModel.comparison.comparisonId ?? '—'} · ${viewModel.comparison.comparisonType ?? 'unknown'}`);
  if (viewModel.evidence) snapshotLines.push(`Evidence ${viewModel.evidence.reportId ?? '—'} · ${viewModel.evidence.title ?? 'untitled'}`);
  if (viewModel.sessionResult) snapshotLines.push(`Session result ${viewModel.sessionResult.status ?? 'unknown'} · ${viewModel.sessionResult.durationMs ?? '—'} ms`);
  if (viewModel.preferences) snapshotLines.push(`Preferences · ${viewModel.preferences.activeViewId ?? '—'} / ${viewModel.preferences.status ?? 'unknown'}`);

  return `
    <section class="panel laboratory-shell-placeholder-card laboratory-shell-binding-card">
      <h3 class="panel-title">Laboratory binding</h3>
      <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Capa de aplicación y ViewModels consumidos por el shell')}</p>
      <div class="laboratory-shell-summary-line">
        <span><strong>View:</strong> ${escapeHtml(viewModel.viewId ?? 'unknown')}</span>
        <span><strong>Status:</strong> ${escapeHtml(viewModel.status ?? 'ready')}</span>
        <span><strong>Active:</strong> ${escapeHtml(viewModel.activeViewId ?? 'overview')}</span>
      </div>
      ${kpis.length > 0 ? `
        <div class="laboratory-shell-chip-row">
          ${kpis.map((kpi) => `
            <span class="laboratory-shell-chip-button is-active" aria-disabled="true">
              ${escapeHtml(kpi.label)}: ${escapeHtml(String(kpi.value ?? '—'))}
            </span>
          `).join('')}
        </div>
      ` : ''}
      ${snapshotLines.length > 0 ? `
        <ul class="laboratory-shell-skeleton-list">
          ${snapshotLines.map((line, index) => `
            <li class="laboratory-shell-skeleton-row${index === 0 ? ' is-selected' : ''}">
              <span class="laboratory-shell-skeleton-dot"></span>
              <span class="laboratory-shell-skeleton-line long"></span>
              <span class="laboratory-shell-skeleton-tag">${escapeHtml(line)}</span>
            </li>
          `).join('')}
        </ul>
      ` : ''}
      ${activity.length > 0 ? `
        <div class="laboratory-shell-summary-line secondary">
          <span><strong>Recent activity:</strong> ${escapeHtml(activity.slice(0, 3).map((item) => item.kind ?? 'item').join(', '))}</span>
        </div>
      ` : ''}
      ${commands.length > 0 ? `
        <div class="laboratory-shell-chip-row">
          ${commands.map((command) => `
            <span class="laboratory-shell-chip-button" aria-disabled="true">${escapeHtml(command)}</span>
          `).join('')}
        </div>
      ` : ''}
    </section>
  `;
}

function valueOrDash(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => String(item)).join(', ') : '—';
  }
  return String(value);
}

function buildDetailChips(details = []) {
  const items = (Array.isArray(details) ? details : []).filter(Boolean);
  if (items.length === 0) return '';

  return `
    <div class="laboratory-shell-chip-row">
      ${items.map((item) => `
        <span class="laboratory-shell-chip-button" aria-disabled="true">${escapeHtml(valueOrDash(item))}</span>
      `).join('')}
    </div>
  `;
}

function buildRecordCard({ itemId, selectedItem, title, subtitle, details = [], eyebrow = null }) {
  const selectedClass = itemId === selectedItem ? ' is-selected' : '';
  return `
    <button type="button" class="laboratory-shell-mini-card${selectedClass}" data-select-item="${escapeHtml(itemId)}" aria-pressed="${itemId === selectedItem ? 'true' : 'false'}">
      ${eyebrow ? `<span class="laboratory-shell-skeleton-tag">${escapeHtml(eyebrow)}</span>` : ''}
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(subtitle)}</p>
      ${buildDetailChips(details)}
    </button>
  `;
}

function buildOverviewViewMarkup(viewModel, state) {
  const kpis = Array.isArray(viewModel.kpis) ? viewModel.kpis : [];
  const activity = Array.isArray(viewModel.recentActivity) ? viewModel.recentActivity : [];
  const commands = Array.isArray(viewModel.commands) ? viewModel.commands : [];

  return `
    <div class="laboratory-shell-view-grid">
      <section class="panel laboratory-shell-placeholder-card laboratory-shell-overview-main">
        <h3 class="panel-title">${escapeHtml(viewModel.title ?? 'Overview')}</h3>
        <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Resumen del laboratorio')}</p>
        <div class="laboratory-shell-summary-line">
          <span><strong>Status:</strong> ${escapeHtml(viewModel.status ?? 'ready')}</span>
          <span><strong>Active view:</strong> ${escapeHtml(viewModel.activeViewId ?? state.activeViewId)}</span>
          <span><strong>Last command:</strong> ${escapeHtml(viewModel.lastCommandResult?.operation ?? 'none')}</span>
        </div>
        ${kpis.length > 0 ? `
          <div class="laboratory-shell-chip-row">
            ${kpis.map((kpi) => `
              <span class="laboratory-shell-chip-button is-active" aria-disabled="true">${escapeHtml(kpi.label)}: ${escapeHtml(String(kpi.value ?? '—'))}</span>
            `).join('')}
          </div>
        ` : ''}
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Recent activity</h3>
        <div class="laboratory-shell-card-stack">
          ${activity.length > 0 ? activity.map((item, index) => {
            const summary = item?.summary ?? {};
            const kind = item?.kind ?? 'item';
            const title = kind === 'experiment'
              ? `Experiment ${summary.experimentId ?? '—'}`
              : kind === 'session'
                ? `Session ${summary.sessionId ?? '—'}`
                : kind === 'comparison'
                  ? `Comparison ${summary.comparisonId ?? '—'}`
                  : kind === 'evidence'
                    ? `Evidence ${summary.reportId ?? '—'}`
                    : `Activity ${index + 1}`;
            const subtitle = kind === 'experiment'
              ? `${summary.status ?? 'unknown'} · workspace ${summary.workspaceId ?? '—'}`
              : kind === 'session'
                ? `${summary.status ?? 'unknown'} · ${summary.executionMode ?? 'unknown mode'}`
                : kind === 'comparison'
                  ? `${summary.comparisonType ?? 'comparison'} · ${summary.timestamps?.comparedAt ?? summary.comparedAt ?? 'no timestamp'}`
                  : kind === 'evidence'
                    ? `${summary.title ?? 'untitled'} · ${summary.sessions?.length ?? 0} sessions`
                    : 'Binding activity';
            const details = kind === 'experiment'
              ? [`Sessions ${summary.sessions?.length ?? 0}`, `Comparisons ${summary.comparisons?.length ?? 0}`, `Evidence ${summary.evidence?.length ?? 0}`]
              : kind === 'session'
                ? [`Modules ${summary.modules?.length ?? 0}`, `Steps ${summary.executionPlan?.length ?? 0}`, `Status ${summary.status ?? 'unknown'}`]
                : kind === 'comparison'
                  ? [`Criteria ${summary.criteria?.length ?? 0}`, `Differences ${Object.keys(summary.differences ?? {}).length}`, `Conclusions ${summary.conclusions?.length ?? 0}`]
                  : kind === 'evidence'
                    ? [`Comparisons ${summary.comparisons?.length ?? 0}`, `Observations ${summary.observations?.length ?? 0}`, `Status ${summary.metadata?.status ?? 'ready'}`]
                    : [`Kind ${kind}`];
            return buildRecordCard({
              itemId: `overview-activity-${index + 1}`,
              selectedItem: state.selectedItem,
              eyebrow: kind,
              title,
              subtitle,
              details,
            });
          }).join('') : '<p class="laboratory-shell-empty-copy">No recent activity yet.</p>'}
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Commands</h3>
        ${commands.length > 0 ? `
          <div class="laboratory-shell-chip-row">
            ${commands.map((command) => `
              <span class="laboratory-shell-chip-button" aria-disabled="true">${escapeHtml(command)}</span>
            `).join('')}
          </div>
        ` : '<p class="laboratory-shell-empty-copy">No commands available.</p>'}
      </section>
    </div>
  `;
}

function buildExperimentsViewMarkup(viewModel, state) {
  const experiments = Array.isArray(viewModel.experiments) ? viewModel.experiments : [];
  const activeExperiment = viewModel.activeExperiment ?? null;
  const workspace = viewModel.workspace ?? null;

  return `
    <div class="laboratory-shell-view-grid">
      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">${escapeHtml(viewModel.title ?? 'Experiments')}</h3>
        <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Experiments binding')}</p>
        ${buildRecordCard({
          itemId: 'experiment-active',
          selectedItem: state.selectedItem,
          eyebrow: 'active',
          title: `Experiment ${activeExperiment?.experimentId ?? '—'}`,
          subtitle: `${activeExperiment?.status ?? 'unknown'} · workspace ${activeExperiment?.workspaceId ?? workspace?.workspaceId ?? '—'}`,
          details: [
            `Hypothesis ${activeExperiment?.hypothesis ?? '—'}`,
            `Objective ${activeExperiment?.objective ?? '—'}`,
            `Sessions ${activeExperiment?.sessions?.length ?? 0}`,
            `Comparisons ${activeExperiment?.comparisons?.length ?? 0}`,
            `Evidence ${activeExperiment?.evidence?.length ?? 0}`,
          ],
        })}
        ${workspace ? `
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Workspace:</strong> ${escapeHtml(workspace.workspaceId ?? '—')}</span>
            <span><strong>Owner:</strong> ${escapeHtml(workspace.owner ?? '—')}</span>
            <span><strong>Experiments:</strong> ${escapeHtml(String(workspace.experiments?.length ?? 0))}</span>
          </div>
        ` : ''}
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Experiment list</h3>
        <div class="laboratory-shell-card-stack">
          ${experiments.length > 0 ? experiments.map((experiment, index) => buildRecordCard({
            itemId: `experiment-${experiment.experimentId ?? index + 1}`,
            selectedItem: state.selectedItem,
            eyebrow: experiment.status ?? 'unknown',
            title: experiment.experimentId ?? `Experiment ${index + 1}`,
            subtitle: `${experiment.workspaceId ?? '—'} · ${experiment.hypothesis ?? 'No hypothesis'}`,
            details: [
              `Objective ${experiment.objective ?? '—'}`,
              `Sessions ${experiment.sessions?.length ?? 0}`,
              `Comparisons ${experiment.comparisons?.length ?? 0}`,
              `Evidence ${experiment.evidence?.length ?? 0}`,
            ],
          })).join('') : '<p class="laboratory-shell-empty-copy">No experiments available in the binding snapshot.</p>'}
        </div>
      </section>
    </div>
  `;
}

function buildSessionsViewMarkup(viewModel, state) {
  const sessions = Array.isArray(viewModel.sessions) ? viewModel.sessions : [];
  const session = viewModel.session ?? null;
  const sessionResult = viewModel.sessionResult ?? null;

  return `
    <div class="laboratory-shell-view-grid">
      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">${escapeHtml(viewModel.title ?? 'Sessions')}</h3>
        <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Sessions binding')}</p>
        ${buildRecordCard({
          itemId: 'sessions-active',
          selectedItem: state.selectedItem,
          eyebrow: session?.status ?? 'active',
          title: `Session ${session?.sessionId ?? '—'}`,
          subtitle: `${session?.executionMode ?? 'unknown mode'} · ${session?.status ?? 'unknown status'}`,
          details: [
            `Modules ${session?.modules?.length ?? 0}`,
            `Plan steps ${session?.executionPlan?.length ?? 0}`,
            `Dataset ${session?.dataset?.id ?? session?.dataset?.datasetId ?? '—'}`,
          ],
        })}
        ${sessionResult ? `
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Result:</strong> ${escapeHtml(sessionResult.status ?? 'unknown')}</span>
            <span><strong>Duration:</strong> ${escapeHtml(String(sessionResult.durationMs ?? '—'))} ms</span>
            <span><strong>Errors:</strong> ${escapeHtml(String(sessionResult.errors?.length ?? 0))}</span>
          </div>
        ` : ''}
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Session timeline</h3>
        <div class="laboratory-shell-card-stack">
          ${sessions.length > 0 ? sessions.map((item, index) => buildRecordCard({
            itemId: `sessions-${item.sessionId ?? index + 1}`,
            selectedItem: state.selectedItem,
            eyebrow: item.status ?? 'unknown',
            title: item.sessionId ?? `Session ${index + 1}`,
            subtitle: `${item.executionMode ?? 'unknown mode'} · ${item.parameters ? Object.keys(item.parameters).length : 0} parameters`,
            details: [
              `Modules ${item.modules?.length ?? 0}`,
              `Steps ${item.executionPlan?.length ?? 0}`,
              `Created ${item.timestamps?.createdAt ?? item.createdAt ?? '—'}`,
            ],
          })).join('') : '<p class="laboratory-shell-empty-copy">No sessions available in the binding snapshot.</p>'}
        </div>
      </section>
    </div>
  `;
}

function buildComparisonViewMarkup(viewModel, state) {
  const comparison = viewModel.comparison ?? null;
  const comparisons = Array.isArray(viewModel.comparisons) ? viewModel.comparisons : [];
  const experiments = Array.isArray(viewModel.experiments) ? viewModel.experiments : [];
  const sessions = Array.isArray(viewModel.sessions) ? viewModel.sessions : [];
  const metrics = viewModel.metrics ?? null;
  const summary = viewModel.summary ?? null;
  const selection = viewModel.selection ?? state.comparisonSelection ?? { mode: null, selectedItems: [] };
  const selectedItems = Array.isArray(selection.selectedItems) ? selection.selectedItems : [];
  const selectedItemIds = new Set(selectedItems.map((item) => `${item.itemKind}:${item.itemId}`));
  const comparisonItems = selectedItems.map((item) => `${item.itemKind} ${item.itemId}`).join(', ');
  const metricKeys = Array.isArray(comparison?.metricKeys) ? comparison.metricKeys : [];
  const differenceKeys = Array.isArray(comparison?.differenceKeys) ? comparison.differenceKeys : [];
  const sessionIds = Array.isArray(comparison?.sessionIds) ? comparison.sessionIds : [];
  const selectionStatus = selection.status ?? (selectedItems.length < 2 ? 'insufficient-selection' : 'ready');

  const renderSelectableCard = ({ itemId, itemKind, eyebrow, title, subtitle, details }) => {
    const selectionKey = `${itemKind}:${itemId}`;
    const isSelected = selectedItemIds.has(selectionKey);
    return `
      <button type="button" class="laboratory-shell-mini-card${isSelected ? ' is-selected' : ''}" data-select-item="${escapeHtml(itemId)}" data-item-kind="${escapeHtml(itemKind)}" aria-pressed="${isSelected ? 'true' : 'false'}">
        <span class="laboratory-shell-skeleton-tag">${escapeHtml(eyebrow)}</span>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(subtitle)}</p>
        <div class="laboratory-shell-summary-line secondary">
          ${details.map((detail) => `<span>${escapeHtml(detail)}</span>`).join('')}
        </div>
      </button>
    `;
  };

  return `
    <div class="laboratory-shell-view-grid">
      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">${escapeHtml(viewModel.title ?? 'Comparison')}</h3>
        <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Comparison binding')}</p>
        <div class="laboratory-shell-summary-line">
          <span><strong>Status:</strong> ${escapeHtml(viewModel.status ?? 'ready')}</span>
          <span><strong>Selection:</strong> ${escapeHtml(selectionStatus)}</span>
          <span><strong>Selected items:</strong> ${escapeHtml(String(selectedItems.length))}</span>
          <span><strong>Comparison items:</strong> ${escapeHtml(String(comparisonItems ? selectedItems.length : comparisons.length))}</span>
        </div>
        ${summary ? `
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Summary:</strong> ${escapeHtml(summary.state ?? viewModel.status ?? 'ready')}</span>
            <span><strong>Matched:</strong> ${escapeHtml(String(summary.similarityCount ?? summary.matches ?? '—'))}</span>
            <span><strong>Differences:</strong> ${escapeHtml(String(summary.differenceCount ?? summary.differences ?? '—'))}</span>
          </div>
        ` : ''}
        ${metrics ? `
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Metric comparator:</strong> ${escapeHtml(metrics.comparator?.name ?? metrics.comparator ?? '—')}</span>
            <span><strong>Metric aggregate:</strong> ${escapeHtml(metrics.aggregate?.name ?? metrics.aggregate ?? '—')}</span>
            <span><strong>Metric decision:</strong> ${escapeHtml(metrics.decision?.name ?? metrics.decision ?? '—')}</span>
          </div>
        ` : ''}
        <div class="laboratory-shell-chip-row">
          <button type="button" class="laboratory-shell-chip-button" data-refresh-comparison="true">Refresh comparison</button>
          <button type="button" class="laboratory-shell-chip-button" data-clear-selection="true">Clear selection</button>
          ${viewModel.lastError ? '<button type="button" class="laboratory-shell-chip-button" data-refresh-comparison="true">Retry comparison</button>' : ''}
        </div>
        ${viewModel.loading ? '<p class="laboratory-shell-empty-copy">Loading comparison snapshot…</p>' : ''}
        ${viewModel.lastError ? `
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Error:</strong> ${escapeHtml(typeof viewModel.lastError === 'string' ? viewModel.lastError : 'comparison unavailable')}</span>
          </div>
        ` : ''}
        ${comparison ? `
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Session IDs:</strong> ${escapeHtml(sessionIds.length > 0 ? sessionIds.join(', ') : '—')}</span>
            <span><strong>Metrics:</strong> ${escapeHtml(metricKeys.length > 0 ? metricKeys.join(', ') : '—')}</span>
            <span><strong>Differences:</strong> ${escapeHtml(differenceKeys.length > 0 ? differenceKeys.join(', ') : '—')}</span>
          </div>
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Compared:</strong> ${escapeHtml(comparison.timestamps?.comparedAt ?? '—')}</span>
            <span><strong>Criteria:</strong> ${escapeHtml(String(comparison.criteriaCount ?? comparison.criteria?.length ?? 0))}</span>
            <span><strong>Decision:</strong> ${escapeHtml(comparison.metrics?.decision ?? comparison.decision ?? '—')}</span>
          </div>
        ` : '<p class="laboratory-shell-empty-copy">No comparison selected in the binding snapshot.</p>'}
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Selection targets</h3>
        <p class="laboratory-shell-empty-copy">Selecciona dos experimentos o dos sesiones para componer la comparación local del shell.</p>
        <div class="laboratory-shell-card-stack">
          <section class="panel laboratory-shell-placeholder-card">
            <h4 class="panel-title">Experiments</h4>
            <div class="laboratory-shell-card-stack">
              ${experiments.length > 0 ? experiments.map((item, index) => renderSelectableCard({
                itemId: item.experimentId ?? `experiment-${index + 1}`,
                itemKind: 'experiment',
                eyebrow: item.status ?? 'unknown',
                title: item.experimentId ?? `Experiment ${index + 1}`,
                subtitle: item.objective ?? item.hypothesis ?? 'Experiment snapshot',
                details: [
                  `Sessions ${item.sessions?.length ?? 0}`,
                  `Comparisons ${item.comparisons?.length ?? 0}`,
                  `Evidence ${item.evidence?.length ?? 0}`,
                ],
              })).join('') : '<p class="laboratory-shell-empty-copy">No experiments available in the binding snapshot.</p>'}
            </div>
          </section>
          <section class="panel laboratory-shell-placeholder-card">
            <h4 class="panel-title">Sessions</h4>
            <div class="laboratory-shell-card-stack">
              ${sessions.length > 0 ? sessions.map((item, index) => renderSelectableCard({
                itemId: item.sessionId ?? `session-${index + 1}`,
                itemKind: 'session',
                eyebrow: item.status ?? 'unknown',
                title: item.sessionId ?? `Session ${index + 1}`,
                subtitle: item.executionMode ?? 'Session snapshot',
                details: [
                  `Modules ${item.modules?.length ?? 0}`,
                  `Steps ${item.executionPlan?.length ?? 0}`,
                  `Status ${item.status ?? 'unknown'}`,
                ],
              })).join('') : '<p class="laboratory-shell-empty-copy">No sessions available in the binding snapshot.</p>'}
            </div>
          </section>
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Active selection</h3>
        <div class="laboratory-shell-chip-row">
          ${selectedItems.length > 0 ? selectedItems.map((item) => `
            <button type="button" class="laboratory-shell-chip-button is-active" data-remove-item="${escapeHtml(item.itemId)}" data-item-kind="${escapeHtml(item.itemKind)}">
              ${escapeHtml(item.itemKind)} · ${escapeHtml(item.itemId)}
            </button>
          `).join('') : '<span class="laboratory-shell-chip-button" aria-disabled="true">No items selected</span>'}
        </div>
        <div class="laboratory-shell-summary-line secondary">
          <span><strong>Mode:</strong> ${escapeHtml(selection.mode ?? 'none')}</span>
          <span><strong>Selection status:</strong> ${escapeHtml(selectionStatus)}</span>
          <span><strong>Ready:</strong> ${escapeHtml(selectedItems.length >= 2 ? 'yes' : 'no')}</span>
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Comparison history</h3>
        <div class="laboratory-shell-card-stack">
          ${comparisons.length > 0 ? comparisons.map((item, index) => buildRecordCard({
            itemId: `comparison-${item.comparisonId ?? index + 1}`,
            selectedItem: state.selectedItem,
            eyebrow: item.comparisonType ?? 'comparison',
            title: item.comparisonId ?? `Comparison ${index + 1}`,
            subtitle: `${item.sessionIds?.length ?? 0} sessions · ${item.criteriaCount ?? 0} criteria`,
            details: [
              `Metrics ${item.metricKeys?.length ?? 0}`,
              `Differences ${item.differenceKeys?.length ?? 0}`,
              `Compared ${item.timestamps?.comparedAt ?? '—'}`,
            ],
          })).join('') : '<p class="laboratory-shell-empty-copy">No comparisons available in the binding snapshot.</p>'}
        </div>
      </section>
    </div>
  `;
}

function buildEvidenceViewMarkup(viewModel, state) {
  const reports = Array.isArray(viewModel.reports) ? viewModel.reports : [];
  const selectedReportId = viewModel.selection?.selectedReportId ?? state.selectedItem ?? null;
  const searchQuery = String(state.searchQuery ?? '').trim().toLowerCase();
  const filterId = state.evidenceFilter ?? 'all';
  const visibleReports = reports.filter((report) => {
    const haystack = `${report.reportId ?? ''} ${report.title ?? ''}`.toLowerCase();
    const matchesSearch = !searchQuery || haystack.includes(searchQuery);
    const matchesFilter = filterId === 'all'
      || (filterId === 'comparisons' && (report.comparisonsCount ?? 0) > 0)
      || (filterId === 'sessions' && (report.sessionsCount ?? 0) > 0)
      || (filterId === 'results' && (report.resultsCount ?? 0) > 0)
      || (filterId === 'observations' && (report.observationsCount ?? 0) > 0);
    return matchesSearch && matchesFilter;
  });
  const selectedReport = visibleReports.find((report) => report.reportId === selectedReportId)
    ?? reports.find((report) => report.reportId === selectedReportId)
    ?? visibleReports[0]
    ?? reports[0]
    ?? null;

  const renderReportCard = (report, index) => {
    const itemId = report.reportId ?? `report-${index + 1}`;
    const isSelected = itemId === selectedReportId;
    return `
      <button type="button" class="laboratory-shell-mini-card${isSelected ? ' is-selected' : ''}" data-select-item="${escapeHtml(itemId)}" data-item-kind="evidence" aria-pressed="${isSelected ? 'true' : 'false'}">
        <span class="laboratory-shell-skeleton-tag">${escapeHtml(report.generatedAt ? 'generated' : 'snapshot')}</span>
        <strong>${escapeHtml(report.title ?? itemId)}</strong>
        <p>${escapeHtml(report.reportId ?? 'Unnamed evidence report')}</p>
        <div class="laboratory-shell-summary-line secondary">
          <span>${escapeHtml(String(report.comparisonsCount ?? 0))} comparisons</span>
          <span>${escapeHtml(String(report.sessionsCount ?? 0))} sessions</span>
          <span>${escapeHtml(String(report.resultsCount ?? 0))} results</span>
          <span>${escapeHtml(String(report.observationsCount ?? 0))} observations</span>
        </div>
      </button>
    `;
  };

  const selectedDetails = selectedReport ? [
    `Comparisons ${selectedReport.comparisonsCount ?? 0}`,
    `Sessions ${selectedReport.sessionsCount ?? 0}`,
    `Results ${selectedReport.resultsCount ?? 0}`,
    `Observations ${selectedReport.observationsCount ?? 0}`,
  ] : [];

  return `
    <div class="laboratory-shell-view-grid">
      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">${escapeHtml(viewModel.title ?? 'Evidence')}</h3>
        <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Evidence binding')}</p>
        <div class="laboratory-shell-summary-line">
          <span><strong>Reports:</strong> ${escapeHtml(String(viewModel.summary?.reportCount ?? reports.length))}</span>
          <span><strong>Visible:</strong> ${escapeHtml(String(visibleReports.length))}</span>
          <span><strong>Filter:</strong> ${escapeHtml(filterId)}</span>
          <span><strong>Search:</strong> ${escapeHtml(state.searchQuery || 'empty')}</span>
        </div>
        <div class="laboratory-shell-chip-row">
          <button type="button" class="laboratory-shell-chip-button" data-refresh-evidence="true">Refresh evidence</button>
          <button type="button" class="laboratory-shell-chip-button" data-clear-evidence-selection="true">Clear selection</button>
          <button type="button" class="laboratory-shell-chip-button${filterId === 'all' ? ' is-active' : ''}" data-evidence-filter="all">All</button>
          <button type="button" class="laboratory-shell-chip-button${filterId === 'comparisons' ? ' is-active' : ''}" data-evidence-filter="comparisons">Comparisons</button>
          <button type="button" class="laboratory-shell-chip-button${filterId === 'sessions' ? ' is-active' : ''}" data-evidence-filter="sessions">Sessions</button>
          <button type="button" class="laboratory-shell-chip-button${filterId === 'results' ? ' is-active' : ''}" data-evidence-filter="results">Results</button>
          <button type="button" class="laboratory-shell-chip-button${filterId === 'observations' ? ' is-active' : ''}" data-evidence-filter="observations">Observations</button>
        </div>
        ${selectedReport ? `
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Selected:</strong> ${escapeHtml(selectedReport.reportId ?? '—')}</span>
            <span><strong>Generated:</strong> ${escapeHtml(selectedReport.generatedAt ?? '—')}</span>
            <span><strong>Metrics:</strong> ${escapeHtml(selectedDetails.join(' · ') || '—')}</span>
          </div>
        ` : '<p class="laboratory-shell-empty-copy">No evidence selected in the binding snapshot.</p>'}
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Evidence reports</h3>
        <div class="laboratory-shell-card-stack">
          ${visibleReports.length > 0 ? visibleReports.map((report, index) => renderReportCard(report, index)).join('') : '<p class="laboratory-shell-empty-copy">No evidence reports match the current search/filter state.</p>'}
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Detail view</h3>
        ${selectedReport ? `
          <div class="laboratory-shell-summary-line">
            <span><strong>Report:</strong> ${escapeHtml(selectedReport.reportId ?? '—')}</span>
            <span><strong>Title:</strong> ${escapeHtml(selectedReport.title ?? '—')}</span>
          </div>
          <div class="laboratory-shell-summary-line secondary">
            ${selectedDetails.map((detail) => `<span>${escapeHtml(detail)}</span>`).join('')}
          </div>
        ` : '<p class="laboratory-shell-empty-copy">Select a report to inspect its evidence summary.</p>'}
      </section>
    </div>
  `;
}

function buildReplayViewMarkup(viewModel, state) {
  const replays = Array.isArray(viewModel.replays) ? viewModel.replays : [];
  const timeline = Array.isArray(viewModel.timeline) ? viewModel.timeline : [];
  const selectedEventId = state.selectedItem ?? viewModel.selectedEvent?.eventId ?? null;
  const selectedEvent = timeline.find((event) => event.eventId === selectedEventId)
    ?? viewModel.selectedEvent
    ?? timeline[0]
    ?? null;
  const controls = viewModel.controls ?? {};
  const related = viewModel.related ?? {};

  const renderTimelineEvent = (event, index) => {
    const isSelected = event.eventId === selectedEventId;
    return `
      <button type="button" class="laboratory-shell-timeline-step${isSelected ? ' is-selected' : ''}" data-select-item="${escapeHtml(event.eventId)}" data-item-kind="replay-event" aria-pressed="${isSelected ? 'true' : 'false'}">
        <span class="laboratory-shell-timeline-dot"></span>
        <div>
          <strong>${escapeHtml(event.label ?? event.type ?? `Event ${index + 1}`)}</strong>
          <p>${escapeHtml(event.type ?? 'event')} · ${escapeHtml(event.occurredAt ?? '—')}</p>
          <div class="laboratory-shell-summary-line secondary">
            <span>${escapeHtml(`Step ${event.step ?? index + 1}`)}</span>
            <span>${escapeHtml(event.metadata?.operation ?? event.metadata?.action ?? 'No operation metadata')}</span>
          </div>
        </div>
      </button>
    `;
  };

  const renderReplaySource = (source, index) => {
    const isSelected = source.replayId === viewModel.replayId;
    return `
      <button type="button" class="laboratory-shell-chip-button${isSelected ? ' is-active' : ''}" data-select-replay="${escapeHtml(source.replayId)}" aria-pressed="${isSelected ? 'true' : 'false'}">
        ${escapeHtml(source.label ?? source.replayId ?? `Replay ${index + 1}`)}
      </button>
    `;
  };

  return `
    <div class="laboratory-shell-view-grid">
      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">${escapeHtml(viewModel.title ?? 'Replay')}</h3>
        <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Replay binding')}</p>
        <div class="laboratory-shell-summary-line">
          <span><strong>Replay:</strong> ${escapeHtml(String(viewModel.replayId ?? 'replay-events'))}</span>
          <span><strong>Source:</strong> ${escapeHtml(String(viewModel.source ?? 'events'))}</span>
          <span><strong>Step:</strong> ${escapeHtml(`${viewModel.currentStep ?? 0} of ${viewModel.totalSteps ?? 0}`)}</span>
          <span><strong>State:</strong> ${escapeHtml(viewModel.playbackState ?? 'ready')}</span>
        </div>
        <div class="laboratory-shell-chip-row" role="toolbar" aria-label="Replay controls">
          <button type="button" class="laboratory-shell-chip-button" data-replay-action="play" ${controls.canPlay === false ? 'disabled' : ''}>Play</button>
          <button type="button" class="laboratory-shell-chip-button" data-replay-action="pause" ${controls.canPause === false ? 'disabled' : ''}>Pause</button>
          <button type="button" class="laboratory-shell-chip-button" data-replay-action="stop" ${controls.canStop === false ? 'disabled' : ''}>Stop</button>
          <button type="button" class="laboratory-shell-chip-button" data-replay-action="step-backward" ${controls.canStepBackward === false ? 'disabled' : ''}>Step Backward</button>
          <button type="button" class="laboratory-shell-chip-button" data-replay-action="step-forward" ${controls.canStepForward === false ? 'disabled' : ''}>Step Forward</button>
          <button type="button" class="laboratory-shell-chip-button" data-replay-action="beginning" ${controls.canSeek === false ? 'disabled' : ''}>Go To Beginning</button>
          <button type="button" class="laboratory-shell-chip-button" data-replay-action="end" ${controls.canSeek === false ? 'disabled' : ''}>Go To End</button>
        </div>
        <div class="laboratory-shell-summary-line secondary">
          <span><strong>Timestamp:</strong> ${escapeHtml(viewModel.timestamp ?? '—')}</span>
          <span><strong>Playback:</strong> ${escapeHtml(viewModel.playbackState ?? 'ready')}</span>
          <span><strong>Events:</strong> ${escapeHtml(String(viewModel.metadata?.eventCount ?? timeline.length))}</span>
          <span><strong>Sources:</strong> ${escapeHtml(String(viewModel.metadata?.sourceCount ?? replays.length))}</span>
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Replay sources</h3>
        <div class="laboratory-shell-chip-row">
          ${replays.length > 0 ? replays.map((source, index) => renderReplaySource(source, index)).join('') : '<span class="laboratory-shell-chip-button" aria-disabled="true">No replay sources</span>'}
        </div>
        <div class="laboratory-shell-summary-line secondary">
          <span><strong>Last event:</strong> ${escapeHtml(viewModel.metadata?.lastEventType ?? '—')}</span>
          <span><strong>Selected event:</strong> ${escapeHtml(selectedEvent?.eventId ?? '—')}</span>
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Timeline</h3>
        <div class="laboratory-shell-timeline">
          ${timeline.length > 0 ? timeline.map((event, index) => renderTimelineEvent(event, index)).join('') : '<p class="laboratory-shell-empty-copy">No replay timeline is available in the binding snapshot.</p>'}
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Detail view</h3>
        ${selectedEvent ? `
          <div class="laboratory-shell-summary-line">
            <span><strong>Event:</strong> ${escapeHtml(selectedEvent.eventId ?? '—')}</span>
            <span><strong>Type:</strong> ${escapeHtml(selectedEvent.type ?? '—')}</span>
            <span><strong>Step:</strong> ${escapeHtml(String(selectedEvent.step ?? 0))}</span>
          </div>
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Experiment:</strong> ${escapeHtml(related.experiment?.experimentId ?? '—')}</span>
            <span><strong>Session:</strong> ${escapeHtml(related.session?.sessionId ?? '—')}</span>
            <span><strong>Comparison:</strong> ${escapeHtml(related.comparison?.comparisonId ?? '—')}</span>
            <span><strong>Evidence:</strong> ${escapeHtml(related.evidence?.reportId ?? '—')}</span>
          </div>
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Metadata:</strong> ${escapeHtml(selectedEvent.metadata?.operation ?? selectedEvent.metadata?.action ?? '—')}</span>
            <span><strong>Payload keys:</strong> ${escapeHtml(Object.keys(selectedEvent.payload ?? {}).length > 0 ? Object.keys(selectedEvent.payload).join(', ') : '—')}</span>
          </div>
        ` : '<p class="laboratory-shell-empty-copy">Select a replay event to inspect its details.</p>'}
      </section>
    </div>
  `;
}

function buildAiResearchViewMarkup(viewModel, state) {
  const context = viewModel.context ?? {};
  const selections = context.selections ?? viewModel.selections ?? {};
  const response = viewModel.response ?? null;
  const contextSections = Array.isArray(context.sections) ? context.sections : [];
  const contextPreview = Array.isArray(context.previewLines)
    ? context.previewLines
    : (typeof context.preview === 'string' && context.preview.length > 0 ? [context.preview] : []);
  const validationErrors = Array.isArray(viewModel.validationErrors) ? viewModel.validationErrors : [];
  const selectedQuery = viewModel.query ?? state.selectedItem ?? '';
  const scope = viewModel.scope ?? { kind: 'current-experiment', label: 'Current experiment' };
  const renderContextItem = (item, index, sectionId) => {
    const itemKind = item.itemKind ?? item.kind ?? sectionId;
    return `
      <button type="button" class="laboratory-shell-mini-card" data-select-item="${escapeHtml(item.id ?? `${sectionId}-${index + 1}`)}" data-item-kind="${escapeHtml(itemKind)}">
        <strong>${escapeHtml(item.label ?? item.id ?? `Item ${index + 1}`)}</strong>
        <p>${escapeHtml(item.detail ?? item.summary ?? item.description ?? 'No detail available')}</p>
      </button>
    `;
  };

  return `
    <div class="laboratory-shell-view-grid">
      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">AI research workspace</h3>
        <p class="laboratory-shell-empty-copy">${escapeHtml(viewModel.subtitle ?? 'Context builder, provider boundary and draft response area.')}</p>
        <div class="laboratory-shell-summary-line">
          <span><strong>Query:</strong> ${escapeHtml(selectedQuery || 'No query set')}</span>
          <span><strong>Scope:</strong> ${escapeHtml(scope.label ?? scope.kind ?? 'Current experiment')}</span>
          <span><strong>Status:</strong> ${escapeHtml(viewModel.status ?? 'idle')}</span>
          <span><strong>Provider:</strong> ${escapeHtml(response?.providerId ?? viewModel.providerId ?? 'local-research-provider')}</span>
        </div>
        <div class="laboratory-shell-chip-row" role="toolbar" aria-label="AI research actions">
          <button type="button" class="laboratory-shell-chip-button" data-toolbar-action="build-research-context">Build context</button>
          <button type="button" class="laboratory-shell-chip-button" data-toolbar-action="execute-research">Execute draft</button>
          <button type="button" class="laboratory-shell-chip-button" data-toolbar-action="cancel-research">Cancel</button>
          <button type="button" class="laboratory-shell-chip-button" data-toolbar-action="reset-research">Reset</button>
        </div>
        <div class="laboratory-shell-chip-row" aria-label="AI research scope shortcuts">
          <button type="button" class="laboratory-shell-chip-button${scope.kind === 'current-experiment' ? ' is-active' : ''}" data-select-item="ai-scope-current" data-item-kind="scope">Current experiment</button>
          <button type="button" class="laboratory-shell-chip-button${scope.kind === 'selected-session' ? ' is-active' : ''}" data-select-item="ai-scope-session" data-item-kind="scope">Selected session</button>
          <button type="button" class="laboratory-shell-chip-button${scope.kind === 'comparison-window' ? ' is-active' : ''}" data-select-item="ai-scope-comparison" data-item-kind="scope">Comparison window</button>
        </div>
        ${validationErrors.length > 0 ? `
          <div class="laboratory-shell-summary-line secondary">
            ${validationErrors.map((error) => `<span>${escapeHtml(error)}</span>`).join('')}
          </div>
        ` : ''}
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Context sources</h3>
        <div class="laboratory-shell-chip-row">
          <button type="button" class="laboratory-shell-chip-button${Array.isArray(selections.selectedEventIds) && selections.selectedEventIds.length > 0 ? ' is-active' : ''}" data-select-item="ai-context-timeline" data-item-kind="timeline">Timeline</button>
          <button type="button" class="laboratory-shell-chip-button${Array.isArray(selections.selectedEvidenceIds) && selections.selectedEvidenceIds.length > 0 ? ' is-active' : ''}" data-select-item="ai-context-evidence" data-item-kind="evidence">Evidence</button>
          <button type="button" class="laboratory-shell-chip-button${selections.selectedComparisonId ? ' is-active' : ''}" data-select-item="ai-context-comparison" data-item-kind="comparison">Comparison</button>
          <button type="button" class="laboratory-shell-chip-button${selections.selectedReplayId ? ' is-active' : ''}" data-select-item="ai-context-replay" data-item-kind="replay">Replay</button>
        </div>
        <div class="laboratory-shell-summary-line secondary">
          <span><strong>Context budget:</strong> ${escapeHtml(String(context.totals?.estimatedCharacters ?? '—'))}</span>
          <span><strong>Truncated:</strong> ${escapeHtml(context.truncated ? 'yes' : 'no')}</span>
          <span><strong>Selected events:</strong> ${escapeHtml(String((selections.selectedEventIds ?? []).length))}</span>
          <span><strong>Selected evidence:</strong> ${escapeHtml(String((selections.selectedEvidenceIds ?? []).length))}</span>
        </div>
        <div class="laboratory-shell-card-stack">
          ${contextSections.length > 0 ? contextSections.map((section) => `
            <section class="panel laboratory-shell-placeholder-card">
              <h4 class="panel-title">${escapeHtml(section.title ?? section.id ?? 'Context')}</h4>
              <p class="laboratory-shell-empty-copy">${escapeHtml(section.summary ?? 'Structured research context')}</p>
              <div class="laboratory-shell-card-stack">
                ${(section.items ?? []).length > 0 ? section.items.map((item, index) => renderContextItem(item, index, section.id ?? 'context')).join('') : '<p class="laboratory-shell-empty-copy">No items selected for this section.</p>'}
              </div>
            </section>
          `).join('') : '<p class="laboratory-shell-empty-copy">No context has been built yet.</p>'}
        </div>
      </section>

      <section class="panel laboratory-shell-placeholder-card">
        <h3 class="panel-title">Response draft</h3>
        ${response ? `
          <div class="laboratory-shell-summary-line">
            <span><strong>Summary:</strong> ${escapeHtml(response.summary ?? '—')}</span>
          </div>
          <p class="laboratory-shell-empty-copy">${escapeHtml(response.answer ?? 'No answer available')}</p>
          <div class="laboratory-shell-summary-line secondary">
            <span><strong>Mode:</strong> ${escapeHtml(response.mode ?? '—')}</span>
            <span><strong>Generated:</strong> ${escapeHtml(response.generatedAt ?? '—')}</span>
            <span><strong>Highlights:</strong> ${escapeHtml(String(Array.isArray(response.highlights) ? response.highlights.length : 0))}</span>
          </div>
          <div class="laboratory-shell-card-stack">
            ${(response.highlights ?? []).map((item) => `
              <button type="button" class="laboratory-shell-mini-card" data-select-item="${escapeHtml(item.itemId ?? item.label ?? 'highlight')}" data-item-kind="${escapeHtml(item.sectionId ?? 'context')}">
                <strong>${escapeHtml(item.label ?? item.itemId ?? 'Highlight')}</strong>
                <p>${escapeHtml(item.detail ?? 'Referenced from the generated response')}</p>
              </button>
            `).join('')}
          </div>
        ` : `
          <p class="laboratory-shell-empty-copy">Use the context controls to build a draft and execute it against the current laboratory snapshot.</p>
          ${contextPreview.length > 0 ? `<div class="laboratory-shell-summary-line secondary">${contextPreview.map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</div>` : ''}
        `}
      </section>
    </div>
  `;
}

function buildViewMarkup(view, state, bindingViewModel = null) {
  const summaryLine = `View: ${view.title} · Item: ${state.selectedItem || 'none'} · Search: ${state.searchQuery || 'empty'} · Sort: ${state.sortMode}`;

  switch (view.id) {
    case 'experiments':
      if (bindingViewModel) {
        return buildExperimentsViewMarkup(bindingViewModel, state);
      }
      return `
        <div class="laboratory-shell-view-grid">
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Experiment launcher</h3>
            <p class="laboratory-shell-empty-copy">${escapeHtml(summaryLine)}. Placeholder para definir lotes, hipótesis y ejecuciones futuras.</p>
            <div class="laboratory-shell-chip-row">
              <button type="button" class="laboratory-shell-chip-button ${state.selectedItem === 'experiment-launcher' ? 'is-active' : ''}" data-select-item="experiment-launcher">Draft</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="experiment-queue">Queued</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="experiment-visual">Visual only</button>
            </div>
          </section>
          ${buildToggleGroup({
            id: 'experiment-snapshots',
            title: 'Experiment snapshots',
            summary: 'Tarjetas placeholder listas para los próximos experimentos.',
            expanded: state.expandedGroups.has('experiment-snapshots'),
            selectedItem: state.selectedItem,
            body: (selectedItem) => `
              <ul class="laboratory-shell-skeleton-list">
                ${buildSkeletonRows(4, 'Experiment', selectedItem, 'experiment-row')}
              </ul>
            `,
          })}
        </div>
      `;
    case 'sessions':
      if (bindingViewModel) {
        return buildSessionsViewMarkup(bindingViewModel, state);
      }
      return `
        <div class="laboratory-shell-view-grid">
          ${buildToggleGroup({
            id: 'sessions-timeline',
            title: 'Sessions timeline',
            summary: 'Línea temporal visual para ciclos y sesiones.',
            expanded: state.expandedGroups.has('sessions-timeline'),
            selectedItem: state.selectedItem,
            body: (selectedItem) => `
              <div class="laboratory-shell-timeline">
                <button type="button" class="laboratory-shell-timeline-step${selectedItem === 'sessions-step-1' ? ' is-selected' : ''}" data-select-item="sessions-step-1">
                  <span class="laboratory-shell-timeline-dot"></span>
                  <div>
                    <strong>Session scaffold</strong>
                    <p>Placeholder para la línea temporal de sesiones.</p>
                  </div>
                </button>
                <button type="button" class="laboratory-shell-timeline-step${selectedItem === 'sessions-step-2' ? ' is-selected' : ''}" data-select-item="sessions-step-2">
                  <span class="laboratory-shell-timeline-dot"></span>
                  <div>
                    <strong>Run artifacts</strong>
                    <p>Sin datos reales, solo estructura visual.</p>
                  </div>
                </button>
                <button type="button" class="laboratory-shell-timeline-step${selectedItem === 'sessions-step-3' ? ' is-selected' : ''}" data-select-item="sessions-step-3">
                  <span class="laboratory-shell-timeline-dot"></span>
                  <div>
                    <strong>Session notes</strong>
                    <p>Preparado para C.4 sin rediseño.</p>
                  </div>
                </button>
              </div>
            `,
          })}
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Session list</h3>
            <ul class="laboratory-shell-skeleton-list">
              ${buildSkeletonRows(5, 'Session', state.selectedItem, 'session-row')}
            </ul>
          </section>
        </div>
      `;
    case 'comparison':
      if (bindingViewModel) {
        return buildComparisonViewMarkup(bindingViewModel, state);
      }
      return `
        <div class="laboratory-shell-view-grid">
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Comparison matrix</h3>
            <div class="laboratory-shell-matrix" role="table" aria-label="Comparison matrix placeholder">
              <div class="laboratory-shell-matrix-row header" role="row">
                <span role="columnheader">A</span>
                <span role="columnheader">B</span>
                <span role="columnheader">C</span>
                <span role="columnheader">D</span>
              </div>
              ${Array.from({ length: 3 }, (_, row) => `
                <button type="button" class="laboratory-shell-matrix-row${state.selectedItem === `comparison-row-${row + 1}` ? ' is-selected' : ''}" role="row" data-select-item="comparison-row-${row + 1}">
                  <span role="cell">${row + 1}</span>
                  <span role="cell">${row + 2}</span>
                  <span role="cell">${row + 3}</span>
                  <span role="cell">${row + 4}</span>
                </button>
              `).join('')}
            </div>
          </section>
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Comparison notes</h3>
            <p class="laboratory-shell-empty-copy">Solo selección visual y contenedores preparados para la futura comparación real.</p>
            <div class="laboratory-shell-chip-row">
              <button type="button" class="laboratory-shell-chip-button" data-select-item="comparison-base">Base</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="comparison-diff">Diff</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="comparison-outcome">Outcome</button>
            </div>
          </section>
        </div>
      `;
    case 'evidence':
      if (bindingViewModel) {
        return buildEvidenceViewMarkup(bindingViewModel, state);
      }
      return `
        <div class="laboratory-shell-view-grid">
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Evidence cards</h3>
            <div class="laboratory-shell-card-stack">
              <button type="button" class="laboratory-shell-mini-card${state.selectedItem === 'evidence-trace' ? ' is-selected' : ''}" data-select-item="evidence-trace">
                <strong>Trace bundle</strong>
                <p>Placeholder para reportes, capturas y trazabilidad.</p>
              </button>
              <button type="button" class="laboratory-shell-mini-card${state.selectedItem === 'evidence-feed' ? ' is-selected' : ''}" data-select-item="evidence-feed">
                <strong>Evidence feed</strong>
                <p>Infraestructura visual lista para C.5.</p>
              </button>
            </div>
          </section>
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Evidence list</h3>
            <ul class="laboratory-shell-skeleton-list">
              ${buildSkeletonRows(4, 'Evidence', state.selectedItem, 'evidence-row')}
            </ul>
          </section>
        </div>
      `;
    case 'replay':
      if (bindingViewModel) {
        return buildReplayViewMarkup(bindingViewModel, state);
      }
      return `
        <div class="laboratory-shell-view-grid">
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Replay lane</h3>
            <div class="laboratory-shell-replay-track" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <p class="laboratory-shell-empty-copy">Reproducción visual preparada, sin motor ni datos.</p>
            <button type="button" class="laboratory-shell-chip-button" data-select-item="replay-lane">Select lane</button>
          </section>
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Replay steps</h3>
            <ul class="laboratory-shell-skeleton-list">
              ${buildSkeletonRows(3, 'Replay', state.selectedItem, 'replay-row')}
            </ul>
          </section>
        </div>
      `;
    case 'ai-research':
      if (bindingViewModel) {
        return buildAiResearchViewMarkup(bindingViewModel, state);
      }
      return `
        <div class="laboratory-shell-view-grid">
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">AI research workspace</h3>
            <p class="laboratory-shell-empty-copy">Zona reservada para investigación asistida. En esta fase permanece vacía.</p>
            <div class="laboratory-shell-chip-row">
              <button type="button" class="laboratory-shell-chip-button" data-select-item="ai-prompt">Prompt</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="ai-context">Context</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="ai-draft">Draft</button>
            </div>
          </section>
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Safety boundary</h3>
            <p class="laboratory-shell-empty-copy">No consume datos, no invoca IA y no expone contenido real.</p>
          </section>
        </div>
      `;
    case 'settings':
      return `
        <div class="laboratory-shell-view-grid">
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Settings scaffold</h3>
            <div class="laboratory-shell-settings-grid">
              <button type="button" class="laboratory-shell-setting-pill${state.selectedItem === 'settings-theme' ? ' is-selected' : ''}" data-select-item="settings-theme">
                <span>Theme</span>
                <strong>Visual placeholder</strong>
              </button>
              <button type="button" class="laboratory-shell-setting-pill${state.selectedItem === 'settings-scope' ? ' is-selected' : ''}" data-select-item="settings-scope">
                <span>Scope</span>
                <strong>Shell only</strong>
              </button>
              <button type="button" class="laboratory-shell-setting-pill${state.selectedItem === 'settings-status' ? ' is-selected' : ''}" data-select-item="settings-status">
                <span>Status</span>
                <strong>No actions</strong>
              </button>
              <button type="button" class="laboratory-shell-setting-pill${state.selectedItem === 'settings-access' ? ' is-selected' : ''}" data-select-item="settings-access">
                <span>Access</span>
                <strong>Visual navigation</strong>
              </button>
            </div>
          </section>
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Preset bundles</h3>
            <div class="laboratory-shell-chip-row">
              <button type="button" class="laboratory-shell-chip-button" data-select-item="settings-desktop">Desktop</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="settings-laptop">Laptop</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="settings-tablet">Tablet</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="settings-mobile">Mobile</button>
            </div>
          </section>
        </div>
      `;
    case 'overview':
      if (bindingViewModel) {
        return buildOverviewViewMarkup(bindingViewModel, state);
      }
    default:
      return `
        <div class="laboratory-shell-overview-grid">
          ${buildMetricCard('Workspace', 'LaboratoryShell', 'Estructura visual base', 'overview-canvas', state.selectedItem)}
          ${buildMetricCard('Header', 'Visible', 'Título, subtítulo y breadcrumb', 'overview-header', state.selectedItem)}
          ${buildMetricCard('Sidebar', state.sidebarCollapsed ? 'Collapsed' : 'Ready', 'Selección visual solamente', 'overview-sidebar', state.selectedItem)}
          ${buildMetricCard('Status', state.statusBarState === 'offline' ? 'Offline' : 'Prepared', 'Sin lógica funcional', 'overview-status', state.selectedItem)}
          <section class="panel laboratory-shell-placeholder-card laboratory-shell-overview-main">
            <h3 class="panel-title">Visual canvas</h3>
            <p class="laboratory-shell-empty-copy">Contenedor principal preparado para las fases C.3–C.7. No consume datos ni conecta con el dominio.</p>
            <div class="laboratory-shell-chip-row">
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-canvas">Overview</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-experiment">Experiment</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-session">Session</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-comparison">Comparison</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-evidence">Evidence</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-replay">Replay</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-ai">AI Research</button>
              <button type="button" class="laboratory-shell-chip-button" data-select-item="overview-settings">Settings</button>
            </div>
          </section>
          <section class="panel laboratory-shell-placeholder-card">
            <h3 class="panel-title">Placeholder feed</h3>
            <ul class="laboratory-shell-skeleton-list">
              ${buildSkeletonRows(4, 'Overview', state.selectedItem, 'overview-row')}
            </ul>
          </section>
        </div>
      `;
  }
}

export class LabRenderer {
  constructor(containerId, trackerInstance, options = {}) {
    this.container = document.getElementById(containerId);
    this.binding = trackerInstance && typeof trackerInstance.getViewModel === 'function' ? trackerInstance : null;
    this.tracker = this.binding ? null : trackerInstance ?? null;
    this.options = options;

    const saved = loadPreferences();
    const initialView = LAB_SHELL_VIEWS.some((view) => view.id === saved.activeViewId)
      ? saved.activeViewId
      : options.initialViewId ?? 'overview';

    this.state = {
      activeViewId: initialView,
      selectedItem: saved.selectedItem ?? options.initialSelectedItem ?? getView(initialView).defaultItem,
      searchQuery: saved.searchQuery ?? options.initialSearchQuery ?? '',
      sortMode: LAB_SHELL_SORTS.some((sort) => sort.id === saved.sortMode) ? saved.sortMode : options.initialSortMode ?? 'recent',
      filters: new Set(Array.isArray(saved.filters) && saved.filters.length ? saved.filters : options.initialFilters ?? ['All']),
      expandedGroups: new Set(options.initialExpandedGroups ?? ['overview-canvas', 'sessions-timeline']),
      sidebarCollapsed: Boolean(saved.sidebarCollapsed ?? options.initialSidebarCollapsed ?? false),
      toolbarState: 'idle',
      workspaceState: { viewId: initialView, selectedItem: null },
      comparisonSelection: { mode: null, selectedItems: [], status: 'insufficient-selection' },
      statusBarState: 'ready',
      statusOverride: saved.statusOverride ?? null,
      evidenceFilter: 'all',
      selectedBreadcrumb: LAB_SHELL_VIEWS.find((view) => view.id === initialView)?.breadcrumb ?? ['Home', 'Laboratory', 'Overview'],
      theme: saved.theme ?? options.initialTheme ?? 'visual-dark',
      overlay: null,
    };

    this._didBind = false;
    this._overlayTimer = null;
    this._statusTimer = null;
    this._pendingOverlayConfirm = null;
  }

  init() {
    if (!this.container) return;
    this.renderLayout();
    if (!this._didBind) {
      this.bindEvents();
      this._didBind = true;
    }
    this.syncAll();
  }

  renderLayout() {
    if (!this.container) return;

    const view = getView(this.state.activeViewId);
    this.container.innerHTML = `
      <section class="panel laboratory-shell" aria-labelledby="laboratory-shell-title">
        <header class="laboratory-shell-header">
          <div class="laboratory-shell-heading">
            <p class="laboratory-shell-kicker">Laboratory</p>
            <h2 id="laboratory-shell-title" class="panel-title laboratory-shell-title">🧪 Laboratory UI Shell</h2>
            <p class="laboratory-shell-subtitle">Estructura visual preparada para fases C.3–C.7.</p>
            <div id="laboratory-shell-breadcrumb" class="laboratory-shell-breadcrumb" aria-label="Breadcrumb placeholder"></div>
          </div>
          <div class="laboratory-shell-actions" aria-label="Action area placeholder">
            <button type="button" class="laboratory-shell-sidebar-toggle" data-sidebar-toggle="true" aria-pressed="${this.state.sidebarCollapsed ? 'true' : 'false'}">
              ${this.state.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </button>
          </div>
        </header>

        <div class="laboratory-shell-grid">
          <aside class="panel laboratory-shell-sidebar" aria-label="Laboratory navigation">
            <h3 class="panel-title laboratory-shell-section-title">Sections</h3>
            <div class="laboratory-shell-nav" role="tablist" aria-label="Laboratory views">
              ${LAB_SHELL_VIEWS.map((item) => `
                <button
                  type="button"
                  class="nav-btn laboratory-shell-nav-btn${item.id === this.state.activeViewId ? ' active' : ''}"
                  role="tab"
                  id="lab-tab-${item.id}"
                  aria-controls="laboratory-view-${item.id}"
                  aria-selected="${item.id === this.state.activeViewId ? 'true' : 'false'}"
                  tabindex="${item.id === this.state.activeViewId ? '0' : '-1'}"
                  data-view-id="${item.id}"
                >
                  <span class="laboratory-shell-nav-icon" aria-hidden="true">${item.icon}</span>
                  <span class="laboratory-shell-nav-label">${escapeHtml(item.label)}</span>
                  <span class="laboratory-shell-nav-badge">${escapeHtml(item.badge)}</span>
                </button>
              `).join('')}
            </div>
            <div class="laboratory-shell-sidebar-footer">
              <p class="laboratory-shell-note">Selección visual local. Sin conexión al dominio.</p>
            </div>
          </aside>

          <div class="laboratory-shell-main">
            <section class="panel laboratory-shell-toolbar" aria-label="Toolbar placeholder">
              <div class="laboratory-shell-toolbar-row">
                <label class="laboratory-shell-search" for="laboratory-shell-search-input">
                  <span>Search</span>
                  <input id="laboratory-shell-search-input" type="search" value="${escapeHtml(this.state.searchQuery)}" placeholder="Search experiments, sessions, evidence" aria-label="Search placeholder" />
                </label>

                <label class="laboratory-shell-sort" for="laboratory-shell-sort-select">
                  <span>Sort</span>
                  <select id="laboratory-shell-sort-select" aria-label="Sort placeholder">
                    ${LAB_SHELL_SORTS.map((sort) => `
                      <option value="${escapeHtml(sort.id)}" ${sort.id === this.state.sortMode ? 'selected' : ''}>${escapeHtml(sort.label)}</option>
                    `).join('')}
                  </select>
                </label>

                <div class="laboratory-shell-filter-group" role="group" aria-label="Filter placeholders">
                  ${LAB_SHELL_FILTERS.map((filter) => `
                    <button
                      type="button"
                      class="laboratory-shell-chip-button${this.state.filters.has(filter) || (filter === 'All' && this.state.filters.has('All')) ? ' is-active' : ''}"
                      data-filter-id="${escapeHtml(filter)}"
                      aria-pressed="${this.state.filters.has(filter) || (filter === 'All' && this.state.filters.has('All')) ? 'true' : 'false'}"
                    >
                      ${escapeHtml(filter)}
                    </button>
                  `).join('')}
                </div>

                <div class="laboratory-shell-action-group" aria-label="Action placeholders">
                  <button type="button" class="laboratory-shell-action-button" data-toolbar-action="refresh">Refresh</button>
                  <button type="button" class="laboratory-shell-action-button" data-toolbar-action="toast">Toast</button>
                  <button type="button" class="laboratory-shell-action-button" data-toolbar-action="confirm">Confirm</button>
                  <button type="button" class="laboratory-shell-action-button" data-toolbar-action="info">Info</button>
                  <button type="button" class="laboratory-shell-action-button" data-toolbar-action="warning">Warning</button>
                </div>

                <div class="laboratory-shell-toolbar-state" id="laboratory-shell-toolbar-state" aria-live="polite">
                  Idle
                </div>
              </div>
            </section>

            <section class="panel laboratory-shell-workspace" aria-label="Workspace placeholder">
              <div class="laboratory-shell-workspace-header">
                <div>
                  <p class="laboratory-shell-kicker">Workspace</p>
                  <h3 class="panel-title laboratory-shell-workspace-title" id="laboratory-workspace-title">${escapeHtml(view.title)}</h3>
                  <p class="laboratory-shell-subtitle" id="laboratory-workspace-subtitle">${escapeHtml(view.subtitle)}</p>
                </div>
                <div class="laboratory-shell-workspace-badge" id="laboratory-workspace-badge">${escapeHtml(view.badge)}</div>
              </div>

              <div class="laboratory-shell-workspace-summary" id="laboratory-shell-workspace-summary" aria-live="polite"></div>

              <div class="laboratory-shell-workspace-body" id="laboratory-workspace-body" role="tabpanel" aria-labelledby="lab-tab-${view.id}">
                ${buildViewMarkup(view, this.state)}
              </div>
            </section>

            <footer class="panel laboratory-shell-statusbar" aria-label="Status bar placeholder">
              <div class="laboratory-shell-status-list" role="list" aria-label="Shell status indicators">
                ${LAB_SHELL_STATUS.map((status) => `
                  <button
                    type="button"
                    class="laboratory-shell-status-pill tone-${escapeHtml(status.tone)}${this.getStatusId() === status.id ? ' is-active' : ''}"
                    role="listitem"
                    data-status-id="${escapeHtml(status.id)}"
                    aria-pressed="${this.getStatusId() === status.id ? 'true' : 'false'}"
                  >
                    ${escapeHtml(status.label)}
                  </button>
                `).join('')}
              </div>
              <div class="laboratory-shell-status-copy" id="laboratory-shell-status-copy">Todos simulados. Sin lógica funcional.</div>
            </footer>
          </div>
        </div>

        <div id="laboratory-overlay-host" class="laboratory-shell-overlay-host" aria-live="polite" aria-atomic="true" hidden></div>
      </section>
    `;

    this.cacheDom();
  }

  cacheDom() {
    this.sidebarToggle = this.container.querySelector('[data-sidebar-toggle]');
    this.breadcrumbHost = this.container.querySelector('#laboratory-shell-breadcrumb');
    this.searchInput = this.container.querySelector('#laboratory-shell-search-input');
    this.sortSelect = this.container.querySelector('#laboratory-shell-sort-select');
    this.workspaceTitle = this.container.querySelector('#laboratory-workspace-title');
    this.workspaceSubtitle = this.container.querySelector('#laboratory-workspace-subtitle');
    this.workspaceBadge = this.container.querySelector('#laboratory-workspace-badge');
    this.workspaceSummary = this.container.querySelector('#laboratory-shell-workspace-summary');
    this.workspaceBody = this.container.querySelector('#laboratory-workspace-body');
    this.toolbarStateLabel = this.container.querySelector('#laboratory-shell-toolbar-state');
    this.statusCopy = this.container.querySelector('#laboratory-shell-status-copy');
    this.overlayHost = this.container.querySelector('#laboratory-overlay-host');
    this.viewButtons = Array.from(this.container.querySelectorAll('[data-view-id]'));
    this.filterButtons = Array.from(this.container.querySelectorAll('[data-filter-id]'));
    this.statusButtons = Array.from(this.container.querySelectorAll('[data-status-id]'));
  }

  bindEvents() {
    this.container.addEventListener('click', (event) => {
      const viewButton = event.target.closest('[data-view-id]');
      if (viewButton) {
        this.setActiveView(viewButton.dataset.viewId);
        return;
      }

      const filterButton = event.target.closest('[data-filter-id]');
      if (filterButton) {
        this.toggleFilter(filterButton.dataset.filterId);
        return;
      }

      const statusButton = event.target.closest('[data-status-id]');
      if (statusButton) {
        this.setStatus(statusButton.dataset.statusId);
        return;
      }

      const toolbarAction = event.target.closest('[data-toolbar-action]');
      if (toolbarAction) {
        this.handleToolbarAction(toolbarAction.dataset.toolbarAction);
        return;
      }

      const toggleGroupButton = event.target.closest('[data-toggle-group]');
      if (toggleGroupButton) {
        this.toggleGroup(toggleGroupButton.dataset.toggleGroup);
        return;
      }

      const refreshEvidenceButton = event.target.closest('[data-refresh-evidence]');
      if (refreshEvidenceButton) {
        this.refreshEvidence();
        return;
      }

      const clearEvidenceSelectionButton = event.target.closest('[data-clear-evidence-selection]');
      if (clearEvidenceSelectionButton) {
        this.clearEvidenceSelection();
        return;
      }

      const evidenceFilterButton = event.target.closest('[data-evidence-filter]');
      if (evidenceFilterButton) {
        this.setEvidenceFilter(evidenceFilterButton.dataset.evidenceFilter);
        return;
      }

      const refreshComparisonButton = event.target.closest('[data-refresh-comparison]');
      if (refreshComparisonButton) {
        this.refreshComparison();
        return;
      }

      const clearSelectionButton = event.target.closest('[data-clear-selection]');
      if (clearSelectionButton) {
        this.clearSelection();
        return;
      }

      const removeItemButton = event.target.closest('[data-remove-item]');
      if (removeItemButton) {
        this.removeItem(removeItemButton.dataset.removeItem, removeItemButton.dataset.itemKind);
        return;
      }

      const selectReplayButton = event.target.closest('[data-select-replay]');
      if (selectReplayButton) {
        this.selectReplay(selectReplayButton.dataset.selectReplay);
        return;
      }

      const replayActionButton = event.target.closest('[data-replay-action]');
      if (replayActionButton) {
        this.handleReplayAction(replayActionButton.dataset.replayAction);
        return;
      }

      const selectItemButton = event.target.closest('[data-select-item]');
      if (selectItemButton) {
        this.selectItem(selectItemButton.dataset.selectItem, selectItemButton.dataset.itemKind);
        return;
      }

      const breadcrumbButton = event.target.closest('[data-breadcrumb-index]');
      if (breadcrumbButton) {
        this.setBreadcrumbIndex(Number(breadcrumbButton.dataset.breadcrumbIndex));
        return;
      }

      const overlayAction = event.target.closest('[data-overlay-action]');
      if (overlayAction) {
        this.handleOverlayAction(overlayAction.dataset.overlayAction);
        return;
      }

      if (event.target.closest('[data-sidebar-toggle]')) {
        this.toggleSidebarCollapsed();
      }
    });

    this.container.addEventListener('input', (event) => {
      if (event.target === this.searchInput) {
        this.setSearchQuery(this.searchInput.value);
      }
    });

    this.container.addEventListener('change', (event) => {
      if (event.target === this.sortSelect) {
        this.setSortMode(this.sortSelect.value);
      }
    });

    this.container.addEventListener('keydown', (event) => {
      const tabButton = event.target.closest('[data-view-id]');
      if (tabButton) {
        this.handleSidebarKeydown(event, tabButton);
      }

      if (event.key === 'Escape' && this.state.overlay) {
        this.closeOverlay();
      }
    });
  }

  handleSidebarKeydown(event, currentButton) {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const buttons = this.viewButtons;
    const currentIndex = buttons.indexOf(currentButton);
    if (currentIndex === -1 || buttons.length === 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = buttons.length - 1;
    }

    const nextButton = buttons[nextIndex];
    nextButton.focus();
    this.setActiveView(nextButton.dataset.viewId);
  }

  setActiveView(viewId) {
    if (!LAB_SHELL_VIEWS.some((view) => view.id === viewId)) return;

    const view = getView(viewId);
    this.state.activeViewId = viewId;
    this.state.selectedBreadcrumb = [...view.breadcrumb];
    this.state.workspaceState = { viewId, selectedItem: this.state.selectedItem };
    if (!this.state.selectedItem || !this.isItemVisibleInView(this.state.selectedItem, viewId)) {
      this.state.selectedItem = view.defaultItem;
    }
    this.state.toolbarState = 'navigating';
    this.binding?.setActiveView?.(viewId);
    this.persistVisualPreferences();
    this.syncAll();
  }

  getBindingViewModel(viewId = this.state.activeViewId) {
    if (!this.binding || typeof this.binding.getViewModel !== 'function') return null;
    try {
      return this.binding.getViewModel(viewId);
    } catch {
      return null;
    }
  }

  setBreadcrumbIndex(index) {
    if (!Array.isArray(this.state.selectedBreadcrumb)) return;
    if (!Number.isFinite(index) || index < 0 || index >= this.state.selectedBreadcrumb.length) return;

    this.state.selectedBreadcrumb = this.state.selectedBreadcrumb.slice(0, index + 1);
    this.state.toolbarState = 'breadcrumb';
    this.syncBreadcrumb();
    this.syncToolbar();
    this.syncStatus();
  }

  setSearchQuery(value) {
    this.state.searchQuery = value;
    this.state.toolbarState = value ? 'searching' : 'idle';
    this.syncToolbar();
    this.syncWorkspace();
    this.syncStatus();
  }

  setEvidenceFilter(filterId) {
    this.state.evidenceFilter = ['all', 'comparisons', 'sessions', 'results', 'observations'].includes(filterId)
      ? filterId
      : 'all';
    this.state.toolbarState = 'filtering';
    this.syncToolbar();
    this.syncWorkspace();
    this.syncStatus();
    this.scheduleToolbarReset();
  }

  setSortMode(sortMode) {
    if (!LAB_SHELL_SORTS.some((item) => item.id === sortMode)) return;

    this.state.sortMode = sortMode;
    this.state.toolbarState = 'sorting';
    this.persistVisualPreferences();
    this.syncToolbar();
    this.syncWorkspace();
    this.syncStatus();
    this.scheduleToolbarReset();
  }

  toggleFilter(filterId) {
    if (!LAB_SHELL_FILTERS.includes(filterId)) return;

    if (filterId === 'All') {
      this.state.filters = new Set(['All']);
    } else if (this.state.filters.has(filterId)) {
      this.state.filters.delete(filterId);
      if (this.state.filters.size === 0) {
        this.state.filters.add('All');
      } else {
        this.state.filters.delete('All');
      }
    } else {
      this.state.filters.delete('All');
      this.state.filters.add(filterId);
    }

    this.state.toolbarState = 'filtering';
    this.persistVisualPreferences();
    this.syncToolbar();
    this.syncWorkspace();
    this.syncStatus();
    this.scheduleToolbarReset();
  }

  toggleSidebarCollapsed() {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    this.persistVisualPreferences();
    this.syncSidebar();
    this.syncToolbar();
  }

  toggleGroup(groupId) {
    if (!groupId) return;

    if (this.state.expandedGroups.has(groupId)) {
      this.state.expandedGroups.delete(groupId);
    } else {
      this.state.expandedGroups.add(groupId);
    }

    this.state.toolbarState = 'workspace';
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  selectItem(itemId, itemKind = null) {
    if (!itemId) return;

    if (this.state.activeViewId === 'comparison' && itemKind) {
      this.toggleComparisonSelection(itemId, itemKind);
      return;
    }

    if (this.state.activeViewId === 'ai-research' && itemKind) {
      this.selectResearchItem(itemId, itemKind);
      return;
    }

    this.state.selectedItem = itemId;
    this.state.workspaceState = { viewId: this.state.activeViewId, selectedItem: itemId };
    this.state.toolbarState = 'selection';
    this.state.statusOverride = 'placeholder-updated';
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
    this.scheduleToolbarReset();
  }

  toggleComparisonSelection(itemId, itemKind) {
    const current = this.state.comparisonSelection ?? { mode: null, selectedItems: [], status: 'insufficient-selection' };
    const normalizedKind = itemKind || current.mode || 'comparison';
    const nextItems = Array.isArray(current.selectedItems) ? [...current.selectedItems] : [];
    const existingIndex = nextItems.findIndex((item) => item.itemId === itemId && item.itemKind === normalizedKind);

    if (existingIndex >= 0) {
      nextItems.splice(existingIndex, 1);
    } else {
      const incompatibleIndex = nextItems.findIndex((item) => item.itemKind !== normalizedKind);
      if (incompatibleIndex >= 0) {
        nextItems.splice(incompatibleIndex, nextItems.length - incompatibleIndex);
      }
      nextItems.push({ itemId, itemKind: normalizedKind });
    }

    this.state.comparisonSelection = {
      mode: nextItems[0]?.itemKind ?? null,
      selectedItems: nextItems,
      status: nextItems.length < 2 ? 'insufficient-selection' : 'ready',
    };
    this.state.workspaceState = { viewId: 'comparison', selectedItem: itemId };
    this.state.toolbarState = 'selection';
    this.state.statusOverride = 'placeholder-updated';
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
    this.scheduleToolbarReset();
  }

  removeItem(itemId, itemKind = null) {
    if (!itemId) return;
    if (this.state.activeViewId !== 'comparison') {
      this.selectItem(itemId, itemKind);
      return;
    }

    const current = this.state.comparisonSelection ?? { mode: null, selectedItems: [], status: 'insufficient-selection' };
    const nextItems = (current.selectedItems ?? []).filter((item) => item.itemId !== itemId || (itemKind && item.itemKind !== itemKind));
    this.state.comparisonSelection = {
      mode: nextItems[0]?.itemKind ?? null,
      selectedItems: nextItems,
      status: nextItems.length < 2 ? 'insufficient-selection' : 'ready',
    };
    this.state.workspaceState = { viewId: 'comparison', selectedItem: nextItems[0]?.itemId ?? null };
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  clearSelection() {
    this.state.comparisonSelection = { mode: null, selectedItems: [], status: 'insufficient-selection' };
    this.state.workspaceState = { viewId: this.state.activeViewId, selectedItem: null };
    this.state.selectedItem = null;
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  refreshComparison() {
    if (this.binding && typeof this.binding.refreshComparison === 'function') {
      this.binding.refreshComparison();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  refreshReplay() {
    if (this.binding && typeof this.binding.refreshReplay === 'function') {
      this.binding.refreshReplay();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  selectReplay(replayId) {
    if (!replayId) return;
    this.state.selectedItem = null;
    if (this.binding && typeof this.binding.selectReplay === 'function') {
      this.binding.selectReplay(replayId);
    }
    this.state.toolbarState = 'selection';
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  selectResearchItem(itemId, itemKind = null) {
    if (!itemId) return;
    this.state.selectedItem = itemId;
    this.state.workspaceState = { viewId: 'ai-research', selectedItem: itemId };
    this.state.toolbarState = 'selection';
    this.state.statusOverride = 'placeholder-updated';
    if (this.binding && typeof this.binding.selectResearchItem === 'function') {
      this.binding.selectResearchItem(itemId, itemKind);
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
    this.scheduleToolbarReset();
  }

  refreshResearch() {
    if (this.binding && typeof this.binding.buildResearchRequest === 'function') {
      this.binding.buildResearchRequest();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  executeResearch() {
    if (this.binding && typeof this.binding.executeResearch === 'function') {
      this.binding.executeResearch();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  cancelResearch() {
    if (this.binding && typeof this.binding.cancelResearch === 'function') {
      this.binding.cancelResearch();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  resetResearchWorkspace() {
    if (this.binding && typeof this.binding.resetResearchWorkspace === 'function') {
      this.binding.resetResearchWorkspace();
    }
    this.state.selectedItem = null;
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  handleReplayAction(action) {
    switch (action) {
      case 'play':
        this.playReplay();
        break;
      case 'pause':
        this.pauseReplay();
        break;
      case 'stop':
        this.stopReplay();
        break;
      case 'step-forward':
        this.stepForward();
        break;
      case 'step-backward':
        this.stepBackward();
        break;
      case 'beginning':
        this.seekReplay('beginning');
        break;
      case 'end':
        this.seekReplay('end');
        break;
      case 'refresh':
        this.refreshReplay();
        break;
      default:
        break;
    }
  }

  playReplay() {
    if (this.binding && typeof this.binding.playReplay === 'function') {
      this.binding.playReplay();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  pauseReplay() {
    if (this.binding && typeof this.binding.pauseReplay === 'function') {
      this.binding.pauseReplay();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  stopReplay() {
    if (this.binding && typeof this.binding.stopReplay === 'function') {
      this.binding.stopReplay();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  stepForward() {
    if (this.binding && typeof this.binding.stepForward === 'function') {
      this.binding.stepForward();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  stepBackward() {
    if (this.binding && typeof this.binding.stepBackward === 'function') {
      this.binding.stepBackward();
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  seekReplay(target) {
    if (this.binding && typeof this.binding.seekReplay === 'function') {
      this.binding.seekReplay(target);
    }
    this.syncWorkspace();
    this.syncToolbar();
    this.syncStatus();
  }

  setStatus(statusId) {
    if (!LAB_SHELL_STATUS.some((status) => status.id === statusId)) return;

    if (this.state.statusOverride === statusId) {
      this.state.statusOverride = null;
    } else {
      this.state.statusOverride = statusId;
    }

    this.state.toolbarState = statusId;
    this.syncStatus();
    this.syncToolbar();
    this.syncWorkspace();
    if (statusId === 'offline') {
      this.persistVisualPreferences();
    }
  }

  handleToolbarAction(action) {
    switch (action) {
      case 'refresh':
        this.state.toolbarState = 'refreshing';
        this.state.statusOverride = 'refreshing';
        this.syncToolbar();
        this.syncStatus();
        this.showToast('Refreshing placeholder');
        this.scheduleToolbarReset();
        break;
      case 'toast':
        this.state.toolbarState = 'toast';
        this.syncToolbar();
        this.showToast('Toast placeholder');
        this.scheduleToolbarReset();
        break;
      case 'confirm':
        this.state.toolbarState = 'confirm';
        this.syncToolbar();
        this.openConfirmOverlay();
        this.scheduleToolbarReset();
        break;
      case 'info':
        this.state.toolbarState = 'info';
        this.syncToolbar();
        this.openInfoOverlay();
        this.scheduleToolbarReset();
        break;
      case 'build-research-context':
        this.state.toolbarState = 'research-context';
        this.refreshResearch();
        this.scheduleToolbarReset();
        break;
      case 'execute-research':
        this.state.toolbarState = 'research-execute';
        this.executeResearch();
        this.scheduleToolbarReset();
        break;
      case 'cancel-research':
        this.state.toolbarState = 'research-cancel';
        this.cancelResearch();
        this.scheduleToolbarReset();
        break;
      case 'reset-research':
        this.state.toolbarState = 'research-reset';
        this.resetResearchWorkspace();
        this.scheduleToolbarReset();
        break;
      case 'ai-research':
        this.state.toolbarState = 'research';
        this.syncToolbar();
        this.syncWorkspace();
        this.scheduleToolbarReset();
        break;
      case 'warning':
        this.state.toolbarState = 'warning';
        this.syncToolbar();
        this.openWarningOverlay();
        this.scheduleToolbarReset();
        break;
      default:
        break;
    }
  }

  openConfirmOverlay() {
    this.openOverlay({
      kind: 'confirm',
      tone: 'amber',
      kicker: 'Confirm placeholder',
      title: 'Confirm placeholder',
      message: 'This is a visual confirmation only. No domain action will be executed.',
      actions: [
        { action: 'close', label: 'Cancel', variant: 'secondary' },
        { action: 'confirm', label: 'Confirm', variant: 'primary' },
      ],
    }, () => {
      this.selectItem('comparison-matrix');
    });
  }

  openInfoOverlay() {
    this.openOverlay({
      kind: 'info',
      tone: 'blue',
      kicker: 'Info placeholder',
      title: 'Info placeholder',
      message: 'Informational dialog scaffold. It opens and closes locally only.',
      actions: [{ action: 'close', label: 'Close', variant: 'primary' }],
    });
  }

  openWarningOverlay() {
    this.openOverlay({
      kind: 'warning',
      tone: 'amber',
      kicker: 'Warning placeholder',
      title: 'Warning placeholder',
      message: 'No actions are executed here. The overlay exists only as a visual boundary.',
      actions: [{ action: 'close', label: 'Understood', variant: 'primary' }],
    });
  }

  showToast(message) {
    this.openOverlay({
      kind: 'toast',
      tone: 'emerald',
      kicker: 'Toast placeholder',
      title: 'Toast placeholder',
      message,
    });

    if (this._overlayTimer) {
      clearTimeout(this._overlayTimer);
    }
    this._overlayTimer = setTimeout(() => this.closeOverlay(), 1400);
  }

  openOverlay(overlay, onConfirm = null) {
    this._pendingOverlayConfirm = typeof onConfirm === 'function' ? onConfirm : null;
    if (this._overlayTimer) {
      clearTimeout(this._overlayTimer);
      this._overlayTimer = null;
    }
    this.state.overlay = overlay;
    this.syncOverlay();
  }

  handleOverlayAction(action) {
    if (action === 'confirm' && this._pendingOverlayConfirm) {
      const confirm = this._pendingOverlayConfirm;
      this._pendingOverlayConfirm = null;
      this.closeOverlay();
      confirm();
      return;
    }

    if (action === 'close' || action === 'dismiss') {
      this.closeOverlay();
    }
  }

  closeOverlay() {
    this.state.overlay = null;
    this._pendingOverlayConfirm = null;
    if (this._overlayTimer) {
      clearTimeout(this._overlayTimer);
      this._overlayTimer = null;
    }
    this.syncOverlay();
  }

  scheduleToolbarReset() {
    if (this._statusTimer) {
      clearTimeout(this._statusTimer);
    }

    this._statusTimer = setTimeout(() => {
      if (this.state.statusOverride === 'refreshing' || this.state.statusOverride === 'placeholder-updated') {
        this.state.statusOverride = null;
      }
      if (this.state.toolbarState !== 'offline') {
        this.state.toolbarState = 'idle';
      }
      this.syncToolbar();
      this.syncStatus();
    }, 1200);
  }

  scheduleStatusReset() {
    if (this._statusTimer) {
      clearTimeout(this._statusTimer);
    }

    this._statusTimer = setTimeout(() => {
      if (this.state.statusOverride === 'refreshing' || this.state.statusOverride === 'placeholder-updated') {
        this.state.statusOverride = null;
      }
      this.syncStatus();
    }, 1200);
  }

  syncAll() {
    this.syncSidebar();
    this.syncToolbar();
    this.syncBreadcrumb();
    this.syncWorkspace();
    this.syncStatus();
    this.syncOverlay();
  }

  syncSidebar() {
    if (!this.container) return;

    this.container.classList.toggle('is-sidebar-collapsed', this.state.sidebarCollapsed);
    if (this.sidebarToggle) {
      this.sidebarToggle.setAttribute('aria-pressed', this.state.sidebarCollapsed ? 'true' : 'false');
      this.sidebarToggle.textContent = this.state.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
    }

    this.viewButtons.forEach((button) => {
      const isActive = button.dataset.viewId === this.state.activeViewId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
    });
  }

  syncToolbar() {
    if (this.searchInput && this.searchInput.value !== this.state.searchQuery) {
      this.searchInput.value = this.state.searchQuery;
    }
    if (this.sortSelect && this.sortSelect.value !== this.state.sortMode) {
      this.sortSelect.value = this.state.sortMode;
    }

    this.filterButtons.forEach((button) => {
      const filterId = button.dataset.filterId;
      const isActive = this.state.filters.has(filterId) || (filterId === 'All' && this.state.filters.has('All'));
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (this.toolbarStateLabel) {
      this.toolbarStateLabel.textContent = this.describeToolbarState();
      this.toolbarStateLabel.setAttribute('data-toolbar-state', this.state.toolbarState);
    }
  }

  syncBreadcrumb() {
    if (!this.breadcrumbHost) return;

    const breadcrumb = Array.isArray(this.state.selectedBreadcrumb) && this.state.selectedBreadcrumb.length
      ? this.state.selectedBreadcrumb
      : getView(this.state.activeViewId).breadcrumb;

    this.breadcrumbHost.innerHTML = breadcrumb.map((item, index) => `
      <button type="button" class="laboratory-shell-breadcrumb-button${index === breadcrumb.length - 1 ? ' is-active' : ''}" data-breadcrumb-index="${index}">
        ${escapeHtml(item)}
      </button>
    `).join(' <span aria-hidden="true">›</span> ');
  }

  syncWorkspace() {
    if (!this.workspaceBody) return;

    const view = getView(this.state.activeViewId);
    const bindingViewModel = this.getBindingViewModel(view.id);
    this.workspaceBody.innerHTML = `
      ${buildBindingSummaryMarkup(bindingViewModel)}
      ${buildViewMarkup(view, this.state, bindingViewModel)}
    `;
    this.workspaceBody.setAttribute('aria-labelledby', `lab-tab-${view.id}`);

    if (this.workspaceTitle) this.workspaceTitle.textContent = view.title;
    if (this.workspaceSubtitle) this.workspaceSubtitle.textContent = view.subtitle;
    if (this.workspaceBadge) this.workspaceBadge.textContent = view.badge;

    if (this.workspaceSummary) {
      this.workspaceSummary.innerHTML = `
        <div class="laboratory-shell-summary-line">
          <span><strong>Active view:</strong> ${escapeHtml(view.title)}</span>
          <span><strong>Selected item:</strong> ${escapeHtml(this.state.selectedItem || 'none')}</span>
          <span><strong>Search:</strong> ${escapeHtml(this.state.searchQuery || 'empty')}</span>
          <span><strong>Sort:</strong> ${escapeHtml(this.state.sortMode)}</span>
        </div>
        <div class="laboratory-shell-summary-line secondary">
          <span><strong>Filters:</strong> ${escapeHtml([...this.state.filters].join(', '))}</span>
          <span><strong>Workspace:</strong> ${escapeHtml(this.state.workspaceState.viewId)}</span>
          <span><strong>Breadcrumb:</strong> ${escapeHtml((this.state.selectedBreadcrumb || view.breadcrumb).join(' / '))}</span>
        </div>
      `;
    }
  }

  syncStatus() {
    const statusId = this.getStatusId();
    this.statusButtons.forEach((button) => {
      const isActive = button.dataset.statusId === statusId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (this.statusCopy) {
      const activeStatus = LAB_SHELL_STATUS.find((status) => status.id === statusId) ?? LAB_SHELL_STATUS[0];
      const bindingCopy = this.binding
        ? 'Vista sincronizada con el binding. Overview, Experiments y Sessions consumen ViewModels reales.'
        : 'Sin binding. Shell visual solamente.';
      this.statusCopy.textContent = `${activeStatus.label}. ${bindingCopy}`;
    }

    this.state.statusBarState = statusId;
  }

  syncOverlay() {
    if (!this.overlayHost) return;

    if (!this.state.overlay) {
      this.overlayHost.innerHTML = '';
      this.overlayHost.hidden = true;
      return;
    }

    this.overlayHost.hidden = false;
    this.overlayHost.innerHTML = buildOverlayMarkup(this.state.overlay);

    const primaryButton = this.overlayHost.querySelector('[data-overlay-action="confirm"], [data-overlay-action="close"]');
    if (primaryButton && typeof primaryButton.focus === 'function') {
      requestAnimationFrame(() => primaryButton.focus());
    }
  }

  getStatusId() {
    if (this.state.statusOverride && LAB_SHELL_STATUS.some((status) => status.id === this.state.statusOverride)) {
      return this.state.statusOverride;
    }

    if (this.state.toolbarState === 'refreshing') return 'refreshing';
    if (this.state.searchQuery) return 'searching';
    if (this.state.filters.size && !(this.state.filters.size === 1 && this.state.filters.has('All'))) return 'filtering';
    if (this.state.toolbarState === 'selection') return 'placeholder-updated';
    return 'ready';
  }

  describeToolbarState() {
    const state = this.state.toolbarState;
    switch (state) {
      case 'searching': return 'Searching';
      case 'sorting': return 'Sorting';
      case 'filtering': return 'Filtering';
      case 'selection': return 'Selection';
      case 'refreshing': return 'Refreshing';
      case 'toast': return 'Toast';
      case 'confirm': return 'Confirm';
      case 'info': return 'Info';
      case 'warning': return 'Warning';
      case 'breadcrumb': return 'Breadcrumb';
      case 'workspace': return 'Workspace';
      case 'navigating': return 'Navigating';
      case 'offline': return 'Offline';
      default: return 'Idle';
    }
  }

  isItemVisibleInView(itemId, viewId) {
    if (!itemId) return false;
    if (itemId.startsWith(viewId)) return true;
    if (viewId === 'overview' && itemId.startsWith('overview-')) return true;
    if (viewId === 'experiments' && itemId.startsWith('experiment-')) return true;
    if (viewId === 'sessions' && itemId.startsWith('sessions-')) return true;
    if (viewId === 'comparison' && itemId.startsWith('comparison-')) return true;
    if (viewId === 'evidence' && itemId.startsWith('evidence-')) return true;
    if (viewId === 'replay' && itemId.startsWith('replay-')) return true;
    if (viewId === 'ai-research' && itemId.startsWith('ai-')) return true;
    if (viewId === 'settings' && itemId.startsWith('settings-')) return true;
    return false;
  }

  persistVisualPreferences() {
    savePreferences({
      activeViewId: this.state.activeViewId,
      sidebarCollapsed: this.state.sidebarCollapsed,
      filters: [...this.state.filters],
      sortMode: this.state.sortMode,
      theme: this.state.theme,
      selectedItem: this.isItemVisibleInView(this.state.selectedItem, this.state.activeViewId) ? this.state.selectedItem : null,
    });
  }

  update() {
    this.syncAll();
  }
}
