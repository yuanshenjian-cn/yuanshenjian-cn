import { useEffect, useState } from "react";

import {
  archiveKnowledgeSource,
  createKnowledgeSource,
  fetchKnowledgeSources,
  rebuildKnowledgeSource,
  type KnowledgeSourceItem,
  updateKnowledgeSource,
} from "../api/client";

const EMPTY_FORM = {
  name: "",
  source_kind: "manual",
  domains: "",
  scenes: "",
  status: "enabled",
  source_uri: "",
  sync_strategy: "manual",
  notes: "",
  updated_by: "admin",
};

export function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeSourceItem[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  async function load() {
    try {
      setError("");
      const response = await fetchKnowledgeSources();
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
        domains: form.domains.split(",").map((item) => item.trim()).filter(Boolean),
        scenes: form.scenes.split(",").map((item) => item.trim()).filter(Boolean),
        content_config: {},
      };
      if (editingId) {
        await updateKnowledgeSource(editingId, payload);
      } else {
        await createKnowledgeSource(payload);
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

  function handleEdit(item: KnowledgeSourceItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      source_kind: item.source_kind,
      domains: item.domains.join(", "),
      scenes: item.scenes.join(", "),
      status: item.status,
      source_uri: item.source_uri ?? "",
      sync_strategy: item.sync_strategy,
      notes: item.notes ?? "",
      updated_by: item.updated_by ?? "admin",
    });
  }

  async function handleArchive(id: string) {
    await archiveKnowledgeSource(id);
    await load();
  }

  async function handleRebuild(id: string) {
    await rebuildKnowledgeSource(id);
    await load();
  }

  return (
    <section>
      <h2>知识库</h2>
      <p>管理场景顾问使用的知识源、启停状态和重建索引。</p>
      {error ? <p className="error">{error}</p> : null}

      <form className="card" onSubmit={handleSubmit}>
        <h3>{editingId ? "编辑知识源" : "新增知识源"}</h3>
        <div className="grid">
          <label>
            名称
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            类型
            <input value={form.source_kind} onChange={(event) => setForm((current) => ({ ...current, source_kind: event.target.value }))} />
          </label>
          <label>
            域
            <input value={form.domains} onChange={(event) => setForm((current) => ({ ...current, domains: event.target.value }))} placeholder="ai, health" />
          </label>
          <label>
            场景
            <input value={form.scenes} onChange={(event) => setForm((current) => ({ ...current, scenes: event.target.value }))} placeholder="article, ai-column" />
          </label>
          <label>
            状态
            <input value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} />
          </label>
          <label>
            同步策略
            <input value={form.sync_strategy} onChange={(event) => setForm((current) => ({ ...current, sync_strategy: event.target.value }))} />
          </label>
          <label>
            来源地址
            <input value={form.source_uri} onChange={(event) => setForm((current) => ({ ...current, source_uri: event.target.value }))} />
          </label>
          <label>
            更新人
            <input value={form.updated_by} onChange={(event) => setForm((current) => ({ ...current, updated_by: event.target.value }))} />
          </label>
        </div>
        <label>
          备注
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} />
        </label>
        <button type="submit" disabled={saving}>{saving ? "保存中..." : editingId ? "更新知识源" : "创建知识源"}</button>
      </form>

      {items.map((item) => (
        <article className="card" key={item.id}>
          <h3>{item.name}</h3>
          <p>类型：{item.source_kind}</p>
          <p>状态：{item.status}</p>
          <p>域：{item.domains.join(" / ") || "无"}</p>
          <p>场景：{item.scenes.join(" / ") || "无"}</p>
          <p>同步：{item.sync_strategy}</p>
          {item.source_uri ? <p>来源：{item.source_uri}</p> : null}
          {item.notes ? <p>备注：{item.notes}</p> : null}
          <button onClick={() => handleEdit(item)}>编辑</button>{" "}
          <button onClick={() => void handleRebuild(item.id)}>重建索引</button>{" "}
          <button onClick={() => void handleArchive(item.id)}>归档</button>
        </article>
      ))}
    </section>
  );
}
