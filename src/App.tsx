import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from './utils/dayjs';
import {
  ApiError,
  type AuthResponse,
  type DashboardSummaryResponse,
  type TenantProfileResponse,
  getDashboardSummary,
  getScans,
  getTenantProfile,
  getScanDetails,
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
        return dayjs(current.timestamp).isAfter(dayjs(latest.timestamp)) ? current : latest;
      }, existing.latestScan ?? undefined);

      repoMap.set(repoId, { id: repoId, repoName: repoId, scans: updatedScans, latestScan });
    }

    const groups = Array.from(repoMap.values());
    groups.sort((a, b) => {
      const aTime = a.latestScan ? dayjs(a.latestScan.timestamp) : dayjs(0);
      const bTime = b.latestScan ? dayjs(b.latestScan.timestamp) : dayjs(0);
      return bTime.diff(aTime);
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

      const hasFindings =
        latest.summary.codeVulnerabilities > 0 ||
        latest.summary.vulnerabilitiesInPackages > 0 ||
        latest.summary.secretsFound > 0 ||
        latest.summary.highSeverity > 0 ||
        latest.summary.criticalSeverity > 0;

      if (riskFilter === 'healthy') {
        return latest.qualityGatePassed === true && !hasFindings && latest.status === 'completed';
      }

      return latest.qualityGatePassed === false || hasFindings || latest.status !== 'completed';
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

  const formattedLastUpdated = dashboardSummary?.last_scan_at
    ? dayjs(dashboardSummary.last_scan_at).format('MMM D, YYYY h:mm A')
    : '—';

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

  const qualityGateStats = useMemo(() => {
    const gates = profile?.quality_gates;
    if (!gates) {
      return [];
    }

    return [
      { label: 'Quality gates', value: gates.enabled ? 'Enabled' : 'Disabled' },
      { label: 'Max critical', value: gates.max_critical },
      { label: 'Max high', value: gates.max_high },
      { label: 'Max medium', value: gates.max_medium },
      { label: 'Max low', value: gates.max_low },
      { label: 'Fail on secrets', value: gates.fail_on_secrets ? 'Yes' : 'No' },
      { label: 'Fail on critical code issues', value: gates.fail_on_critical_code_issues ? 'Yes' : 'No' },
    ];
  }, [profile?.quality_gates]);

  if (!token) {
    return <AuthWindow onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 lg:flex-row">
      <aside className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur lg:sticky lg:top-0 lg:h-svh lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-8 overflow-y-auto px-6 py-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Icon name="shield" width={22} height={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">Aegis</p>
                <p className="text-sm font-semibold text-slate-100">Security Posture</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
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
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    isActive
                      ? 'border-accent/60 bg-accent/10 text-slate-100 shadow-lg shadow-accent/10'
                      : 'border-slate-800/70 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                        isActive ? 'bg-accent/20 text-accent' : 'bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      <Icon name={item.icon} width={18} height={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs text-slate-400">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Signed in as</p>
              <p className="mt-1 break-all text-sm text-slate-100">{profile?.email ?? '—'}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/60 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-danger/60 hover:bg-danger/10 hover:text-danger"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden lg:h-svh">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 overflow-y-auto px-6 py-8">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">Security Posture Command Center</p>
              <h1 className="text-3xl font-semibold text-slate-100">Stay ahead of every scan</h1>
              <p className="max-w-xl text-sm text-slate-400">
                Search, filter, and drill into pipeline runs with confidence. Quality gate performance updates in real time from
                the Config API.
              </p>
            </div>
            <div className="flex w-full flex-col gap-4 lg:max-w-md lg:items-end">
              <div className="flex flex-wrap justify-end gap-2 text-xs text-slate-400">
                {headerBadges.map((badge) => (
                  <span
                    key={badge.key}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5"
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
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      width={18}
                      height={18}
                    />
                    <input
                      id="repo-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Filter by repository name"
                      className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/70 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-accent/60 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <Icon name="refresh" width={16} height={16} /> Refresh data
                </button>
              </div>
            </div>
          </header>

          {error && <p className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

          {activeTab === 'dashboard' ? (
            <div className="space-y-10">
              <section className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/40">
                <GlobalSummary summary={dashboardSummary} />
              </section>

              {isLoadingData && (
                <p className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 text-sm text-slate-400">
                  Refreshing data from Config API…
                </p>
              )}

              <div className="grid gap-8 xl:grid-cols-[320px_1fr]">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/30">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Repositories</p>
                        <p className="mt-1 text-sm text-slate-400">
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
                              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                                isActive
                                  ? 'border-accent/60 bg-accent/10 text-accent'
                                  : 'border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:text-slate-100'
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

                <div className="space-y-8">
                  {activeRepository ? (
                    <>
                      <RepositoryOverview repository={activeRepository} />

                      {activeRepository.scans.length > 0 ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Commit history</p>
                            <h2 className="text-xl font-semibold text-slate-100">Pipeline runs</h2>
                            <p className="mt-2 text-sm text-slate-400">
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
                        <p className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
                          When your first scan completes it will appear here with detailed findings.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
                      Connect a repository or adjust your filters to begin exploring scan history.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <section className="space-y-6 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/40">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tenant onboarding</p>
                  <h2 className="text-xl font-semibold text-slate-100">Connect your scanners</h2>
                  <p className="text-sm text-slate-400">
                    Use the generated API key and workflow snippet to route CI scan results through the Config API.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/30">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scanner API key</p>
                          <p className="mt-2 break-all font-mono text-sm text-slate-100">
                            {profile?.api_key ?? 'Not provisioned yet'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyApiKey}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-accent/60 hover:text-accent"
                        >
                          <Icon name="link" width={14} height={14} /> Copy
                        </button>
                      </div>
                      {copyMessage && (
                        <p className="mt-3 rounded-2xl bg-slate-900/60 px-3 py-2 text-xs text-slate-400">{copyMessage}</p>
                      )}
                    </div>

                    {qualityGateStats.length > 0 && (
                      <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/30">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quality gate defaults</p>
                          <p className="text-sm text-slate-400">
                            Current enforcement thresholds returned by the Config API.
                          </p>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {qualityGateStats.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                              <p className="mt-1 text-sm text-slate-100">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/30">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">GitHub Actions snippet</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Add this step to your workflow and store the API key as <code className="font-mono text-slate-200">AEGIS_API_KEY</code>.
                    </p>
                    <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 text-xs text-slate-300">
{actionsSnippet}
                    </pre>
                  </div>
                </div>

                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
                  <li>Copy the tenant API key and store it as an encrypted secret in your repository.</li>
                  <li>Paste the workflow snippet into your CI configuration, updating the path or image tags as needed.</li>
                  <li>Run your pipeline to push scan results to the Config API.</li>
                  <li>Return to the Dashboard tab to monitor quality gates, repositories, and findings in real time.</li>
                </ol>
              </section>

              {isLoadingData && (
                <p className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 text-sm text-slate-400">
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
