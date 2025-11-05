import clsx from 'clsx';
import { ReactNode } from 'react';

type SummaryCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  intent?: 'neutral' | 'success' | 'warning' | 'danger';
};

const intentStyles: Record<NonNullable<SummaryCardProps['intent']>, string> = {
  neutral: 'bg-white border-slate-200 text-slate-900 dark:bg-slate-900/60 dark:border-slate-800/60 dark:text-slate-100',
  success:
    'bg-success/10 border-success/30 text-success dark:border-success/50 dark:bg-success/20 dark:text-success/90',
  warning:
    'bg-warning/10 border-warning/30 text-warning dark:border-warning/50 dark:bg-warning/20 dark:text-warning/90',
  danger:
    'bg-danger/10 border-danger/30 text-danger dark:border-danger/50 dark:bg-danger/20 dark:text-danger/90'
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  intent = 'neutral'
}) => (
  <div
    className={clsx(
      'flex h-full flex-col justify-between rounded-2xl border p-4 shadow-lg shadow-slate-200/40 dark:shadow-slate-950/30',
      intentStyles[intent]
    )}
  >
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-inherit">{value}</p>
    </div>
    {subtitle && <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
  </div>
);
