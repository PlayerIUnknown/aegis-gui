import type { ScanDetailsResponse, ScanListItem, ScanSummary } from '../api/types';

export interface ScanSummaryView {
  packagesFound: number;
  vulnerabilitiesInPackages: number;
  secretsFound: number;
  codeVulnerabilities: number;
  criticalSeverity: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
}

export interface RepositoryInfoView {
  repoName: string;
  branch?: string | null;
  commitHash?: string | null;
}

export interface ScanView {
  id: string;
  timestamp: string;
  status: string;
  qualityGatePassed: boolean | null;
  qualityGateReasons: string[];
  summary: ScanSummaryView;
  repository: RepositoryInfoView;
  scanType: string;
  targetPath: string | null;
}

export interface ScanDetailsView extends ScanView {
  tools: Record<string, { output: unknown[] }>;
}

export interface RepositoryGroup {
  id: string;
  repoName: string;
  scans: ScanView[];
  latestScan?: ScanView;
}

export const mapSummary = (summary: ScanSummary): ScanSummaryView => ({
  packagesFound: summary.packages_found,
  vulnerabilitiesInPackages: summary.vulnerabilities_in_packages,
  secretsFound: summary.secrets_found,
  codeVulnerabilities: summary.code_vulnerabilities,
  criticalSeverity: summary.critical_severity,
  highSeverity: summary.high_severity,
  mediumSeverity: summary.medium_severity,
  lowSeverity: summary.low_severity,
});

const normalizeQualityGateValue = (value: unknown): boolean | null => {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'passed' || normalized === 'pass' || normalized === 'success') {
      return true;
    }
    if (normalized === 'failed' || normalized === 'fail' || normalized === 'error') {
      return false;
    }
  }

  return null;
};

export const mapScan = (scan: ScanListItem): ScanView => ({
  id: scan.id,
  timestamp: scan.timestamp,
  status: scan.status,
  qualityGatePassed: normalizeQualityGateValue(scan.quality_gate_passed),
  qualityGateReasons: scan.quality_gate_reasons,
  summary: mapSummary(scan.summary),
  repository: {
    repoName: scan.repository.repo_name,
    branch: scan.repository.branch ?? undefined,
    commitHash: scan.repository.commit_hash ?? undefined,
  },
  scanType: scan.scan_type,
  targetPath: scan.target_path ?? null,
});

export const mapScanDetails = (details: ScanDetailsResponse): ScanDetailsView => ({
  id: details.id,
  timestamp: details.timestamp,
  status: details.status_text,
  qualityGatePassed: normalizeQualityGateValue(details.quality_gate_passed),
  qualityGateReasons: details.quality_gate_reasons,
  summary: mapSummary(details.summary),
  repository: {
    repoName: details.repository.repo_name,
    branch: details.repository.branch ?? undefined,
    commitHash: details.repository.commit_hash ?? undefined,
  },
  scanType: details.scan_type,
  targetPath: details.target_path ?? null,
  tools: details.tools,
});
