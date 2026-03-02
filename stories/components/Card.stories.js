/** LinguaLog Mistake Card — Figma ↔ code parity */
const expandSvg = '<svg class="mistake-expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-light)"><polyline points="6 9 12 15 18 9"/></svg>';
const chatSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const playSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
const checkSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';

export default {
  title: 'Components/Card',
  parameters: { layout: 'padded' },
};

export const AuditMatrix = {
  render: () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;max-width:680px">
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Default (collapsed)</h3>
          <div class="mistake-card">
            <div class="mistake-card-top">
              <div class="mistake-expressions" style="flex:1">
                <div>
                  <span class="mistake-original">je sentir</span>
                  <span class="mistake-arrow">→</span>
                  <span class="mistake-corrected">je me sens</span>
                </div>
                <div class="mistake-explanation">Reflexive verb 'se sentir' requires the reflexive pronoun 'me'.</div>
              </div>
              ${expandSvg}
            </div>
            <div class="mistake-card-meta">
              <span class="badge badge-french">French</span>
              <span class="badge badge-neutral">Informal</span>
              <span class="badge badge-error-type">grammar</span>
            </div>
            <div class="mistake-card-footer">
              <div class="mistake-freq">${chatSvg} Seen 2× · Next review: Mar 3</div>
              <div class="mistake-actions">
                <button class="btn btn-secondary btn-sm">${playSvg} Practice</button>
                <button class="btn btn-success btn-sm">${checkSvg} Mastered</button>
                <button class="btn btn-ghost btn-sm">✕</button>
              </div>
            </div>
          </div>
        </section>
        <section>
          <h3 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px">Due for review</h3>
          <div class="mistake-card is-due">
            <div class="mistake-card-top">
              <div class="mistake-expressions" style="flex:1">
                <div>
                  <span class="mistake-original">made agreement</span>
                  <span class="mistake-arrow">→</span>
                  <span class="mistake-corrected">made an agreement</span>
                </div>
                <div class="mistake-explanation">Missing indefinite article.</div>
              </div>
              ${expandSvg}
            </div>
            <div class="mistake-card-meta">
              <span class="badge badge-english">English</span>
              <span class="badge badge-due">⏰ Due for review</span>
            </div>
            <div class="mistake-card-footer">
              <div class="mistake-freq">${chatSvg} Seen 1×</div>
              <div class="mistake-actions">
                <button class="btn btn-secondary btn-sm">Practice</button>
                <button class="btn btn-success btn-sm">Mastered</button>
              </div>
            </div>
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
      <div style="max-width:400px">
        <div class="mistake-card">
          <div class="mistake-card-top">
            <div class="mistake-expressions" style="flex:1">
              <div><span class="mistake-original">error</span><span class="mistake-arrow">→</span><span class="mistake-corrected">fix</span></div>
            </div>
            ${expandSvg}
          </div>
          <div class="mistake-card-meta"><span class="badge badge-french">French</span></div>
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
      <div style="max-width:680px">
        <div class="mistake-card">
          <div class="mistake-card-top">
            <div class="mistake-expressions" style="flex:1">
              <div>
                <span class="mistake-original">Very long original expression that might wrap to multiple lines</span>
                <span class="mistake-arrow">→</span>
                <span class="mistake-corrected">Very long corrected expression</span>
              </div>
              <div class="mistake-explanation">Long explanation text that could overflow or wrap in unexpected ways.</div>
            </div>
            ${expandSvg}
          </div>
          <div class="mistake-card-meta">
            <span class="badge badge-french">French</span>
            <span class="badge badge-error-type">sentence structure</span>
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
      <div class="mistake-card" style="max-width:400px">
        <div class="mistake-card-top">
          <div class="mistake-expressions" style="flex:1">
            <div>
              <span class="mistake-original">${args.original || 'error'}</span>
              <span class="mistake-arrow">→</span>
              <span class="mistake-corrected">${args.corrected || 'fix'}</span>
            </div>
          </div>
          ${expandSvg}
        </div>
        <div class="mistake-card-meta"><span class="badge badge-french">French</span></div>
      </div>
    `;
    return div;
  },
  argTypes: { original: { control: 'text' }, corrected: { control: 'text' } },
  args: { original: 'je sentir', corrected: 'je me sens' },
};
