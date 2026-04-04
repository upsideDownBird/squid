import { useState, useEffect } from 'react';

export interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
}

export interface AgentVisualizationProps {
  agents: AgentStatus[];
}

export function AgentVisualization({ agents }: AgentVisualizationProps) {
  return (
    <div className="agent-visualization">
      <h3>执行状态</h3>
      <div className="agent-list">
        {agents.map(agent => (
          <div key={agent.id} className={`agent-item status-${agent.status}`}>
            <div className="agent-header">
              <span className="agent-name">{agent.name}</span>
              <span className={`status-badge ${agent.status}`}>{agent.status}</span>
            </div>
            <div className="agent-progress">
              <div className="progress-bar" style={{ width: `${agent.progress}%` }}></div>
            </div>
            {agent.currentStep && (
              <div className="agent-step">{agent.currentStep}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
