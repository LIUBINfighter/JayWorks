import React, { useCallback, useRef, useState } from 'react';
import type { App } from 'obsidian';
import { AgentLogEntry } from '../utils/agentActions'; // 保留旧类型供日志结构兼容（可后续迁移）
import { parseToolInvocations, listTools } from '../agent/tools/registry';
import type { AgentToolContext } from '../agent/tools/types';

interface DomAgentConsoleProps { app: App }

const DomAgentConsole: React.FC<DomAgentConsoleProps> = ({ app }) => {
  const [mode, setMode] = useState<'nl' | 'tool'>('tool');
  const [input, setInput] = useState('open_file path="日记/2025-09-28.md"\ninsert_text text="今天的灵感: ..."');
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const appendLog = (entry: AgentLogEntry) => {
    setLogs(prev => [...prev, entry]);
    queueMicrotask(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    appendLog({ ts: Date.now(), level: 'info', message: '解析输入…' });
    if (mode === 'nl') {
      appendLog({ ts: Date.now(), level: 'warn', message: '自然语言模式暂未接入，使用旧解析可回退。' });
      setRunning(false);
      return;
    }
    const parse = parseToolInvocations(input);
    if (parse.errors.length) {
      parse.errors.forEach(err => appendLog({ ts: Date.now(), level: 'error', message: err }));
      setRunning(false);
      return;
    }
    appendLog({ ts: Date.now(), level: 'info', message: `获得 ${parse.invocations.length} 个工具调用` });
    const ctx: AgentToolContext = { app };
    for (const [i, inv] of parse.invocations.entries()) {
      appendLog({ ts: Date.now(), level: 'info', message: `(${i + 1}/${parse.invocations.length}) 调用 ${inv.tool.name}` });
      try {
        const res = await inv.tool.run(ctx, inv.params);
        appendLog({ ts: Date.now(), level: res.success ? 'success' : 'warn', message: res.message });
        if (res.data) {
          appendLog({ ts: Date.now(), level: 'info', message: '数据: ' + JSON.stringify(res.data).slice(0, 500) });
        }
      } catch (e: any) {
        appendLog({ ts: Date.now(), level: 'error', message: e.message || '执行异常' });
      }
    }
    appendLog({ ts: Date.now(), level: 'info', message: '完成。' });
    setRunning(false);
  }, [input, running, app, mode]);

  return (
    <div className="jw-agent-console">
      <div className="jw-agent-section">
        <div className="jw-agent-section-title">指令输入 <span style={{fontWeight: 'normal', fontSize: 12}}>模式: {mode}</span></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <button disabled={mode==='tool'} onClick={() => setMode('tool')}>工具模式</button>
          <button disabled={mode==='nl'} onClick={() => setMode('nl')}>自然语言</button>
        </div>
        <textarea
          className="jw-agent-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={"工具模式示例:\nopen_file path=Notes/Index.md\ninsert_text text=你好"}
          rows={5}
        />
        <div className="jw-agent-actions">
          <button disabled={running} onClick={run}>{running ? '运行中…' : '执行'}</button>
          <button disabled={running} onClick={() => setInput('')}>清空</button>
        </div>
      </div>
      <div className="jw-agent-section" style={{ flex: 1 }}>
        <div className="jw-agent-section-title">日志</div>
        <div className="jw-agent-logs" ref={scrollRef}>
          {logs.map((l, i) => (
            <div key={i} className={`log-line level-${l.level}`}>
              <span className="time">{new Date(l.ts).toLocaleTimeString()}</span>
              <span className="msg">{l.message}</span>
            </div>
          ))}
          {logs.length === 0 && <div className="placeholder">暂无日志</div>}
        </div>
      </div>
      <div className="jw-agent-section mini">
        <div className="jw-agent-section-title">可用工具</div>
        <ul className="jw-agent-help">
          {listTools().map(t => (
            <li key={t.name}><code>{t.name}</code> - {t.description}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DomAgentConsole;
