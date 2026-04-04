const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const matchRoutes = require("./routes/matchRoutes");
const teamRoutes = require("./routes/teamRoutes");
const playerRoutes = require("./routes/playerRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const { ensureDb } = require("./utils/dbRuntime");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use((req, res, next) => {
  ensureDb()
    .then(() => next())
    .catch((error) => {
      res.status(503).json({
        message: "Veritabani baglantisi kurulamadi",
        detail: error.message,
      });
    });
});

app.get("/", (req, res) => {
  res.json({ message: "Goalio API aktif" });
});

app.use("/users", userRoutes);
app.use("/matches", matchRoutes);
app.use("/teams", teamRoutes);
app.use("/players", playerRoutes);
app.use("/predictions", predictionRoutes);

app.use((error, req, res, next) => {
  console.error("Beklenmeyen sunucu hatasi:", error);
  res.status(500).json({ message: "Beklenmeyen sunucu hatasi" });
});

module.exports = app;
