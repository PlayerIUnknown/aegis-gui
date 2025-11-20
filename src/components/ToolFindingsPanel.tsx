import { useState } from 'react';
import type { JSX } from 'react';
import { Icon } from './Icon';

export type ToolCategoryFilter = 'sbom' | 'sca' | 'vulnScan' | 'secrets';

type ToolFindingsPanelProps = {
  tools?: Record<string, { output: unknown[] }>;
  activeFilter?: ToolCategoryFilter | null;
};

const toolIconMap: Record<string, JSX.Element> = {
  SBOM: <Icon name="package-export" width={20} height={20} />,
  SCA: <Icon name="bug" width={20} height={20} />,
  'Vulnerability Scan': <Icon name="code" width={20} height={20} />,
  'Secret Scanning': <Icon name="key" width={20} height={20} />,
};

type ScaPackageInfo = {
  name?: string;
  version?: string;
  module?: string;
  path?: string;
};

type ScaFinding = {
  id?: string;
  fix?: unknown;
  package?: ScaPackageInfo;
  module?: string;
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

type AiFixResult = {
  fix_description?: string;
  fixed_code?: string;
  vulnerability_id?: string;
};

type AiFixState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: AiFixResult;
  error?: string;
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

const filterMatchers: Record<ToolCategoryFilter, string[]> = {
  sbom: ['sbom'],
  sca: ['sca', 'package'],
  vulnScan: ['vulnerability'],
  secrets: ['secret'],
};

const matchesFilter = (toolName: string, filter: ToolCategoryFilter) => {
  const normalizedName = toolName.toLowerCase();
  const tokens = normalizedName.split(/[^a-z0-9]+/).filter(Boolean);

  return filterMatchers[filter].some((matcher) => {
    if (matcher.includes(' ')) {
      return normalizedName.includes(matcher);
    }

    return tokens.includes(matcher);
  });
};

const toolCategoryPriority: ToolCategoryFilter[] = ['sbom', 'sca', 'secrets', 'vulnScan'];

const resolveToolPriority = (toolName: string) => {
  const matchedCategory = toolCategoryPriority.find((category) => matchesFilter(toolName, category));

  if (!matchedCategory) {
    return Number.MAX_SAFE_INTEGER;
  }

  return toolCategoryPriority.indexOf(matchedCategory);
};

const severityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const normalizeSeverity = (severity?: string) => severity?.toLowerCase() ?? '';

const getSeverityRank = (severity?: string) => {
  const normalized = normalizeSeverity(severity);
  return severityOrder[normalized] ?? Number.MAX_SAFE_INTEGER;
};

const severityPillStyles: Record<string, string> = {
  critical: 'border-red-900/70 bg-red-900 text-white shadow-[0_6px_18px_-10px_rgba(127,29,29,0.85)]',
  high: 'border-red-600/70 bg-red-600 text-white shadow-[0_6px_18px_-10px_rgba(220,38,38,0.7)]',
  medium: 'border-orange-500/70 bg-orange-500 text-white shadow-[0_6px_18px_-10px_rgba(234,88,12,0.65)]',
  low: 'border-yellow-400/70 bg-yellow-400 text-slate-900 shadow-[0_6px_18px_-10px_rgba(202,138,4,0.55)]',
  default: 'border-slate-200/80 bg-slate-100 text-slate-700 shadow-[0_6px_16px_-12px_rgba(15,23,42,0.35)]',
};

const getSeverityPillClassName = (severity?: string) => {
  const normalized = normalizeSeverity(severity);
  return severityPillStyles[normalized] ?? severityPillStyles.default;
};

const shouldSortBySeverity = (toolName: string) =>
  matchesFilter(toolName, 'sca') || matchesFilter(toolName, 'secrets') || matchesFilter(toolName, 'vulnScan');

const splitVulnerabilityMessage = (message: string) => {
  const normalizedMessage = message.replace(/\r\n/g, '\n').trim();

  if (!normalizedMessage) {
    return { title: '', description: '' };
  }

  const firstPeriodIndex = normalizedMessage.indexOf('.');

  if (firstPeriodIndex !== -1) {
    const title = normalizedMessage.slice(0, firstPeriodIndex + 1).trim();
    const description = normalizedMessage.slice(firstPeriodIndex + 1).trim();

    if (title) {
      return { title, description };
    }
  }

  const [rawTitle, ...rawDescriptionLines] = normalizedMessage.split('\n');
  const title = (rawTitle?.trim() ?? '') || normalizedMessage;
  const description = rawDescriptionLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return { title, description };
};

const getFindingSeverity = (finding: unknown): string | undefined => {
  if (isScaFinding(finding) || isSecretFinding(finding) || isVulnerabilityFinding(finding)) {
    return finding.severity;
  }

  if (finding && typeof finding === 'object' && 'severity' in finding) {
    const candidate = finding as { severity?: unknown };
    return typeof candidate.severity === 'string' ? candidate.severity : undefined;
  }

  return undefined;
};

type ScaPackageGroup = {
  key: string;
  packageName: string;
  packageVersion: string;
  modules: string[];
  severityRank: number;
  severityLabel: string;
  severityValue?: string;
  findings: ScaFinding[];
};

const resolveModuleName = (finding: ScaFinding) =>
  finding.package?.module ?? finding.package?.path ?? finding.module;

const groupScaFindings = (findings: unknown[]) => {
  const groupsMap = new Map<string, ScaPackageGroup>();
  const leftovers: unknown[] = [];

  findings.forEach((entry) => {
    if (!isScaFinding(entry)) {
      leftovers.push(entry);
      return;
    }

    const packageName = entry.package?.name?.trim() || 'Unknown package';
    const packageVersion = entry.package?.version?.trim() || 'Unknown version';
    const key = `${packageName}@@${packageVersion}`;
    const severityRank = getSeverityRank(entry.severity);
    const severityLabel = formatSeverity(entry.severity);

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        packageName,
        packageVersion,
        modules: [],
        severityRank,
        severityLabel,
        severityValue: entry.severity,
        findings: [],
      });
    }

    const group = groupsMap.get(key)!;
    group.findings.push(entry);

    if (severityRank < group.severityRank) {
      group.severityRank = severityRank;
      group.severityLabel = severityLabel;
      group.severityValue = entry.severity;
    }

    const moduleName = resolveModuleName(entry);
    if (moduleName && !group.modules.includes(moduleName)) {
      group.modules.push(moduleName);
    }
  });

  const groups = Array.from(groupsMap.values()).map((group) => ({
    ...group,
    findings: [...group.findings].sort((findingA, findingB) => {
      const severityComparison =
        getSeverityRank(findingA.severity) - getSeverityRank(findingB.severity);

      if (severityComparison !== 0) {
        return severityComparison;
      }

      const idA = findingA.id ?? '';
      const idB = findingB.id ?? '';
      return idA.localeCompare(idB);
    }),
  }));

  groups.sort((groupA, groupB) => {
    if (groupA.severityRank === groupB.severityRank) {
      if (groupA.packageName === groupB.packageName) {
        return groupA.packageVersion.localeCompare(groupB.packageVersion);
      }
      return groupA.packageName.localeCompare(groupB.packageName);
    }

    return groupA.severityRank - groupB.severityRank;
  });

  return { groups, leftovers };
};

