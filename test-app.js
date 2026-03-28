const express = require("express");
const monitor = require("./src");

const app = express();

monitor.init({
  app,
  ignoreRoutes: ["/metrics", "/health"]
});

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

const port = 3000;
app.listen(port, () => {
  console.log(`Test app listening at http://localhost:${port}`);
});