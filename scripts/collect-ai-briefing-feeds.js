#!/usr/bin/env node

const crypto = require("node:crypto");
const dns = require("node:dns");
const fs = require("node:fs");
const https = require("node:https");
const net = require("node:net");
const path = require("node:path");
const { siteRequire } = require("./site-require");
const { loadAiBriefingSkillConfig } = require("./briefing-skill-config");

const { XMLParser, XMLValidator } = siteRequire("fast-xml-parser");
const TRACKING_PARAMETERS = new Set(["fbclid", "gclid", "mc_cid", "mc_eid"]);

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function getText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") return getText(value["#text"] ?? value.text ?? value._);
  return "";
}

function sanitizeText(value, maxLength = 2000) {
  return getText(value)
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeUrl(value) {
  if (!value) return null;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  parsed.hash = "";
  for (const key of [...parsed.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMETERS.has(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }
  return parsed.toString();
}

function normalizeTimestamp(value) {
  const text = sanitizeText(value, 200);
  if (!text || !/(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC)$/i.test(text)) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formatDateInTimezone(value, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function classifySourceTime(value, sourceTimezone) {
  const text = sanitizeText(value, 200);
  if (!text) return { timePrecision: "unknown", sourceTimezone };
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return { timePrecision: "date", sourceDate: text, sourceTimezone };
  }
  const eventAt = normalizeTimestamp(text);
  if (!eventAt) return { timePrecision: "unknown", sourceTimezone };
  return {
    timePrecision: "timestamp",
    eventAt,
    eventDate: formatDateInTimezone(eventAt, "Asia/Shanghai"),
    sourceTimezone,
  };
}

function extractAtomLink(item) {
  const links = asArray(item.link);
  const alternate = links.find((link) => typeof link === "object" && (!link["@_rel"] || link["@_rel"] === "alternate"));
  const selected = alternate || links[0];
  if (typeof selected === "string") return selected;
  return selected?.["@_href"] || selected?.href || getText(selected);
}

function normalizeFeedItem(item, source) {
  const isAtom = source.format === "atom" || item.id !== undefined || asArray(item.link).some((link) => link?.["@_href"]);
  const title = sanitizeText(item.title, 500);
  const rawUrl = isAtom ? extractAtomLink(item) : getText(item.link);
  const canonicalUrl = normalizeUrl(rawUrl);
  const guid = sanitizeText(isAtom ? item.id : item.guid, 1000) || null;
  const publishedTime = classifySourceTime(item.published ?? item.pubDate ?? item.date, source.sourceTimezone);
  const updatedAt = normalizeTimestamp(item.updated ?? item.lastBuildDate);
  const summary = sanitizeText(item.summary ?? item.description ?? item.content, 4000);
  const author = sanitizeText(item.author?.name ?? item.author ?? item.creator, 500) || null;
  const officialLandingUrl = normalizeUrl(
    item.officialLandingUrl ?? item.official_link ?? item["official-landing-url"],
  );
  const sourceItemIdentity = guid || canonicalUrl || `${title}\n${publishedTime.eventAt || publishedTime.sourceDate || ""}`;
  const contentHash = sha256(JSON.stringify({ title, canonicalUrl, publishedTime, updatedAt, summary, author }));

  return {
    candidateId: sha256(`${source.id}\n${sourceItemIdentity}`),
    sourceId: source.id,
    companyId: source.companyId,
    title,
    canonicalUrl,
    officialLandingUrl,
    guid,
    publishedAt: publishedTime.eventAt || null,
    updatedAt,
    ...publishedTime,
    authority: source.authority,
    confirmationPolicy: source.confirmationPolicy,
    summary,
    author,
    contentHash,
  };
}

function parseFeedXmlWithMetadata(xml, source, options = {}) {
  if (typeof xml !== "string") throw new Error("Feed XML 必须是字符串");
  if (/<!DOCTYPE/i.test(xml)) throw new Error(`Feed ${source.id} 包含禁止的 DOCTYPE`);
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error(`Feed ${source.id} XML 非法：${validation.err?.msg || "unknown error"}`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
    processEntities: false,
    htmlEntities: false,
    maxNestedTags: 50,
    strictReservedNames: true,
  });
  const parsed = parser.parse(xml);
  const rawItems = asArray(parsed.rss?.channel?.item ?? parsed.feed?.entry ?? []);
  const maxItems = options.maxItems ?? Number.POSITIVE_INFINITY;
  const normalized = rawItems.map((item, index) => ({ candidate: normalizeFeedItem(item, source), index }));
  normalized.sort((left, right) => {
    const leftTime = left.candidate.eventAt
      ? new Date(left.candidate.eventAt).getTime()
      : left.candidate.sourceDate
        ? new Date(`${left.candidate.sourceDate}T00:00:00Z`).getTime()
        : Number.NEGATIVE_INFINITY;
    const rightTime = right.candidate.eventAt
      ? new Date(right.candidate.eventAt).getTime()
      : right.candidate.sourceDate
        ? new Date(`${right.candidate.sourceDate}T00:00:00Z`).getTime()
        : Number.NEGATIVE_INFINITY;
    return rightTime - leftTime || left.index - right.index;
  });
  const rawItemCount = normalized.length;
  const itemLimitReached = Number.isFinite(maxItems) && rawItemCount >= maxItems;
  const rejectedItems = [];
  let candidates = [];

  for (const { candidate, index } of normalized.slice(0, maxItems)) {
    let reasonCode = null;
    let reason = null;
    if (!candidate.title) {
      reasonCode = "missing-title";
      reason = "候选缺少标题";
    } else if (!candidate.canonicalUrl) {
      reasonCode = "missing-url";
      reason = "候选缺少可验证 URL";
    } else if (candidate.timePrecision === "unknown") {
      reasonCode = "unknown-time";
      reason = "候选缺少可比较的发布时间";
    }
    if (reasonCode) {
      rejectedItems.push({
        sourceId: source.id,
        itemIdentity: candidate.guid || candidate.candidateId || `item-${index}`,
        reasonCode,
        reason,
      });
    } else {
      candidates.push(candidate);
    }
  }

  if (Array.isArray(source.filterKeywords) && source.filterKeywords.length > 0) {
    const keywords = source.filterKeywords.map((keyword) => keyword.toLowerCase());
    candidates = candidates.filter((candidate) => {
      const text = `${candidate.title} ${candidate.summary}`.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    });
  }

  return { items: candidates, rejectedItems, rawItemCount, itemLimitReached };
}

function parseFeedXml(xml, source, options = {}) {
  return parseFeedXmlWithMetadata(xml, source, options).items;
}

function getDeterministicClusterKeys(candidate) {
  const keys = [];
  if (candidate.guid) keys.push(`guid:${candidate.guid}`);
  const canonicalUrl = normalizeUrl(candidate.canonicalUrl);
  if (canonicalUrl) keys.push(`url:${canonicalUrl}`);
  const officialLandingUrl = normalizeUrl(candidate.officialLandingUrl);
  if (officialLandingUrl) keys.push(`official:${officialLandingUrl}`);
  return keys;
}

function clusterDeterministicCandidates(candidates) {
  const parents = candidates.map((_, index) => index);
  const find = (index) => {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };
  const ownerByKey = new Map();

  candidates.forEach((candidate, index) => {
    for (const key of getDeterministicClusterKeys(candidate)) {
      if (ownerByKey.has(key)) union(index, ownerByKey.get(key));
      else ownerByKey.set(key, index);
    }
  });

  const groups = new Map();
  candidates.forEach((candidate, index) => {
    const root = find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(candidate);
  });

  return [...groups.values()].map((items) => {
    const deterministicKeys = [...new Set(items.flatMap(getDeterministicClusterKeys))].sort();
    return {
      clusterId: sha256(deterministicKeys.join("\n") || items.map((item) => item.candidateId).sort().join("\n")),
      candidateIds: items.map((item) => item.candidateId),
      deterministicKeys,
      candidates: items,
    };
  });
}

function parseIpv6Hextets(address) {
  const normalized = address.toLowerCase().split("%")[0];
  const halves = normalized.split("::");
  if (halves.length > 2) return null;
  const parseHalf = (value) => {
    if (!value) return [];
    const tokens = value.split(":");
    const result = [];
    for (const token of tokens) {
      if (token.includes(".")) {
        if (net.isIP(token) !== 4) return null;
        const octets = token.split(".").map(Number);
        result.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
      } else if (/^[0-9a-f]{1,4}$/.test(token)) {
        result.push(Number.parseInt(token, 16));
      } else {
        return null;
      }
    }
    return result;
  };
  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] || "");
  if (!left || !right) return null;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  return [...left, ...Array(missing).fill(0), ...right];
}

function embeddedIpv4Address(hextets) {
  const value = (hextets[6] << 16) | hextets[7];
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}

function isPublicIp(address, trustFakeIpRange = false) {
  const family = net.isIP(address);
  if (family === 4) {
    const octets = address.split(".").map(Number);
    const [first, second] = octets;
    if (first === 0 || first === 10 || first === 127 || first >= 224) return false;
    if (first === 100 && second >= 64 && second <= 127) return false;
    if (first === 169 && second === 254) return false;
    if (first === 172 && second >= 16 && second <= 31) return false;
    if (first === 192 && [0, 2, 168].includes(second)) return false;
    if (first === 198 && second === 51) return false;
    if (first === 198 && (second === 18 || second === 19)) return trustFakeIpRange;
    if (first === 203 && second === 0) return false;
    return true;
  }
  if (family === 6) {
    const hextets = parseIpv6Hextets(address);
    if (!hextets) return false;
    const [a, b, c, d, e, f] = hextets;
    if (hextets.every((value) => value === 0) || hextets.slice(0, 7).every((value) => value === 0)) return false;
    if ((a & 0xfe00) === 0xfc00 || (a & 0xffc0) === 0xfe80 || (a & 0xff00) === 0xff00) return false;

    const compatibleOrMapped = a === 0 && b === 0 && c === 0 && d === 0 && e === 0 && (f === 0 || f === 0xffff);
    if (compatibleOrMapped) return isPublicIp(embeddedIpv4Address(hextets), trustFakeIpRange);

    // Reject well-known transition, translation, documentation, benchmarking, and discard-only ranges.
    if (a === 0x0064 && b === 0xff9b) return false;
    if (a === 0x0100 && b === 0 && c === 0 && d === 0) return false;
    if (a === 0x2002) return false;
    if (a === 0x2001 && b === 0) return false;
    if (a === 0x2001 && b === 2) return false;
    if (a === 0x2001 && ((b & 0xfff0) === 0x0010 || (b & 0xfff0) === 0x0020)) return false;
    if (a === 0x2001 && b === 0x0db8) return false;
    if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0xffff && f === 0) return false;
    return true;
  }
  return false;
}

