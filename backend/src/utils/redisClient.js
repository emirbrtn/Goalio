const { createClient } = require("redis");

let clientPromise;
let clientInstance;

async function connectRedis() {
  if (clientPromise) return clientPromise;

  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (!redisUrl) {
    return null;
  }

  const client = createClient({ url: redisUrl });

  client.on("error", (error) => {
    console.error("Redis baglanti hatasi:", error.message);
  });

  clientPromise = client
    .connect()
    .then(() => {
      clientInstance = client;
      console.log("Redis baglantisi hazir.");
      return client;
    })
    .catch((error) => {
      clientPromise = null;
      console.error("Redis baglantisi kurulurken hata olustu:", error.message);
      return null;
    });

  return clientPromise;
}

async function getRedisClient() {
  if (clientInstance?.isOpen) return clientInstance;

  const redisClient = await connectRedis();
  if (!redisClient?.isOpen) {
    return null;
  }

  return redisClient;
}

module.exports = {
  connectRedis,
  getRedisClient,
};
