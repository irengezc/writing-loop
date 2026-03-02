import { createAuditLayout, AUDIT_STATES } from './audit-utils';

export default {
  title: 'Other/Audit/Select',
  parameters: { layout: 'padded' },
  argTypes: {
    auditState: { control: 'select', options: AUDIT_STATES.map(s => s.id) },
    style: { control: 'select', options: ['session', 'filter'] },
    filterActive: { control: 'boolean', description: 'Filter select active state' },
    edgeNarrow: { control: 'boolean' },
  },
  args: {
    auditState: 'default',
    style: 'session',
    filterActive: false,
    edgeNarrow: false,
  },
};

function renderSelectPreview(args) {
  const state = args.auditState || 'default';
  const disabled = state === 'disabled';
  const cls = args.style === 'filter' ? 'filter-select' + (args.filterActive ? ' active' : '') : 'session-select';
  return `
    <select class="${cls}" ${disabled ? 'disabled' : ''} style="min-width:140px">
      <option>Option A</option>
      <option>Option B</option>
      <option>Option C</option>
    </select>
  `;
}

export const Audit = {
  render: (args, context) => createAuditLayout(args, context, 'Select', renderSelectPreview),
};
