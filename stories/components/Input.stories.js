/** LinguaLog Input / Textarea — Figma ↔ code parity */
export default {
  title: 'Components/Input',
  parameters: { layout: 'padded' },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
  },
  args: { placeholder: 'Write something…', disabled: false, value: '' },
};

export const AuditMatrix = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:24px;max-width:480px">
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Write textarea</h3>
          <div class="write-card" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px">
            <textarea class="write-textarea" placeholder="Write something in your target language…" rows="3" style="width:100%;resize:vertical"></textarea>
          </div>
        </section>
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Practice textarea</h3>
          <textarea class="practice-textarea" placeholder="Focused input…" rows="2" style="width:100%"></textarea>
        </section>
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Disabled</h3>
          <textarea class="practice-textarea" placeholder="Disabled" disabled rows="2" style="width:100%;opacity:0.6"></textarea>
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
      <div style="display:flex;flex-direction:column;gap:12px;max-width:360px">
        <textarea class="practice-textarea" placeholder="Empty" rows="2" style="width:100%"></textarea>
        <textarea class="practice-textarea" rows="2" style="width:100%">Filled with text</textarea>
        <textarea class="practice-textarea" placeholder="Disabled" disabled rows="2" style="width:100%;opacity:0.6"></textarea>
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
        <textarea class="practice-textarea" rows="1" style="width:100%">Very long single line without breaks that might overflow</textarea>
        <textarea class="practice-textarea" rows="4" style="width:100%">Émojis: 🎉 ✓ 日本語</textarea>
      </div>
    `;
    return div;
  },
};

export const Playground = {
  render: (args) => {
    const ta = document.createElement('textarea');
    ta.className = 'practice-textarea';
    ta.placeholder = args.placeholder;
    ta.rows = 3;
    ta.style.width = '100%';
    ta.disabled = args.disabled;
    ta.value = args.value;
    return ta;
  },
};
