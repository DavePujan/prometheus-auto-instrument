# Launch Kit

## LinkedIn Post

I built a zero-config Prometheus monitoring tool for Node.js.

No more writing custom request counters and latency histograms in every route.

Just:

```js
monitor.init({ app });
```

What it includes:

- Auto metrics
- Smart route grouping
- CLI setup
- Built-in Grafana dashboard
- Anomaly detection

Would love feedback.

GitHub:
https://github.com/DavePujan/prometheus-auto-instrument

## Dev.to Title

I built a zero-config Prometheus tool so developers do not have to write metrics manually

## Demo Script (30-40 seconds)

1. Start Express app
2. Add one setup line (`monitor.init({ app })`)
3. Hit `/metrics`
4. Show Grafana import with `dashboards/default.json`
5. Trigger and show anomaly warning log