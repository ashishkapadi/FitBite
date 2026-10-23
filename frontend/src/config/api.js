/**
 * FitBite Production API & Real-Time Socket Configuration
 *
 * In local dev (Vite proxy): VITE_API_BASE_URL can be omitted or set to '/api'
 * In Vercel production: Set VITE_API_BASE_URL to your backend host (e.g. 'https://api.fitbite.app/api' or 'https://fitbite-api.onrender.com/api')
 */

const getApiBase = () => {
  // If running in a browser on localhost / 127.0.0.1, always use relative '/api' proxy
  if (typeof window !== 'undefined' && window.location.hostname && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))) {
    return '/api';
  }
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) {
    return import.meta.env.VITE_API_BASE_URL.trim();
  }
  // If hosted on Vercel / remote production and VITE_API_BASE_URL wasn't provided at build time,
  // point to the official FitBite Render backend
  if (typeof window !== 'undefined' && window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://fitbite-api-21cs.onrender.com/api';
  }
  return '/api';
};

const rawApiBase = getApiBase();
export const API_BASE_URL = rawApiBase.replace(/\/+$/, '');

export const SOCKET_URL = 
  import.meta.env.VITE_SOCKET_URL || 
  (API_BASE_URL.startsWith('http') 
    ? API_BASE_URL.replace(/\/api\/?$/, '') 
    : (typeof window !== 'undefined' ? window.location.origin : ''));

/**
 * Returns true if pointing to an external remote backend
 */
export function isRemoteBackendConfigured() {
  return API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://');
}

/**
 * Resolves any relative '/api/...' path to the full target backend URL
 */
export function resolveApiUrl(path) {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If pointing to relative '/api'
  if (API_BASE_URL === '/api' || API_BASE_URL === '') {
    return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  }

  // If API_BASE_URL already includes '/api' at the end
  if (API_BASE_URL.endsWith('/api')) {
    const subPath = cleanPath.startsWith('/api') ? cleanPath.substring(4) : cleanPath;
    return `${API_BASE_URL}${subPath.startsWith('/') ? subPath : `/${subPath}`}`;
  }

  // If API_BASE_URL is just host (e.g. 'https://backend.com')
  const apiPath = cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  return `${API_BASE_URL}${apiPath}`;
}

/**
 * Resolves meal and asset image URLs to absolute remote backend URLs when relative
 */
export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${backendOrigin}${cleanPath}`;
  }
  return cleanPath;
}

/**
 * Safely parses response as JSON, checking content-type and detecting non-JSON/HTML/empty bodies.
 * Throws clean, actionable user-facing errors rather than browser "Unexpected end of JSON input".
 */
export async function safeJson(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  // 1. Handle completely empty response body
  if (!text || !text.trim()) {
    if (!response.ok) {
      throw new Error(`Server returned error ${response.status} (${response.statusText || 'No Content'})`);
    }
    return {};
  }

  // 2. Detect HTML response (e.g., when an API route returned an SPA HTML fallback or 404/502 page)
  const isHtml = contentType.includes('text/html') || 
                 text.trim().startsWith('<!DOCTYPE') || 
                 text.trim().startsWith('<html') ||
                 text.trim().startsWith('<head');

  if (isHtml) {
    if (response.status === 404 || response.status === 200) {
      throw new Error(
        'Backend service unreachable: The server returned an HTML webpage instead of an API response. ' +
        'Please verify that the backend API is deployed and VITE_API_BASE_URL is configured.'
      );
    }
    throw new Error(`Server returned an unexpected HTML error (${response.status}). Please check backend status.`);
  }

  // 3. Attempt JSON parse
  try {
    return JSON.parse(text);
  } catch (err) {
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${text.substring(0, 140)}`);
    }
    throw new Error('Invalid response format: Failed to parse server response as JSON.');
  }
}

import { getFallbackApiResponse } from '../utils/demoCatalogFallback';

// In-memory circuit breaker flag: If remote backend fails once, fast-path subsequent calls
let isRemoteBackendDown = false;

/**
 * Allows resetting the backend circuit breaker if needed
 */
export function resetBackendCircuitBreaker() {
  isRemoteBackendDown = false;
}

/**
 * Unified fetch wrapper ensuring remote backend URL prefixing, authorization headers,
 * and resilient client-side fallback responses during network outages or backend cold starts.
 */
export async function apiFetch(path, options = {}) {
  const url = resolveApiUrl(path);

  // If backend is already known to be down, immediately serve hardcoded data if available
  if (isRemoteBackendDown && !options.skipFallback) {
    const fallbackData = getFallbackApiResponse(path, options);
    if (fallbackData !== null) {
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('fitbite_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Handle FormData where Content-Type shouldn't be application/json
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const timeoutMs = options.timeout || 3500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal || controller.signal;

  try {
    const response = await fetch(url, {
      ...options,
      signal,
      headers,
      credentials: options.credentials || 'include'
    });
    clearTimeout(timeoutId);

    // If server returned a 5xx gateway error (Render cold start / dead backend)
    // seamlessly provide fallback system data if available
    if (!response.ok && response.status >= 500) {
      isRemoteBackendDown = true;
      const fallbackData = getFallbackApiResponse(path, options);
      if (fallbackData !== null) {
        console.warn(`[apiFetch] Server error ${response.status} at ${url}. Serving offline hardcoded system data.`);
        return new Response(JSON.stringify(fallbackData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Backend is alive and responded normally
    if (response.ok) {
      isRemoteBackendDown = false;
    }

    return response;
  } catch (netErr) {
    clearTimeout(timeoutId);
    isRemoteBackendDown = true;

    // Network timeout, AbortError, or connection refused:
    // Check if we have hardcoded offline data for this route
    const fallbackData = getFallbackApiResponse(path, options);
    if (fallbackData !== null) {
      console.warn(`[apiFetch] Backend unreachable (${netErr.message}) for ${path}. Serving instant hardcoded system data.`);
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (netErr.name === 'AbortError') {
      throw new Error(`Connection timed out after ${timeoutMs / 1000}s while reaching ${url}. Please check your connection and retry.`);
    }
    console.error(`[API Network Error] fetch failed for ${url}:`, netErr);
    throw new Error(
      `Cannot connect to FitBite backend at ${url}. ` +
      'Please check your network connection and ensure the backend service is operational.'
    );
  }
}

