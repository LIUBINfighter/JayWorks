import type { AgentTool, AgentToolContext, ToolRunResult } from '../types';
import type { TFile } from 'obsidian';

async function openFile(ctx: AgentToolContext, path: string): Promise<ToolRunResult> {
  const abs = ctx.app.vault.getAbstractFileByPath(path);
  if (!abs || (abs as any).extension === undefined) {
    return { success: false, message: `文件不存在: ${path}` };
  }
  await ctx.app.workspace.getLeaf(true).openFile(abs as TFile);
  return { success: true, message: `已打开 ${path}` };
}

async function createFile(ctx: AgentToolContext, path: string, content?: string): Promise<ToolRunResult> {
  if (ctx.app.vault.getAbstractFileByPath(path)) {
    return { success: false, message: `文件已存在: ${path}` };
  }
  const folder = path.split('/').slice(0, -1).join('/');
  if (folder && !ctx.app.vault.getAbstractFileByPath(folder)) {
    await ctx.app.vault.createFolder(folder);
  }
  const file = await ctx.app.vault.create(path, content || '');
  await ctx.app.workspace.getLeaf(true).openFile(file);
  return { success: true, message: `已创建并打开 ${path}` };
}

async function insertOrAppend(ctx: AgentToolContext, text: string, append: boolean): Promise<ToolRunResult> {
  const leaf = ctx.app.workspace.getMostRecentLeaf();
  const view: any = leaf?.view;
  const editor = view?.editor;
  if (!editor) return { success: false, message: '没有可编辑的 markdown 视图' };
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

async function searchText(ctx: AgentToolContext, query: string): Promise<ToolRunResult> {
  const files = ctx.app.vault.getMarkdownFiles();
  const hits: string[] = [];
  for (const f of files) {
    const content = await ctx.app.vault.read(f);
    if (content.includes(query)) hits.push(f.path);
  }
  return { success: true, message: `匹配 ${hits.length} 个文件`, data: hits.slice(0, 20), meta: { total: hits.length } };
}

async function listRecent(ctx: AgentToolContext, limit = 5): Promise<ToolRunResult> {
  const files = ctx.app.vault.getMarkdownFiles()
    .sort((a, b) => b.stat.mtime - a.stat.mtime)
    .slice(0, limit);
  return { success: true, message: `最近文件 ${files.length} 个`, data: files.map(f => f.path) };
}

export const basicTools: AgentTool[] = [
  {
    name: 'open_file',
    description: '打开指定路径的 markdown 文件',
    params: { path: '文件路径 (含扩展名)' },
    async run(ctx, p: { path: string }) { return openFile(ctx, p.path); }
  },
  {
    name: 'create_file',
    description: '创建并打开一个新文件，可包含初始内容',
    params: { path: '文件路径', content: '可选 初始内容' },
    dangerous: true,
    async run(ctx, p: { path: string; content?: string }) { return createFile(ctx, p.path, p.content); }
  },
  {
    name: 'insert_text',
    description: '在当前光标处插入文本',
    params: { text: '要插入的内容' },
    dangerous: true,
    async run(ctx, p: { text: string }) { return insertOrAppend(ctx, p.text, false); }
  },
  {
    name: 'append_text',
    description: '在当前文件末尾追加文本',
    params: { text: '要追加的内容' },
    dangerous: true,
    async run(ctx, p: { text: string }) { return insertOrAppend(ctx, p.text, true); }
  },
  {
    name: 'search_text',
    description: '全文搜索包含关键词的文件',
    params: { query: '关键词' },
    async run(ctx, p: { query: string }) { return searchText(ctx, p.query); }
  },
  {
    name: 'list_recent',
    description: '列出最近修改的 markdown 文件',
    params: { limit: '数量 (默认5)' },
    async run(ctx, p: { limit?: number }) { return listRecent(ctx, p.limit); }
  }
];
