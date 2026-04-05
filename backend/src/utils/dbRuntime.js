const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/goalio";

let connectionPromise = null;

async function ensureDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    await connectionPromise;
    return mongoose.connection;
  }

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((connection) => {
      console.log("-----------------------------------------");
      console.log("MongoDB baglantisi basarili.");
      console.log("-----------------------------------------");
      return connection;
    })
    .catch((error) => {
      console.error("MongoDB baglanti hatasi:", error.message);
      throw error;
    })
    .finally(() => {
      connectionPromise = null;
    });

  await connectionPromise;
  return mongoose.connection;
}

async function getDb() {
  await ensureDb();
  return mongoose.connection;
}

module.exports = { ensureDb, getDb };
