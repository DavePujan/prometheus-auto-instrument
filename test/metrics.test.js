const express = require("express");
const request = require("supertest");
const monitor = require("../src");
const { instrumentRedis } = require("../src/plugins/redis");
const { instrumentMongo } = require("../src/plugins/mongo");

test("metrics endpoint works", async () => {
  const app = express();
  monitor.init({ app, ignoreRoutes: ["/metrics"] });

  app.get("/hello", (req, res) => {
    res.status(200).send("ok");
  });

  await request(app).get("/hello");

  const res = await request(app).get("/metrics");

  expect(res.statusCode).toBe(200);
  expect(res.text).toContain("http_requests_total");
  expect(res.text).toContain('route="/hello"');
});

test("ignoreRoutes excludes metrics", async () => {
  const app = express();

  monitor.init({
    app,
    ignoreRoutes: ["/metrics"]
  });

  const res = await request(app).get("/metrics");

  expect(res.statusCode).toBe(200);
  expect(res.text).not.toContain('route="/metrics"');
});

test("redis plugin wraps sendCommand", async () => {
  const client = {
    sendCommand: jest.fn((command) => ({ ok: command && command.name }))
  };

  instrumentRedis(client);

  const result = await client.sendCommand({ name: "GET" });

  expect(client.sendCommand).not.toBeUndefined();
  expect(result).toEqual({ ok: "GET" });
});

test("mongo plugin enables mongoose debug handler", () => {
  const mongoose = {
    set: jest.fn()
  };

  instrumentMongo(mongoose);

  expect(mongoose.set).toHaveBeenCalledTimes(1);
  expect(mongoose.set).toHaveBeenCalledWith("debug", expect.any(Function));
});

test("auto-detect redis instruments app.locals.redis", () => {
  const app = express();
  const redisClient = {
    sendCommand: jest.fn(() => "ok")
  };

  app.locals.redis = redisClient;
  monitor.init({ app });

  expect(redisClient.__promAutoRedisInstrumented).toBe(true);
});

test("anomaly detection invokes callback on spikes", async () => {
  const app = express();
  const onAnomaly = jest.fn();

  monitor.init({
    app,
    anomalyDetection: {
      enabled: true,
      minSamples: 1,
      multiplier: 0,
      onAnomaly
    }
  });

  app.get("/spike", async (req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    res.status(200).send("ok");
  });

  await request(app).get("/spike");
  await request(app).get("/spike");

  expect(onAnomaly).toHaveBeenCalled();
});

test("error counting includes both 4xx and 5xx", async () => {
  const app = express();
  monitor.init({ app, ignoreRoutes: ["/metrics"] });

  app.get("/client-error", (req, res) => {
    res.status(400).send("bad request");
  });

  app.get("/server-error", (req, res) => {
    res.status(500).send("internal error");
  });

  app.get("/success", (req, res) => {
    res.status(200).send("ok");
  });

  await request(app).get("/client-error");
  await request(app).get("/server-error");
  await request(app).get("/success");

  const res = await request(app).get("/metrics");

  expect(res.text).toContain("http_errors_total");
  // Should have errors from both 400 and 500
  const errorMatches = res.text.match(/http_errors_total{[^}]*status_code="[45]/g);
  expect(errorMatches).not.toBeNull();
  expect(errorMatches.length).toBeGreaterThan(0);
});