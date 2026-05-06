const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const matchRoutes = require("./routes/matchRoutes");
const teamRoutes = require("./routes/teamRoutes");
const playerRoutes = require("./routes/playerRoutes");
const predictionRoutes = require("./routes/predictionRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

function mountRoute(path, router) {
  app.use(path, router);
  app.use(`/api${path}`, router);
}

app.get("/", (req, res) => {
  res.json({ message: "Goalio API aktif" });
});

mountRoute("/users", userRoutes);
mountRoute("/matches", matchRoutes);
mountRoute("/teams", teamRoutes);
mountRoute("/players", playerRoutes);
mountRoute("/predictions", predictionRoutes);

module.exports = app;
