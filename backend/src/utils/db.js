const mongoose = require('mongoose');

// .env dosyasındaki MONGODB_URI'yi kullanır, yoksa lokale bağlanır
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goalio';

async function ensureDb() {
  try {
    if (mongoose.connection.readyState >= 1) return;
    
    await mongoose.connect(uri);
    console.log("-----------------------------------------");
    console.log("🐘 SISTEM: MongoDB bağlantısı BAŞARILI.");
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("❌ SISTEM: MongoDB bağlantı hatası!", error.message);
    process.exit(1);
  }
}

async function getDb() {
  await ensureDb();
  return mongoose.connection;
}

module.exports = { ensureDb, getDb };