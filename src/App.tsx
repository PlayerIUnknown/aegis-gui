import { useMemo, useState } from 'react';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('aegis-authenticated') === 'true';
    }
    return false;
  });
  const [search, setSearch] = useState('');
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
    if (!query) return repositories;
    return repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.owner.toLowerCase().includes(query) ||
        repo.description.toLowerCase().includes(query)
    );
  }, [search]);

  const activeRepository = useMemo(() => {
    const repo = filteredRepositories.find((r) => r.id === activeRepositoryId);
    return repo ?? filteredRepositories[0];
  }, [filteredRepositories, activeRepositoryId]);

  const latestRun = activeRepository ? getLatestRun(activeRepository) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-slate-950 to-slate-900">
      <header className="border-b border-slate-800/60 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-accent">Aegis</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-100">Security Posture Command Center</h1>
            <p className="mt-1 text-sm text-slate-400">
              Live observability across every repository, commit, and quality gate managed by your CI/CD scanners.
            </p>
          </div>
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

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Repositories</p>
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
          <GlobalSummary />

          {activeRepository && latestRun && (
            <div className="rounded-3xl border border-slate-800/60 bg-gradient-to-r from-slate-950/70 via-slate-900/60 to-slate-950/50 p-8 shadow-xl shadow-slate-950/40">
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
                    <span className="inline-flex items-center gap-2">
                      <Icon name="git-branch" width={14} height={14} />
                      Default branch · {activeRepository.defaultBranch}
                    </span>
                    <a
                      href={activeRepository.url}
                      className="inline-flex items-center gap-2 text-accent transition hover:text-accent/80"
                    >
                      <Icon name="link" width={14} height={14} />
                      Repository Link
                    </a>
                    <span>
                      Last run {dayjs(latestRun.timestamp).fromNow()}
                    </span>
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
              <h2 className="text-lg font-semibold text-slate-100">Pipeline History</h2>
              <p className="text-sm text-slate-400">
                Track every push and pull request through your security gates. Expand a run to inspect tool-level output and findings.
              </p>
              <RunTimeline runs={activeRepository.runs} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
