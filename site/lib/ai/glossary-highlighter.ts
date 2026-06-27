import type { GlossaryItem } from "@/lib/ai/glossary";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildGlossaryTermMap(items: GlossaryItem[]): Map<string, GlossaryItem> {
  const termMap = new Map<string, GlossaryItem>();
  for (const item of items) {
    termMap.set(item.term, item);
    for (const alias of item.aliases) {
      const normalizedAlias = alias.trim();
      if (normalizedAlias) {
        termMap.set(normalizedAlias, item);
      }
    }
  }
  return termMap;
}

function wrapTextNode(node: Text, termMap: Map<string, GlossaryItem>) {
  const text = node.textContent || "";
  const terms = Array.from(termMap.keys()).sort((left, right) => right.length - left.length);
  const pattern = terms.map(escapeRegExp).join("|");
  if (!pattern) return;
  const regex = new RegExp(`(${pattern})`, "g");
  const parts = text.split(regex);
  if (parts.length <= 1) return;

  const fragment = document.createDocumentFragment();
  for (const part of parts) {
    if (!part) continue;
    const item = termMap.get(part);
    if (item) {
      const mark = document.createElement("mark");
      mark.className = "term-highlight cursor-pointer bg-transparent border-b border-dashed border-foreground/25 text-foreground transition-all duration-200 ease-out hover:-translate-y-px hover:border-foreground/60 hover:border-solid";
      mark.dataset.term = item.term;
      mark.dataset.definition = item.definition;
      mark.dataset.explanation = item.explanation;
      mark.dataset.references = JSON.stringify(item.references || []);
      mark.textContent = part;
      fragment.appendChild(mark);
    } else {
      fragment.appendChild(document.createTextNode(part));
    }
  }
  node.parentNode?.replaceChild(fragment, node);
}

export function highlightGlossaryTerms(root: HTMLElement, termMap: Map<string, GlossaryItem>) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest("pre, code, a, button, .term-highlight, .term-highlight-ignore")) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let current: Node | null = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const node of nodes) {
    wrapTextNode(node, termMap);
  }
}
