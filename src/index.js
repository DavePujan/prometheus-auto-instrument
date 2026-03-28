const createMonitoringMiddleware = require("./middleware");
const { register } = require("./metrics");
const { instrumentMongo } = require("./plugins/mongo");
const { instrumentRedis } = require("./plugins/redis");

function autoDetectMongo(autoDetect) {
  if (!autoDetect.mongo) {
    return;
  }

  const mongooseInCache = Object.keys(require.cache).some((cacheKey) => {
    return /[\\/]mongoose[\\/]/.test(cacheKey);
  });

  if (!mongooseInCache) {
    return;
  }

  try {
    const mongoose = require("mongoose");
    instrumentMongo(mongoose);
  } catch (_error) {
    // Mongoose may not be resolvable from this package context.
  }
}

function autoDetectRedis(app, autoDetect) {
  if (!autoDetect.redis) {
    return;
  }

  const redisClient = app && app.locals && app.locals.redis;
  if (!redisClient) {
    return;
  }

  try {
    instrumentRedis(redisClient);
  } catch (_error) {
    // Redis client may not match expected interface.
  }
}

function init({
  app,
  metricsPath = "/metrics",
  ignoreRoutes = [],
  autoDetect = { mongo: true, redis: true },
  anomalyDetection = { enabled: false }
} = {}) {
  if (!app || typeof app.use !== "function" || typeof app.get !== "function") {
    throw new Error("An Express app instance is required");
  }

  autoDetectMongo(autoDetect);
  autoDetectRedis(app, autoDetect);

  const monitoringMiddleware = createMonitoringMiddleware({
    ignoreRoutes,
    anomalyDetection
  });
  app.use((req, res, next) => {
    if (ignoreRoutes.includes(req.path)) {
      next();
      return;
    }

    monitoringMiddleware(req, res, next);
  });

  app.get(metricsPath, async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  console.log("Prometheus auto instrumentation enabled");
}

module.exports = {
  init,
  register
};