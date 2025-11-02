import clsx from 'clsx';
import dayjs from '../utils/dayjs';
import { Repository, getLatestRun } from '../data/sampleData';
import { StatusPill } from './StatusPill';

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
      {repositories.map((repo) => {
        const latestRun = getLatestRun(repo);
        return (
          <button
            key={repo.id}
            onClick={() => onSelect(repo.id)}
            className={clsx(
              'w-full rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 text-left transition-all duration-200 hover:border-accent/50 hover:bg-slate-900/70',
              activeRepositoryId === repo.id && 'border-accent/80 bg-slate-900'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-slate-900"
                  style={{ backgroundColor: repo.avatarColor }}
                >
                  {repo.owner[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{repo.owner}/{repo.name}</p>
                  <p className="text-xs text-slate-400">Default branch · {repo.defaultBranch}</p>
                </div>
              </div>
              {latestRun && <StatusPill status={latestRun.qualityGateStatus} />}
            </div>
            {latestRun && (
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                <p className="block truncate text-slate-300">{latestRun.commitMessage}</p>
                <p>
                  {latestRun.commitAuthor} · {dayjs(latestRun.timestamp).fromNow()} · #{latestRun.commitHash}
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
