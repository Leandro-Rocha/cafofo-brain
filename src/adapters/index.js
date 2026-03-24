const groq = require('./groq');
const gemini = require('./gemini');
const openai = require('./openai');

const registry = { groq, gemini, openai };

function getAdapter(name) {
  const adapter = registry[name];
  if (!adapter) {
    throw new Error(`Adapter '${name}' não existe. Disponíveis: ${Object.keys(registry).join(', ')}`);
  }
  if (!adapter.available()) {
    throw new Error(`Adapter '${name}' não está configurado (API key ausente).`);
  }
  return adapter;
}

function getDefault() {
  for (const name of ['groq', 'gemini', 'openai']) {
    if (registry[name].available()) return registry[name];
  }
  throw new Error('Nenhum adapter disponível. Configure ao menos uma API key (GROQ_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY).');
}

function status() {
  return Object.fromEntries(
    Object.entries(registry).map(([name, a]) => [name, a.available()])
  );
}

module.exports = { getAdapter, getDefault, status };
