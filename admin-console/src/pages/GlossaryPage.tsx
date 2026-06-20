import { useEffect, useMemo, useRef, useState } from "react";

import {
  archiveKnowledgeTerm,
  createKnowledgeTerm,
  deleteKnowledgeTerm,
  fetchKnowledgeTerms,
  type KnowledgeTermFilters,
  rebuildKnowledgeTerms,
  type KnowledgeTermItem,
  type SaveKnowledgeTermPayload,
  updateKnowledgeTerm,
} from "../api/client";
import { ConfirmDialog } from "../components/ConfirmDialog";

const EMPTY_FORM: SaveKnowledgeTermPayload = {
  term: "",
  aliases: [],
  definition: "",
  explanation: "",
  related_article_slugs: [],
  domains: [],
  scenes: [],
  status: "enabled",
  notes: "",
  updated_by: "admin",
};

const PAGE_SIZES = [10, 20, 50, 100] as const;
const EMPTY_FILTERS: KnowledgeTermFilters = { term: "", scene: "", domain: "" };
const DOMAIN_OPTIONS = ["article", "ai", "health", "investment"] as const;
const SCENE_OPTIONS = [
  "article",
  "ai",
  "ai-column",
  "health",
  "health-column",
  "investment",
  "investment-column",
] as const;

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCommaList(value: string[]): string {
  return value.join(", ");
}

