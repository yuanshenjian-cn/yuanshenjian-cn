#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { loadAiBriefingSkillConfig } = require("./briefing-skill-config");

const AUTHORITY_LABELS = {
  official: "官方",
  "primary-record": "原始文件",
  media: "媒体报道",
};
const SOURCE_STATUSES = new Set(["success", "checked-empty", "degraded", "failed", "not-configured"]);
const WINDOW_COVERAGES = new Set(["complete", "partial", "unknown"]);
const DETERMINISTIC_METHODS = new Set(["feed", "github-release"]);

function parseClaudeOutput(input) {
  const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
  const extract = (value) => {
    if (value && typeof value === "object" && value.structured_output && typeof value.structured_output === "object") {
      return value.structured_output;
    }
    return null;
  };

  try {
    const result = extract(JSON.parse(text));
    if (result) return result;
  } catch {
    // stream-json is newline-delimited and is parsed below.
  }

  let finalResult = null;
  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === "result") finalResult = extract(event);
  }
  if (!finalResult) throw new Error("Claude 输出缺少 structured_output");
  return finalResult;
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`缺少必需字符串字段：${field}`);
}

function requireStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`字段 ${field} 必须是非空字符串数组`);
  }
}

function assertExactKeys(value, allowedKeys, label) {
  const unexpected = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unexpected.length > 0) throw new Error(`${label} 包含未允许字段：${unexpected.join(", ")}`);
}

function validateGeneratorResult(result, issueDate) {
  if (!result || typeof result !== "object") throw new Error("generator structured_output 必须是对象");
  requireString(result.status, "status");
  if (!["draft_ready", "no_events", "blocked", "failed"].includes(result.status)) {
    throw new Error(`未知 generator status：${result.status}`);
  }
  requireString(result.issueDate, "issueDate");
  if (result.issueDate !== issueDate) throw new Error(`generator issueDate 不匹配：${result.issueDate}`);

  if (result.status === "draft_ready") {
    assertExactKeys(
      result,
      [
        "status",
        "issueDate",
        "candidatePath",
        "selectionPath",
        "selfReviewPath",
        "coverageConclusion",
        "selfReviewConclusion",
      ],
      "draft_ready",
    );
    requireString(result.candidatePath, "candidatePath");
    requireString(result.selectionPath, "selectionPath");
    requireString(result.selfReviewPath, "selfReviewPath");
    if (!["sufficient", "degraded"].includes(result.coverageConclusion)) {
      throw new Error("draft_ready coverageConclusion 必须为 sufficient 或 degraded");
    }
    requireString(result.selfReviewConclusion, "selfReviewConclusion");
  } else if (result.status === "no_events") {
    assertExactKeys(
      result,
      ["status", "issueDate", "selectionPath", "selfReviewPath", "coverageConclusion", "reason"],
      "no_events",
    );
    requireString(result.selectionPath, "selectionPath");
    requireString(result.selfReviewPath, "selfReviewPath");
    if (result.coverageConclusion !== "sufficient") {
      throw new Error("no_events coverageConclusion 必须为 sufficient");
    }
    requireString(result.reason, "reason");
  } else if (result.status === "blocked") {
    assertExactKeys(result, ["status", "issueDate", "reason", "blockers"], "blocked");
    requireString(result.reason, "reason");
    requireStringArray(result.blockers, "blockers");
  } else {
    assertExactKeys(result, ["status", "issueDate", "reason"], "failed");
    requireString(result.reason, "reason");
  }
  return result;
}

function validateEvidenceQuality(value) {
  if (!value || typeof value !== "object") throw new Error("reviewer 缺少 evidenceQuality");
  assertExactKeys(value, ["authority", "authenticity", "timeliness"], "evidenceQuality");
  requireString(value.authority, "evidenceQuality.authority");
  requireString(value.authenticity, "evidenceQuality.authenticity");
  requireString(value.timeliness, "evidenceQuality.timeliness");
}

function validateReviewerResult(result) {
  if (!result || typeof result !== "object") throw new Error("reviewer structured_output 必须是对象");
  if (!["approved", "needs_changes", "blocked"].includes(result.status)) {
    throw new Error(`未知 reviewer status：${result.status}`);
  }
  if (!["online", "partial", "offline"].includes(result.networkStatus)) {
    throw new Error("reviewer networkStatus 不合法");
  }
  for (const field of ["checkedEvidenceIds", "uncheckedHighRiskItems"]) {
    if (!Array.isArray(result[field]) || result[field].some((item) => typeof item !== "string" || item.trim() === "")) {
      throw new Error(`reviewer ${field} 必须是字符串数组`);
    }
    if (new Set(result[field]).size !== result[field].length) throw new Error(`reviewer ${field} 包含重复项`);
  }
  validateEvidenceQuality(result.evidenceQuality);

  const common = [
    "status",
    "conclusion",
    "networkStatus",
    "checkedEvidenceIds",
    "uncheckedHighRiskItems",
    "evidenceQuality",
  ];
  if (result.status === "approved") {
    assertExactKeys(result, common, "approved");
    if (result.conclusion !== "可进入发布门禁") throw new Error("approved reviewer conclusion 必须为 可进入发布门禁");
    if (result.checkedEvidenceIds.length === 0) throw new Error("approved reviewer 必须包含 checkedEvidenceIds");
    if (result.uncheckedHighRiskItems.length > 0) throw new Error("approved reviewer 存在高风险未核验项");
  } else if (result.status === "needs_changes") {
    assertExactKeys(result, [...common, "blockers", "requiredChanges"], "needs_changes");
    if (result.conclusion !== "需修改后复审") throw new Error("needs_changes reviewer conclusion 必须为 需修改后复审");
    requireStringArray(result.blockers, "blockers");
    requireStringArray(result.requiredChanges, "requiredChanges");
  } else {
    assertExactKeys(result, [...common, "reason"], "blocked");
    if (result.conclusion !== "阻断发布") throw new Error("blocked reviewer conclusion 必须为 阻断发布");
    requireString(result.reason, "reason");
  }
  return result;
}

function resolveConfirmationPolicy(source, eventType) {
  return source.confirmationPolicy?.byCategory?.[eventType] ?? source.confirmationPolicy?.default;
}

