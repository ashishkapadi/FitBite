import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { apiFetch, safeJson } from '../../config/api';
import {
  MapPin,
  Navigation,
  Check,
  Plus,
  AlertCircle,
  X,
  Loader2,
  Home,
  Briefcase,
  Building,
  UserCheck
} from 'lucide-react';

export default function LocationModal({
  isOpen,
  onClose,
  selectedAddress,
  onSelectAddress
}) {
  const { user, openAuthModal, logout } = useAuth();
  const { cart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [serviceNotice, setServiceNotice] = useState(null);

  const [formData, setFormData] = useState({
    recipient_name: user?.full_name || '',
    phone: user?.phone || '',
    street_address: '',
    area: '',
    city: 'Bengaluru',
    pincode: '',
    label: 'Home'
  });

  const isDemo = user?.is_demo === true;

  useEffect(() => {
    if (isOpen) {
      setGeoError('');
      setSaveError('');
      setServiceNotice(null);

      if (user && !isDemo) {
        fetchAddresses();
      }
    }
  }, [isOpen, user, isDemo]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/users/addresses');
      if (res.ok) {
        const data = await safeJson(res);
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        if (list.length === 0) {
          setShowAddForm(true);
        }
      }
    } catch (err) {
      console.error('[LocationModal] Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please enter your address manually.');
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocating(false);
        // Autofill reasonable detected defaults
        setFormData(prev => ({
          ...prev,
          area: prev.area || 'Current Area',
          city: prev.city || 'Bengaluru',
          street_address: prev.street_address || `GPS coordinates (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
        }));
      },
      (error) => {
        setGeoLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. You can enter your delivery address manually below.');
        } else {
          setGeoError('Unable to detect location. Please type your delivery address manually.');
        }
      },
      { timeout: 8000 }
    );
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!formData.street_address.trim() || !formData.area.trim()) {
      setSaveError('Please provide street address and locality / area.');
      return;
    }

    if (isDemo) {
      setSaveError('Demo accounts cannot save personal delivery addresses. Please sign in or create a personal account.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const res = await apiFetch('/api/users/addresses', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          recipient_name: formData.recipient_name || user?.full_name || 'Customer',
          phone: formData.phone || user?.phone || '+91 9999999999'
        })
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save address.');
      }

      const saved = data.address || data;
      setAddresses(prev => [saved, ...prev]);
      setShowAddForm(false);
      onSelectAddress(saved);

      // Check serviceability against cart kitchen if cart has an active seller
      if (cart?.seller?.id) {
        checkCartServiceability(saved, cart.seller.id);
      } else {
        onClose();
      }
    } catch (err) {
      setSaveError(err.message || 'Error saving address.');
    } finally {
      setSaving(false);
    }
  };

  const checkCartServiceability = async (address, sellerId) => {
    try {
      const res = await apiFetch('/api/users/check-serviceability', {
        method: 'POST',
        body: JSON.stringify({
          seller_id: sellerId,
          pincode: address.pincode,
          area: address.area
        })
      });
      if (res.ok) {
        const result = await safeJson(res);
        if (!result.serviceable) {
          setServiceNotice(result.message);
          return;
        }
      }
      onClose();
    } catch {
      onClose();
    }
  };

  const handleSelect = (addr) => {
    onSelectAddress(addr);
    if (cart?.seller?.id) {
      checkCartServiceability(addr, cart.seller.id);
    } else {
      onClose();
    }
  };

  const handleDemoTransition = async () => {
    await logout();
    onClose();
    openAuthModal({
      mode: 'signup',
      accountType: 'customer'
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          padding: '24px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Dismiss"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={22} color="#10B981" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Delivery Location
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
              {isDemo ? 'Shared Demo Customer Session' : 'Select or add your delivery address'}
            </p>
          </div>
        </div>

        {/* Serviceability Notice */}
        {serviceNotice && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '0.85rem', color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700 }}>Kitchen Service Area Alert</div>
              <div>{serviceNotice}</div>
              <div style={{ marginTop: '8px' }}>
                <button type="button" className="btn btn-sm btn-outline" onClick={onClose} style={{ fontSize: '0.78rem' }}>
                  Keep Address Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATE 1: GUEST */}
        {!user && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Sign in or create your personal FitBite account to add, save, and manage your delivery addresses.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  openAuthModal({ mode: 'signin', accountType: 'customer' });
                }}
              >
                Sign In to Save Location
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  onClose();
                  openAuthModal({ mode: 'signup', accountType: 'customer' });
                }}
              >
                Create New Account
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: DEMO CUSTOMER */}
        {user && isDemo && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <UserCheck size={18} color="#059669" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                  Demo Customer Session Active
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Sign in or create your own account to save your delivery location. Personal addresses cannot be persisted to shared demo accounts.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDemoTransition}
              >
                Create Your Own Account
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  onClose();
                  openAuthModal({ mode: 'signin', accountType: 'customer' });
                }}
              >
                Sign In with Personal Account
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.85rem', cursor: 'pointer', padding: '8px' }}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: REAL CUSTOMER */}
        {user && !isDemo && (
          <div>
            {/* Saved addresses list */}
            {!showAddForm && (
              <div>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                    <Loader2 size={24} className="animate-spin" color="#10B981" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '16px' }}>
                      No saved delivery addresses found. Add one to see accurate kitchen availability.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus size={16} /> Add Delivery Address
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {addresses.map((addr) => {
                        const isSelected = selectedAddress?.id === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelect(addr)}
                            style={{
                              border: isSelected ? '2px solid #10B981' : '1px solid #E2E8F0',
                              backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                              borderRadius: '12px',
                              padding: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              transition: 'all 150ms'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <div style={{ marginTop: '2px' }}>
                                {addr.label === 'Work' ? <Briefcase size={18} color="#64748B" /> : <Home size={18} color="#64748B" />}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                                    {addr.label || 'Home'}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', background: '#E2E8F0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    {addr.area}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                                  {addr.street_address}, {addr.city} {addr.pincode ? `(${addr.pincode})` : ''}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={14} color="#FFF" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowAddForm(true)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Plus size={16} /> Add Another Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add address form */}
            {showAddForm && (
              <form onSubmit={handleSaveAddress}>
                {/* Geolocation Button */}
                <div style={{ marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={handleDeviceLocation}
                    disabled={geoLocating}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #10B981',
                      background: '#ECFDF5',
                      color: '#065F46',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: geoLocating ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {geoLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                    {geoLocating ? 'Detecting current location...' : 'Use Current Device Location'}
                  </button>
                  {geoError && (
                    <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '6px' }}>
                      {geoError}
                    </div>
                  )}
                </div>

                {saveError && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.82rem' }}>
                    {saveError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                      Locality / Area *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Indiranagar, Koramangala, HSR Layout"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                      Street Address / House / Flat *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Flat 301, Lakeview Residency, 4th Cross"
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                        Pincode
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 560038"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                      Address Tag
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['Home', 'Work', 'Other'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setFormData({ ...formData, label: tag })}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '8px',
                            border: formData.label === tag ? '2px solid #10B981' : '1px solid #CBD5E1',
                            background: formData.label === tag ? '#ECFDF5' : '#FFFFFF',
                            color: formData.label === tag ? '#065F46' : '#475569',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowAddForm(false)}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {saving ? 'Saving...' : 'Save & Select Location'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
