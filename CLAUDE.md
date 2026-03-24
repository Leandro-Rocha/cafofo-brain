# CLAUDE.md

## What this is

**cafofo-brain** — LLM bridge service. Receives prompts via HTTP and forwards to a configured LLM adapter (Groq, Gemini, OpenAI). Supports named personas with pre-configured system prompts, models, and parameters. First integration: Alexa skill.

## Commands

```bash
npm run dev       # nodemon on port 3030
npm start         # production
docker compose up # run via Docker
```

## Architecture

- **`src/index.js`** — Express server. Routes: POST /prompt, GET /personas, POST /personas/reload, GET /status, GET /health.
- **`src/personas.js`** — Loads `personas.yml`, caches in memory. `get(name)` falls back to `default`. Hot-reload via `POST /personas/reload`.
- **`src/adapters/index.js`** — Registry + factory. `getAdapter(name)` throws if not configured. `getDefault()` picks first available (groq → gemini → openai).
- **`src/adapters/groq.js`** — Groq SDK. Lazy-initializes client. Requires `GROQ_API_KEY`.
- **`src/adapters/gemini.js`** — Google Generative AI. Requires `@google/generative-ai` (optional dep) + `GEMINI_API_KEY`.
- **`src/adapters/openai.js`** — OpenAI SDK. Requires `openai` (optional dep) + `OPENAI_API_KEY`.
- **`personas.yml`** — Persona definitions (mountable as volume for live customization without rebuild).

## API

### POST /prompt
```json
// Request
{ "persona": "alexa", "message": "qual a capital do Brasil?", "context": [] }

// Response
{ "response": "Brasília.", "persona": "alexa", "adapter": "groq", "model": "llama-3.1-8b-instant", "latency_ms": 312 }
```

- `persona` defaults to `"default"`
- `context` is optional conversation history: `[{ "role": "user"|"assistant", "content": "..." }]`

### GET /personas
Returns list of configured personas with name, description, adapter, model.

### POST /personas/reload
Reloads `personas.yml` from disk without restart. Useful when personas.yml is mounted as a volume.

### GET /status
Returns adapter availability: `{ "adapters": { "groq": true, "gemini": false, "openai": false } }`

### GET /health
`{ "ok": true }`

## Personas

Defined in `personas.yml`. Each persona has:
- `description` — human-readable label
- `system` — system prompt
- `adapter` — which LLM to use (`groq`, `gemini`, `openai`)
- `model` — model name (adapter-specific)
- `max_tokens` — response length limit
- `temperature` — creativity (0.0–1.0)

Default personas: `default`, `alexa`, `assistant`, `chef`, `resumo`.

## Adding a new adapter

1. Create `src/adapters/mynewadapter.js` with `{ name, available(), async complete(messages, options) }`
2. Add to `src/adapters/index.js` registry
3. Add the relevant npm package to `package.json` (can be optional — adapter loads it lazily via `require()`)

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 3030 | HTTP port |
| `GROQ_API_KEY` | — | Groq API key |
| `GEMINI_API_KEY` | — | Google AI Studio API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `PERSONAS_PATH` | `personas.yml` | Path to personas config file |

## Deployment (CasaOS)

- Container port `3030` mapped to host `3030`
- `personas.yml` can be mounted as volume for live edits
- Self-hosted GitHub Actions runner handles pull + up after image push to GHCR
- Same `DEPLOY_PAT` secret as other cafofo services
