/* ═══════════════════════════════════════════════════════════════
   LinguaLog — Frontend SPA
   ═══════════════════════════════════════════════════════════════ */

// ── State ─────────────────────────────────────────────────────────────────────
const S = {
  view: 'writing-room',
  session: { language: 'English', register: 'Informal', medium: 'Written' },
  entries: [],
  mistakes: [],
  // Writing room
  currentDraft: '',
  currentEntryId: null,
  currentAnalysis: null,
  isAnalyzing: false,
  // Dashboard
  dashView: 'topic',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  selectedCalDay: null,
  // Mistake library
  filters: { language: '', register: '', medium: '', errorType: '', layer: '' },
  showMastered: false,
  // Practice modal
  practice: null, // { mistake, scenario, phase: 'prompt'|'evaluating'|'feedback', result }
  // Analysis tabs
  analysisTab: 'original', // 'original' | 'corrected' | 'native'
  // Per-entry expanded tab state
  entryTabs: {}, // entryId → 'original' | 'corrected' | 'native'
  // Mistake card expanded state
  mistakeExpanded: {}, // mistakeId → boolean
};

// ── API ───────────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'default', duration = 3000) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── Escape HTML ───────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Format date ───────────────────────────────────────────────────────────────
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateTime(iso) { return `${fmtDate(iso)} · ${fmtTime(iso)}`; }

// ── Session persistence ───────────────────────────────────────────────────────
function saveSession() {
  localStorage.setItem('ll-session', JSON.stringify(S.session));
}
function loadSession() {
  try {
    const s = localStorage.getItem('ll-session');
    if (s) S.session = JSON.parse(s);
  } catch {}
}

// ── Rewrite prompt ─────────────────────────────────────────────────────────────
const DEFAULT_REWRITE_PROMPT = 'Complete rewrite how a native {language} speaker would naturally express this in {register} {medium} style. Preserve meaning exactly.';

function getRewritePrompt() {
  try { return localStorage.getItem('ll-rewrite-prompt') || DEFAULT_REWRITE_PROMPT; }
  catch { return DEFAULT_REWRITE_PROMPT; }
}

function openRewritePromptModal() {
  document.getElementById('rewrite-prompt-input').value = getRewritePrompt();
  document.getElementById('rewrite-prompt-modal').style.display = 'flex';
}

function closeRewritePromptModal() {
  document.getElementById('rewrite-prompt-modal').style.display = 'none';
}

function resetRewritePrompt() {
  document.getElementById('rewrite-prompt-input').value = DEFAULT_REWRITE_PROMPT;
}

function saveRewritePrompt() {
  const val = document.getElementById('rewrite-prompt-input').value.trim();
  if (!val) { toast('Prompt cannot be empty', 'error'); return; }
  localStorage.setItem('ll-rewrite-prompt', val);
  closeRewritePromptModal();
  toast('Rewrite style saved', 'success');
}

// ── Navigate ──────────────────────────────────────────────────────────────────
function navigate(view) {
  S.view = view;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  render();
}

