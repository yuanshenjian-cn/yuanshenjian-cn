#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

function parseArgs(argv) {
  const separator = argv.indexOf("--");
  if (separator === -1 || separator === argv.length - 1) throw new Error("缺少 -- command [args...]");
  const options = { mirrorOutput: false };
  for (let index = 0; index < separator; index += 1) {
    const argument = argv[index];
    if (argument === "--mirror-output") {
      options.mirrorOutput = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value === "--") throw new Error(`参数缺少值：${argument}`);
    if (argument === "--timeout-seconds") options.timeoutSeconds = Number(value);
    else if (argument === "--output") options.output = value;
    else throw new Error(`未知参数：${argument}`);
    index += 1;
  }
  if (!Number.isFinite(options.timeoutSeconds) || options.timeoutSeconds <= 0) {
    throw new Error("--timeout-seconds 必须为正数");
  }
  if (!options.output) throw new Error("缺少 --output");
  return { options, command: argv[separator + 1], commandArgs: argv.slice(separator + 2) };
}

function killProcessGroup(child, signal) {
  if (!child.pid) return;
  try {
    if (process.platform !== "win32") process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch (error) {
    if (error.code !== "ESRCH") child.kill(signal);
  }
}

function main() {
  const { options, command, commandArgs } = parseArgs(process.argv.slice(2));
  const outputPath = path.resolve(options.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const output = fs.createWriteStream(outputPath, { flags: "w" });
  const child = spawn(command, commandArgs, {
    detached: process.platform !== "win32",
    stdio: ["inherit", "pipe", "inherit"],
  });
  let timedOut = false;
  let forceKillTimer = null;
  let spawnError = null;

  child.stdout.on("data", (chunk) => {
    output.write(chunk);
    if (options.mirrorOutput) process.stdout.write(chunk);
  });
  child.on("error", (error) => {
    spawnError = error;
  });

  const timeoutTimer = setTimeout(() => {
    timedOut = true;
    killProcessGroup(child, "SIGTERM");
    forceKillTimer = setTimeout(() => killProcessGroup(child, "SIGKILL"), 5000);
  }, options.timeoutSeconds * 1000);

  child.on("close", (code) => {
    clearTimeout(timeoutTimer);
    if (forceKillTimer) clearTimeout(forceKillTimer);
    output.end(() => {
      if (spawnError) {
        process.stderr.write(`${spawnError.message}\n`);
        process.exitCode = 1;
      } else {
        process.exitCode = timedOut ? 124 : code ?? 1;
      }
    });
  });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { killProcessGroup, parseArgs };
