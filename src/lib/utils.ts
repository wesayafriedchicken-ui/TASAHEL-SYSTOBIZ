import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, delay = 800): Promise<Response> {
  const isApiRequest = url.startsWith('/api') || url.startsWith('api/');
  
  // Clone options and ensure headers have auth headers if available in browser
  const opts: RequestInit = { ...options };
  if (isApiRequest && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('user_id') || '1';
    const headers = new Headers(opts.headers || {});
    
    if (!headers.has('x-user-id') && storedUserId && storedUserId !== 'null' && storedUserId !== 'undefined') {
      headers.set('x-user-id', storedUserId);
    }
    if (!headers.has('Authorization') && token && token !== 'null' && token !== 'undefined') {
      headers.set('Authorization', `Bearer ${token}`);
    }
    opts.headers = headers;
  }

  try {
    const response = await fetch(url, opts);
    if (typeof window !== 'undefined' && response) {
      const refreshedToken = response.headers?.get('x-refreshed-token');
      if (refreshedToken && refreshedToken !== 'null' && refreshedToken !== 'undefined') {
        localStorage.setItem('token', refreshedToken);
      }
    }
    if (!response.ok && [502, 503, 504].includes(response.status) && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

export async function safeJsonResponse<T = any>(res: Response | null | undefined, fallbackValue: T | null = null): Promise<T | null> {
  if (!res || !res.ok) return fallbackValue;
  const contentType = res.headers?.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    return fallbackValue;
  }
  try {
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return fallbackValue;
    }
    return JSON.parse(text) as T;
  } catch (err) {
    return fallbackValue;
  }
}
