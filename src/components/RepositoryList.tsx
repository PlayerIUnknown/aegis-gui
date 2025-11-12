import clsx from 'clsx';
import type { RepositoryGroup } from '../types/domain';
import { StatusPill } from './StatusPill';
import { Icon } from './Icon';
import { formatTimestamp } from '../utils/timestamps';

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
        <p className="rounded-lg border border-white/18 bg-gradient-to-br from-white/95 via-slate-100/90 to-white/95 p-6 text-sm text-slate-600 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
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
              'group w-full rounded-lg border p-5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              'border-white/15 bg-gradient-to-br from-white/95 via-slate-100/90 to-white/95 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:shadow-[0_26px_56px_-34px_rgba(15,23,42,0.52)]',
              activeRepositoryId === repo.id &&
                'border-accent/50 bg-gradient-to-br from-accent/15 via-accent/10 to-white text-slate-900 shadow-[0_26px_56px_-32px_rgba(15,23,42,0.55)] ring-2 ring-accent/25',
            )}
            aria-current={activeRepositoryId === repo.id}
            type="button"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-accent/10 via-accent/5 to-white text-sm font-semibold uppercase text-accent shadow-inner">
                  {repo.repoName.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{repo.repoName}</p>
                  {latestRun?.repository.branch && (
                    <p className="text-xs text-slate-500">Branch · {latestRun.repository.branch}</p>
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
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2 text-slate-600">
                  <Icon name="git-commit" width={14} height={14} />
                  <span className="truncate">{latestRun.scanType}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" width={12} height={12} />
                    {formatTimestamp(latestRun.timestamp)}
                  </span>
                  {latestRun.repository.commitHash && (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="hash" width={12} height={12} />
                      #{latestRun.repository.commitHash.slice(0, 8)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-slate-600">
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
