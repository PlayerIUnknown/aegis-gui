import type { RepositoryGroup } from '../types/domain';
import { Icon } from './Icon';
import { StatusPill } from './StatusPill';
import { formatTimestamp, timestampToValue } from '../utils/timestamps';

type RepositoryOverviewProps = {
  repository?: RepositoryGroup;
};

export const RepositoryOverview: React.FC<RepositoryOverviewProps> = ({ repository }) => {
  if (!repository) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Select a repository on the left to view its recent activity.
      </p>
    );
  }

  const totalRuns = repository.scans.length;
  const latestRun = repository.latestScan;
  const lastCompletedRun = repository.scans
    .filter((scan) => scan.status === 'completed')
    .sort((a, b) => timestampToValue(b.timestamp) - timestampToValue(a.timestamp))[0];
  const lastCompletedDate = formatTimestamp(lastCompletedRun?.timestamp);
  const passingRuns = repository.scans.filter((scan) => scan.qualityGatePassed === true).length;
  const failedRuns = repository.scans.filter((scan) => scan.qualityGatePassed === false).length;
  const runningRuns = repository.scans.filter((scan) => scan.status === 'running').length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-xl shadow-slate-300/40">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repository overview</p>
          <h2 className="text-xl font-semibold text-slate-900">{repository.repoName}</h2>
          <p className="text-xs text-slate-500">{totalRuns} recorded run{totalRuns === 1 ? '' : 's'} for this workspace.</p>
        </div>
        {latestRun && <StatusPill qualityGatePassed={latestRun.qualityGatePassed} />}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RepositoryStat icon="activity" label="Total runs" value={totalRuns} />
        <RepositoryStat icon="check-circle" label="Passing" value={passingRuns} tone="success" />
        <RepositoryStat icon="x-circle" label="Failed" value={failedRuns} tone="danger" />
        <RepositoryStat icon="clock" label="Running" value={runningRuns} tone="warning" />
        <RepositoryStat
          icon="git-commit"
          label="Last completed run"
          value={lastCompletedDate}
          helper={latestRun?.repository.commitHash ? `Commit #${latestRun.repository.commitHash.slice(0, 8)}` : undefined}
        />
        <RepositoryStat
          icon="git-branch"
          label="Branch"
          value={latestRun?.repository.branch ?? '—'}
          helper={latestRun?.scanType ?? undefined}
        />
        <RepositoryStat
          icon="shield"
          label="Quality gate"
          value={
            latestRun?.qualityGatePassed === true
              ? 'Passed'
              : latestRun?.qualityGatePassed === false
              ? 'Failed'
              : latestRun
              ? 'Pending'
              : '—'
          }
          helper={latestRun ? `Status: ${latestRun.status}` : undefined}
        />
        <RepositoryStat
          icon="package"
          label="Packages in last run"
          value={latestRun?.summary.packagesFound ?? '—'}
          helper={
            latestRun ? `${latestRun.summary.vulnerabilitiesInPackages} vulnerable` : undefined
          }
        />
      </dl>
    </section>
  );
};

type RepositoryStatProps = {
  icon: 'activity' | 'check-circle' | 'clock' | 'git-branch' | 'git-commit' | 'package' | 'shield' | 'x-circle';
  label: string;
  value: number | string;
  helper?: string;
  tone?: 'default' | 'success' | 'danger' | 'warning';
};

const toneStyles: Record<NonNullable<RepositoryStatProps['tone']>, string> = {
  default: 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900',
  success:
    'border-success/40 bg-gradient-to-br from-success/10 via-success/10 to-white text-success',
  danger:
    'border-danger/40 bg-gradient-to-br from-danger/10 via-danger/5 to-white text-danger',
  warning:
    'border-warning/40 bg-gradient-to-br from-warning/10 via-warning/5 to-white text-warning',
};

const iconToneStyles: Record<NonNullable<RepositoryStatProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-500',
  success: 'bg-success/20 text-success',
  danger: 'bg-danger/20 text-danger',
  warning: 'bg-warning/20 text-warning',
};

const RepositoryStat: React.FC<RepositoryStatProps> = ({ icon, label, value, helper, tone = 'default' }) => (
  <div className={`rounded-3xl border p-5 shadow-lg shadow-slate-950/20 ${toneStyles[tone]}`}>
    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${iconToneStyles[tone]}`}>
      <Icon name={icon} width={18} height={18} />
    </div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-2 text-lg font-semibold text-inherit">{value}</dd>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);
