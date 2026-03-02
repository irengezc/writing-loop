/** LinguaLog Tabs — Figma ↔ code parity */
export default {
  title: 'Components/Tabs',
  parameters: { layout: 'padded' },
};

export const AuditMatrix = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;max-width:540px">
        <div class="analysis-tabs">
          <button class="analysis-tab-btn">Original</button>
          <button class="analysis-tab-btn active">Corrected <span class="tab-count">3</span></button>
          <button class="analysis-tab-btn">Native Speaker <span class="tab-count">5</span></button>
        </div>
        <div class="analysis-tab-content">
          <p style="font-size:14.5px;line-height:1.75">
            J'ai <span class="inline-del">allé</span> <span class="inline-ins">été</span> au marché hier.
          </p>
        </div>
      </div>
    `;
    return div;
  },
};

export const States = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;max-width:400px">
          <div class="analysis-tabs">
            <button class="analysis-tab-btn active">Tab 1</button>
            <button class="analysis-tab-btn">Tab 2</button>
          </div>
          <div class="analysis-tab-content"><p>Active tab content</p></div>
        </div>
      </div>
    `;
    return div;
  },
};

export const EdgeCases = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;max-width:400px">
        <div class="analysis-tabs">
          <button class="analysis-tab-btn">Very long tab label</button>
          <button class="analysis-tab-btn active">Short</button>
        </div>
        <div class="analysis-tab-content"><p>Content</p></div>
      </div>
    `;
    return div;
  },
};

export const Playground = {
  render: (args) => {
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;max-width:400px';
    div.innerHTML = `
      <div class="analysis-tabs">
        <button class="analysis-tab-btn ${args.activeTab === 0 ? 'active' : ''}">Tab 1</button>
        <button class="analysis-tab-btn ${args.activeTab === 1 ? 'active' : ''}">Tab 2</button>
      </div>
      <div class="analysis-tab-content"><p>Tab ${args.activeTab + 1} content</p></div>
    `;
    return div;
  },
  argTypes: { activeTab: { control: 'select', options: [0, 1] } },
  args: { activeTab: 0 },
};
