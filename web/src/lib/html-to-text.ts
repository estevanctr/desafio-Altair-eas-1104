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
