const DEFAULT_BASE_URL = 'https://config-api-mja3.onrender.com';

const BASE_URL = (import.meta.env.VITE_CONFIG_API_URL as string | undefined) ?? DEFAULT_BASE_URL;

type RequestOptions = RequestInit & { token?: string };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data === 'object' && data !== null && 'detail' in data) {
        message = String((data as { detail: unknown }).detail ?? message);
      }
    } catch (error) {
      // ignore json parsing errors, fall back to default message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}

export { BASE_URL };