// ── Streak ────────────────────────────────────────────────────────────────────
function computeStreak(entries) {
  const writtenDays = new Set(
    entries.filter(e => e.status !== 'Draft').map(e => e.createdAt.slice(0, 10))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (writtenDays.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function updateStreak() {
  const streak = computeStreak(S.entries);
  const el = document.getElementById('streak-display');
  const cnt = document.getElementById('streak-count');
  if (streak > 0) {
    el.style.display = 'flex';
    cnt.textContent = streak;
  } else {
    el.style.display = 'none';
  }
}

function updateMistakeBadge() {
  const due = S.mistakes.filter(m => m.status === 'active' && m.isDue).length;
  const badge = document.getElementById('mistake-badge');
  if (due > 0) {
    badge.textContent = due;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ── Inline diff helper ─────────────────────────────────────────────────────────
// Takes plain text + an array of {fromField, toField} changes, returns HTML
// with <span class="inline-del"> / <span class="inline-ins"> pairs injected.
function buildAnnotatedText(text, changes, fromField, toField) {
  if (!text) return '';
  const escaped = t => esc(t).replace(/\n/g, '<br>');
  if (!changes || changes.length === 0) return escaped(text);

  // Collect {start, end, from, to} for each change found in the text
  const spans = [];
  for (const change of changes) {
    const from = change[fromField];
    if (!from) continue;
    const idx = text.indexOf(from);
    if (idx !== -1) spans.push({ start: idx, end: idx + from.length, from, to: change[toField] || from });
  }
  if (spans.length === 0) return escaped(text);

  // Sort by position; drop overlapping matches (keep first occurrence)
  spans.sort((a, b) => a.start - b.start);
  const clean = [];
  let lastEnd = 0;
  for (const s of spans) {
    if (s.start >= lastEnd) { clean.push(s); lastEnd = s.end; }
  }

  // Build annotated HTML
  let html = '';
  let pos = 0;
  for (const s of clean) {
    if (s.start > pos) html += escaped(text.slice(pos, s.start));
    html += `<span class="inline-del">${esc(s.from)}</span><span class="inline-ins">${esc(s.to)}</span>`;
    pos = s.end;
  }
  if (pos < text.length) html += escaped(text.slice(pos));
  return html;
}

function switchAnalysisTab(tab) {
  S.analysisTab = tab;
  document.querySelectorAll('.analysis-tab-panel').forEach(p => {
    p.style.display = p.dataset.tab === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.analysis-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
}

function switchEntryTab(entryId, tab) {
  S.entryTabs[entryId] = tab;
  const card = document.querySelector(`.entry-card[data-entry-id="${entryId}"]`);
  if (!card) return;
  card.querySelectorAll('.analysis-tab-panel').forEach(p => {
    p.style.display = p.dataset.tab === tab ? 'block' : 'none';
  });
  card.querySelectorAll('.analysis-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
}

// ═══════════════════════════════════════════════════════════════
// WRITING ROOM
// ═══════════════════════════════════════════════════════════════
function renderWritingRoom() {
  const entries = S.entries;

  return `
    <div class="page-header">
      <div class="flex items-center gap-12 justify-between flex-wrap">
        <div>
          <div class="page-title">Writing Room</div>
          <div class="page-subtitle">Write, analyze, and learn</div>
        </div>
        <div class="session-bar">
          <span class="session-label">Mode</span>
          <select class="session-select" id="sel-lang" title="Language">
            <option value="English" ${S.session.language === 'English' ? 'selected' : ''}>English</option>
            <option value="French" ${S.session.language === 'French' ? 'selected' : ''}>French</option>
          </select>
          <select class="session-select" id="sel-reg" title="Register">
            <option value="Formal" ${S.session.register === 'Formal' ? 'selected' : ''}>Formal</option>
            <option value="Informal" ${S.session.register === 'Informal' ? 'selected' : ''}>Informal</option>
          </select>
          <select class="session-select" id="sel-med" title="Medium">
            <option value="Written" ${S.session.medium === 'Written' ? 'selected' : ''}>Written</option>
            <option value="Spoken" ${S.session.medium === 'Spoken' ? 'selected' : ''}>Spoken</option>
          </select>
        </div>
      </div>
    </div>

    <div class="writing-room">
      <!-- Write card -->
      <div class="write-card">
        <textarea
          class="write-textarea"
          id="write-input"
          placeholder="Start writing in ${esc(S.session.language)}… (journal entry, description, message, anything)"
        >${esc(S.currentDraft)}</textarea>
        <div class="write-actions">
          <div class="write-meta">
            <span class="badge badge-${S.session.language.toLowerCase()}">${esc(S.session.language)}</span>
            <span class="text-muted text-sm">${esc(S.session.register)} · ${esc(S.session.medium)}</span>
            <span class="char-count text-muted text-sm" id="char-count">${S.currentDraft.length} chars</span>
          </div>
          <div class="flex gap-8">
            <button class="btn btn-secondary" id="btn-save-draft" title="Save as draft">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
              Save Draft
            </button>
            <button class="btn btn-ghost" id="btn-rewrite-settings" title="Customize rewrite style" onclick="openRewritePromptModal()" class="px-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <button class="btn btn-primary" id="btn-analyze" ${S.isAnalyzing ? 'disabled' : ''}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              ${S.isAnalyzing ? 'Analyzing…' : 'Analyze Writing'}
            </button>
          </div>
        </div>
      </div>

      <!-- Analysis result -->
      ${S.isAnalyzing ? `
        <div class="analyzing-overlay">
          <div class="loader-ring"></div>
          <p>Analyzing your writing with Claude…</p>
        </div>
      ` : ''}

      ${S.currentAnalysis && !S.isAnalyzing ? renderAnalysisResult(S.currentAnalysis) : ''}

      <!-- Past entries -->
      ${entries.length > 0 ? `
        <div class="entries-section-title">Past Entries (${entries.length})</div>
        <div id="entries-list">
          ${entries.map(e => renderEntryCard(e)).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">✍️</div>
          <strong>Nothing written yet</strong>
          <p>Write something above and click Analyze to get started.</p>
        </div>
      `}
    </div>
  `;
}

function renderAnalysisResult(analysis) {
  const corrections  = analysis.corrections  || [];
  const nativeChanges = analysis.nativeChanges || [];
  const activeTab    = S.analysisTab || 'original';
  const originalText = analysis.originalText  || '';

  // Helper: wrap content in a tab panel div
  const tabPanel = (tab, content) =>
    `<div class="analysis-tab-panel analysis-tab-content" data-tab="${tab}"
          style="display:${activeTab === tab ? 'block' : 'none'}">${content}</div>`;

  // Helper: legend row for annotated tabs
  const diffLegend = `
    <div class="diff-legend">
      <span class="diff-legend-item">
        <span class="inline-del" style="pointer-events:none">mistake</span> original error
      </span>
      <span class="diff-legend-item">
        <span class="inline-ins" style="pointer-events:none">fix</span> correction
      </span>
    </div>`;

  // Helper: collapsible change-detail list
  const changeList = (items, fromF, toF) => items.length === 0 ? '' : `
    <div class="changes-divider"></div>
    <div class="changes-section-title">Changes explained</div>
    <div class="analysis-changes">
      ${items.map(c => `
        <div class="analysis-change-item">
          <span class="change-before">${esc(c[fromF])}</span>
          <span class="change-arrow"> → </span>
          <span class="change-after">${esc(c[toF])}</span>
          <div class="change-explanation">${esc(c.explanation)}</div>
        </div>`).join('')}
    </div>`;

  return `
    <div class="analysis-container" id="analysis-result">

      <div class="analysis-header">
        <span class="analysis-title">Analysis Complete</span>
        <div class="analysis-meta">
          <span class="badge badge-${S.session.language.toLowerCase()}">${esc(S.session.language)}</span>
          <span class="text-sm text-muted">${esc(S.session.register)} · ${esc(S.session.medium)}</span>
          ${analysis.topic ? `<span class="badge badge-neutral">📌 ${esc(analysis.topic)}</span>` : ''}
        </div>
      </div>

      <div class="analysis-tabs">
        <button class="analysis-tab-btn ${activeTab === 'original'  ? 'active' : ''}" data-tab="original"  onclick="switchAnalysisTab('original')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Original
        </button>
        <button class="analysis-tab-btn ${activeTab === 'corrected' ? 'active' : ''}" data-tab="corrected" onclick="switchAnalysisTab('corrected')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Corrected
          ${corrections.length   > 0 ? `<span class="tab-count">${corrections.length}</span>`   : ''}
        </button>
        <button class="analysis-tab-btn ${activeTab === 'native'    ? 'active' : ''}" data-tab="native"    onclick="switchAnalysisTab('native')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Native Rewrite
          ${nativeChanges.length > 0 ? `<span class="tab-count">${nativeChanges.length}</span>` : ''}
        </button>
      </div>

      ${tabPanel('original', `
        <div class="analysis-panel-text text-muted pre-wrap">${esc(originalText)}</div>
      `)}

      ${tabPanel('corrected', corrections.length === 0
        ? `<div class="no-changes">✓ No grammar or spelling errors found</div>`
        : `${diffLegend}
           <div class="analysis-panel-text pre-wrap line-height-2">${buildAnnotatedText(originalText, corrections, 'original', 'corrected')}</div>
           ${changeList(corrections, 'original', 'corrected')}`
      )}

      ${tabPanel('native', nativeChanges.length === 0
        ? `<div class="analysis-panel-text" style="white-space:pre-wrap">${esc(analysis.correctedText || '')}</div>
           <div class="no-changes mt-12">✓ Already sounds native — no style changes needed</div>`
        : `${diffLegend}
           <div class="analysis-panel-text pre-wrap line-height-2">${buildAnnotatedText(analysis.correctedText || '', nativeChanges, 'original', 'native')}</div>
           ${changeList(nativeChanges, 'original', 'native')}`
      )}

      <div class="analysis-footer">
        <div class="mistakes-logged">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          ${(analysis.mistakes || []).length} mistake(s) logged to your library
        </div>
        <button class="btn btn-ghost btn-sm" onclick="S.currentAnalysis=null;render()">Dismiss</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('mistake-library')">View Mistake Library →</button>
      </div>

    </div>
  `;
}

function renderEntryAnalysis(entry) {
  const activeTab = S.entryTabs[entry.id] || 'original';
  const corrections  = entry.analysis.corrections  || [];
  const nativeChanges = entry.analysis.nativeChanges || [];
  const originalText = entry.text;

  const diffLegend = `
    <div class="diff-legend">
      <span class="diff-legend-item">
        <span class="inline-del" style="pointer-events:none">mistake</span> original error
      </span>
      <span class="diff-legend-item">
        <span class="inline-ins" style="pointer-events:none">fix</span> correction
      </span>
    </div>`;

  const changeList = (items, fromF, toF) => items.length === 0 ? '' : `
    <div class="changes-divider"></div>
    <div class="changes-section-title">Changes explained</div>
    <div class="analysis-changes">
      ${items.map(c => `
        <div class="analysis-change-item">
          <span class="change-before">${esc(c[fromF])}</span>
          <span class="change-arrow"> → </span>
          <span class="change-after">${esc(c[toF])}</span>
          <div class="change-explanation">${esc(c.explanation)}</div>
        </div>`).join('')}
    </div>`;

  const tabPanel = (tab, content) =>
    `<div class="analysis-tab-panel analysis-tab-content" data-tab="${tab}"
          style="display:${activeTab === tab ? 'block' : 'none'}" class="tab-panel-padding">${content}</div>`;

  return `
    <div class="analysis-tabs analysis-tabs-bar">
      <button class="analysis-tab-btn ${activeTab === 'original'  ? 'active' : ''}" data-tab="original"
              onclick="switchEntryTab('${esc(entry.id)}', 'original')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Original
      </button>
      <button class="analysis-tab-btn ${activeTab === 'corrected' ? 'active' : ''}" data-tab="corrected"
              onclick="switchEntryTab('${esc(entry.id)}', 'corrected')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Corrected
        ${corrections.length   > 0 ? `<span class="tab-count">${corrections.length}</span>`   : ''}
      </button>
      <button class="analysis-tab-btn ${activeTab === 'native'    ? 'active' : ''}" data-tab="native"
              onclick="switchEntryTab('${esc(entry.id)}', 'native')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Native Rewrite
        ${nativeChanges.length > 0 ? `<span class="tab-count">${nativeChanges.length}</span>` : ''}
      </button>
    </div>

    ${tabPanel('original', `
      <div class="analysis-panel-text text-muted pre-wrap cal-entry-text">${esc(originalText)}</div>
    `)}

    ${tabPanel('corrected', corrections.length === 0
      ? `<div class="no-changes">✓ No grammar or spelling errors found</div>`
      : `${diffLegend}
         <div class="analysis-panel-text pre-wrap line-height-2 cal-entry-text">${buildAnnotatedText(originalText, corrections, 'original', 'corrected')}</div>
         ${changeList(corrections, 'original', 'corrected')}`
    )}

    ${tabPanel('native', nativeChanges.length === 0
      ? `<div class="analysis-panel-text pre-wrap cal-entry-text">${esc(entry.analysis.correctedText || '')}</div>
         <div class="no-changes mt-12">✓ Already sounds native — no style changes needed</div>`
      : `${diffLegend}
         <div class="analysis-panel-text pre-wrap line-height-2 cal-entry-text">${buildAnnotatedText(entry.analysis.correctedText || '', nativeChanges, 'original', 'native')}</div>
         ${changeList(nativeChanges, 'original', 'native')}`
    )}

    <div class="entry-actions">
      <button class="btn btn-secondary btn-sm" onclick="navigate('mistake-library')">View Mistakes</button>
      <button class="btn btn-danger btn-sm" onclick="deleteEntry('${esc(entry.id)}')">Delete</button>
    </div>
  `;
}

function renderEntryCard(entry) {
  const preview = entry.text.slice(0, 120) + (entry.text.length > 120 ? '…' : '');
  const isExpanded = entry._expanded;
  const statusClass = `badge-${entry.status.toLowerCase()}`;

  return `
    <div class="entry-card ${isExpanded ? 'expanded' : ''}" data-entry-id="${esc(entry.id)}">
      <div class="entry-header" onclick="toggleEntry('${esc(entry.id)}')">
        <div class="flex-1 min-w-0">
          <div class="entry-meta">
            <span class="badge badge-${esc(entry.language.toLowerCase())}">${esc(entry.language)}</span>
            <span class="badge ${statusClass}">${esc(entry.status)}</span>
            ${entry.topic ? `<span class="entry-topic">📌 ${esc(entry.topic)}</span>` : ''}
            <span class="entry-timestamp">${fmtDateTime(entry.createdAt)}</span>
          </div>
          <div class="entry-preview">${esc(preview)}</div>
        </div>
        <svg class="entry-expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <div class="entry-body">
        ${entry.status === 'Draft' ? `
          <div class="mt-16">
            <div class="mini-label">Full Draft</div>
            <div class="mini-text">${esc(entry.text)}</div>
          </div>
          <div class="entry-actions">
            <button class="btn btn-primary btn-sm" onclick="resumeDraft('${esc(entry.id)}')">
              Resume &amp; Analyze
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteEntry('${esc(entry.id)}')">Delete</button>
          </div>
        ` : entry.analysis ? renderEntryAnalysis(entry) : `
          <div class="mt-16">
            <div class="mini-text">${esc(entry.text)}</div>
          </div>
        `}
      </div>
    </div>
  `;
}

function attachWritingRoomEvents() {
  // Session selectors
  document.getElementById('sel-lang')?.addEventListener('change', e => {
    S.session.language = e.target.value;
    saveSession();
    renderWritingArea();
  });
  document.getElementById('sel-reg')?.addEventListener('change', e => {
    S.session.register = e.target.value;
    saveSession();
  });
  document.getElementById('sel-med')?.addEventListener('change', e => {
    S.session.medium = e.target.value;
    saveSession();
  });

  // Writing input
  const input = document.getElementById('write-input');
  if (input) {
    input.addEventListener('input', e => {
      S.currentDraft = e.target.value;
      const cc = document.getElementById('char-count');
      if (cc) cc.textContent = `${S.currentDraft.length} chars`;
    });
  }

  // Save draft button
  document.getElementById('btn-save-draft')?.addEventListener('click', saveDraft);

  // Analyze button
  document.getElementById('btn-analyze')?.addEventListener('click', analyzeWriting);
}

function renderWritingArea() {
  // Re-render just the placeholder (lightweight)
  const input = document.getElementById('write-input');
  if (input) input.placeholder = `Start writing in ${S.session.language}…`;
}

async function saveDraft() {
  const text = S.currentDraft.trim();
  if (!text) { toast('Nothing to save', 'error'); return; }

  try {
    if (S.currentEntryId) {
      await api('PUT', `/entries/${S.currentEntryId}`, {
        text: S.currentDraft,
        language: S.session.language,
        register: S.session.register,
        medium: S.session.medium,
      });
    } else {
      const entry = await api('POST', '/entries', {
        text: S.currentDraft,
        language: S.session.language,
        register: S.session.register,
        medium: S.session.medium,
      });
      S.currentEntryId = entry.id;
    }
    S.entries = await api('GET', '/entries');
    toast('Draft saved', 'success');
    render();
  } catch (err) {
    toast('Failed to save: ' + err.message, 'error');
  }
}

async function analyzeWriting() {
  const text = S.currentDraft.trim();
  if (!text) { toast('Write something first', 'error'); return; }
  if (text.split(' ').length < 5) { toast('Write at least a sentence to analyze', 'error'); return; }

  S.isAnalyzing = true;
  render();

  try {
    // Save entry first if not saved
    if (!S.currentEntryId) {
      const entry = await api('POST', '/entries', {
        text,
        language: S.session.language,
        register: S.session.register,
        medium: S.session.medium,
      });
      S.currentEntryId = entry.id;
    } else {
      await api('PUT', `/entries/${S.currentEntryId}`, { text });
    }

    const result = await api('POST', '/analyze', {
      text,
      language: S.session.language,
      register: S.session.register,
      medium: S.session.medium,
      entryId: S.currentEntryId,
      rewritePrompt: getRewritePrompt(),
    });

    result.analysis.originalText = text;
    S.currentAnalysis = result.analysis;
    S.analysisTab = 'original';
    S.entries = await api('GET', '/entries');
    S.mistakes = await api('GET', '/mistakes');

    if (result.newMistakesCount > 0) {
      toast(`${result.newMistakesCount} new mistake(s) logged`, 'default');
    } else {
      toast('Analysis complete!', 'success');
    }

    // Clear draft for new writing
    S.currentDraft = '';
    S.currentEntryId = null;
  } catch (err) {
    toast('Analysis failed: ' + err.message, 'error');
  } finally {
    S.isAnalyzing = false;
    render();
    updateMistakeBadge();
  }
}

function toggleEntry(id) {
  S.entries = S.entries.map(e =>
    e.id === id ? { ...e, _expanded: !e._expanded } : e
  );
  const card = document.querySelector(`.entry-card[data-entry-id="${id}"]`);
  if (card) {
    card.classList.toggle('expanded');
    const body = card.querySelector('.entry-body');
    if (body) body.style.display = card.classList.contains('expanded') ? 'block' : 'none';
  }
}

function resumeDraft(entryId) {
  const entry = S.entries.find(e => e.id === entryId);
  if (!entry) return;
  S.currentDraft = entry.text;
  S.currentEntryId = entry.id;
  S.session = { language: entry.language, register: entry.register, medium: entry.medium };
  saveSession();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
  setTimeout(() => {
    const input = document.getElementById('write-input');
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }, 50);
}

async function deleteEntry(entryId) {
  if (!confirm('Delete this entry?')) return;
  try {
    await api('DELETE', `/entries/${entryId}`);
    S.entries = S.entries.filter(e => e.id !== entryId);
    if (S.currentEntryId === entryId) {
      S.currentEntryId = null;
      S.currentDraft = '';
    }
    toast('Entry deleted');
    render();
  } catch (err) {
    toast('Delete failed: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function renderDashboard() {
  const analyzedEntries = S.entries.filter(e => e.status !== 'Draft' && e.analysis);

  return `
    <div class="page-header">
      <div class="flex items-center gap-12 justify-between flex-wrap">
        <div>
          <div class="page-title">Dashboard</div>
          <div class="page-subtitle">${analyzedEntries.length} analyzed entries</div>
        </div>
        <div class="view-toggle">
          <button class="toggle-btn ${S.dashView === 'topic' ? 'active' : ''}" onclick="setDashView('topic')">
            Topic View
          </button>
          <button class="toggle-btn ${S.dashView === 'calendar' ? 'active' : ''}" onclick="setDashView('calendar')">
            Calendar View
          </button>
        </div>
      </div>
    </div>

    <div class="dashboard">
      ${S.dashView === 'topic' ? renderTopicView(analyzedEntries) : renderCalendarView(analyzedEntries)}
    </div>
  `;
}

function setDashView(view) {
  S.dashView = view;
  const app = document.getElementById('app');
  if (app) app.innerHTML = renderDashboard();
}

function renderTopicView(entries) {
  if (entries.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <strong>No analyzed entries yet</strong>
        <p>Analyze your writing in the Writing Room to see topics here.</p>
      </div>
    `;
  }

  // Group by topic
  const groups = {};
  entries.forEach(e => {
    const topic = e.topic || 'Uncategorized';
    if (!groups[topic]) groups[topic] = [];
    groups[topic].push(e);
  });

  // Count mistakes per entry
  const mistakesByEntry = {};
  S.mistakes.forEach(m => {
    if (!mistakesByEntry[m.entryId]) mistakesByEntry[m.entryId] = 0;
    mistakesByEntry[m.entryId]++;
  });

  // Sort topics by most mistakes first
  const sortedTopics = Object.entries(groups).sort((a, b) => {
    const aMistakes = a[1].reduce((sum, e) => sum + (mistakesByEntry[e.id] || 0), 0);
    const bMistakes = b[1].reduce((sum, e) => sum + (mistakesByEntry[e.id] || 0), 0);
    return bMistakes - aMistakes;
  });

  return `
    <div class="topic-grid">
      ${sortedTopics.map(([topic, topicEntries]) => {
        const totalMistakes = topicEntries.reduce((sum, e) => sum + (mistakesByEntry[e.id] || 0), 0);
        const lastEntry = topicEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        return `
          <div class="topic-card">
            <div class="topic-card-header">
              <div class="topic-name">${esc(topic)}</div>
              <button class="topic-edit-btn btn btn-ghost btn-sm" onclick="renameTopic(event, '${esc(topic)}')">rename</button>
            </div>
            <div class="topic-stats">
              <span class="topic-stat">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                ${topicEntries.length} entries
              </span>
              ${totalMistakes > 0 ? `
                <span class="topic-stat text-danger">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  ${totalMistakes} mistakes
                </span>
              ` : ''}
              <span class="topic-stat">Last: ${fmtDate(lastEntry.createdAt)}</span>
            </div>
            <div class="topic-entries">
              ${topicEntries
                .sort((a, b) => (mistakesByEntry[b.id] || 0) - (mistakesByEntry[a.id] || 0))
                .slice(0, 3)
                .map(e => `
                  <div class="topic-entry-row">
                    <span class="truncate" style="max-width:160px">${esc(e.text.slice(0, 60))}…</span>
                    <span class="badge badge-${e.status.toLowerCase()}">${esc(e.status)}</span>
                  </div>
                `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renameTopic(event, oldTopic) {
  event.stopPropagation();
  const newTopic = prompt(`Rename topic "${oldTopic}" to:`, oldTopic);
  if (!newTopic || newTopic === oldTopic) return;

  // Update all entries with this topic
  const toUpdate = S.entries.filter(e => e.topic === oldTopic);
  Promise.all(toUpdate.map(e =>
    api('PUT', `/entries/${e.id}`, { topic: newTopic })
  )).then(() => {
    S.entries = S.entries.map(e => e.topic === oldTopic ? { ...e, topic: newTopic } : e);
    render();
    toast(`Topic renamed to "${newTopic}"`, 'success');
  }).catch(err => toast('Rename failed: ' + err.message, 'error'));
}

function renderCalendarView(entries) {
  const year = S.calYear;
  const month = S.calMonth;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // Build map of dates → entries
  const dateMap = {};
  entries.forEach(e => {
    const key = e.createdAt.slice(0, 10);
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(e);
  });

  // Calendar math
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Build day cells
  let cells = [];
  // Padding before
  for (let i = 0; i < firstDay; i++) {
    cells.push({ num: null, key: null, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ num: d, key, entries: dateMap[key] || [], isToday: key === todayStr });
  }
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push({ num: null, key: null, otherMonth: true });

  const selectedDay = S.selectedCalDay;
  const selectedEntries = selectedDay ? (dateMap[selectedDay] || []) : [];

  return `
    <div class="calendar-section">
      <div class="calendar-nav">
        <button class="btn btn-ghost btn-sm" onclick="calNav(-1)">← Prev</button>
        <div class="calendar-month">${monthNames[month]} ${year}</div>
        <button class="btn btn-ghost btn-sm" onclick="calNav(1)">Next →</button>
      </div>

      <div class="calendar-grid">
        <div class="calendar-days-header">
          ${dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('')}
        </div>
        <div class="calendar-body">
          ${cells.map(cell => {
            if (cell.otherMonth || !cell.num) {
              return `<div class="cal-day other-month"></div>`;
            }
            const hasEntries = cell.entries.length > 0;
            const isSelected = cell.key === selectedDay;
            return `
              <div
                class="cal-day ${hasEntries ? 'has-entries' : ''} ${cell.isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                onclick="${hasEntries ? `selectCalDay('${cell.key}')` : ''}"
                style="${isSelected ? 'outline:2px solid var(--primary);outline-offset:-2px' : ''}"
              >
                <div class="cal-day-num">${cell.num}</div>
                ${hasEntries ? `
                  <div class="cal-entry-dot"></div>
                  <div class="cal-entries-count">${cell.entries.length}</div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${selectedDay ? `
        <div class="calendar-day-entries">
          <div class="calendar-day-entries-header">
            Entries for ${fmtDate(selectedDay + 'T00:00:00')} (${selectedEntries.length})
          </div>
          <div class="cal-day-padding">
            ${selectedEntries.map(e => `
              <div class="pb-border">
                <div class="flex gap-8 items-center cal-entry-row">
                  <span class="badge badge-${esc(e.language.toLowerCase())}">${esc(e.language)}</span>
                  <span class="badge badge-${esc(e.status.toLowerCase())}">${esc(e.status)}</span>
                  <span class="text-sm text-muted">${fmtTime(e.createdAt)}</span>
                </div>
                <div class="cal-entry-text">${esc(e.text.slice(0, 150))}${e.text.length > 150 ? '…' : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function calNav(dir) {
  S.calMonth += dir;
  if (S.calMonth > 11) { S.calMonth = 0; S.calYear++; }
  if (S.calMonth < 0) { S.calMonth = 11; S.calYear--; }
  S.selectedCalDay = null;
  render();
}

function selectCalDay(key) {
  S.selectedCalDay = S.selectedCalDay === key ? null : key;
  render();
}

// ═══════════════════════════════════════════════════════════════
// MISTAKE LIBRARY
// ═══════════════════════════════════════════════════════════════
function renderMistakeLibrary() {
  const f = S.filters;
  let active = S.mistakes.filter(m => m.status === 'active');
  const mastered = S.mistakes.filter(m => m.status === 'mastered');

  // Apply filters
  if (f.language) active = active.filter(m => m.language === f.language);
  if (f.register) active = active.filter(m => m.register === f.register);
  if (f.medium)   active = active.filter(m => m.medium === f.medium);
  if (f.errorType) active = active.filter(m => m.errorType === f.errorType);
  if (f.layer)    active = active.filter(m => {
    const layer = m.layer || (m.errorType === 'naturalness' ? 'native' : 'correction');
    return layer === f.layer;
  });

  // Sort by frequency desc
  active.sort((a, b) => (b.frequency || 1) - (a.frequency || 1));

  const due = active.filter(m => m.isDue);
  const errorTypes = [...new Set(S.mistakes.map(m => m.errorType).filter(Boolean))].sort();

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Mistake Library</div>
        <div class="page-subtitle">${S.mistakes.filter(m => m.status === 'active').length} active mistakes · ${mastered.length} mastered</div>
      </div>
    </div>

    <div class="mistake-library">
      <!-- Filter bar -->
      <div class="filter-bar">
        <span class="filter-label">Filter</span>
        <select class="filter-select ${f.language ? 'active' : ''}" id="f-lang" onchange="setFilter('language', this.value)">
          <option value="">All Languages</option>
          <option value="English" ${f.language === 'English' ? 'selected' : ''}>English</option>
          <option value="French" ${f.language === 'French' ? 'selected' : ''}>French</option>
        </select>
        <select class="filter-select ${f.register ? 'active' : ''}" id="f-reg" onchange="setFilter('register', this.value)">
          <option value="">All Registers</option>
          <option value="Formal" ${f.register === 'Formal' ? 'selected' : ''}>Formal</option>
          <option value="Informal" ${f.register === 'Informal' ? 'selected' : ''}>Informal</option>
        </select>
        <select class="filter-select ${f.medium ? 'active' : ''}" id="f-med" onchange="setFilter('medium', this.value)">
          <option value="">All Mediums</option>
          <option value="Written" ${f.medium === 'Written' ? 'selected' : ''}>Written</option>
          <option value="Spoken" ${f.medium === 'Spoken' ? 'selected' : ''}>Spoken</option>
        </select>
        <select class="filter-select ${f.errorType ? 'active' : ''}" id="f-type" onchange="setFilter('errorType', this.value)">
          <option value="">All Types</option>
          ${errorTypes.map(t => `<option value="${esc(t)}" ${f.errorType === t ? 'selected' : ''}>${esc(t.replace(/_/g,' '))}</option>`).join('')}
        </select>
        <div class="layer-toggle-group">
          <button class="layer-toggle-btn ${f.layer === 'correction' ? 'active correction' : ''}"
                  onclick="setFilter('layer', '${f.layer === 'correction' ? '' : 'correction'}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Grammar
          </button>
          <button class="layer-toggle-btn ${f.layer === 'native' ? 'active native' : ''}"
                  onclick="setFilter('layer', '${f.layer === 'native' ? '' : 'native'}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Native Style
          </button>
        </div>
        ${Object.values(f).some(Boolean) ? `
          <button class="btn btn-ghost btn-sm" onclick="clearFilters()">Clear filters ✕</button>
        ` : ''}
      </div>

      <!-- Spaced repetition due banner -->
      ${due.length > 0 && !Object.values(f).some(Boolean) ? `
        <div class="due-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span><strong>${due.length} mistake${due.length > 1 ? 's' : ''}</strong> due for spaced repetition review — practice them below!</span>
        </div>
      ` : ''}

      <!-- Stats -->
      <div class="mistake-stats">
        <div class="mistake-stat-pill">Showing <strong>${active.length}</strong> active</div>
        ${due.length > 0 ? `<div class="mistake-stat-pill" style="border-color:var(--primary);color:var(--primary)"><strong>${due.length}</strong> due for review</div>` : ''}
        <div class="mistake-stat-pill"><strong>${mastered.length}</strong> mastered</div>
      </div>

      <!-- Active mistakes -->
      ${active.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🎉</div>
          <strong>${Object.values(f).some(Boolean) ? 'No mistakes match your filters' : 'No mistakes yet!'}</strong>
          <p>${Object.values(f).some(Boolean) ? 'Try clearing filters.' : 'Analyze your writing to log mistakes.'}</p>
        </div>
      ` : active.map(m => renderMistakeCard(m)).join('')}

      <!-- Mastered section -->
      ${mastered.length > 0 ? `
        <div class="mastered-section">
          <div class="mastered-toggle" onclick="toggleMastered()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="${S.showMastered ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}"/></svg>
            ${S.showMastered ? 'Hide' : 'Show'} ${mastered.length} mastered mistake${mastered.length > 1 ? 's' : ''}
          </div>
          ${S.showMastered ? `
            <div class="mastered-list">
              ${mastered.map(m => `
                <div class="mastered-card">
                  <div class="mastered-expressions">
                    <span style="text-decoration:line-through" class="text-muted">${esc(m.original)}</span>
                    <span>→</span>
                    <span class="text-success">${esc(m.corrected)}</span>
                    <span class="badge badge-${esc(m.language.toLowerCase())}">${esc(m.language)}</span>
                  </div>
                  <button class="btn btn-ghost btn-sm" onclick="unmaster('${esc(m.id)}')" title="Restore to active">Restore</button>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// Returns HTML showing ~80 chars of context around the first match of `phrase` in `text`,
// with the match wrapped in a highlight mark. Falls back to showing the full text.
function highlightMistakeInText(text, phrase) {
  if (!text) return '';
  const escFn = s => esc(s).replace(/\n/g, ' ');
  if (!phrase) return escFn(text);

  const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1) {
    // Not found — show a truncated version of the full text
    const preview = text.length > 200 ? text.slice(0, 200) + '…' : text;
    return escFn(preview);
  }

  const pad = 80;
  const start  = Math.max(0, idx - pad);
  const end    = Math.min(text.length, idx + phrase.length + pad);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';

  return (
    prefix +
    escFn(text.slice(start, idx)) +
    `<mark class="mistake-highlight">${esc(text.slice(idx, idx + phrase.length))}</mark>` +
    escFn(text.slice(idx + phrase.length, end)) +
    suffix
  );
}

function toggleMistakeCard(id) {
  S.mistakeExpanded[id] = !S.mistakeExpanded[id];
  const card = document.querySelector(`.mistake-card[data-mistake-id="${id}"]`);
  if (!card) return;
  const body = card.querySelector('.mistake-context-body');
  const icon = card.querySelector('.mistake-expand-icon');
  if (body) body.style.display = S.mistakeExpanded[id] ? 'block' : 'none';
  if (icon) icon.style.transform = S.mistakeExpanded[id] ? 'rotate(180deg)' : 'rotate(0deg)';
  card.classList.toggle('expanded', !!S.mistakeExpanded[id]);
}

function getMistakeLayer(m) {
  return m.layer || (m.errorType === 'naturalness' ? 'native' : 'correction');
}

function renderMistakeCard(m) {
  const isDue = m.isDue;
  const entryRef = S.entries.find(e => e.id === m.entryId);
  const nextReview = m.nextReview ? fmtDate(m.nextReview) : 'Now';
  const layer = getMistakeLayer(m);
  const isExpanded = S.mistakeExpanded[m.id] || false;

  return `
    <div class="mistake-card ${isDue ? 'is-due' : ''} ${isExpanded ? 'expanded' : ''}" data-mistake-id="${esc(m.id)}">

      <!-- Clickable header: expressions + chevron -->
      <div class="mistake-card-top" onclick="toggleMistakeCard('${esc(m.id)}')" style="cursor:pointer">
        <div class="mistake-expressions" style="flex:1">
          <div>
            <span class="mistake-original">${esc(m.original)}</span>
            <span class="mistake-arrow">→</span>
            <span class="mistake-corrected">${esc(m.corrected)}</span>
          </div>
          <div class="mistake-explanation">${esc(m.explanation)}</div>
        </div>
        <svg class="mistake-expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             style="flex-shrink:0;color:var(--text-light);transition:transform var(--transition);transform:rotate(${isExpanded ? '180' : '0'}deg)">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <!-- Expandable: original entry in context -->
      <div class="mistake-context-body" style="display:${isExpanded ? 'block' : 'none'}">
        ${entryRef ? `
          <div class="mistake-context-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            From your entry
          </div>
          <div class="mistake-context-text">${highlightMistakeInText(entryRef.text, m.original)}</div>
          <div class="mistake-context-meta">
            <span class="badge badge-${esc(entryRef.language.toLowerCase())}">${esc(entryRef.language)}</span>
            ${entryRef.topic ? `<span class="entry-topic">📌 ${esc(entryRef.topic)}</span>` : ''}
            <span class="text-sm text-muted">${fmtDateTime(entryRef.createdAt)}</span>
          </div>
        ` : `
          <div class="mistake-context-label text-light" style="font-style:italic">
            Original entry no longer available
          </div>
        `}
      </div>

      <div class="mistake-card-meta">
        <span class="badge badge-${esc(m.language.toLowerCase())}">${esc(m.language)}</span>
        <span class="badge badge-neutral">${esc(m.register)}</span>
        <span class="badge badge-neutral">${esc(m.medium)}</span>
        <span class="badge badge-error-type">${esc((m.errorType || 'grammar').replace(/_/g,' '))}</span>
        <span class="badge badge-layer-${layer}">
          ${layer === 'native'
            ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Native Style`
            : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Grammar`
          }
        </span>
        ${isDue ? `<span class="badge badge-due">⏰ Due for review</span>` : ''}
      </div>

      <div class="mistake-card-footer">
        <div class="mistake-freq">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Seen ${m.frequency || 1}×
          ${m.reviewCount > 0 ? ` · Practiced ${m.reviewCount}×` : ''}
          ${!isDue && m.nextReview ? ` · Next review: ${nextReview}` : ''}
        </div>
        <div class="mistake-actions">
          <button class="btn btn-secondary btn-sm" onclick="startPractice('${esc(m.id)}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Practice
          </button>
          <button class="btn btn-success btn-sm" onclick="masterMistake('${esc(m.id)}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Mastered
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteMistake('${esc(m.id)}')" title="Remove mistake">✕</button>
        </div>
      </div>
    </div>
  `;
}

function setFilter(key, value) {
  S.filters[key] = value;
  render();
}

function clearFilters() {
  S.filters = { language: '', register: '', medium: '', errorType: '', layer: '' };
  render();
}

function toggleMastered() {
  S.showMastered = !S.showMastered;
  render();
}

async function masterMistake(id) {
  try {
    await api('PUT', `/mistakes/${id}`, { status: 'mastered' });
    S.mistakes = S.mistakes.map(m => m.id === id ? { ...m, status: 'mastered' } : m);
    toast('Marked as mastered! 🎉', 'success');
    render();
    updateMistakeBadge();
  } catch (err) {
    toast('Failed: ' + err.message, 'error');
  }
}

async function unmaster(id) {
  try {
    await api('PUT', `/mistakes/${id}`, { status: 'active', nextReview: new Date().toISOString() });
    S.mistakes = S.mistakes.map(m => m.id === id ? { ...m, status: 'active', isDue: true } : m);
    toast('Restored to active');
    render();
  } catch (err) {
    toast('Failed: ' + err.message, 'error');
  }
}

async function deleteMistake(id) {
  if (!confirm('Remove this mistake from your library?')) return;
  try {
    await api('DELETE', `/mistakes/${id}`);
    S.mistakes = S.mistakes.filter(m => m.id !== id);
    toast('Mistake removed');
    render();
    updateMistakeBadge();
  } catch (err) {
    toast('Delete failed: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════
// PRACTICE SESSION
// ═══════════════════════════════════════════════════════════════
async function startPractice(mistakeId) {
  const mistake = S.mistakes.find(m => m.id === mistakeId);
  if (!mistake) return;

  S.practice = { mistake, scenario: null, phase: 'loading', result: null };
  showPracticeModal();

  try {
    const res = await api('POST', '/practice/start', { mistake });
    S.practice.scenario = res.scenario;
    S.practice.phase = 'prompt';
    refreshPracticeModal();
  } catch (err) {
    toast('Could not generate practice: ' + err.message, 'error');
    closePracticeModal();
  }
}

function showPracticeModal() {
  const modal = document.getElementById('practice-modal');
  modal.style.display = 'flex';
  refreshPracticeModal();
}

function closePracticeModal() {
  document.getElementById('practice-modal').style.display = 'none';
  S.practice = null;
}

function refreshPracticeModal() {
  const content = document.getElementById('practice-content');
  if (!content || !S.practice) return;
  content.innerHTML = renderPracticeModal();
  attachPracticeEvents();
}

function renderPracticeModal() {
  if (!S.practice) return '';
  const { mistake, scenario, phase, result } = S.practice;

  return `
    <div class="modal-header">
      <div class="modal-title">Practice Session</div>
      <button class="modal-close" onclick="closePracticeModal()">×</button>
    </div>

    <div class="modal-body">
      <!-- Mistake being practiced -->
      <div class="practice-mistake-box">
        <div class="practice-mistake-label">Practicing this mistake</div>
        <div class="practice-mistake-expressions">
          <span class="mistake-original">${esc(mistake.original)}</span>
          <span class="text-light">→</span>
          <span class="mistake-corrected">${esc(mistake.corrected)}</span>
          <span class="badge badge-${esc(mistake.language.toLowerCase())}">${esc(mistake.language)}</span>
          <span class="badge badge-error-type">${esc((mistake.errorType || 'grammar').replace(/_/g,' '))}</span>
        </div>
        <div class="mistake-explanation mt-8">${esc(mistake.explanation)}</div>
      </div>

      ${phase === 'loading' ? `
        <div class="loading-state">
          <div class="loader-ring" style="margin:0 auto"></div>
          <p>Generating your practice scenario…</p>
        </div>
      ` : ''}

      ${scenario && phase !== 'loading' ? `
        <div class="practice-scenario">${esc(scenario)}</div>

        ${phase === 'prompt' || phase === 'evaluating' ? `
          <div class="practice-response-label">Your response:</div>
          <textarea
            class="practice-textarea"
            id="practice-input"
            placeholder="Write your response in ${esc(mistake.language)}…"
            ${phase === 'evaluating' ? 'disabled' : ''}
          >${esc(S.practice._userResponse || '')}</textarea>
        ` : ''}

        ${phase === 'feedback' && result ? `
          <div class="practice-feedback ${result.success ? 'success' : 'retry'}">
            <div class="practice-feedback-title">
              ${result.success ? '✓ Great job!' : '✗ Not quite — try again!'}
            </div>
            <div>${esc(result.feedback)}</div>
            ${result.targetFound ? `
              <div class="practice-target-found">Found: "<em>${esc(result.targetFound)}</em>"</div>
            ` : ''}
          </div>

          ${!result.success && result.alternativePrompt ? `
            <div class="mt-16">
              <div class="practice-response-label">Try this scenario instead:</div>
              <div class="practice-scenario">${esc(result.alternativePrompt)}</div>
              <div class="practice-response-label">Your response:</div>
              <textarea class="practice-textarea" id="practice-input-retry" placeholder="Write your response in ${esc(mistake.language)}…"></textarea>
            </div>
          ` : ''}
        ` : ''}
      ` : ''}
    </div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closePracticeModal()">Close</button>

      ${phase === 'prompt' ? `
        <button class="btn btn-primary" id="btn-submit-practice">
          Submit Response
        </button>
      ` : ''}

      ${phase === 'feedback' && result ? `
        ${result.success ? `
          <button class="btn btn-success" onclick="masterMistakeFromPractice('${esc(mistake.id)}')">
            Mark as Mastered ✓
          </button>
          <button class="btn btn-secondary" onclick="newPracticeScenario('${esc(mistake.id)}')">
            Try Another Scenario
          </button>
        ` : result.alternativePrompt ? `
          <button class="btn btn-primary" id="btn-submit-retry">
            Try Again
          </button>
        ` : `
          <button class="btn btn-primary" onclick="newPracticeScenario('${esc(mistake.id)}')">
            New Scenario
          </button>
        `}
      ` : ''}
    </div>
  `;
}

function attachPracticeEvents() {
  document.getElementById('btn-submit-practice')?.addEventListener('click', submitPracticeResponse);
  document.getElementById('btn-submit-retry')?.addEventListener('click', submitRetryResponse);
}

async function submitPracticeResponse() {
  const input = document.getElementById('practice-input');
  const userResponse = input?.value?.trim();
  if (!userResponse) { toast('Write a response first', 'error'); return; }

  S.practice._userResponse = userResponse;
  S.practice.phase = 'evaluating';
  refreshPracticeModal();

  try {
    const result = await api('POST', '/practice/evaluate', {
      mistake: S.practice.mistake,
      scenario: S.practice.scenario,
      userResponse,
    });

    S.practice.result = result;
    S.practice.phase = 'feedback';

    // Refresh mistakes for updated spaced repetition
    S.mistakes = await api('GET', '/mistakes');
    updateMistakeBadge();

    if (result.success && result.nextReviewDays) {
      toast(`Next review in ${result.nextReviewDays} day${result.nextReviewDays > 1 ? 's' : ''}`, 'success');
    }

    refreshPracticeModal();
  } catch (err) {
    S.practice.phase = 'prompt';
    toast('Evaluation failed: ' + err.message, 'error');
    refreshPracticeModal();
  }
}

async function submitRetryResponse() {
  const input = document.getElementById('practice-input-retry');
  const userResponse = input?.value?.trim();
  if (!userResponse) { toast('Write a response first', 'error'); return; }

  // Use the alternative prompt as the new scenario
  S.practice.scenario = S.practice.result.alternativePrompt;
  S.practice._userResponse = userResponse;
  S.practice.phase = 'evaluating';
  refreshPracticeModal();

  try {
    const result = await api('POST', '/practice/evaluate', {
      mistake: S.practice.mistake,
      scenario: S.practice.scenario,
      userResponse,
    });

    S.practice.result = result;
    S.practice.phase = 'feedback';
    S.mistakes = await api('GET', '/mistakes');
    updateMistakeBadge();
    refreshPracticeModal();
  } catch (err) {
    S.practice.phase = 'prompt';
    toast('Evaluation failed: ' + err.message, 'error');
    refreshPracticeModal();
  }
}

async function masterMistakeFromPractice(id) {
  await masterMistake(id);
  closePracticeModal();
  if (S.view === 'mistake-library') render();
}

async function newPracticeScenario(mistakeId) {
  await startPractice(mistakeId);
}

// ═══════════════════════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════════════════════
function render() {
  const app = document.getElementById('app');
  if (!app) return;

  switch (S.view) {
    case 'writing-room':
      app.innerHTML = renderWritingRoom();
      attachWritingRoomEvents();
      break;
    case 'dashboard':
      app.innerHTML = renderDashboard();
      break;
    case 'mistake-library':
      app.innerHTML = renderMistakeLibrary();
      break;
  }

  updateStreak();
  updateMistakeBadge();
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
async function init() {
  loadSession();

  // Wire up nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // Close modal on overlay click
  document.getElementById('practice-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('practice-modal')) closePracticeModal();
  });
  document.getElementById('rewrite-prompt-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('rewrite-prompt-modal')) closeRewritePromptModal();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePracticeModal(); closeRewritePromptModal(); }
  });

  try {
    [S.entries, S.mistakes] = await Promise.all([
      api('GET', '/entries'),
      api('GET', '/mistakes'),
    ]);
  } catch (err) {
    console.error('Failed to load data:', err);
    toast('Could not load data from server', 'error');
  }

  render();
}

// Expose functions needed from HTML onclick attributes
window.toggleEntry = toggleEntry;
window.resumeDraft = resumeDraft;
window.deleteEntry = deleteEntry;
window.setDashView = setDashView;
window.calNav = calNav;
window.selectCalDay = selectCalDay;
window.renameTopic = renameTopic;
window.setFilter = setFilter;
window.clearFilters = clearFilters;
window.toggleMastered = toggleMastered;
window.masterMistake = masterMistake;
window.unmaster = unmaster;
window.deleteMistake = deleteMistake;
window.startPractice = startPractice;
window.closePracticeModal = closePracticeModal;
window.switchAnalysisTab = switchAnalysisTab;
window.switchEntryTab = switchEntryTab;
window.toggleMistakeCard = toggleMistakeCard;
window.openRewritePromptModal = openRewritePromptModal;
window.closeRewritePromptModal = closeRewritePromptModal;
window.resetRewritePrompt = resetRewritePrompt;
window.saveRewritePrompt = saveRewritePrompt;
window.masterMistakeFromPractice = masterMistakeFromPractice;
window.newPracticeScenario = newPracticeScenario;
window.submitRetryResponse = submitRetryResponse;

// Boot
init();
