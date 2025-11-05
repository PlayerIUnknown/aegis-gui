import { apiRequest, ApiError } from './client';
import type {
  AuthResponse,
  DashboardSummaryResponse,
  ScanDetailsResponse,
  ScanListResponse,
  TenantProfileResponse,
  QualityGateUpdateRequest,
  QualityGateUpdateResponse,
} from './types';

export type {
  AuthResponse,
  DashboardSummaryResponse,
  ScanDetailsResponse,
  ScanListResponse,
  TenantProfileResponse,
  QualityGateUpdateRequest,
  QualityGateUpdateResponse,
};
export { ApiError };

export const login = async (email: string, password: string) =>
  apiRequest<AuthResponse>('/v1/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = async (name: string, email: string, password: string) =>
  apiRequest<AuthResponse>('/v1/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

export const getDashboardSummary = async (token: string) =>
  apiRequest<DashboardSummaryResponse>('/v1/dashboard/summary', { token });

export const getScans = async (token: string, limit = 200, offset = 0) =>
  apiRequest<ScanListResponse>(`/v1/scans?limit=${limit}&offset=${offset}`, { token });

export const getScanDetails = async (token: string, scanId: string) =>
  apiRequest<ScanDetailsResponse>(`/v1/scans/${scanId}`, { token });

export const getTenantProfile = async (token: string) =>
  apiRequest<TenantProfileResponse>('/v1/tenant/profile', { token });

export const updateQualityGates = async (token: string, payload: QualityGateUpdateRequest) =>
  apiRequest<QualityGateUpdateResponse>('/v1/tenant/quality-gates', {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
