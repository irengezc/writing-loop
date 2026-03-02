const specimens = [
  { spec: '28px / 700 / -0.03em', style: 'font-size:28px;font-weight:700;letter-spacing:-0.03em', text: 'Page Title' },
  { spec: '18px / 700 / -0.02em', style: 'font-size:18px;font-weight:700;letter-spacing:-0.02em', text: 'Section Header' },
  { spec: '16px / 600', style: 'font-size:16px;font-weight:600', text: 'Card Title' },
  { spec: '15px / 400 / lh 1.7', style: 'font-size:15px;font-weight:400;line-height:1.7', text: 'Body text — the quick brown fox' },
  { spec: '13px / 500', style: 'font-size:13px;font-weight:500', text: 'Navigation, tab labels' },
  { spec: '12px / 400', style: 'font-size:12px;color:var(--text-muted)', text: 'Timestamps, meta info' },
  { spec: '11px / 700 / uppercase', style: 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)', text: 'Section labels' },
];

export default {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
};

export const Scale = {
  render: () => `
    <div style="display:flex;flex-direction:column;gap:8px;max-width:480px">
      ${specimens.map(s => `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:14px 16px;display:flex;align-items:baseline;gap:16px">
          <span style="font-size:11px;color:var(--text-light);font-family:monospace;white-space:nowrap;min-width:160px">${s.spec}</span>
          <span style="${s.style}">${s.text}</span>
        </div>
      `).join('')}
    </div>
  `,
};