export const ToolFindingsPanel: React.FC<ToolFindingsPanelProps> = ({ tools, activeFilter }) => {
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});
  const [aiFixStates, setAiFixStates] = useState<Record<string, AiFixState>>({});

  if (!tools || Object.keys(tools).length === 0) {
    return (
      <p className="rounded-lg border border-slate-200/70 bg-white p-4 text-sm text-slate-600 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
        Tool results are not available for this scan yet.
      </p>
    );
  }

  if (!activeFilter) {
    return (
      <p className="rounded-lg border border-slate-200/70 bg-white p-4 text-sm text-slate-600 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
        Select a category to view scan results.
      </p>
    );
  }

  const toggleSnippet = (key: string) => {
    setExpandedSnippets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSnippetExpanded = (key: string) => Boolean(expandedSnippets[key]);

  const triggerAiFix = async (key: string, finding: VulnerabilityFinding) => {
    const message = finding.message ?? '';
    const codeSnippet = finding.code_snippet ?? '';
    const language = finding.file ?? 'unknown';

    if (!message && !codeSnippet) {
      setAiFixStates((prev) => ({
        ...prev,
        [key]: {
          status: 'error',
          error: 'Unable to generate fix: missing vulnerability details.',
        },
      }));
      return;
    }

    setAiFixStates((prev) => ({
      ...prev,
      [key]: { status: 'loading' },
    }));

    try {
      const response = await fetch('https://aegis-ez33.onrender.com/analyze_vulnerability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vulnerability_id: crypto.randomUUID(),
          description: message,
          code_snippet: codeSnippet,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as AiFixResult;

      setAiFixStates((prev) => ({
        ...prev,
        [key]: {
          status: 'success',
          result: data,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred.';
      setAiFixStates((prev) => ({
        ...prev,
        [key]: {
          status: 'error',
          error: message,
        },
      }));
    }
  };

  const entries = Object.entries(tools);
  const sortedEntries = [...entries].sort(([toolA], [toolB]) => {
    const priorityA = resolveToolPriority(toolA);
    const priorityB = resolveToolPriority(toolB);

    if (priorityA === priorityB) {
      return toolA.localeCompare(toolB);
    }

    return priorityA - priorityB;
  });

  const filteredEntries = sortedEntries.filter(([toolName]) => matchesFilter(toolName, activeFilter));

  const entriesToRender = filteredEntries;

  const sortFindingsForTool = (toolName: string, findings: unknown[]) =>
    shouldSortBySeverity(toolName)
      ? [...findings].sort(
          (findingA, findingB) =>
            getSeverityRank(getFindingSeverity(findingA)) -
            getSeverityRank(getFindingSeverity(findingB)),
        )
      : findings;

  return (
    <div className="space-y-4">
      {entriesToRender.length === 0 && activeFilter && (
        <p className="rounded-lg border border-slate-200/70 bg-white p-4 text-sm text-slate-600 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
          No tool results match the selected summary filter.
        </p>
      )}
      {entriesToRender.map(([toolName, toolData]) => (
        <div
          key={toolName}
          className="max-w-full overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_28px_68px_-44px_rgba(15,23,42,0.5)]"
        >
          <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  {toolIconMap[toolName] ?? <Icon name="package" width={20} height={20} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{toolName}</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {toolData.output.length} finding{toolData.output.length === 1 ? '' : 's'} reported
                  </p>
                </div>
              </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.4)]">
              <Icon name={toolData.output.length > 0 ? 'alert' : 'check-circle'} width={14} height={14} />
              {toolData.output.length > 0 ? 'Review required' : 'Clean'}
            </span>
          </div>
          {toolData.output.length > 0 ? (
            <div className="mt-4 space-y-3">
              {(() => {
                const sortedFindings = sortFindingsForTool(toolName, toolData.output);
                const isSecretTool = toolName.toLowerCase().includes('secret');
                const isScaTool = matchesFilter(toolName, 'sca');
                const shouldShowRemediation = isSecretTool && sortedFindings.length > 0;
                const scaGrouping = isScaTool ? groupScaFindings(sortedFindings) : null;

                const renderDefaultFindings = () =>
                  sortedFindings.map((finding, index) => {
                    const key = `${toolName}-${index}`;

                    if (isScaFinding(finding)) {
                      const packageName = finding.package?.name ?? 'Unknown package';
                      const packageVersion = finding.package?.version ?? 'Unknown version';
                      const severity = formatSeverity(finding.severity);
                      const fixVersions = formatFixVersions(finding.fix);

                      return (
                        <div
                          key={key}
                          className="relative rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-sm text-slate-700 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]"
                        >
                          <span
                            className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getSeverityPillClassName(finding.severity)}`}
                          >
                            <Icon name="alert" width={12} height={12} /> {severity}
                          </span>
                          <div className="pr-24">
                            <p className="text-sm font-semibold text-slate-900">{finding.id ?? 'Untracked vulnerability'}</p>
                            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                              <div className="space-y-1">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Package</dt>
                                <dd className="font-medium text-slate-900 break-words">{packageName}</dd>
                              </div>
                              <div className="space-y-1">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Version</dt>
                                <dd className="font-semibold text-rose-600 break-words">{packageVersion}</dd>
                              </div>
                              <div className="space-y-1 sm:col-start-3">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fix version</dt>
                                <dd className="font-semibold text-emerald-600 break-words">{fixVersions ?? '—'}</dd>
                              </div>
                              <div className="space-y-1 sm:col-span-3">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</dt>
                                <dd className="text-sm text-slate-700 whitespace-pre-line">
                                  {finding.description ?? 'No description available.'}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      );
                    }

                    if (toolName.toLowerCase().includes('sbom') && isSbomFinding(finding)) {
                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-sm text-slate-700 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]"
                        >
                          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="space-y-1">
                              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Package name</dt>
                              <dd className="font-medium text-slate-900 break-words">{finding.name ?? 'Unknown'}</dd>
                            </div>
                            <div className="space-y-1">
                              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</dt>
                              <dd className="font-medium text-slate-900 break-words">{finding.type ?? 'Unknown'}</dd>
                            </div>
                            <div className="space-y-1">
                              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Version</dt>
                              <dd className="font-medium text-slate-900 break-words">{finding.version ?? 'Unknown'}</dd>
                            </div>
                          </dl>
                        </div>
                      );
                    }

                    if (toolName.toLowerCase().includes('secret') && isSecretFinding(finding)) {
                      return (
                        <div
                          key={key}
                          className="relative space-y-3 rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-sm text-slate-700 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]"
                        >
                          <span
                            className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getSeverityPillClassName(finding.severity)}`}
                          >
                            <Icon name="alert" width={12} height={12} /> {formatSeverity(finding.severity)}
                          </span>
                          <div className="pr-24">
                            <p className="text-sm font-semibold text-slate-900">
                              {finding.description ? `${finding.description} exposed` : 'Secret exposed'}
                            </p>
                          </div>
                          <div className="space-y-2 rounded-lg border border-rose-400/70 bg-gradient-to-br from-white/95 via-rose-50 to-rose-100 p-4 text-xs text-rose-900 shadow-[0_22px_48px_-32px_rgba(244,63,94,0.3)]">
                            <p className="font-mono text-[11px] uppercase tracking-wide text-rose-500">
                              {finding.file ?? 'Unknown file'}:{finding.line ?? '—'}
                            </p>
                            <pre className="whitespace-pre-wrap break-all font-mono text-xs text-rose-950">{finding.match}</pre>
                          </div>
                        </div>
                      );
                    }

                    if (isVulnerabilityFinding(finding)) {
                      const expanded = isSnippetExpanded(key);
                      const fixState = aiFixStates[key];
                      const isLoadingFix = fixState?.status === 'loading';
                      const hasFixError = fixState?.status === 'error';
                      const hasFixResult = fixState?.status === 'success' && fixState.result;
                      const message = finding.message ?? '';
                      const { title, description } = splitVulnerabilityMessage(message);
                      const hasDescription = description.length > 0;
                      const displayTitle = title || message;
                      const shouldShowDescription = hasDescription;
                      return (
                        <div
                          key={key}
                          className="relative space-y-3 rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-sm text-slate-700 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]"
                        >
                          <span
                            className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getSeverityPillClassName(finding.severity)}`}
                          >
                            <Icon name="alert" width={12} height={12} /> {formatSeverity(finding.severity)}
                          </span>
                          <div className="pr-24">
                            <p className="text-sm font-semibold text-slate-900 whitespace-pre-line">{displayTitle}</p>
                            {shouldShowDescription && (
                              <p className="mt-1 whitespace-pre-line text-xs text-slate-600">{description}</p>
                            )}
                            <p className="mt-1 text-xs text-slate-500">
                              File: {finding.file ?? 'Unknown file'} • Line {finding.line ?? '—'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSnippet(key)}
                              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:text-accent"
                              aria-expanded={expanded}
                            >
                              {expanded ? 'Hide snippet' : 'Show snippet'}
                              <Icon name={expanded ? 'chevron-up' : 'chevron-down'} width={12} height={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerAiFix(key, finding)}
                              className={`copilot-button${isLoadingFix ? ' copilot-button--loading' : ''}`}
                              disabled={isLoadingFix}
                              aria-busy={isLoadingFix}
                            >
                              <span>
                                <span aria-hidden="true" className="text-white">
                                  ✨
                                </span>{' '}
                                Fix with Copilot
                                {isLoadingFix && (
                                  <Icon name="refresh" width={12} height={12} className="ml-2 text-white animate-spin" />
                                )}
                              </span>
                            </button>
                          </div>
                          {expanded && (
                            <div className="space-y-2 rounded-lg border border-rose-400/70 bg-gradient-to-br from-white/95 via-rose-50 to-rose-100 p-4 text-xs text-rose-900 shadow-[0_22px_48px_-32px_rgba(244,63,94,0.3)]">
                              <p className="font-mono text-[11px] uppercase tracking-wide text-rose-500">
                                {finding.file ?? 'Unknown file'}:{finding.line ?? '—'}-{finding.end_line ?? finding.line ?? '—'}
                              </p>
                              <pre className="whitespace-pre-wrap break-all font-mono text-xs text-rose-950">{finding.code_snippet ?? 'Snippet unavailable.'}</pre>
                            </div>
                          )}
                          {isLoadingFix && (
                            <p className="text-xs font-medium text-slate-500">Generating secure fix suggestion…</p>
                          )}
                          {hasFixError && fixState?.error && (
                            <p className="rounded-lg border border-rose-400/60 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                              Unable to generate fix: {fixState.error}
                            </p>
                          )}
                          {hasFixResult && fixState?.result && (
                            <div className="space-y-2 rounded-lg border border-emerald-400/70 bg-gradient-to-br from-white/95 via-emerald-50 to-emerald-100 p-4 text-xs text-emerald-900 shadow-[0_22px_48px_-32px_rgba(16,185,129,0.32)]">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-emerald-900">
                                  {fixState.result.fix_description ?? 'Suggested remediation'}
                                </p>
                                {fixState.result.vulnerability_id && (
                                  <span className="rounded-full border border-emerald-300/70 bg-emerald-100/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                                    Ref: {fixState.result.vulnerability_id}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1 rounded-lg border border-emerald-300/70 bg-gradient-to-br from-white/95 via-emerald-50 to-emerald-100 p-3">
                                <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-600">AI Fixed Snippet</p>
                                <pre className="whitespace-pre-wrap break-all font-mono text-xs text-emerald-900">{fixState.result.fixed_code ?? 'No updated code provided.'}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-xs text-slate-700 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]"
                      >
                        <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap break-all">{JSON.stringify(finding, null, 2)}</pre>
                      </div>
                    );
                  });

                if (isScaTool && scaGrouping) {
                  return (
                    <>
                      {shouldShowRemediation && (
                        <div className="space-y-2 rounded-lg border border-emerald-400/70 bg-gradient-to-br from-white/95 via-emerald-50 to-emerald-100 p-4 text-xs text-emerald-900 shadow-[0_22px_48px_-32px_rgba(16,185,129,0.32)]">
                          <p className="text-sm font-semibold text-emerald-900">Recommended remediation</p>
                          <ul className="list-disc space-y-1 pl-5 text-xs text-emerald-800">
                            <li>
                              Remove the exposed value from source control and reference it via a secrets manager or environment variable instead of hardcoding it.
                            </li>
                            <li>Rotate the compromised credential and audit recent usage for suspicious access.</li>
                            <li>
                              Update deployment pipelines to inject secrets at runtime and add automated scanning to prevent future commits with sensitive strings.
                            </li>
                          </ul>
                        </div>
                      )}
                      {scaGrouping.groups.map((group) => (
                        <div
                          key={group.key}
                          className="relative rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-sm text-slate-700 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]"
                        >
                          <span
                            className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getSeverityPillClassName(group.severityValue)}`}
                          >
                            <Icon name="alert" width={12} height={12} /> {group.severityLabel}
                          </span>
                          <div className="pr-24">
                            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                              <div className="space-y-1">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Package</dt>
                                <dd className="font-medium text-slate-900 break-words">{group.packageName}</dd>
                              </div>
                              <div className="space-y-1">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Version</dt>
                                <dd className="font-semibold text-rose-600 break-words">{group.packageVersion}</dd>
                              </div>
                              {group.modules.length > 0 && (
                                <div className="space-y-1 sm:col-start-3">
                                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Module</dt>
                                  <dd className="font-medium text-slate-900 break-words">{group.modules.join(', ')}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                          <div className="mt-4 space-y-2">
                            {group.findings.map((groupFinding, groupIndex) => {
                              const groupKey = `${group.key}-${groupIndex}`;
                              const fixVersions = formatFixVersions(groupFinding.fix);

                              return (
                                <div
                                  key={groupKey}
                                  className="rounded-lg border border-slate-200/70 bg-white/90 p-3 text-xs text-slate-700"
                                >
                                  <p className="text-sm font-semibold text-slate-900">
                                    {groupFinding.id ?? 'Untracked vulnerability'}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">
                                    {groupFinding.description ?? 'No description available.'}
                                  </p>
                                  <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[minmax(0,1fr)]">
                                    <div className="space-y-0.5">
                                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Fix version</dt>
                                      <dd className="font-semibold text-emerald-600 break-words">{fixVersions ?? '—'}</dd>
                                    </div>
                                  </dl>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {scaGrouping.leftovers.map((finding, index) => {
                        const key = `${toolName}-other-${index}`;
                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-xs text-slate-700 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]"
                          >
                            <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap break-all">{JSON.stringify(finding, null, 2)}</pre>
                          </div>
                        );
                      })}
                    </>
                  );
                }

                return (
                  <>
                    {shouldShowRemediation && !isScaTool && (
                      <div className="space-y-2 rounded-lg border border-emerald-400/70 bg-gradient-to-br from-white/95 via-emerald-50 to-emerald-100 p-4 text-xs text-emerald-900 shadow-[0_22px_48px_-32px_rgba(16,185,129,0.32)]">
                        <p className="text-sm font-semibold text-emerald-900">Recommended remediation</p>
                        <ul className="list-disc space-y-1 pl-5 text-xs text-emerald-800">
                          <li>
                            Remove the exposed value from source control and reference it via a secrets manager or environment variable instead of hardcoding it.
                          </li>
                          <li>Rotate the compromised credential and audit recent usage for suspicious access.</li>
                          <li>
                            Update deployment pipelines to inject secrets at runtime and add automated scanning to prevent future commits with sensitive strings.
                          </li>
                        </ul>
                      </div>
                    )}
                    {renderDefaultFindings()}
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-xs text-slate-600 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
              No findings reported.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
