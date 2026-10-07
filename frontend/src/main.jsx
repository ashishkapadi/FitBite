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
