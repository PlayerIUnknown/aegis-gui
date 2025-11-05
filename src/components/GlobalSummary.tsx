import type { DashboardSummaryResponse } from '../api/types';
import { Icon } from './Icon';

type GlobalSummaryProps = {
  summary?: DashboardSummaryResponse | null;
};

export const GlobalSummary: React.FC<GlobalSummaryProps> = ({ summary }) => {
  const totals = summary?.totals.scans ?? 0;
  const passed = summary?.quality_gate.passed ?? 0;
  const failed = summary?.quality_gate.failed ?? 0;
  const passRate = totals ? Math.round((passed / totals) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryTile
        icon={<Icon name="activity" width={22} height={22} />}
        title="Total scans"
        value={totals}
        tone="neutral"
        helper="Total pipeline executions recorded for this tenant."
      />
      <SummaryTile
        icon={<Icon name="check-circle" width={22} height={22} />}
        title="Quality gates passed"
        value={passed}
        tone="success"
        helper="Runs that cleared every policy control."
      />
      <SummaryTile
        icon={<Icon name="x-circle" width={22} height={22} />}
        title="Quality gates failed"
        value={failed}
        tone="danger"
        helper="Executions that require follow-up action."
      />
      <SummaryTile
        icon={<Icon name="shield" width={22} height={22} />}
        title="Pass rate"
        value={`${passRate}%`}
        tone="accent"
        helper="Share of runs currently passing configured gates."
      />
    </div>
  );
};

type SummaryTileProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  tone: 'neutral' | 'success' | 'danger' | 'accent';
  helper: string;
};

const backgroundByTone: Record<SummaryTileProps['tone'], string> = {
  neutral: 'border-slate-200 bg-white text-slate-900 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-100',
  success:
    'border-success/40 bg-success/10 text-success dark:border-success/60 dark:bg-success/20 dark:text-success/90',
  danger:
    'border-danger/40 bg-danger/10 text-danger dark:border-danger/60 dark:bg-danger/20 dark:text-danger/90',
  accent:
    'border-accent/40 bg-accent/10 text-accent dark:border-accent/60 dark:bg-accent/20 dark:text-accent/90',
};

const iconBackgroundByTone: Record<SummaryTileProps['tone'], string> = {
  neutral: 'bg-slate-100 text-slate-500 dark:bg-slate-900/50 dark:text-slate-300',
  success: 'bg-success/20 text-success dark:bg-success/30 dark:text-success/90',
  danger: 'bg-danger/20 text-danger dark:bg-danger/30 dark:text-danger/90',
  accent: 'bg-accent/20 text-accent dark:bg-accent/30 dark:text-accent/90',
};

const tileBaseClasses =
  'flex flex-col gap-3 rounded-3xl border p-5 shadow-lg shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-2xl dark:shadow-slate-950/30';

const SummaryTile: React.FC<SummaryTileProps> = ({ title, value, icon, tone, helper }) => (
  <div className={`${tileBaseClasses} ${backgroundByTone[tone]}`}>
    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBackgroundByTone[tone]}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p>
  </div>
);
