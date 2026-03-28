const onFinished = require("on-finished");
const {
  httpRequestDuration,
  httpRequestCount,
  httpErrors
} = require("./metrics");
const { normalizeRoute, shouldIgnoreRoute } = require("./utils");
const { createLatencyAnomalyDetector } = require("./anomaly");

function createMonitoringMiddleware(options = {}) {
  const {
    ignoreRoutes = [],
    anomalyDetection = {
      enabled: false,
      minSamples: 20,
      multiplier: 2,
      maxHistory: 200,
      onAnomaly: (details) => {
        console.warn("Latency spike detected", details);
      }
    }
  } = options;

  const detector = createLatencyAnomalyDetector({
    minSamples: anomalyDetection.minSamples,
    multiplier: anomalyDetection.multiplier,
    maxHistory: anomalyDetection.maxHistory
  });

  return function monitoringMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    const route = normalizeRoute(req);

    if (shouldIgnoreRoute(route, ignoreRoutes)) {
      next();
      return;
    }

    onFinished(res, () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e9;

      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode)
      };

      httpRequestDuration.observe(labels, duration);
      httpRequestCount.inc(labels);

      if (res.statusCode >= 500) {
        httpErrors.inc(labels);
      }

      if (anomalyDetection.enabled && detector.detect(route, duration)) {
        anomalyDetection.onAnomaly({
          route,
          method: req.method,
          duration,
          statusCode: res.statusCode
        });
      }
    });

    next();
  };
}

module.exports = createMonitoringMiddleware;