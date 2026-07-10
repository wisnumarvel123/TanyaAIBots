# Tanya AI - Telegram Bot KBBI

Telegram Chatbot dengan 5 Model AI dari Groq. Seluruh jawaban menggunakan Bahasa Indonesia baku sesuai Kamus Besar Bahasa Indonesia (KBBI). Mendukung penelusuran web real-time dan siap deploy ke Render.com.

## ✨ Fitur Utama

1. **5 Model AI Pilihan**
   - **Compound 70B**: Penelusuran web otomatis untuk berita, harga, data terkini
   - **Compound Mini**: Versi cepat dengan kemampuan penelusuran web
   - **Llama 3.3 70B**: Paling cerdas untuk analisis mendalam dan penulisan esai
   - **Qwen 3 32B**: Unggul dalam logika, matematika, dan pemrograman
   - **Llama 3.1 8B**: Respons tercepat untuk percakapan ringan

2. **Bahasa Indonesia Baku KBBI**
   - Seluruh jawaban terstruktur, mendalam, dan mudah dipahami
   - Tidak menggunakan bahasa gaul atau singkatan informal
   - Format rapi dengan poin-poin dan penebalan

3. **Anti-Freeze & Stabil**
   - Sistem cooldown 3 detik untuk mencegah spam
   - Timeout otomatis 30 detik agar tidak menggantung
   - Penanganan galat global agar bot tidak mati total
   - Server Express untuk keep-alive di Render

4. **Menu Perintah Lengkap**
   - `/start` - Memulai percakapan dengan bot
   - `/model` - Mengganti model AI yang digunakan
   - `/help` - Menampilkan panduan penggunaan
   - `/reset` - Mengatur ulang ke pengaturan awal
   - `/info` - Menampilkan informasi model aktif

## 🚀 Panduan Instalasi

### 1. Prasyarat
- **Node.js** versi 18.0.0 atau lebih baru
- **Token Bot Telegram** dari [@BotFather](https://t.me/botfather)
- **Kunci API Groq** dari [console.groq.com/keys](https://console.groq.com/keys)
- **Akun GitHub** dan **Akun Render.com**

### 2. Instalasi Lokal

```bash
# 1. Klon repositori ini
git clone https://github.com/username/tanya-ai-telegram.git
cd tanya-ai-telegram

# 2. Pasang dependensi
npm install

# 3. Buat file .env dan isi token Anda
# TELEGRAM_TOKEN=token_botfather_anda
# GROQ_API_KEY=api_key_groq_anda

# 4. Jalankan bot
npm start