const Groq = require('groq-sdk');

let client = null;

function getClient() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

module.exports = {
  name: 'groq',
  available: () => !!process.env.GROQ_API_KEY,

  async complete(messages, { model = 'llama-3.3-70b-versatile', max_tokens = 500, temperature = 0.7 } = {}) {
    const completion = await getClient().chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature,
    });
    return completion.choices[0]?.message?.content || '';
  },
};
