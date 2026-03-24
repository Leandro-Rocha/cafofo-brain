// Gemini adapter
// Requires: npm install @google/generative-ai
// Env: GEMINI_API_KEY

module.exports = {
  name: 'gemini',
  available: () => !!process.env.GEMINI_API_KEY,

  async complete(messages, { model = 'gemini-2.0-flash', max_tokens = 500, temperature = 0.7 } = {}) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: systemMsg?.content,
      generationConfig: { maxOutputTokens: max_tokens, temperature },
    });

    const history = chatMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = chatMessages[chatMessages.length - 1];
    if (!lastMessage) throw new Error('Nenhuma mensagem de usuário fornecida.');

    const chat = geminiModel.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  },
};
