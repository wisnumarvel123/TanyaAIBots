const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

bot.on('message', async (msg) => {
  if (!msg.text) return;
  if (msg.text === '/start') return bot.sendMessage(msg.chat.id, 'Gas bro, tanya apa aja');

  bot.sendChatAction(msg.chat.id, 'typing');
  try {
    const chat = await groq.chat.completions.create({
      messages: [{ role: 'user', content: msg.text }],
      model: 'llama-3.1-8b-instant',
    });
    bot.sendMessage(msg.chat.id, chat.choices[0].message.content);
  } catch (e) {
    bot.sendMessage(msg.chat.id, 'Duh error: ' + e.message);
  }
});