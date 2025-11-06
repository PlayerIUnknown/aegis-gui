import { useState } from 'react';
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

type ScaFinding = {
  id?: string;
  fix?: unknown;
  package?: { name?: string; version?: string };
  severity?: string;
  description?: string;
};

type SbomFinding = {
  name?: string;
  type?: string;
  version?: string;
};

type SecretFinding = {
  description?: string;
  severity?: string;
  match?: string;
  file?: string;
  line?: number;
};

type VulnerabilityFinding = {
  message?: string;
  severity?: string;
  code_snippet?: string;
  file?: string;
  line?: number;
  end_line?: number;
};

const isScaFinding = (value: unknown): value is ScaFinding => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as ScaFinding;
  return typeof candidate.package === 'object' && candidate.package !== null;
};

const isSbomFinding = (value: unknown): value is SbomFinding => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as SbomFinding;
  return typeof candidate.name === 'string' || typeof candidate.version === 'string';
};

const isSecretFinding = (value: unknown): value is SecretFinding => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as SecretFinding;
  return typeof candidate.description === 'string' && typeof candidate.match === 'string';
};

const isVulnerabilityFinding = (value: unknown): value is VulnerabilityFinding => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as VulnerabilityFinding;
  return typeof candidate.message === 'string' && typeof candidate.severity === 'string';
};

