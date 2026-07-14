import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

interface Source {
  id: string;
  companyId: string | null;
  publisherId: string;
  name: string;
  method: string;
  format: string;
  url: string;
  authority: string;
  confirmationPolicy: { default: string; byCategory: Record<string, string> };
  categories: string[];
  sourceTimezone: string;
  allowedRedirectHosts: string[];
  allowedArticleHosts: string[];
  filterKeywords?: string[];
  enabled: boolean;
}

type CollectorModule = typeof import("../collect-ai-briefing-feeds.js");

const fixturesRoot = path.join(process.cwd(), "scripts/tests/fixtures/ai-briefing");
const limits = {
  timeoutMs: 100,
  maxResponseBytes: 1024 * 1024,
  maxItemsPerFeed: 100,
  maxRedirects: 3,
  concurrency: 2,
};
const rssSource: Source = {
  id: "openai-news-rss",
  companyId: "openai",
  publisherId: "openai",
  name: "OpenAI News RSS",
  method: "feed",
  format: "rss",
  url: "https://feed.example.com/rss.xml",
  authority: "official",
  confirmationPolicy: { default: "standalone", byCategory: {} },
  categories: ["model", "api"],
  sourceTimezone: "UTC",
  allowedRedirectHosts: ["feed.example.com", "cdn.example.com"],
  allowedArticleHosts: ["openai.com"],
  enabled: true,
};
const atomSource = { ...rssSource, id: "openai-python-releases", format: "atom" };

let collector: CollectorModule;
let tempRoot: string;

function readFixture(name: string) {
  return fs.readFileSync(path.join(fixturesRoot, name), "utf8");
}

