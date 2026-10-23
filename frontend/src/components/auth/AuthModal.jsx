import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, User, Store, Shield, CheckCircle2, Lock, Mail, Phone, Building } from 'lucide-react';

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    authAccountType,
    setAuthModalMode,
    setAuthAccountType,
    closeAuthModal,
    login,
    registerCustomer,
    registerSeller
  } = useAuth();

  // Customer signup fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Seller signup specific fields
  const [businessName, setBusinessName] = useState('');
  const [kitchenType, setKitchenType] = useState('commercial_tiffin');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [operatingAddress, setOperatingAddress] = useState('');
  const [area, setArea] = useState('Indiranagar');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keyboard accessibility: Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authModalMode === 'signin') {
        await login(email, password, authAccountType);
      } else {
        if (authAccountType === 'customer') {
          await registerCustomer({
            email,
            password,
            full_name: fullName,
            phone
          });
        } else {
          await registerSeller({
            email,
            password,
            full_name: fullName,
            phone,
            business_name: businessName,
            kitchen_type: kitchenType,
            operating_address: operatingAddress,
            area,
            fssai_number: fssaiNumber
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const isSellerDemo = authAccountType === 'seller';
    const demoCredentials = isSellerDemo
      ? { email: 'seller.tiffin@fitbite.demo', password: 'FitBite@2026', role: 'seller' }
      : { email: 'customer@fitbite.demo', password: 'FitBite@2026', role: 'customer' };

    try {
      await login(demoCredentials.email, demoCredentials.password, demoCredentials.role);
    } catch (err) {
      setError(err.message || 'Demo login is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 id="auth-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
              Welcome to <span style={{ color: '#10B981' }}>FitBite</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Your meals, your way.</p>
          </div>
          <button
            onClick={closeAuthModal}
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* 1. Account Type Selector at the Top */}
          <div style={{

            display: 'flex',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => { setAuthAccountType('customer'); setError(''); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                backgroundColor: authAccountType === 'customer' ? '#FFFFFF' : 'transparent',
                color: authAccountType === 'customer' ? '#0F172A' : '#64748B',
                boxShadow: authAccountType === 'customer' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms ease'
              }}
            >
              <User size={18} color={authAccountType === 'customer' ? '#10B981' : '#64748B'} />
              Customer
            </button>

            <button
              type="button"
              onClick={() => { setAuthAccountType('seller'); setError(''); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.9rem',
                backgroundColor: authAccountType === 'seller' ? '#FFFFFF' : 'transparent',
                color: authAccountType === 'seller' ? '#0F172A' : '#64748B',
                boxShadow: authAccountType === 'seller' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms ease'
              }}
            >
              <Store size={18} color={authAccountType === 'seller' ? '#F97316' : '#64748B'} />
              Partner / Kitchen
            </button>
          </div>

          {/* 2. Authentication Tabs: Sign In vs Sign Up */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #E2E8F0',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => { setAuthModalMode('signin'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: authModalMode === 'signin' ? '#10B981' : '#64748B',
                borderBottom: authModalMode === 'signin' ? '2px solid #10B981' : 'none',
                marginBottom: '-2px'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthModalMode('signup'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: authModalMode === 'signup' ? '#10B981' : '#64748B',
                borderBottom: authModalMode === 'signup' ? '2px solid #10B981' : 'none',
                marginBottom: '-2px'
              }}
            >
              {authAccountType === 'seller' ? 'Register Kitchen' : 'Create Account'}
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '16px',
              border: '1px solid #FECACA'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {authModalMode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            {authModalMode === 'signup' && authAccountType === 'seller' && (
              <>
                <div className="form-group">
                  <label className="form-label">Kitchen / Business Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Annapurna Tiffin Ghar"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kitchen Type</label>
                  <select
                    className="form-select"
                    value={kitchenType}
                    onChange={(e) => setKitchenType(e.target.value)}
                  >
                    <option value="commercial_tiffin">Commercial Tiffin Service / Mess</option>
                    <option value="home_chef_cloud">Home Chef / Cloud Kitchen</option>
                    <option value="restaurant">Restaurant</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">14-Digit FSSAI License Number</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    className="form-input"
                    placeholder="e.g. 11223344556677"
                    value={fssaiNumber}
                    onChange={(e) => setFssaiNumber(e.target.value)}
                  />
                  <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Registration review required before menu public listing.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Operating Kitchen Address &amp; Area</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. HAL 2nd Stage, Indiranagar"
                    value={operatingAddress}
                    onChange={(e) => setOperatingAddress(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authModalMode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn ${authAccountType === 'seller' ? 'btn-accent' : 'btn-primary'}`}
              style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            >
              {loading ? 'Processing...' : (
                authModalMode === 'signin' ? 'Sign In & Continue' : (
                  authAccountType === 'seller' ? 'Submit Kitchen Application' : 'Create Account & Continue'
                )
              )}
            </button>

            {authModalMode === 'signin' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0 12px', color: '#94A3B8', fontSize: '0.75rem' }}>
                  <span style={{ height: '1px', flex: 1, background: '#E2E8F0' }} />
                  or explore the app
                  <span style={{ height: '1px', flex: 1, background: '#E2E8F0' }} />
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '11px', borderColor: authAccountType === 'seller' ? '#F97316' : '#10B981', color: authAccountType === 'seller' ? '#C2410C' : '#047857', fontWeight: 700 }}
                >
                  {loading ? 'Signing in…' : `Use ${authAccountType === 'seller' ? 'Partner' : 'Customer'} Demo Account`}
                </button>
                <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: '0.75rem', textAlign: 'center' }}>
                  {authAccountType === 'seller'
                    ? 'Quick kitchen-partner login — no registration required.'
                    : 'Quick customer login — no registration required.'}
                </p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
