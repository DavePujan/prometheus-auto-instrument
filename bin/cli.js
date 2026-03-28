#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const argv = process.argv.slice(2);
const cmd = argv[0];
const cwd = process.cwd();

function getArgValue(flag) {
  const index = argv.indexOf(flag);
  if (index === -1 || index + 1 >= argv.length) {
    return undefined;
  }

  return argv[index + 1];
}

const flags = {
  dryRun: argv.includes("--dry-run"),
  yes: argv.includes("--yes"),
  entry: getArgValue("--entry")
};

function ensureInstalled() {
  try {
    execSync("npm install prometheus-auto-instrument", {
      stdio: "inherit",
      cwd
    });
  } catch (error) {
    console.error("Failed to install prometheus-auto-instrument.");
    process.exit(1);
  }
}

function findServerFile() {
  if (flags.entry) {
    const entryPath = path.resolve(cwd, flags.entry);
    if (fs.existsSync(entryPath) && fs.statSync(entryPath).isFile()) {
      return entryPath;
    }

    return null;
  }

  const candidates = ["server.js", "app.js", "index.js", "src/server.js", "src/app.js", "src/index.js"];

  for (const relPath of candidates) {
    const fullPath = path.join(cwd, relPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }

  return null;
}

function injectSetupCode(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (source.includes("prometheus-auto-instrument")) {
    return { changed: false, reason: "Already instrumented" };
  }

  const requireLine = "const monitor = require(\"prometheus-auto-instrument\");\n";
  const initLine = "monitor.init({ app });\n";

  let updated = source;

  if (/const\s+app\s*=\s*express\(/.test(source)) {
    updated = `${requireLine}${source}`;
    updated = updated.replace(/(const\s+app\s*=\s*express\([^\n]*\);\n)/, `$1${initLine}`);
    if (!flags.dryRun) {
      fs.writeFileSync(filePath, updated, "utf8");
    }
    return { changed: true, reason: "Injected monitor init after app creation" };
  }

  return { changed: false, reason: "Could not locate Express app initialization" };
}

function printNextSteps(filePath, result) {
  console.log("\nSetup summary");
  console.log(`- Installed package: ${flags.dryRun ? "dry-run (skipped)" : "yes"}`);
  console.log(`- Server file detected: ${filePath || "none"}`);
  console.log(`- Code injection: ${result.changed ? "applied" : "skipped"} (${result.reason})`);
  console.log(`- Mode: ${flags.dryRun ? "dry-run" : "write"}`);
  console.log("\nNext steps");
  console.log("1. Start your app");
  console.log("2. Open /metrics");
  console.log("3. Import dashboards/default.json into Grafana");
}

function askForConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`${question} `, (answer) => {
      rl.close();
      resolve(String(answer || "").trim().toLowerCase() === "y");
    });
  });
}

async function run() {
  if (cmd !== "init") {
    console.log("Usage: prom-auto init [--dry-run] [--yes] [--entry <path>]");
    return;
  }

  console.log("Setting up Prometheus Auto Instrumentation...");

  if (!flags.yes && !flags.dryRun) {
    const proceed = await askForConfirmation("This will modify files. Continue? (y/N)");
    if (!proceed) {
      console.log("Cancelled by user.");
      process.exit(0);
    }
  }

  if (!flags.dryRun) {
    ensureInstalled();
  }

  const serverFile = findServerFile();
  const result = serverFile
    ? injectSetupCode(serverFile)
    : {
        changed: false,
        reason: flags.entry ? "Provided --entry file was not found" : "No common server entry file found"
      };

  printNextSteps(serverFile, result);
  process.exit(0);
}

run();