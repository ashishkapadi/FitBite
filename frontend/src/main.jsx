import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import App from './App';
import './index.css';
import { resolveApiUrl } from './config/api';

// Intercept global fetch so any relative '/api/...' calls automatically resolve
// to the external production backend URL (e.g. on Vercel deployment)
const originalFetch = window.fetch;
window.fetch = function (input, init = {}) {
  let url = input;
  const isApiCall = typeof input === 'string' && (input.startsWith('/api') || input.includes('/api/'));
  if (typeof input === 'string' && input.startsWith('/api')) {
    url = resolveApiUrl(input);
  }

  const headers = new Headers(init.headers || {});
  const token = typeof window !== 'undefined' ? localStorage.getItem('fitbite_token') : null;
  if (token && !headers.has('Authorization') && isApiCall) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure credentials: 'include' for cross-origin cookies in production
  const mergedInit = {
    ...init,
    headers,
    credentials: init.credentials || 'include'
  };

  return originalFetch.call(this, url, mergedInit);
};

// Safeguard Response.prototype.json globally so empty or HTML responses
// throw descriptive user-facing errors rather than browser SyntaxError "Unexpected end of JSON input"
const originalJson = Response.prototype.json;
Response.prototype.json = async function () {
  const clone = typeof this.clone === 'function' ? this.clone() : null;
  try {
    return await originalJson.call(this);
  } catch (err) {
    let preview = '';
    if (clone) {
      try {
        preview = await clone.text();
      } catch (e) {}
    }
    if (!preview || !preview.trim()) {
      if (!this.ok) {
        throw new Error(`Server returned HTTP ${this.status} (${this.statusText || 'No Content'})`);
      }
      return {};
    }
    if (preview.includes('<!DOCTYPE') || preview.includes('<html') || preview.includes('<head')) {
      throw new Error(
        `Backend service unreachable: Server returned an HTML webpage (${this.status}) instead of JSON. ` +
        'Please verify that the backend API is deployed and accessible.'
      );
    }
    throw new Error(`Invalid JSON from server (${this.status}): ${preview.substring(0, 120)}`);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
