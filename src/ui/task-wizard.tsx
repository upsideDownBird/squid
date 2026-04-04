import { useState } from 'react';

export interface TaskWizardProps {
  onSubmit: (config: TaskConfig) => void;
  onCancel: () => void;
}

export interface TaskConfig {
  mode: 'ask' | 'craft' | 'plan';
  model: string;
  workDir: string;
  skill?: string;
  expert?: string;
  prompt: string;
}

export function TaskWizard({ onSubmit, onCancel }: TaskWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<TaskConfig>>({});

  return (
    <div className="task-wizard">
      <div className="wizard-steps">
        <div className={`step ${step === 1 ? 'active' : ''}`}>1. 模式</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>2. 模型</div>
        <div className={`step ${step === 3 ? 'active' : ''}`}>3. 工作目录</div>
        <div className={`step ${step === 4 ? 'active' : ''}`}>4. 技能/专家</div>
        <div className={`step ${step === 5 ? 'active' : ''}`}>5. 指令</div>
      </div>

      <div className="wizard-content">
        {step === 1 && (
          <div className="mode-selection">
            <button onClick={() => setConfig({ ...config, mode: 'ask' })}>Ask 模式</button>
            <button onClick={() => setConfig({ ...config, mode: 'craft' })}>Craft 模式</button>
            <button onClick={() => setConfig({ ...config, mode: 'plan' })}>Plan 模式</button>
          </div>
        )}

        {step === 2 && (
          <div className="model-selection">
            <select onChange={(e) => setConfig({ ...config, model: e.target.value })}>
              <option value="claude-sonnet-4">Claude Sonnet 4</option>
              <option value="claude-opus-4">Claude Opus 4</option>
              <option value="gpt-4">GPT-4</option>
            </select>
          </div>
        )}

        {step === 3 && (
          <div className="workdir-selection">
            <input
              type="text"
              placeholder="工作目录路径"
              onChange={(e) => setConfig({ ...config, workDir: e.target.value })}
            />
          </div>
        )}

        {step === 4 && (
          <div className="skill-expert-selection">
            <select onChange={(e) => setConfig({ ...config, skill: e.target.value })}>
              <option value="">选择技能（可选）</option>
            </select>
            <select onChange={(e) => setConfig({ ...config, expert: e.target.value })}>
              <option value="">选择专家（可选）</option>
            </select>
          </div>
        )}

        {step === 5 && (
          <div className="prompt-input">
            <textarea
              placeholder="输入任务指令"
              onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="wizard-actions">
        {step > 1 && <button onClick={() => setStep(step - 1)}>上一步</button>}
        {step < 5 && <button onClick={() => setStep(step + 1)}>下一步</button>}
        {step === 5 && <button onClick={() => onSubmit(config as TaskConfig)}>创建任务</button>}
        <button onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}
