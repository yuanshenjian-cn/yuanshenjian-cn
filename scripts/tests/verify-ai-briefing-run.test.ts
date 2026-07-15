import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type VerifierModule = typeof import("../verify-ai-briefing-run.js");

const fixturesRoot = path.join(process.cwd(), "scripts/tests/fixtures/ai-briefing");
const window = {
  issueDate: "2026-07-15",
  previousIssueDate: "2026-07-14",
  nominalDays: 1,
  coverageStartDate: "2026-07-14",
  coverageEndDate: "2026-07-15",
  observedAt: "2026-07-15T12:00:00.000Z",
  timezone: "Asia/Shanghai",
  strategy: "calendar-date-overlap",
};
const sources = [
  {
    id: "official",
    companyId: "openai",
    publisherId: "openai",
    method: "feed",
    url: "https://openai.com/feed.xml",
    authority: "official",
    coverageRole: "primary",
    confirmationPolicy: { default: "standalone", byCategory: {} },
    categories: ["api"],
    sourceTimezone: "America/Los_Angeles",
    allowedRedirectHosts: ["openai.com"],
    allowedArticleHosts: ["openai.com"],
    allowedUrlPrefixes: ["https://openai.com/release"],
    enabled: true,
  },
  {
    id: "official-page",
    companyId: "openai",
    publisherId: "openai",
    method: "page",
    url: "https://openai.com/news",
    authority: "official",
    coverageRole: "primary",
    confirmationPolicy: { default: "standalone", byCategory: {} },
    categories: ["api"],
    sourceTimezone: "America/Los_Angeles",
    allowedRedirectHosts: ["openai.com"],
    allowedArticleHosts: ["openai.com"],
    allowedUrlPrefixes: ["https://openai.com/news"],
    enabled: true,
  },
  {
    id: "reuters-one",
    companyId: null,
    publisherId: "reuters",
    method: "search",
    authority: "media",
    coverageRole: "discovery",
    confirmationPolicy: { default: "needs-corroboration", byCategory: {} },
    categories: ["*"],
    sourceTimezone: "UTC",
    allowedRedirectHosts: [],
    allowedArticleHosts: ["reuters.com"],
    enabled: true,
  },
  {
    id: "reuters-two",
    companyId: null,
    publisherId: "reuters",
    method: "search",
    authority: "media",
    coverageRole: "discovery",
    confirmationPolicy: { default: "needs-corroboration", byCategory: {} },
    categories: ["*"],
    sourceTimezone: "UTC",
    allowedRedirectHosts: [],
    allowedArticleHosts: ["reuters.com"],
    enabled: true,
  },
  {
    id: "bloomberg",
    companyId: null,
    publisherId: "bloomberg",
    method: "search",
    authority: "media",
    coverageRole: "discovery",
    confirmationPolicy: { default: "needs-corroboration", byCategory: {} },
    categories: ["*"],
    sourceTimezone: "UTC",
    allowedRedirectHosts: [],
    allowedArticleHosts: ["bloomberg.com"],
    enabled: true,
  },
];
const sourceById = new Map(sources.map((source) => [source.id, source]));

let verifier: VerifierModule;
let tempRoot: string;

function readJsonFixture(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesRoot, name), "utf8"));
}

function timestampEvidence(sourceId: string, eventAt = "2026-07-14T12:00:00.000Z") {
  return {
    sourceId,
    timePrecision: "timestamp",
    eventAt,
    eventDate: "2026-07-14",
    sourceTimezone: sourceById.get(sourceId)?.sourceTimezone ?? "UTC",
    withinWindow: true,
  };
}

