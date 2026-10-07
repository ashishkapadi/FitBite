import React, { createContext, useContext, useState, useEffect } from 'react';

import { safeJson, apiFetch } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

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

      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await safeJson(res);
        setUser(data.user);
        setCustomerProfile(data.customerProfile);
        setSellerProfile(data.sellerProfile);
        setPreferences(data.preferences);

        // Check if customer needs to resume onboarding
        if (data.user?.role === 'customer' && !data.user.onboarding_completed) {
          setIsOnboardingModalOpen(true);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Session restore note:', err.message);
      setUser(null);
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
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, requested_role })
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to sign in.');

    localStorage.setItem('fitbite_token', data.token);
    setUser(data.user);
    setCustomerProfile(data.customerProfile);
    setSellerProfile(data.sellerProfile);

    closeAuthModal();

    // Check if customer needs to complete onboarding
    if (data.user.role === 'customer' && !data.user.onboarding_completed) {
      setIsOnboardingModalOpen(true);
    } else if (intendedAction) {
      // Resume intended action
      try {
        intendedAction();
      } catch (e) {
        console.error('Error resuming intended action:', e);
      }
      setIntendedAction(null);
    }

    return data;
  };

  const registerCustomer = async (formData) => {
    const res = await apiFetch('/api/auth/register-customer', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || data.message || 'Registration failed.');

    localStorage.setItem('fitbite_token', data.token);
    setUser(data.user);
    closeAuthModal();

    // Launch multi-step onboarding wizard for newly registered customer
    setIsOnboardingModalOpen(true);

    return data;
  };

  const registerSeller = async (formData) => {
    const res = await apiFetch('/api/auth/register-seller', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || data.message || 'Seller registration failed.');

    localStorage.setItem('fitbite_token', data.token);
    setUser(data.user);
    setSellerProfile(data.seller);
    closeAuthModal();

    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('fitbite_token');
    setUser(null);
    setCustomerProfile(null);
    setSellerProfile(null);
    setPreferences(null);
    setIsOnboardingModalOpen(false);
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

  return (
    <AuthContext.Provider
      value={{
        user,
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
