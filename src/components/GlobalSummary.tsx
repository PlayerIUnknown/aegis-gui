import { globalSummary } from '../data/sampleData';
import { Icon } from './Icon';

export const GlobalSummary: React.FC = () => {
  const passRate = globalSummary.totalRuns
    ? Math.round((globalSummary.passed / globalSummary.totalRuns) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryTile
        icon={<Icon name="activity" width={22} height={22} />}
        title="Total Runs"
        value={globalSummary.totalRuns}
        tone="neutral"
      />
      <SummaryTile
        icon={<Icon name="check-circle" width={22} height={22} />}
        title="Quality Gates Passed"
        value={globalSummary.passed}
        tone="success"
      />
      <SummaryTile
        icon={<Icon name="x-circle" width={22} height={22} />}
        title="Quality Gates Failed"
        value={globalSummary.failed}
        tone="danger"
      />
      <SummaryTile
        icon={<Icon name="shield" width={22} height={22} />}
        title="Pass Rate"
        value={`${passRate}%`}
        tone="accent"
      />
    </div>
  );
};

type SummaryTileProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  tone: 'neutral' | 'success' | 'danger' | 'accent';
};

const backgroundByTone: Record<SummaryTileProps['tone'], string> = {
  neutral: 'bg-slate-900/60 border-slate-800/60',
  success: 'bg-success/10 border-success/30 text-success',
  danger: 'bg-danger/10 border-danger/30 text-danger',
  accent: 'bg-accent/10 border-accent/30 text-accent'
};

const SummaryTile: React.FC<SummaryTileProps> = ({ title, value, icon, tone }) => (
  <div
    className={`flex flex-col gap-3 rounded-3xl border p-5 shadow-lg shadow-slate-950/30 ${backgroundByTone[tone]}`}
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/40 text-slate-100">
      {icon}
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  </div>
);
