const path = require('path');
// .env dosyasını tam yol göstererek en üstte yüklüyoruz
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = require("./src/app");
const { ensureDb } = require("./src/utils/dbRuntime");
const { migrateLegacyData } = require("./src/utils/legacyMigration");
const { connectRedis } = require("./src/utils/redisClient");
const { connectRabbitMq } = require("./src/utils/rabbitmq");
const { startUserEventConsumer } = require("./src/utils/userEventConsumer");

const PORT = process.env.PORT || 5000;
const RABBIT_RETRY_DELAY_MS = 5000;
const isVercelServerless = process.env.VERCEL === "1";

async function bootstrapRabbitMqConsumer() {
  const connection = await connectRabbitMq();
  if (!connection) {
    setTimeout(bootstrapRabbitMqConsumer, RABBIT_RETRY_DELAY_MS);
    return;
  }

  const started = await startUserEventConsumer();
  if (!started) {
    setTimeout(bootstrapRabbitMqConsumer, RABBIT_RETRY_DELAY_MS);
  }
}

// BAŞLANGIÇ KONTROLÜ
console.log("-----------------------------------------");
const token = process.env.SPORTSMONKS_API_TOKEN;
if (token) {
    console.log(`✅ SISTEM: API Token başarıyla yüklendi (${token.substring(0,5)}...)`);
} else {
    console.log("❌ SISTEM: .env içindeki SPORTSMONKS_API_TOKEN okunamadı!");
}
console.log("-----------------------------------------");

async function bootstrapOptionalServices(options = {}) {
  const { startConsumers = true } = options;

  try {
    await ensureDb();
    await migrateLegacyData();
  } catch (error) {
    console.error("MongoDB baslangic baglantisi kurulamadi:", error.message);
  }

  await connectRedis();
  if (startConsumers) {
    bootstrapRabbitMqConsumer();
  }
}

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = app;
exports.app = app;

if (require.main === module && !isVercelServerless) {
  app.listen(PORT, () =>
    console.log(`Goalio API running on http://localhost:${PORT}`),
  );
  bootstrapOptionalServices();
}
