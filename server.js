require('dotenv').config({ override: true });
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { Redis } = require('@upstash/redis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ── Retry helper ──────────────────────────────────────────────────────────────
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isOverloaded = err?.status === 529 ||
        (err?.message && err.message.includes('overloaded_error'));
      if (isOverloaded && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Anthropic API overloaded — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ── Data helpers ──────────────────────────────────────────────────────────────
async function readData(key) {
  const data = await redis.get(key);
  return data || [];
}

async function writeData(key, data) {
  await redis.set(key, data);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function safeParseJSON(text) {
  text = text.trim();
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1].trim());
  // Try raw
  return JSON.parse(text);
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── ENTRIES ───────────────────────────────────────────────────────────────────
app.get('/api/entries', async (_req, res) => {
  const entries = await readData('entries');
  res.json(entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/entries', async (req, res) => {
  const entries = await readData('entries');
  const entry = {
    id: uid(),
    text: req.body.text,
    language: req.body.language,
    register: req.body.register,
    medium: req.body.medium,
    status: 'Draft',
    topic: null,
    analysis: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.push(entry);
  await writeData('entries', entries);
  res.json(entry);
});

app.put('/api/entries/:id', async (req, res) => {
  const entries = await readData('entries');
  const idx = entries.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  entries[idx] = { ...entries[idx], ...req.body, updatedAt: new Date().toISOString() };
  await writeData('entries', entries);
  res.json(entries[idx]);
});

app.delete('/api/entries/:id', async (req, res) => {
  const entries = (await readData('entries')).filter(e => e.id !== req.params.id);
  await writeData('entries', entries);
  res.json({ success: true });
});

// ── MISTAKES ──────────────────────────────────────────────────────────────────
app.get('/api/mistakes', async (_req, res) => {
  const now = new Date();
  const mistakes = (await readData('mistakes')).map(m => ({
    ...m,
    isDue: m.status === 'active' && new Date(m.nextReview) <= now,
  }));
  res.json(mistakes);
});

app.put('/api/mistakes/:id', async (req, res) => {
  const mistakes = await readData('mistakes');
  const idx = mistakes.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  mistakes[idx] = { ...mistakes[idx], ...req.body };
  await writeData('mistakes', mistakes);
  res.json(mistakes[idx]);
});

app.delete('/api/mistakes/:id', async (req, res) => {
  const mistakes = (await readData('mistakes')).filter(m => m.id !== req.params.id);
  await writeData('mistakes', mistakes);
  res.json({ success: true });
});

// ── AI: ANALYZE ───────────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { text, language, register, medium, entryId, rewritePrompt } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'No text provided' });

  const defaultRewriteInstruction = `Complete rewrite how a native ${language} speaker would naturally ${medium === 'Spoken' ? 'say' : 'write'} it in ${register.toLowerCase()} register. Preserve meaning exactly.`;
  const rewriteInstruction = rewritePrompt
    ? rewritePrompt
        .replace(/\{language\}/g, language)
        .replace(/\{register\}/g, register.toLowerCase())
        .replace(/\{medium\}/g, medium.toLowerCase())
    : defaultRewriteInstruction;

  const systemPrompt = `You are an expert ${language} language coach specializing in ${register.toLowerCase()} ${medium.toLowerCase()} expression. You return structured JSON feedback only.`;

  const userPrompt = `Analyze this ${language} text (${register} register, ${medium} medium):

"${text}"

Return ONLY a valid JSON object with this exact structure — no markdown, no preamble:
{
  "topic": "1-3 word topic label (e.g. 'Travel', 'Daily Life', 'Work', 'Food', 'Emotions')",
  "correctedText": "Full text with all objective errors fixed. Keep the user's style and meaning.",
  "corrections": [
    {
      "original": "exact wrong phrase from the original",
      "corrected": "the correct version",
      "explanation": "brief explanation of the error (1 sentence)"
    }
  ],
  "nativeText": "${rewriteInstruction}",
  "nativeChanges": [
    {
      "original": "phrase from the corrected text",
      "native": "how a native speaker says it",
      "explanation": "why this sounds more natural (1 sentence)"
    }
  ],
  "mistakes": [
    {
      "layer": "correction|native",
      "errorType": "grammar|vocabulary|preposition|sentence_structure|naturalness|spelling|punctuation",
      "original": "the wrong expression",
      "corrected": "the correct expression",
      "explanation": "clear, actionable explanation for the learner"
    }
  ]
}

Rules:
- corrections (Layer 1): objective errors only — grammar, spelling, verb conjugation, articles, tense, prepositions
- nativeChanges (Layer 2): what sounds unnatural for ${register} ${medium} ${language}, even if grammatically correct
- If no errors in a layer, return [] for that array
- mistakes: all errors worth deliberate practice (union of both layers, unique items only)
- mistakes[].layer: "correction" for Layer 1 objective errors, "native" for Layer 2 naturalness improvements
- Calibrate strictly to ${register} register and ${medium} medium
- Return raw JSON only — no markdown fences, no extra text`;

  try {
    const message = await withRetry(() => client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }));

    const analysis = safeParseJSON(message.content[0].text);

    // Update entry
    const entries = await readData('entries');
    const eIdx = entries.findIndex(e => e.id === entryId);
    if (eIdx !== -1) {
      entries[eIdx].status = 'Analyzed';
      entries[eIdx].topic = analysis.topic;
      entries[eIdx].analysis = analysis;
      entries[eIdx].updatedAt = new Date().toISOString();
      await writeData('entries', entries);
    }

    // Merge mistakes into library
    const mistakes = await readData('mistakes');
    let newCount = 0;
    (analysis.mistakes || []).forEach(m => {
      if (!m.original || !m.corrected) return;
      const existing = mistakes.find(
        em => em.status !== 'mastered' &&
          em.language === language &&
          em.original.toLowerCase().trim() === m.original.toLowerCase().trim()
      );
      if (existing) {
        existing.frequency = (existing.frequency || 1) + 1;
        existing.lastSeen = new Date().toISOString();
        existing.nextReview = new Date().toISOString(); // resurface
      } else {
        mistakes.push({
          id: uid(),
          entryId: entryId || null,
          language,
          register,
          medium,
          layer: m.layer || (m.errorType === 'naturalness' ? 'native' : 'correction'),
          errorType: m.errorType || 'grammar',
          original: m.original,
          corrected: m.corrected,
          explanation: m.explanation,
          frequency: 1,
          status: 'active',
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          nextReview: new Date().toISOString(),
          reviewCount: 0,
          lastPracticed: null,
        });
        newCount++;
      }
    });
    await writeData('mistakes', mistakes);

    res.json({
      success: true,
      analysis,
      entry: eIdx !== -1 ? entries[eIdx] : null,
      newMistakesCount: newCount,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    const isOverloaded = err?.status === 529 || (err?.message && err.message.includes('overloaded_error'));
    const msg = isOverloaded
      ? 'The AI is currently busy. Please wait a moment and try again.'
      : err.message || 'Analysis failed';
    res.status(500).json({ error: msg });
  }
});

// ── AI: PRACTICE START ────────────────────────────────────────────────────────
app.post('/api/practice/start', async (req, res) => {
  const { mistake } = req.body;

  const prompt = `You are a ${mistake.language} language practice coach.

A student made this mistake in ${mistake.language} (${mistake.register} ${mistake.medium}):
- Wrong: "${mistake.original}"
- Correct: "${mistake.corrected}"
- Error type: ${mistake.errorType}
- Explanation: ${mistake.explanation}

Create a realistic conversational scenario in ${mistake.language} that organically requires the student to use "${mistake.corrected}". The scenario must match ${mistake.register.toLowerCase()} ${mistake.medium.toLowerCase()} ${mistake.language}. Address the student directly.

Return ONLY valid JSON — no markdown, no preamble:
{
  "scenario": "2-4 sentences setting up the situation and prompting the student to respond. Written entirely in ${mistake.language}."
}`;

  try {
    const message = await withRetry(() => client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }));
    res.json(safeParseJSON(message.content[0].text));
  } catch (err) {
    console.error('Practice start error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── AI: PRACTICE EVALUATE ─────────────────────────────────────────────────────
app.post('/api/practice/evaluate', async (req, res) => {
  const { mistake, scenario, userResponse } = req.body;

  const prompt = `You are evaluating a ${mistake.language} language learner's practice response.

Target expression to use correctly: "${mistake.corrected}"
Error type: ${mistake.errorType}
Context: ${mistake.register} ${mistake.medium} ${mistake.language}

Scenario given to student:
"${scenario}"

Student's response:
"${userResponse}"

Evaluate whether the student used "${mistake.corrected}" correctly and naturally.

Return ONLY valid JSON — no markdown, no preamble:
{
  "success": true or false,
  "feedback": "2-3 sentence warm, encouraging feedback in English. Be specific about what they did right or what to improve.",
  "targetFound": "the exact phrase from their response showing correct usage (or null if not found)",
  "alternativePrompt": "if success is false, a different easier scenario in ${mistake.language} to try again (or null if success is true)"
}`;

  try {
    const message = await withRetry(() => client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }));
    const result = safeParseJSON(message.content[0].text);

    // Update spaced repetition schedule on success
    if (result.success) {
      const mistakes = await readData('mistakes');
      const idx = mistakes.findIndex(m => m.id === mistake.id);
      if (idx !== -1) {
        const reviewCount = (mistakes[idx].reviewCount || 0) + 1;
        const intervals = [1, 3, 7, 14, 30];
        const days = intervals[Math.min(reviewCount - 1, intervals.length - 1)];
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + days);
        mistakes[idx].reviewCount = reviewCount;
        mistakes[idx].nextReview = nextReview.toISOString();
        mistakes[idx].lastPracticed = new Date().toISOString();
        await writeData('mistakes', mistakes);
        result.nextReviewDays = days;
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Evaluate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nLinguaLog is running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;
