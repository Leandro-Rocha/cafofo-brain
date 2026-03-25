const express = require('express');
const path = require('path');
const { getAdapter, getDefault, status: adapterStatus } = require('./adapters');
const personas = require('./personas');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[req] ${req.method} ${req.url}`);
  next();
});

// ── POST /prompt ──────────────────────────────────────────────────────────────
// Body: { persona?, message, context? }
// Response: { response, persona, adapter, model, latency_ms }

app.post('/prompt', async (req, res) => {
  const { persona: personaName = 'default', message, context = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: '"message" é obrigatório e deve ser string.' });
  }

  const start = Date.now();
  try {
    const persona = personas.get(personaName);
    const adapterName = persona.adapter || 'groq';
    const adapter = getAdapter(adapterName);

    const messages = [
      { role: 'system', content: persona.system },
      ...context,
      { role: 'user', content: message },
    ];

    const response = await adapter.complete(messages, {
      model: persona.model,
      max_tokens: persona.max_tokens,
      temperature: persona.temperature,
    });

    res.json({
      response,
      persona: persona.name,
      adapter: adapterName,
      model: persona.model,
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    console.error('[prompt] erro:', err.message);
    res.status(500).json({ error: err.message, latency_ms: Date.now() - start });
  }
});

// ── GET /personas ─────────────────────────────────────────────────────────────

app.get('/personas', (req, res) => {
  try {
    res.json(personas.list());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /personas/reload ─────────────────────────────────────────────────────

app.post('/personas/reload', (req, res) => {
  try {
    personas.reload();
    res.json({ ok: true, personas: personas.list() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /status ───────────────────────────────────────────────────────────────

app.get('/status', (req, res) => {
  res.json({ adapters: adapterStatus() });
});

// ── GET /health ───────────────────────────────────────────────────────────────

// ── POST /alexa ───────────────────────────────────────────────────────────────
// Alexa Skill endpoint — recebe payload nativo da skill e retorna formato Alexa

app.post('/alexa', require('./routes/alexa'));
app.get('/alexa', (_, res) => res.json({ ok: true, endpoint: 'alexa skill' }));

app.get('/health', (_, res) => res.json({ ok: true }));

// ── Frontend estático ─────────────────────────────────────────────────────────

const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));
app.get('*', (_, res) => res.sendFile(path.join(publicDir, 'index.html')));

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`[brain] rodando na porta ${PORT}`));
