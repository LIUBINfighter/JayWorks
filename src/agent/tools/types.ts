import type { App } from 'obsidian';

export interface AgentToolContext {
  app: App;
}

export interface ToolRunResult<T = any> {
  success: boolean;
  data?: T;
  message: string;
  meta?: Record<string, any>;
}

export interface AgentTool<Params = any, Result = any> {
  /** 唯一名称（供模型 / 解析器引用） */
  name: string;
  /** 人类可读描述 */
  description: string;
  /** 简单参数描述（无需 JSON Schema，保持轻量） */
  params?: Record<string, string>;
  /** 是否可能修改用户数据（用于权限/提示） */
  dangerous?: boolean;
  /** 运行 */
  run(context: AgentToolContext, params: Params): Promise<ToolRunResult<Result>>;
}

export type AnyAgentTool = AgentTool<any, any>;

export interface RegisteredToolInvocation {
  tool: AnyAgentTool;
  raw: string; // 原始指令行
  params: any; // 解析后参数
}

export interface ParseResult {
  invocations: RegisteredToolInvocation[];
  errors: string[];
}
