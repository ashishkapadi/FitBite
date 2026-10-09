import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  MapPin,
  Search,
  ShoppingCart,
  User,
  LogOut,
  Sliders,
  Calendar,
  Sparkles,
  Store,
  ShieldCheck,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import LocationModal from './LocationModal';
import { apiFetch, safeJson } from '../../config/api';

export function Navbar() {
  const { user, sellerProfile, openAuthModal, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isSellerRoute = location.pathname.startsWith('/seller');

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronize customer location based on authentication state
  useEffect(() => {
    if (!user) {
      setSelectedAddress(null);
      localStorage.removeItem('fitbite_active_address_id');
      return;
    }

    // Demo accounts must never display or prefill shared addresses
    if (user.is_demo) {
      setSelectedAddress(null);
      return;
    }

    // Real customer account: load saved addresses
    const loadCustomerAddresses = async () => {
      try {
        const res = await apiFetch('/api/users/addresses');
        if (res.ok) {
          const list = await safeJson(res);
          if (Array.isArray(list) && list.length > 0) {
            const savedId = localStorage.getItem('fitbite_active_address_id');
            const found = list.find(a => a.id === savedId) || list.find(a => a.is_default) || list[0];
            setSelectedAddress(found);
          } else {
            setSelectedAddress(null);
          }
        }
      } catch (err) {
        console.error('[Navbar] Error loading customer location:', err);
      }
    };

    loadCustomerAddresses();
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
    if (addr?.id) {
      localStorage.setItem('fitbite_active_address_id', addr.id);
    }
  };

  // Determine short header label
  const locationLabel = (user && !user.is_demo && selectedAddress)
    ? (selectedAddress.area || selectedAddress.city || 'Delivery Location')
    : 'Add your location';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  if (isSellerRoute) {
    return (
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderBottom: '1px solid #1E293B',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', gap: '16px' }}>
          {/* Partner Brand */}
          <Link to="/seller" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.3rem',
              boxShadow: '0 4px 10px rgba(234, 88, 12, 0.4)'
            }}>
              👨‍🍳
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                FitBite <span style={{ color: '#FB923C' }}>Partner</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Kitchen Operations &amp; Subscriptions
              </div>
            </div>
          </Link>

          {/* Kitchen Identity & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {sellerProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hide-mobile">
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#E2E8F0' }}>
                  {sellerProfile.business_name || 'Partner Kitchen'}
                </span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: sellerProfile.verification_status === 'approved' ? '#065F46' : '#78350F',
                  color: sellerProfile.verification_status === 'approved' ? '#34D399' : '#FDE68A',
                  border: `1px solid ${sellerProfile.verification_status === 'approved' ? '#059669' : '#D97706'}`
                }}>
                  {sellerProfile.verification_status === 'approved' ? '✓ Verified Kitchen' : '⏳ Verification Pending'}
                </span>
              </div>
            )}

            <Link
              to="/"
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#CBD5E1',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← Customer Storefront
            </Link>

            {user && (
              <button
                type="button"
                onClick={logout}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#F87171',
                  background: 'transparent',
                  border: '1px solid #7F1D1D',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255, 253, 249, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px', gap: '16px' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1.4rem',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
          }}>
            🥗
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              Fit<span style={{ color: '#10B981' }}>Bite</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Your meals, your way
            </div>
          </div>
        </Link>

        {/* Dynamic Location Button */}
        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            color: '#1E293B',
            fontSize: '0.86rem',
            fontWeight: 600,
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '9999px',
            padding: '6px 14px',
            cursor: 'pointer',
            transition: 'all 150ms'
          }}
          className="hide-mobile"
          title="Change or set delivery location"
        >
          <MapPin size={16} color="#10B981" />
          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {locationLabel}
          </span>
          <ChevronDown size={14} color="#64748B" />
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: '340px' }} className="hide-mobile">
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '9999px',
            border: '1.5px solid #E2E8F0',
            padding: '2px 14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search dishes, thalis, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: 'none',
                outline: 'none',
                fontSize: '0.88rem',
                backgroundColor: 'transparent'
              }}
            />
          </div>
        </form>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '18px' }} className="hide-mobile">
          <Link to="/explore" style={{ fontWeight: 600, fontSize: '0.92rem', color: '#475569', transition: 'color 150ms' }}>
            Explore Meals
          </Link>

          <Link to="/subscriptions" style={{ fontWeight: 600, fontSize: '0.92rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={16} color="#10B981" />
            Tiffin Plans
          </Link>

          <Link to="/build-meal" style={{
            fontWeight: 700,
            fontSize: '0.92rem',
            color: '#F97316',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sliders size={16} color="#F97316" />
            Build Your Meal
          </Link>

          <Link to="/orders" style={{ fontWeight: 600, fontSize: '0.92rem', color: '#475569', transition: 'color 150ms' }}>
            Orders
          </Link>

          <Link to="/meal-planner" style={{ fontWeight: 600, fontSize: '0.92rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={16} color="#3B82F6" />
            7-Day Planner
          </Link>
        </nav>

        {/* Actions: Cart & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Cart Button */}
          <Link to="/checkout" className="btn btn-outline btn-sm" style={{ position: 'relative', padding: '8px 12px' }}>
            <ShoppingCart size={19} color="#0F172A" />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.4)'
              }}>
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Profile / Auth Button */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#10B981',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  {user.full_name?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown size={14} color="#64748B" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '115%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    border: '1px solid #E2E8F0',
                    width: '240px',
                    padding: '8px',
                    zIndex: 200
                  }}
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user.email}</div>
                    <span className="badge badge-veg" style={{ marginTop: '6px', fontSize: '0.7rem' }}>
                      Role: {user.role.toUpperCase()}
                    </span>
                  </div>

                  <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', color: '#334155' }}>
                    📦 My Orders &amp; Tracking
                  </Link>

                  <Link to="/subscriptions" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', color: '#334155' }}>
                    📅 Tiffin Subscriptions
                  </Link>

                  <Link to="/build-meal" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', color: '#334155' }}>
                    🥗 Saved Custom Meals
                  </Link>

                  <Link to="/meal-planner" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', color: '#334155' }}>
                    ✨ 7-Day Diet Plan
                  </Link>

                  {(user.role === 'seller' || user.role === 'admin') && (
                    <Link to="/seller" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', color: '#F97316', fontWeight: 600 }}>
                      <Store size={16} /> Kitchen Dashboard
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.88rem', color: '#7C3AED', fontWeight: 600 }}>
                      <ShieldCheck size={16} /> Platform Admin Desk
                    </Link>
                  )}

                  <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '6px', paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={logout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        width: '100%',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        color: '#EF4444',
                        textAlign: 'left'
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal({ mode: 'signin', accountType: 'customer' })}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 600 }}
            >
              Sign In / Join
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="show-mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ padding: '6px', color: '#0F172A' }}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search dishes, thalis, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ marginBottom: '8px' }}
            />
          </form>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsLocationModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 0',
              border: 'none',
              background: 'none',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: '#0F172A',
              cursor: 'pointer',
              borderBottom: '1px solid #F1F5F9'
            }}
          >
            <MapPin size={18} color="#10B981" />
            <span>{locationLabel}</span>
          </button>

          <Link to="/explore" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 600, padding: '8px 0', color: '#334155' }}>
            Explore Meals
          </Link>
          <Link to="/subscriptions" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 600, padding: '8px 0', color: '#334155' }}>
            Tiffin Subscriptions
          </Link>
          <Link to="/build-meal" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 700, padding: '8px 0', color: '#F97316' }}>
            Build Your Own Meal
          </Link>
          <Link to="/meal-planner" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 600, padding: '8px 0', color: '#334155' }}>
            7-Day Diet Planner
          </Link>
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedAddress={selectedAddress}
        onSelectAddress={handleSelectAddress}
      />

      {/* Responsive media query styling */}
      <style>{`
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .show-mobile-only { display: block !important; }
        }
        @media (min-width: 901px) {
          .show-mobile-only { display: none !important; }
        }
      `}</style>
    </header>
  );
}

export default Navbar;
