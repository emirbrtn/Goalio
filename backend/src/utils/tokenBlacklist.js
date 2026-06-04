const jwt = require("jsonwebtoken");

const { getRedisClient } = require("./redisClient");

const BLACKLIST_PREFIX = "jwt:blacklist:";

function buildBlacklistKey(token) {
  return `${BLACKLIST_PREFIX}${token}`;
}

function getBlacklistTtlSeconds(token) {
  const decoded = jwt.decode(token);
  const expiresAt = Number(decoded?.exp || 0);

  if (!expiresAt) return 0;

  return Math.max(expiresAt - Math.floor(Date.now() / 1000), 0);
}

async function isTokenBlacklisted(token) {
  const client = await getRedisClient();
  if (!client) return false;

  const value = await client.get(buildBlacklistKey(token));
  return value === "1";
}

async function blacklistToken(token) {
  const client = await getRedisClient();
  if (!client) return false;

  const ttlSeconds = getBlacklistTtlSeconds(token);
  if (ttlSeconds <= 0) return false;

  await client.set(buildBlacklistKey(token), "1", {
    EX: ttlSeconds,
  });

  return true;
}

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
};