function formatDateInTimezone(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`时间不合法：${value}`);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function calendarParts(dateText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error(`日期必须为 YYYY-MM-DD：${dateText}`);
  const [year, month, day] = dateText.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) {
    throw new Error(`日期不是合法日历日期：${dateText}`);
  }
  return { year, month, day };
}

function addCalendarDays(dateText, days) {
  const parts = calendarParts(dateText);
  const result = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, "0")}-${String(result.getUTCDate()).padStart(2, "0")}`;
}

function zonedDateTimeToUtc(parts, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const desiredAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const observed = Object.fromEntries(
      formatter.formatToParts(new Date(guess)).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]),
    );
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    guess += desiredAsUtc - observedAsUtc;
  }
  return new Date(guess + (parts.millisecond || 0));
}

function sourceLocalDateInterval(dateText, timeZone) {
  const startParts = calendarParts(dateText);
  const endParts = calendarParts(addCalendarDays(dateText, 1));
  const atMidnight = (parts) =>
    zonedDateTimeToUtc(
      { ...parts, hour: 0, minute: 0, second: 0, millisecond: 0 },
      timeZone,
    ).toISOString();
  return { start: atMidnight(startParts), end: atMidnight(endParts) };
}

function shanghaiCoverageInterval(coverageStartDate, observedAt) {
  requireIsoTimestamp(observedAt, "window.observedAt");
  return {
    start: sourceLocalDateInterval(coverageStartDate, "Asia/Shanghai").start,
    end: observedAt,
  };
}

function intervalsOverlap(left, right) {
  const leftStart = new Date(left.start).getTime();
  const leftEnd = new Date(left.end).getTime();
  const rightStart = new Date(right.start).getTime();
  const rightEnd = new Date(right.end).getTime();
  if ([leftStart, leftEnd, rightStart, rightEnd].some(Number.isNaN)) throw new Error("日期区间不合法");
  return leftStart < rightEnd && rightStart < leftEnd;
}

function resolveEvidenceDateRange(evidence, source) {
  if (evidence.timePrecision === "timestamp") {
    return {
      eventAt: evidence.eventAt,
      eventDate: evidence.eventDate || formatDateInTimezone(evidence.eventAt, "Asia/Shanghai"),
    };
  }
  if (evidence.timePrecision === "date") {
    return sourceLocalDateInterval(evidence.sourceDate, source.sourceTimezone);
  }
  return null;
}

function isEvidenceWithinCoverage(evidence, source, window) {
  const range = resolveEvidenceDateRange(evidence, source);
  if (!range) return false;
  if (range.eventAt) {
    requireIsoTimestamp(range.eventAt, "evidence.eventAt");
    return (
      range.eventAt <= window.observedAt &&
      range.eventDate >= window.coverageStartDate &&
      range.eventDate <= window.coverageEndDate
    );
  }
  return intervalsOverlap(range, shanghaiCoverageInterval(window.coverageStartDate, window.observedAt));
}

function isEvidenceEligibleForConfirmation(evidence, source, window) {
  if (source.authority === "media" && evidence.timePrecision === "date") return false;
  return isEvidenceWithinCoverage(evidence, source, window);
}

function getSource(sourceById, sourceId) {
  return sourceById instanceof Map ? sourceById.get(sourceId) : sourceById[sourceId];
}

function isConfirmedEvent(event, sourceById, window) {
  const resolved = event.sourceRefs.flatMap((ref) => {
    const source = getSource(sourceById, ref.sourceId);
    if (!source) return [];
    if (window && !isEvidenceEligibleForConfirmation(ref, source, window)) return [];
    if (!window && source.authority === "media" && ref.timePrecision === "date") return [];
    return [{ source, policy: resolveConfirmationPolicy(source, event.eventType) }];
  });
  if (resolved.some(({ policy }) => policy === "standalone")) return true;
  const independentPublishers = new Set(
    resolved.filter(({ policy }) => policy === "needs-corroboration").map(({ source }) => source.publisherId),
  );
  return independentPublishers.size >= 2;
}

function validatePublicSourceLabels(eventOrEvents, sourceById) {
  const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];
  for (const event of events) {
    for (const ref of event.sourceRefs || []) {
      const source = getSource(sourceById, ref.sourceId);
      if (!source) throw new Error(`未知 sourceId：${ref.sourceId}`);
      const expectedLabel = AUTHORITY_LABELS[source.authority];
      if (ref.label !== expectedLabel) {
        throw new Error(`来源标签与 authority 不一致：${ref.sourceId} 应为 ${expectedLabel}`);
      }
    }
  }
}

function requireFields(value, fields, label) {
  if (!value || typeof value !== "object") throw new Error(`${label} 必须是对象`);
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(value, field)) throw new Error(`${label} 缺少字段：${field}`);
  }
}

function requireIsoTimestamp(value, field) {
  requireString(value, field);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) throw new Error(`${field} 必须是合法 ISO 时间`);
}

function getEnabledRegistrySource(sourceRegistry, sourceId, label) {
  const source = (sourceRegistry?.sources || []).find((item) => item.id === sourceId);
  if (!source) throw new Error(`${label} 使用未知 sourceId：${sourceId}`);
  if (!source.enabled) throw new Error(`${label} 使用未启用 sourceId：${sourceId}`);
  return source;
}

function validateSourceCompany(companyId, source, label) {
  if (source.method === "search" && source.companyId === null) {
    requireString(companyId, `${label}.companyId`);
    return;
  }
  if (companyId !== source.companyId) {
    throw new Error(`${label} 的 companyId 与 registry 不一致：${source.id}`);
  }
}

function getAllowedSourceHosts(source) {
  const hosts = new Set((source.allowedArticleHosts || []).map((host) => host.toLowerCase()));
  if (source.method !== "search") {
    for (const host of source.allowedRedirectHosts || []) hosts.add(host.toLowerCase());
    if (source.url) {
      try {
        hosts.add(new URL(source.url).hostname.toLowerCase());
      } catch {
        throw new Error(`registry source ${source.id} URL 不合法`);
      }
    }
  }
  return hosts;
}

function validateSourceUrl(value, source, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} URL 不合法：${value}`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${label} URL 必须是无凭据 HTTPS：${value}`);
  }
  if (!getAllowedSourceHosts(source).has(url.hostname.toLowerCase())) {
    throw new Error(`${label} URL 主机不属于 source ${source.id}：${url.hostname}`);
  }
  url.hash = "";
  const normalized = url.toString();
  const allowedPrefixes = source.allowedUrlPrefixes || [];
  if (allowedPrefixes.length > 0 && !allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error(`${label} URL 不匹配 source ${source.id} 的允许前缀：${value}`);
  }
  return normalized;
}

function validateEvidenceTimeContract(evidence, source, window, label, { allowUnknown = false } = {}) {
  if (evidence.sourceTimezone !== source.sourceTimezone) {
    throw new Error(`${label} 的 sourceTimezone 与 registry 不一致`);
  }
  if (allowUnknown && evidence.timePrecision === "unknown") {
    if (evidence.withinWindow !== false) throw new Error(`${label} 的 unknown 时间字段不一致`);
    return false;
  }
  if (!["timestamp", "date"].includes(evidence.timePrecision)) {
    throw new Error(`${label} 的 timePrecision 不合法`);
  }
  if (evidence.timePrecision === "timestamp") {
    requireIsoTimestamp(evidence.eventAt, `${label}.eventAt`);
    requireString(evidence.eventDate, `${label}.eventDate`);
    calendarParts(evidence.eventDate);
    if (evidence.eventDate !== formatDateInTimezone(evidence.eventAt, "Asia/Shanghai")) {
      throw new Error(`${label}.eventDate 必须是 eventAt 的上海自然日`);
    }
  } else {
    requireString(evidence.sourceDate, `${label}.sourceDate`);
    calendarParts(evidence.sourceDate);
  }
  if (typeof evidence.withinWindow !== "boolean") throw new Error(`${label}.withinWindow 必须是布尔值`);
  const withinWindow = window ? isEvidenceWithinCoverage(evidence, source, window) : evidence.withinWindow;
  if (window && evidence.withinWindow !== withinWindow) {
    throw new Error(`${label} 的 withinWindow 与冻结日期 coverage 不一致`);
  }
  return withinWindow;
}

function validateCollectionContract(collection, sourceRegistry = null, window = null) {
  if (!collection || !Array.isArray(collection.sources)) throw new Error("collection.sources 必须是数组");
  if (window) {
    if (
      collection.coverageStartDate !== window.coverageStartDate ||
      collection.coverageEndDate !== window.coverageEndDate ||
      collection.observedAt !== window.observedAt
    ) {
      throw new Error("collection 日期 coverage 与 window.json 不一致");
    }
  }
  const seenSources = new Set();
  const seenCandidates = new Set();
  for (const collectedSource of collection.sources) {
    requireFields(
      collectedSource,
      ["sourceId", "companyId", "status", "checkedAt", "windowCoverage", "rejectedItems", "candidates"],
      "collection source",
    );
    requireString(collectedSource.sourceId, "collection source.sourceId");
    if (!SOURCE_STATUSES.has(collectedSource.status)) throw new Error(`collection ${collectedSource.sourceId} status 不合法`);
    requireIsoTimestamp(collectedSource.checkedAt, `collection ${collectedSource.sourceId}.checkedAt`);
    if (window && new Date(collectedSource.checkedAt).getTime() < new Date(window.observedAt).getTime()) {
      throw new Error(`collection ${collectedSource.sourceId}.checkedAt 早于冻结 observedAt`);
    }
    if (!WINDOW_COVERAGES.has(collectedSource.windowCoverage)) {
      throw new Error(`collection ${collectedSource.sourceId} windowCoverage 不合法`);
    }
    if (seenSources.has(collectedSource.sourceId)) throw new Error(`collection sourceId 重复：${collectedSource.sourceId}`);
    seenSources.add(collectedSource.sourceId);
    if (!Array.isArray(collectedSource.candidates)) throw new Error(`collection ${collectedSource.sourceId} candidates 必须是数组`);
    if (!Array.isArray(collectedSource.rejectedItems)) throw new Error(`collection ${collectedSource.sourceId} rejectedItems 必须是数组`);
    if (["failed", "not-configured"].includes(collectedSource.status) && !collectedSource.error) {
      throw new Error(`collection ${collectedSource.sourceId} 失败但没有 error`);
    }

    if (sourceRegistry) {
      const registrySource = getEnabledRegistrySource(sourceRegistry, collectedSource.sourceId, "collection");
      if (!DETERMINISTIC_METHODS.has(registrySource.method)) {
        throw new Error(`collection source ${registrySource.id} method 必须由非 Feed discovery 执行`);
      }
      validateSourceCompany(collectedSource.companyId, registrySource, `collection ${collectedSource.sourceId}`);
    }

    for (const candidate of collectedSource.candidates) {
      requireFields(
        candidate,
        ["candidateId", "sourceId", "canonicalUrl", "timePrecision", "sourceTimezone", "withinWindow"],
        `candidate ${candidate.candidateId || "unknown"}`,
      );
      requireString(candidate.candidateId, "candidate.candidateId");
      if (seenCandidates.has(candidate.candidateId)) throw new Error(`candidateId 重复：${candidate.candidateId}`);
      seenCandidates.add(candidate.candidateId);
      if (candidate.sourceId !== collectedSource.sourceId) {
        throw new Error(`candidate ${candidate.candidateId} 的 sourceId 与 collection source 不一致`);
      }
      if (!["timestamp", "date", "unknown"].includes(candidate.timePrecision)) {
        throw new Error(`candidate ${candidate.candidateId} 的 timePrecision 不合法`);
      }
      if (typeof candidate.withinWindow !== "boolean") throw new Error(`candidate ${candidate.candidateId} withinWindow 必须是布尔值`);
    }
  }
  return collection;
}

function validateDiscoveryContract(discovery, sourceRegistry = null, window = null) {
  if (!discovery || !Array.isArray(discovery.paths)) throw new Error("discovery.paths 必须是数组");
  const seenPaths = new Set();
  for (const item of discovery.paths) {
    requireFields(
      item,
      ["sourceId", "companyId", "method", "status", "checkedAt", "request", "candidateCount", "error", "evidence"],
      "discovery path",
    );
    requireString(item.sourceId, "discovery path.sourceId");
    requireString(item.method, `discovery ${item.sourceId}.method`);
    if (!SOURCE_STATUSES.has(item.status)) throw new Error(`discovery ${item.sourceId} status 不合法`);
    requireIsoTimestamp(item.checkedAt, `discovery ${item.sourceId}.checkedAt`);
    if (window && new Date(item.checkedAt).getTime() < new Date(window.observedAt).getTime()) {
      throw new Error(`discovery ${item.sourceId}.checkedAt 早于冻结 observedAt`);
    }
    if (!item.request || typeof item.request !== "object") throw new Error(`discovery ${item.sourceId} request 必须是对象`);
    const hasRequestUrl = typeof item.request.url === "string" && item.request.url.trim() !== "";
    const hasQuery = typeof item.request.query === "string" && item.request.query.trim() !== "";
    if (!["not-configured"].includes(item.status) && !hasRequestUrl && !hasQuery) {
      throw new Error(`discovery ${item.sourceId} 缺少实际请求 URL 或 query`);
    }
    if (!Number.isInteger(item.candidateCount) || item.candidateCount < 0) {
      throw new Error(`discovery ${item.sourceId} candidateCount 必须是非负整数`);
    }
    if (!Array.isArray(item.evidence)) throw new Error(`discovery ${item.sourceId} evidence 必须是数组`);
    if (item.status === "success" && item.evidence.length === 0) {
      throw new Error(`discovery ${item.sourceId} success 但没有 evidence`);
    }
    if (item.status === "checked-empty" && (item.evidence.length !== 0 || item.candidateCount !== 0)) {
      throw new Error(`discovery ${item.sourceId} checked-empty 必须使用空 evidence 和 candidateCount=0`);
    }
    if (["success", "checked-empty"].includes(item.status) && item.candidateCount !== item.evidence.length) {
      throw new Error(`discovery ${item.sourceId} candidateCount 与 evidence 数量不一致`);
    }
    if (["failed", "not-configured"].includes(item.status) && !item.error) {
      throw new Error(`discovery ${item.sourceId} 失败但没有 error`);
    }

    if (sourceRegistry) {
      const registrySource = getEnabledRegistrySource(sourceRegistry, item.sourceId, "discovery");
      if (DETERMINISTIC_METHODS.has(registrySource.method)) {
        throw new Error(`discovery source ${registrySource.id} 应由确定性 collector 执行`);
      }
      if (item.method !== registrySource.method) throw new Error(`discovery ${item.sourceId} method 与 registry 不一致`);
      validateSourceCompany(item.companyId, registrySource, `discovery ${item.sourceId}`);
      if (hasRequestUrl) validateSourceUrl(item.request.url, registrySource, `discovery ${item.sourceId} request`);
      const pathKey = `${item.sourceId}\n${item.companyId ?? ""}`;
      if (seenPaths.has(pathKey)) throw new Error(`discovery 路径重复：${item.sourceId}/${item.companyId}`);
      seenPaths.add(pathKey);
    }

    for (const evidence of item.evidence) {
      requireFields(
        evidence,
        ["evidenceId", "sourceId", "url", "timePrecision", "sourceTimezone", "withinWindow"],
        `discovery evidence ${evidence.evidenceId || "unknown"}`,
      );
      requireString(evidence.evidenceId, "discovery evidence.evidenceId");
      if (evidence.sourceId !== item.sourceId) throw new Error(`discovery evidence ${evidence.evidenceId} 的 sourceId 与路径不一致`);
    }
  }
  return discovery;
}

function validateSelectionContract(selection) {
  if (!selection || !Array.isArray(selection.events) || !Array.isArray(selection.coverage)) {
    throw new Error("selection.events 和 selection.coverage 必须是数组");
  }
  const ownerByCandidate = new Map();
  const seenEvents = new Set();
  for (const event of selection.events) {
    if (!event || typeof event !== "object" || typeof event.included !== "boolean") {
      throw new Error("selection event 必须包含布尔字段 included");
    }
    requireString(event.eventId, "selection event.eventId");
    if (seenEvents.has(event.eventId)) throw new Error(`eventId 重复：${event.eventId}`);
    seenEvents.add(event.eventId);
    if (!Array.isArray(event.candidateIds)) throw new Error(`event ${event.eventId}.candidateIds 必须是数组`);
    if (event.candidateIds.some((item) => typeof item !== "string" || item.trim() === "")) {
      throw new Error(`event ${event.eventId}.candidateIds 必须是字符串数组`);
    }

    if (!event.included) {
      const reason = event.reasonCode || event.exclusionReason || event.reason;
      requireString(reason, `excluded event ${event.eventId} reasonCode`);
      continue;
    }

    requireFields(
      event,
      [
        "eventId",
        "title",
        "eventType",
        "included",
        "editorialPriority",
        "candidateIds",
        "sourceRefs",
        "materialDelta",
        "historyMatches",
      ],
      "included event",
    );
    requireString(event.title, `event ${event.eventId}.title`);
    requireString(event.eventType, `event ${event.eventId}.eventType`);
    requireString(event.editorialPriority, `event ${event.eventId}.editorialPriority`);
    if (event.candidateIds.length === 0) throw new Error(`included event ${event.eventId} 缺少 candidateIds`);
    if (!Array.isArray(event.sourceRefs) || event.sourceRefs.length === 0 || !Array.isArray(event.historyMatches)) {
      throw new Error(`included event ${event.eventId} 数组字段不合法`);
    }
    if (!event.materialDelta || typeof event.materialDelta !== "object" || Array.isArray(event.materialDelta)) {
      throw new Error(`event ${event.eventId}.materialDelta 必须是结构化对象`);
    }
    requireFields(event.materialDelta, ["kind", "summary", "evidenceIds"], `event ${event.eventId}.materialDelta`);
    if (!["new-event", "material-update"].includes(event.materialDelta.kind)) {
      throw new Error(`event ${event.eventId}.materialDelta.kind 不合法`);
    }
    requireString(event.materialDelta.summary, `event ${event.eventId}.materialDelta.summary`);
    requireStringArray(event.materialDelta.evidenceIds, `event ${event.eventId}.materialDelta.evidenceIds`);

    for (const match of event.historyMatches) {
      if (!match || typeof match !== "object" || Array.isArray(match)) {
        throw new Error(`event ${event.eventId}.historyMatches 必须包含结构化对象`);
      }
      requireFields(match, ["file", "conclusion"], `event ${event.eventId}.historyMatches`);
      requireString(match.file, `event ${event.eventId}.historyMatches.file`);
      requireString(match.conclusion, `event ${event.eventId}.historyMatches.conclusion`);
      if (!match.eventTitle && !match.fingerprint) {
        throw new Error(`event ${event.eventId}.historyMatches 缺少 eventTitle 或 fingerprint`);
      }
      if (match.eventTitle !== undefined) requireString(match.eventTitle, `event ${event.eventId}.historyMatches.eventTitle`);
      if (match.fingerprint !== undefined) requireString(match.fingerprint, `event ${event.eventId}.historyMatches.fingerprint`);
    }

    for (const candidateId of event.candidateIds) {
      if (ownerByCandidate.has(candidateId)) {
        throw new Error(`candidate ${candidateId} 在 included event 中重复归属`);
      }
      ownerByCandidate.set(candidateId, event.eventId);
    }
  }
  return selection;
}

function validateSelfReviewContract(selfReview) {
  requireFields(
    selfReview,
    [
      "windowChecked",
      "recentFiveChecked",
      "priorityCoverageChecked",
      "coverageConclusion",
      "coverageGaps",
      "candidateDisposition",
      "highRiskUnconfirmedItems",
      "conclusion",
    ],
    "self-review",
  );
  for (const field of ["windowChecked", "recentFiveChecked", "priorityCoverageChecked"]) {
    if (selfReview[field] !== true) throw new Error(`self-review 未确认 ${field}`);
  }
  if (!["sufficient", "degraded", "insufficient"].includes(selfReview.coverageConclusion)) {
    throw new Error("self-review coverageConclusion 不合法");
  }
  for (const field of ["coverageGaps", "highRiskUnconfirmedItems"]) {
    if (!Array.isArray(selfReview[field])) throw new Error(`self-review ${field} 必须是数组`);
  }
  if (!selfReview.candidateDisposition || typeof selfReview.candidateDisposition !== "object") {
    throw new Error("self-review candidateDisposition 必须是对象");
  }
  for (const field of ["included", "excluded", "rejected"]) {
    if (!Number.isInteger(selfReview.candidateDisposition[field]) || selfReview.candidateDisposition[field] < 0) {
      throw new Error(`self-review candidateDisposition.${field} 必须是非负整数`);
    }
  }
  requireString(selfReview.conclusion, "self-review conclusion");
  return selfReview;
}

function isSuccessfulCheck(result) {
  return result && ["success", "checked-empty"].includes(result.status);
}

function getCoverageResult(source, companyId, collection, discovery) {
  if (DETERMINISTIC_METHODS.has(source.method)) {
    return (collection.sources || []).find(
      (item) => item.sourceId === source.id && item.companyId === source.companyId,
    );
  }
  return (discovery.paths || []).find(
    (item) => item.sourceId === source.id && item.companyId === companyId,
  );
}

function evaluateCompanyCoverage(company, collection, discovery, sourceRegistry) {
  const configured = (sourceRegistry.sources || []).filter(
    (source) =>
      source.enabled &&
      source.companyId === company.id &&
      source.authority !== "media" &&
      ["primary", "supplemental"].includes(source.coverageRole),
  );
  const primary = configured.filter((source) => source.coverageRole === "primary");
  const checked = configured.map((source) => ({
    source,
    result: getCoverageResult(source, company.id, collection, discovery) || null,
  }));
  const successfulPrimary = checked.filter(
    ({ source, result }) => source.coverageRole === "primary" && isSuccessfulCheck(result),
  );
  const hasOfficialCheck = checked.some(({ result }) => isSuccessfulCheck(result));
  const hasNonFeedCheck = checked.some(
    ({ source, result }) => !DETERMINISTIC_METHODS.has(source.method) && isSuccessfulCheck(result),
  );
  const hasCompletePrimary = successfulPrimary.some(
    ({ source, result }) => !DETERMINISTIC_METHODS.has(source.method) || result.windowCoverage === "complete",
  );
  const hasPartialPrimaryWithSupplement = successfulPrimary.some(
    ({ source, result }) =>
      DETERMINISTIC_METHODS.has(source.method) &&
      ["partial", "unknown"].includes(result.windowCoverage) &&
      hasNonFeedCheck,
  );
  const gaps = [];
  if (primary.length === 0) gaps.push("没有配置 primary 官方路径");
  if (successfulPrimary.length === 0) gaps.push("没有成功的 primary 官方检查");
  if (successfulPrimary.length > 0 && !hasCompletePrimary && !hasPartialPrimaryWithSupplement) {
    gaps.push("Feed coverage 不完整且缺少成功的非 Feed 补检");
  }
  const status =
    primary.length > 0 &&
    successfulPrimary.length > 0 &&
    (hasCompletePrimary || hasPartialPrimaryWithSupplement)
      ? "success"
      : "failed";
  return {
    companyId: company.id,
    status,
    hasOfficialCheck,
    checkedSourceIds: checked.filter(({ result }) => result).map(({ source }) => source.id),
    gaps,
  };
}

function evaluateCoverage(collection, discovery, focusCompanies, sourceRegistry) {
  const companies = (focusCompanies || []).filter((company) => company.priorityFocus);
  const companyResults = companies.map((company) =>
    evaluateCompanyCoverage(company, collection, discovery, sourceRegistry),
  );
  const unavailable = companyResults.filter((item) => item.status === "failed");
  const anyOfficialCheck = companyResults.some((item) => item.hasOfficialCheck);
  return {
    status: !anyOfficialCheck ? "insufficient" : unavailable.length > 0 ? "degraded" : "sufficient",
    companies: companyResults,
  };
}

function validateCoverageForStatus(status, coverage) {
  if (!coverage || !["sufficient", "degraded", "insufficient"].includes(coverage.status)) {
    throw new Error("coverage 结论不合法");
  }
  if (status === "no_events" && coverage.status !== "sufficient") {
    throw new Error("no_events 要求 sufficient coverage");
  }
  if (status === "draft_ready" && coverage.status === "insufficient") {
    throw new Error("draft_ready 不允许 insufficient coverage");
  }
  return coverage;
}

function validateCoverage(collection, discovery, focusCompanies, sourceRegistry) {
  const coverage = evaluateCoverage(collection, discovery, focusCompanies, sourceRegistry);
  validateCoverageForStatus("draft_ready", coverage);
  return coverage;
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}



function validateSelectionEvidence({ selection, collection, discovery, window, sourceRegistry, publicSources }) {
  const sourceById = new Map(sourceRegistry.sources.filter((source) => source.enabled).map((source) => [source.id, source]));
  const evidenceById = new Map();
  const addEvidence = (evidenceId, evidence) => {
    const current = evidenceById.get(evidenceId) || [];
    current.push(evidence);
    evidenceById.set(evidenceId, current);
  };
  for (const collectedSource of collection.sources) {
    for (const candidate of collectedSource.candidates) {
      const evidenceId = candidate.evidenceId || candidate.candidateId;
      addEvidence(evidenceId, { ...candidate, evidenceId, url: candidate.canonicalUrl });
    }
  }
  for (const discoveryPath of discovery.paths) {
    for (const evidence of discoveryPath.evidence) addEvidence(evidence.evidenceId, evidence);
  }

  const getUniqueEvidence = (evidenceId, label) => {
    const matches = evidenceById.get(evidenceId) || [];
    if (matches.length === 0) throw new Error(`${label} 缺少 evidence：${evidenceId}`);
    if (matches.length > 1) throw new Error(`${label} evidenceId 不唯一：${evidenceId}`);
    return matches[0];
  };

  const includedEvents = selection.events.filter((event) => event.included);
  validatePublicSourceLabels(includedEvents, sourceById);
  const expectedPublicSources = [];

  for (const event of includedEvents) {
    for (const candidateId of event.candidateIds) getUniqueEvidence(candidateId, `事件 ${event.eventId}`);
    const resolvedRefs = [];
    for (const ref of event.sourceRefs) {
      requireFields(ref, ["sourceId", "evidenceId", "url", "label"], `event ${event.eventId} sourceRef`);
      const source = sourceById.get(ref.sourceId);
      if (!source) throw new Error(`事件 ${event.eventId} 使用未知或未启用 sourceId：${ref.sourceId}`);
      if (!source.categories.includes("*") && !source.categories.includes(event.eventType)) {
        throw new Error(`source ${source.id} 不支持事件类型 ${event.eventType}`);
      }
      const evidence = getUniqueEvidence(ref.evidenceId, `事件 ${event.eventId}`);
      if (evidence.sourceId !== ref.sourceId) throw new Error(`evidence ${ref.evidenceId} 的 sourceId 不一致`);
      validateSourceUrl(evidence.url, source, `evidence ${ref.evidenceId}`);
      validateSourceUrl(ref.url, source, `sourceRef ${ref.evidenceId}`);
      if (normalizeUrl(evidence.url) !== normalizeUrl(ref.url)) throw new Error(`sourceRef URL 与 evidence URL 不一致：${ref.url}`);
      const withinCoverage = validateEvidenceTimeContract(
        evidence,
        source,
        window,
        `evidence ${ref.evidenceId}`,
      );
      if (!withinCoverage) throw new Error(`证据 ${ref.evidenceId} 不在冻结日期 coverage 内`);
      resolvedRefs.push({ ...ref, ...evidence });
    }

    const selectedEvidenceIds = new Set(event.sourceRefs.map((ref) => ref.evidenceId));
    for (const evidenceId of event.materialDelta.evidenceIds) {
      if (!selectedEvidenceIds.has(evidenceId)) {
        throw new Error(`事件 ${event.eventId}.materialDelta 引用未入选 evidence：${evidenceId}`);
      }
    }
    if (!isConfirmedEvent({ ...event, sourceRefs: resolvedRefs }, sourceById, window)) {
      throw new Error(`事件 ${event.eventId} 未满足来源确认策略`);
    }

    expectedPublicSources.push(...event.sourceRefs.map((ref) => ({ label: ref.label, url: normalizeUrl(ref.url) })));
  }

  if (publicSources) {
    const actual = publicSources.map((ref) => ({ label: ref.label, url: normalizeUrl(ref.url) }));
    if (JSON.stringify(expectedPublicSources) !== JSON.stringify(actual)) {
      throw new Error("selection sourceRefs 与公开扁平来源列表不一致");
    }
  }
}

function sha256File(file) {
  return `sha256:${crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}`;
}

function verifyImmutableFiles({ windowPath, expectedWindowHash, collectionPath, expectedCollectionHash }) {
  if (sha256File(windowPath) !== expectedWindowHash) throw new Error("window.json 已被修改");
  if (sha256File(collectionPath) !== expectedCollectionHash) throw new Error("collection.json 已被修改");
}

function defaultRunGit(args) {
  const result = spawnSync("git", args, { cwd: process.cwd(), encoding: "utf8" });
  return { status: result.status ?? 1, stdout: result.stdout || "", stderr: result.stderr || "" };
}

function collectAllowedChangedFiles({ runGit = defaultRunGit } = {}) {
  const result = runGit(["status", "--porcelain", "--untracked-files=all"]);
  if (result.status !== 0) throw new Error(`git status 失败：${result.stderr}`);
  return result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).split(" -> ").pop().replace(/\\/g, "/"));
}

function verifyCommittedFileSet({ commit, briefingFile, indexFile, runGit = defaultRunGit }) {
  const result = runGit(["diff-tree", "--no-commit-id", "--name-only", "-r", commit]);
  if (result.status !== 0) throw new Error(`git diff-tree 失败：${result.stderr}`);
  const actual = result.stdout.split(/\r?\n/).filter(Boolean).sort();
  const expected = [briefingFile, indexFile].map((file) => file.replace(/\\/g, "/")).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`commit 文件集合不符合预期：${actual.join(", ")}`);
  }
}

function verifyRemoteContainsCommit({ commit, branch, remote = "origin", runGit = defaultRunGit }) {
  const fetchResult = runGit(["fetch", remote, branch]);
  if (fetchResult.status !== 0) throw new Error(`git fetch 失败：${fetchResult.stderr}`);
  const mergeBase = runGit(["merge-base", "--is-ancestor", commit, `refs/remotes/${remote}/${branch}`]);
  if (mergeBase.status !== 0) throw new Error(`远端分支不包含 commit：${commit}`);
}

function parsePublicSources(markdown) {
  const sourceMatch = /^##\s+来源\s*$/m.exec(markdown);
  if (!sourceMatch) return [];
  const section = markdown.slice(sourceMatch.index + sourceMatch[0].length);
  if (/^#{1,6}\s+/m.test(section)) throw new Error("公开 Markdown `## 来源` 章节不得包含来源分组标题");
  return section
    .split(/\r?\n/)
    .map((line) => /^-\s+\[([^\]]+)\]\s+\[[^\]]+\]\(([^)\s]+)\)\s*$/.exec(line.trim()))
    .filter(Boolean)
    .map((item) => ({ label: item[1], url: item[2] }));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function updateVerification(runDir, gate, details) {
  const file = path.join(runDir, "verification.json");
  fs.mkdirSync(runDir, { recursive: true });
  let current = { gates: {} };
  if (fs.existsSync(file)) current = readJson(file);
  current.gates[gate] = { checkedAt: new Date().toISOString(), ...details };
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(current, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!command) throw new Error("缺少 verifier 子命令");
  const args = {};
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    if (!key.startsWith("--")) throw new Error(`未知参数：${key}`);
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`参数缺少值：${key}`);
    args[key.slice(2)] = value;
    index += 1;
  }
  return { command, args };
}