beforeAll(async () => {
  verifier = await import("../verify-ai-briefing-run.js");
});

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "verify-ai-briefing-"));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("Claude structured output contracts", () => {
  it("parses JSON and final stream-json structured_output", () => {
    const generator = readJsonFixture("claude-generator-results.json");
    const stream = [
      JSON.stringify({ type: "assistant", message: { content: [] } }),
      JSON.stringify({ type: "result", structured_output: generator.draft_ready.structured_output }),
    ].join("\n");

    expect(verifier.parseClaudeOutput(JSON.stringify(generator.draft_ready)).status).toBe("draft_ready");
    expect(verifier.parseClaudeOutput(stream).status).toBe("draft_ready");
    expect(() => verifier.parseClaudeOutput(JSON.stringify({ result: "natural language only" }))).toThrow(
      "structured_output",
    );
  });

  it("validates every generator and reviewer discriminated branch", () => {
    const generator = readJsonFixture("claude-generator-results.json");
    const reviewer = readJsonFixture("claude-reviewer-results.json");

    for (const value of Object.values(generator)) {
      expect(() => verifier.validateGeneratorResult(verifier.parseClaudeOutput(JSON.stringify(value)), "2026-07-15")).not.toThrow();
    }
    for (const value of Object.values(reviewer)) {
      expect(() => verifier.validateReviewerResult(verifier.parseClaudeOutput(JSON.stringify(value)))).not.toThrow();
    }
    expect(() => verifier.validateGeneratorResult({ status: "unknown" }, "2026-07-15")).toThrow("未知 generator status");
    expect(() =>
      verifier.validateReviewerResult({
        status: "approved",
        conclusion: "可进入发布门禁",
        networkStatus: "online",
        checkedEvidenceIds: ["one"],
        uncheckedHighRiskItems: ["event"],
        evidenceQuality: { authority: "通过", authenticity: "通过", timeliness: "通过" },
      }),
    ).toThrow("高风险未核验项");
  });

  it("supports the parse-generator CLI without reading natural language output", () => {
    const input = path.join(tempRoot, "claude-output.json");
    const runDir = path.join(tempRoot, "run");
    fs.writeFileSync(input, JSON.stringify(readJsonFixture("claude-generator-results.json").no_events));
    const result = spawnSync(
      "node",
      [
        "scripts/verify-ai-briefing-run.js",
        "parse-generator",
        "--input",
        input,
        "--run-dir",
        runDir,
        "--issue-date",
        "2026-07-15",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).status).toBe("no_events");
  });
});

describe("date coverage and confirmation policy", () => {
  it("accepts an observed official date without waiting for source day end", () => {
    expect(
      verifier.isEvidenceWithinCoverage(
        {
          timePrecision: "date",
          sourceDate: "2026-07-14",
          sourceTimezone: "America/Los_Angeles",
        },
        sources[0],
        window,
      ),
    ).toBe(true);
  });

  it("rejects timestamps after observedAt", () => {
    expect(
      verifier.isEvidenceWithinCoverage(
        {
          timePrecision: "timestamp",
          eventAt: "2026-07-15T12:00:00.001Z",
          eventDate: "2026-07-15",
          sourceTimezone: "America/Los_Angeles",
        },
        sources[0],
        window,
      ),
    ).toBe(false);
  });

  it("uses source-local midnight ranges across DST", () => {
    const interval = verifier.sourceLocalDateInterval("2026-03-08", "America/Los_Angeles");
    expect(new Date(interval.end).getTime() - new Date(interval.start).getTime()).toBe(23 * 60 * 60 * 1000);
  });

  it("requires two independent publishers for corroboration", () => {
    const base = { eventType: "api", sourceRefs: [] as Array<Record<string, unknown>> };

    expect(
      verifier.isConfirmedEvent(
        { ...base, sourceRefs: [timestampEvidence("reuters-one"), timestampEvidence("reuters-two")] },
        sourceById,
        window,
      ),
    ).toBe(false);
    expect(
      verifier.isConfirmedEvent(
        { ...base, sourceRefs: [timestampEvidence("reuters-one"), timestampEvidence("bloomberg")] },
        sourceById,
        window,
      ),
    ).toBe(true);
    expect(
      verifier.isConfirmedEvent({ ...base, sourceRefs: [timestampEvidence("official")] }, sourceById, window),
    ).toBe(true);
  });

  it("does not count media date-only evidence as confirmation", () => {
    const event = {
      eventType: "api",
      sourceRefs: [
        {
          sourceId: "reuters-one",
          timePrecision: "date",
          sourceDate: "2026-07-14",
          sourceTimezone: "UTC",
          withinWindow: true,
        },
        timestampEvidence("bloomberg"),
      ],
    };

    expect(verifier.isConfirmedEvent(event, sourceById, window)).toBe(false);
  });

  it("requires authority labels to match the registry", () => {
    expect(() =>
      verifier.validatePublicSourceLabels(
        { eventType: "api", sourceRefs: [{ sourceId: "official", label: "媒体报道" }] },
        sourceById,
      ),
    ).toThrow("来源标签与 authority 不一致");
  });
});

