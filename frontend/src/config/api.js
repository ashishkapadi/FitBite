/**
 * FitBite Production API & Real-Time Socket Configuration
 *
 * In local dev (Vite proxy): VITE_API_BASE_URL can be omitted or set to '/api'
 * In Vercel production: Set VITE_API_BASE_URL to your backend host (e.g. 'https://api.fitbite.app/api' or 'https://fitbite-api.onrender.com/api')
 */

const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
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

/**
 * Unified fetch wrapper ensuring remote backend URL prefixing & authorization headers
 */
export async function apiFetch(path, options = {}) {
  const url = resolveApiUrl(path);
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

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials || 'include'
    });
    return response;
  } catch (netErr) {
    console.error(`[API Network Error] fetch failed for ${url}:`, netErr);
    throw new Error(
      `Cannot connect to FitBite backend at ${url}. ` +
      'Please check your network connection and ensure the backend service is operational.'
    );
  }
}