function collectDispositionEvidence(collection, discovery) {
  const candidateIds = new Set();
  for (const source of collection.sources || []) {
    for (const candidate of source.candidates || []) candidateIds.add(candidate.candidateId);
  }
  for (const item of discovery.paths || []) {
    for (const evidence of item.evidence || []) candidateIds.add(evidence.evidenceId);
  }
  const rejectedCount = (collection.sources || []).reduce(
    (total, source) => total + (source.rejectedItems || []).length,
    0,
  );
  return { candidateIds, rejectedCount };
}

function validateNoEventsDisposition(collection, selection, selfReview, discovery = { paths: [] }) {
  const includedEvents = selection.events.filter((event) => event.included);
  if (includedEvents.length > 0) throw new Error("no_events selection 不能包含 included event");
  const { candidateIds, rejectedCount } = collectDispositionEvidence(collection, discovery);
  const excludedIds = new Set();
  for (const event of selection.events.filter((item) => !item.included)) {
    for (const candidateId of event.candidateIds || []) excludedIds.add(candidateId);
  }
  for (const candidate of selection.excludedCandidates || []) {
    requireString(candidate.candidateId, "selection.excludedCandidates.candidateId");
    requireString(
      candidate.reasonCode || candidate.exclusionReason || candidate.reason,
      `excluded candidate ${candidate.candidateId} reasonCode`,
    );
    excludedIds.add(candidate.candidateId);
  }
  const missing = [...candidateIds].filter((candidateId) => !excludedIds.has(candidateId));
  const unknown = [...excludedIds].filter((candidateId) => !candidateIds.has(candidateId));
  const actual = { included: 0, excluded: excludedIds.size, rejected: rejectedCount };
  const declared = selfReview.candidateDisposition;
  if (
    missing.length > 0 ||
    unknown.length > 0 ||
    !declared ||
    actual.included !== declared.included ||
    actual.excluded !== declared.excluded ||
    actual.rejected !== declared.rejected
  ) {
    throw new Error(
      `候选处置数量不一致：actual=${JSON.stringify(actual)} declared=${JSON.stringify(declared || null)}`,
    );
  }
  return actual;
}

