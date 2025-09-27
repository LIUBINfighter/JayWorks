// 文档与渲染相关类型定义 (Milestone 0)
import React from 'react';

export interface DocMeta {
  id: string;              // 唯一 ID（可与 slug 相同）
  title: string;           // 标题（frontmatter 优先）
  slug: string;            // 未来可用于路由/hash
  description?: string;
  category?: string;
  order?: number;
  tags?: string[];
  updated?: number;        // 时间戳（可选）
}

export interface CompiledDoc {
  frontmatter: Record<string, any>;
  element: React.ReactElement;
  parsedAt: number;
}

export interface DocRecord {
  meta: DocMeta;
  raw?: string;            // 懒加载文本
  compiled?: CompiledDoc;  // 已编译缓存
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
}

export interface DocRegistry {
  getDocIds(): string[];
  getDoc(id: string): DocRecord | undefined;
  list(): DocRecord[];
}
