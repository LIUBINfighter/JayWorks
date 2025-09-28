// highlight.js 按需引入（无类型声明，使用 ts-ignore）
// @ts-ignore
import hljs from 'highlight.js/lib/core';
// 行号插件按需引入（其会向 hljs 增加 lineNumbersBlock 方法）
// @ts-ignore
import 'highlightjs-line-numbers.js';

// 某些场景下（被打包为 CJS 且运行在 Obsidian sandbox 中） highlightjs-line-numbers.js
// 可能通过 (function(root){ ... root.hljs ... })(this) 方式访问全局 hljs。
// esbuild 打包后未自动将模块导出的 hljs 赋值到 window/globalThis，导致其报 "highlight.js not detected"。
// 这里显式挂载一次，幂等且安全。
// @ts-ignore
if (typeof globalThis !== 'undefined' && !globalThis.hljs) {
  // @ts-ignore
  globalThis.hljs = hljs;
}
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
  // jsx/tsx 仍可用 ts 解析（高亮接近预期）
  try {
    hljs.registerLanguage('tsx', ts);
    hljs.registerLanguage('jsx', ts);
  } catch (_) { /* ignore duplicate */ }
  hljs.registerLanguage('js', js);
  hljs.registerLanguage('javascript', js);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('sh', bash);
  hljs.registerLanguage('markdown', md);
  hljs.registerLanguage('md', md);
  registered = true;
}

// 立即执行一次注册，避免首次调用 highlight* 时才注册导致的首屏延迟或空白闪烁。
// 这样打包后 highlight.js 与所需语言在插件加载阶段即完成初始化。
ensure();

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
  try {
    // 一些版本/打包情形下 lineNumbersBlock 挂在 hljs.default 或 hljs 上，再做一次兜底
    // @ts-ignore
    const lnb = hljs.lineNumbersBlock || (hljs.default && hljs.default.lineNumbersBlock);
    if (typeof lnb === 'function') lnb(el);
  } catch (e) { /* ignore */ }
}

export { hljs };

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s] as string));
}

/**
 * 将源码静态高亮并生成带行号/可选 diff / 指定行高亮 的 HTML 结构。
 * 结构与 highlightjs-line-numbers.js 输出保持兼容：
 * <code class="hljs language-xxx"><table class="hljs-ln">...</table></code>
 */
export function renderHighlightedHtml(code: string, lang?: string, opts: { highlightLines?: number[] } = {}) {
  ensure();
  const { highlightLines } = opts;
  let highlighted = '';
  // 保留原始行用于 diff / 指定行标记
  const rawTrimmed = code.replace(/\n$/,'');
  const rawLines = rawTrimmed.split('\n');
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(rawTrimmed, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(rawTrimmed).value;
    }
  } catch {
    highlighted = escapeHtml(rawTrimmed);
  }
  const highlightedLines = highlighted.split('\n');
  const rows: string[] = [];
  for (let i=0;i<rawLines.length;i++) {
    const lineNumber = i+1;
    // 若高亮后的行数不一致（极罕见），使用空字符串兜底
    const lineHtml = highlightedLines[i] ?? '';
    const raw = rawLines[i];
    const trimmed = raw.trimStart();
    const classes: string[] = ['hljs-ln-line'];
    if (trimmed.startsWith('@@')) classes.push('diff-hunk');
    else if (trimmed.startsWith('+') && !trimmed.startsWith('+++')) classes.push('diff-add');
    else if (trimmed.startsWith('-') && !trimmed.startsWith('---')) classes.push('diff-del');
    if (highlightLines && highlightLines.includes(lineNumber)) classes.push('highlight-line');
    rows.push(`<tr class="${classes.join(' ')}" data-line="${lineNumber}"><td class="hljs-ln-numbers" data-line-number="${lineNumber}"></td><td class="hljs-ln-code"><span>${lineHtml || '&nbsp;'}</span></td></tr>`);
  }
  const table = `<table class="hljs-ln"><tbody>${rows.join('')}</tbody></table>`;
  const codeEl = `<code class="hljs${lang? ' language-'+lang: ''}">${table}</code>`;
  return { html: codeEl };
}
