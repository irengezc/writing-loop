/** LinguaLog Button — Figma ↔ code parity */
const variants = ['btn-primary', 'btn-secondary', 'btn-ghost', 'btn-success', 'btn-danger'];
const sizes = ['', 'btn-sm', 'btn-lg'];

export default {
  title: 'Components/Button',
  parameters: { layout: 'padded' },
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'select', options: ['', 'btn-sm', 'btn-lg'] },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: { label: 'Button', variant: 'btn-primary', size: '', disabled: false },
};

function createButton(args) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = ['btn', args.variant, args.size].filter(Boolean).join(' ');
  btn.textContent = args.label;
  if (args.disabled) btn.disabled = true;
  return btn;
}

export const AuditMatrix = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:24px">
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Variants</h3>
          <div style="display:flex;flex-wrap:wrap;gap:12px">
            ${variants.map(v => `<button class="btn ${v}">${v.replace('btn-','')}</button>`).join('')}
          </div>
        </section>
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Sizes</h3>
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
            <button class="btn btn-primary btn-sm">Small</button>
            <button class="btn btn-primary">Default</button>
            <button class="btn btn-primary btn-lg">Large</button>
          </div>
        </section>
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">States</h3>
          <div style="display:flex;flex-wrap:wrap;gap:12px">
            <button class="btn btn-primary">Default</button>
            <button class="btn btn-primary" disabled>Disabled</button>
            <button class="btn btn-primary btn-loading">Analyzing</button>
          </div>
        </section>
      </div>
    `;
    return div;
  },
};

export const States = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        <button class="btn btn-primary">Default</button>
        <button class="btn btn-primary" disabled>Disabled</button>
        <button class="btn btn-primary btn-loading">Loading</button>
      </div>
    `;
    return div;
  },
};

export const EdgeCases = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;max-width:360px">
        <button class="btn btn-primary">Very long label that might wrap or overflow</button>
        <button class="btn btn-primary">Émojis: 🎉 ✓</button>
        <button class="btn btn-primary">0</button>
      </div>
    `;
    return div;
  },
};

export const Playground = {
  render: (args) => createButton(args),
};
