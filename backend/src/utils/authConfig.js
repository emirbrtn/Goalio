function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();

  if (!secret) {
    const error = new Error("JWT_SECRET missing");
    error.status = 503;
    throw error;
  }

  return secret;
}

module.exports = { getJwtSecret };
