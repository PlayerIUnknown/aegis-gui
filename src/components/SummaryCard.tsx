import clsx from 'clsx';
import { ReactNode } from 'react';

type SummaryCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  intent?: 'neutral' | 'success' | 'warning' | 'danger';
};

const intentStyles: Record<NonNullable<SummaryCardProps['intent']>, string> = {
  neutral: 'bg-white border-slate-200 text-slate-900',
  success:
    'bg-success/10 border-success/30 text-success',
  warning:
    'bg-warning/10 border-warning/30 text-warning',
  danger:
    'bg-danger/10 border-danger/30 text-danger'
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  intent = 'neutral'
}) => (
  <div
    className={clsx(
      'flex h-full flex-col justify-between rounded-2xl border p-4 shadow-lg shadow-slate-200/40',
      intentStyles[intent]
    )}
  >
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-inherit">{value}</p>
    </div>
    {subtitle && <p className="mt-4 text-xs text-slate-500">{subtitle}</p>}
  </div>
);
