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
      <p className="rounded-2xl border-2 border-accent/40 bg-white p-4 text-sm text-slate-600 shadow-[0_20px_40px_-30px_rgba(99,102,241,0.65)]">
        Tool results are not available for this scan yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(tools).map(([toolName, toolData]) => (
        <div
          key={toolName}
          className="max-w-full overflow-hidden rounded-3xl border-2 border-accent/40 bg-white p-6 shadow-[0_30px_65px_-45px_rgba(99,102,241,0.8)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                {toolIconMap[toolName] ?? <Icon name="package" width={20} height={20} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{toolName}</p>
                <p className="text-xs text-slate-500">
                  {toolData.output.length} finding{toolData.output.length === 1 ? '' : 's'} reported
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-accent/40 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-[0_10px_25px_-18px_rgba(99,102,241,0.6)]">
              <Icon name={toolData.output.length > 0 ? 'alert' : 'check-circle'} width={14} height={14} />
              {toolData.output.length > 0 ? 'Review required' : 'Clean'}
            </span>
          </div>
          {toolData.output.length > 0 ? (
            <div className="mt-4 space-y-3">
              {toolData.output.map((finding, index) => (
                <div key={index} className="rounded-2xl border-2 border-accent/30 bg-slate-50 p-4 shadow-[0_15px_30px_-25px_rgba(99,102,241,0.7)]">
                  <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap break-all text-xs text-slate-700">
                    {JSON.stringify(finding, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border-2 border-accent/30 bg-slate-100 p-4 text-xs text-slate-600 shadow-[0_15px_30px_-25px_rgba(99,102,241,0.7)]">
              No findings reported.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
