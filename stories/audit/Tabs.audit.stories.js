import { createAuditLayout, AUDIT_STATES } from './audit-utils';

export default {
  title: 'Other/Audit/Tabs',
  parameters: { layout: 'padded' },
  argTypes: {
    auditState: { control: 'select', options: AUDIT_STATES.map(s => s.id) },
    activeIndex: { control: 'select', options: [0, 1, 2] },
    edgeNarrow: { control: 'boolean' },
  },
  args: {
    auditState: 'default',
    activeIndex: 1,
    edgeNarrow: false,
  },
};

function renderTabsPreview(args) {
  const tabs = ['Original', 'Corrected', 'Native Speaker'];
  const activeIndex = args.activeIndex ?? 1;
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;max-width:400px">
      <div class="analysis-tabs">
        ${tabs.map((t, i) => `
          <button class="analysis-tab-btn ${i === activeIndex ? 'active' : ''}">${t}${i === 1 ? ' <span class="tab-count">3</span>' : ''}</button>
        `).join('')}
      </div>
      <div class="analysis-tab-content">
        <p style="font-size:14.5px;line-height:1.75">Tab content for ${tabs[activeIndex]}.</p>
      </div>
    </div>
  `;
}

export const Audit = {
  render: (args, context) => createAuditLayout(args, context, 'Tabs', renderTabsPreview),
};
