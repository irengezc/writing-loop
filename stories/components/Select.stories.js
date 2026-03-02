/** LinguaLog Select — Figma ↔ code parity */
export default {
  title: 'Components/Select',
  parameters: { layout: 'padded' },
};

export const AuditMatrix = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:24px">
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Session Selector</h3>
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
            <span class="session-label">Session</span>
            <select class="session-select"><option>English</option><option>French</option></select>
            <select class="session-select"><option>Informal</option><option>Formal</option></select>
            <select class="session-select"><option>Written</option><option>Spoken</option></select>
          </div>
        </section>
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Filter Selects (Pill)</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <select class="filter-select"><option>All Languages</option><option>French</option></select>
            <select class="filter-select active"><option>Grammar</option></select>
            <select class="filter-select"><option>All Registers</option></select>
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
        <select class="session-select"><option>Default</option></select>
        <select class="session-select" disabled><option>Disabled</option></select>
        <select class="filter-select active"><option>Active</option></select>
      </div>
    `;
    return div;
  },
};

export const EdgeCases = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="max-width:280px">
        <select class="session-select" style="width:100%">
          <option>Very long option text that might wrap</option>
        </select>
        <select class="session-select" style="width:100%;margin-top:8px">
          <option></option>
          <option>Empty first option</option>
        </select>
      </div>
    `;
    return div;
  },
};

export const Playground = {
  render: (args) => {
    const sel = document.createElement('select');
    sel.className = args.style === 'filter' ? 'filter-select' : 'session-select';
    ['Option A', 'Option B', 'Option C'].forEach((o, i) => {
      const opt = document.createElement('option');
      opt.textContent = o;
      if (i === 0) opt.selected = true;
      sel.appendChild(opt);
    });
    return sel;
  },
  argTypes: { style: { control: 'select', options: ['session', 'filter'] } },
  args: { style: 'session' },
};
