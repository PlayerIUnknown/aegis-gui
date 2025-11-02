import dayjs from '../utils/dayjs';

export type ToolName = 'SCA' | 'SBOM' | 'Secret Scanning' | 'Vulnerability Scan';

export type ToolFinding = {
  name: string;
  purl?: string;
  type?: string;
  version?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
};

export type ToolRun = {
  name: ToolName;
  findings: ToolFinding[];
};

export type QualityGateStatus = 'passed' | 'failed';

export type RunSummary = {
  lowSeverity: number;
  mediumSeverity: number;
  highSeverity: number;
  criticalSeverity: number;
  secretsFound: number;
  packagesFound: number;
  codeVulnerabilities: number;
  vulnerabilitiesInPackages: number;
};

export type PipelineRun = {
  id: string;
  timestamp: string;
  commitHash: string;
  commitAuthor: string;
  commitMessage: string;
  branch: string;
  qualityGateStatus: QualityGateStatus;
  summary: RunSummary;
  tools: ToolRun[];
};

export type Repository = {
  id: string;
  name: string;
  owner: string;
  url: string;
  description: string;
  avatarColor: string;
  defaultBranch: string;
  runs: PipelineRun[];
};

const generateRunId = (repo: string, index: number) => `${repo}-${index}`;

export const repositories: Repository[] = [
  {
    id: 'aegis-gateway',
    name: 'aegis-gateway',
    owner: 'aegis-labs',
    url: 'https://github.com/aegis-labs/aegis-gateway',
    description: 'Ingress service that orchestrates policy enforcement for every connected environment.',
    avatarColor: '#6366f1',
    defaultBranch: 'main',
    runs: [
      {
        id: generateRunId('aegis-gateway', 0),
        timestamp: dayjs().subtract(2, 'hour').toISOString(),
        commitHash: '4f8c9d2',
        commitAuthor: 'Grace Kim',
        commitMessage: 'feat: enforce SBOM validation before release candidate build',
        branch: 'main',
        qualityGateStatus: 'failed',
        summary: {
          lowSeverity: 0,
          mediumSeverity: 2,
          highSeverity: 1,
          criticalSeverity: 0,
          secretsFound: 0,
          packagesFound: 7,
          codeVulnerabilities: 3,
          vulnerabilitiesInPackages: 1
        },
        tools: [
          {
            name: 'SBOM',
            findings: [
              {
                name: 'actions/checkout',
                purl: 'pkg:github/actions/checkout@v4',
                type: 'github-action',
                version: 'v4'
              },
              {
                name: 'actions/setup-node',
                purl: 'pkg:github/actions/setup-node@v3',
                type: 'github-action',
                version: 'v3'
              }
            ]
          },
          {
            name: 'Vulnerability Scan',
            findings: [
              {
                name: 'OpenSSL CVE-2023-2650',
                severity: 'high',
                description: 'OpenSSL in the base container is vulnerable to a timing side-channel when verifying RSA signatures.'
              }
            ]
          },
          {
            name: 'SCA',
            findings: []
          },
          {
            name: 'Secret Scanning',
            findings: []
          }
        ]
      },
      {
        id: generateRunId('aegis-gateway', 1),
        timestamp: dayjs().subtract(1, 'day').toISOString(),
        commitHash: '8be4131',
        commitAuthor: 'Noah Singh',
        commitMessage: 'chore: dependency refresh and audit baseline',
        branch: 'main',
        qualityGateStatus: 'passed',
        summary: {
          lowSeverity: 1,
          mediumSeverity: 0,
          highSeverity: 0,
          criticalSeverity: 0,
          secretsFound: 0,
          packagesFound: 6,
          codeVulnerabilities: 0,
          vulnerabilitiesInPackages: 0
        },
        tools: [
          {
            name: 'SBOM',
            findings: [
              {
                name: 'actions/checkout',
                purl: 'pkg:github/actions/checkout@v4',
                type: 'github-action',
                version: 'v4'
              }
            ]
          },
          {
            name: 'SCA',
            findings: [
              {
                name: 'axios',
                version: '1.5.0',
                severity: 'low',
                description: 'Prototype pollution mitigated by patching to >=1.5.1.'
              }
            ]
          },
          {
            name: 'Secret Scanning',
            findings: []
          },
          {
            name: 'Vulnerability Scan',
            findings: []
          }
        ]
      }
    ]
  },
  {
    id: 'helm-charts',
    name: 'helm-charts',
    owner: 'aegis-labs',
    url: 'https://github.com/aegis-labs/helm-charts',
    description: 'Helm repositories that codify default guardrails and cluster add-ons.',
    avatarColor: '#f97316',
    defaultBranch: 'main',
    runs: [
      {
        id: generateRunId('helm-charts', 0),
        timestamp: dayjs().subtract(6, 'hour').toISOString(),
        commitHash: '1a2f994',
        commitAuthor: 'Evelyn Baker',
        commitMessage: 'fix: tighten admission controller deny rules',
        branch: 'hardening',
        qualityGateStatus: 'passed',
        summary: {
          lowSeverity: 0,
          mediumSeverity: 0,
          highSeverity: 0,
          criticalSeverity: 0,
          secretsFound: 0,
          packagesFound: 4,
          codeVulnerabilities: 0,
          vulnerabilitiesInPackages: 0
        },
        tools: [
          {
            name: 'SBOM',
            findings: [
              {
                name: 'actions/checkout',
                purl: 'pkg:github/actions/checkout@v4',
                type: 'github-action',
                version: 'v4'
              },
              {
                name: 'docker/setup-buildx-action',
                purl: 'pkg:github/docker/setup-buildx-action@v3',
                type: 'github-action',
                version: 'v3'
              }
            ]
          },
          {
            name: 'SCA',
            findings: []
          },
          {
            name: 'Secret Scanning',
            findings: []
          },
          {
            name: 'Vulnerability Scan',
            findings: []
          }
        ]
      },
      {
        id: generateRunId('helm-charts', 1),
        timestamp: dayjs().subtract(3, 'day').toISOString(),
        commitHash: 'beef102',
        commitAuthor: 'Evelyn Baker',
        commitMessage: 'feat: introduce terraform baseline for staging',
        branch: 'main',
        qualityGateStatus: 'failed',
        summary: {
          lowSeverity: 5,
          mediumSeverity: 1,
          highSeverity: 0,
          criticalSeverity: 0,
          secretsFound: 1,
          packagesFound: 9,
          codeVulnerabilities: 5,
          vulnerabilitiesInPackages: 0
        },
        tools: [
          {
            name: 'Secret Scanning',
            findings: [
              {
                name: 'AWS Access Key',
                severity: 'high',
                description: 'Potential AWS key found inside terraform/providers.tf'
              }
            ]
          },
          {
            name: 'SCA',
            findings: [
              {
                name: 'terraform-provider-aws',
                version: '4.72.0',
                severity: 'medium',
                description: 'Pinned provider version includes medium severity known issue CVE-2023-351.'
              }
            ]
          },
          {
            name: 'SBOM',
            findings: []
          },
          {
            name: 'Vulnerability Scan',
            findings: []
          }
        ]
      }
    ]
  },
  {
    id: 'policy-service',
    name: 'policy-service',
    owner: 'aegis-labs',
    url: 'https://github.com/aegis-labs/policy-service',
    description: 'OPA policy engine with context aware rules for CI/CD security posture checks.',
    avatarColor: '#22d3ee',
    defaultBranch: 'develop',
    runs: [
      {
        id: generateRunId('policy-service', 0),
        timestamp: dayjs().subtract(20, 'minute').toISOString(),
        commitHash: '9c0de11',
        commitAuthor: 'Ibrahim Malik',
        commitMessage: 'feat: align severity matrix with SOC2 exceptions',
        branch: 'develop',
        qualityGateStatus: 'passed',
        summary: {
          lowSeverity: 0,
          mediumSeverity: 1,
          highSeverity: 0,
          criticalSeverity: 0,
          secretsFound: 0,
          packagesFound: 12,
          codeVulnerabilities: 1,
          vulnerabilitiesInPackages: 0
        },
        tools: [
          {
            name: 'SCA',
            findings: [
              {
                name: 'go-github',
                version: '55.0.0',
                severity: 'medium',
                description: 'Rate limiting bug flagged for review in <https://github.com/google/go-github/issues/2700>.'
              }
            ]
          },
          {
            name: 'SBOM',
            findings: [
              {
                name: 'actions/upload-artifact',
                purl: 'pkg:github/actions/upload-artifact@v4',
                type: 'github-action',
                version: 'v4'
              }
            ]
          },
          {
            name: 'Secret Scanning',
            findings: []
          },
          {
            name: 'Vulnerability Scan',
            findings: []
          }
        ]
      }
    ]
  }
];

export const globalSummary = repositories.reduce(
  (acc, repo) => {
    repo.runs.forEach((run) => {
      acc.totalRuns += 1;
      if (run.qualityGateStatus === 'passed') {
        acc.passed += 1;
      } else {
        acc.failed += 1;
      }
    });
    return acc;
  },
  { totalRuns: 0, passed: 0, failed: 0 }
);

export const getLatestRun = (repo: Repository) =>
  [...repo.runs].sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)))[0];
