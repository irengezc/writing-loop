/**
 * Shared audit utilities — single audit surface per component.
 * State switcher, Spec panel, edge-case layout. No styling changes to components.
 */

export const AUDIT_STATES = [
  { id: 'default', label: 'Default' },
  { id: 'hover', label: 'Hover' },
  { id: 'focus', label: 'Focus' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'loading', label: 'Loading' },
  { id: 'error', label: 'Error' },
];

/** Token spec mapping per component — for Spec panel display */
export const TOKEN_SPECS = {
  Button: [
    { token: 'background', value: 'var(--primary) / var(--surface) / var(--danger-bg)' },
    { token: 'color', value: '#fff / var(--text) / var(--danger)' },
    { token: 'border-radius', value: 'var(--radius-sm)' },
    { token: 'font-size', value: '13.5px (12.5px sm, 14.5px lg)' },
    { token: 'font-weight', value: '500' },
  ],
  Input: [
    { token: 'background', value: 'var(--surface)' },
    { token: 'border', value: '1px solid var(--border)' },
    { token: 'border-focus', value: 'var(--border-focus)' },
    { token: 'color', value: 'var(--text)' },
    { token: 'placeholder', value: 'var(--text-light)' },
  ],
  Select: [
    { token: 'background', value: 'var(--surface)' },
    { token: 'border', value: '1px solid var(--border)' },
    { token: 'border-radius', value: 'var(--radius-sm) / 20px (filter)' },
    { token: 'font-size', value: '13px / 12.5px (filter)' },
  ],
  Tabs: [
    { token: 'background', value: 'var(--bg)' },
    { token: 'color', value: 'var(--text-muted)' },
    { token: 'color-active', value: 'var(--primary)' },
    { token: 'border-bottom', value: 'var(--primary)' },
    { token: 'font-weight', value: '500 / 600 (active)' },
  ],
  Card: [
    { token: 'background', value: 'var(--surface)' },
    { token: 'border', value: '1px solid var(--border)' },
    { token: 'border-radius', value: 'var(--radius)' },
    { token: 'box-shadow', value: 'var(--shadow-sm)' },
  ],
  Modal: [
    { token: 'background', value: 'var(--surface)' },
    { token: 'border-radius', value: 'var(--radius-lg)' },
    { token: 'box-shadow', value: 'var(--shadow-lg)' },
    { token: 'border', value: '1px solid var(--border)' },
  ],
};

/** Render Spec panel HTML */
export function renderSpecPanel(componentName) {
  const specs = TOKEN_SPECS[componentName] || [];
  return `
    <div class="audit-spec">
      <div class="audit-spec-title">Spec — tokens</div>
      ${specs.map(s => `
        <div class="audit-spec-row">
          <span class="audit-spec-token">${s.token}</span>
          <span class="audit-spec-value">${s.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/** Create audit page layout with state bar, preview area, spec panel */
export function createAuditLayout(args, context, componentName, renderPreview) {
  const state = args.auditState || 'default';
  const edgeNarrow = args.edgeNarrow || false;
  const edgeLongLabel = args.edgeLongLabel || false;

  const wrapper = document.createElement('div');
  wrapper.className = 'audit-page';
  wrapper.dataset.auditState = state;

  const previewClasses = ['audit-preview'];
  if (edgeNarrow) previewClasses.push('audit-edge-narrow');
  if (edgeLongLabel) previewClasses.push('audit-edge-long-label');

  const stateBarHtml = AUDIT_STATES.map(s => `
    <button type="button" class="audit-state-btn ${s.id === state ? 'active' : ''}" data-audit-state="${s.id}">${s.label}</button>
  `).join('');

  wrapper.innerHTML = `
    <div style="grid-column:1">
      <div class="audit-state-bar">${stateBarHtml}</div>
      <div class="${previewClasses.join(' ')}">
        ${renderPreview(args)}
      </div>
    </div>
    <div>${renderSpecPanel(componentName)}</div>
  `;

  // Make state bar clickable — emit UPDATE_STORY_ARGS (works when channel/storyId available)
  wrapper.querySelectorAll('.audit-state-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newState = btn.dataset.auditState;
      const channel = window.__STORYBOOK_ADDONS_CHANNEL__ || window.__STORYBOOK_PREVIEW__?.channel;
      const storyId = context?.id ?? window.__STORYBOOK_PREVIEW__?.selectionStore?.selection?.storyId;
      if (channel?.emit && storyId) {
        try {
          channel.emit('updateStoryArgs', { storyId, updatedArgs: { auditState: newState } });
        } catch (_) {}
      }
    });
  });

  return wrapper;
}
