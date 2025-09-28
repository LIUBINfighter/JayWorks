import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore lucide-react 可能暂无类型声明或需要安装对应类型
import { Copy, Check, Code as CodeIcon, Image as ImageIcon, FileCode2 } from 'lucide-react';
import { highlight } from '../utils/codeHighlight';

type TabId = 'code' | 'diagram';

export interface CodeBlockProps {
  lang?: string;
  code: string;
}

/**
 * CodeBlock: 自定义代码块组件
 * - 展示语言标签
 * - 一键复制
 * - 未来可扩展：行号 / 高亮行 / 折叠 / 运行按钮
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ lang, code }) => {
  const isMermaid = (lang === 'mermaid');
  const [copied, setCopied] = useState(false);
  const [imgCopied, setImgCopied] = useState(false);
  const [imgCopying, setImgCopying] = useState(false);
  const [imgCopyError, setImgCopyError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>(isMermaid ? 'diagram' : 'code');
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);

  // 复制源码
  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) { console.warn('复制失败', e); }
  };

  // Mermaid 渲染
  useEffect(() => {
    if (!isMermaid) return;
    let cancelled = false;
    (async () => {
      try {
        // 动态导入 mermaid，避免非 mermaid 页也加载
        const mermaidMod: any = await import('mermaid');
        const mermaid = mermaidMod.default || mermaidMod;
        mermaid.initialize?.({ startOnLoad: false });
        const { svg } = await mermaid.render('jw_mermaid_' + Math.random().toString(36).slice(2), code);
        if (!cancelled) { setSvgHtml(svg); setDiagramError(null); }
      } catch (e: any) {
        if (!cancelled) setDiagramError(e?.message || 'Mermaid 渲染失败');
      }
    })();
    return () => { cancelled = true; };
  }, [isMermaid, code]);

  // 复制图片（将 SVG 转为 PNG/或直接复制 SVG 文本）
  const handleCopyImage = async () => {
    if (!svgHtml || imgCopying) return;
    setImgCopyError(null);
    setImgCopying(true);
    const finish = (ok: boolean, err?: any) => {
      setImgCopying(false);
      if (ok) { setImgCopied(true); setTimeout(()=>setImgCopied(false), 1600); }
      else setImgCopyError(err ? String(err) : '复制失败');
    };
    try {
      // 解析 SVG 尺寸（优先 width/height，否则 viewBox）
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgHtml, 'image/svg+xml');
  const rootEl = doc.documentElement;
  const svgEl = (rootEl && rootEl.tagName.toLowerCase() === 'svg') ? (rootEl as unknown as SVGSVGElement) : null;
      let width = svgEl ? parseFloat(svgEl.getAttribute('width') || '0') : 0;
      let height = svgEl ? parseFloat(svgEl.getAttribute('height') || '0') : 0;
      if (svgEl && (!width || !height) && svgEl.getAttribute('viewBox')) {
        const vb = svgEl.getAttribute('viewBox')!.split(/\s+/).map(Number);
        if (vb.length === 4) { width = vb[2]; height = vb[3]; }
      }
      if (!width || !height) {
        // 兜底：先加载一次原尺寸再放大
        const tempBlob = new Blob([svgHtml], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(tempBlob);
        const intrinsic = await new Promise<{w:number;h:number}>((resolve, reject) => {
          const img = new Image();
          img.onload = () => { resolve({ w: img.width, h: img.height }); URL.revokeObjectURL(url); };
          img.onerror = () => { reject(new Error('无法获取 SVG 尺寸')); URL.revokeObjectURL(url); };
          img.src = url;
        });
        width = intrinsic.w; height = intrinsic.h;
      }
      const SCALE = 5; // 5倍分辨率
      const targetW = Math.max(1, Math.round(width * SCALE));
      const targetH = Math.max(1, Math.round(height * SCALE));

      // 生成放大 PNG
      const svgBlob = new Blob([svgHtml], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetW; canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 不可用');
          // 平滑关闭以避免矢量放大模糊（可选）
          (ctx as any).imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const pngBlob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png', 1));
          if (!pngBlob) throw new Error('PNG 生成失败');
          // @ts-ignore
          const CI = window.ClipboardItem;
          if (!CI) throw new Error('ClipboardItem 不可用');
          // @ts-ignore
          await navigator.clipboard.write([new CI({ 'image/png': pngBlob })]);
          finish(true);
        } catch (err: any) {
          finish(false, err?.message || err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); finish(false, '加载 SVG 失败'); };
      img.src = url;
    } catch (e: any) {
      finish(false, e?.message || e);
    }
  };

  const codeHighlighted = highlight(code, lang);

  return (
    <div className={"jw-codeblock" + (isMermaid ? ' jw-codeblock-mermaid' : '')} data-lang={lang || ''}>
      <div className="jw-codeblock-bar">
        <div className="jw-codeblock-tabs">
          <button
            className={tab === 'code' ? 'active' : ''}
            onClick={()=>setTab('code')}
            disabled={tab==='code'}
            aria-label={isMermaid ? '查看源码' : '代码视图'}
            title={isMermaid ? '查看源码' : '代码视图'}
          >
            <FileCode2 size={14} />
          </button>
          {isMermaid && (
            <button
              className={tab === 'diagram' ? 'active' : ''}
              onClick={()=>setTab('diagram')}
              disabled={tab==='diagram'}
              aria-label="图表视图"
              title="图表视图"
            >
              <CodeIcon size={14} />
            </button>
          )}
        </div>
        <div className="jw-codeblock-actions">
          {tab === 'code' && (
            <button className="jw-codeblock-copy" onClick={handleCopySource} aria-label="复制源码" title="复制源码">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
          {isMermaid && tab === 'diagram' && (
            <>
              <button className="jw-codeblock-copy" onClick={handleCopySource} aria-label="复制源码" title="复制源码">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button className="jw-codeblock-copy" onClick={handleCopyImage} aria-label="复制图片" title={imgCopyError ? imgCopyError : (imgCopied ? '复制成功' : (imgCopying ? '复制中...' : '复制图片'))}>
                {imgCopied ? <Check size={14} /> : <ImageIcon size={14} className={imgCopying ? 'jw-anim-pulse' : ''} />}
              </button>
            </>
          )}
        </div>
      </div>
      {tab === 'code' && (
        <pre className="jw-codeblock-pre" data-mode="code"><code dangerouslySetInnerHTML={codeHighlighted} /></pre>
      )}
      {isMermaid && tab === 'diagram' && (
        <div className="jw-codeblock-diagram" data-mode="diagram">
          {diagramError && <div className="jw-codeblock-diagram-error">{diagramError}</div>}
          {!diagramError && !svgHtml && <div className="jw-codeblock-diagram-loading">渲染中...</div>}
          {!diagramError && svgHtml && <div ref={svgContainerRef} className="jw-codeblock-diagram-svg" dangerouslySetInnerHTML={{ __html: svgHtml }} />}
          {imgCopyError && <div className="jw-codeblock-diagram-error" style={{marginTop:8}}>{imgCopyError}</div>}
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
