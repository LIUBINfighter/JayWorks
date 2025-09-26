import React, { useState } from 'react';

interface OcrPlaygroundProps {
  initialText?: string;
}

// A minimal stub component to demonstrate interactive MDX embedding.
const OcrPlayground: React.FC<OcrPlaygroundProps> = ({ initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [result, setResult] = useState('');

  return (
    <div style={{ border: '1px solid var(--background-modifier-border)', padding: '8px', borderRadius: 4, margin: '12px 0' }}>
      <strong>OcrPlayground (stub)</strong>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <textarea
          style={{ flex: 1 }}
          rows={4}
          value={text}
          placeholder="输入需要识别的文本 (stub)"
          onChange={(e) => setText(e.target.value)}
        />
        <div style={{ width: 160, fontSize: '0.85em', opacity: 0.8 }}>
          此组件为占位示例。真实 OCR 逻辑可在后续集成。
        </div>
      </div>
      <button
        onClick={() => setResult(text.split('').reverse().join(''))}
        style={{ marginTop: 8 }}
      >模拟识别</button>
      {result && (
        <pre style={{ marginTop: 8, background: 'var(--background-secondary)', padding: 8 }}>
{result}
        </pre>
      )}
    </div>
  );
};

export default OcrPlayground;
