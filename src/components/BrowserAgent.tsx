import React, { useCallback, useRef, useState } from 'react';
import type { App } from 'obsidian';
import { parseInputToActions, executeAction, AgentAction, AgentLogEntry } from '../utils/agentActions';

interface DomAgentConsoleProps {
  app: App;
}

/**
 * DomAgentConsole
 * 目标：直接操作 Obsidian 内部对象（workspace/vault/编辑器），不使用 iframe。
 * - 输入：自然语言或简单 DSL
 * - 转换：parseInputToActions -> AgentAction[]
 * - 执行：逐条调用 executeAction
 * - 日志：显示动作、结果、错误
 * 未来接入 Eko：
 *   1. 用 Eko 生成结构化 step -> AgentAction
 *   2. 或将用户输入先发送给 Eko，再回放规划
 */
const DomAgentConsole: React.FC<DomAgentConsoleProps> = ({ app }) => {
  const [input, setInput] = useState('打开 今日日志\n插入 今天的灵感: ...');
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const appendLog = (entry: AgentLogEntry) => {
    setLogs(prev => [...prev, entry]);
    // 微任务后滚动
    queueMicrotask(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    appendLog({ ts: Date.now(), level: 'info', message: '解析输入…' });
    let actions: AgentAction[] = [];
    try {
      actions = parseInputToActions(input);
      appendLog({ ts: Date.now(), level: 'info', message: `获得 ${actions.length} 个动作` });
    } catch (e: any) {
      appendLog({ ts: Date.now(), level: 'error', message: '解析失败: ' + e.message });
      setRunning(false);
      return;
    }
    for (const [i, action] of actions.entries()) {
      appendLog({ ts: Date.now(), level: 'info', message: `执行(${i + 1}/${actions.length}) ${action.type}` });
      try {
        const res = await executeAction(app, action);
        appendLog({ ts: Date.now(), level: res.success ? 'success' : 'warn', message: res.message });
      } catch (e: any) {
        appendLog({ ts: Date.now(), level: 'error', message: e.message || '未知错误' });
      }
    }
    appendLog({ ts: Date.now(), level: 'info', message: '完成。' });
    setRunning(false);
  }, [input, running, app]);

  return (
    <div className="jw-agent-console">
      <div className="jw-agent-section">
        <div className="jw-agent-section-title">指令输入</div>
        <textarea
          value={input}
            className="jw-agent-input"
          onChange={e => setInput(e.target.value)}
          placeholder={"例如：\n打开 日记/2025-09-28\n插入 今天完成了 Obsidian agent 雏形"}
          rows={5}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={running} onClick={run}>{running ? '运行中…' : '执行'}</button>
          <button disabled={running} onClick={() => setInput('')}>清空</button>
        </div>
      </div>
      <div className="jw-agent-section" style={{ flex: 1 }}>
        <div className="jw-agent-section-title">日志</div>
        <div className="jw-agent-logs" ref={scrollRef}>
          {logs.map((l, idx) => (
            <div key={idx} className={`log-line level-${l.level}`}>
              <span className="time">{new Date(l.ts).toLocaleTimeString()}</span>
              <span className="msg">{l.message}</span>
            </div>
          ))}
          {logs.length === 0 && <div className="placeholder">暂无日志</div>}
        </div>
      </div>
      <div className="jw-agent-section mini">
        <div className="jw-agent-section-title">帮助 (简化语法)</div>
        <ul className="jw-agent-help">
          <li>打开 <code>路径/文件名</code></li>
          <li>创建 <code>路径/文件名</code></li>
          <li>插入 <code>你的文本</code></li>
          <li>追加 <code>你的文本</code></li>
          <li>搜索 <code>关键词</code></li>
        </ul>
      </div>
    </div>
  );
};

export default DomAgentConsole;
