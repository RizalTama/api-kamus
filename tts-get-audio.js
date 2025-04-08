const playht = require('playht');
require('dotenv').config(); // agar bisa baca API key dan user id dari .env

// Inisialisasi PlayHT
playht.init({
  apiKey: process.env.PLAYHT_API_KEY,
  userId: process.env.PLAYHT_USER_ID
});

// Fungsi untuk ambil URL audio dari taskId
async function getAudioUrl(taskId) {
  try {
    const response = await playht.getAudio(taskId);
    console.log('Audio URL:', response.url);
  } catch (error) {
    console.error('Gagal ambil audio:', error.message);
  }
}

// Ganti 'your-task-id' dengan Task ID hasil generate audio sebelumnya
getAudioUrl('495c8022-84b2-4205-8797-1a4e4ee6d0f6');
