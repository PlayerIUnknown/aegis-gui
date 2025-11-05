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
  neutral: 'border-slate-800/60 bg-slate-900/60 text-slate-100',
  success: 'border-success/40 bg-success/10 text-success',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  accent: 'border-accent/40 bg-accent/10 text-accent',
};

const iconBackgroundByTone: Record<SummaryTileProps['tone'], string> = {
  neutral: 'bg-slate-900/50 text-slate-300',
  success: 'bg-success/20 text-success',
  danger: 'bg-danger/20 text-danger',
  accent: 'bg-accent/20 text-accent',
};

const tileBaseClasses =
  'flex flex-col gap-3 rounded-3xl border p-5 shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:shadow-2xl';

const SummaryTile: React.FC<SummaryTileProps> = ({ title, value, icon, tone, helper }) => (
  <div className={`${tileBaseClasses} ${backgroundByTone[tone]}`}>
    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBackgroundByTone[tone]}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
    </div>
    <p className="text-xs text-slate-400">{helper}</p>
  </div>
);
