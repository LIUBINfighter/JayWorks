// highlight.js 按需引入（无类型声明，使用 ts-ignore）
// @ts-ignore
import hljs from 'highlight.js/lib/core';
// 行号插件按需引入（其会向 hljs 增加 lineNumbersBlock 方法）
// @ts-ignore
import 'highlightjs-line-numbers.js';
// @ts-ignore
import ts from 'highlight.js/lib/languages/typescript';
// @ts-ignore
import js from 'highlight.js/lib/languages/javascript';
// @ts-ignore
import json from 'highlight.js/lib/languages/json';
// @ts-ignore
import bash from 'highlight.js/lib/languages/bash';
// @ts-ignore
import md from 'highlight.js/lib/languages/markdown';

let registered = false;
function ensure() {
  if (registered) return;
  hljs.registerLanguage('ts', ts);
  hljs.registerLanguage('typescript', ts);
  hljs.registerLanguage('js', js);
  hljs.registerLanguage('javascript', js);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('sh', bash);
  hljs.registerLanguage('markdown', md);
  hljs.registerLanguage('md', md);
  registered = true;
}

export function highlight(code: string, lang?: string): { __html: string } {
  ensure();
  if (lang && hljs.getLanguage(lang)) {
    try { return { __html: hljs.highlight(code, { language: lang }).value }; } catch (e) { /* fallback below */ }
  }
  try { return { __html: hljs.highlightAuto(code).value }; } catch (e) { return { __html: escapeHtml(code) }; }
}

export function highlightElement(el: HTMLElement, langHint?: string) {
  ensure();
  if (langHint && !el.classList.contains('language-' + langHint)) {
    el.classList.add('language-' + langHint);
  }
  // @ts-ignore
  hljs.highlightElement(el);
  // 如果插件已加载，添加行号
  // @ts-ignore
  if (typeof hljs.lineNumbersBlock === 'function') {
    try { // @ts-ignore
      hljs.lineNumbersBlock(el); } catch (e) { /* ignore */ }
  }
}

export { hljs };

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s] as string));
}
