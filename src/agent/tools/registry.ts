import type { AnyAgentTool, ParseResult, RegisteredToolInvocation } from './types';
import { basicTools } from './impl/basicTools';

// 简单内存注册表（后续可支持动态启用/禁用 & 权限）
const toolList: AnyAgentTool[] = [...basicTools];
const toolMap = new Map(toolList.map(t => [t.name, t]));

export function listTools() { return toolList; }
export function getTool(name: string) { return toolMap.get(name); }

// 解析行格式：
// open_file path=笔记/ABC.md
// create_file path=Drafts/T1.md content=初始文本
// insert_text text=你好
// 支持 value 中包含空格: 使用 "quoted value"
export function parseToolInvocations(raw: string): ParseResult {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const invocations: RegisteredToolInvocation[] = [];
  const errors: string[] = [];
  for (const line of lines) {
    const [first, ...rest] = line.split(/\s+/);
    const tool = getTool(first);
    if (!tool) { errors.push(`未知工具: ${first}`); continue; }
    const params: any = {};
    const paramTokens = rest.join(' ').match(/([^\s=]+)=("[^"]*"|'[^']*'|[^\s"]+)/g) || [];
    for (const token of paramTokens) {
      const eq = token.indexOf('=');
      if (eq === -1) continue;
      const key = token.slice(0, eq).trim();
      let value = token.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      params[key] = value;
    }
    invocations.push({ tool, raw: line, params });
  }
  return { invocations, errors };
}