const formatSeverity = (severity?: string) => {
  if (!severity) {
    return 'Unknown';
  }
  const normalized = severity.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const severityBadgeBaseClasses =
  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-[0_12px_28px_-20px_rgba(15,23,42,0.75)]';

const severityBadgeVariants: Record<string, string> = {
  critical: 'border-rose-500/60 bg-rose-500/15 text-rose-100',
  high: 'border-orange-500/60 bg-orange-500/15 text-orange-100',
  medium: 'border-amber-400/60 bg-amber-400/15 text-amber-100',
  low: 'border-emerald-400/60 bg-emerald-400/15 text-emerald-100',
  info: 'border-sky-400/60 bg-sky-400/15 text-sky-100',
  default: 'border-slate-600/60 bg-slate-700/30 text-slate-200',
};

const getSeverityBadgeClasses = (severity?: string) => {
  if (!severity) {
    return `${severityBadgeBaseClasses} ${severityBadgeVariants.default}`;
  }
  const normalized = severity.toLowerCase();
  return `${severityBadgeBaseClasses} ${severityBadgeVariants[normalized] ?? severityBadgeVariants.default}`;
};

const formatFixVersions = (fix: unknown): string | null => {
  if (Array.isArray(fix)) {
    const fixes = fix.filter((value): value is string => typeof value === 'string');
    return fixes.length > 0 ? fixes.join(', ') : null;
  }
  if (typeof fix === 'string') {
    return fix;
  }
  return null;
};

export const ToolFindingsPanel: React.FC<ToolFindingsPanelProps> = ({ tools }) => {
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});

  if (!tools || Object.keys(tools).length === 0) {
    return (
      <p className="rounded-2xl border-2 border-accent/40 bg-white p-4 text-sm text-slate-600 shadow-[0_20px_40px_-30px_rgba(99,102,241,0.65)]">
        Tool results are not available for this scan yet.
      </p>
    );
  }

  const toggleSnippet = (key: string) => {
    setExpandedSnippets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSnippetExpanded = (key: string) => Boolean(expandedSnippets[key]);

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
              {toolData.output.map((finding, index) => {
                const key = `${toolName}-${index}`;

                if (isScaFinding(finding)) {
                  const packageName = finding.package?.name ?? 'Unknown package';
                  const packageVersion = finding.package?.version ?? 'Unknown version';
                  const severity = formatSeverity(finding.severity);
                  const fixVersions = formatFixVersions(finding.fix);

                  return (
                    <div
                      key={key}
                      className="space-y-3 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-sm text-slate-200 shadow-[0_28px_55px_-40px_rgba(15,23,42,0.85)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{finding.id ?? 'Untracked vulnerability'}</p>
                        <span className={getSeverityBadgeClasses(finding.severity)}>
                          <Icon name="alert" width={12} height={12} /> {severity}
                        </span>
                      </div>
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Package</dt>
                          <dd className="mt-1 font-medium text-slate-100">{packageName}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Version</dt>
                          <dd className="mt-1 font-medium text-slate-100">{packageVersion}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Description</dt>
                          <dd className="mt-1 text-sm text-slate-300">{finding.description ?? 'No description available.'}</dd>
                        </div>
                        {fixVersions && (
                          <div className="sm:col-span-2">
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Fix version</dt>
                            <dd className="mt-1 font-medium text-slate-100">{fixVersions}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  );
                }

                if (toolName.toLowerCase().includes('sbom') && isSbomFinding(finding)) {
                  return (
                    <div
                      key={key}
                      className="space-y-2 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-sm text-slate-200 shadow-[0_28px_55px_-40px_rgba(15,23,42,0.85)]"
                    >
                      <p className="text-sm font-semibold text-white">{finding.name ?? 'Unnamed component'}</p>
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Package name</dt>
                          <dd className="mt-1 font-medium text-slate-100">{finding.name ?? 'Unknown'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Type</dt>
                          <dd className="mt-1 font-medium text-slate-100">{finding.type ?? 'Unknown'}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Version</dt>
                          <dd className="mt-1 font-medium text-slate-100">{finding.version ?? 'Unknown'}</dd>
                        </div>
                      </dl>
                    </div>
                  );
                }

                if (toolName.toLowerCase().includes('secret') && isSecretFinding(finding)) {
                  const expanded = isSnippetExpanded(key);
                  return (
                    <div
                      key={key}
                      className="space-y-3 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-sm text-slate-200 shadow-[0_28px_55px_-40px_rgba(15,23,42,0.85)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {finding.description ? `${finding.description} exposed` : 'Secret exposed'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">Match: {finding.match}</p>
                        </div>
                        <span className={getSeverityBadgeClasses(finding.severity)}>
                          <Icon name="alert" width={12} height={12} /> {formatSeverity(finding.severity)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSnippet(key)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-accent/60 hover:text-accent"
                        aria-expanded={expanded}
                      >
                        {expanded ? 'Hide code snippet' : 'Show code snippet'}
                        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} width={12} height={12} />
                      </button>
                      {expanded && (
                        <div className="space-y-2 rounded-2xl border border-slate-700/70 bg-slate-950/95 p-4 text-xs text-slate-200">
                          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-400">
                            {finding.file ?? 'Unknown file'}:{finding.line ?? '—'}
                          </p>
                          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-slate-100">{finding.match}</pre>
                        </div>
                      )}
                    </div>
                  );
                }

                if (isVulnerabilityFinding(finding)) {
                  const expanded = isSnippetExpanded(key);
                  return (
                    <div
                      key={key}
                      className="space-y-3 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-sm text-slate-200 shadow-[0_28px_55px_-40px_rgba(15,23,42,0.85)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{finding.message}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            File: {finding.file ?? 'Unknown file'} • Line {finding.line ?? '—'}
                          </p>
                        </div>
                        <span className={getSeverityBadgeClasses(finding.severity)}>
                          <Icon name="alert" width={12} height={12} /> {formatSeverity(finding.severity)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSnippet(key)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-accent/60 hover:text-accent"
                        aria-expanded={expanded}
                      >
                        {expanded ? 'Hide snippet' : 'Show snippet'}
                        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} width={12} height={12} />
                      </button>
                      {expanded && (
                        <div className="space-y-2 rounded-2xl border border-slate-700/70 bg-slate-950/95 p-4 text-xs text-slate-200">
                          <p className="font-mono text-[11px] uppercase tracking-wide text-slate-400">
                            {finding.file ?? 'Unknown file'}:{finding.line ?? '—'}-{finding.end_line ?? finding.line ?? '—'}
                          </p>
                          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-slate-100">
                            {finding.code_snippet ?? 'Snippet unavailable.'}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-200 shadow-[0_28px_55px_-40px_rgba(15,23,42,0.85)]"
                  >
                    <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap break-all">{JSON.stringify(finding, null, 2)}</pre>
                  </div>
                );
              })}
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
