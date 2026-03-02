import { createAuditLayout, AUDIT_STATES } from './audit-utils';

export default {
  title: 'Other/Audit/Modal',
  parameters: { layout: 'padded' },
  argTypes: {
    auditState: { control: 'select', options: AUDIT_STATES.map(s => s.id) },
    title: { control: 'text' },
    edgeNarrow: { control: 'boolean' },
  },
  args: {
    auditState: 'default',
    title: 'Practice Session',
    edgeNarrow: false,
  },
};

function renderModalPreview(args) {
  return `
    <div class="modal-box" style="position:relative;max-height:none;max-width:400px">
      <div class="modal-header">
        <div class="modal-title">${args.title || 'Modal'}</div>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <p style="font-size:14px;color:var(--text-muted)">Modal body content for parity review.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost">Cancel</button>
        <button class="btn btn-primary">Confirm</button>
      </div>
    </div>
  `;
}

export const Audit = {
  render: (args, context) => createAuditLayout(args, context, 'Modal', renderModalPreview),
};
