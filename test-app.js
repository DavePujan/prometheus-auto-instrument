const express = require("express");
const monitor = require("./src");

const app = express();

monitor.init({
  app,
  ignoreRoutes: ["/metrics", "/health", "/dashboard"]
});

// Setup dashboard UI with WebSocket streaming
const setupWS = monitor.setupDashboard(app, monitor.register, "/dashboard");

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id, name: "Test User" });
});

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

app.get("/error", (req, res) => {
  res.status(500).json({ error: "Simulated server error" });
});

// Create HTTP server and attach WebSocket
const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`Test app listening at http://localhost:${port}`);
  console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
  console.log(`📈 Metrics: http://localhost:${port}/metrics`);
});

// Attach WebSocket handler to HTTP server
setupWS(server);