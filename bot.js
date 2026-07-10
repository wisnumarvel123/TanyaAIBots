// Tanya AI - Telegram Bot Bahasa Indonesia KBBI
// Siap deploy ke Render.com

import TelegramBot from 'node-telegram-bot-api';
import express from 'express';

// === KONFIGURASI: Ambil dari Environment Variable Render ===
// Di Render, set TELEGRAM_TOKEN dan GROQ_API_KEY di menu "Environment"
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3000;

if (!TELEGRAM_TOKEN ||!GROQ_API_KEY) {
  console.error('Galat: Harap atur TELEGRAM_TOKEN dan GROQ_API_KEY di Environment Variables.');
  process.exit(1);
}

// Inisialisasi Bot dengan Polling
const bot = new TelegramBot(TELEGRAM_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: { timeout: 10 }
  }
});

// Inisialisasi Server Express untuk Keep-Alive Render
const app = express();
app.get('/', (req, res) => res.send('Bot Tanya AI KBBI Aktif'));
app.listen(PORT, () => console.log(`Server berjalan pada port ${PORT}`));

// 1. Atur Menu Perintah Titik 4 Otomatis
bot.setMyCommands([
  { command: 'start', description: 'Memulai percakapan dengan bot' },
  { command: 'model', description: 'Mengganti model AI yang digunakan' },
  { command: 'help', description: 'Menampilkan panduan penggunaan bot' },
  { command: 'reset', description: 'Mengatur ulang ke pengaturan awal' },
  { command: 'info', description: 'Menampilkan informasi model aktif' }
]).then(() => console.log('Menu perintah berhasil diatur'));

// Penyimpanan Data Pengguna
const userModel = new Map();
const userCooldown = new Map();
const COOLDOWN_MS = 3000;

// Daftar Model yang Didukung
const MODELS = {
  'compound_70b': { id: 'compound-beta', nama: 'Compound 70B - Penelusuran Web', deskripsi: 'Dapat mencari informasi terkini di internet' },
  'compound_8b': { id: 'compound-beta-mini', nama: 'Compound Mini - Cepat', deskripsi: 'Versi cepat dengan penelusuran web' },
  'llama33_70b': { id: 'llama-3.3-70b-versatile', nama: 'Llama 3.3 70B - Paling Cerdas', deskripsi: 'Terbaik untuk analisis dan penulisan kompleks' },
  'qwen3_32b': { id: 'qwen/qwen3-32b', nama: 'Qwen 3 32B - Logika', deskripsi: 'Unggul dalam matematika dan pemrograman' },
  'llama31_8b': { id: 'llama-3.1-8b-instant', nama: 'Llama 3.1 8B - Sangat Cepat', deskripsi: 'Respons tercepat untuk percakapan' }
};

// Prompt Sistem Bahasa Indonesia Baku
const PROMPT_KBBI = `Anda adalah asisten AI yang sangat kompeten dalam Bahasa Indonesia.
Ketentuan dalam menjawab:
1. Gunakan Bahasa Indonesia baku yang baik dan benar sesuai Kamus Besar Bahasa Indonesia (KBBI).
2. Berikan penjelasan yang lengkap, terstruktur, mendalam, dan mudah dipahami.
3. Gunakan format poin-poin, nomor, atau subjudul untuk memperjelas jawaban.
4. Hindari bahasa gaul, singkatan informal, dan istilah asing tanpa penjelasan.
5. Format jawaban untuk Telegram: gunakan *tebal* untuk penekanan penting.`;

// Perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const nama = msg.from.first_name;
  userModel.set(chatId, 'compound_70b');
  const pesan = `Selamat datang, *${nama}*!\n\nSaya *Tanya AI*, asisten yang berkomunikasi dengan Bahasa Indonesia baku sesuai KBBI.\n\n*Model Aktif:* ${MODELS['compound_70b'].nama}\n\nGunakan /model untuk mengganti model.\nGunakan /help untuk panduan.\n\nSilakan ajukan pertanyaan Anda.`;
  bot.sendMessage(chatId, pesan, { parse_mode: 'Markdown' });
});

