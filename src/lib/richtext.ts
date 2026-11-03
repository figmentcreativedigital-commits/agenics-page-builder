/*
  Rich text for paragraph slots, stored as a small Markdown subset so the brief
  reads naturally and nothing unsafe can be stored:
    **bold**   _italic_   [link text](/shop/p/rapidcheck)
  A backslash escapes the next character. Works on the server and in the browser.
*/

export type RNode = { t: "text"; v: string } | { t: "b"; c: RNode[] } | { t: "i"; c: RNode[] } | { t: "a"; href: string; c: RNode[] };

type Stop = "**" | "_" | "]" | null;

function parse(s: string, start: number, stop: Stop): { nodes: RNode[]; i: number; closed: boolean } {
  const nodes: RNode[] = [];
  let buf = "";
  let i = start;
  const flush = () => {
    if (buf) nodes.push({ t: "text", v: buf });
    buf = "";
  };
  while (i < s.length) {
    const ch = s[i];
    if (ch === "\\" && i + 1 < s.length) {
      buf += s[i + 1];
      i += 2;
      continue;
    }
    if (stop === "**" && s.startsWith("**", i)) {
      flush();
      return { nodes, i: i + 2, closed: true };
    }
    if (stop === "_" && ch === "_") {
      flush();
      return { nodes, i: i + 1, closed: true };
    }
    if (stop === "]" && ch === "]") {
      flush();
      return { nodes, i: i + 1, closed: true };
    }
    if (s.startsWith("**", i)) {
      const r = parse(s, i + 2, "**");
      if (r.closed && r.nodes.length) {
        flush();
        nodes.push({ t: "b", c: r.nodes });
        i = r.i;
        continue;
      }
      buf += "**";
      i += 2;
      continue;
    }
    if (ch === "_") {
      const r = parse(s, i + 1, "_");
      if (r.closed && r.nodes.length) {
        flush();
        nodes.push({ t: "i", c: r.nodes });
        i = r.i;
        continue;
      }
      buf += "_";
      i += 1;
      continue;
    }
    if (ch === "[") {
      const r = parse(s, i + 1, "]");
      if (r.closed && s[r.i] === "(") {
        const end = s.indexOf(")", r.i + 1);
        if (end > -1) {
          flush();
          nodes.push({ t: "a", href: s.slice(r.i + 1, end).trim(), c: r.nodes });
          i = end + 1;
          continue;
        }
      }
      buf += "[";
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  flush();
  return { nodes, i, closed: false };
}

export function parseRich(s: string): RNode[] {
  return parse(s ?? "", 0, null).nodes;
}

const flatten = (nodes: RNode[]): string => nodes.map((n) => (n.t === "text" ? n.v : flatten(n.c))).join("");

/** The words a reader sees, for counting and checks. */
export function plainText(s: string): string {
  return flatten(parseRich(s));
}

/** Every link written inside the text. */
export function inlineLinks(s: string): { text: string; href: string }[] {
  const out: { text: string; href: string }[] = [];
  const walk = (nodes: RNode[]) =>
    nodes.forEach((n) => {
      if (n.t === "a") out.push({ text: flatten(n.c), href: n.href });
      if (n.t !== "text") walk(n.c);
    });
  walk(parseRich(s));
  return out;
}

export const hasFormatting = (s: string) => parseRich(s).some((n) => n.t !== "text");

const escText = (t: string) => t.replace(/\\/g, "\\\\").replace(/\*/g, "\\*").replace(/_/g, "\\_").replace(/\]\(/g, "]\\(");
const escHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML for the editor (contentEditable). Built from parsed nodes, so it only ever holds b, i and a. */
export function richToHtml(s: string): string {
  const html = (nodes: RNode[]): string =>
    nodes
      .map((n) => {
        if (n.t === "text") return escHtml(n.v);
        if (n.t === "b") return `<b>${html(n.c)}</b>`;
        if (n.t === "i") return `<i>${html(n.c)}</i>`;
        return `<a href="${escHtml(n.href)}">${html(n.c)}</a>`;
      })
      .join("");
  return html(parseRich(s));
}

/** Read the editor's DOM back into the stored format. Unknown tags keep only their text. */
export function domToRich(root: Node): string {
  const ser = (node: Node, inB: boolean, inI: boolean): string => {
    if (node.nodeType === 3) return escText((node.nodeValue ?? "").replace(/\u00a0/g, " "));
    if (node.nodeType !== 1) return "";
    const el = node as HTMLElement;
    const tag = el.tagName;
    if (tag === "BR") return " ";
    const weight = el.style?.fontWeight;
    const bold = !inB && (tag === "B" || tag === "STRONG" || weight === "bold" || Number(weight) >= 600);
    const italic = !inI && (tag === "I" || tag === "EM" || el.style?.fontStyle === "italic");
    let inner = Array.from(el.childNodes)
      .map((c) => ser(c, inB || bold, inI || italic))
      .join("");
    if (tag === "A") {
      const href = (el.getAttribute("href") ?? "").replace(/\)/g, "%29").replace(/\s/g, "%20");
      return inner.trim() ? `[${inner}](${href})` : inner;
    }
    if (italic && inner.trim()) inner = `_${inner}_`;
    if (bold && inner.trim()) inner = `**${inner}**`;
    if (tag === "DIV" || tag === "P") inner = ` ${inner}`;
    return inner;
  };
  return Array.from(root.childNodes)
    .map((c) => ser(c, false, false))
    .join("")
    .replace(/[ \t\n]+/g, " ");
}
