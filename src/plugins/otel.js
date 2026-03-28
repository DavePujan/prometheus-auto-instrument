let otel;
try {
  otel = require("@opentelemetry/api");
} catch (_error) {
  otel = null;
}

function instrumentOtel() {
  if (!otel) {
    console.warn("OpenTelemetry not installed");
    return null;
  }

  const tracer = otel.trace.getTracer("prom-auto");

  return function otelMiddleware(req, res, next) {
    const span = tracer.startSpan(`${req.method} ${req.path}`);

    res.on("finish", () => {
      span.setAttribute("http.status_code", res.statusCode);
      span.end();
    });

    next();
  };
}

module.exports = { instrumentOtel };