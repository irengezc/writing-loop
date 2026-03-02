const radius = { sm: 6, md: 10, lg: 16, pill: '50%', badge: 20 };

export default {
  title: 'Foundations/Radius',
  parameters: { layout: 'padded' },
};

export const Scale = {
  render: () => `
    <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center">
      ${Object.entries(radius).map(([name, val]) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <div style="width:80px;height:80px;background:var(--primary-light);border:2px solid var(--primary);border-radius:${typeof val === 'number' ? val + 'px' : val};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--primary)">${name}</div>
          <span style="font-size:11px;color:var(--text-muted)">${name}: ${val}</span>
        </div>
      `).join('')}
    </div>
  `,
};