function briefingPathForIssueDate(issueDate) {
  return path.join(
    process.cwd(),
    "content",
    "ai-briefings",
    issueDate.slice(0, 4),
    issueDate.slice(5, 7),
    `${issueDate}-ai-briefing.md`,
  );
}

function verifyNoEventsRun(runDir, expectedHashes, dependencies = {}) {
  const config = dependencies.config || loadAiBriefingSkillConfig();
  const paths = Object.fromEntries(
    ["window", "collection", "discovery", "selection", "self-review"].map((name) => [name, path.join(runDir, `${name}.json`)]),
  );
  verifyImmutableFiles({
    windowPath: paths.window,
    expectedWindowHash: expectedHashes.window,
    collectionPath: paths.collection,
    expectedCollectionHash: expectedHashes.collection,
  });
  const window = readJson(paths.window);
  const collection = validateCollectionContract(readJson(paths.collection), config.sourceRegistry, window);
  const discovery = validateDiscoveryContract(readJson(paths.discovery), config.sourceRegistry, window);
  const selection = validateSelectionContract(readJson(paths.selection));
  const selfReview = validateSelfReviewContract(readJson(paths["self-review"]));
  const coverage = evaluateCoverage(collection, discovery, config.focusCompanies, config.sourceRegistry);
  validateCoverageForStatus("no_events", coverage);
  if (selfReview.coverageConclusion !== coverage.status) {
    throw new Error("self-review coverageConclusion 与 verifier 结论不一致");
  }
  validateNoEventsDisposition(collection, selection, selfReview, discovery);

  const candidatePath = path.join(runDir, "candidate.md");
  const briefingFile = dependencies.briefingFile || briefingPathForIssueDate(window.issueDate);
  if (fs.existsSync(candidatePath)) throw new Error("no_events 不得产生 candidate.md");
  const expectedBriefingHash = dependencies.expectedBriefingHash || expectedHashes.briefing;
  if (expectedBriefingHash) {
    if (!fs.existsSync(briefingFile) || sha256File(briefingFile) !== expectedBriefingHash) {
      throw new Error(`no_events 修改了替换前的正式简报文件：${briefingFile}`);
    }
  } else if (fs.existsSync(briefingFile)) {
    throw new Error(`no_events 不得产生正式简报文件：${briefingFile}`);
  }
  const changed = collectAllowedChangedFiles({ runGit: dependencies.runGit || defaultRunGit });
  if (changed.length > 0) throw new Error(`no_events 产生未允许 Git 副作用：${changed.join(", ")}`);
  return { issueDate: window.issueDate, coverage };
}

