import { useEffect, useId, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { ScanDetailsView, ScanView } from '../types/domain';
import { StatusPill } from './StatusPill';
import { ToolFindingsPanel, type ToolCategoryFilter } from './ToolFindingsPanel';
import { Icon } from './Icon';
import { formatTimestamp, timestampToValue } from '../utils/timestamps';

type RunTimelineProps = {
  runs: ScanView[];
  detailsById: Record<string, ScanDetailsView | undefined>;
  loadingScanIds?: Set<string>;
  onLoadDetails: (scanId: string) => void;
};

export const RunTimeline: React.FC<RunTimelineProps> = ({
  runs,
  detailsById,
  loadingScanIds,
  onLoadDetails,
}) => {
  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => timestampToValue(b.timestamp) - timestampToValue(a.timestamp)),
    [runs],
  );
  const [openRunId, setOpenRunId] = useState<string | undefined>(sortedRuns[0]?.id);
  const [activeToolFilter, setActiveToolFilter] = useState<ToolCategoryFilter | null>(null);

  useEffect(() => {
    if (sortedRuns.length === 0) {
      setOpenRunId(undefined);
      return;
    }

    setOpenRunId((current) => {
      if (current && sortedRuns.some((run) => run.id === current)) {
        return current;
      }
      return sortedRuns[0]?.id;
    });
  }, [sortedRuns]);

  useEffect(() => {
    if (!openRunId) {
      return;
    }

    const currentDetails = detailsById[openRunId];
    if (!currentDetails) {
      onLoadDetails(openRunId);
    }
  }, [openRunId, detailsById, onLoadDetails]);

  return (
    <div className="relative space-y-6 overflow-visible">
      <span
        aria-hidden
        className="pointer-events-none absolute left-6 top-12 bottom-12 hidden w-px bg-accent/30 md:block"
      />
      {sortedRuns.map((run) => {
        const isOpen = run.id === openRunId;
        const details = detailsById[run.id];
        const isLoading = loadingScanIds?.has(run.id);
        const handleToggle = () => {
          const nextOpen = isOpen ? undefined : run.id;
          setOpenRunId(nextOpen);
          setActiveToolFilter(null);
          if (!isOpen && !details) {
            onLoadDetails(run.id);
          }
        };

        const handleFilterToggle = (filter: ToolCategoryFilter) => {
          setActiveToolFilter((current) => (current === filter ? null : filter));
        };

        return (
          <div key={run.id} className="relative pl-0 md:pl-20">
            <span
              aria-hidden
              className={clsx(
                'pointer-events-none absolute left-5 top-11 hidden h-3 w-3 rounded-full border-2 border-white md:block',
                run.qualityGatePassed === true
                  ? 'bg-success border-success/50 shadow-[0_0_0_4px_rgba(34,197,94,0.15)]'
                  : run.qualityGatePassed === false
                  ? 'bg-danger/80 border-danger/60 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]'
                  : 'bg-warning/80 border-warning/60 shadow-[0_0_0_4px_rgba(250,204,21,0.12)]',
              )}
            />
            <div className="relative overflow-visible rounded-3xl border-2 border-accent/40 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_45px_90px_-50px_rgba(99,102,241,0.8)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Icon name="git-commit" width={20} height={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Scan executed {formatTimestamp(run.timestamp)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {run.repository.branch && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="git-branch" width={12} height={12} />
                          {run.repository.branch}
                        </span>
                      )}
                      {run.repository.commitHash && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="hash" width={12} height={12} />
                          #{run.repository.commitHash.slice(0, 8)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Icon name="activity" width={12} height={12} />
                        {run.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill qualityGatePassed={run.qualityGatePassed} />
                  <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 rounded-full border-2 border-accent/40 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    aria-expanded={isOpen}
                    type="button"
                  >
                    {isOpen ? 'Hide details' : 'Show details'}
                    {isOpen ? (
                      <Icon name="chevron-up" width={16} height={16} />
                    ) : (
                      <Icon name="chevron-down" width={16} height={16} />
                    )}
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <DetailStat
                      label="SBOM"
                      tooltip="Enumerates dependencies and components detected in the build."
                      value={run.summary.packagesFound}
                      tone="accent"
                      isActive={activeToolFilter === 'sbom'}
                      onClick={() => handleFilterToggle('sbom')}
                    />
                    <DetailStat
                      label="SCA"
                      tooltip="Identifies known vulnerabilities affecting third-party packages."
                      value={run.summary.vulnerabilitiesInPackages}
                      tone="warning"
                      isActive={activeToolFilter === 'sca'}
                      onClick={() => handleFilterToggle('sca')}
                    />
                    <DetailStat
                      label="Vuln Scan"
                      tooltip="Surfaces security issues uncovered in application source code."
                      value={run.summary.codeVulnerabilities}
                      tone="neutral"
                      isActive={activeToolFilter === 'vulnScan'}
                      onClick={() => handleFilterToggle('vulnScan')}
                    />
                    <DetailStat
                      label="Secrets"
                      tooltip="Flags hardcoded credentials, tokens, and other sensitive values."
                      value={run.summary.secretsFound}
                      tone="danger"
                      isActive={activeToolFilter === 'secrets'}
                      onClick={() => handleFilterToggle('secrets')}
                    />
                    <DetailStat label="Low" value={run.summary.lowSeverity} tone="success" />
                    <DetailStat label="Medium" value={run.summary.mediumSeverity} tone="warning" />
                    <DetailStat label="High" value={run.summary.highSeverity} tone="danger" />
                    <DetailStat label="Critical" value={run.summary.criticalSeverity} tone="danger" />
                  </div>
                  {isLoading && (
                    <p className="rounded-2xl border-2 border-accent/40 bg-slate-100 p-4 text-sm text-slate-600">
                      Loading tool results…
                    </p>
                  )}
                  {!isLoading && <ToolFindingsPanel tools={details?.tools} activeFilter={activeToolFilter} />}
                  {run.targetPath && (
                    <p className="text-xs text-slate-500">
                      Target path: <span className="font-mono text-slate-800">{run.targetPath}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

type DetailStatProps = {
  label: string;
  value: number | string;
  tone: 'neutral' | 'accent' | 'warning' | 'danger' | 'success';
  isActive?: boolean;
  onClick?: () => void;
  tooltip?: string;
};

const statBackgroundByTone: Record<DetailStatProps['tone'], string> = {
  neutral: 'bg-gradient-to-br from-white via-slate-50 to-white text-slate-900',
  accent: 'bg-gradient-to-br from-accent/10 via-accent/5 to-white text-slate-900',
  warning: 'bg-gradient-to-br from-warning/10 via-warning/5 to-white text-slate-900',
  danger: 'bg-gradient-to-br from-danger/10 via-danger/5 to-white text-slate-900',
  success: 'bg-gradient-to-br from-success/10 via-success/5 to-white text-slate-900',
};

const DetailStat: React.FC<DetailStatProps> = ({
  label,
  value,
  tone,
  isActive = false,
  onClick,
  tooltip,
}) => {
  const tooltipId = useId();

  const content = (
    <>
      <p className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="truncate">{label}</span>
          {tooltip && (
            <span
              aria-hidden
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 bg-white/80 text-accent shadow-sm"
            >
              <Icon name="info" width={14} height={14} />
            </span>
          )}
        </span>
      </p>
      <p className="break-words text-[clamp(1.125rem,1.6vw+0.5rem,1.75rem)] font-semibold leading-tight text-slate-900">
        {value}
      </p>
    </>
  );

  const isInteractive = typeof onClick === 'function';

  const handleActivate = () => {
    if (isInteractive && onClick) {
      onClick();
    }
  };

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-describedby={tooltip ? tooltipId : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
      onClick={isInteractive ? handleActivate : undefined}
      aria-pressed={isInteractive ? isActive : undefined}
      className={clsx(
        'group relative flex h-full min-w-0 flex-col justify-between gap-4 rounded-3xl border-2 border-accent/30 p-4 text-left shadow-[0_20px_45px_-35px_rgba(99,102,241,0.7)]',
        statBackgroundByTone[tone],
        isInteractive &&
          'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-30px_rgba(99,102,241,0.75)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2',
        isActive && 'border-accent/70 shadow-[0_30px_65px_-40px_rgba(99,102,241,0.85)] ring-2 ring-inset ring-accent/20',
      )}
    >
      {content}
      {tooltip && (
        <div
          role="tooltip"
          id={tooltipId}
          className={clsx(
            'pointer-events-none absolute left-1/2 top-full z-20 w-64 -translate-x-1/2 rounded-2xl border border-accent/40 bg-white px-5 py-4 text-left text-[12px] leading-relaxed text-slate-700 shadow-[0_35px_80px_-35px_rgba(15,23,42,0.55)] transition duration-150',
            'invisible translate-y-2 opacity-0 group-hover:visible group-hover:translate-y-3 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-y-3 group-focus-visible:opacity-100',
          )}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};

type InfoTooltipProps = {
  tooltip: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const InfoTooltip: React.FC<InfoTooltipProps> = ({ tooltip, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : internalOpen;
  const tooltipId = useId();

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  const hide = () => setOpen(false);
  const show = () => setOpen(true);
  const hideIfUncontrolled = () => {
    if (!isControlled) {
      hide();
    }
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={tooltip}
        aria-describedby={isOpen ? tooltipId : undefined}
        onPointerEnter={show}
        onPointerLeave={hideIfUncontrolled}
        onMouseEnter={show}
        onMouseLeave={hideIfUncontrolled}
        onTouchStart={(event) => {
          event.stopPropagation();
          show();
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          hideIfUncontrolled();
        }}
        onFocus={show}
        onBlur={() => {
          hideIfUncontrolled();
        }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onTouchCancel={(event) => {
          event.stopPropagation();
          hideIfUncontrolled();
        }}
        className={clsx(
          'inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 bg-white/80 text-accent shadow-sm transition hover:border-accent/50',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-1 focus:ring-offset-white',
        )}
      >
        <Icon name="info" width={14} height={14} />
      </button>
      <span
        role="tooltip"
        id={tooltipId}
        className={clsx(
          'pointer-events-auto absolute left-1/2 top-full z-20 w-64 -translate-x-1/2 rounded-2xl border border-accent/30 bg-slate-900/95 px-4 py-3 text-left text-[12px] leading-relaxed text-slate-100 shadow-[0_25px_60px_-25px_rgba(30,41,59,0.85)] backdrop-blur-sm transition duration-150',
          isOpen
            ? 'visible translate-y-3 opacity-100'
            : 'invisible translate-y-2 opacity-0',
        )}
        onPointerEnter={show}
        onPointerLeave={hideIfUncontrolled}
        onMouseEnter={show}
        onMouseLeave={hideIfUncontrolled}
      >
        {tooltip}
      </span>
    </span>
  );
};
