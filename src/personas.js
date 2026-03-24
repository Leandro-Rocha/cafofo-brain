const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const PERSONAS_PATH = process.env.PERSONAS_PATH || path.join(__dirname, '../personas.yml');

let cache = null;

function load() {
  const raw = fs.readFileSync(PERSONAS_PATH, 'utf8');
  cache = yaml.load(raw).personas;
  console.log(`[personas] carregadas: ${Object.keys(cache).join(', ')}`);
  return cache;
}

function get(name) {
  if (!cache) load();
  const persona = cache[name] || cache['default'];
  if (!persona) throw new Error(`Persona '${name}' não encontrada e sem persona 'default'.`);
  return { name: name in cache ? name : 'default', ...persona };
}

function list() {
  if (!cache) load();
  return Object.entries(cache).map(([name, p]) => ({
    name,
    description: p.description || '',
    adapter: p.adapter || 'groq',
    model: p.model,
  }));
}

module.exports = { get, list, reload: load };
