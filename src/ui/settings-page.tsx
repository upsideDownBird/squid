import { useState } from 'react';

export interface SettingsPageProps {
  onSave: (settings: Settings) => void;
}

export interface Settings {
  apiKeys: {
    anthropic?: string;
    openai?: string;
    deepseek?: string;
  };
  clawToken?: string;
  email?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export function SettingsPage({ onSave }: SettingsPageProps) {
  const [settings, setSettings] = useState<Settings>({ apiKeys: {} });

  return (
    <div className="settings-page">
      <h2>设置</h2>

      <section className="settings-section">
        <h3>API 密钥</h3>
        <div className="form-group">
          <label>Anthropic API Key</label>
          <input
            type="password"
            value={settings.apiKeys.anthropic || ''}
            onChange={(e) => setSettings({
              ...settings,
              apiKeys: { ...settings.apiKeys, anthropic: e.target.value }
            })}
          />
        </div>
        <div className="form-group">
          <label>OpenAI API Key</label>
          <input
            type="password"
            value={settings.apiKeys.openai || ''}
            onChange={(e) => setSettings({
              ...settings,
              apiKeys: { ...settings.apiKeys, openai: e.target.value }
            })}
          />
        </div>
        <div className="form-group">
          <label>DeepSeek API Key</label>
          <input
            type="password"
            value={settings.apiKeys.deepseek || ''}
            onChange={(e) => setSettings({
              ...settings,
              apiKeys: { ...settings.apiKeys, deepseek: e.target.value }
            })}
          />
        </div>
      </section>

      <section className="settings-section">
        <h3>Claw Token</h3>
        <div className="form-group">
          <label>Token</label>
          <input
            type="password"
            value={settings.clawToken || ''}
            onChange={(e) => setSettings({ ...settings, clawToken: e.target.value })}
          />
          <button>生成新 Token</button>
        </div>
      </section>

      <section className="settings-section">
        <h3>邮件配置</h3>
        <div className="form-group">
          <label>SMTP 主机</label>
          <input
            type="text"
            value={settings.email?.host || ''}
            onChange={(e) => setSettings({
              ...settings,
              email: { ...settings.email!, host: e.target.value }
            })}
          />
        </div>
        <div className="form-group">
          <label>端口</label>
          <input
            type="number"
            value={settings.email?.port || 587}
            onChange={(e) => setSettings({
              ...settings,
              email: { ...settings.email!, port: parseInt(e.target.value) }
            })}
          />
        </div>
        <div className="form-group">
          <label>用户名</label>
          <input
            type="text"
            value={settings.email?.user || ''}
            onChange={(e) => setSettings({
              ...settings,
              email: { ...settings.email!, user: e.target.value }
            })}
          />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input
            type="password"
            value={settings.email?.pass || ''}
            onChange={(e) => setSettings({
              ...settings,
              email: { ...settings.email!, pass: e.target.value }
            })}
          />
        </div>
      </section>

      <button onClick={() => onSave(settings)}>保存设置</button>
    </div>
  );
}
