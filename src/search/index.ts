import { docRegistry } from '../docs/registry';

// 字段权重
const FIELD_WEIGHT = { title: 5, description: 2, body: 1 } as const;

export interface SearchHit { id: string; score: number; title: string; description?: string; snippet?: string }

interface Posting { id: string; tf: number; fields: number }
interface StoreMeta { title: string; description?: string; body: string }

interface InvertedIndex {
  vocab: Record<string, Posting[]>;
  meta: Record<string, StoreMeta>;
  total: number;
}

const index: InvertedIndex = { vocab: {}, meta: {}, total: 0 };
let built = false;

function stripFrontmatter(src: string): string { return src.replace(/^---[\s\S]*?---/, ''); }
function stripCode(src: string): string { return src.replace(/```[\s\S]*?```/g, ''); }
function stripJsx(src: string): string { return src.replace(/<[^>]+>/g, ' '); }
function collapseSpaces(s: string): string { return s.replace(/\s+/g, ' ').trim(); }

function plainBody(raw: string): string {
  return collapseSpaces(stripJsx(stripCode(stripFrontmatter(raw))));
}

function tokenize(text: string): string[] {
  if (!text) return [];
  const m = text.toLowerCase().match(/[\p{L}\p{N}]{1,}/gu);
  return m ? m.slice(0, 5000) : []; // 简单截断防御
}

function addPosting(token: string, docId: string, fieldMask: number, count: number) {
  if (!index.vocab[token]) index.vocab[token] = [];
  index.vocab[token].push({ id: docId, tf: count, fields: fieldMask });
}

export function buildIndex(force = false) {
  if (built && !force) return;
  const docs = docRegistry.list();
  for (const rec of docs) {
    const id = rec.meta.id;
    const raw = rec.raw || '';
    const body = plainBody(raw);
    const title = rec.meta.title || id;
    const description = rec.meta.description || '';
    index.meta[id] = { title, description, body };
    const tTitle = tokenize(title);
    const tDesc = tokenize(description);
    const tBody = tokenize(body);
    const freqMap: Record<string, { title: number; desc: number; body: number }> = {};
    for (const t of tTitle) (freqMap[t] ||= { title:0, desc:0, body:0 }).title++;
    for (const t of tDesc) (freqMap[t] ||= { title:0, desc:0, body:0 }).desc++;
    for (const t of tBody) (freqMap[t] ||= { title:0, desc:0, body:0 }).body++;
    for (const [tok, counts] of Object.entries(freqMap)) {
      const mask = (counts.title?1:0) | (counts.desc?2:0) | (counts.body?4:0);
      const tf = counts.title + counts.desc + counts.body;
      addPosting(tok, id, mask, tf);
    }
  }
  index.total = Object.keys(index.meta).length;
  built = true;
}

function fieldBoost(mask: number): number {
  let boost = 0;
  if (mask & 1) boost += FIELD_WEIGHT.title;
  if (mask & 2) boost += FIELD_WEIGHT.description;
  if (mask & 4) boost += FIELD_WEIGHT.body;
  return boost || 1;
}

export function querySearch(q: string, limit = 20): SearchHit[] {
  if (!built) buildIndex();
  const tokens = tokenize(q).filter(t => t.length >= 2); // MVP: 忽略单字符
  if (!tokens.length) return [];
  const scores = new Map<string, number>();
  for (const tok of tokens) {
    const postings = index.vocab[tok];
    if (!postings) continue;
    const df = postings.length;
    const idf = Math.log(1 + index.total / df);
    for (const p of postings) {
      const prev = scores.get(p.id) || 0;
      const score = prev + (1 + Math.log(p.tf)) * idf * fieldBoost(p.fields);
      scores.set(p.id, score);
    }
  }
  const hits: SearchHit[] = [];
  for (const [id, score] of scores.entries()) {
    const meta = index.meta[id];
    if (!meta) continue;
    hits.push({ id, score, title: meta.title, description: meta.description });
  }
  hits.sort((a,b)=> b.score - a.score);
  return hits.slice(0, limit);
}

export function getTokens(q: string): string[] { return tokenize(q); }
