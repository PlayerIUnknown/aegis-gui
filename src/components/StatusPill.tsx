import clsx from 'clsx';
import { QualityGateStatus } from '../data/sampleData';

type StatusPillProps = {
  status: QualityGateStatus;
};

const statusConfig: Record<QualityGateStatus, { label: string; className: string }> = {
  passed: {
    label: 'Passed',
    className: 'bg-success/10 text-success border-success/30'
  },
  failed: {
    label: 'Failed',
    className: 'bg-danger/10 text-danger border-danger/30'
  }
};

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
      statusConfig[status].className
    )}
  >
    {statusConfig[status].label}
  </span>
);
