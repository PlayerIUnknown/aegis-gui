export interface AuthResponse {
  access_token: string;
  token_type: string;
  tenant_id: string;
  expires_in: number;
}

export interface DashboardSummaryResponse {
  status: string;
  totals: {
    scans: number;
  };
  by_status: {
    running: number;
    completed: number;
    failed: number;
  };
  quality_gate: {
    passed: number;
    failed: number;
  };
  repos: {
    total_repos: number;
    total_commits: number;
  };
  last_scan_at: string | null;
}

export type ScanStatus = 'running' | 'completed' | 'failed';

export interface ScanSummary {
  packages_found: number;
  vulnerabilities_in_packages: number;
  secrets_found: number;
  code_vulnerabilities: number;
  critical_severity: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
}

export interface ScanRepositoryInfo {
  repo_name: string;
  branch?: string | null;
  commit_hash?: string | null;
}

export interface ScanListItem {
  id: string;
  timestamp: string;
  created_at?: string;
  scan_type: string;
  target_path: string | null;
  status: ScanStatus;
  quality_gate_passed: boolean | null;
  quality_gate_reasons: string[];
  repository: ScanRepositoryInfo;
  summary: ScanSummary;
}

export interface ScanListResponse {
  status: string;
  items: ScanListItem[];
  count: number;
}

export interface ScanDetailsResponse extends Omit<ScanListItem, 'status' | 'quality_gate_passed'> {
  status_text: ScanStatus;
  quality_gate_passed: boolean | null;
  tools: Record<string, { output: unknown[] }>;
}

export interface TenantProfileResponse {
  status: string;
  tenant_id: string;
  name: string;
  email: string;
  api_key: string | null;
  subscription_tier: string | null;
  quality_gates: QualityGateConfig | null;
}

export interface QualityGateConfig {
  enabled: boolean;
  max_critical: number;
  max_high: number;
  max_medium: number;
  max_low: number;
  fail_on_secrets: boolean;
  fail_on_critical_code_issues: boolean;
}

export interface QualityGateUpdateRequest extends Partial<QualityGateConfig> {}

export interface QualityGateUpdateResponse {
  status: string;
  message: string;
  quality_gates: QualityGateConfig;
}
