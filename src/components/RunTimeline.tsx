import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { ScanDetailsView, ScanView } from '../types/domain';
import { StatusPill } from './StatusPill';
import { ToolFindingsPanel } from './ToolFindingsPanel';
import { Icon, type IconName } from './Icon';
import { formatTimestamp, timestampToValue } from '../utils/timestamps';

type RunTimelineProps = {
  runs: ScanView[];
  detailsById: Record<string, ScanDetailsView | undefined>;
  loadingScanIds?: Set<string>;
  onLoadDetails: (scanId: string) => void;
};

export const RunTimeline: React.FC<RunTimelineProps> = ({
  runs,
  detailsById,
  loadingScanIds,
  onLoadDetails,
}) => {
  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => timestampToValue(b.timestamp) - timestampToValue(a.timestamp)),
    [runs],
  );
  const [openRunId, setOpenRunId] = useState<string | undefined>(sortedRuns[0]?.id);

  useEffect(() => {
    if (sortedRuns.length === 0) {
      setOpenRunId(undefined);
      return;
    }

    setOpenRunId((current) => {
      if (current && sortedRuns.some((run) => run.id === current)) {
        return current;
      }
      return sortedRuns[0]?.id;
    });
  }, [sortedRuns]);

  useEffect(() => {
    if (!openRunId) {
      return;
    }

    const currentDetails = detailsById[openRunId];
    if (!currentDetails) {
      onLoadDetails(openRunId);
    }
  }, [openRunId, detailsById, onLoadDetails]);

  return (
    <div className="relative space-y-6 overflow-hidden">
      <span
        aria-hidden
        className="pointer-events-none absolute left-6 top-12 bottom-12 hidden w-px bg-accent/30 md:block"
      />
      {sortedRuns.map((run) => {
        const isOpen = run.id === openRunId;
        const details = detailsById[run.id];
        const isLoading = loadingScanIds?.has(run.id);
        const handleToggle = () => {
          const nextOpen = isOpen ? undefined : run.id;
          setOpenRunId(nextOpen);
          if (!isOpen && !details) {
            onLoadDetails(run.id);
          }
        };

        return (
          <div key={run.id} className="relative pl-0 md:pl-20">
            <span
              aria-hidden
              className={clsx(
                'pointer-events-none absolute left-5 top-11 hidden h-3 w-3 rounded-full border-2 border-white md:block',
                run.qualityGatePassed === true
                  ? 'bg-success border-success/50 shadow-[0_0_0_4px_rgba(34,197,94,0.15)]'
                  : run.qualityGatePassed === false
                  ? 'bg-danger/80 border-danger/60 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]'
                  : 'bg-warning/80 border-warning/60 shadow-[0_0_0_4px_rgba(250,204,21,0.12)]',
              )}
            />
            <div className="overflow-hidden rounded-3xl border-2 border-accent/40 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_45px_90px_-50px_rgba(99,102,241,0.8)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Icon name="git-commit" width={20} height={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Scan executed {formatTimestamp(run.timestamp)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {run.repository.branch && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="git-branch" width={12} height={12} />
                          {run.repository.branch}
                        </span>
                      )}
                      {run.repository.commitHash && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="hash" width={12} height={12} />
                          #{run.repository.commitHash.slice(0, 8)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Icon name="activity" width={12} height={12} />
                        {run.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill qualityGatePassed={run.qualityGatePassed} />
                  <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 rounded-full border-2 border-accent/40 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    aria-expanded={isOpen}
                    type="button"
                  >
                    {isOpen ? 'Hide details' : 'Show details'}
                    {isOpen ? (
                      <Icon name="chevron-up" width={16} height={16} />
                    ) : (
                      <Icon name="chevron-down" width={16} height={16} />
                    )}
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <DetailStat
                      label="Packages"
                      value={run.summary.packagesFound}
                      tone="accent"
                      icon="package"
                    />
                    <DetailStat
                      label="Vulnerable packages"
                      value={run.summary.vulnerabilitiesInPackages}
                      tone="warning"
                      icon="package-export"
                    />
                    <DetailStat
                      label="Code findings"
                      value={run.summary.codeVulnerabilities}
                      tone="neutral"
                      icon="code"
                    />
                    <DetailStat
                      label="Secrets"
                      value={run.summary.secretsFound}
                      tone="danger"
                      icon="key"
                    />
                    <DetailStat label="Low" value={run.summary.lowSeverity} tone="success" icon="sparkle" />
                    <DetailStat label="Medium" value={run.summary.mediumSeverity} tone="warning" icon="sun" />
                    <DetailStat label="High" value={run.summary.highSeverity} tone="danger" icon="alert" />
                    <DetailStat label="Critical" value={run.summary.criticalSeverity} tone="danger" icon="x-circle" />
                  </div>
                  {isLoading && (
                    <p className="rounded-2xl border-2 border-accent/40 bg-slate-100 p-4 text-sm text-slate-600">
                      Loading tool results…
                    </p>
                  )}
                  {!isLoading && <ToolFindingsPanel tools={details?.tools} />}
                  {run.targetPath && (
                    <p className="text-xs text-slate-500">
                      Target path: <span className="font-mono text-slate-800">{run.targetPath}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

type DetailStatProps = {
  label: string;
  value: number | string;
  tone: 'neutral' | 'accent' | 'warning' | 'danger' | 'success';
  icon: IconName;
};

const statBackgroundByTone: Record<DetailStatProps['tone'], string> = {
  neutral: 'bg-gradient-to-br from-white via-slate-50 to-white text-slate-900',
  accent: 'bg-gradient-to-br from-accent/10 via-accent/5 to-white text-slate-900',
  warning: 'bg-gradient-to-br from-warning/10 via-warning/5 to-white text-slate-900',
  danger: 'bg-gradient-to-br from-danger/10 via-danger/5 to-white text-slate-900',
  success: 'bg-gradient-to-br from-success/10 via-success/5 to-white text-slate-900',
};

const statIconBackgroundByTone: Record<DetailStatProps['tone'], string> = {
  neutral: 'bg-white text-accent shadow-[0_0_0_1px_rgba(99,102,241,0.15)]',
  accent: 'bg-white text-accent shadow-[0_0_0_1px_rgba(99,102,241,0.2)]',
  warning: 'bg-white text-warning shadow-[0_0_0_1px_rgba(99,102,241,0.18)]',
  danger: 'bg-white text-danger shadow-[0_0_0_1px_rgba(99,102,241,0.18)]',
  success: 'bg-white text-success shadow-[0_0_0_1px_rgba(99,102,241,0.18)]',
};

const DetailStat: React.FC<DetailStatProps> = ({ label, value, tone, icon }) => (
  <div
    className={`flex h-full min-h-[128px] min-w-0 flex-col justify-between gap-4 rounded-3xl border-2 border-accent/30 p-4 shadow-[0_20px_45px_-35px_rgba(99,102,241,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-30px_rgba(99,102,241,0.75)] ${statBackgroundByTone[tone]}`}
  >
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${statIconBackgroundByTone[tone]}`}>
        <Icon name={icon} width={18} height={18} />
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
    </div>
    <p className="text-lg font-semibold text-slate-900 sm:text-xl">{value}</p>
  </div>
);