// Perintah /model
bot.onText(/\/model/, (msg) => {
  const keyboard = Object.entries(MODELS).map(([key, val]) => [{ text: val.nama, callback_data: `setmodel_${key}` }]);
  bot.sendMessage(msg.chat.id, '*Silakan pilih model AI:*', { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
});

// Perintah /help
bot.onText(/\/help/, (msg) => {
  const pesan = `*Panduan Penggunaan Tanya AI*\n\n/start - Memulai ulang bot\n/model - Mengganti model AI\n/reset - Mengatur ulang ke default\n/info - Cek model aktif\n\n*Tips:* Gunakan model *Compound* untuk pertanyaan tentang berita atau data terkini.`;
  bot.sendMessage(msg.chat.id, pesan, { parse_mode: 'Markdown' });
});

// Perintah /reset
bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  userModel.set(chatId, 'compound_70b');
  userCooldown.delete(chatId);
  bot.sendMessage(chatId, `*Pengaturan berhasil diatur ulang.*\n\nModel kembali ke: *${MODELS['compound_70b'].nama}*`, { parse_mode: 'Markdown' });
});

// Perintah /info
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  const modelKey = userModel.get(chatId) || 'compound_70b';
  const pesan = `*Informasi Sesi Anda*\n\n*Model Aktif:* ${MODELS[modelKey].nama}\n*Deskripsi:* ${MODELS[modelKey].deskripsi}\n*ID:* \`${MODELS[modelKey].id}\``;
  bot.sendMessage(chatId, pesan, { parse_mode: 'Markdown' });
});

// Menangani Pemilihan Model dari Tombol
bot.on('callback_query', (query) => {
  if (query.data.startsWith('setmodel_')) {
    const modelKey = query.data.replace('setmodel_', '');
    userModel.set(query.message.chat.id, modelKey);
    bot.answerCallbackQuery(query.id, { text: 'Model berhasil diubah!' });
    bot.sendMessage(query.message.chat.id, `Model aktif: *${MODELS[modelKey].nama}*`, { parse_mode: 'Markdown' });
  }
});

// Fungsi Fetch dengan Timeout
async function fetchGroq(model, pesan, signal) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'system', content: PROMPT_KBBI }, { role: 'user', content: pesan }],
      temperature: 0.4,
      max_tokens: 2048
    }),
    signal: signal
  });
  if (!response.ok) throw new Error(`Galat HTTP ${response.status}`);
  return await response.json();
}

// Menangani Seluruh Pesan Masuk
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith('/')) return;

  // Sistem Cooldown Anti-Spam
  const lastRequest = userCooldown.get(chatId);
  if (lastRequest && Date.now() - lastRequest < COOLDOWN_MS) {
    return bot.sendMessage(chatId, 'Mohon tunggu 3 detik sebelum bertanya lagi ⏳');
  }
  userCooldown.set(chatId, Date.now());

  const modelKey = userModel.get(chatId) || 'compound_70b';
  const model = MODELS[modelKey].id;
  const loading = await bot.sendMessage(chatId, 'Sedang memproses permintaan Anda...⏳');

  // Timeout 30 detik
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const data = await fetchGroq(model, text, controller.signal);
    clearTimeout(timeout);

    if (data.error) throw new Error(data.error.message);
    const choice = data.choices[0];

    // Kirim hasil penelusuran web apabila ada
    if (choice.message.executed_tools?.length > 0) {
      let kotak = '🔍 *Hasil Penelusuran Web:*\n';
      choice.message.executed_tools.forEach(alat => {
        if (alat.type === 'browser_search') {
          kotak += `_Kueri: ${alat.browser_search.query}_\n\n`;
          alat.browser_search.results.slice(0, 3).forEach((r, i) => {
            kotak += `${i + 1}. [${r.title}](${r.url})\n`;
          });
        }
      });
      await bot.sendMessage(chatId, kotak, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }

    await bot.deleteMessage(chatId, loading.message_id);
    const jawaban = choice.message.content;

    // Potong pesan jika terlalu panjang
    if (jawaban.length > 4096) {
      for (let i = 0; i < jawaban.length; i += 4096) {
        await bot.sendMessage(chatId, jawaban.substring(i, i + 4096), { parse_mode: 'Markdown' });
      }
    } else {
      await bot.sendMessage(chatId, jawaban, { parse_mode: 'Markdown' });
    }

  } catch (galat) {
    clearTimeout(timeout);
    let pesanGalat = 'Maaf, terjadi kesalahan pada server.';
    if (galat.name === 'AbortError') pesanGalat = 'Permintaan terlalu lama. Silakan coba dengan pertanyaan yang lebih sederhana.';
    else if (galat.message.includes('429')) pesanGalat = 'Server sedang sibuk. Mohon coba lagi dalam satu menit.';

    await bot.editMessageText(pesanGalat, { chat_id: chatId, message_id: loading.message_id });
  }
});

// Penanganan Galat Global agar Bot Tidak Mati
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));

console.log('Bot Tanya AI KBBI telah berhasil dijalankan!');