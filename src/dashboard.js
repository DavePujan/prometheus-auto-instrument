const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");

/**
 * Setup dashboard UI server with WebSocket streaming
 * @param {express.Application} app - Express app instance
 * @param {object} register - Prometheus register instance (from prom-client)
 * @param {string} dashboardPath - Path to serve dashboard at (default: /dashboard)
 */
function setupDashboard(app, register, dashboardPath = "/dashboard") {
  if (!app || !register) {
    throw new Error("app and register are required");
  }

  const uiPath = path.join(__dirname, "..", "ui");

  // Serve a local Chart.js bundle to avoid CDN-only dependency.
  app.get("/__monitor/vendor/chart.js", (req, res) => {
    try {
      const chartMainPath = require.resolve("chart.js");
      const chartPath = path.join(path.dirname(chartMainPath), "chart.umd.js");
      res.sendFile(chartPath);
    } catch (_error) {
      res.status(404).send("Chart.js bundle not found");
    }
  });

  // Serve static dashboard
  app.use(dashboardPath, express.static(uiPath));

  // API endpoint for metrics as JSON
  app.get("/__monitor/data", async (req, res) => {
    try {
      const metrics = await register.metrics();
      const lines = metrics.split("\n");
      const parsed = parsePrometheus(lines);
      res.json(parsed);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Helper to setup WebSocket on server instance
  const wsSetup = function (server) {
    const wss = new WebSocketServer({ server, path: "/__monitor/ws" });

    wss.on("connection", (ws) => {
      console.log("[Dashboard] New WebSocket client connected");

      // Send metrics every 2 seconds
      const interval = setInterval(async () => {
        try {
          const metrics = await register.metrics();
          const lines = metrics.split("\n");
          const parsed = parsePrometheus(lines);
          
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify(parsed));
          }
        } catch (error) {
          console.error("[Dashboard] Error sending metrics:", error.message);
        }
      }, 2000);

      ws.on("close", () => {
        console.log("[Dashboard] Client disconnected");
        clearInterval(interval);
      });

      ws.on("error", (err) => {
        console.error("[Dashboard] WebSocket error:", err.message);
        clearInterval(interval);
      });
    });
  };

  return wsSetup;
}

/**
 * Parse Prometheus text format into JSON
 * @param {string[]} lines - Prometheus metrics format lines
 * @returns {object[]} Parsed metrics
 */
function parsePrometheus(lines) {
  const metrics = {};

  lines.forEach((line) => {
    // Skip comments and empty lines
    if (!line || line.startsWith("#")) return;

    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]*)\}\s+([\d.eE+-]+)$/);
    
    if (!match) {
      // Handle metrics without labels
      const simpleMatch = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+([\d.eE+-]+)$/);
      if (simpleMatch) {
        const [, name, value] = simpleMatch;
        if (!metrics[name]) {
          metrics[name] = { name, values: [] };
        }
        metrics[name].values.push({
          labels: {},
          value: parseFloat(value)
        });
      }
      return;
    }

    const [, name, labelsStr, value] = match;
    const labels = parseLabels(labelsStr);

    if (!metrics[name]) {
      metrics[name] = { name, values: [] };
    }

    metrics[name].values.push({
      labels,
      value: parseFloat(value)
    });
  });

  return Object.values(metrics);
}

/**
 * Parse Prometheus label string
 * @param {string} str - Labels string like 'method="GET",route="/users"'
 * @returns {object} Labels object
 */
function parseLabels(str) {
  const labels = {};
  const regex = /([a-zA-Z_][a-zA-Z0-9_]*)="([^"\\]*(\\.[^"\\]*)*)"/g;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const key = match[1];
    const value = match[2].replace(/\\(.)/g, "$1"); // Unescape
    labels[key] = value;
  }

  return labels;
}

module.exports = { setupDashboard };
