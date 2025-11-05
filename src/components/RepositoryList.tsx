import clsx from 'clsx';
import dayjs from '../utils/dayjs';
import type { RepositoryGroup } from '../types/domain';
import { StatusPill } from './StatusPill';
import { Icon } from './Icon';

export type RepositoryListProps = {
  repositories: RepositoryGroup[];
  activeRepositoryId?: string | null;
  onSelect: (repoId: string) => void;
};

export const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  activeRepositoryId,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      {repositories.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-400">
          No repositories match the current filters.
        </p>
      )}
      {repositories.map((repo) => {
        const latestRun = repo.latestScan;
        return (
          <button
            key={repo.id}
            onClick={() => onSelect(repo.id)}
            className={clsx(
              'group w-full rounded-2xl border p-5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
              'border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white/90 dark:border-slate-800/70 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/70',
              activeRepositoryId === repo.id &&
                'border-accent/70 bg-accent/10 text-slate-900 ring-2 ring-accent/20 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/30',
            )}
            aria-current={activeRepositoryId === repo.id}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-sm font-semibold uppercase text-accent">
                  {repo.repoName.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{repo.repoName}</p>
                  {latestRun?.repository.branch && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Branch · {latestRun.repository.branch}</p>
                  )}
                </div>
              </div>
              {latestRun && (
                <div className="flex items-center gap-2">
                  {activeRepositoryId === repo.id && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
                      <Icon name="sparkle" width={12} height={12} /> Active
                    </span>
                  )}
                  <StatusPill qualityGatePassed={latestRun.qualityGatePassed} />
                </div>
              )}
            </div>
            {latestRun && (
              <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Icon name="git-commit" width={14} height={14} />
                  <span className="truncate">{latestRun.scanType}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" width={12} height={12} />
                    {dayjs(latestRun.timestamp).format('MMM D, YYYY h:mm A')}
                  </span>
                  {latestRun.repository.commitHash && (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="hash" width={12} height={12} />
                      #{latestRun.repository.commitHash.slice(0, 8)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Icon name="activity" width={12} height={12} />
                    {latestRun.status}
                  </span>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
