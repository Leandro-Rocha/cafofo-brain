const { getAdapter } = require('../adapters');
const personas = require('../personas');

// Helpers para formatar resposta no formato Alexa Skill
function speech(text, endSession = true) {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text },
      shouldEndSession: endSession,
    },
  };
}

function ask(text, reprompt = 'Pode perguntar outra coisa.') {
  return {
    version: '1.0',
    response: {
      outputSpeech: { type: 'PlainText', text },
      reprompt: { outputSpeech: { type: 'PlainText', text: reprompt } },
      shouldEndSession: false,
    },
  };
}

async function handle(body) {
  const reqType   = body?.request?.type;
  const intent    = body?.request?.intent?.name;
  const slots     = body?.request?.intent?.slots || {};
  const sessionId = body?.session?.sessionId;

  console.log(`[alexa] sessionId=${sessionId} type=${reqType} intent=${intent}`);

  if (reqType === 'LaunchRequest') {
    return ask('Olá! Pode perguntar qualquer coisa.', 'Pode falar o que quiser.');
  }

  if (reqType === 'SessionEndedRequest') {
    return { version: '1.0', response: {} };
  }

  if (reqType === 'IntentRequest') {
    // Intents de controle padrão da Alexa
    if (['AMAZON.CancelIntent', 'AMAZON.StopIntent'].includes(intent)) {
      return speech('Até logo!');
    }
    if (intent === 'AMAZON.HelpIntent') {
      return ask('Pode me fazer qualquer pergunta. Como posso ajudar?');
    }

    // Intent principal: AskIntent com slot "query"
    if (intent === 'AskIntent') {
      const query = slots?.query?.value;
      if (!query) return ask('Não entendi. Pode repetir?', 'Pode repetir a pergunta?');

      try {
        const persona  = personas.get('alexa');
        const adapter  = getAdapter(persona.adapter || 'groq');
        const messages = [
          { role: 'system', content: persona.system },
          { role: 'user',   content: query },
        ];
        const response = await adapter.complete(messages, {
          model:       persona.model,
          max_tokens:  persona.max_tokens,
          temperature: persona.temperature,
        });
        return speech(response);
      } catch (err) {
        console.error('[alexa] erro ao chamar LLM:', err.message);
        return speech('Desculpe, tive um problema ao processar sua pergunta. Tente novamente.');
      }
    }

    // Intent desconhecido — tenta tratar como pergunta livre se tiver utterance
    return ask('Não entendi. Pode reformular?', 'Como posso ajudar?');
  }

  return { version: '1.0', response: {} };
}

module.exports = async (req, res) => {
  try {
    const result = await handle(req.body);
    res.json(result);
  } catch (err) {
    console.error('[alexa] erro:', err.message);
    res.json(speech('Ocorreu um erro interno. Tente novamente.'));
  }
};
