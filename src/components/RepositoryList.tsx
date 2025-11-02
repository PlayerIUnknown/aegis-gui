import clsx from 'clsx';
import dayjs from '../utils/dayjs';
import { Repository, getLatestRun } from '../data/sampleData';
import { StatusPill } from './StatusPill';
import { Icon } from './Icon';

export type RepositoryListProps = {
  repositories: Repository[];
  activeRepositoryId: string;
  onSelect: (repoId: string) => void;
};

export const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  activeRepositoryId,
  onSelect
}) => {
  return (
    <div className="space-y-3">
      {repositories.length === 0 && (
        <p className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
          No repositories match the current filters.
        </p>
      )}
      {repositories.map((repo) => {
        const latestRun = getLatestRun(repo);
        return (
          <button
            key={repo.id}
            onClick={() => onSelect(repo.id)}
            className={clsx(
              'group w-full rounded-2xl border border-slate-800/70 bg-slate-950/60 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
              activeRepositoryId === repo.id && 'border-accent/70 bg-slate-900 ring-2 ring-accent/30'
            )}
            aria-current={activeRepositoryId === repo.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-semibold text-slate-900"
                  style={{ backgroundColor: repo.avatarColor }}
                >
                  {repo.owner[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{repo.owner}/{repo.name}</p>
                  <p className="text-xs text-slate-400">Default branch · {repo.defaultBranch}</p>
                </div>
              </div>
              {latestRun && (
                <div className="flex items-center gap-2">
                  {activeRepositoryId === repo.id && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
                      <Icon name="sparkle" width={12} height={12} /> Active
                    </span>
                  )}
                  <StatusPill status={latestRun.qualityGateStatus} />
                </div>
              )}
            </div>
            {latestRun && (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon name="git-commit" width={14} height={14} />
                  <span className="truncate">{latestRun.commitMessage}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="user" width={12} height={12} />
                    {latestRun.commitAuthor}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" width={12} height={12} />
                    {dayjs(latestRun.timestamp).fromNow()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="hash" width={12} height={12} />
                    #{latestRun.commitHash}
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
