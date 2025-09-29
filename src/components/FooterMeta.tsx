import React, { useMemo } from 'react';
import { DocRecord } from '../docs/types';

export interface FooterMetaProps {
  doc?: DocRecord;
  /** 自定义词速（词/分钟），默认 500 */
  wordsPerMinute?: number;
  /** 是否显示更新时间 */
  showUpdated?: boolean;
  /** 当没有更新时间时是否隐藏时间块 */
  hideWhenNoUpdated?: boolean;
  /** 是否显示阅读时长 */
  showReadingTime?: boolean;
  /** 自定义阅读时间格式化 */
  formatReadingTime?: (minutes: number, words: number) => string;
  /** 自定义更新时间格式化 */
  formatUpdated?: (timestamp: number) => string;
  /** 允许覆盖从 doc.raw 计算词数逻辑 */
  wordCounter?: (raw: string) => number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * FooterMeta: 展示更新时间 + 阅读时间的小部件
 * 设计目标：
 *  - 与底层文档解析逻辑解耦
 *  - 可灵活替换格式化/统计策略
 *  - 将来可扩展：字数显示、作者、版本信息等
 */
export const FooterMeta: React.FC<FooterMetaProps> = ({
  doc,
  wordsPerMinute = 500,
  showUpdated = true,
  hideWhenNoUpdated = false,
  showReadingTime = true,
  formatReadingTime = (m) => `阅读 ${m} 分钟`,
  formatUpdated = (ts) => `更新 ${new Date(ts).toISOString().slice(0,10)}`,
  wordCounter,
  className,
  style,
}) => {
  const meta = doc?.meta;
  const raw = doc?.raw || '';

  const { words, minutes } = useMemo(() => {
    if (!raw) return { words: 0, minutes: 0 };
    const count = wordCounter ? wordCounter(raw) : defaultWordCounter(raw);
    return { words: count, minutes: Math.max(1, Math.round(count / wordsPerMinute)) };
  }, [raw, wordCounter, wordsPerMinute]);

  const hasUpdated = !!meta?.updated;
  if (!doc) return null;
  if (hideWhenNoUpdated && showUpdated && !hasUpdated && !showReadingTime) return null;

  return (
    <div className={"jw-footer-meta" + (className ? ` ${className}` : '')} style={style} title={words ? `约 ${words} 词` : undefined}>
      {showUpdated && hasUpdated && <span>{formatUpdated(meta!.updated!)}</span>}
      {showReadingTime && (
        <span style={{ marginLeft: (showUpdated && hasUpdated) ? 8 : 0 }}>
          {formatReadingTime(minutes, words)}
        </span>
      )}
    </div>
  );
};

function defaultWordCounter(raw: string): number {
  const plain = raw.replace(/```[\s\S]*?```/g,'');
  return plain.replace(/[#>*`\\\-\n\r]/g,' ').split(/\s+/).filter(Boolean).length;
}

export default FooterMeta;
