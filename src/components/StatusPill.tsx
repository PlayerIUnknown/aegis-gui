import clsx from 'clsx';

type StatusPillProps = {
  qualityGatePassed: boolean | null | undefined;
};

const statusConfig: Record<'passed' | 'failed' | 'pending', { label: string; className: string }> = {
  passed: {
    label: 'Quality gate · Passed',
    className:
      'bg-success/10 text-success border border-success/20 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
  },
  failed: {
    label: 'Quality gate · Failed',
    className:
      'bg-danger/10 text-danger border border-danger/20 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
  },
  pending: {
    label: 'Quality gate · Pending',
    className:
      'bg-warning/10 text-warning border border-warning/20 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({ qualityGatePassed }) => {
  const statusKey = qualityGatePassed === true ? 'passed' : qualityGatePassed === false ? 'failed' : 'pending';
  const config = statusConfig[statusKey];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
};
