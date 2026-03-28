const http = require("http");

const commonPorts = [4011, 4012, 3000, 3001];
let port = Number(process.env.PORT);

// If PORT not explicitly set, we'll auto-detect below
if (!port) {
  port = null;
}

const endpoints = [
  "/hello",
  "/users/101",
  "/users/202",
  "/health",
  "/error"
];

let running = true;
let total = 0;
let failed = 0;
let success = 0;
let cycle = 0;
const startTime = Date.now();

function hit(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      res.resume();
      resolve({ ok: true, statusCode: res.statusCode, path });
    });

    req.on("error", (error) => {
      resolve({ ok: false, error: error.message, path });
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function probePort(testPort) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${testPort}/`, (res) => {
      res.resume();
      resolve(true);
    });

    req.on("error", () => {
      resolve(false);
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function detectPort() {
  // If PORT env var is explicitly set, use it
  if (port) {
    console.log(`\n🎯 Using explicitly set PORT: ${port}`);
    return port;
  }

  console.log("\n🔍 Auto-detecting running app on common ports...");

  for (const testPort of commonPorts) {
    process.stdout.write(`   Checking port ${testPort}... `);
    const isRunning = await probePort(testPort);
    if (isRunning) {
      console.log("✅ Found!");
      return testPort;
    }
    console.log("❌");
  }

  console.error(
    "\n❌ Could not find running app on any common port:",
    commonPorts.join(", ")
  );
  console.error("   Start your app first with: npm run start:test");
  console.error("   Or specify port: PORT=3000 npm run traffic:watch");
  process.exit(1);
}

async function loop() {
  const delayMs = Number(process.env.DELAY_MS) || 200;
  const reportInterval = Number(process.env.REPORT_INTERVAL) || 10;

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║  🎯 Continuous Traffic Generator Started      ║");
  console.log("╚════════════════════════════════════════════════╝\n");
  console.log(`📍 Target: http://localhost:${port}`);
  console.log(`📌 Endpoints: ${endpoints.join(", ")}`);
  console.log(`⏱️  Delay: ${delayMs}ms between requests`);
  console.log(`📊 Report interval: every ${reportInterval} cycles`);
  console.log("🛑 Press Ctrl+C to stop gracefully.\n");

  let lastReportCycle = 0;

  while (running) {
    cycle += 1;

    for (const path of endpoints) {
      if (!running) {
        break;
      }

      const result = await hit(path);
      total += 1;

      if (!result.ok) {
        failed += 1;
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ❌ Cycle ${cycle} | ${path} → ${result.error}`);
      } else {
        success += 1;
      }

      await sleep(delayMs);
    }

    // Report stats at intervals
    if (cycle - lastReportCycle >= reportInterval && running) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : 0;
      console.log(
        `✅ [${elapsed}s] Cycle ${cycle} | Sent: ${total} | Success: ${success} | Failed: ${failed} | Rate: ${successRate}%`
      );
      lastReportCycle = cycle;
    }
  }

  // Final report
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : 0;
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║  📈 Final Statistics                           ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log(`⏱️  Total time: ${totalElapsed}s`);
  console.log(`📦 Total requests: ${total}`);
  console.log(`✅ Successful: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success rate: ${successRate}%`);
  console.log(`🔄 Cycles completed: ${cycle}\n`);
}

function shutdown() {
  if (!running) {
    return;
  }

  running = false;
  console.log("\n⏹️  Gracefully stopping traffic generator...");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

(async () => {
  try {
    const detectedPort = await detectPort();
    port = detectedPort;
    await loop();
    setTimeout(() => process.exit(0), 500);
  } catch (error) {
    console.error("\n🔥 Traffic generator crashed:", error.message);
    process.exit(1);
  }
})();
