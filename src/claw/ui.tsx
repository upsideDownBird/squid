import type { ClawTask } from './task-handler';

export interface ClawUIProps {
  tasks: ClawTask[];
  onRefresh: () => void;
}

export function ClawUI({ tasks, onRefresh }: ClawUIProps) {
  return (
    <div className="claw-ui">
      <div className="claw-header">
        <h2>Claw 远程控制</h2>
        <button onClick={onRefresh}>刷新</button>
      </div>
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className={`task-item status-${task.status}`}>
            <div className="task-header">
              <span className="task-id">{task.id}</span>
              <span className={`status-badge ${task.status}`}>{task.status}</span>
              <span className="task-time">{task.createdAt.toLocaleString()}</span>
            </div>
            <div className="task-prompt">{task.prompt}</div>
            {task.result && (
              <div className="task-result">
                <strong>结果:</strong>
                <pre>{task.result}</pre>
              </div>
            )}
            {task.error && (
              <div className="task-error">
                <strong>错误:</strong>
                <pre>{task.error}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