function validateRequestUrl(value, source, isRedirect) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`非法 Feed URL：${value}`);
  }
  if (url.protocol !== "https:") throw new Error(`只允许 HTTPS：${value}`);
  if (url.username || url.password) throw new Error(`Feed URL 不允许携带凭据：${value}`);
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (net.isIP(hostname)) throw new Error(`Feed URL 不允许 IP literal：${value}`);
  if (hostname === "localhost" || hostname.endsWith(".localhost")) throw new Error(`Feed URL 不允许 localhost：${value}`);
  const allowedHosts = new Set((source.allowedRedirectHosts || []).map((host) => host.toLowerCase()));
  if (!allowedHosts.has(hostname)) {
    throw new Error(`${isRedirect ? "重定向目标" : "Feed 目标"}不在白名单：${hostname}`);
  }
  return url;
}

async function resolvePublicAddress(hostname, resolveHost, trustFakeIpRange = false) {
  const resolved = await resolveHost(hostname, { all: true, verbatim: true });
  const entries = asArray(resolved).map((entry) =>
    typeof entry === "string" ? { address: entry, family: net.isIP(entry) } : entry,
  );
  if (entries.length === 0) throw new Error(`DNS 未返回地址：${hostname}`);
  const publicEntries = entries.filter((entry) => isPublicIp(entry.address, trustFakeIpRange));
  if (publicEntries.length === 0) {
    throw new Error(`主机 ${hostname} 解析到非公网地址`);
  }
  return publicEntries[0];
}

