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
  neutral: 'bg-gradient-to-br from-white via-slate-50 to-white text-slate-900',
  success:
    'bg-gradient-to-br from-success/10 via-success/5 to-white text-success',
  danger:
    'bg-gradient-to-br from-danger/10 via-danger/5 to-white text-danger',
  accent:
    'bg-gradient-to-br from-accent/10 via-accent/5 to-white text-accent',
};

const iconBackgroundByTone: Record<SummaryTileProps['tone'], string> = {
  neutral: 'bg-white text-accent shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
  success: 'bg-white text-success shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
  danger: 'bg-white text-danger shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
  accent: 'bg-white text-accent shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
};

const tileBaseClasses =
  'flex flex-col gap-3 rounded-xl border border-slate-200/70 p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_52px_-30px_rgba(15,23,42,0.5)]';

const SummaryTile: React.FC<SummaryTileProps> = ({ title, value, icon, tone, helper }) => (
  <div className={`${tileBaseClasses} ${backgroundByTone[tone]}`}>
    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBackgroundByTone[tone]}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
    <p className="text-xs text-slate-500">{helper}</p>
  </div>
);
