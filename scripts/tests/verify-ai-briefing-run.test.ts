import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type VerifierModule = typeof import("../verify-ai-briefing-run.js");

const fixturesRoot = path.join(process.cwd(), "scripts/tests/fixtures/ai-briefing");
const window = {
  windowStart: "2026-07-14T00:00:00.000Z",
  windowEnd: "2026-07-15T00:00:00.000Z",
};
const sources = [
  {
    id: "official",
    companyId: "openai",
    publisherId: "openai",
    method: "feed",
    url: "https://openai.com/feed.xml",
    authority: "official",
    confirmationPolicy: { default: "standalone", byCategory: {} },
    categories: ["api"],
    sourceTimezone: "America/Los_Angeles",
    allowedRedirectHosts: ["openai.com"],
    allowedArticleHosts: ["openai.com"],
    enabled: true,
  },
  {
    id: "reuters-one",
    companyId: null,
    publisherId: "reuters",
    method: "search",
    authority: "media",
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
        conclusion: "通过",
        evidenceQuality: { authority: "通过", authenticity: "通过", timeliness: "通过" },
      }),
    ).toThrow("可进入发布门禁");
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

describe("evidence time and confirmation policy", () => {
  it("uses an open-start closed-end window", () => {
    expect(verifier.isWithinWindow(window.windowStart, window)).toBe(false);
    expect(verifier.isWithinWindow(window.windowEnd, window)).toBe(true);
  });

  it("converts source-local dates to DST-aware local day end", () => {
    expect(verifier.computeDateEndEffectiveAt("2026-07-14", "America/Los_Angeles")).toBe(
      "2026-07-15T06:59:59.999Z",
    );
    expect(verifier.computeDateEndEffectiveAt("2026-07-14", "Asia/Shanghai")).toBe(
      "2026-07-14T15:59:59.999Z",
    );
  });

  it("requires two independent publishers for corroboration", () => {
    const base = { eventType: "api", sourceRefs: [] as Array<Record<string, unknown>> };
    const exactTime = { timePrecision: "timestamp", effectiveAt: "2026-07-14T12:00:00.000Z" };

    expect(
      verifier.isConfirmedEvent(
        { ...base, sourceRefs: [{ sourceId: "reuters-one", ...exactTime }, { sourceId: "reuters-two", ...exactTime }] },
        sourceById,
        window,
      ),
    ).toBe(false);
    expect(
      verifier.isConfirmedEvent(
        { ...base, sourceRefs: [{ sourceId: "reuters-one", ...exactTime }, { sourceId: "bloomberg", ...exactTime }] },
        sourceById,
        window,
      ),
    ).toBe(true);
    expect(
      verifier.isConfirmedEvent(
        { ...base, sourceRefs: [{ sourceId: "official", ...exactTime }] },
        sourceById,
        window,
      ),
    ).toBe(true);
  });

  it("does not count media date-only evidence as confirmation", () => {
    const event = {
      eventType: "api",
      sourceRefs: [
        { sourceId: "reuters-one", timePrecision: "date", effectiveAt: "2026-07-14T23:59:59.999Z" },
        { sourceId: "bloomberg", timePrecision: "timestamp", effectiveAt: "2026-07-14T12:00:00.000Z" },
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
  it("validates collection, discovery, self-review, and selection evidence contracts", () => {
    const collection = {
      sources: [
        {
          sourceId: "official",
          companyId: "openai",
          status: "success",
          checkedAt: "2026-07-15T00:00:00.000Z",
          windowCoverage: "complete",
          candidates: [
            {
              candidateId: "candidate-1",
              sourceId: "official",
              canonicalUrl: "https://openai.com/release",
              effectiveAt: "2026-07-14T12:00:00.000Z",
              timePrecision: "timestamp",
              sourceTimezone: "America/Los_Angeles",
              timeConvention: "exact",
              withinWindow: true,
            },
          ],
        },
      ],
    };
    const discovery = { paths: [] };
    const selection = {
      events: [
        {
          eventId: "event-1",
          title: "OpenAI 更新 API",
          eventType: "api",
          included: true,
          candidateIds: ["candidate-1"],
          sourceRefs: [
            {
              sourceId: "official",
              evidenceId: "candidate-1",
              url: "https://openai.com/release",
              label: "官方",
            },
          ],
          materialDelta: "新增可核验 API 能力",
          historyMatches: [],
        },
      ],
      coverage: [],
    };

    expect(() => verifier.validateCollectionContract(collection)).not.toThrow();
    expect(() => verifier.validateDiscoveryContract(discovery)).not.toThrow();
    expect(() =>
      verifier.validateSelfReviewContract({
        windowChecked: true,
        recentFiveChecked: true,
        priorityCoverageChecked: true,
        highRiskUnconfirmedItems: [],
        conclusion: "通过",
      }),
    ).not.toThrow();
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

    const missingWithinWindow = structuredClone(collection);
    Reflect.deleteProperty(missingWithinWindow.sources[0].candidates[0], "withinWindow");
    expect(() => verifier.validateCollectionContract(missingWithinWindow)).toThrow("withinWindow");
    expect(() => verifier.validateDiscoveryContract({ paths: [{ status: "success", evidence: [] }] })).toThrow();

    const crossSourceCollection = structuredClone(collection);
    crossSourceCollection.sources[0].candidates[0].canonicalUrl = "https://reuters.com/release";
    const crossSourceSelection = structuredClone(selection);
    crossSourceSelection.events[0].sourceRefs[0].url = "https://reuters.com/release";
    expect(() =>
      verifier.validateSelectionEvidence({
        selection: crossSourceSelection,
        collection: crossSourceCollection,
        discovery,
        window,
        sourceRegistry: { sources },
        publicSourceGroups: [
          { heading: "OpenAI 更新 API", sources: [{ label: "官方", url: "https://reuters.com/release" }] },
        ],
      }),
    ).toThrow("URL 主机不属于 source official");
  });

  it("binds discovery paths and evidence to enabled registry sources", () => {
    const pageSource = {
      id: "openai-page",
      companyId: "openai",
      publisherId: "openai",
      method: "page",
      url: "https://openai.com/news",
      authority: "official",
      confirmationPolicy: { default: "standalone", byCategory: {} },
      categories: ["api"],
      sourceTimezone: "America/Los_Angeles",
      allowedRedirectHosts: ["openai.com"],
      allowedArticleHosts: ["openai.com"],
      enabled: true,
    };
    const registry = { sources: [pageSource, sources[1]] };
    const pagePath = {
      sourceId: "openai-page",
      companyId: "openai",
      method: "page",
      status: "success",
      checkedAt: "2026-07-15T00:00:00.000Z",
      error: null,
      evidence: [
        {
          evidenceId: "page:openai",
          sourceId: "openai-page",
          url: "https://openai.com/news/release",
          effectiveAt: "2026-07-14T12:00:00.000Z",
          timePrecision: "timestamp",
          sourceTimezone: "America/Los_Angeles",
          timeConvention: "exact",
          withinWindow: true,
        },
      ],
    };
    const globalSearchPath = {
      sourceId: "reuters-one",
      companyId: "openai",
      method: "search",
      status: "success",
      checkedAt: "2026-07-15T00:00:00.000Z",
      error: null,
      evidence: [
        {
          evidenceId: "search:reuters-openai",
          sourceId: "reuters-one",
          url: "https://reuters.com/technology/openai",
          effectiveAt: "2026-07-14T12:00:00.000Z",
          timePrecision: "timestamp",
          sourceTimezone: "UTC",
          timeConvention: "exact",
          withinWindow: true,
        },
      ],
    };

    expect(() => verifier.validateDiscoveryContract({ paths: [pagePath, globalSearchPath] }, registry, window)).not.toThrow();
    expect(() =>
      verifier.validateDiscoveryContract(
        { paths: [{ ...pagePath, sourceId: "forged-source", evidence: [{ ...pagePath.evidence[0], sourceId: "forged-source" }] }] },
        registry,
        window,
      ),
    ).toThrow("未知 sourceId");
    expect(() =>
      verifier.validateDiscoveryContract({ paths: [{ ...pagePath, method: "search" }] }, registry, window),
    ).toThrow("method 与 registry 不一致");
    expect(() =>
      verifier.validateDiscoveryContract({ paths: [{ ...pagePath, companyId: "anthropic" }] }, registry, window),
    ).toThrow("companyId 与 registry 不一致");
    expect(() =>
      verifier.validateDiscoveryContract({ paths: [{ ...pagePath, checkedAt: "not-a-time" }] }, registry, window),
    ).toThrow("checkedAt 必须是合法 ISO 时间");
    expect(() =>
      verifier.validateDiscoveryContract(
        { paths: [{ ...pagePath, checkedAt: "2026-07-14T23:59:59.999Z" }] },
        registry,
        window,
      ),
    ).toThrow("checkedAt 早于冻结 windowEnd");
    expect(() =>
      verifier.validateDiscoveryContract(
        { paths: [{ ...pagePath, evidence: [{ ...pagePath.evidence[0], withinWindow: false }] }]},
        registry,
        window,
      ),
    ).toThrow("withinWindow 与冻结窗口不一致");
    expect(() =>
      verifier.validateDiscoveryContract(
        { paths: [{ ...pagePath, evidence: [{ ...pagePath.evidence[0], url: "https://reuters.com/openai" }] }] },
        registry,
        window,
      ),
    ).toThrow("URL 主机不属于 source openai-page");
    expect(() =>
      verifier.validateDiscoveryContract({ paths: [{ ...pagePath, status: "unknown" }] }, registry, window),
    ).toThrow("status 不合法");
  });

  it("rejects duplicate included candidate ownership", () => {
    expect(() =>
      verifier.validateSelectionContract({
        events: [
          {
            eventId: "one",
            title: "事件一",
            eventType: "api",
            included: true,
            candidateIds: ["candidate-1"],
            sourceRefs: [],
            materialDelta: "新增能力",
            historyMatches: [],
          },
          {
            eventId: "two",
            title: "事件二",
            eventType: "api",
            included: true,
            candidateIds: ["candidate-1"],
            sourceRefs: [],
            materialDelta: "新增价格",
            historyMatches: [],
          },
        ],
        coverage: [],
      }),
    ).toThrow("重复归属");
  });

  it("blocks all-path failure and partial feed without a successful supplement", () => {
    const focusCompanies = [{ id: "openai", priorityFocus: true }];
    const registry = {
      sources: [
        { id: "feed", companyId: "openai", method: "feed", enabled: true },
        { id: "page", companyId: "openai", method: "page", enabled: true },
      ],
    };
    const failedCollection = {
      sources: [{ sourceId: "feed", companyId: "openai", status: "failed", windowCoverage: "unknown" }],
    };
    const failedDiscovery = {
      paths: [{ sourceId: "page", companyId: "openai", method: "page", status: "failed", error: "down", evidence: [] }],
    };

    expect(() => verifier.validateCoverage(failedCollection, failedDiscovery, focusCompanies, registry)).toThrow(
      "所有采集路径均失败",
    );
    expect(() =>
      verifier.validateCoverage(
        { sources: [{ sourceId: "feed", companyId: "openai", status: "success", windowCoverage: "partial", candidates: [] }] },
        failedDiscovery,
        focusCompanies,
        registry,
      ),
    ).toThrow("Feed coverage 不完整");
    expect(() =>
      verifier.validateCoverage(
        { sources: [{ sourceId: "feed", companyId: "openai", status: "success", windowCoverage: "partial", candidates: [] }] },
        {
          paths: [
            {
              sourceId: "page",
              companyId: "openai",
              method: "page",
              status: "success",
              error: null,
              evidence: [{ evidenceId: "page:one" }],
            },
          ],
        },
        focusCompanies,
        registry,
      ),
    ).not.toThrow();
  });

  it("requires an explicit result for every configured priority path", () => {
    expect(() =>
      verifier.validateCoverage(
        {
          sources: [
            {
              sourceId: "feed",
              companyId: "openai",
              status: "success",
              windowCoverage: "complete",
              candidates: [{ candidateId: "one" }],
            },
          ],
        },
        { paths: [] },
        [{ id: "openai", priorityFocus: true }],
        {
          sources: [
            { id: "feed", companyId: "openai", method: "feed", enabled: true },
            { id: "page", companyId: "openai", method: "page", enabled: true },
          ],
        },
      ),
    ).toThrow("配置路径 page 缺少明确采集结果");
  });

  it("requires a successful non-Feed supplement for complete feeds with zero candidates", () => {
    const collection = {
      sources: [
        { sourceId: "feed", companyId: "openai", status: "success", windowCoverage: "complete", candidates: [] },
      ],
    };
    const failedPage = {
      paths: [{ sourceId: "page", companyId: "openai", method: "page", status: "failed", error: "down", evidence: [] }],
    };
    const registry = {
      sources: [
        { id: "feed", companyId: "openai", method: "feed", enabled: true },
        { id: "page", companyId: "openai", method: "page", enabled: true },
      ],
    };

    expect(() =>
      verifier.validateCoverage(collection, failedPage, [{ id: "openai", priorityFocus: true }], registry),
    ).toThrow("零候选");
    expect(() =>
      verifier.validateCoverage(
        collection,
        {
          paths: [
            {
              sourceId: "page",
              companyId: "openai",
              method: "page",
              status: "success",
              error: null,
              evidence: [{ evidenceId: "page:checked" }],
            },
          ],
        },
        [{ id: "openai", priorityFocus: true }],
        registry,
      ),
    ).not.toThrow();
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
