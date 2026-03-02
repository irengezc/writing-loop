import { createAuditLayout, AUDIT_STATES } from './audit-utils';

const expandSvg = '<svg class="mistake-expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-light)"><polyline points="6 9 12 15 18 9"/></svg>';

export default {
  title: 'Other/Audit/Card',
  parameters: { layout: 'padded' },
  argTypes: {
    auditState: { control: 'select', options: AUDIT_STATES.map(s => s.id) },
    variant: { control: 'select', options: ['default', 'is-due', 'expanded'] },
    edgeNarrow: { control: 'boolean' },
  },
  args: {
    auditState: 'default',
    variant: 'default',
    edgeNarrow: false,
  },
};

function renderCardPreview(args) {
  const variant = args.variant || 'default';
  const cardCls = ['mistake-card', variant].filter(Boolean).join(' ');
  return `
    <div class="${cardCls}" style="max-width:400px">
      <div class="mistake-card-top">
        <div class="mistake-expressions" style="flex:1">
          <div>
            <span class="mistake-original">je sentir</span>
            <span class="mistake-arrow">→</span>
            <span class="mistake-corrected">je me sens</span>
          </div>
          <div class="mistake-explanation">Reflexive verb requires pronoun.</div>
        </div>
        ${expandSvg}
      </div>
      <div class="mistake-card-meta">
        <span class="badge badge-french">French</span>
        <span class="badge badge-error-type">grammar</span>
      </div>
    </div>
  `;
}

export const Audit = {
  render: (args, context) => createAuditLayout(args, context, 'Card', renderCardPreview),
};