function readResponseBody(response, maxBytes, request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    response.on("data", (chunk) => {
      if (settled) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > maxBytes) {
        const error = new Error(`Feed 响应体超过 ${maxBytes} 字节`);
        fail(error);
        response.destroy?.(error);
        request?.destroy?.(error);
        return;
      }
      chunks.push(buffer);
    });
    response.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    response.on("error", fail);
    response.on("aborted", () => fail(new Error("Feed 响应体读取中止")));
    response.on("close", () => {
      if (!settled) fail(new Error("Feed 响应体未完整结束"));
    });
  });
}

function discardResponse(response) {
  response.on?.("error", () => {});
  if (typeof response.destroy === "function") response.destroy();
  else response.resume?.();
}

function getHeader(headers, name) {
  const value = headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value || null;
}

async function fetchSourceXml(source, cacheEntry, dependencies = {}) {
  const resolveHost = dependencies.resolveHost || dns.promises.lookup;
  const requestImpl = dependencies.requestImpl || https.request;
  const limits = dependencies.limits;
  const trustFakeIpRange = dependencies.trustFakeIpRange === true;
  if (!limits) throw new Error("缺少 Feed 网络限制配置");

  async function requestUrl(value, redirectCount, isRedirect) {
    if (redirectCount > limits.maxRedirects) throw new Error(`Feed 重定向超过 ${limits.maxRedirects} 次`);
    const url = validateRequestUrl(value, source, isRedirect);

    return new Promise((resolve, reject) => {
      let request;
      let response;
      let settled = false;
      let timer;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        callback(value);
      };
      const fail = (error) => finish(reject, error);
      timer = setTimeout(() => {
        const error = new Error(`Feed 请求超时：${source.id}`);
        fail(error);
        response?.destroy?.(error);
        request?.destroy?.(error);
      }, limits.timeoutMs);

      Promise.resolve()
        .then(async () => {
          const selectedAddress = await resolvePublicAddress(url.hostname, resolveHost, trustFakeIpRange);
          if (settled) return;
          const lookup = (_hostname, options, callback) => {
            const done = typeof options === "function" ? options : callback;
            if (typeof options === "object" && options?.all) {
              done(null, [{ address: selectedAddress.address, family: selectedAddress.family }]);
            } else {
              done(null, selectedAddress.address, selectedAddress.family);
            }
          };
          const headers = {
            Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
            "User-Agent": "yuanshenjian-ai-briefing-feed-collector/1.0",
          };
          if (cacheEntry?.etag) headers["If-None-Match"] = cacheEntry.etag;
          if (cacheEntry?.lastModified) headers["If-Modified-Since"] = cacheEntry.lastModified;

          request = requestImpl(
            {
              protocol: "https:",
              hostname: url.hostname,
              port: url.port || 443,
              path: `${url.pathname}${url.search}`,
              method: "GET",
              headers,
              servername: url.hostname,
              lookup,
            },
            (incomingResponse) => {
              response = incomingResponse;
              if (settled) {
                discardResponse(response);
                return;
              }
              const statusCode = response.statusCode || 0;
              if (statusCode === 304) {
                discardResponse(response);
                if (!cacheEntry || !Array.isArray(cacheEntry.items)) {
                  fail(new Error(`Feed ${source.id} 返回 304 但没有可用缓存`));
                  return;
                }
                finish(resolve, {
                  statusCode,
                  fromCache: true,
                  items: cacheEntry.items,
                  rawItemCount: Number.isInteger(cacheEntry.rawItemCount) ? cacheEntry.rawItemCount : null,
                  itemLimitReached:
                    typeof cacheEntry.itemLimitReached === "boolean" ? cacheEntry.itemLimitReached : true,
                  etag: cacheEntry.etag || null,
                  lastModified: cacheEntry.lastModified || null,
                  finalUrl: url.toString(),
                });
                return;
              }
              if (statusCode >= 300 && statusCode < 400) {
                const location = getHeader(response.headers, "location");
                discardResponse(response);
                if (!location) {
                  fail(new Error(`Feed 重定向缺少 Location：${source.id}`));
                  return;
                }
                let redirected;
                try {
                  redirected = new URL(location, url).toString();
                } catch (error) {
                  fail(error);
                  return;
                }
                finish(resolve, requestUrl(redirected, redirectCount + 1, true));
                return;
              }
              if (statusCode !== 200) {
                discardResponse(response);
                fail(new Error(`Feed ${source.id} 返回 HTTP ${statusCode}`));
                return;
              }
              readResponseBody(response, limits.maxResponseBytes, request)
                .then((xml) =>
                  finish(resolve, {
                    statusCode,
                    fromCache: false,
                    xml,
                    etag: getHeader(response.headers, "etag"),
                    lastModified: getHeader(response.headers, "last-modified"),
                    finalUrl: url.toString(),
                  }),
                )
                .catch(fail);
            },
          );
          request.on("error", fail);
          request.end();
        })
        .catch(fail);
    });
  }

  return requestUrl(source.url, 0, false);
}