describe("evidence contracts and coverage", () => {
  const collection = {
    coverageStartDate: "2026-07-14",
    coverageEndDate: "2026-07-15",
    observedAt: "2026-07-15T12:00:00.000Z",
    sources: [
      {
        sourceId: "official",
        companyId: "openai",
        status: "success",
        checkedAt: "2026-07-15T12:01:00.000Z",
        windowCoverage: "complete",
        rejectedItems: [],
        candidates: [
          {
            candidateId: "candidate-1",
            sourceId: "official",
            canonicalUrl: "https://openai.com/release",
            eventAt: "2026-07-14T12:00:00.000Z",
            eventDate: "2026-07-14",
            timePrecision: "timestamp",
            sourceTimezone: "America/Los_Angeles",
            withinWindow: true,
          },
        ],
      },
    ],
  };
  const discovery = {
    paths: [
      {
        sourceId: "official-page",
        companyId: "openai",
        method: "page",
        status: "checked-empty",
        checkedAt: "2026-07-15T12:02:00.000Z",
        request: { url: "https://openai.com/news", query: null },
        candidateCount: 0,
        error: null,
        evidence: [],
      },
    ],
  };
  const selection = {
    events: [
      {
        eventId: "event-1",
        title: "OpenAI 更新 API",
        eventType: "api",
        included: true,
        editorialPriority: "high",
        candidateIds: ["candidate-1"],
        sourceRefs: [
          {
            sourceId: "official",
            evidenceId: "candidate-1",
            url: "https://openai.com/release",
            label: "官方",
          },
        ],
        materialDelta: {
          kind: "new-event",
          summary: "新增可核验 API 能力",
          evidenceIds: ["candidate-1"],
        },
        historyMatches: [],
      },
    ],
    coverage: [],
  };

  it("validates collection, checked-empty discovery, self-review, and selection", () => {
    expect(() => verifier.validateCollectionContract(collection, { sources }, window)).not.toThrow();
    expect(() => verifier.validateDiscoveryContract(discovery, { sources }, window)).not.toThrow();
    expect(() =>
      verifier.validateSelfReviewContract({
        windowChecked: true,
        recentFiveChecked: true,
        priorityCoverageChecked: true,
        coverageConclusion: "sufficient",
        coverageGaps: [],
        candidateDisposition: { included: 1, excluded: 0, rejected: 0 },
        highRiskUnconfirmedItems: [],
        conclusion: "通过",
      }),
    ).not.toThrow();
    expect(() => verifier.validateSelectionContract(selection)).not.toThrow();
    expect(() =>
      verifier.validateSelectionEvidence({
        selection,
        collection,
        discovery,
        window,
        sourceRegistry: { sources },
        publicSourceGroups: [
          { heading: "OpenAI 更新 API", sources: [{ label: "官方", url: "https://openai.com/release" }] },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects source URLs outside the configured prefix", () => {
    const forgedCollection = structuredClone(collection);
    forgedCollection.sources[0].candidates[0].canonicalUrl = "https://openai.com/unrelated/release";
    const forgedSelection = structuredClone(selection);
    forgedSelection.events[0].sourceRefs[0].url = "https://openai.com/unrelated/release";
    expect(() =>
      verifier.validateSelectionEvidence({
        selection: forgedSelection,
        collection: forgedCollection,
        discovery,
        window,
        sourceRegistry: { sources },
        publicSourceGroups: [
          { heading: "OpenAI 更新 API", sources: [{ label: "官方", url: "https://openai.com/unrelated/release" }] },
        ],
      }),
    ).toThrow("URL 不匹配 source official 的允许前缀");
  });

  it("requires structured material deltas and history matches", () => {
    const invalidDelta = structuredClone(selection);
    invalidDelta.events[0].materialDelta = "新增能力" as unknown as typeof invalidDelta.events[0]["materialDelta"];
    expect(() => verifier.validateSelectionContract(invalidDelta)).toThrow("materialDelta");

    const invalidHistory = structuredClone(selection);
    invalidHistory.events[0].historyMatches = [{ eventTitle: "旧事件" }] as unknown as [];
    expect(() => verifier.validateSelectionContract(invalidHistory)).toThrow("historyMatches");
  });

  it("rejects duplicate included candidate ownership", () => {
    const duplicated = structuredClone(selection);
    duplicated.events.push({ ...structuredClone(duplicated.events[0]), eventId: "event-2", title: "另一个事件" });
    expect(() => verifier.validateSelectionContract(duplicated)).toThrow("重复归属");
  });

  it("accepts a checked-empty primary check as sufficient coverage", () => {
    const result = verifier.evaluateCoverage(
      { sources: [] },
      discovery,
      [{ id: "openai", priorityFocus: true }],
      { sources },
    );
    expect(result.status).toBe("sufficient");
    expect(() => verifier.validateCoverageForStatus("no_events", result)).not.toThrow();
  });

  it("allows degraded coverage for drafts but not no_events", () => {
    const result = verifier.evaluateCoverage(
      { sources: [] },
      { paths: [] },
      [{ id: "openai", priorityFocus: true }],
      { sources },
    );
    expect(result.status).toBe("insufficient");
    expect(() => verifier.validateCoverageForStatus("draft_ready", result)).toThrow("insufficient");

    const degraded = { status: "degraded", companies: [] };
    expect(() => verifier.validateCoverageForStatus("draft_ready", degraded)).not.toThrow();
    expect(() => verifier.validateCoverageForStatus("no_events", degraded)).toThrow("no_events 要求 sufficient coverage");
  });

  it("does not require global media searches for every company", () => {
    expect(() =>
      verifier.evaluateCoverage(
        collection,
        { paths: [] },
        [{ id: "openai", priorityFocus: true }],
        { sources },
      ),
    ).not.toThrow();
  });
});

describe("no_events evidence gate", () => {
  it("rejects no_events when coverage is degraded", () => {
    expect(() => verifier.validateCoverageForStatus("no_events", { status: "degraded", companies: [] })).toThrow(
      "no_events 要求 sufficient coverage",
    );
  });

  it("requires every candidate to be excluded or rejected", () => {
    expect(() =>
      verifier.validateNoEventsDisposition(
        { sources: [{ candidates: [{ candidateId: "one" }], rejectedItems: [] }] },
        { events: [], coverage: [] },
        { candidateDisposition: { included: 0, excluded: 0, rejected: 0 } },
      ),
    ).toThrow("候选处置数量不一致");
  });
});

describe("verify-no-events command", () => {
  it("blocks insufficient coverage through the CLI", () => {
    const runDir = path.join(tempRoot, "no-events-cli");
    fs.mkdirSync(runDir);
    const frozenWindow = {
      ...window,
      issueDate: "2099-01-02",
      previousIssueDate: "2099-01-01",
      coverageStartDate: "2099-01-01",
      coverageEndDate: "2099-01-02",
      observedAt: "2099-01-02T12:00:00.000Z",
    };
    const files = {
      window: frozenWindow,
      collection: {
        coverageStartDate: frozenWindow.coverageStartDate,
        coverageEndDate: frozenWindow.coverageEndDate,
        observedAt: frozenWindow.observedAt,
        sources: [],
      },
      discovery: { paths: [] },
      selection: { events: [], coverage: [] },
      "self-review": {
        windowChecked: true,
        recentFiveChecked: true,
        priorityCoverageChecked: true,
        coverageConclusion: "sufficient",
        coverageGaps: [],
        candidateDisposition: { included: 0, excluded: 0, rejected: 0 },
        highRiskUnconfirmedItems: [],
        conclusion: "本期无可发布事件",
      },
    };
    for (const [name, value] of Object.entries(files)) {
      fs.writeFileSync(path.join(runDir, `${name}.json`), `${JSON.stringify(value)}\n`);
    }

    const result = spawnSync(
      "node",
      [
        "scripts/verify-ai-briefing-run.js",
        "verify-no-events",
        "--run-dir",
        runDir,
        "--expected-window-hash",
        verifier.sha256File(path.join(runDir, "window.json")),
        "--expected-collection-hash",
        verifier.sha256File(path.join(runDir, "collection.json")),
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("no_events 要求 sufficient coverage");
    expect(fs.existsSync(path.join(runDir, "verification.json"))).toBe(false);
  });

  it("blocks candidate and public-file side effects", () => {
    const runDir = path.join(tempRoot, "no-events-side-effects");
    fs.mkdirSync(runDir);
    const collection = {
      coverageStartDate: window.coverageStartDate,
      coverageEndDate: window.coverageEndDate,
      observedAt: window.observedAt,
      sources: [],
    };
    const selfReview = {
      windowChecked: true,
      recentFiveChecked: true,
      priorityCoverageChecked: true,
      coverageConclusion: "sufficient",
      coverageGaps: [],
      candidateDisposition: { included: 0, excluded: 0, rejected: 0 },
      highRiskUnconfirmedItems: [],
      conclusion: "本期无可发布事件",
    };
    const sideEffectDiscovery = {
      paths: [
        {
          sourceId: "official-page",
          companyId: "openai",
          method: "page",
          status: "checked-empty",
          checkedAt: "2026-07-15T12:02:00.000Z",
          request: { url: "https://openai.com/news", query: null },
          candidateCount: 0,
          error: null,
          evidence: [],
        },
      ],
    };
    const files = {
      window,
      collection,
      discovery: sideEffectDiscovery,
      selection: { events: [], coverage: [] },
      "self-review": selfReview,
    };
    for (const [name, value] of Object.entries(files)) {
      fs.writeFileSync(path.join(runDir, `${name}.json`), `${JSON.stringify(value)}\n`);
    }
    const expectedHashes = {
      window: verifier.sha256File(path.join(runDir, "window.json")),
      collection: verifier.sha256File(path.join(runDir, "collection.json")),
    };
    const dependencies = {
      config: {
        focusCompanies: [{ id: "openai", priorityFocus: true }],
        sourceRegistry: { sources: [sources[1]] },
      },
      runGit: () => ({ status: 0, stdout: "", stderr: "" }),
      briefingFile: path.join(tempRoot, "public-briefing.md"),
    };

    fs.writeFileSync(path.join(runDir, "candidate.md"), "candidate");
    expect(() => verifier.verifyNoEventsRun(runDir, expectedHashes, dependencies)).toThrow(
      "no_events 不得产生 candidate.md",
    );
    fs.rmSync(path.join(runDir, "candidate.md"));
    fs.writeFileSync(dependencies.briefingFile, "public");
    expect(() => verifier.verifyNoEventsRun(runDir, expectedHashes, dependencies)).toThrow(
      "no_events 不得产生正式简报文件",
    );

    const replacementHashes = {
      ...expectedHashes,
      briefing: verifier.sha256File(dependencies.briefingFile),
    };
    expect(() => verifier.verifyNoEventsRun(runDir, replacementHashes, dependencies)).not.toThrow();
    fs.writeFileSync(dependencies.briefingFile, "modified");
    expect(() => verifier.verifyNoEventsRun(runDir, replacementHashes, dependencies)).toThrow(
      "no_events 修改了替换前的正式简报文件",
    );
  });
});


describe("immutable files and Git publication proof", () => {
  it("detects immutable evidence mutations", () => {
    const windowPath = path.join(tempRoot, "window.json");
    const collectionPath = path.join(tempRoot, "collection.json");
    fs.writeFileSync(windowPath, "window");
    fs.writeFileSync(collectionPath, "collection");
    const originalWindowHash = `sha256:${crypto.createHash("sha256").update("window").digest("hex")}`;
    const originalCollectionHash = `sha256:${crypto.createHash("sha256").update("collection").digest("hex")}`;
    const input = {
      windowPath,
      expectedWindowHash: originalWindowHash,
      collectionPath,
      expectedCollectionHash: originalCollectionHash,
    };

    expect(() => verifier.verifyImmutableFiles(input)).not.toThrow();
    fs.appendFileSync(windowPath, "changed");
    expect(() => verifier.verifyImmutableFiles(input)).toThrow("window.json 已被修改");
  });

  it("verifies commit files through diff-tree", () => {
    const runGit = vi.fn(() => ({
      status: 0,
      stdout: "content/ai-briefings/2026/07/2026-07-15-ai-briefing.md\nsite/public/ai-data/briefings/index.json\n",
      stderr: "",
    }));
    expect(() =>
      verifier.verifyCommittedFileSet({
        commit: "abc123",
        briefingFile: "content/ai-briefings/2026/07/2026-07-15-ai-briefing.md",
        indexFile: "site/public/ai-data/briefings/index.json",
        runGit,
      }),
    ).not.toThrow();
    expect(runGit).toHaveBeenCalledWith(["diff-tree", "--no-commit-id", "--name-only", "-r", "abc123"]);

    const extraFileGit = () => ({ status: 0, stdout: "allowed.md\nunexpected.md\n", stderr: "" });
    expect(() =>
      verifier.verifyCommittedFileSet({
        commit: "abc123",
        briefingFile: "allowed.md",
        indexFile: "index.json",
        runGit: extraFileGit,
      }),
    ).toThrow("commit 文件集合不符合预期");
  });

  it("fetches before proving the remote branch contains the commit", () => {
    const calls: string[][] = [];
    const runGit = (args: string[]) => {
      calls.push(args);
      return { status: args[0] === "merge-base" ? 1 : 0, stdout: "", stderr: "" };
    };

    expect(() => verifier.verifyRemoteContainsCommit({ commit: "abc123", branch: "main", remote: "upstream", runGit })).toThrow(
      "远端分支不包含 commit",
    );
    expect(calls).toEqual([
      ["fetch", "upstream", "main"],
      ["merge-base", "--is-ancestor", "abc123", "refs/remotes/upstream/main"],
    ]);
  });
});
