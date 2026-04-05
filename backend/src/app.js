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

app.get("/", (req, res) => {
  res.json({ message: "Goalio API aktif" });
});

app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/predictions", predictionRoutes);

module.exports = app;
