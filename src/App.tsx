import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  type AuthResponse,
  type DashboardSummaryResponse,
  type TenantProfileResponse,
  getDashboardSummary,
  getScans,
  getTenantProfile,
  getScanDetails,
  updateQualityGates,
} from './api';
import { BASE_URL } from './api/client';
import { RepositoryList } from './components/RepositoryList';
import { GlobalSummary } from './components/GlobalSummary';
import { RunTimeline } from './components/RunTimeline';
import { AuthWindow } from './components/AuthWindow';
import { Icon } from './components/Icon';
import { RepositoryOverview } from './components/RepositoryOverview';
import {
  mapScan,
  mapScanDetails,
  type RepositoryGroup,
  type ScanDetailsView,
  type ScanView,
} from './types/domain';
import { formatTimestamp, timestampToValue } from './utils/timestamps';
import type { QualityGateConfig } from './api/types';
import { QualityGateForm } from './components/QualityGateForm';

import './styles/index.css';

const TOKEN_STORAGE_KEY = 'jwtToken';
const TENANT_STORAGE_KEY = 'tenantId';

type RiskFilter = 'all' | 'healthy' | 'attention';

const riskFilters: Array<{ value: RiskFilter; label: string; description: string }> = [
  {
    value: 'all',
    label: 'All workspaces',
    description: 'View every repository connected to Aegis.',
  },
  {
    value: 'healthy',
    label: 'Passing gates',
    description: 'Latest pipeline cleared every quality gate with no critical findings.',
  },
  {
    value: 'attention',
    label: 'Needs attention',
    description: 'Recent run failed, is running, or reported actionable findings.',
  },
];

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [tenantId, setTenantId] = useState<string | null>(() => localStorage.getItem(TENANT_STORAGE_KEY));
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);
  const [profile, setProfile] = useState<TenantProfileResponse | null>(null);
  const [scans, setScans] = useState<ScanView[]>([]);
  const [scanDetails, setScanDetails] = useState<Record<string, ScanDetailsView>>({});
  const [loadingScanIds, setLoadingScanIds] = useState<Set<string>>(new Set());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup'>('dashboard');
  const [activeRepositoryId, setActiveRepositoryId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [snippetCopyMessage, setSnippetCopyMessage] = useState<string | null>(null);
  const [isSavingQualityGates, setIsSavingQualityGates] = useState(false);
  const [qualityGateMessage, setQualityGateMessage] = useState<
    { type: 'success' | 'error'; text: string } | null
  >(null);
  const actionsSnippet = useMemo(() => {
    const apiKey = profile?.api_key ?? '${{ secrets.AEGIS_API_KEY }}';
    return String.raw`- name: Run Aegis Security Scan
  run: |
    docker run --rm \
      -v \${{ github.workspace }}:/app/target \
      -e GITHUB_REPOSITORY=\${{ github.repository }} \
      -e GITHUB_REF=\${{ github.ref }} \
      -e GITHUB_SHA=\${{ github.sha }} \
      playerunknown23/aegis:latest \
      /app/target \
      --api-key ${apiKey} \
      --config-api-url ${BASE_URL} \
      --parallel`;
  }, [profile?.api_key]);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TENANT_STORAGE_KEY);
    setToken(null);
    setTenantId(null);
    setDashboardSummary(null);
    setProfile(null);
    setScans([]);
    setScanDetails({});
    setLoadingScanIds(new Set());
    setActiveRepositoryId(null);
    setError(null);
  }, []);

  const handleAuthenticated = useCallback((auth: AuthResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, auth.access_token);
    localStorage.setItem(TENANT_STORAGE_KEY, auth.tenant_id);
    setToken(auth.access_token);
    setTenantId(auth.tenant_id);
  }, []);

  const processApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        setError('Session expired. Please sign in again.');
        signOut();
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
        return;
      }
      setError('An unexpected error occurred.');
    },
    [signOut],
  );

  const fetchInitialData = useCallback(
    async (authToken: string) => {
      setIsLoadingData(true);
      setError(null);
      try {
        const [summaryResponse, scansResponse, profileResponse] = await Promise.all([
          getDashboardSummary(authToken),
          getScans(authToken, 200, 0),
          getTenantProfile(authToken),
        ]);
        setDashboardSummary(summaryResponse);
        setScans(scansResponse.items.map(mapScan));
        setProfile(profileResponse);
      } catch (err) {
        processApiError(err);
      } finally {
        setIsLoadingData(false);
      }
    },
    [processApiError],
  );

  const handleRefresh = useCallback(() => {
    if (token) {
      fetchInitialData(token);
    }
  }, [token, fetchInitialData]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const repositories = useMemo<RepositoryGroup[]>(() => {
    const repoMap = new Map<string, RepositoryGroup>();

    for (const scan of scans) {
      const repoId = scan.repository.repoName || 'unknown-repo';
      const existing = repoMap.get(repoId) ?? { id: repoId, repoName: repoId, scans: [], latestScan: undefined };
      const updatedScans = [...existing.scans, scan];
      const latestScan = updatedScans.reduce<ScanView | undefined>((latest, current) => {
        if (!latest) return current;
        return timestampToValue(current.timestamp) > timestampToValue(latest.timestamp) ? current : latest;
      }, existing.latestScan ?? undefined);

      repoMap.set(repoId, { id: repoId, repoName: repoId, scans: updatedScans, latestScan });
    }

    const groups = Array.from(repoMap.values());
    groups.sort((a, b) => {
      const aTime = a.latestScan ? timestampToValue(a.latestScan.timestamp) : Number.NEGATIVE_INFINITY;
      const bTime = b.latestScan ? timestampToValue(b.latestScan.timestamp) : Number.NEGATIVE_INFINITY;
      return bTime - aTime;
    });
    return groups;
  }, [scans]);

  const filteredRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return repositories.filter((repo) => {
      const matchesSearch = !query || repo.repoName.toLowerCase().includes(query);
      if (!matchesSearch) {
        return false;
      }

      if (riskFilter === 'all') {
        return true;
      }

      const latest = repo.latestScan;
      if (!latest) {
        return false;
      }

      if (riskFilter === 'healthy') {
        return latest.qualityGatePassed === true && latest.status === 'completed';
      }

      return latest.status !== 'completed' || latest.qualityGatePassed !== true;
    });
  }, [repositories, search, riskFilter]);

  useEffect(() => {
    if (filteredRepositories.length === 0) {
      setActiveRepositoryId(null);
      return;
    }

    if (!activeRepositoryId) {
      setActiveRepositoryId(filteredRepositories[0].id);
      return;
    }

    const exists = filteredRepositories.some((repo) => repo.id === activeRepositoryId);
    if (!exists) {
      setActiveRepositoryId(filteredRepositories[0].id);
    }
  }, [filteredRepositories, activeRepositoryId]);

  const activeRepository = useMemo(() => {
    if (filteredRepositories.length === 0) {
      return undefined;
    }

    if (!activeRepositoryId) {
      return filteredRepositories[0];
    }

    return filteredRepositories.find((repo) => repo.id === activeRepositoryId) ?? filteredRepositories[0];
  }, [filteredRepositories, activeRepositoryId]);

  const handleLoadScanDetails = useCallback(
    async (scanId: string) => {
      if (!token || scanDetails[scanId]) {
        return;
      }

      setLoadingScanIds((prev) => {
        if (prev.has(scanId)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(scanId);
        return next;
      });

      try {
        const details = await getScanDetails(token, scanId);
        setScanDetails((prev) => ({ ...prev, [scanId]: mapScanDetails(details) }));
      } catch (err) {
        processApiError(err);
      } finally {
        setLoadingScanIds((prev) => {
          if (!prev.has(scanId)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(scanId);
          return next;
        });
      }
    },
    [token, scanDetails, processApiError],
  );

  const handleCopyApiKey = useCallback(async () => {
    if (!profile?.api_key) {
      setCopyMessage('No API key available.');
      return;
    }

    try {
      await navigator.clipboard.writeText(profile.api_key);
      setCopyMessage('API key copied to clipboard.');
    } catch (copyError) {
      setCopyMessage('Unable to copy API key.');
    } finally {
      setTimeout(() => setCopyMessage(null), 2500);
    }
  }, [profile]);

  const handleCopyActionsSnippet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(actionsSnippet);
      setSnippetCopyMessage('Workflow snippet copied to clipboard.');
    } catch (copyError) {
      setSnippetCopyMessage('Unable to copy workflow snippet.');
    } finally {
      setTimeout(() => setSnippetCopyMessage(null), 2500);
    }
  }, [actionsSnippet]);

  const handleSaveQualityGates = useCallback(
    async (config: QualityGateConfig) => {
      if (!token) {
        setQualityGateMessage({ type: 'error', text: 'You must be signed in to update quality gates.' });
        return;
      }

      setIsSavingQualityGates(true);
      setQualityGateMessage(null);
      try {
        const response = await updateQualityGates(token, config);
        setProfile((prev) => (prev ? { ...prev, quality_gates: response.quality_gates } : prev));
        setQualityGateMessage({
          type: 'success',
          text: response.message || 'Quality gate defaults updated.',
        });
      } catch (err) {
        processApiError(err);
        const message =
          err instanceof Error ? err.message : 'Unable to update quality gate settings. Please try again.';
        setQualityGateMessage({ type: 'error', text: message });
      } finally {
        setIsSavingQualityGates(false);
      }
    },
    [token, processApiError],
  );

  const latestScanTimestamp = useMemo(() => {
    let candidate: string | number | null | undefined = dashboardSummary?.last_scan_at ?? null;
    let candidateValue = timestampToValue(candidate);

    for (const scan of scans) {
      const value = timestampToValue(scan.timestamp);
      if (value > candidateValue) {
        candidate = scan.timestamp;
        candidateValue = value;
      }
    }

    return candidate ?? null;
  }, [dashboardSummary?.last_scan_at, scans]);

  const formattedLastUpdated = formatTimestamp(latestScanTimestamp);

  const totalRepositories = repositories.length;

  const headerBadges = useMemo(() => {
    const badges: Array<{ key: string; icon: 'globe' | 'users' | 'clock' | 'user'; label: string }> = [
      {
        key: 'tenant',
        icon: 'globe',
        label: tenantId ? `Tenant ${tenantId}` : 'Tenant unknown',
      },
      {
        key: 'repos',
        icon: 'users',
        label: `${totalRepositories} connected ${totalRepositories === 1 ? 'workspace' : 'workspaces'}`,
      },
      {
        key: 'updated',
        icon: 'clock',
        label: formattedLastUpdated === '—' ? 'Awaiting first scan' : `Last updated • ${formattedLastUpdated}`,
      },
    ];

    if (profile?.name) {
      badges.push({ key: 'owner', icon: 'user', label: profile.name });
    }

    return badges;
  }, [tenantId, totalRepositories, formattedLastUpdated, profile?.name]);

  const qualityGateConfig = profile?.quality_gates ?? null;

  if (!token) {
    return <AuthWindow onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div
      className="flex min-h-svh flex-col bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200 text-slate-900 transition-colors duration-300 lg:flex-row"
    >
      <aside className="border-b border-accent/30 bg-white/80 backdrop-blur lg:fixed lg:inset-y-0 lg:w-72 lg:border-b-0 lg:border-r lg:border-accent/30">
        <div className="flex h-full flex-col gap-8 overflow-y-auto px-6 py-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Aegis</p>
              <p className="text-lg font-semibold text-slate-900">Security Posture</p>
            </div>
            <p className="text-xs text-slate-500">
              Monitor scan activity, track quality gate performance, and configure CI ingestion for your tenant.
            </p>
          </div>
          <nav className="space-y-2">
            {[
              { key: 'dashboard', label: 'Dashboard', description: 'Review scans and repositories.', icon: 'activity' as const },
              { key: 'setup', label: 'Setup', description: 'Configure API keys and CI steps.', icon: 'key' as const },
            ].map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key as 'dashboard' | 'setup')}
                  className={`w-full rounded-lg border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    isActive
                      ? 'border-accent/50 bg-accent/10 text-slate-900 shadow-[0_16px_36px_-24px_rgba(99,102,241,0.28)]'
                      : 'border-slate-200/70 bg-white/70 text-slate-600 hover:border-accent/30 hover:bg-white'
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isActive
                          ? 'bg-accent/20 text-accent'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon name={item.icon} width={18} height={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto space-y-4">
            <div className="rounded-lg border border-slate-200/70 bg-white/90 p-4 text-xs text-slate-500 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.25)]">
              <p className="font-semibold uppercase tracking-wide text-slate-600">Signed in as</p>
              <p className="mt-1 break-all text-sm text-slate-900">{profile?.email ?? '—'}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="w-full rounded-lg border border-slate-200/70 bg-white py-3 text-sm font-semibold uppercase tracking-wide text-slate-700 transition hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-10 px-6 py-8">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">Security Posture Command Center</p>
              <h1 className="text-3xl font-semibold text-white">Stay ahead of every scan</h1>
              <p className="max-w-xl text-sm text-white">
                Search, filter, and drill into pipeline runs with confidence. Quality gate performance updates in real time from
                the Config API.
              </p>
            </div>
            <div className="flex w-full flex-col gap-4 lg:max-w-md lg:items-end">
              <div className="flex flex-wrap justify-end gap-2 text-xs text-slate-500">
                {headerBadges.map((badge) => (
                  <span
                    key={badge.key}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-3 py-1.5 text-slate-600 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.32)]"
                  >
                    <Icon name={badge.icon} width={14} height={14} />
                    {badge.label}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {activeTab === 'dashboard' && (
                  <div className="relative w-full sm:max-w-xs">
                    <Icon
                      name="search"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      width={18}
                      height={18}
                    />
                    <input
                      id="repo-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Filter by repository name"
                      className="w-full rounded-lg border border-slate-200/70 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <Icon name="refresh" width={16} height={16} /> Refresh
                </button>
              </div>
            </div>
          </header>

          {error && <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

          {activeTab === 'dashboard' ? (
            <div className="space-y-10">
              <section className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.85)]">
                <GlobalSummary summary={dashboardSummary} />
              </section>

              {isLoadingData && (
                <p className="rounded-2xl border border-slate-200/70 bg-white p-6 text-sm text-slate-600 shadow-[0_25px_60px_-55px_rgba(15,23,42,0.7)]">
                  Refreshing data from Config API…
                </p>
              )}

              <section className="space-y-6 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.85)]">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Scans</p>
                  <h2 className="text-xl font-semibold text-white">Explore repository history</h2>
                  <p className="text-sm text-slate-300">
                    Select a workspace to review recent pipeline executions and quality gate outcomes.
                  </p>
                </div>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.45)]">
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repositories</p>
                          <p className="mt-1 text-sm text-slate-600">
                            Showing {filteredRepositories.length} of {totalRepositories}{' '}
                            {totalRepositories === 1 ? 'workspace' : 'workspaces'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {riskFilters.map((filter) => {
                            const isActive = filter.value === riskFilter;
                            return (
                              <button
                                key={filter.value}
                                type="button"
                                onClick={() => setRiskFilter(filter.value)}
                                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                                  isActive
                                    ? 'border-accent/60 bg-accent/10 text-accent'
                                    : 'border-accent/25 bg-white text-slate-600 hover:border-accent/50 hover:text-slate-900'
                                }`}
                                aria-pressed={isActive}
                              >
                                {filter.label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-500">{riskFilters.find((f) => f.value === riskFilter)?.description}</p>
                      </div>
                    </div>

                    <RepositoryList
                      repositories={filteredRepositories}
                      activeRepositoryId={activeRepository?.id ?? null}
                      onSelect={setActiveRepositoryId}
                    />
                  </div>

                  <div className="space-y-6">
                    {activeRepository ? (
                      <>
                        <RepositoryOverview repository={activeRepository} />

                        {activeRepository.scans.length > 0 ? (
                          <div className="space-y-4 rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.5)]">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline runs</p>
                              <h3 className="text-lg font-semibold text-slate-900">Commit activity &amp; findings</h3>
                              <p className="text-sm text-slate-600">
                                Expand a run to inspect tool findings and quality gate outcomes for each commit.
                              </p>
                            </div>
                            <RunTimeline
                              runs={activeRepository.scans}
                              detailsById={scanDetails}
                              loadingScanIds={loadingScanIds}
                              onLoadDetails={handleLoadScanDetails}
                            />
                          </div>
                        ) : (
                          <p className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 text-sm text-slate-600 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.45)]">
                            When your first scan completes it will appear here with detailed findings.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 text-sm text-slate-600 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.45)]">
                        Connect a repository or adjust your filters to begin exploring scan history.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-10">
              <section className="space-y-6 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.85)]">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Tenant onboarding</p>
                  <h2 className="text-xl font-semibold text-white">Connect your scanners</h2>
                  <p className="text-sm text-slate-300">
                    Use the generated API key and workflow snippet to route CI scan results through the Config API.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                  <div className="space-y-6">
                    <div className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.5)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scanner API key</p>
                          <div className="rounded-lg border border-indigo-600/50 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 px-4 py-3 text-white shadow-[0_18px_45px_-35px_rgba(30,41,59,0.85)]">
                            <p className="break-all font-mono text-sm text-white">
                              {profile?.api_key ?? 'Not provisioned yet'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyApiKey}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 transition hover:border-accent/50 hover:text-accent"
                        >
                          <Icon name="link" width={14} height={14} /> Copy
                        </button>
                      </div>
                      {copyMessage && (
                        <p className="mt-3 rounded-lg border border-accent/30 bg-indigo-900 px-3 py-2 text-xs text-indigo-100 shadow-[0_12px_24px_-18px_rgba(30,41,59,0.6)]">{copyMessage}</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.5)]">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quality gate defaults</p>
                        <p className="text-sm text-slate-600">
                          Adjust enforcement thresholds returned by the Config API.
                        </p>
                      </div>
                      <div className="mt-4">
                        <QualityGateForm
                          config={qualityGateConfig}
                          onSubmit={handleSaveQualityGates}
                          saving={isSavingQualityGates}
                          message={qualityGateMessage}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.5)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2 text-slate-600">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GitHub Actions snippet</p>
                        <p className="text-sm">
                          Add this step to your workflow and store the API key as <code className="font-mono text-indigo-900">AEGIS_API_KEY</code>.
                        </p>
                        <p className="text-xs">
                          Copy the workflow as-is and paste it into your CI configuration. Update the image tag or target path whenever needed.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyActionsSnippet}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 transition hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Icon name="link" width={14} height={14} /> Copy snippet
                      </button>
                    </div>
                    <pre className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-indigo-600/60 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 p-4 text-xs text-white shadow-[0_25px_55px_-35px_rgba(30,41,59,0.75)]">
{actionsSnippet}
                    </pre>
                    {snippetCopyMessage && (
                      <p className="mt-3 rounded-lg border border-accent/30 bg-indigo-900 px-3 py-2 text-xs text-indigo-100 shadow-[0_12px_24px_-18px_rgba(30,41,59,0.6)]">
                        {snippetCopyMessage}
                      </p>
                    )}
                  </div>
                </div>

                <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-600 marker:text-slate-400">
                  <li className="rounded-lg border border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-4 py-3 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
                    Copy the tenant API key and store it as an encrypted secret in your repository.
                  </li>
                  <li className="rounded-lg border border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-4 py-3 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
                    Paste the workflow snippet into your CI configuration, updating the path or image tags as needed.
                  </li>
                  <li className="rounded-lg border border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-4 py-3 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
                    Run your pipeline to push scan results to the Config API.
                  </li>
                  <li className="rounded-lg border border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-4 py-3 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.45)]">
                    Return to the Dashboard tab to monitor quality gates, repositories, and findings in real time.
                  </li>
                </ol>
              </section>

              {isLoadingData && (
                <p className="rounded-2xl border border-slate-200/70 bg-white p-6 text-sm text-slate-600 shadow-[0_25px_60px_-55px_rgba(15,23,42,0.7)]">
                  Fetching tenant profile details…
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
