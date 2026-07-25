import type { GlossaryItem } from "@/lib/ai/glossary";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAsciiTokenCharacter(value: string): boolean {
  return /[A-Za-z0-9]/.test(value);
}

function isEmbeddedInAsciiToken(text: string, start: number, term: string): boolean {
  if (!containsAsciiTokenCharacter(term)) return false;

  const previous = text[start - 1] || "";
  const next = text[start + term.length] || "";
  return /[A-Za-z0-9_.-]/.test(previous) || /[A-Za-z0-9_.-]/.test(next);
}

export function buildGlossaryTermMap(items: GlossaryItem[]): Map<string, GlossaryItem> {
  const candidates = new Map<string, Array<{ item: GlossaryItem; isTerm: boolean }>>();

  const addCandidate = (key: string, item: GlossaryItem, isTerm: boolean) => {
    const normalizedKey = key.trim();
    if (!normalizedKey) return;
    const values = candidates.get(normalizedKey) || [];
    if (!values.some((value) => value.item.id === item.id && value.isTerm === isTerm)) {
      values.push({ item, isTerm });
      candidates.set(normalizedKey, values);
    }
  };

  for (const item of items) {
    addCandidate(item.term, item, true);
    for (const alias of item.aliases) {
      addCandidate(alias, item, false);
    }
  }

  const termMap = new Map<string, GlossaryItem>();
  for (const [key, values] of candidates) {
    const uniqueItems = new Map(values.map((value) => [value.item.id, value.item]));
    const terms = new Map(values.filter((value) => value.isTerm).map((value) => [value.item.id, value.item]));

    if (terms.size === 1) {
      const [item] = terms.values();
      if (item) termMap.set(key, item);
    } else if (terms.size === 0 && uniqueItems.size === 1) {
      const [item] = uniqueItems.values();
      if (item) termMap.set(key, item);
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
  const matches = Array.from(text.matchAll(regex));
  if (matches.length === 0) return;

  const fragment = document.createDocumentFragment();
  let offset = 0;
  let hasHighlight = false;
  for (const match of matches) {
    const part = match[0];
    const start = match.index || 0;
    if (start > offset) {
      fragment.appendChild(document.createTextNode(text.slice(offset, start)));
    }

    const item = termMap.get(part);
    if (item && !isEmbeddedInAsciiToken(text, start, part)) {
      const mark = document.createElement("mark");
      mark.className = "term-highlight cursor-pointer bg-transparent border-b border-dashed border-foreground/25 text-foreground transition-all duration-200 ease-out hover:-translate-y-px hover:border-foreground/60 hover:border-solid";
      mark.dataset.term = item.term;
      mark.dataset.definition = item.definition;
      mark.dataset.explanation = item.explanation;
      mark.dataset.references = JSON.stringify(item.references || []);
      mark.textContent = part;
      fragment.appendChild(mark);
      hasHighlight = true;
    } else {
      fragment.appendChild(document.createTextNode(part));
    }
    offset = start + part.length;
  }

  if (offset < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(offset)));
  }

  if (!hasHighlight) return;
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
