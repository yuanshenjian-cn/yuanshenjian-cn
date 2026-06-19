import { useEffect, useState } from "react";

import {
  archiveKnowledgeTerm,
  createKnowledgeTerm,
  fetchKnowledgeTerms,
  rebuildKnowledgeTerms,
  type KnowledgeTermItem,
  type SaveKnowledgeTermPayload,
  updateKnowledgeTerm,
} from "../api/client";

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

function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function GlossaryPage() {
  const [items, setItems] = useState<KnowledgeTermItem[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaveKnowledgeTermPayload>({ ...EMPTY_FORM });

  async function load() {
    try {
      setError("");
      const response = await fetchKnowledgeTerms();
      setItems(response.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载失败");
    }
  }

  useEffect(() => {
    void load();
  }, []);

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
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item: KnowledgeTermItem) {
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
  }

  function handleCancel() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  async function handleArchive(id: string) {
    await archiveKnowledgeTerm(id);
    await load();
  }

  async function handleRebuild() {
    await rebuildKnowledgeTerms();
    await load();
  }

  return (
    <section>
      <h2>术语库</h2>
      <p>管理文章内高亮术语和 AI 顾问优先检索的词条。创建/更新后会自动同步到 RAG 索引。</p>
      {error ? <p className="error">{error}</p> : null}

      <form className="card" onSubmit={handleSubmit}>
        <h3>{editingId ? "编辑术语" : "新增术语"}</h3>
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
              value={form.aliases.join(", ")}
              onChange={(event) => setForm((current) => ({ ...current, aliases: parseCommaList(event.target.value) }))}
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
              value={form.domains.join(", ")}
              onChange={(event) => setForm((current) => ({ ...current, domains: parseCommaList(event.target.value) }))}
              placeholder="ai, health, investment"
            />
          </label>
          <label>
            生效场景
            <input
              value={form.scenes.join(", ")}
              onChange={(event) => setForm((current) => ({ ...current, scenes: parseCommaList(event.target.value) }))}
              placeholder="article, ai-column"
            />
          </label>
          <label>
            相关文章 Slugs
            <input
              value={form.related_article_slugs.join(", ")}
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
        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? "保存中..." : editingId ? "更新术语" : "创建术语"}
          </button>
          {editingId ? (
            <button type="button" onClick={handleCancel}>取消</button>
          ) : null}
        </div>
      </form>

      <div className="actions">
        <button onClick={() => void handleRebuild()}>重建全部术语索引</button>
      </div>

      {items.map((item) => (
        <article className="card" key={item.id}>
          <div className="term-header">
            <h3>{item.term}</h3>
            <div className="term-actions">
              <button onClick={() => handleEdit(item)}>编辑</button>{" "}
              <button onClick={() => void handleArchive(item.id)}>归档</button>
            </div>
          </div>
          <p className="term-definition">{item.definition}</p>
          <p className="term-meta">
            <span className="term-status">{item.status}</span>
            {item.aliases.length > 0 ? <span>别名：{item.aliases.join(" / ")}</span> : null}
            <span>域：{item.domains.join(" / ") || "无"}</span>
            <span>场景：{item.scenes.join(" / ") || "无"}</span>
            {item.related_article_slugs.length > 0 ? (
              <span>相关文章：{item.related_article_slugs.join(" / ")}</span>
            ) : null}
            {item.notes ? <span>备注：{item.notes}</span> : null}
          </p>
        </article>
      ))}
    </section>
  );
}
