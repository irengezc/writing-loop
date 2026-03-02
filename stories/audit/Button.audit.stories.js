import { createAuditLayout, AUDIT_STATES } from './audit-utils';

export default {
  title: 'Other/Audit/Button',
  parameters: { layout: 'padded' },
  argTypes: {
    auditState: {
      control: 'select',
      options: AUDIT_STATES.map(s => s.id),
      description: 'Visual state for parity review',
    },
    variant: {
      control: 'select',
      options: ['btn-primary', 'btn-secondary', 'btn-ghost', 'btn-success', 'btn-danger'],
    },
    size: { control: 'select', options: ['', 'btn-sm', 'btn-lg'] },
    label: { control: 'text' },
    fullWidth: { control: 'boolean' },
    edgeNarrow: { control: 'boolean', description: 'Narrow container' },
    edgeLongLabel: { control: 'boolean', description: 'Long label / wrapping' },
  },
  args: {
    auditState: 'default',
    variant: 'btn-primary',
    size: '',
    label: 'Button',
    fullWidth: false,
    edgeNarrow: false,
    edgeLongLabel: false,
  },
};

function renderButtonPreview(args) {
  const state = args.auditState || 'default';
  const disabled = state === 'disabled';
  const loading = state === 'loading';
  const cls = ['btn', args.variant, args.size].filter(Boolean);
  if (loading) cls.push('btn-loading');
  const style = args.fullWidth ? 'width:100%' : '';
  const text = loading ? 'Analyzing' : (args.edgeLongLabel ? 'Very long label that might wrap or overflow the button' : args.label);
  return `<button type="button" class="${cls.join(' ')}" ${disabled ? 'disabled' : ''} style="${style}">${text}</button>`;
}

export const Audit = {
  render: (args, context) => createAuditLayout(args, context, 'Button', renderButtonPreview),
};
