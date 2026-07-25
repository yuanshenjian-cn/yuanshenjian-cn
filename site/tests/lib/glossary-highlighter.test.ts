import { describe, expect, it } from "vitest";
import { buildGlossaryTermMap, highlightGlossaryTerms } from "@/lib/ai/glossary-highlighter";
import type { GlossaryItem } from "@/lib/ai/glossary";

function glossaryItem(overrides: Partial<GlossaryItem> = {}): GlossaryItem {
  return {
    id: "term-1",
    term: "Auto Mode",
    aliases: ["Auto"],
    definition: "定义",
    explanation: "解释",
    related_article_slugs: [],
    references: [],
    ...overrides,
  };
}

function highlight(text: string, items: GlossaryItem[]) {
  const root = document.createElement("div");
  root.textContent = text;
  highlightGlossaryTerms(root, buildGlossaryTermMap(items));
  return root;
}

describe("buildGlossaryTermMap", () => {
  it("优先使用精确术语，不受其他术语别名覆盖", () => {
    const exactTerm = glossaryItem({ id: "exact", term: "MCP", aliases: [] });
    const aliasOwner = glossaryItem({ id: "alias", term: "Model Context Protocol", aliases: ["MCP"] });

    expect(buildGlossaryTermMap([aliasOwner, exactTerm]).get("MCP")).toBe(exactTerm);
  });

  it("跳过归属多个术语的歧义别名", () => {
    const first = glossaryItem({ id: "first", term: "AI Agent", aliases: ["Agent"] });
    const second = glossaryItem({ id: "second", term: "AI 代理", aliases: ["Agent"] });

    expect(buildGlossaryTermMap([first, second]).has("Agent")).toBe(false);
  });
});

describe("highlightGlossaryTerms", () => {
  it("只高亮完整英文术语，不切入产品名或复合标识符", () => {
    const root = highlight(
      "Auto Mode、MCP、TDD、AutomationBench、Auto-switching、Automations、MCPMark、MCP-Atlas、ARC-AGI、NVIDIA、subagent_type、JavaScript、EXPENSIVE、MSCI、Computer、TDDer",
      [
        glossaryItem(),
        glossaryItem({ id: "mcp", term: "MCP", aliases: [] }),
        glossaryItem({ id: "agi", term: "AGI", aliases: [] }),
        glossaryItem({ id: "di", term: "依赖注入", aliases: ["DI"] }),
        glossaryItem({ id: "sub-agent", term: "Sub Agent", aliases: ["subagent"] }),
        glossaryItem({ id: "java", term: "Java", aliases: [] }),
        glossaryItem({ id: "xp", term: "XP", aliases: [] }),
        glossaryItem({ id: "ci", term: "持续集成", aliases: ["CI"] }),
        glossaryItem({ id: "compute", term: "算力", aliases: ["Compute"] }),
        glossaryItem({ id: "tdd", term: "TDD", aliases: [] }),
      ],
    );

    expect(Array.from(root.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual(["Auto Mode", "MCP", "TDD"]);
    expect(root.textContent).toContain("AutomationBench");
    expect(root.textContent).toContain("Auto-switching");
    expect(root.textContent).toContain("MCPMark");
    expect(root.textContent).toContain("ARC-AGI");
    expect(root.textContent).toContain("NVIDIA");
    expect(root.textContent).toContain("subagent_type");
    expect(root.textContent).toContain("JavaScript");
    expect(root.textContent).toContain("EXPENSIVE");
    expect(root.textContent).toContain("MSCI");
    expect(root.textContent).toContain("Computer");
    expect(root.textContent).toContain("TDDer");
  });

  it("保留中文相邻的英文术语高亮", () => {
    const root = highlight("用 MCP连接工具", [glossaryItem({ term: "MCP", aliases: [] })]);

    expect(root.querySelector("mark")?.textContent).toBe("MCP");
  });
});
