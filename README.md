# prometheus-auto-instrument

> Zero-config Prometheus monitoring for Node.js

## Try and test this package with this example repo: https://github.com/DavePujan/prometheus-demo-repo

## Install

```bash
npm install prometheus-auto-instrument
```

## Usage

```js
const monitor = require("prometheus-auto-instrument");

monitor.init({ app });
```

Metrics: `http://localhost:3000/metrics`

## Features

- Zero config
- Smart route normalization
- Auto-detect Mongo, Redis, and OpenTelemetry
- CLI setup (`npx prom-auto init`)
- **🎨 Live Web Dashboard with real-time charts**
- **⚡ WebSocket streaming for real-time metrics**
- **📈 Multiple chart types (line, bar)**
- **🌗 Dark/Light theme toggle**
- Grafana dashboard export
- Anomaly detection for latency spikes

## Dashboard

The package now includes a **production-grade SaaS-style dashboard** with live metrics.

### Setup

```js
const monitor = require("prometheus-auto-instrument");

const app = require("express")();

// Initialize monitoring
monitor.init({ app });

// Setup dashboard UI with WebSocket streaming
const setupWS = monitor.setupDashboard(app, monitor.register, "/dashboard");

const server = app.listen(3000);

// Attach WebSocket handler
setupWS(server);
```

### Access

- **Dashboard**: `http://localhost:3000/dashboard`
- **Metrics (JSON)**: `http://localhost:3000/__monitor/data`
- **Metrics (Prometheus)**: `http://localhost:3000/metrics`

### Dashboard Features

- 📊 **Real-time Metrics Cards**: Total Requests, Avg Latency, Error Rate, Active Routes
- 📈 **Live Charts**:
  - RPS (Requests Per Second) trend
  - Latency distribution
  - Error rate tracking
  - Per-route traffic comparison
- 🔥 **Top Routes Panel**: See which endpoints are getting the most traffic
- 🌗 **Theme Toggle**: Dark mode (default) and light mode
- ⚡ **WebSocket Streaming**: 2-second update frequency (no polling)
- 🎯 **Responsive Design**: Mobile-friendly, SaaS-quality UI

### Customization

```js
monitor.setupDashboard(
  app,
  monitor.register,
  "/my-custom-dashboard" // Custom path (default: "/dashboard")
);
```

## Testing & Traffic Generation

The package includes a **continuous traffic generator** for testing and dashboard verification:

```bash
# Auto-detects running app on common ports (4011, 4012, 3000, 3001)
npm run traffic:watch

# Or specify explicit port
PORT=3000 npm run traffic:watch
```

### Traffic Generator Features

- 🔄 **Continuous Traffic**: Runs indefinitely until `Ctrl+C`
- 🎯 **Auto-Port Detection**: Scans common ports if `PORT` env var not set
- 📊 **Live Statistics**: Displays throughput, success rate, failures at regular intervals
- ⏱️ **Configurable Delays**: `DELAY_MS` env var controls request spacing (default: 200ms)
- 📈 **Cycle-based Reporting**: `REPORT_INTERVAL` controls stats frequency (default: every 10 cycles)
- 🛑 **Graceful Shutdown**: Press `Ctrl+C` for clean exit with final stats

### Usage Examples

```bash
# Terminal 1: Start your app
npm run start:test

# Terminal 2: Run traffic generator (auto-detects port 4011)
npm run traffic:watch

# With custom settings
DELAY_MS=100 REPORT_INTERVAL=5 npm run traffic:watch
```

## CLI

```bash
npx prom-auto init --dry-run
npx prom-auto init --yes
npx prom-auto init --entry src/server.js
npx prom-auto dashboard
```

## Grafana

Import [dashboards/default.json](dashboards/default.json)

## Anomaly Detection

```js
monitor.init({
  app,
  anomalyDetection: {
    enabled: true,
    multiplier: 2
  }
});
```

## Plugins

```js
const { instrumentMongo } = require("prometheus-auto-instrument/plugins/mongo");
const { instrumentRedis } = require("prometheus-auto-instrument/plugins/redis");
const { instrumentOtel } = require("prometheus-auto-instrument/plugins/otel");
```

## Why this exists

Manual Prometheus instrumentation is painful. This tool makes it automatic.

## Metrics Design

The package exports **3 core metric types** following Prometheus best practices:

| Metric | Type | Purpose |
|--------|------|---------|
| `http_requests_total` | Counter | Total HTTP requests (includes all status codes) |
| `http_errors_total` | Counter | Error responses (4xx and 5xx status codes) |
| `http_request_duration_seconds` | Histogram | Request latency distribution in seconds |

All metrics include labels: `method`, `route`, `status_code`

### Example Usage

```bash
# Total requests
curl http://localhost:3000/metrics | grep http_requests_total

# Error tracking (4xx + 5xx)
curl http://localhost:3000/metrics | grep http_errors_total

# Latency analysis (histogram with buckets)
curl http://localhost:3000/metrics | grep http_request_duration_seconds
```

## API

`monitor.init(options)`

- `app` (required): Express app
- `metricsPath` (optional): metrics endpoint path, default `/metrics`
- `ignoreRoutes` (optional): array of route strings or regex patterns to ignore
- `autoDetect` (optional): `{ mongo: true, redis: true, otel: false }` by default
- `anomalyDetection` (optional): latency spike detector config
