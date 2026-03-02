const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 };

export default {
  title: 'Foundations/Spacing',
  parameters: { layout: 'padded' },
};

export const Scale = {
  render: () => `
    <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end">
      ${Object.entries(spacing).map(([name, val]) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
          <div style="width:${val}px;height:${val}px;min-width:4px;min-height:4px;background:var(--primary);border-radius:4px"></div>
          <span style="font-size:11px;color:var(--text-muted);font-family:monospace">${name}: ${val}px</span>
        </div>
      `).join('')}
    </div>
  `,
};
