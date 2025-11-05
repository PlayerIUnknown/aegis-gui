import type { JSX } from 'react';
import { Icon } from './Icon';

type ToolFindingsPanelProps = {
  tools?: Record<string, { output: unknown[] }>;
};

const toolIconMap: Record<string, JSX.Element> = {
  SBOM: <Icon name="package-export" width={20} height={20} />,
  SCA: <Icon name="bug" width={20} height={20} />,
  'Vulnerability Scan': <Icon name="code" width={20} height={20} />,
  'Secret Scanning': <Icon name="key" width={20} height={20} />,
};

export const ToolFindingsPanel: React.FC<ToolFindingsPanelProps> = ({ tools }) => {
  if (!tools || Object.keys(tools).length === 0) {
    return (
      <p className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 text-sm text-slate-400">
        Tool results are not available for this scan yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(tools).map(([toolName, toolData]) => (
        <div key={toolName} className="rounded-3xl border border-slate-800/70 bg-slate-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                {toolIconMap[toolName] ?? <Icon name="package" width={20} height={20} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{toolName}</p>
                <p className="text-xs text-slate-400">
                  {toolData.output.length} finding{toolData.output.length === 1 ? '' : 's'} reported
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <Icon name={toolData.output.length > 0 ? 'alert' : 'check-circle'} width={14} height={14} />
              {toolData.output.length > 0 ? 'Review required' : 'Clean'}
            </span>
          </div>
          {toolData.output.length > 0 ? (
            <div className="mt-4 space-y-3">
              {toolData.output.map((finding, index) => (
                <div key={index} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                    {JSON.stringify(finding, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 text-xs text-slate-400">
              No findings reported.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