function buildRss(items: Array<{ title: string; publishedAt: string }>) {
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title>${items
    .map(
      (item, index) =>
        `<item><title>${item.title}</title><link>https://openai.com/news/${index}</link><guid>item-${index}</guid><pubDate>${item.publishedAt}</pubDate></item>`,
    )
    .join("")}</channel></rss>`;
}

function createResponse(statusCode: number, body = "", headers: Record<string, string> = {}) {
  const response = new PassThrough() as PassThrough & {
    statusCode: number;
    headers: Record<string, string>;
  };
  response.statusCode = statusCode;
  response.headers = headers;
  queueMicrotask(() => response.end(body));
  return response;
}

function createRequestImpl(
  responses: Array<{ statusCode: number; body?: string; headers?: Record<string, string> }>,
  invocations: Array<Record<string, unknown>>,
) {
  return (options: Record<string, unknown>, callback: (response: ReturnType<typeof createResponse>) => void) => {
    invocations.push(options);
    const request = new EventEmitter() as EventEmitter & {
      end: () => void;
      destroy: (error?: Error) => void;
      setTimeout: (milliseconds: number, callback: () => void) => void;
    };
    request.setTimeout = () => {};
    request.destroy = (error?: Error) => queueMicrotask(() => request.emit("error", error || new Error("destroyed")));
    request.end = () => {
      const next = responses.shift();
      if (!next) throw new Error("missing fake response");
      queueMicrotask(() => callback(createResponse(next.statusCode, next.body, next.headers)));
    };
    return request;
  };
}

beforeAll(async () => {
  collector = await import("../collect-ai-briefing-feeds.js");
});

beforeEach(() => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-briefing-feeds-"));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("AI briefing feed parsing and clustering", () => {
  it("normalizes RSS and Atom into the same candidate contract", () => {
    const rss = collector.parseFeedXml(readFixture("rss.xml"), rssSource);
    const atom = collector.parseFeedXml(readFixture("atom.xml"), atomSource);

    expect(rss[0]).toMatchObject({
      sourceId: rssSource.id,
      companyId: "openai",
      canonicalUrl: "https://openai.com/index/new-api/",
      publishedAt: "2026-07-14T01:00:00.000Z",
      timePrecision: "timestamp",
      authority: "official",
    });
    expect(rss[0].candidateId).toMatch(/^sha256:/);
    expect(atom[0].contentHash).toMatch(/^sha256:/);
    expect(atom[0].canonicalUrl).toBe("https://github.com/openai/openai-python/releases/tag/v6.0.0");
  });

  it("rejects DOCTYPE before XML parsing", () => {
    expect(() => collector.parseFeedXml(readFixture("doctype.xml"), rssSource)).toThrow("DOCTYPE");
  });

  it("clusters only candidates sharing deterministic identity keys", () => {
    const base = {
      sourceId: "one",
      candidateId: "sha256:one",
      guid: null,
      canonicalUrl: "https://media.example.com/a",
      officialLandingUrl: null,
    };
    const sameGuidA = { ...base, candidateId: "sha256:guid-a", guid: "release-1" };
    const sameGuidB = { ...base, sourceId: "two", candidateId: "sha256:guid-b", guid: "release-1" };
    const sameCanonicalUrlA = { ...base, candidateId: "sha256:url-a" };
    const sameCanonicalUrlB = { ...base, sourceId: "two", candidateId: "sha256:url-b" };
    const sameOfficialLandingA = {
      ...base,
      candidateId: "sha256:landing-a",
      canonicalUrl: "https://media.example.com/a",
      officialLandingUrl: "https://official.example.com/release",
    };
    const sameOfficialLandingB = {
      ...base,
      candidateId: "sha256:landing-b",
      canonicalUrl: "https://other.example.com/b",
      officialLandingUrl: "https://official.example.com/release#top",
    };
    const versionFive = {
      ...base,
      candidateId: "sha256:v5",
      canonicalUrl: "https://official.example.com/v5",
    };
    const versionSix = {
      ...base,
      candidateId: "sha256:v6",
      canonicalUrl: "https://official.example.com/v6",
    };

    expect(collector.clusterDeterministicCandidates([sameGuidA, sameGuidB])).toHaveLength(1);
    expect(collector.clusterDeterministicCandidates([sameCanonicalUrlA, sameCanonicalUrlB])).toHaveLength(1);
    expect(collector.clusterDeterministicCandidates([sameOfficialLandingA, sameOfficialLandingB])).toHaveLength(1);
    expect(collector.clusterDeterministicCandidates([versionFive, versionSix])).toHaveLength(2);
  });

  it("marks incomplete feed history without guessing coverage", () => {
    const complete = [
      { effectiveAt: "2026-07-12T00:00:00.000Z" },
      { effectiveAt: "2026-07-14T00:00:00.000Z" },
    ];
    const partial = [{ effectiveAt: "2026-07-14T00:00:00.000Z" }];

    expect(collector.computeWindowCoverage(complete, "2026-07-13T00:00:00.000Z", 100)).toMatchObject({
      windowCoverage: "complete",
      oldestVisibleAt: "2026-07-12T00:00:00.000Z",
    });
    expect(collector.computeWindowCoverage(partial, "2026-07-13T00:00:00.000Z", 100).windowCoverage).toBe(
      "partial",
    );
    expect(collector.computeWindowCoverage([{ effectiveAt: null }], "2026-07-13T00:00:00.000Z", 100).windowCoverage).toBe(
      "partial",
    );
    expect(collector.computeWindowCoverage([], "2026-07-13T00:00:00.000Z", 100).windowCoverage).toBe("unknown");
    expect(
      collector.computeWindowCoverage(
        Array.from({ length: 100 }, (_, index) => ({ effectiveAt: `2026-07-14T00:00:${String(index % 60).padStart(2, "0")}.000Z` })),
        "2026-07-13T00:00:00.000Z",
        100,
      ).windowCoverage,
    ).toBe("partial");
  });

  it("sorts ascending feeds by newest time before retaining 100 items", () => {
    const items = Array.from({ length: 105 }, (_, index) => ({
      title: `Entry ${index}`,
      publishedAt: new Date(Date.UTC(2026, 6, 1) + index * 60_000).toUTCString(),
    }));
    const parsed = collector.parseFeedXmlWithMetadata(buildRss(items), rssSource, { maxItems: 100 });

    expect(parsed).toMatchObject({ rawItemCount: 105, itemLimitReached: true });
    expect(parsed.items).toHaveLength(100);
    expect(parsed.items[0].title).toBe("Entry 104");
    expect(parsed.items[99].title).toBe("Entry 5");
  });

  it("keeps raw Feed truncation partial after keyword filtering", async () => {
    const items = Array.from({ length: 100 }, (_, index) => ({
      title: index >= 98 ? `Keep ${index}` : `Other ${index}`,
      publishedAt: new Date(Date.UTC(2026, 6, 14) + index * 60_000).toUTCString(),
    }));
    const result = await collector.collectSingleFeed(
      { ...rssSource, filterKeywords: ["keep"] },
      {
        window: { windowStart: "2026-07-01T00:00:00.000Z", windowEnd: "2026-07-15T00:00:00.000Z" },
        cacheRoot: path.join(tempRoot, "cache"),
        limits,
      },
      {
        fetchSourceXmlImpl: async () => ({ statusCode: 200, fromCache: false, xml: buildRss(items) }),
      },
    );

    expect(result).toMatchObject({ rawItemCount: 100, itemLimitReached: true, windowCoverage: "partial" });
    expect(result.candidates).toHaveLength(2);
  });
});

describe("AI briefing feed network safety and cache", () => {
  it("rejects non-HTTPS, IP literals, and private DNS answers", async () => {
    await expect(
      collector.fetchSourceXml({ ...rssSource, url: "http://feed.example.com/rss.xml" }, null, { limits }),
    ).rejects.toThrow("只允许 HTTPS");
    await expect(
      collector.fetchSourceXml({ ...rssSource, url: "https://127.0.0.1/rss.xml" }, null, { limits }),
    ).rejects.toThrow("IP literal");
    await expect(
      collector.fetchSourceXml(rssSource, null, {
        limits,
        resolveHost: async () => [{ address: "10.0.0.1", family: 4 }],
      }),
    ).rejects.toThrow("解析到非公网地址");
    for (const address of ["::ffff:7f00:1", "::ffff:a00:1", "2002:7f00:1::", "64:ff9b::7f00:1"]) {
      expect(collector.isPublicIp(address), address).toBe(false);
    }
  });

  it("applies the per-hop timeout to DNS resolution", async () => {
    await expect(
      collector.fetchSourceXml(rssSource, null, {
        limits: { ...limits, timeoutMs: 10 },
        resolveHost: () => new Promise(() => {}),
      }),
    ).rejects.toThrow("请求超时");
  });

  it("binds the validated DNS address to the actual HTTPS request", async () => {
    const invocations: Array<Record<string, unknown>> = [];
    const requestImpl = createRequestImpl(
      [{ statusCode: 200, body: readFixture("rss.xml"), headers: { etag: '"v1"' } }],
      invocations,
    );

    await collector.fetchSourceXml(rssSource, null, {
      limits,
      resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
      requestImpl,
    });

    const lookup = invocations[0].lookup as (
      hostname: string,
      options: Record<string, unknown>,
      callback: (error: null, address: string, family: number) => void,
    ) => void;
    const callback = vi.fn();
    lookup("feed.example.com", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);

    const allCallback = vi.fn();
    lookup("feed.example.com", { all: true }, allCallback);
    expect(allCallback).toHaveBeenCalledWith(null, [{ address: "93.184.216.34", family: 4 }]);
  });

  it("revalidates every redirect and refuses a private second hop", async () => {
    const invocations: Array<Record<string, unknown>> = [];
    const requestImpl = createRequestImpl(
      [{ statusCode: 302, headers: { location: "https://cdn.example.com/rss.xml" } }],
      invocations,
    );
    const resolveHost = vi.fn(async (hostname: string) =>
      hostname === "feed.example.com"
        ? [{ address: "93.184.216.34", family: 4 }]
        : [{ address: "192.168.1.4", family: 4 }],
    );

    await expect(collector.fetchSourceXml(rssSource, null, { limits, resolveHost, requestImpl })).rejects.toThrow(
      "解析到非公网地址",
    );
    expect(resolveHost).toHaveBeenCalledTimes(2);
    expect(invocations).toHaveLength(1);
  });

  it("rejects unauthorized redirects and oversized responses", async () => {
    const redirectRequests: Array<Record<string, unknown>> = [];
    await expect(
      collector.fetchSourceXml(rssSource, null, {
        limits,
        resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
        requestImpl: createRequestImpl(
          [{ statusCode: 302, headers: { location: "https://evil.example.com/rss.xml" } }],
          redirectRequests,
        ),
      }),
    ).rejects.toThrow("重定向目标不在白名单");

    const response = createResponse(200, "x".repeat(2048));
    const request = { destroy: vi.fn() };
    await expect(collector.readResponseBody(response, 1024, request)).rejects.toThrow("响应体超过 1024 字节");
    expect(request.destroy).toHaveBeenCalled();
  });

  it("destroys a redirect response without waiting for its body to end", async () => {
    const redirectResponse = new EventEmitter() as EventEmitter & {
      statusCode: number;
      headers: Record<string, string>;
      destroy: ReturnType<typeof vi.fn>;
    };
    redirectResponse.statusCode = 302;
    redirectResponse.headers = { location: "https://cdn.example.com/rss.xml" };
    redirectResponse.destroy = vi.fn();
    let call = 0;
    const requestImpl = (_options: Record<string, unknown>, callback: (response: any) => void) => {
      const request = new EventEmitter() as EventEmitter & { end: () => void; destroy: (error?: Error) => void };
      request.destroy = (error?: Error) => queueMicrotask(() => request.emit("error", error));
      request.end = () => {
        call += 1;
        queueMicrotask(() => callback(call === 1 ? redirectResponse : createResponse(200, readFixture("rss.xml"))));
      };
      return request;
    };

    await expect(
      collector.fetchSourceXml(rssSource, null, {
        limits,
        resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
        requestImpl,
      }),
    ).resolves.toMatchObject({ statusCode: 200 });
    expect(redirectResponse.destroy).toHaveBeenCalledOnce();
  });

  it("aborts requests that exceed the configured timeout", async () => {
    const requestImpl = () => {
      const request = new EventEmitter() as EventEmitter & {
        end: () => void;
        destroy: (error?: Error) => void;
        setTimeout: (milliseconds: number, callback: () => void) => void;
      };
      request.end = () => {};
      request.setTimeout = (_milliseconds, callback) => setTimeout(callback, 5);
      request.destroy = (error?: Error) => queueMicrotask(() => request.emit("error", error));
      return request;
    };

    await expect(
      collector.fetchSourceXml(rssSource, null, {
        limits: { ...limits, timeoutMs: 10 },
        resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
        requestImpl,
      }),
    ).rejects.toThrow("请求超时");
  });

  it("uses 304 cache and rejects 304 without cached items", async () => {
    const deps = {
      limits,
      resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
      requestImpl: createRequestImpl([{ statusCode: 304 }], []),
    };
    const cachedItems = collector.parseFeedXml(readFixture("rss.xml"), rssSource);

    await expect(collector.fetchSourceXml(rssSource, null, deps)).rejects.toThrow("304 但没有可用缓存");
    await expect(
      collector.fetchSourceXml(rssSource, { etag: '"v1"', items: cachedItems }, {
        ...deps,
        requestImpl: createRequestImpl([{ statusCode: 304 }], []),
      }),
    ).resolves.toMatchObject({
      statusCode: 304,
      fromCache: true,
      items: cachedItems,
      rawItemCount: null,
      itemLimitReached: true,
    });
  });

  it("keeps a successful cache when a later fetch fails", async () => {
    const cacheRoot = path.join(tempRoot, "cache");
    const window = {
      windowStart: "2026-07-13T00:00:00.000Z",
      windowEnd: "2026-07-15T00:00:00.000Z",
    };
    await collector.collectSingleFeed(
      rssSource,
      { window, cacheRoot, limits },
      {
        fetchSourceXmlImpl: async () => ({
          statusCode: 200,
          fromCache: false,
          xml: readFixture("rss.xml"),
          etag: '"v1"',
          lastModified: "Tue, 14 Jul 2026 01:00:00 GMT",
        }),
      },
    );
    const cachePath = path.join(cacheRoot, `${rssSource.id}.json`);
    const originalCache = fs.readFileSync(cachePath, "utf8");
    expect(JSON.parse(originalCache)).toMatchObject({ rawItemCount: 2, itemLimitReached: false });

    await expect(
      collector.collectSingleFeed(
        rssSource,
        { window, cacheRoot, limits },
        { fetchSourceXmlImpl: async () => Promise.reject(new Error("network down")) },
      ),
    ).rejects.toThrow("network down");
    expect(fs.readFileSync(cachePath, "utf8")).toBe(originalCache);
  });

  it("isolates a failed source with Promise.allSettled", async () => {
    const result = await collector.collectFeedSources(
      {
        sources: [rssSource, { ...atomSource, url: "https://feed.example.com/atom.xml" }],
        window: {
          windowStart: "2026-07-13T00:00:00.000Z",
          windowEnd: "2026-07-15T00:00:00.000Z",
        },
        cacheRoot: path.join(tempRoot, "cache"),
        limits,
      },
      {
        fetchSourceXmlImpl: async (source: Source) => {
          if (source.id === rssSource.id) throw new Error("rss failed");
          return { statusCode: 200, fromCache: false, xml: readFixture("atom.xml") };
        },
      },
    );

    expect(result.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: rssSource.id, status: "failed" }),
        expect.objectContaining({ sourceId: atomSource.id, status: "success" }),
      ]),
    );
  });
});
