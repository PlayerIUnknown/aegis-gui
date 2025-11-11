import clsx from 'clsx';
import { ReactNode } from 'react';

type SummaryCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  intent?: 'neutral' | 'success' | 'warning' | 'danger';
};

const intentStyles: Record<NonNullable<SummaryCardProps['intent']>, string> = {
  neutral: 'bg-gradient-to-br from-white via-slate-50 to-white text-slate-900',
  success:
    'bg-gradient-to-br from-success/10 via-success/5 to-white text-success',
  warning:
    'bg-gradient-to-br from-warning/10 via-warning/5 to-white text-warning',
  danger:
    'bg-gradient-to-br from-danger/10 via-danger/5 to-white text-danger'
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  intent = 'neutral'
}) => (
  <div
    className={clsx(
      'flex h-full flex-col justify-between rounded-lg border-2 border-accent/40 p-4 shadow-[0_20px_45px_-30px_rgba(99,102,241,0.6)]',
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
