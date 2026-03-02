/** Design tokens for Figma ↔ code parity */
const colors = {
  base: { bg: '#EDE8DF', surface: '#F7F4EF', surfaceHover: '#F0EBE2', border: '#D8CFBE', borderFocus: '#A8845E' },
  text: { main: '#2A1F14', muted: '#7A6A58', light: '#A89880' },
  primary: { main: '#8B6347', hover: '#7A5238', light: '#F0E6D8' },
  success: { main: '#5A7040', bg: '#EEF2E4', border: '#BED0A0' },
  warning: { main: '#B07840', bg: '#FAF0E2', border: '#E4C490' },
  danger: { main: '#A04030', bg: '#F5EDEA', border: '#D8B0A0' },
  french: '#4A6880',
  english: '#7A5068',
};

function swatch(name, value) {
  return `
    <div class="swatch" style="border-radius:6px;overflow:hidden;box-shadow:0 1px 2px rgba(42,31,20,0.06)">
      <div style="height:64px;background:${value}"></div>
      <div style="background:var(--surface);padding:8px 10px">
        <div style="font-size:12px;font-weight:600;color:var(--text)">${name}</div>
        <div style="font-size:11px;color:var(--text-muted);font-family:monospace">${value}</div>
      </div>
    </div>
  `;
}

export default {
  title: 'Foundations/Colors',
  parameters: { layout: 'padded' },
};

export const Base = {
  render: () => `
    <div>
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:16px">Base / Surface</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">
        ${Object.entries(colors.base).map(([k, v]) => swatch(k, v)).join('')}
      </div>
    </div>
  `,
};

export const Text = {
  render: () => `
    <div>
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:16px">Text</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">
        ${Object.entries(colors.text).map(([k, v]) => swatch(k, v)).join('')}
      </div>
    </div>
  `,
};

export const Primary = {
  render: () => `
    <div>
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:16px">Primary</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">
        ${Object.entries(colors.primary).map(([k, v]) => swatch(k, v)).join('')}
      </div>
    </div>
  `,
};

export const Semantic = {
  render: () => `
    <div>
      <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:16px">Semantic</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">
        ${swatch('success', colors.success.main)}
        ${swatch('success-bg', colors.success.bg)}
        ${swatch('warning', colors.warning.main)}
        ${swatch('danger', colors.danger.main)}
      </div>
    </div>
  `,
};

export const All = {
  render: () => {
    const sections = [
      { title: 'Base / Surface', items: colors.base },
      { title: 'Text', items: colors.text },
      { title: 'Primary', items: colors.primary },
    ];
    return `
      <div style="display:flex;flex-direction:column;gap:32px">
        ${sections.map(s => `
          <div>
            <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:16px">${s.title}</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px">
              ${Object.entries(s.items).map(([k, v]) => swatch(k, v)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },
};
