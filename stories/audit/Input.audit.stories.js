import { createAuditLayout, AUDIT_STATES } from './audit-utils';

export default {
  title: 'Other/Audit/Input',
  parameters: { layout: 'padded' },
  argTypes: {
    auditState: {
      control: 'select',
      options: AUDIT_STATES.map(s => s.id),
    },
    type: { control: 'select', options: ['write', 'practice'] },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    edgeNarrow: { control: 'boolean' },
    edgeLongLabel: { control: 'boolean' },
  },
  args: {
    auditState: 'default',
    type: 'practice',
    placeholder: 'Placeholder…',
    value: '',
    edgeNarrow: false,
    edgeLongLabel: false,
  },
};

function renderInputPreview(args) {
  const state = args.auditState || 'default';
  const disabled = state === 'disabled';
  const cls = args.type === 'write' ? 'write-textarea' : 'practice-textarea';
  const rows = args.type === 'write' ? 4 : 2;
  return `
    <textarea class="${cls}" placeholder="${args.placeholder}" rows="${rows}" ${disabled ? 'disabled' : ''} style="width:100%">${args.value}</textarea>
  `;
}

export const Audit = {
  render: (args, context) => createAuditLayout(args, context, 'Input', renderInputPreview),
};
