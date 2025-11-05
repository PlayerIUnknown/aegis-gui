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
import { StatusPill } from './components/StatusPill';
import { SummaryCard } from './components/SummaryCard';
import { RunTimeline } from './components/RunTimeline';
import { AuthWindow } from './components/AuthWindow';
import { Icon } from './components/Icon';
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

  useEffect(() => {
    if (token) {
      fetchInitialData(token);
    }
  }, [token, fetchInitialData]);

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

  const latestRun = activeRepository?.latestScan;

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

  if (!token) {
    return <AuthWindow onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon name="shield" width={24} height={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">Aegis</p>
                  <h1 className="mt-1 text-3xl font-semibold text-slate-100">Security Posture Command Center</h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm text-slate-400">
                Monitor security automation in real time. Search, filter, and drill into pipeline runs to unblock releases with
                confidence.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                  <Icon name="globe" width={14} height={14} />
                  Tenant {tenantId ?? 'unknown'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                  <Icon name="clock" width={14} height={14} />
                  Last updated {dashboardSummary?.last_scan_at ? dayjs(dashboardSummary.last_scan_at).fromNow() : '—'}
                </span>
                {profile?.name && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                    <Icon name="user" width={14} height={14} />
                    {profile.name}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full max-w-sm">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="repo-search">
                Search repositories
              </label>
              <div className="relative mt-2">
                <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" width={18} height={18} />
                <input
                  id="repo-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter by repository name"
                  className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/70 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {riskFilters.map((filter) => {
                const isActive = filter.value === riskFilter;
                return (
                  <button
                    key={filter.value}
                    onClick={() => setRiskFilter(filter.value)}
                    className={`group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                      isActive
                        ? 'border-accent/70 bg-accent/10 text-slate-100'
                        : 'border-slate-800/70 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                    aria-pressed={isActive}
                    type="button"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide">{filter.label}</p>
                    <p className="mt-1 text-xs text-slate-400 transition group-hover:text-slate-300">{filter.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-xs text-slate-400">
                {profile?.email ?? '—'}
              </div>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-6 max-w-7xl px-6">
          <p className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
        </div>
      )}

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Repositories</p>
            <p className="mt-2 text-sm text-slate-400">
              {filteredRepositories.length} connected {filteredRepositories.length === 1 ? 'repository' : 'repositories'}
            </p>
          </div>
          <RepositoryList
            repositories={filteredRepositories}
            activeRepositoryId={activeRepository?.id ?? null}
            onSelect={setActiveRepositoryId}
          />
          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5 text-sm text-slate-300 shadow-xl shadow-slate-950/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scanner API key</p>
                <p className="mt-1 font-mono text-slate-100">
                  {profile?.api_key ? profile.api_key : 'Not generated'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyApiKey}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-accent/60 hover:text-accent"
              >
                <Icon name="link" width={14} height={14} /> Copy
              </button>
            </div>
            {copyMessage && <p className="mt-3 rounded-2xl bg-slate-900/60 px-3 py-2 text-xs text-slate-400">{copyMessage}</p>}
          </div>
        </aside>

        <section className="space-y-8">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Executive overview</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-100">Global security posture</h2>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/40">
              <GlobalSummary summary={dashboardSummary} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">GitHub Actions snippet</p>
              <p className="text-sm text-slate-400">
                Add this step to your pipeline to send scan results to Aegis. Replace the API key with the value from your tenant
                settings above.
              </p>
              <pre className="overflow-auto rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 text-xs text-slate-300">
{actionsSnippet}
              </pre>
            </div>
          </div>

          {isLoadingData && (
            <p className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-6 text-sm text-slate-400">
              Loading latest data from Config API…
            </p>
          )}

          {activeRepository && latestRun && (
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8 shadow-xl shadow-slate-950/40">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-lg font-bold text-accent">
                      {activeRepository.repoName.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{activeRepository.repoName}</p>
                      <p className="text-xs text-slate-400">
                        {activeRepository.scans.length} total {activeRepository.scans.length === 1 ? 'scan' : 'scans'} tracked
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    {latestRun.repository.branch && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">
                        <Icon name="git-branch" width={14} height={14} /> Default: {latestRun.repository.branch}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">
                      <Icon name="clock" width={14} height={14} /> Last run {dayjs(latestRun.timestamp).fromNow()}
                    </span>
                    {latestRun.repository.commitHash && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">
                        <Icon name="hash" width={14} height={14} /> #{latestRun.repository.commitHash.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
                <StatusPill qualityGatePassed={latestRun.qualityGatePassed} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Code Vulnerabilities"
                  value={latestRun.summary.codeVulnerabilities}
                  intent={latestRun.summary.codeVulnerabilities > 0 ? 'danger' : 'neutral'}
                  subtitle="Static analysis findings across the latest scan."
                />
                <SummaryCard
                  title="Supply Chain Findings"
                  value={latestRun.summary.vulnerabilitiesInPackages}
                  intent={latestRun.summary.vulnerabilitiesInPackages > 0 ? 'warning' : 'neutral'}
                  subtitle="Dependencies breaching the quality gate."
                />
                <SummaryCard
                  title="Secrets Detected"
                  value={latestRun.summary.secretsFound}
                  intent={latestRun.summary.secretsFound > 0 ? 'danger' : 'neutral'}
                  subtitle="Hard-coded secrets flagged by the pipeline."
                />
                <SummaryCard
                  title="Packages Cataloged"
                  value={latestRun.summary.packagesFound}
                  intent="neutral"
                  subtitle="Inventory derived from SBOM scans."
                />
              </div>
            </div>
          )}

          {activeRepository && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Activity</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-100">Pipeline history</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Track every push and pull request through your security gates. Expand a run to inspect tool-level output and
                  findings.
                </p>
              </div>
              <RunTimeline
                runs={activeRepository.scans}
                detailsById={scanDetails}
                loadingScanIds={loadingScanIds}
                onLoadDetails={handleLoadScanDetails}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
