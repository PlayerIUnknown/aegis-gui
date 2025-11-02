import { useState } from 'react';
import dayjs from '../utils/dayjs';
import { PipelineRun } from '../data/sampleData';
import { StatusPill } from './StatusPill';
import { ToolFindingsPanel } from './ToolFindingsPanel';
import { Icon } from './Icon';

type RunTimelineProps = {
  runs: PipelineRun[];
};

export const RunTimeline: React.FC<RunTimelineProps> = ({ runs }) => {
  const sortedRuns = [...runs].sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)));
  const [openRunId, setOpenRunId] = useState(sortedRuns[0]?.id);

  return (
    <div className="space-y-4">
      {sortedRuns.map((run) => {
        const isOpen = run.id === openRunId;
        return (
          <div
            key={run.id}
            className="rounded-3xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-xl shadow-slate-950/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon name="git-commit" width={20} height={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{run.commitMessage}</p>
                  <p className="text-xs text-slate-400">
                    {run.commitAuthor} · {dayjs(run.timestamp).format('MMM D, HH:mm')} · {run.branch} · #{run.commitHash}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={run.qualityGateStatus} />
                <button
                  onClick={() => setOpenRunId(isOpen ? undefined : run.id)}
                  className="flex items-center gap-2 rounded-full border border-slate-700/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-accent/60 hover:text-accent"
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <DetailStat label="Packages" value={run.summary.packagesFound} />
                  <DetailStat label="Vulnerable Packages" value={run.summary.vulnerabilitiesInPackages} />
                  <DetailStat label="Code Findings" value={run.summary.codeVulnerabilities} />
                  <DetailStat label="Secrets" value={run.summary.secretsFound} />
                  <DetailStat label="Low" value={run.summary.lowSeverity} />
                  <DetailStat label="Medium" value={run.summary.mediumSeverity} />
                  <DetailStat label="High" value={run.summary.highSeverity} />
                  <DetailStat label="Critical" value={run.summary.criticalSeverity} />
                </div>
                <ToolFindingsPanel tools={run.tools} />
                <a
                  href={"#"}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:text-accent/80"
                >
                  View raw artifacts
                  <Icon name="external-link" width={16} height={16} />
                </a>
              </div>
            )}
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
  <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
  </div>
);
