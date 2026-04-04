const path = require('path');
// .env dosyasını tam yol göstererek en üstte yüklüyoruz
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = require("./src/app");
const { ensureDb } = require("./src/utils/dbRuntime");
const { migrateLegacyData } = require("./src/utils/legacyMigration");

const PORT = process.env.PORT || 5000;

// BAŞLANGIÇ KONTROLÜ
console.log("-----------------------------------------");
const token = process.env.SPORTSMONKS_API_TOKEN;
if (token) {
    console.log(`✅ SISTEM: API Token başarıyla yüklendi (${token.substring(0,5)}...)`);
} else {
    console.log("❌ SISTEM: .env içindeki SPORTSMONKS_API_TOKEN okunamadı!");
}
console.log("-----------------------------------------");

ensureDb().then(async () => {
  await migrateLegacyData();
  app.listen(PORT, () =>
    console.log(`Goalio API running on http://localhost:${PORT}`),
  );
});
