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
const SOURCE_STATUSES = new Set(["success", "degraded", "failed", "not-configured"]);
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
  if (!['draft_ready', 'no_events', 'blocked', 'failed'].includes(result.status)) {
    throw new Error(`未知 generator status：${result.status}`);
  }
  requireString(result.issueDate, "issueDate");
  if (result.issueDate !== issueDate) throw new Error(`generator issueDate 不匹配：${result.issueDate}`);

  if (result.status === "draft_ready") {
    assertExactKeys(result, ["status", "issueDate", "filePath", "selectionPath", "selfReviewConclusion"], "draft_ready");
    requireString(result.filePath, "filePath");
    requireString(result.selectionPath, "selectionPath");
    requireString(result.selfReviewConclusion, "selfReviewConclusion");
  } else if (result.status === "blocked") {
    assertExactKeys(result, ["status", "issueDate", "reason", "blockers"], "blocked");
    requireString(result.reason, "reason");
    requireStringArray(result.blockers, "blockers");
  } else {
    assertExactKeys(result, ["status", "issueDate", "reason"], result.status);
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
  if (!['approved', 'needs_changes', 'blocked'].includes(result.status)) {
    throw new Error(`未知 reviewer status：${result.status}`);
  }
  validateEvidenceQuality(result.evidenceQuality);
  if (result.status === "approved") {
    assertExactKeys(result, ["status", "conclusion", "evidenceQuality"], "approved");
    if (result.conclusion !== "可进入发布门禁") throw new Error("approved reviewer conclusion 必须为 可进入发布门禁");
  } else if (result.status === "needs_changes") {
    assertExactKeys(result, ["status", "conclusion", "blockers", "requiredChanges", "evidenceQuality"], "needs_changes");
    if (result.conclusion !== "需修改后复审") throw new Error("needs_changes reviewer conclusion 必须为 需修改后复审");
    requireStringArray(result.blockers, "blockers");
    requireStringArray(result.requiredChanges, "requiredChanges");
  } else {
    assertExactKeys(result, ["status", "conclusion", "reason", "evidenceQuality"], "blocked");
    if (result.conclusion !== "阻断发布") throw new Error("blocked reviewer conclusion 必须为 阻断发布");
    requireString(result.reason, "reason");
  }
  return result;
}

function resolveConfirmationPolicy(source, eventType) {
  return source.confirmationPolicy?.byCategory?.[eventType] ?? source.confirmationPolicy?.default;
}

function isWithinWindow(effectiveAt, window) {
  const timestamp = new Date(effectiveAt).getTime();
  const start = new Date(window.windowStart).getTime();
  const end = new Date(window.windowEnd).getTime();
  if ([timestamp, start, end].some(Number.isNaN)) throw new Error("窗口或 effectiveAt 时间不合法");
  return timestamp > start && timestamp <= end;
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
  let guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond || 0);
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

