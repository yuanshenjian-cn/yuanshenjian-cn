/**
 * 小工具（Tools）类型定义
 */

/** 列表页的展示模式：卡片 / 列表 */
export type ToolViewMode = "card" | "list";

/**
 * 小工具元信息。
 *
 * 唯一数据源是 `site/data/tools.json`，新增工具时只需追加一条记录，
 * 并把 HTML 放到 `site/public/tools/<slug>/index.html`。
 */
export interface ToolMeta {
  /** 唯一标识，同时作为静态资源目录名：/tools/<slug>/index.html */
  slug: string;
  title: string;
  /** 一句话说明，列表页与详情页共用 */
  description: string;
  /** 卡片上的展示符号，缺省为 🧩 */
  emoji?: string;
  /** 分类标签，用于列表页轻量筛选展示 */
  tags?: string[];
  /** 上线日期（YYYY-MM-DD），用于排序 */
  addedAt?: string;
  /** 手动排序位，数值小的靠前；设置后优先于 featured 与 addedAt */
  order?: number;
  /** 置顶展示（未设置 order 时生效） */
  featured?: boolean;
}
