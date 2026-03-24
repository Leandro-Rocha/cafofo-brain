// OpenAI adapter
// Requires: npm install openai
// Env: OPENAI_API_KEY

module.exports = {
  name: 'openai',
  available: () => !!process.env.OPENAI_API_KEY,

  async complete(messages, { model = 'gpt-4o-mini', max_tokens = 500, temperature = 0.7 } = {}) {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature,
    });
    return completion.choices[0]?.message?.content || '';
  },
};
