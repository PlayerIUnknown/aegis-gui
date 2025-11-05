import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { ScanDetailsView, ScanView } from '../types/domain';
import { StatusPill } from './StatusPill';
import { ToolFindingsPanel } from './ToolFindingsPanel';
import { Icon } from './Icon';
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
        className="pointer-events-none absolute left-6 top-12 bottom-12 hidden w-px bg-slate-200 md:block"
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
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-xl shadow-slate-300/40">
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
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-accent/60 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
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
                    <DetailStat label="Packages" value={run.summary.packagesFound} />
                    <DetailStat label="Vulnerable packages" value={run.summary.vulnerabilitiesInPackages} />
                    <DetailStat label="Code findings" value={run.summary.codeVulnerabilities} />
                    <DetailStat label="Secrets" value={run.summary.secretsFound} />
                    <DetailStat label="Low" value={run.summary.lowSeverity} />
                    <DetailStat label="Medium" value={run.summary.mediumSeverity} />
                    <DetailStat label="High" value={run.summary.highSeverity} />
                    <DetailStat label="Critical" value={run.summary.criticalSeverity} />
                  </div>
                  {isLoading && (
                    <p className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600">
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
};

const DetailStat: React.FC<DetailStatProps> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
  </div>
);