function computeDateEndEffectiveAt(dateText, timeZone) {
  const parts = calendarParts(dateText);
  const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  const nextMidnightUtc = zonedDateTimeToUtc(
    {
      year: nextDay.getUTCFullYear(),
      month: nextDay.getUTCMonth() + 1,
      day: nextDay.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timeZone,
  );
  return new Date(nextMidnightUtc.getTime() - 1).toISOString();
}

function getSource(sourceById, sourceId) {
  return sourceById instanceof Map ? sourceById.get(sourceId) : sourceById[sourceId];
}

function isConfirmedEvent(event, sourceById, window) {
  const resolved = event.sourceRefs.flatMap((ref) => {
    const source = getSource(sourceById, ref.sourceId);
    if (!source) return [];
    if (source.authority === "media" && ref.timePrecision === "date") return [];
    if (window && (!ref.effectiveAt || !isWithinWindow(ref.effectiveAt, window))) return [];
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
  return url.toString();
}

function validateEvidenceTimeContract(evidence, source, window, label, { allowUnknown = false } = {}) {
  if (evidence.sourceTimezone !== source.sourceTimezone) {
    throw new Error(`${label} 的 sourceTimezone 与 registry 不一致`);
  }
  if (allowUnknown && evidence.timePrecision === "unknown") {
    if (evidence.effectiveAt !== null || evidence.timeConvention !== "unknown" || evidence.withinWindow !== false) {
      throw new Error(`${label} 的 unknown 时间字段不一致`);
    }
    return;
  }
  if (!["timestamp", "date"].includes(evidence.timePrecision)) {
    throw new Error(`${label} 的 timePrecision 不合法`);
  }
  requireIsoTimestamp(evidence.effectiveAt, `${label}.effectiveAt`);
  const time = resolveEvidenceTime(evidence, source);
  if (typeof evidence.withinWindow !== "boolean") throw new Error(`${label}.withinWindow 必须是布尔值`);
  if (window && evidence.withinWindow !== isWithinWindow(time.effectiveAt, window)) {
    throw new Error(`${label} 的 withinWindow 与冻结窗口不一致`);
  }
}

function validateCollectionContract(collection, sourceRegistry = null, window = null) {
  if (!collection || !Array.isArray(collection.sources)) throw new Error("collection.sources 必须是数组");
  const seenSources = new Set();
  for (const collectedSource of collection.sources) {
    requireFields(collectedSource, ["sourceId", "companyId", "status", "checkedAt", "windowCoverage", "candidates"], "collection source");
    requireString(collectedSource.sourceId, "collection source.sourceId");
    if (!SOURCE_STATUSES.has(collectedSource.status)) throw new Error(`collection ${collectedSource.sourceId} status 不合法`);
    requireIsoTimestamp(collectedSource.checkedAt, `collection ${collectedSource.sourceId}.checkedAt`);
    if (window && new Date(collectedSource.checkedAt).getTime() < new Date(window.windowEnd).getTime()) {
      throw new Error(`collection ${collectedSource.sourceId}.checkedAt 早于冻结 windowEnd`);
    }
    if (!WINDOW_COVERAGES.has(collectedSource.windowCoverage)) {
      throw new Error(`collection ${collectedSource.sourceId} windowCoverage 不合法`);
    }
    if (seenSources.has(collectedSource.sourceId)) throw new Error(`collection sourceId 重复：${collectedSource.sourceId}`);
    seenSources.add(collectedSource.sourceId);
    if (!Array.isArray(collectedSource.candidates)) throw new Error(`collection ${collectedSource.sourceId} candidates 必须是数组`);

    let registrySource = null;
    if (sourceRegistry) {
      registrySource = getEnabledRegistrySource(sourceRegistry, collectedSource.sourceId, "collection");
      if (!DETERMINISTIC_METHODS.has(registrySource.method)) {
        throw new Error(`collection source ${registrySource.id} method 必须由非 Feed discovery 执行`);
      }
      validateSourceCompany(collectedSource.companyId, registrySource, `collection ${collectedSource.sourceId}`);
    }

    for (const candidate of collectedSource.candidates) {
      requireFields(
        candidate,
        ["candidateId", "sourceId", "canonicalUrl", "effectiveAt", "timePrecision", "sourceTimezone", "timeConvention", "withinWindow"],
        `candidate ${candidate.candidateId || "unknown"}`,
      );
      if (typeof candidate.withinWindow !== "boolean") throw new Error(`candidate ${candidate.candidateId} withinWindow 必须是布尔值`);
      if (candidate.sourceId !== collectedSource.sourceId) {
        throw new Error(`candidate ${candidate.candidateId} 的 sourceId 与 collection source 不一致`);
      }
      if (registrySource) {
        validateSourceUrl(candidate.canonicalUrl, registrySource, `candidate ${candidate.candidateId}`);
        validateEvidenceTimeContract(candidate, registrySource, window, `candidate ${candidate.candidateId}`, {
          allowUnknown: true,
        });
      }
    }
  }
  return collection;
}

function validateDiscoveryContract(discovery, sourceRegistry = null, window = null) {
  if (!discovery || !Array.isArray(discovery.paths)) throw new Error("discovery.paths 必须是数组");
  const seenPaths = new Set();
  for (const item of discovery.paths) {
    requireFields(item, ["sourceId", "companyId", "method", "status", "checkedAt", "error", "evidence"], "discovery path");
    requireString(item.sourceId, "discovery path.sourceId");
    requireString(item.method, `discovery ${item.sourceId}.method`);
    if (!SOURCE_STATUSES.has(item.status)) throw new Error(`discovery ${item.sourceId} status 不合法`);
    requireIsoTimestamp(item.checkedAt, `discovery ${item.sourceId}.checkedAt`);
    if (window && new Date(item.checkedAt).getTime() < new Date(window.windowEnd).getTime()) {
      throw new Error(`discovery ${item.sourceId}.checkedAt 早于冻结 windowEnd`);
    }
    if (!Array.isArray(item.evidence)) throw new Error(`discovery ${item.sourceId} evidence 必须是数组`);
    if (["success", "degraded"].includes(item.status) && item.evidence.length === 0) {
      throw new Error(`discovery ${item.sourceId} 成功但没有 evidence`);
    }
    if (["failed", "not-configured"].includes(item.status) && !item.error) {
      throw new Error(`discovery ${item.sourceId} 失败但没有 error`);
    }

    let registrySource = null;
    if (sourceRegistry) {
      registrySource = getEnabledRegistrySource(sourceRegistry, item.sourceId, "discovery");
      if (DETERMINISTIC_METHODS.has(registrySource.method)) {
        throw new Error(`discovery source ${registrySource.id} 应由确定性 collector 执行`);
      }
      if (item.method !== registrySource.method) throw new Error(`discovery ${item.sourceId} method 与 registry 不一致`);
      validateSourceCompany(item.companyId, registrySource, `discovery ${item.sourceId}`);
      const pathKey = `${item.sourceId}\n${item.companyId ?? ""}`;
      if (seenPaths.has(pathKey)) throw new Error(`discovery 路径重复：${item.sourceId}/${item.companyId}`);
      seenPaths.add(pathKey);
    }

    for (const evidence of item.evidence) {
      requireFields(
        evidence,
        ["evidenceId", "sourceId", "url", "effectiveAt", "timePrecision", "sourceTimezone", "timeConvention", "withinWindow"],
        `discovery evidence ${evidence.evidenceId || "unknown"}`,
      );
      if (evidence.sourceId !== item.sourceId) throw new Error(`discovery evidence ${evidence.evidenceId} 的 sourceId 与路径不一致`);
      if (registrySource) {
        validateSourceUrl(evidence.url, registrySource, `discovery evidence ${evidence.evidenceId}`);
        validateEvidenceTimeContract(evidence, registrySource, window, `discovery evidence ${evidence.evidenceId}`);
      }
    }
  }
  return discovery;
}

function validateSelectionContract(selection) {
  if (!selection || !Array.isArray(selection.events) || !Array.isArray(selection.coverage)) {
    throw new Error("selection.events 和 selection.coverage 必须是数组");
  }
  const ownerByCandidate = new Map();
  for (const event of selection.events) {
    if (!event.included) continue;
    requireFields(
      event,
      ["eventId", "title", "eventType", "candidateIds", "sourceRefs", "materialDelta", "historyMatches"],
      "included event",
    );
    if (!Array.isArray(event.candidateIds) || !Array.isArray(event.sourceRefs) || !Array.isArray(event.historyMatches)) {
      throw new Error(`included event ${event.eventId} 数组字段不合法`);
    }
    requireString(event.materialDelta, `event ${event.eventId}.materialDelta`);
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
    ["windowChecked", "recentFiveChecked", "priorityCoverageChecked", "highRiskUnconfirmedItems", "conclusion"],
    "self-review",
  );
  for (const field of ["windowChecked", "recentFiveChecked", "priorityCoverageChecked"]) {
    if (selfReview[field] !== true) throw new Error(`self-review 未确认 ${field}`);
  }
  if (!Array.isArray(selfReview.highRiskUnconfirmedItems)) throw new Error("self-review highRiskUnconfirmedItems 必须是数组");
  requireString(selfReview.conclusion, "self-review conclusion");
  return selfReview;
}

function validateCoverage(collection, discovery, focusCompanies, sourceRegistry) {
  const deterministic = collection.sources || [];
  const discovered = discovery.paths || [];
  const enabledSources = (sourceRegistry.sources || []).filter((source) => source.enabled);
  for (const company of focusCompanies.filter((item) => item.priorityFocus)) {
    const configured = enabledSources.filter(
      (source) => source.companyId === company.id || (source.method === "search" && source.companyId === null),
    );
    if (configured.length === 0) throw new Error(`重点厂商 ${company.id} 没有配置采集路径`);

    const results = configured.map((source) => {
      const matches = DETERMINISTIC_METHODS.has(source.method)
        ? deterministic.filter((item) => item.sourceId === source.id && item.companyId === source.companyId)
        : discovered.filter(
            (item) =>
              item.sourceId === source.id &&
              item.companyId === (source.method === "search" && source.companyId === null ? company.id : source.companyId),
          );
      if (matches.length !== 1) {
        throw new Error(`重点厂商 ${company.id} 配置路径 ${source.id} 缺少明确采集结果`);
      }
      return { source, result: matches[0] };
    });

    if (results.every(({ result }) => !["success", "degraded"].includes(result.status))) {
      throw new Error(`重点厂商 ${company.id} 所有采集路径均失败`);
    }
    const feedNeedsSupplement = results.some(
      ({ source, result }) =>
        DETERMINISTIC_METHODS.has(source.method) &&
        ["success", "degraded"].includes(result.status) &&
        (result.windowCoverage !== "complete" || (result.status === "success" && result.candidates.length === 0)),
    );
    const successfulSupplement = results.some(
      ({ source, result }) => !DETERMINISTIC_METHODS.has(source.method) && result.status === "success",
    );
    if (feedNeedsSupplement && !successfulSupplement) {
      throw new Error(`重点厂商 ${company.id} Feed coverage 不完整或零候选，且没有成功补检路径`);
    }
  }
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

function resolveEvidenceTime(evidence, source) {
  if (evidence.timePrecision === "timestamp") {
    if (evidence.timeConvention !== "exact") throw new Error(`时间戳证据 ${evidence.evidenceId || evidence.candidateId} 必须使用 exact`);
    return { effectiveAt: evidence.effectiveAt, eligibleForConfirmation: true };
  }
  if (evidence.timePrecision === "date") {
    const dateText = evidence.date || evidence.publishedDate || String(evidence.effectiveAt).slice(0, 10);
    const effectiveAt = computeDateEndEffectiveAt(dateText, source.sourceTimezone);
    if (evidence.timeConvention !== "date-end-convention" || evidence.effectiveAt !== effectiveAt) {
      throw new Error(`日期级证据 ${evidence.evidenceId || evidence.candidateId} 未按来源时区日末计算`);
    }
    return { effectiveAt, eligibleForConfirmation: source.authority !== "media" };
  }
  throw new Error(`证据 ${evidence.evidenceId || evidence.candidateId} 缺少可比较时间精度`);
}

function validateSelectionEvidence({ selection, collection, discovery, window, sourceRegistry, publicSourceGroups }) {
  const sourceById = new Map(sourceRegistry.sources.filter((source) => source.enabled).map((source) => [source.id, source]));
  const evidenceById = new Map();
  for (const collectedSource of collection.sources) {
    for (const candidate of collectedSource.candidates) {
      const evidenceId = candidate.evidenceId || candidate.candidateId;
      if (evidenceById.has(evidenceId)) throw new Error(`evidenceId 重复：${evidenceId}`);
      evidenceById.set(evidenceId, {
        ...candidate,
        evidenceId,
        url: candidate.canonicalUrl,
      });
    }
  }
  for (const discoveryPath of discovery.paths) {
    for (const evidence of discoveryPath.evidence) {
      if (evidenceById.has(evidence.evidenceId)) throw new Error(`evidenceId 重复：${evidence.evidenceId}`);
      evidenceById.set(evidence.evidenceId, evidence);
    }
  }

  const includedEvents = selection.events.filter((event) => event.included);
  validatePublicSourceLabels(includedEvents, sourceById);
  const publicGroupsByHeading = new Map((publicSourceGroups || []).map((group) => [group.heading, group.sources]));
  if (publicSourceGroups && publicGroupsByHeading.size !== includedEvents.length) {
    throw new Error("公开 Markdown 来源分组与 included event 数量不一致");
  }

  for (const event of includedEvents) {
    for (const candidateId of event.candidateIds) {
      if (!evidenceById.has(candidateId)) throw new Error(`事件 ${event.eventId} 引用未知 candidateId：${candidateId}`);
    }
    const resolvedRefs = [];
    for (const ref of event.sourceRefs) {
      requireFields(ref, ["sourceId", "evidenceId", "url", "label"], `event ${event.eventId} sourceRef`);
      const source = sourceById.get(ref.sourceId);
      if (!source) throw new Error(`事件 ${event.eventId} 使用未知或未启用 sourceId：${ref.sourceId}`);
      if (!source.categories.includes("*") && !source.categories.includes(event.eventType)) {
        throw new Error(`source ${source.id} 不支持事件类型 ${event.eventType}`);
      }
      const evidence = evidenceById.get(ref.evidenceId);
      if (!evidence) throw new Error(`事件 ${event.eventId} 缺少 evidence：${ref.evidenceId}`);
      if (evidence.sourceId !== ref.sourceId) throw new Error(`evidence ${ref.evidenceId} 的 sourceId 不一致`);
      if (evidence.sourceTimezone !== source.sourceTimezone) {
        throw new Error(`evidence ${ref.evidenceId} 的 sourceTimezone 与 registry 不一致`);
      }
      validateSourceUrl(evidence.url, source, `evidence ${ref.evidenceId}`);
      validateSourceUrl(ref.url, source, `sourceRef ${ref.evidenceId}`);
      if (normalizeUrl(evidence.url) !== normalizeUrl(ref.url)) throw new Error(`sourceRef URL 与 evidence URL 不一致：${ref.url}`);
      const time = resolveEvidenceTime(evidence, source);
      const withinWindow = isWithinWindow(time.effectiveAt, window);
      if (evidence.withinWindow !== withinWindow || !withinWindow) {
        throw new Error(`证据 ${ref.evidenceId} 不在 (windowStart, windowEnd] 内`);
      }
      resolvedRefs.push({
        ...ref,
        effectiveAt: time.effectiveAt,
        timePrecision: time.eligibleForConfirmation ? evidence.timePrecision : "date",
      });
    }

    if (!isConfirmedEvent({ ...event, sourceRefs: resolvedRefs }, sourceById, window)) {
      throw new Error(`事件 ${event.eventId} 未满足来源确认策略`);
    }

    if (publicSourceGroups) {
      const publicSources = publicGroupsByHeading.get(event.title);
      if (!publicSources) throw new Error(`公开 Markdown 缺少事件来源分组：${event.title}`);
      const expected = event.sourceRefs.map((ref) => `${ref.label}\n${normalizeUrl(ref.url)}`).sort();
      const actual = publicSources.map((ref) => `${ref.label}\n${normalizeUrl(ref.url)}`).sort();
      if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        throw new Error(`事件 ${event.title} 的 selection sourceRefs 与公开来源不一致`);
      }
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

function parsePublicSourceGroups(markdown) {
  const sourceMatch = /^##\s+来源\s*$/m.exec(markdown);
  if (!sourceMatch) return [];
  const section = markdown.slice(sourceMatch.index + sourceMatch[0].length);
  const matches = [...section.matchAll(/^###\s+(.+?)\s*$/gm)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : section.length;
    const sources = section
      .slice(start, end)
      .split(/\r?\n/)
      .map((line) => /^-\s+\[([^\]]+)\]\s+\[[^\]]+\]\(([^)\s]+)\)\s*$/.exec(line.trim()))
      .filter(Boolean)
      .map((item) => ({ label: item[1], url: item[2] }));
    return { heading: match[1].trim(), sources };
  });
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

function verifyEvidenceRun(runDir, expectedHashes = null) {
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
  validateSelfReviewContract(readJson(paths["self-review"]));
  validateCoverage(collection, discovery, config.focusCompanies, config.sourceRegistry);
  const briefingFile = path.join(
    process.cwd(),
    "content",
    "ai-briefings",
    window.issueDate.slice(0, 4),
    window.issueDate.slice(5, 7),
    `${window.issueDate}-ai-briefing.md`,
  );
  if (!fs.existsSync(briefingFile)) throw new Error(`本期简报文件不存在：${briefingFile}`);
  validateSelectionEvidence({
    selection,
    collection,
    discovery,
    window,
    sourceRegistry: config.sourceRegistry,
    publicSourceGroups: parsePublicSourceGroups(fs.readFileSync(briefingFile, "utf8")),
  });
  return { issueDate: window.issueDate, briefingFile: path.relative(process.cwd(), briefingFile).replace(/\\/g, "/") };
}

function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (command === "parse-generator") {
    const result = validateGeneratorResult(parseClaudeOutput(fs.readFileSync(args.input, "utf8")), args["issue-date"]);
    updateVerification(args["run-dir"], "generator", { status: result.status });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (command === "verify-pre-review") {
    const evidence = verifyEvidenceRun(args["run-dir"], {
      window: args["expected-window-hash"],
      collection: args["expected-collection-hash"],
    });
    const changed = collectAllowedChangedFiles();
    if (changed.some((file) => file !== evidence.briefingFile)) {
      throw new Error(`generator 产生未允许副作用：${changed.join(", ")}`);
    }
    updateVerification(args["run-dir"], "preReview", { status: "passed" });
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
  computeDateEndEffectiveAt,
  isConfirmedEvent,
  isWithinWindow,
  parseClaudeOutput,
  resolveConfirmationPolicy,
  sha256File,
  validateCollectionContract,
  validateCoverage,
  validateDiscoveryContract,
  validateGeneratorResult,
  validatePublicSourceLabels,
  validateReviewerResult,
  validateSelectionContract,
  validateSelectionEvidence,
  validateSelfReviewContract,
  verifyCommittedFileSet,
  verifyImmutableFiles,
  verifyRemoteContainsCommit,
};
