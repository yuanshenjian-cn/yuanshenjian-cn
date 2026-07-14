import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const workspaceRoot = process.cwd();
const realGit = execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
const issueDate = "2026-07-15";
const briefingFile = `content/ai-briefings/2026/07/${issueDate}-ai-briefing.md`;

interface Scenario {
  generatorStatus?: "draft_ready" | "no_events" | "blocked";
  reviewerStatus?: "approved" | "blocked";
  existingBriefing?: boolean;
  remoteContainsCommit?: boolean;
  dryRun?: boolean;
  remoteName?: string;
  upstreamMismatch?: boolean;
  occupiedLock?: boolean;
  collectorHang?: boolean;
}

interface Harness {
  root: string;
  repo: string;
  env: NodeJS.ProcessEnv;
  run: () => ReturnType<typeof spawnSync>;
}

const roots: string[] = [];

function writeExecutable(file: string, content: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, { mode: 0o755 });
}

function git(cwd: string, args: string[]) {
  return execFileSync(realGit, args, { cwd, encoding: "utf8" });
}

function createHarness(scenario: Scenario): Harness {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ai-briefing-shell-"));
  roots.push(root);
  const repo = path.join(root, "repo");
  const remote = path.join(root, "remote.git");
  const bin = path.join(root, "bin");
  fs.mkdirSync(repo, { recursive: true });
  fs.mkdirSync(bin, { recursive: true });

  fs.mkdirSync(path.join(repo, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(workspaceRoot, "scripts/ai-briefing.sh"), path.join(repo, "scripts/ai-briefing.sh"));
  fs.copyFileSync(
    path.join(workspaceRoot, "scripts/run-command-with-timeout.js"),
    path.join(repo, "scripts/run-command-with-timeout.js"),
  );
  fs.chmodSync(path.join(repo, "scripts/ai-briefing.sh"), 0o755);

  fs.mkdirSync(path.join(repo, "skills/ai-briefing/config"), { recursive: true });
  fs.writeFileSync(
    path.join(repo, "skills/ai-briefing/config/generator-result.schema.json"),
    JSON.stringify({ anyOf: [{ type: "object" }] }),
  );
  fs.writeFileSync(
    path.join(repo, "skills/ai-briefing/config/reviewer-result.schema.json"),
    JSON.stringify({ anyOf: [{ type: "object" }] }),
  );
  fs.writeFileSync(path.join(repo, "skills/ai-briefing/config/source-registry.json"), JSON.stringify({ version: 1, sources: [] }));
  fs.writeFileSync(path.join(repo, ".gitignore"), ".local/ai-briefing/\n");
  fs.mkdirSync(path.join(repo, "site/public/ai-data/briefings"), { recursive: true });
  fs.writeFileSync(path.join(repo, "site/public/ai-data/briefings/index.json"), "[]\n");

  writeExecutable(
    path.join(repo, "scripts/ai-briefing-window.js"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
const output = args[args.indexOf("--output") + 1];
const issueDate = args[args.indexOf("--issue-date") + 1];
const windowEnd = args[args.indexOf("--window-end") + 1];
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ issueDate, previousIssueDate: "2026-07-14", calendarDayDifference: 1, windowHours: 24, windowStart: "2026-07-14T00:00:00.000Z", windowEnd, timezone: "Asia/Shanghai", strategy: "calendar-day-gap-hours" }, null, 2) + "\\n");
`,
  );
  writeExecutable(
    path.join(repo, "scripts/collect-ai-briefing-feeds.js"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
const output = args[args.indexOf("--output") + 1];
if (process.env.FAKE_COLLECTOR_HANG === "1") setInterval(() => {}, 1000);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ sources: [], candidates: [], clusters: [] }, null, 2) + "\\n");
`,
  );
  writeExecutable(
    path.join(repo, "scripts/verify-ai-briefing-run.js"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const command = process.argv[2];
const args = process.argv.slice(3);
fs.appendFileSync(process.env.FAKE_VERIFIER_LOG, command + "\\n");
fs.appendFileSync(process.env.FAKE_VERIFIER_ARGS_LOG, JSON.stringify([command, ...args]) + "\\n");
const value = (name) => args[args.indexOf(name) + 1];
if (command === "parse-generator") {
  const parsed = JSON.parse(fs.readFileSync(value("--input"), "utf8"));
  process.stdout.write(JSON.stringify(parsed.structured_output) + "\\n");
} else if (command === "verify-reviewer") {
  const parsed = JSON.parse(fs.readFileSync(value("--input"), "utf8"));
  if (parsed.structured_output.status !== "approved") process.exit(1);
} else if (command === "verify-post-push" && process.env.REMOTE_CONTAINS_COMMIT === "0") {
  process.exit(1);
}
`,
  );

  writeExecutable(
    path.join(bin, "claude"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_CLAUDE_LOG, JSON.stringify(args) + "\\n");
const reviewer = args.includes("--agent");
if (process.env.DRY_RUN === "1") {
  process.stdout.write(JSON.stringify({ result: "fake draft only" }));
  process.exit(0);
}
if (reviewer) {
  const status = process.env.FAKE_REVIEWER_STATUS;
  process.stdout.write(JSON.stringify({ structured_output: status === "approved" ? { status, conclusion: "可进入发布门禁", evidenceQuality: { authority: "通过", authenticity: "通过", timeliness: "通过" } } : { status: "blocked", conclusion: "阻断发布", reason: "fake block", evidenceQuality: { authority: "失败", authenticity: "失败", timeliness: "未知" } } }));
  process.exit(0);
}
const status = process.env.FAKE_GENERATOR_STATUS;
const runDir = path.join(process.env.PROJECT_DIR, ".local/ai-briefing/runs", process.env.AI_BRIEFING_RUN_ID);
const briefing = path.join(process.env.PROJECT_DIR, "${briefingFile}");
if (status === "draft_ready") {
  fs.mkdirSync(path.dirname(briefing), { recursive: true });
  fs.writeFileSync(briefing, "---\\ntitle: fake\\ndate: \\\"${issueDate}\\\"\\npublished: true\\n---\\n");
  fs.mkdirSync(runDir, { recursive: true });
  for (const name of ["discovery.json", "selection.json", "self-review.json"]) fs.writeFileSync(path.join(runDir, name), "{}\\n");
  process.stdout.write(JSON.stringify({ structured_output: { status, issueDate: "${issueDate}", filePath: "${briefingFile}", selectionPath: ".local/ai-briefing/runs/" + process.env.AI_BRIEFING_RUN_ID + "/selection.json", selfReviewConclusion: "通过" } }));
} else if (status === "no_events") {
  process.stdout.write(JSON.stringify({ structured_output: { status, issueDate: "${issueDate}", reason: "none" } }));
} else {
  process.stdout.write(JSON.stringify({ structured_output: { status: "blocked", issueDate: "${issueDate}", reason: "blocked", blockers: ["fake"] } }));
}
`,
  );
  writeExecutable(
    path.join(bin, "just"),
    `#!/usr/bin/env bash
set -euo pipefail
if [ "\${1:-}" = "build-site-ai-data" ]; then
  printf '[{"date":"${issueDate}"}]\\n' > "$PROJECT_DIR/site/public/ai-data/briefings/index.json"
fi
`,
  );
  writeExecutable(
    path.join(bin, "git"),
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_GIT_LOG"
exec "$REAL_GIT" "$@"
`,
  );

  if (scenario.existingBriefing) {
    fs.mkdirSync(path.join(repo, path.dirname(briefingFile)), { recursive: true });
    fs.writeFileSync(path.join(repo, briefingFile), "existing\n");
  }

  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.name", "AI Briefing Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "initial fixture"]);
  git(root, ["init", "--bare", remote]);
  const configuredRemote = scenario.upstreamMismatch ? "origin" : scenario.remoteName ?? "origin";
  const requestedRemote = scenario.upstreamMismatch ? "upstream" : configuredRemote;
  git(repo, ["remote", "add", configuredRemote, remote]);
  git(repo, ["push", "-u", configuredRemote, "main"]);
  if (scenario.upstreamMismatch) git(repo, ["remote", "add", requestedRemote, remote]);

  const lockDir = path.join(root, "lock");
  if (scenario.occupiedLock) {
    fs.mkdirSync(lockDir);
    fs.writeFileSync(path.join(lockDir, "owner"), "other-process\n");
  }

  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    PROJECT_DIR: repo,
    REAL_GIT: realGit,
    FAKE_GIT_LOG: path.join(root, "git.log"),
    FAKE_CLAUDE_LOG: path.join(root, "claude.log"),
    FAKE_VERIFIER_LOG: path.join(root, "verifier.log"),
    FAKE_VERIFIER_ARGS_LOG: path.join(root, "verifier-args.log"),
    FAKE_GENERATOR_STATUS: scenario.generatorStatus ?? "draft_ready",
    FAKE_REVIEWER_STATUS: scenario.reviewerStatus ?? "approved",
    REMOTE_CONTAINS_COMMIT: scenario.remoteContainsCommit === false ? "0" : "1",
    FAKE_COLLECTOR_HANG: scenario.collectorHang ? "1" : "0",
    AI_BRIEFING_ISSUE_DATE: issueDate,
    AI_BRIEFING_WINDOW_END: "2026-07-15T00:00:00.000Z",
    AI_BRIEFING_RUN_ID: "test-run",
    AI_BRIEFING_LOCK_DIR: lockDir,
    AI_BRIEFING_REMOTE: requestedRemote,
    AI_BRIEFING_COLLECTOR_TIMEOUT_SECONDS: scenario.collectorHang ? "0.1" : "10",
    AI_BRIEFING_GENERATOR_TIMEOUT_SECONDS: "10",
    AI_BRIEFING_REVIEWER_TIMEOUT_SECONDS: "10",
    LOG_OUTPUT_MODE: "none",
    DRY_RUN: scenario.dryRun ? "1" : "0",
  };
  return {
    root,
    repo,
    env,
    run: () => spawnSync("bash", ["scripts/ai-briefing.sh"], { cwd: repo, env, encoding: "utf8", timeout: 30000 }),
  };
}

function commitCount(repo: string) {
  return Number(git(repo, ["rev-list", "--count", "HEAD"]).trim());
}

function readLines(file: string) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim().split(/\r?\n/).filter(Boolean) : [];
}

afterEach(() => {
  while (roots.length > 0) fs.rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("AI briefing shell state machine", () => {
  it("keeps DRY_RUN outside the publish status machine", () => {
    const harness = createHarness({ dryRun: true });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(fs.existsSync(path.join(harness.repo, briefingFile))).toBe(false);
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/reviewer-output.json"))).toBe(false);
    expect(readLines(path.join(harness.root, "claude.log")), `${result.stdout}\n${result.stderr}`).toHaveLength(1);
    expect(commitCount(harness.repo)).toBe(1);
  });

  it("returns 3 for no_events and keeps raw output", () => {
    const harness = createHarness({ generatorStatus: "no_events" });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(3);
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/claude-output.json"))).toBe(true);
    expect(commitCount(harness.repo)).toBe(1);
  });

  it("returns 4 before invoking Claude when today's file exists", () => {
    const harness = createHarness({ existingBriefing: true });
    const result = harness.run();

    expect(result.status).toBe(4);
    expect(readLines(path.join(harness.root, "claude.log"))).toEqual([]);
  });

  it("does not remove a lock held by another process", () => {
    const harness = createHarness({ occupiedLock: true });
    const result = harness.run();

    expect(result.status).not.toBe(0);
    expect(fs.readFileSync(path.join(harness.root, "lock/owner"), "utf8")).toBe("other-process\n");
    expect(readLines(path.join(harness.root, "claude.log"))).toEqual([]);
  });

  it("requires upstream to match the configured remote and deploy branch", () => {
    const harness = createHarness({ upstreamMismatch: true });
    const result = harness.run();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("当前 upstream 必须是 upstream/main，实际为 origin/main");
    expect(readLines(path.join(harness.root, "claude.log"))).toEqual([]);
  });

  it("uses a non-origin remote consistently", () => {
    const harness = createHarness({ remoteName: "mirror", generatorStatus: "no_events" });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(3);
    expect(readLines(path.join(harness.root, "git.log"))).toContain("fetch mirror main");
  });

  it("terminates a hung collector through the outer timeout", () => {
    const harness = createHarness({ collectorHang: true });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(124);
    expect(readLines(path.join(harness.root, "claude.log"))).toEqual([]);
  });

  it("does not commit when the independent reviewer blocks", () => {
    const harness = createHarness({ generatorStatus: "draft_ready", reviewerStatus: "blocked" });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(commitCount(harness.repo)).toBe(1);
  });

  it("fails after push when remote verification fails", () => {
    const harness = createHarness({ remoteContainsCommit: false });
    const result = harness.run();
    const claudeCalls = readLines(path.join(harness.root, "claude.log")).map((line) => JSON.parse(line));
    const gitCalls = readLines(path.join(harness.root, "git.log"));
    const verifierCalls = readLines(path.join(harness.root, "verifier-args.log")).map((line) => JSON.parse(line));

    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(commitCount(harness.repo)).toBe(2);
    expect(readLines(path.join(harness.root, "verifier.log"))).toContain("verify-post-push");
    expect(claudeCalls).toHaveLength(2);
    expect(claudeCalls[1]).toEqual(expect.arrayContaining(["--agent", "ai-briefing-reviewer"]));
    for (const call of claudeCalls) {
      const tools = call[call.indexOf("--tools") + 1];
      const allowedTools = call[call.indexOf("--allowedTools") + 1];
      expect(allowedTools).toBe(tools);
      expect(call).toEqual(expect.arrayContaining(["--disallowedTools", "mcp__*"]));
      expect(call[call.indexOf("--json-schema") + 1]).toMatch(/^\{/);
    }
    expect(claudeCalls[0][claudeCalls[0].indexOf("--tools") + 1]).not.toContain("Bash");
    expect(claudeCalls[1][claudeCalls[1].indexOf("--tools") + 1]).not.toMatch(/Bash|Edit/);
    expect(gitCalls).toContain(`add -- ${briefingFile} site/public/ai-data/briefings/index.json`);
    expect(verifierCalls).toContainEqual(expect.arrayContaining(["verify-post-push", "--remote", "origin"]));
  }, 15000);

  it("does not contain obsolete or dangerous Claude flags", () => {
    const shell = fs.readFileSync(path.join(workspaceRoot, "scripts/ai-briefing.sh"), "utf8");
    expect(shell).not.toContain("--max-turns");
    expect(shell).not.toContain("--dangerously-skip-permissions");
  });
});
