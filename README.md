# prometheus-auto-instrument

> Zero-config Prometheus monitoring for Node.js

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
- Auto-detect Mongo and Redis
- CLI setup (`npx prom-auto init`)
- Grafana dashboard included
- Anomaly detection for latency spikes

## CLI

```bash
npx prom-auto init --dry-run
npx prom-auto init --yes
npx prom-auto init --entry src/server.js
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
```

## Why this exists

Manual Prometheus instrumentation is painful. This tool makes it automatic.

## API

`monitor.init(options)`

- `app` (required): Express app
- `metricsPath` (optional): metrics endpoint path, default `/metrics`
- `ignoreRoutes` (optional): array of route strings or regex patterns to ignore
- `autoDetect` (optional): `{ mongo: true, redis: true }` by default
- `anomalyDetection` (optional): latency spike detector config
