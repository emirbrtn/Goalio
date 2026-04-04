const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Kimlik doğrulama başarısız" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "goalio-secret");
    next();
  } catch (error) {
    return res.status(401).json({ message: "Kimlik doğrulama başarısız" });
  }
};
