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
  sourceType?: 'embedded' | 'vault'; // 来源类型（后续可扩展 remote/version）
  filePath?: string;       // 如果来自 vault，记录绝对或相对路径
  groupId?: string;        // 所属导航组
  navLabel?: string;       // 导航显示名（覆盖 title）
  draft?: boolean;         // draft: true 时不渲染
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

// Provider 抽象（Milestone 1 引入）
export interface DocSourceProvider {
  name: string;
  /** 返回所有文档元信息（不含 raw），必要时可缓存。 */
  listMeta(): Promise<DocMeta[]> | DocMeta[];
  /** 按 id 加载原始内容（可能基于 meta.filePath）。 */
  loadRaw(meta: DocMeta): Promise<string> | string;
  /** 可选：监听底层变化，调用回调以触发刷新。返回取消函数。 */
  watch?(onInvalidate: (id?: string) => void): () => void;
}

// 搜索相关（预留占位；后续实现真正索引结构）
export interface SearchHit {
  id: string;
  score: number;
  excerpt: string;
}

export interface SearchIndex {
  build(records: DocRecord[]): void;
  query(q: string): SearchHit[];
}
