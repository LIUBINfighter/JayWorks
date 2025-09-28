import type { App, TFile } from 'obsidian';

// 定义动作类型
export type AgentAction =
  | { type: 'open'; path: string }
  | { type: 'create'; path: string; content?: string }
  | { type: 'insert'; text: string }
  | { type: 'append'; text: string }
  | { type: 'search'; query: string };

export interface AgentLogEntry {
  ts: number;
  level: 'info' | 'error' | 'warn' | 'success';
  message: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

// 简单自然语言/行指令解析
// 支持：
//   打开 xxx
//   创建 xxx
//   创建 xxx: 初始内容
//   插入 xxx
//   追加 xxx
//   搜索 关键词
// 英文别名: open/create/insert/append/search
export function parseInputToActions(input: string): AgentAction[] {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const actions: AgentAction[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('打开 ') || lower.startsWith('open ')) {
      actions.push({ type: 'open', path: line.replace(/^\S+\s+/, '').trim() });
      continue;
    }
    if (lower.startsWith('创建 ') || lower.startsWith('create ')) {
      const rest = line.replace(/^\S+\s+/, '');
      const [p, ...c] = rest.split(':');
      actions.push({ type: 'create', path: p.trim(), content: c.length ? c.join(':').trim() : undefined });
      continue;
    }
    if (lower.startsWith('插入 ') || lower.startsWith('insert ')) {
      actions.push({ type: 'insert', text: line.replace(/^\S+\s+/, '') });
      continue;
    }
    if (lower.startsWith('追加 ') || lower.startsWith('append ')) {
      actions.push({ type: 'append', text: line.replace(/^\S+\s+/, '') });
      continue;
    }
    if (lower.startsWith('搜索 ') || lower.startsWith('search ')) {
      actions.push({ type: 'search', query: line.replace(/^\S+\s+/, '') });
      continue;
    }
    throw new Error('无法解析指令: ' + line);
  }
  return actions;
}

export async function executeAction(app: App, action: AgentAction): Promise<ActionResult> {
  switch (action.type) {
    case 'open':
      return openFile(app, action.path);
    case 'create':
      return createFile(app, action.path, action.content);
    case 'insert':
      return insertText(app, action.text, false);
    case 'append':
      return insertText(app, action.text, true);
    case 'search':
      return runSearch(app, action.query);
    default:
      return { success: false, message: '未知动作' };
  }
}

async function openFile(app: App, path: string): Promise<ActionResult> {
  const abstract = app.vault.getAbstractFileByPath(path);
  if (!abstract || (abstract as any).extension === undefined) { // 通过是否有 extension 近似判断 TFile
    return { success: false, message: `未找到文件: ${path}` };
  }
  const file = abstract as TFile;
  const leaf = app.workspace.getLeaf(true);
  await leaf.openFile(file);
  return { success: true, message: `已打开 ${path}` };
}

async function createFile(app: App, path: string, content?: string): Promise<ActionResult> {
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing) {
    return { success: false, message: `文件已存在: ${path}` };
  }
  const folder = path.split('/').slice(0, -1).join('/');
  if (folder && !app.vault.getAbstractFileByPath(folder)) {
    await app.vault.createFolder(folder);
  }
  const file = await app.vault.create(path, content || '');
  const leaf = app.workspace.getLeaf(true);
  await leaf.openFile(file);
  return { success: true, message: `已创建并打开 ${path}` };
}

async function insertText(app: App, text: string, append: boolean): Promise<ActionResult> {
  const leaf = app.workspace.getMostRecentLeaf();
  const view: any = leaf?.view;
  const editor = view?.editor;
  if (!editor) return { success: false, message: '当前没有可编辑的 markdown 文件' };
  if (append) {
    const line = editor.lastLine();
    editor.replaceRange('\n' + text, { line: line + 1, ch: 0 });
    return { success: true, message: '已追加文本' };
  } else {
    const cursor = editor.getCursor();
    editor.replaceRange(text, cursor);
    return { success: true, message: '已插入文本' };
  }
}

async function runSearch(app: App, query: string): Promise<ActionResult> {
  // 简化：仅统计匹配文件数量
  const files = app.vault.getMarkdownFiles();
  let count = 0;
  for (const f of files) {
    const content = await app.vault.read(f);
    if (content.includes(query)) count++;
  }
  return { success: true, message: `搜索完成：${count} 个文件包含 "${query}"` };
}
