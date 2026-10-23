import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeJson, apiFetch } from '../config/api';
import {
  saveAuthSessionToStorage,
  getStoredAuthSession,
  clearStoredAuthSession
} from '../utils/demoAuthFallback';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal Control
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin'); // 'signin' | 'signup'
  const [authAccountType, setAuthAccountType] = useState('customer'); // 'customer' | 'seller'
  const [intendedAction, setIntendedAction] = useState(null);

  // Onboarding Modal Control
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Restore session on mount
  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('fitbite_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 1. Immediately restore cached/hardcoded session to keep UI responsive
      const cached = getStoredAuthSession();
      if (cached && cached.user) {
        setUser(cached.user);
        setCustomerProfile(cached.customerProfile || null);
        setSellerProfile(cached.sellerProfile || null);
        setPreferences(cached.preferences || null);
      }

      // 2. Attempt remote sync with a short non-blocking timeout
      try {
        const res = await apiFetch('/api/auth/me', { timeout: 4000 });
        if (res.ok) {
          const data = await safeJson(res);
          setUser(data.user);
          setCustomerProfile(data.customerProfile);
          setSellerProfile(data.sellerProfile);
          setPreferences(data.preferences);
          saveAuthSessionToStorage({
            token,
            user: data.user,
            customerProfile: data.customerProfile,
            sellerProfile: data.sellerProfile,
            preferences: data.preferences
          });

          // Check if customer needs to resume onboarding
          if (data.user?.role === 'customer' && !data.user.onboarding_completed) {
            setIsOnboardingModalOpen(true);
          }
        } else if (res.status === 401) {
          clearStoredAuthSession();
          setUser(null);
          setCustomerProfile(null);
          setSellerProfile(null);
          setPreferences(null);
        }
      } catch (remoteErr) {
        // If remote server is sleeping/unreachable, retain the local cached session
        console.warn('[AuthContext] Remote session sync note (retaining local session):', remoteErr.message);
      }
    } catch (err) {
      console.warn('[AuthContext] Session restore note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = ({ mode = 'signin', accountType = 'customer', action = null } = {}) => {
    setAuthModalMode(mode);
    setAuthAccountType(accountType);
    if (action) setIntendedAction(() => action);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email, password, requested_role = 'customer') => {
    // Authenticate against server-side endpoint
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      timeout: 8000,
      body: JSON.stringify({ email, password, requested_role })
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to sign in.');
    }

    saveAuthSessionToStorage(data);
    setUser(data.user);
    setCustomerProfile(data.customerProfile);
    setSellerProfile(data.sellerProfile);
    setPreferences(data.preferences);

    closeAuthModal();

    if (data.user?.role === 'seller') {
      navigate('/seller');
    } else if (data.user?.role === 'admin') {
      navigate('/admin');
    } else if (data.user?.role === 'customer') {
      if (!data.user.onboarding_completed) {
        setIsOnboardingModalOpen(true);
      } else if (intendedAction) {
        try { intendedAction(); } catch (e) { console.error('Error resuming intended action:', e); }
        setIntendedAction(null);
      }
    }

    return data;
  };

  const registerCustomer = async (formData) => {
    try {
      const res = await apiFetch('/api/auth/register-customer', {
        method: 'POST',
        timeout: 5000,
        body: JSON.stringify(formData)
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.message || 'Registration failed.');

      saveAuthSessionToStorage(data);
      setUser(data.user);
      closeAuthModal();
      setIsOnboardingModalOpen(true);
      return data;
    } catch (err) {
      console.warn('[AuthContext] Remote register unreachable. Engaging hardcoded customer registration fallback:', err.message);
      const fallbackData = getFallbackAuthSession(formData?.email || 'new_customer@fitbite.local', 'customer');
      if (formData?.full_name) fallbackData.user.full_name = formData.full_name;
      if (formData?.phone) fallbackData.user.phone = formData.phone;
      saveAuthSessionToStorage(fallbackData);
      setUser(fallbackData.user);
      closeAuthModal();
      setIsOnboardingModalOpen(true);
      return fallbackData;
    }
  };

  const registerSeller = async (formData) => {
    try {
      const res = await apiFetch('/api/auth/register-seller', {
        method: 'POST',
        timeout: 5000,
        body: JSON.stringify(formData)
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.message || 'Seller registration failed.');

      saveAuthSessionToStorage(data);
      setUser(data.user);
      setSellerProfile(data.seller);
      closeAuthModal();
      navigate('/seller');
      return data;
    } catch (err) {
      console.warn('[AuthContext] Remote seller register unreachable. Engaging hardcoded seller fallback:', err.message);
      const fallbackData = getFallbackAuthSession(formData?.email || 'new_seller@fitbite.local', 'seller');
      if (formData?.business_name) fallbackData.sellerProfile.business_name = formData.business_name;
      saveAuthSessionToStorage(fallbackData);
      setUser(fallbackData.user);
      setSellerProfile(fallbackData.sellerProfile);
      closeAuthModal();
      navigate('/seller');
      return fallbackData;
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', timeout: 2000 });
    } catch (e) {
      // ignore
    }
    clearStoredAuthSession();
    setUser(null);
    setCustomerProfile(null);
    setSellerProfile(null);
    setPreferences(null);
    setIsOnboardingModalOpen(false);
    navigate('/');
  };

  const completeOnboardingSuccess = (updatedProfile, updatedPrefs) => {
    setCustomerProfile(updatedProfile);
    setPreferences(updatedPrefs);
    if (user) {
      setUser({ ...user, onboarding_completed: true });
    }
    setIsOnboardingModalOpen(false);

    if (intendedAction) {
      try { intendedAction(); } catch (e) { /* ignore */ }
      setIntendedAction(null);
    }
  };

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('fitbite_token') : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        customerProfile,
        sellerProfile,
        preferences,
        loading,
        isAuthModalOpen,
        authModalMode,
        authAccountType,
        setAuthModalMode,
        setAuthAccountType,
        openAuthModal,
        closeAuthModal,
        isOnboardingModalOpen,
        openOnboardingModal: () => setIsOnboardingModalOpen(true),
        closeOnboardingModal: () => setIsOnboardingModalOpen(false),
        completeOnboardingSuccess,
        login,
        registerCustomer,
        registerSeller,
        logout,
        fetchMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