function verifyEvidenceRun(runDir, expectedHashes = null, options = {}) {
  const config = loadAiBriefingSkillConfig();
  const paths = Object.fromEntries(
    ["window", "collection", "discovery", "selection", "self-review"].map((name) => [name, path.join(runDir, `${name}.json`)]),
  );
  if (expectedHashes) {
    verifyImmutableFiles({
      windowPath: paths.window,
      expectedWindowHash: expectedHashes.window,
      collectionPath: paths.collection,
      expectedCollectionHash: expectedHashes.collection,
    });
  }
  const window = readJson(paths.window);
  const collection = validateCollectionContract(readJson(paths.collection), config.sourceRegistry, window);
  const discovery = validateDiscoveryContract(readJson(paths.discovery), config.sourceRegistry, window);
  const selection = validateSelectionContract(readJson(paths.selection));
  const selfReview = validateSelfReviewContract(readJson(paths["self-review"]));
  const coverage = evaluateCoverage(collection, discovery, config.focusCompanies, config.sourceRegistry);
  validateCoverageForStatus("draft_ready", coverage);
  if (selfReview.coverageConclusion !== coverage.status) {
    throw new Error("self-review coverageConclusion 与 verifier 结论不一致");
  }
  const defaultBriefingFile = briefingPathForIssueDate(window.issueDate);
  const evidenceFile = options.candidateFile || defaultBriefingFile;
  if (!fs.existsSync(evidenceFile)) throw new Error(`待审核 AI 简报不存在：${evidenceFile}`);
  validateSelectionEvidence({
    selection,
    collection,
    discovery,
    window,
    sourceRegistry: config.sourceRegistry,
    publicSources: parsePublicSources(fs.readFileSync(evidenceFile, "utf8")),
  });
  const briefingFile =
    options.briefingFile || path.relative(process.cwd(), defaultBriefingFile).replace(/\\/g, "/");
  return { issueDate: window.issueDate, briefingFile, coverage };
}

