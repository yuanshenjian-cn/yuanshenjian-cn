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
  existingBriefing?: boolean | "draft" | "published";
  replaceExisting?: boolean;
  noEventsEvidenceValid?: boolean;
  candidateValidationFails?: boolean;
  buildFails?: boolean;
  remoteContainsCommit?: boolean;
  dryRun?: boolean;
  dirtyWorktree?: boolean;
  nonDeployBranch?: boolean;
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
    path.join(workspaceRoot, "scripts/finalize-ai-briefing-run.sh"),
    path.join(repo, "scripts/finalize-ai-briefing-run.sh"),
  );
  fs.copyFileSync(
    path.join(workspaceRoot, "scripts/run-command-with-timeout.js"),
    path.join(repo, "scripts/run-command-with-timeout.js"),
  );
  fs.chmodSync(path.join(repo, "scripts/ai-briefing.sh"), 0o755);
  fs.chmodSync(path.join(repo, "scripts/finalize-ai-briefing-run.sh"), 0o755);

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
const observedAt = args[args.indexOf("--observed-at") + 1];
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ issueDate, previousIssueDate: "2026-07-14", nominalDays: 1, coverageStartDate: "2026-07-14", coverageEndDate: issueDate, observedAt, timezone: "Asia/Shanghai", strategy: "calendar-date-overlap" }, null, 2) + "\\n");
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
fs.writeFileSync(output, JSON.stringify({ coverageStartDate: "2026-07-14", coverageEndDate: "${issueDate}", observedAt: "2026-07-15T00:00:00.000Z", sources: [], candidates: [], clusters: [] }, null, 2) + "\\n");
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
} else if (command === "verify-no-events" && process.env.NO_EVENTS_EVIDENCE_VALID === "0") {
  process.exit(1);
} else if (command === "verify-post-push" && process.env.REMOTE_CONTAINS_COMMIT === "0") {
  process.exit(1);
}
`,
  );

  writeExecutable(
    path.join(repo, "scripts/validate-post.js"),
    `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args.includes("--check-replaceable")) {
  const file = args[args.indexOf("--path") + 1];
  if (/^published:\\s*true\\s*$/m.test(fs.readFileSync(file, "utf8"))) {
    console.error("published: true 的 AI 简报禁止替换");
    process.exit(1);
  }
}
if (process.env.FAKE_CANDIDATE_VALIDATION_FAILS === "1") process.exit(1);
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
  const common = { networkStatus: "online", checkedEvidenceIds: ["fake-evidence"], uncheckedHighRiskItems: [], evidenceQuality: { authority: "通过", authenticity: "通过", timeliness: "通过" } };
  process.stdout.write(JSON.stringify({ structured_output: status === "approved" ? { status, conclusion: "可进入发布门禁", ...common } : { status: "blocked", conclusion: "阻断发布", reason: "fake block", ...common } }));
  process.exit(0);
}
const status = process.env.FAKE_GENERATOR_STATUS;
const runDir = path.join(process.env.PROJECT_DIR, ".local/ai-briefing/runs", process.env.AI_BRIEFING_RUN_ID);
const candidate = path.join(runDir, "candidate.md");
if (status === "draft_ready") {
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(candidate, "---\\ntitle: fake\\ndate: \\"${issueDate}\\"\\npublished: true\\n---\\n");
  for (const name of ["discovery.json", "selection.json", "self-review.json"]) fs.writeFileSync(path.join(runDir, name), "{}\\n");
  process.stdout.write(JSON.stringify({ structured_output: { status, issueDate: "${issueDate}", candidatePath: ".local/ai-briefing/runs/" + process.env.AI_BRIEFING_RUN_ID + "/candidate.md", selectionPath: ".local/ai-briefing/runs/" + process.env.AI_BRIEFING_RUN_ID + "/selection.json", selfReviewPath: ".local/ai-briefing/runs/" + process.env.AI_BRIEFING_RUN_ID + "/self-review.json", coverageConclusion: "sufficient", selfReviewConclusion: "通过" } }));
} else if (status === "no_events") {
  fs.mkdirSync(runDir, { recursive: true });
  for (const name of ["discovery.json", "selection.json", "self-review.json"]) fs.writeFileSync(path.join(runDir, name), "{}\\n");
  process.stdout.write(JSON.stringify({ structured_output: { status, issueDate: "${issueDate}", selectionPath: ".local/ai-briefing/runs/" + process.env.AI_BRIEFING_RUN_ID + "/selection.json", selfReviewPath: ".local/ai-briefing/runs/" + process.env.AI_BRIEFING_RUN_ID + "/self-review.json", coverageConclusion: "sufficient", reason: "none" } }));
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
  [ "\${FAKE_BUILD_FAILS:-0}" != "1" ] || exit 1
  printf '[{"date":"${issueDate}"}]\\n' > "$PROJECT_DIR/site/public/ai-data/briefings/index.json"
elif [ "\${1:-}" = "validate-content-file" ]; then
  [ "\${FAKE_CANDIDATE_VALIDATION_FAILS:-0}" != "1" ] || exit 1
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
    const published = scenario.existingBriefing === "published";
    const content =
      scenario.existingBriefing === true
        ? "existing\n"
        : `---\ntitle: existing\ndate: "${issueDate}"\npublished: ${published}\n---\noriginal body\n`;
    fs.writeFileSync(path.join(repo, briefingFile), content);
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
  if (scenario.nonDeployBranch) git(repo, ["checkout", "-b", "draft-work"]);
  if (scenario.dirtyWorktree) fs.writeFileSync(path.join(repo, "dirty.txt"), "user work\n");

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
    NO_EVENTS_EVIDENCE_VALID: scenario.noEventsEvidenceValid === false ? "0" : "1",
    FAKE_CANDIDATE_VALIDATION_FAILS: scenario.candidateValidationFails ? "1" : "0",
    FAKE_BUILD_FAILS: scenario.buildFails ? "1" : "0",
    REMOTE_CONTAINS_COMMIT: scenario.remoteContainsCommit === false ? "0" : "1",
    FAKE_COLLECTOR_HANG: scenario.collectorHang ? "1" : "0",
    AI_BRIEFING_ISSUE_DATE: issueDate,
    AI_BRIEFING_OBSERVED_AT: "2026-07-15T00:00:00.000Z",
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
    run: () =>
      spawnSync("bash", ["scripts/ai-briefing.sh", ...(scenario.replaceExisting ? ["--replace-existing"] : [])], {
        cwd: repo,
        env,
        encoding: "utf8",
        timeout: 30000,
      }),
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
    const harness = createHarness({ dryRun: true, dirtyWorktree: true, nonDeployBranch: true });
    const result = harness.run();
    const gitCalls = readLines(path.join(harness.root, "git.log"));

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(fs.existsSync(path.join(harness.repo, briefingFile))).toBe(false);
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/reviewer-output.json"))).toBe(false);
    expect(readLines(path.join(harness.root, "claude.log")), `${result.stdout}\n${result.stderr}`).toHaveLength(1);
    expect(gitCalls.some((call) => /fetch|branch --show-current|rev-parse|status --porcelain/.test(call))).toBe(false);
    expect(commitCount(harness.repo)).toBe(1);
  });

  it("returns 3 for no_events and keeps raw output", () => {
    const harness = createHarness({ generatorStatus: "no_events" });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(3);
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/claude-output.json"))).toBe(true);
    expect(readLines(path.join(harness.root, "verifier.log"))).toContain("verify-no-events");
    expect(commitCount(harness.repo)).toBe(1);
  });

  it("does not return 3 when no_events evidence is invalid", () => {
    const harness = createHarness({ generatorStatus: "no_events", noEventsEvidenceValid: false });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(3);
    expect(readLines(path.join(harness.root, "verifier.log"))).toContain("verify-no-events");
    expect(fs.existsSync(path.join(harness.repo, briefingFile))).toBe(false);
  }, 15000);

  it("returns 4 before invoking Claude when today's file exists", () => {
    const harness = createHarness({ existingBriefing: true });
    const result = harness.run();

    expect(result.status).toBe(4);
    expect(readLines(path.join(harness.root, "claude.log"))).toEqual([]);
  });

  it("never replaces an already published briefing", () => {
    const harness = createHarness({ existingBriefing: "published", replaceExisting: true });
    const original = fs.readFileSync(path.join(harness.repo, briefingFile), "utf8");
    const result = harness.run();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("published: true");
    expect(fs.readFileSync(path.join(harness.repo, briefingFile), "utf8")).toBe(original);
    expect(commitCount(harness.repo)).toBe(1);
  }, 15000);

  it("replaces an unpublished briefing only through the finalizer", () => {
    const harness = createHarness({ existingBriefing: "draft", replaceExisting: true });
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(fs.readFileSync(path.join(harness.repo, briefingFile), "utf8")).toContain("title: fake");
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/briefing.before-finalize.md"))).toBe(true);
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/briefing.before-finalize.sha256"))).toBe(true);
    expect(commitCount(harness.repo)).toBe(2);
  }, 15000);

  it("restores an unpublished briefing when replacement build fails", () => {
    const harness = createHarness({ existingBriefing: "draft", replaceExisting: true, buildFails: true });
    const original = fs.readFileSync(path.join(harness.repo, briefingFile), "utf8");
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(fs.readFileSync(path.join(harness.repo, briefingFile), "utf8")).toBe(original);
    expect(commitCount(harness.repo)).toBe(1);
  }, 15000);

  it("does not remove a lock held by another process", () => {
    const harness = createHarness({ occupiedLock: true });
    const result = harness.run();

    expect(result.status).not.toBe(0);
    expect(fs.readFileSync(path.join(harness.root, "lock/owner"), "utf8")).toBe("other-process\n");
    expect(readLines(path.join(harness.root, "claude.log"))).toEqual([]);
  });

  it("requires upstream to match inside the publication finalizer", () => {
    const harness = createHarness({ upstreamMismatch: true });
    const result = harness.run();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("当前 upstream 必须是 upstream/main，实际为 origin/main");
    expect(readLines(path.join(harness.root, "claude.log"))).toHaveLength(2);
    expect(fs.existsSync(path.join(harness.repo, briefingFile))).toBe(false);
  }, 15000);

  it("uses a non-origin remote consistently", () => {
    const harness = createHarness({ remoteName: "mirror" });
    const result = harness.run();
    const gitCalls = readLines(path.join(harness.root, "git.log"));

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(gitCalls).toContain("fetch mirror main");
    expect(gitCalls).toContain("push mirror main");
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
    expect(fs.existsSync(path.join(harness.repo, briefingFile))).toBe(false);
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/candidate.md"))).toBe(true);
    expect(commitCount(harness.repo)).toBe(1);
  });

  it.each([
    [{ candidateValidationFails: true }, "candidate validation"],
    [{ buildFails: true }, "index build"],
  ])("keeps the public directory clean after %s failure", (scenario) => {
    const harness = createHarness(scenario);
    const originalIndex = fs.readFileSync(path.join(harness.repo, "site/public/ai-data/briefings/index.json"), "utf8");
    const result = harness.run();

    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(fs.existsSync(path.join(harness.repo, briefingFile))).toBe(false);
    expect(fs.existsSync(path.join(harness.repo, ".local/ai-briefing/runs/test-run/candidate.md"))).toBe(true);
    expect(fs.readFileSync(path.join(harness.repo, "site/public/ai-data/briefings/index.json"), "utf8")).toBe(originalIndex);
    expect(commitCount(harness.repo)).toBe(1);
  });

  it("fails after push when remote verification fails", () => {
    const harness = createHarness({ remoteContainsCommit: false });
    const result = harness.run();
    const claudeCalls = readLines(path.join(harness.root, "claude.log")).map((line) => JSON.parse(line));
    const gitCalls = readLines(path.join(harness.root, "git.log"));
    const verifierCalls = readLines(path.join(harness.root, "verifier-args.log")).map((line) => JSON.parse(line));

    expect(result.status, `${result.stdout}\n${result.stderr}`).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("已推送、远端验证状态未知");
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
    expect(verifierCalls).toContainEqual(
      expect.arrayContaining(["verify-pre-review", "--candidate", ".local/ai-briefing/runs/test-run/candidate.md"]),
    );
    expect(verifierCalls).toContainEqual(expect.arrayContaining(["verify-post-push", "--remote", "origin"]));
  }, 15000);

  it("keeps publication writes inside the shared finalizer", () => {
    const shell = fs.readFileSync(path.join(workspaceRoot, "scripts/ai-briefing.sh"), "utf8");
    const finalizer = fs.readFileSync(path.join(workspaceRoot, "scripts/finalize-ai-briefing-run.sh"), "utf8");

    expect(shell).toContain("finalize-ai-briefing-run.sh");
    expect(shell).not.toMatch(/^git (?:add|commit|push)\b/m);
    expect(finalizer).toContain('git add -- "$BRIEFING_FILE" "$INDEX_FILE"');
    expect(finalizer).toContain('[ "$INDEX_FILE" = "site/public/ai-data/briefings/index.json" ]');
    expect(finalizer).not.toContain("git add .");
    expect(finalizer).not.toContain("--no-verify");
    expect(finalizer).not.toMatch(/git push .*--force/);
    expect(shell).not.toContain("--max-turns");
    expect(shell).not.toContain("--dangerously-skip-permissions");
  });

  it("passes the frozen observation time through the current window CLI contract", () => {
    const shell = fs.readFileSync(path.join(workspaceRoot, "scripts/ai-briefing.sh"), "utf8");

    expect(shell).toContain('--observed-at "$OBSERVED_AT"');
    expect(shell).not.toContain('--window-end "$WINDOW_END"');
  });
});
