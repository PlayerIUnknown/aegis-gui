import clsx from 'clsx';

type StatusPillProps = {
  qualityGatePassed: boolean | null | undefined;
};

const statusConfig: Record<'passed' | 'failed' | 'pending', { label: string; className: string }> = {
  passed: {
    label: 'Quality gate · Passed',
    className:
      'bg-success/10 text-success border-2 border-accent/40 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]',
  },
  failed: {
    label: 'Quality gate · Failed',
    className:
      'bg-danger/10 text-danger border-2 border-accent/40 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]',
  },
  pending: {
    label: 'Quality gate · Pending',
    className:
      'bg-warning/10 text-warning border-2 border-accent/40 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({ qualityGatePassed }) => {
  const statusKey = qualityGatePassed === true ? 'passed' : qualityGatePassed === false ? 'failed' : 'pending';
  const config = statusConfig[statusKey];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
};