function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (command === "parse-generator") {
    const result = validateGeneratorResult(parseClaudeOutput(fs.readFileSync(args.input, "utf8")), args["issue-date"]);
    updateVerification(args["run-dir"], "generator", { status: result.status });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (command === "verify-no-events") {
    const result = verifyNoEventsRun(args["run-dir"], {
      window: args["expected-window-hash"],
      collection: args["expected-collection-hash"],
      briefing: args["expected-briefing-hash"],
    });
    updateVerification(args["run-dir"], "noEvents", { status: "passed", coverage: result.coverage.status });
    return;
  }
  if (command === "verify-pre-review") {
    requireString(args.candidate, "--candidate");
    requireString(args["briefing-file"], "--briefing-file");
    const evidence = verifyEvidenceRun(
      args["run-dir"],
      {
        window: args["expected-window-hash"],
        collection: args["expected-collection-hash"],
      },
      { candidateFile: args.candidate, briefingFile: args["briefing-file"] },
    );
    const changed = collectAllowedChangedFiles();
    if (changed.length > 0) {
      throw new Error(`generator 产生未允许副作用：${changed.join(", ")}`);
    }
    updateVerification(args["run-dir"], "preReview", { status: "passed", coverage: evidence.coverage.status });
    return;
  }
  if (command === "verify-reviewer") {
    const result = validateReviewerResult(parseClaudeOutput(fs.readFileSync(args.input, "utf8")));
    if (result.status !== "approved") throw new Error(`reviewer 未批准：${result.status}`);
    updateVerification(args["run-dir"], "reviewer", { status: result.status });
    return;
  }
  if (command === "verify-pre-commit") {
    verifyEvidenceRun(args["run-dir"]);
    const reviewer = validateReviewerResult(
      parseClaudeOutput(fs.readFileSync(path.join(args["run-dir"], "reviewer-output.json"), "utf8")),
    );
    if (reviewer.status !== "approved") throw new Error("reviewer 未批准，禁止 commit");
    if (!fs.existsSync(args["briefing-file"]) || !fs.existsSync(args["index-file"])) throw new Error("commit 前文件缺失");
    const issueDate = readJson(path.join(args["run-dir"], "window.json")).issueDate;
    if (!fs.readFileSync(args["index-file"], "utf8").includes(issueDate)) throw new Error("AI 简报索引未包含本期日期");
    const changed = collectAllowedChangedFiles().sort();
    const allowed = [args["briefing-file"], args["index-file"]].map((file) => file.replace(/\\/g, "/")).sort();
    if (JSON.stringify(changed) !== JSON.stringify(allowed)) throw new Error(`commit 前文件集合不符合预期：${changed.join(", ")}`);
    updateVerification(args["run-dir"], "preCommit", { status: "passed" });
    return;
  }
  if (command === "verify-committed-files") {
    verifyCommittedFileSet({
      commit: args.commit,
      briefingFile: args["briefing-file"],
      indexFile: args["index-file"],
    });
    updateVerification(args["run-dir"], "committedFiles", { status: "passed", commit: args.commit });
    return;
  }
  if (command === "verify-post-push") {
    requireString(args.remote, "--remote");
    verifyRemoteContainsCommit({ commit: args.commit, branch: args.branch, remote: args.remote });
    const changed = collectAllowedChangedFiles();
    if (changed.length > 0) throw new Error(`发布后工作区不干净：${changed.join(", ")}`);
    updateVerification(args["run-dir"], "postPush", { status: "passed", commit: args.commit });
    return;
  }
  throw new Error(`未知 verifier 子命令：${command}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`[verify-ai-briefing-run] ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  AUTHORITY_LABELS,
  collectAllowedChangedFiles,
  evaluateCompanyCoverage,
  evaluateCoverage,
  intervalsOverlap,
  isConfirmedEvent,
  isEvidenceWithinCoverage,
  parseClaudeOutput,
  parsePublicSources,
  resolveConfirmationPolicy,
  sha256File,
  shanghaiCoverageInterval,
  sourceLocalDateInterval,
  validateCollectionContract,
  validateCoverage,
  validateCoverageForStatus,
  validateDiscoveryContract,
  validateGeneratorResult,
  validateNoEventsDisposition,
  validatePublicSourceLabels,
  validateReviewerResult,
  validateSelectionContract,
  validateSelectionEvidence,
  validateSelfReviewContract,
  verifyCommittedFileSet,
  verifyImmutableFiles,
  verifyNoEventsRun,
  verifyRemoteContainsCommit,
};
