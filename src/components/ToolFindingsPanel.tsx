import type { JSX } from 'react';
import clsx from 'clsx';
import { ToolRun } from '../data/sampleData';
import { Icon } from './Icon';

const toolIconMap: Record<string, JSX.Element> = {
  SBOM: <Icon name="package-export" width={20} height={20} />,
  SCA: <Icon name="bug" width={20} height={20} />,
  'Secret Scanning': <Icon name="key" width={20} height={20} />,
  'Vulnerability Scan': <Icon name="code" width={20} height={20} />
};

type ToolFindingsPanelProps = {
  tools: ToolRun[];
};

export const ToolFindingsPanel: React.FC<ToolFindingsPanelProps> = ({ tools }) => {
  return (
    <div className="space-y-4">
      {tools.map((tool) => (
        <div
          key={tool.name}
          className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                {toolIconMap[tool.name] ?? <Icon name="package" width={20} height={20} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{tool.name}</p>
                <p className="text-xs text-slate-400">{tool.findings.length} finding(s)</p>
              </div>
            </div>
          </div>
          {tool.findings.length > 0 ? (
            <div className="mt-4 space-y-3">
              {tool.findings.map((finding, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{finding.name}</p>
                    {finding.severity && <SeverityPill severity={finding.severity} />}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {finding.version && <p>Version: {finding.version}</p>}
                    {finding.type && <p>Type: {finding.type}</p>}
                    {finding.purl && <p className="break-all">PURL: {finding.purl}</p>}
                    {finding.description && <p className="text-slate-300">{finding.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-slate-800/60 bg-slate-900/20 p-4 text-xs text-slate-400">
              No findings reported.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

type Severity = 'low' | 'medium' | 'high' | 'critical';

type SeverityPillProps = {
  severity: Severity;
};

const severityStyles: Record<Severity, string> = {
  low: 'bg-success/10 text-success border-success/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-danger/10 text-danger border-danger/30',
  critical: 'bg-danger text-slate-900 border-danger'
};

const SeverityPill: React.FC<SeverityPillProps> = ({ severity }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase',
      severityStyles[severity]
    )}
  >
    <Icon name="alert" width={14} height={14} />
    {severity}
  </span>
);
