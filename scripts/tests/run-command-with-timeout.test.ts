import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let tempRoot: string;

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "command-timeout-"));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("run-command-with-timeout", () => {
  it("terminates a command after the configured timeout", () => {
    const output = path.join(tempRoot, "timeout.json");
    const result = spawnSync("node", [
      "scripts/run-command-with-timeout.js",
      "--timeout-seconds",
      "0.1",
      "--output",
      output,
      "--",
      "node",
      "-e",
      "setTimeout(() => {}, 5000)",
    ]);

    expect(result.status).toBe(124);
    expect(fs.existsSync(output)).toBe(true);
  });

  it("preserves stdout and the child exit code", () => {
    const output = path.join(tempRoot, "result.json");
    const result = spawnSync("node", [
      "scripts/run-command-with-timeout.js",
      "--timeout-seconds",
      "5",
      "--output",
      output,
      "--",
      "node",
      "-e",
      "process.stdout.write(JSON.stringify({ok:true}))",
    ]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(output, "utf8")).toBe('{"ok":true}');
  });
});
