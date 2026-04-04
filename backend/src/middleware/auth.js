const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../utils/authConfig");

module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Kimlik doğrulama başarısız" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch (error) {
    if (error?.status === 503) {
      return res.status(503).json({ message: "Kimlik dogrulama servisi su anda kullanilamiyor" });
    }
    return res.status(401).json({ message: "Kimlik doğrulama başarısız" });
  }
};
