const jwt = require("jsonwebtoken");

const { getRedisClient } = require("./redisClient");

const PUBLIC_USER_PREFIX = "user:public:";
const AUTH_USER_PREFIX = "user:auth:email:";
const SESSION_PREFIX = "session:token:";
const DEFAULT_PUBLIC_USER_TTL_SECONDS = 60 * 60 * 12;
const DEFAULT_AUTH_USER_TTL_SECONDS = 60 * 30;

function buildPublicUserKey(userId) {
  return `${PUBLIC_USER_PREFIX}${userId}`;
}

function buildAuthUserKey(email) {
  return `${AUTH_USER_PREFIX}${String(email || "").trim().toLowerCase()}`;
}

function buildSessionKey(token) {
  return `${SESSION_PREFIX}${token}`;
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function getTokenTtlSeconds(token) {
  const decoded = jwt.decode(token);
  const expiresAt = Number(decoded?.exp || 0);

  if (!expiresAt) return 0;

  return Math.max(expiresAt - Math.floor(Date.now() / 1000), 0);
}

async function getCachedPublicUser(userId) {
  const client = await getRedisClient();
  if (!client) return null;

  const value = await client.get(buildPublicUserKey(userId));
  return value ? safeParse(value) : null;
}

async function cachePublicUser(user) {
  const client = await getRedisClient();
  if (!client || !user?.id) return false;

  await client.set(buildPublicUserKey(user.id), JSON.stringify(user), {
    EX: DEFAULT_PUBLIC_USER_TTL_SECONDS,
  });

  return true;
}

async function deleteCachedPublicUser(userId) {
  const client = await getRedisClient();
  if (!client || !userId) return false;

  await client.del(buildPublicUserKey(userId));
  return true;
}

async function getCachedAuthUser(email) {
  const client = await getRedisClient();
  if (!client) return null;

  const value = await client.get(buildAuthUserKey(email));
  return value ? safeParse(value) : null;
}

async function cacheAuthUser(user) {
  const client = await getRedisClient();
  if (!client || !user?.email) return false;

  const payload = typeof user.toObject === "function" ? user.toObject() : user;

  await client.set(buildAuthUserKey(payload.email), JSON.stringify(payload), {
    EX: DEFAULT_AUTH_USER_TTL_SECONDS,
  });

  return true;
}

async function deleteCachedAuthUser(email) {
  const client = await getRedisClient();
  if (!client || !email) return false;

  await client.del(buildAuthUserKey(email));
  return true;
}

async function cacheActiveSession(token, user) {
  const client = await getRedisClient();
  if (!client || !token || !user?.id) return false;

  const ttlSeconds = getTokenTtlSeconds(token);
  if (ttlSeconds <= 0) return false;

  await client.set(
    buildSessionKey(token),
    JSON.stringify({
      userId: String(user.id),
      username: user.username || "",
    }),
    { EX: ttlSeconds },
  );

  return true;
}

async function hasActiveSession(token) {
  const client = await getRedisClient();
  if (!client) return true;

  const value = await client.get(buildSessionKey(token));
  return Boolean(value);
}

async function deleteActiveSession(token) {
  const client = await getRedisClient();
  if (!client || !token) return false;

  await client.del(buildSessionKey(token));
  return true;
}

module.exports = {
  cacheActiveSession,
  cacheAuthUser,
  cachePublicUser,
  deleteActiveSession,
  deleteCachedAuthUser,
  deleteCachedPublicUser,
  getCachedAuthUser,
  getCachedPublicUser,
  hasActiveSession,
};
