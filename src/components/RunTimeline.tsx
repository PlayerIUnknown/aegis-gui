import { useState } from 'react';
import clsx from 'clsx';
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
  const [openRunId, setOpenRunId] = useState<string | undefined>(sortedRuns[0]?.id);

  return (
    <div className="relative space-y-6">
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-8 bottom-8 hidden w-px bg-slate-800/60 md:block"
      />
      {sortedRuns.map((run) => {
        const isOpen = run.id === openRunId;
        return (
          <div key={run.id} className="relative pl-0 md:pl-14">
            <span
              aria-hidden
              className={clsx(
                'pointer-events-none absolute left-3 top-8 hidden h-3 w-3 rounded-full border-2 border-slate-950 md:block',
                run.qualityGateStatus === 'passed'
                  ? 'bg-success border-success/50 shadow-[0_0_0_4px_rgba(34,197,94,0.15)]'
                  : 'bg-danger/80 border-danger/60 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]'
              )}
            />
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/40">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Icon name="git-commit" width={20} height={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{run.commitMessage}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="user" width={12} height={12} />
                        {run.commitAuthor}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="clock" width={12} height={12} />
                        {dayjs(run.timestamp).format('MMM D, HH:mm')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="git-branch" width={12} height={12} />
                        {run.branch}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="hash" width={12} height={12} />
                        #{run.commitHash}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill status={run.qualityGateStatus} />
                  <button
                    onClick={() => setOpenRunId(isOpen ? undefined : run.id)}
                    className="flex items-center gap-2 rounded-full border border-slate-700/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-accent/60 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                    aria-expanded={isOpen}
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
  <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-xl font-semibold text-slate-100">{value}</p>
  </div>
);