function computeWindowCoverage(candidates, coverageStartDate, maxItemsPerFeed, metadata = {}) {
  const comparable = candidates.map((candidate) => candidate.eventDate || candidate.sourceDate).filter(Boolean);
  const oldestVisibleDate = comparable.length > 0 ? comparable.sort()[0] : null;
  const itemLimitReached = metadata.itemLimitReached ?? candidates.length >= maxItemsPerFeed;
  if (itemLimitReached || comparable.length !== candidates.length) {
    return { windowCoverage: "partial", oldestVisibleDate };
  }
  if (candidates.length === 0) return { windowCoverage: "unknown", oldestVisibleDate: null };
  return {
    windowCoverage: oldestVisibleDate <= coverageStartDate ? "complete" : "partial",
    oldestVisibleDate,
  };
}

function readCache(cachePath) {
  if (!fs.existsSync(cachePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cachePath, "utf8"));
  } catch {
    return null;
  }
}

function writeCache(cachePath, value) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  const temporaryPath = `${cachePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporaryPath, cachePath);
}

async function collectSingleFeed(source, input, dependencies = {}) {
  const checkedAt = new Date().toISOString();
  const cachePath = path.join(input.cacheRoot, `${source.id}.json`);
  const cacheEntry = readCache(cachePath);
  const fetchSourceXmlImpl = dependencies.fetchSourceXmlImpl || fetchSourceXml;
  const fetched = await fetchSourceXmlImpl(source, cacheEntry, {
    ...dependencies,
    limits: input.limits,
  });
  const parsed = fetched.fromCache
    ? {
        items: fetched.items,
        rejectedItems: fetched.rejectedItems || [],
        rawItemCount: Number.isInteger(fetched.rawItemCount) ? fetched.rawItemCount : null,
        itemLimitReached: typeof fetched.itemLimitReached === "boolean" ? fetched.itemLimitReached : true,
      }
    : parseFeedXmlWithMetadata(fetched.xml, source, { maxItems: input.limits.maxItemsPerFeed });
  const candidates = parsed.items.map((candidate) => ({
    ...candidate,
    withinWindow:
      candidate.timePrecision === "timestamp"
        ? candidate.eventAt <= input.window.observedAt &&
          candidate.eventDate >= input.window.coverageStartDate &&
          candidate.eventDate <= input.window.coverageEndDate
        : candidate.timePrecision === "date"
          ? candidate.sourceDate >= input.window.coverageStartDate &&
            candidate.sourceDate <= input.window.coverageEndDate
          : false,
  }));
  const coverage = computeWindowCoverage(
    candidates,
    input.window.coverageStartDate,
    input.limits.maxItemsPerFeed,
    parsed,
  );

  if (!fetched.fromCache) {
    writeCache(cachePath, {
      etag: fetched.etag || null,
      lastModified: fetched.lastModified || null,
      lastSuccessAt: checkedAt,
      rawItemCount: parsed.rawItemCount,
      itemLimitReached: parsed.itemLimitReached,
      items: parsed.items,
      rejectedItems: parsed.rejectedItems,
      itemIds: parsed.items.map((candidate) => ({
        candidateId: candidate.candidateId,
        contentHash: candidate.contentHash,
      })),
    });
  }

  return {
    sourceId: source.id,
    companyId: source.companyId,
    status: "success",
    checkedAt,
    error: null,
    ...coverage,
    fromCache: Boolean(fetched.fromCache),
    rawItemCount: parsed.rawItemCount,
    itemLimitReached: parsed.itemLimitReached,
    rejectedItems: parsed.rejectedItems,
    candidates,
  };
}

async function collectFeedSources(input, dependencies = {}) {
  const sources = input.sources.filter(
    (source) => source.enabled && (source.method === "feed" || source.method === "github-release"),
  );
  const settledResults = new Array(sources.length);
  let cursor = 0;
  const workerCount = Math.min(input.limits.concurrency, sources.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < sources.length) {
      const index = cursor;
      cursor += 1;
      try {
        settledResults[index] = { status: "fulfilled", value: await collectSingleFeed(sources[index], input, dependencies) };
      } catch (error) {
        settledResults[index] = { status: "rejected", reason: error };
      }
    }
  });
  await Promise.allSettled(workers);

  const results = settledResults.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      sourceId: sources[index].id,
      companyId: sources[index].companyId,
      status: "failed",
      checkedAt: new Date().toISOString(),
      error: result.reason?.message || String(result.reason),
      windowCoverage: "unknown",
      oldestVisibleDate: null,
      fromCache: false,
      rawItemCount: null,
      itemLimitReached: false,
      rejectedItems: [],
      candidates: [],
    };
  });
  const candidates = results.flatMap((result) => result.candidates);

  return {
    generatedAt: new Date().toISOString(),
    coverageStartDate: input.window.coverageStartDate,
    coverageEndDate: input.window.coverageEndDate,
    observedAt: input.window.observedAt,
    sources: results,
    candidates,
    clusters: clusterDeterministicCandidates(candidates),
    summary: {
      sourceCount: results.length,
      successCount: results.filter((result) => result.status === "success").length,
      failureCount: results.filter((result) => result.status === "failed").length,
      candidateCount: candidates.length,
      rejectedItemCount: results.reduce((total, result) => total + result.rejectedItems.length, 0),
    },
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--health-check") {
      args.healthCheck = true;
      continue;
    }
    if (!argument.startsWith("--")) throw new Error(`未知参数：${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`参数缺少值：${argument}`);
    args[argument.slice(2)] = value;
    index += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadAiBriefingSkillConfig();
  const cacheRoot = path.resolve(args["cache-root"] || config.briefing.feedCacheRoot);
  let window;
  if (args.healthCheck) {
    const observedAt = new Date();
    const coverageEndDate = formatDateInTimezone(observedAt, "Asia/Shanghai");
    const coverageStartDate = new Date(`${coverageEndDate}T00:00:00Z`);
    coverageStartDate.setUTCDate(coverageStartDate.getUTCDate() - 1);
    window = {
      coverageStartDate: coverageStartDate.toISOString().slice(0, 10),
      coverageEndDate,
      observedAt: observedAt.toISOString(),
    };
  } else {
    if (!args["window-file"] || !args.output) throw new Error("常规采集需要 --window-file 和 --output");
    window = JSON.parse(fs.readFileSync(path.resolve(args["window-file"]), "utf8"));
  }

  const trustFakeIpRange = process.env.AI_BRIEFING_TRUST_FAKE_IP_RANGE === "1";
  const collection = await collectFeedSources(
    {
      sources: config.sourceRegistry.sources,
      window,
      cacheRoot,
      limits: config.briefing.feedLimits,
    },
    { trustFakeIpRange },
  );

  if (args.healthCheck) {
    for (const source of collection.sources) {
      process.stdout.write(
        `${JSON.stringify({
          sourceId: source.sourceId,
          status: source.status,
          itemCount: source.candidates.length,
          rawItemCount: source.rawItemCount,
          itemLimitReached: source.itemLimitReached,
          oldestVisibleDate: source.oldestVisibleDate,
          rejectedItemCount: source.rejectedItems.length,
          error: source.error,
        })}\n`,
      );
    }
    if (collection.sources.some((source) => source.status !== "success" || source.candidates.length === 0)) {
      process.exitCode = 1;
    }
    return;
  }

  const output = path.resolve(args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(collection, null, 2)}\n`);
  process.stdout.write(
    `Feed 采集完成：${collection.summary.successCount}/${collection.summary.sourceCount} 成功，${collection.summary.candidateCount} 条候选，${collection.summary.rejectedItemCount} 条拒绝\n`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  asArray,
  collectFeedSources,
  collectSingleFeed,
  clusterDeterministicCandidates,
  computeWindowCoverage,
  fetchSourceXml,
  getDeterministicClusterKeys,
  isPublicIp,
  normalizeFeedItem,
  normalizeUrl,
  parseFeedXml,
  parseFeedXmlWithMetadata,
  readResponseBody,
  sanitizeText,
};
