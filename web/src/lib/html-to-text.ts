const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => ENTITY_MAP[name] ?? match);
}

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "TR",
  "SECTION",
  "ARTICLE",
  "BLOCKQUOTE",
]);

function walkDomToText(node: Node, out: string[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    out.push(node.textContent ?? "");
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  const tag = element.tagName.toUpperCase();
  if (tag === "STYLE" || tag === "SCRIPT" || tag === "HEAD") return;
  if (tag === "BR") {
    out.push("\n");
    return;
  }

  const isBlock = BLOCK_TAGS.has(tag);
  if (isBlock) out.push("\n\n");
  for (const child of Array.from(element.childNodes)) {
    walkDomToText(child, out);
  }
  if (isBlock) out.push("\n\n");
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToRichText(html: string): string {
  if (!html) return "";
  if (typeof window !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const out: string[] = [];
    walkDomToText(doc.body, out);
    return normalizeWhitespace(out.join(""));
  }
  const withBreaks = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  return normalizeWhitespace(decodeEntities(withBreaks));
}

export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("style, script, head").forEach((node) => node.remove());
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  const stripped = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}
