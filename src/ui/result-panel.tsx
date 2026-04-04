import { useState } from 'react';

export interface ResultPanelProps {
  artifacts: string[];
  files: string[];
  changes: FileChange[];
}

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  diff: string;
}

export function ResultPanel({ artifacts, files, changes }: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<'artifacts' | 'files' | 'changes' | 'preview'>('artifacts');

  return (
    <div className="result-panel">
      <div className="result-tabs">
        <button
          className={activeTab === 'artifacts' ? 'active' : ''}
          onClick={() => setActiveTab('artifacts')}
        >
          产物
        </button>
        <button
          className={activeTab === 'files' ? 'active' : ''}
          onClick={() => setActiveTab('files')}
        >
          文件
        </button>
        <button
          className={activeTab === 'changes' ? 'active' : ''}
          onClick={() => setActiveTab('changes')}
        >
          变更
        </button>
        <button
          className={activeTab === 'preview' ? 'active' : ''}
          onClick={() => setActiveTab('preview')}
        >
          预览
        </button>
      </div>

      <div className="result-content">
        {activeTab === 'artifacts' && (
          <div className="artifacts-list">
            {artifacts.map((artifact, i) => (
              <div key={i} className="artifact-item">{artifact}</div>
            ))}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="files-list">
            {files.map((file, i) => (
              <div key={i} className="file-item">{file}</div>
            ))}
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="changes-list">
            {changes.map((change, i) => (
              <div key={i} className={`change-item ${change.type}`}>
                <span className="change-path">{change.path}</span>
                <span className="change-type">{change.type}</span>
                <pre className="change-diff">{change.diff}</pre>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="preview-area">
            <iframe src="about:blank" title="预览"></iframe>
          </div>
        )}
      </div>
    </div>
  );
}
