/** LinguaLog Modal — Figma ↔ code parity */
export default {
  title: 'Components/Modal',
  parameters: { layout: 'padded' },
};

export const AuditMatrix = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="max-width:580px">
        <div class="modal-box" style="position:relative;max-height:none">
          <div class="modal-header">
            <div class="modal-title">Practice Session</div>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <div class="practice-mistake-box">
              <div class="practice-mistake-label">Target Expression</div>
              <div class="practice-mistake-expressions">
                <span class="mistake-original">je sentir</span>
                <span class="mistake-arrow">→</span>
                <span class="mistake-corrected">je me sens</span>
              </div>
            </div>
            <div class="practice-scenario">
              Vous discutez avec un ami. Il vous demande comment vous allez. Répondez en utilisant l'expression correcte.
            </div>
            <div class="practice-response-label">Your response in French</div>
            <textarea class="practice-textarea" placeholder="Write your response here…" rows="3" style="width:100%"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost">Skip</button>
            <button class="btn btn-primary">Next →</button>
          </div>
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
      <div style="max-width:400px">
        <div class="modal-box" style="position:relative;max-height:none">
          <div class="modal-header">
            <div class="modal-title">Simple Modal</div>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>Modal body content.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost">Cancel</button>
            <button class="btn btn-primary">Confirm</button>
          </div>
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
      <div style="max-width:400px">
        <div class="modal-box" style="position:relative;max-height:none">
          <div class="modal-header">
            <div class="modal-title">Very long modal title that might wrap to multiple lines</div>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p>Long body content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
        </div>
      </div>
    `;
    return div;
  },
};

export const Playground = {
  render: (args) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal-box" style="position:relative;max-height:none;max-width:400px">
        <div class="modal-header">
          <div class="modal-title">${args.title || 'Modal'}</div>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>${args.body || 'Content'}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary">${args.primaryLabel || 'OK'}</button>
        </div>
      </div>
    `;
    return div;
  },
  argTypes: { title: { control: 'text' }, body: { control: 'text' }, primaryLabel: { control: 'text' } },
  args: { title: 'Modal', body: 'Body content', primaryLabel: 'OK' },
};
