import clsx from 'clsx';

type StatusPillProps = {
  qualityGatePassed: boolean | null | undefined;
};

const statusConfig: Record<'passed' | 'failed' | 'pending', { label: string; className: string }> = {
  passed: {
    label: 'Gate passed',
    className:
      'bg-success/10 text-success border-success/30',
  },
  failed: {
    label: 'Gate failed',
    className:
      'bg-danger/10 text-danger border-danger/30',
  },
  pending: {
    label: 'Gate pending',
    className:
      'bg-warning/10 text-warning border-warning/30',
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({ qualityGatePassed }) => {
  const statusKey = qualityGatePassed === true ? 'passed' : qualityGatePassed === false ? 'failed' : 'pending';
  const config = statusConfig[statusKey];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
};
