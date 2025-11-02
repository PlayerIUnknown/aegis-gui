import { useEffect, useMemo, useState } from 'react';
import dayjs from './utils/dayjs';
import { Icon } from './components/Icon';
import { repositories, Repository, getLatestRun } from './data/sampleData';
import { RepositoryList } from './components/RepositoryList';
import { GlobalSummary } from './components/GlobalSummary';
import { StatusPill } from './components/StatusPill';
import { SummaryCard } from './components/SummaryCard';
import { RunTimeline } from './components/RunTimeline';
import { AuthWindow } from './components/AuthWindow';

import './styles/index.css';

const getDefaultRepo = (): Repository => repositories[0];

type RiskFilter = 'all' | 'healthy' | 'attention';

const riskFilters: Array<{ value: RiskFilter; label: string; description: string }> = [
  {
    value: 'all',
    label: 'All workspaces',
    description: 'View every repository connected to Aegis.'
  },
  {
    value: 'healthy',
    label: 'Passing gates',
    description: 'Latest pipeline cleared every quality gate with no critical findings.'
  },
  {
    value: 'attention',
    label: 'Needs attention',
    description: 'Recent run failed or reported actionable findings.'
  }
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('aegis-authenticated') === 'true';
    }
    return false;
  });
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [activeRepositoryId, setActiveRepositoryId] = useState(getDefaultRepo().id);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('aegis-authenticated', 'true');
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('aegis-authenticated');
    }
  };

  if (!isAuthenticated) {
    return <AuthWindow onAuthenticated={handleAuthenticated} />;
  }

  const filteredRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesSearch = (repo: Repository) => {
      if (!query) return true;
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.owner.toLowerCase().includes(query) ||
        repo.description.toLowerCase().includes(query)
      );
    };

    const matchesRisk = (repo: Repository) => {
      if (riskFilter === 'all') return true;
      const latest = getLatestRun(repo);
      if (!latest) return false;

      const hasFindings =
        latest.summary.codeVulnerabilities > 0 ||
        latest.summary.vulnerabilitiesInPackages > 0 ||
        latest.summary.secretsFound > 0 ||
        latest.summary.highSeverity > 0 ||
        latest.summary.criticalSeverity > 0;

      if (riskFilter === 'healthy') {
        return latest.qualityGateStatus === 'passed' && !hasFindings;
      }

      return latest.qualityGateStatus === 'failed' || hasFindings;
    };

    return repositories.filter((repo) => matchesSearch(repo) && matchesRisk(repo));
  }, [search, riskFilter]);

  const activeRepository = useMemo(() => {
    const repo = filteredRepositories.find((r) => r.id === activeRepositoryId);
    return repo ?? filteredRepositories[0];
  }, [filteredRepositories, activeRepositoryId]);

  useEffect(() => {
    if (
      filteredRepositories.length > 0 &&
      !filteredRepositories.some((repo) => repo.id === activeRepositoryId)
    ) {
      setActiveRepositoryId(filteredRepositories[0].id);
    }
  }, [filteredRepositories, activeRepositoryId]);

  const latestRun = activeRepository ? getLatestRun(activeRepository) : undefined;

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
                  <h1 className="mt-1 text-3xl font-semibold text-slate-100">
                    Security Posture Command Center
                  </h1>
                </div>
              </div>
              <p className="max-w-2xl text-sm text-slate-400">
                Monitor security automation in real time. Search, filter, and drill into pipeline runs to unblock
                releases with confidence.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                  <Icon name="globe" width={14} height={14} />
                  Global coverage
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                  <Icon name="clock" width={14} height={14} />
                  Updated {dayjs().subtract(12, 'minute').fromNow()}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                  <Icon name="users" width={14} height={14} />
                  36 contributors monitored
                </span>
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
                  placeholder="Filter by name, owner, or description"
                  className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/70 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
          </div>

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
                  <p className="mt-1 text-xs text-slate-400 transition group-hover:text-slate-300">
                    {filter.description}
                  </p>
                </button>
              );
            })}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-2.5 text-slate-500" width={18} height={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search repositories"
                className="w-72 rounded-full border border-slate-800/60 bg-slate-900/80 py-2 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-accent hover:text-accent"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

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
            activeRepositoryId={activeRepository?.id ?? ''}
            onSelect={setActiveRepositoryId}
          />
        </aside>

        <section className="space-y-8">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Executive overview</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-100">Global security posture</h2>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/40">
              <GlobalSummary />
            </div>
          </div>

          {activeRepository && latestRun && (
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-8 shadow-xl shadow-slate-950/40">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-slate-900"
                      style={{ backgroundColor: activeRepository.avatarColor }}
                    >
                      {activeRepository.owner[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        {activeRepository.owner}/{activeRepository.name}
                      </p>
                      <p className="text-xs text-slate-400">{activeRepository.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">
                      <Icon name="git-branch" width={14} height={14} />
                      Default: {activeRepository.defaultBranch}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1">
                      <Icon name="clock" width={14} height={14} />
                      Last run {dayjs(latestRun.timestamp).fromNow()}
                    </span>
                    <a
                      href={activeRepository.url}
                      className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-accent transition hover:border-accent/60 hover:bg-accent/10"
                    >
                      <Icon name="link" width={14} height={14} />
                      Repository link
                    </a>
                  </div>
                </div>
                <StatusPill status={latestRun.qualityGateStatus} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Code Vulnerabilities"
                  value={latestRun.summary.codeVulnerabilities}
                  intent={latestRun.summary.codeVulnerabilities > 0 ? 'danger' : 'neutral'}
                  subtitle="Static analysis findings across the latest commit."
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
                  Track every push and pull request through your security gates. Expand a run to inspect tool-level output
                  and findings.
                </p>
              </div>
              <RunTimeline runs={activeRepository.runs} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
