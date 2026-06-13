const jwt = require("jsonwebtoken");

const { isTokenBlacklisted } = require("../utils/tokenBlacklist");
const { hasActiveSession } = require("../utils/userRedisStore");

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Kimlik dogrulama basarisiz" });
  }

  try {
    const token = authHeader.split(" ")[1];

    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ message: "Oturum suresi sona erdi" });
    }

    req.token = token;
    req.user = jwt.verify(token, process.env.JWT_SECRET || "goalio-secret");

    if (!(await hasActiveSession(token))) {
      return res.status(401).json({ message: "Oturum aktif degil" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Kimlik dogrulama basarisiz" });
  }
};