export function GlossaryPage() {
  const [items, setItems] = useState<KnowledgeTermItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaveKnowledgeTermPayload>({ ...EMPTY_FORM });
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [filters, setFilters] = useState<KnowledgeTermFilters>({ ...EMPTY_FILTERS });
  const [termInput, setTermInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; term: string } | null>(null);
  const lastQueryKeyRef = useRef("");

  async function load() {
    try {
      setError("");
      const queryKey = JSON.stringify({ pageSize, filters });
      const includeTotal = page === 1 || lastQueryKeyRef.current !== queryKey;
      const response = await fetchKnowledgeTerms(page, pageSize, filters, includeTotal);
      setItems(response.items);
      if (response.total !== null) {
        setTotal(response.total);
      }
      lastQueryKeyRef.current = queryKey;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载失败");
    }
  }

  useEffect(() => {
    void load();
  }, [page, pageSize, filters]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const startItem = useMemo(() => (page - 1) * pageSize + 1, [page, pageSize]);
  const endItem = useMemo(() => Math.min(startItem + pageSize - 1, total), [startItem, pageSize, total]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        term: form.term.trim(),
        definition: form.definition.trim(),
        explanation: form.explanation.trim(),
        notes: form.notes?.trim() || undefined,
        updated_by: form.updated_by?.trim() || "admin",
      };
      if (editingId) {
        await updateKnowledgeTerm(editingId, payload);
      } else {
        await createKnowledgeTerm(payload);
      }
      closeModal();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: KnowledgeTermItem) {
    setEditingId(item.id);
    setForm({
      term: item.term,
      aliases: item.aliases,
      definition: item.definition,
      explanation: item.explanation,
      related_article_slugs: item.related_article_slugs,
      domains: item.domains,
      scenes: item.scenes,
      status: item.status,
      notes: item.notes ?? "",
      updated_by: item.updated_by ?? "admin",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  async function handleArchive(id: string) {
    await archiveKnowledgeTerm(id);
    await load();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    await deleteKnowledgeTerm(pendingDelete.id);
    setPendingDelete(null);
    await load();
  }

  async function handleRebuild() {
    await rebuildKnowledgeTerms();
    await load();
  }

  function goToPage(next: number) {
    setPage(Math.max(1, Math.min(totalPages, next)));
  }

  function updateFilter(key: keyof KnowledgeTermFilters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyTermFilter() {
    const nextValue = termInput.trim();
    if ((filters.term ?? "") === nextValue) return;
    updateFilter("term", nextValue);
  }

  function resetFilters() {
    setPage(1);
    setFilters({ ...EMPTY_FILTERS });
    setTermInput("");
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>术语库</h2>
          <p>管理文章内高亮术语和 AI 顾问优先检索的词条。创建/更新后会自动同步到 RAG 索引。</p>
        </div>
        <div className="page-actions">
          <button onClick={() => void handleRebuild()}>重建全部索引</button>
          <button onClick={openCreate}>新增术语</button>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="glossary-filters card">
        <div className="glossary-filters-grid">
          <label>
            名称
            <input
              value={termInput}
              onBlur={applyTermFilter}
              onChange={(event) => setTermInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyTermFilter();
                }
              }}
              placeholder="模糊搜索术语名称"
            />
          </label>
          <label>
            域
            <select
              value={filters.domain ?? ""}
              onChange={(event) => updateFilter("domain", event.target.value)}
            >
              <option value="">全部域</option>
              {DOMAIN_OPTIONS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </label>
          <label>
            场景
            <select
              value={filters.scene ?? ""}
              onChange={(event) => updateFilter("scene", event.target.value)}
            >
              <option value="">全部场景</option>
              {SCENE_OPTIONS.map((scene) => (
                <option key={scene} value={scene}>
                  {scene}
                </option>
              ))}
            </select>
          </label>
          <div className="glossary-filters-actions">
            <button type="button" onClick={resetFilters}>清空筛选</button>
          </div>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => goToPage(1)}>首页</button>
          <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>上一页</button>
          <span className="pagination-info">
            第 {page} / {totalPages} 页（{startItem}-{endItem} / 共 {total} 条）
          </span>
          <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>下一页</button>
          <button disabled={page >= totalPages} onClick={() => goToPage(totalPages)}>末页</button>
        </div>
        <div className="page-size">
          <span>每页</span>
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              className={pageSize === size ? "active" : ""}
              onClick={() => setPageSize(size)}
            >
              {size}
            </button>
          ))}
          <span>条</span>
        </div>
      </div>

      {items.map((item) => (
        <article className="card" key={item.id}>
          <div className="term-header">
            <h3>{item.term}</h3>
            <div className="term-actions">
              <button onClick={() => openEdit(item)}>编辑</button>
              <button onClick={() => void handleArchive(item.id)}>归档</button>
              <button
                type="button"
                className="icon-button danger"
                aria-label={`永久删除术语 ${item.term}`}
                title="永久删除"
                onClick={() => setPendingDelete({ id: item.id, term: item.term })}
              >
                ×
              </button>
            </div>
          </div>
          <p className="term-definition">{item.definition}</p>
          <p className="term-meta">
            <span className="term-status">{item.status}</span>
            {item.aliases.length > 0 ? <span>别名：{item.aliases.join(" / ")}</span> : null}
            <span>域：{item.domains.join(" / ") || "全域"}</span>
            <span>场景：{item.scenes.join(" / ") || "全场景"}</span>
            {item.related_article_slugs.length > 0 ? (
              <span>相关文章：{item.related_article_slugs.join(" / ")}</span>
            ) : null}
            {item.notes ? <span>备注：{item.notes}</span> : null}
          </p>
        </article>
      ))}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="永久删除术语"
        description={pendingDelete ? `确定永久删除术语“${pendingDelete.term}”吗？该操作不可恢复。` : ""}
        confirmText="永久删除"
        confirmTone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />

      {modalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h3>{editingId ? "编辑术语" : "新增术语"}</h3>
                <button type="button" className="modal-close" onClick={closeModal} aria-label="关闭">
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="grid">
                  <label>
                    关键词
                    <input
                      value={form.term}
                      onChange={(event) => setForm((current) => ({ ...current, term: event.target.value }))}
                      placeholder="TDD"
                    />
                  </label>
                  <label>
                    别名
                    <input
                      value={formatCommaList(form.aliases)}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, aliases: parseCommaList(event.target.value) }))
                      }
                      placeholder="测试驱动开发, Test Driven Development"
                    />
                  </label>
                  <label>
                    状态
                    <select
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    >
                      <option value="enabled">启用</option>
                      <option value="disabled">禁用</option>
                    </select>
                  </label>
                  <label>
                    生效域
                    <input
                      value={formatCommaList(form.domains)}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, domains: parseCommaList(event.target.value) }))
                      }
                      placeholder="ai, health, investment"
                    />
                  </label>
                  <label>
                    生效场景
                    <input
                      value={formatCommaList(form.scenes)}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, scenes: parseCommaList(event.target.value) }))
                      }
                      placeholder="article, ai-column"
                    />
                  </label>
                  <label>
                    相关文章 Slugs
                    <input
                      value={formatCommaList(form.related_article_slugs)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          related_article_slugs: parseCommaList(event.target.value),
                        }))
                      }
                      placeholder="tdd-introduction, refactoring"
                    />
                  </label>
                  <label>
                    更新人
                    <input
                      value={form.updated_by}
                      onChange={(event) => setForm((current) => ({ ...current, updated_by: event.target.value }))}
                    />
                  </label>
                </div>
                <label>
                  一句话定义
                  <textarea
                    value={form.definition}
                    onChange={(event) => setForm((current) => ({ ...current, definition: event.target.value }))}
                    rows={2}
                  />
                </label>
                <label>
                  详细解释（AI 回答时使用）
                  <textarea
                    value={form.explanation}
                    onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))}
                    rows={5}
                  />
                </label>
                <label>
                  备注
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={2}
                  />
                </label>
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={saving}>
                  {saving ? "保存中..." : editingId ? "更新术语" : "创建术语"}
                </button>
                <button type="button" onClick={closeModal}>取消</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
