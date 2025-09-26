/**
 * DEPRECATED: 该文件的正则 tokenizer 已被 unified + remark + rehype-react 渲染流程取代。
 * 暂时保留用于参考与对比，不再被视图逻辑引用，可在后续版本删除。
 */
export interface FrontmatterResult {
  frontmatter: Record<string, any>;
  body: string;
}

export interface MarkdownToken {
  type: 'markdown';
  content: string;
}

export interface ComponentToken {
  type: 'component';
  name: string;
  props: Record<string, string>;
  raw: string; // original raw tag
}

export type Token = MarkdownToken | ComponentToken;

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
const COMPONENT_TAG_RE = /<([A-Z][A-Za-z0-9_]*)\s*([^>]*)\/>/g; // self-closing only
const ATTR_RE = /(\w+)=(?:"([^"]*)"|'([^']*)')/g; // capture double or single quoted

/**
 * Parse YAML-like frontmatter (very lightweight) and return frontmatter object + body.
 * Quotes around values are stripped. Lines without ':' are ignored.
 */
export function parseFrontmatter(raw: string): FrontmatterResult {
  const m = raw.match(FRONTMATTER_RE);
  if (!m) return { frontmatter: {}, body: raw };
  const yaml = m[1];
  const body = m[2];
  const frontmatter: Record<string, any> = {};
  yaml.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    if (!key) return;
    const valueRaw = line.slice(idx + 1).trim();
    const cleaned = valueRaw.replace(/^['"]|['"]$/g, '');
    frontmatter[key] = cleaned;
  });
  return { frontmatter, body };
}

interface Range { start: number; end: number }

/**
 * Identify fenced code blocks ``` ... ``` and record their absolute string ranges.
 */
function collectCodeFences(body: string): Range[] {
  const lines = body.split(/\n/);
  const ranges: Range[] = [];
  let inFence = false;
  let fenceStartIdx = 0;
  let cursor = 0; // absolute index at line start
  lines.forEach((line) => {
    const lineWithNewlineLength = line.length + 1; // +1 for the split newline
    const fenceMatch = line.match(/^```/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceStartIdx = cursor;
      } else {
        // closing fence: include this line
        ranges.push({ start: fenceStartIdx, end: cursor + line.length });
        inFence = false;
      }
    }
    cursor += lineWithNewlineLength; // move cursor to next line start
  });
  // if unclosed fence, treat rest as fenced
  if (inFence) {
    ranges.push({ start: fenceStartIdx, end: body.length });
  }
  return ranges;
}

function isInsideFenced(pos: number, fences: Range[]): boolean {
  return fences.some(r => pos >= r.start && pos < r.end);
}

/**
 * Tokenize body into markdown chunks and component tokens. Only matches self-closing tags that start with capital letter.
 * Ignores component-like patterns inside fenced code blocks.
 */
export function tokenizeComponents(body: string): Token[] {
  const tokens: Token[] = [];
  const fences = collectCodeFences(body);
  let lastIndex = 0;
  COMPONENT_TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = COMPONENT_TAG_RE.exec(body))) {
    const [raw, name, attrStr] = match;
    const start = match.index;
    if (isInsideFenced(start, fences)) continue; // skip inside code fences
    // push markdown before
    if (start > lastIndex) {
      tokens.push({ type: 'markdown', content: body.slice(lastIndex, start) });
    }
    // parse attributes
    const props: Record<string, string> = {};
    ATTR_RE.lastIndex = 0;
    let am: RegExpExecArray | null;
    while ((am = ATTR_RE.exec(attrStr))) {
      const key = am[1];
      const val = (am[2] ?? am[3] ?? '').trim();
      props[key] = val;
    }
    tokens.push({ type: 'component', name, props, raw });
    lastIndex = start + raw.length;
  }
  if (lastIndex < body.length) {
    tokens.push({ type: 'markdown', content: body.slice(lastIndex) });
  }
  return tokens;
}
