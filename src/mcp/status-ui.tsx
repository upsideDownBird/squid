import type { ConnectionStatus } from './connection-manager';

export interface ConnectorStatusUIProps {
  connections: ConnectionStatus[];
  onConnect: (name: string) => void;
  onDisconnect: (name: string) => void;
  onConfigure: (name: string) => void;
}

export function ConnectorStatusUI({ connections, onConnect, onDisconnect, onConfigure }: ConnectorStatusUIProps) {
  return (
    <div className="connector-status">
      <h2>MCP 连接器</h2>
      <div className="connector-list">
        {connections.map(conn => (
          <div key={conn.name} className={`connector-item ${conn.connected ? 'connected' : 'disconnected'}`}>
            <div className="connector-info">
              <span className="connector-name">{conn.name}</span>
              <span className={`status-badge ${conn.connected ? 'success' : 'error'}`}>
                {conn.connected ? '已连接' : '未连接'}
              </span>
            </div>
            {conn.error && <div className="error-message">{conn.error}</div>}
            <div className="connector-actions">
              {conn.connected ? (
                <button onClick={() => onDisconnect(conn.name)}>断开</button>
              ) : (
                <button onClick={() => onConnect(conn.name)}>连接</button>
              )}
              <button onClick={() => onConfigure(conn.name)}>配置</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
