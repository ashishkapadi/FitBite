import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import { apiFetch, safeJson } from '../config/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Truck, 
  ChevronRight,
  Coffee,
  Sun,
  Moon
} from 'lucide-react';

export default function SubscriptionsPage() {
  const { user, token, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my_subscriptions'
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('both');
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  // Selected plan computed from plans list
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || (plans.length > 0 ? plans[0] : null);

  // Pre-purchase calculated breakdown
  const [calculation, setCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Address and payment state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

  // Selected subscription calendar state for viewing
  const [selectedCalendarSubId, setSelectedCalendarSubId] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (user && token) {
      fetchMySubscriptions();
      fetchAddresses();
    }
  }, [user, token]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await apiFetch('/api/subscriptions/plans');
      if (res.ok) {
        const data = await safeJson(res);
        setPlans(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedPlanId(prev => (prev && data.some(p => p.id === prev) ? prev : data[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchMySubscriptions = async () => {
    try {
      const res = await apiFetch('/api/subscriptions/my');
      if (res.ok) {
        const data = await safeJson(res);
        setMySubscriptions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching my subscriptions:', err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await apiFetch('/api/users/addresses');
      if (res.ok) {
        const data = await safeJson(res);
        setAddresses(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  // Re-run calculate whenever plan, slot, or start date changes
  useEffect(() => {
    if (!selectedPlanId) return;
    calculatePrePurchase();
  }, [selectedPlanId, selectedSlot, startDate]);

  const calculatePrePurchase = async () => {
    setCalculating(true);
    try {
      const res = await apiFetch('/api/subscriptions/calculate', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: selectedPlanId,
          slot: selectedSlot,
          start_date: startDate
        })
      });
      if (res.ok) {
        const data = await safeJson(res);
        setCalculation(data);
      }
    } catch (err) {
      console.error('Error calculating subscription:', err);
    } finally {
      setCalculating(false);
    }
  };

  const fetchCalendar = async (subId) => {
    setSelectedCalendarSubId(subId);
    setCalendarLoading(true);
    try {
      const res = await apiFetch(`/api/subscriptions/${subId}/calendar`);
      if (res.ok) {
        const data = await safeJson(res);
        setCalendarData(data);
      }
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleSkipRequest = async (deliveryId) => {
    if (!window.confirm('Request skip for this scheduled meal? If eligible, your subscription end date will be extended by 1 day.')) return;
    try {
      const res = await apiFetch(`/api/subscriptions/${selectedCalendarSubId}/skip`, {
        method: 'POST',
        body: JSON.stringify({
          delivery_id: deliveryId,
          reason: 'Out of town / Personal change'
        })
      });
      const data = await safeJson(res);
      if (!res.ok) {
        alert(data.error || 'Could not skip delivery');
      } else {
        alert(data.message || 'Delivery successfully skipped and plan extended!');
        fetchCalendar(selectedCalendarSubId);
        fetchMySubscriptions();
      }
    } catch (err) {
      alert('Error requesting skip.');
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      openAuthModal({ mode: 'signin', accountType: 'customer', action: () => handleSubscribe() });
      return;
    }

    let addressIdToUse = selectedAddressId;

    if (!addressIdToUse) {
      if (!newAddressText.trim()) {
        alert('Please enter or select a serviceable delivery address before activating subscription.');
        return;
      }
      try {
        const addRes = await apiFetch('/api/users/addresses', {
          method: 'POST',
          body: JSON.stringify({
            street_address: newAddressText.trim(),
            area: selectedPlan?.seller?.area || 'Delivery Locality',
            city: 'Bengaluru',
            pincode: '560038',
            label: 'Home'
          })
        });
        const addData = await safeJson(addRes);
        if (addData.address?.id || addData.id) {
          addressIdToUse = addData.address?.id || addData.id;
        }
      } catch (err) {
        alert('Could not save address: ' + (err.message || 'Error'));
        return;
      }
    }

    setSubscribing(true);
    try {
      const res = await apiFetch('/api/subscriptions/create', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: selectedPlanId,
          address_id: addressIdToUse,
          slot: selectedSlot,
          start_date: startDate,
          payment_method: 'demo_upi'
        })
      });

      const data = await safeJson(res);
      if (!res.ok) {
        alert(data.error || 'Failed to activate subscription');
      } else {
        setPurchaseSuccess(data.subscription);
        fetchMySubscriptions();
        setActiveTab('my_subscriptions');
        fetchCalendar(data.subscription.id);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Error activating subscription.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Calendar size={16} /> Authentic Dabba & Tiffin Subscriptions
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            Affordable Daily Meal Subscriptions
          </h1>
          <p style={{ color: '#4B5563', fontSize: '1.1rem', maxWidth: '680px', margin: 0 }}>
            Fresh, home-cooked daily meals prepared by certified local cloud kitchens and mess services. Zero cooking stress, daily rotating menus, and generous skip-day extensions.
          </p>
        </div>

        {user && mySubscriptions.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', background: '#F3F4F6', padding: '0.35rem', borderRadius: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('browse')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'browse' ? '#FFFFFF' : 'transparent',
                fontWeight: 600,
                color: activeTab === 'browse' ? '#111827' : '#6B7280',
                cursor: 'pointer',
                boxShadow: activeTab === 'browse' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Browse Plans
            </button>
            <button
              onClick={() => {
                setActiveTab('my_subscriptions');
                if (mySubscriptions.length > 0 && !selectedCalendarSubId) {
                  fetchCalendar(mySubscriptions[0].id);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'my_subscriptions' ? '#FFFFFF' : 'transparent',
                fontWeight: 600,
                color: activeTab === 'my_subscriptions' ? '#111827' : '#6B7280',
                cursor: 'pointer',
                boxShadow: activeTab === 'my_subscriptions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              My Subscriptions ({mySubscriptions.length})
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: BROWSE PLANS & PRE-PURCHASE CALCULATOR */}
      {activeTab === 'browse' && (
        <div>
          {/* Loading State */}
          {loadingPlans && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', marginBottom: '2rem' }}>
              <RefreshCw size={36} color="#10B981" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>Loading authentic tiffin subscription plans...</div>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>Fetching verified cloud kitchen menus and daily schedules</p>
            </div>
          )}

          {/* Empty State */}
          {!loadingPlans && plans.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', marginBottom: '2rem' }}>
              <Calendar size={48} color="#9CA3AF" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>No Subscription Plans Found</h3>
              <p style={{ color: '#6B7280', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
                Subscription plans from verified partner kitchens are being updated. Click below to refresh available plans.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={fetchPlans}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} /> Refresh Subscription Plans
              </button>
            </div>
          )}

          {/* Plan Comparison Cards */}
          {!loadingPlans && plans.length > 0 && (
            <div className="tiffin-plans-grid">
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId;
                const isStudent = p.plan_type === 'student';
                const perMealPrice = p.per_meal_cost || Math.round(p.base_price_per_meal * (1 - (p.plan_discount_percent || 0) / 100));

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className="tiffin-plan-card"
                    style={{
                      border: isSelected ? '2px solid #10B981' : '1px solid #E5E7EB',
                      boxShadow: isSelected ? '0 10px 25px -5px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#10B981', color: '#FFF', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Selected Plan
                      </div>
                    )}

                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isStudent ? '#6366F1' : '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      {isStudent ? '🎒 Academic / Student Routine' : '🏢 Corporate / Working Professional'}
                    </div>

                    <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
                      {p.name}
                    </h3>

                    <p style={{ color: '#4B5563', fontSize: '0.92rem', margin: '0 0 1.25rem', lineHeight: '1.5' }}>
                      {p.description}
                    </p>

                    <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', border: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>₹{perMealPrice}</span>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>/ meal ({p.base_price_per_meal} base)</span>
                        {p.plan_discount_percent > 0 && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            Save {p.plan_discount_percent}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                        <span>Kitchen: <b>{p.kitchen_name || p.seller?.business_name || 'Verified Kitchen'}</b></span>
                        <span style={{ color: '#F59E0B', fontWeight: 700 }}>★ {p.seller?.rating || '4.9'}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '0.35rem', fontWeight: 600 }}>
                        {p.dietary_type || 'Pure Vegetarian'} • {p.portion_info || 'Homestyle Portion'}
                      </div>
                    </div>

                    {/* Highlights */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', fontSize: '0.88rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {isStudent
                            ? 'Deliveries Mon–Fri only (Weekends strictly excluded from charges)'
                            : '28 consecutive calendar days daily cycle (includes weekends)'}
                        </span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {isStudent
                            ? 'Pay strictly for eligible college weekdays in chosen window'
                            : (p.skip_policy || 'Up to 2 skip days permitted (each extends subscription end date by 1 day)')}
                        </span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>Supported slots: {Array.isArray(p.supported_slots) ? p.supported_slots.join(', ') : 'Lunch, Dinner, Both'}</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>Cutoff notice: {p.skip_cutoff || '08:30 AM IST (Lunch) / 04:00 PM IST (Dinner)'}</span>
                      </li>
                    </ul>

                    {/* Customization Options Badges */}
                    {p.customization_options && p.customization_options.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          Customization Supported:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.customization_options.slice(0, 3).map((opt, oIdx) => (
                            <span key={oIdx} style={{ fontSize: '0.7rem', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sample Kitchen Dishes Preview */}
                    {p.sample_meals && p.sample_meals.length > 0 && (
                      <div className="sample-dishes-section">
                        <div className="sample-dishes-heading">
                          Sample Dishes from {p.kitchen_name || 'Kitchen'}:
                        </div>
                        <div className="sample-dishes-grid">
                          {p.sample_meals.map(sm => (
                            <div key={sm.id} className="sample-dish-tile">
                              <ImageWithFallback
                                src={sm.image_url}
                                alt={sm.name}
                                category="sample"
                                className="sample-dish-image"
                              />
                              <div className="sample-dish-name">
                                {sm.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Configuration & Pre-Purchase Calculator */}
          {selectedPlan && (
            <div style={{ background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: 'clamp(1.25rem, 4vw, 2.5rem)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minWidth: 0, boxSizing: 'border-box' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 1.5rem' }}>
                Customize & Calculate Your Schedule
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1.5rem', marginBottom: '2.5rem', minWidth: 0 }}>
                {/* Meal Slots Selector */}
                <div style={{ minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>
                    Daily Meal Slot(s)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', minWidth: 0 }}>
                    {[
                      { id: 'lunch', label: 'Lunch', sub: '12:00 - 1:30 PM', icon: Sun },
                      { id: 'dinner', label: 'Dinner', sub: '7:30 - 9:00 PM', icon: Moon },
                      { id: 'both', label: 'Both', sub: 'Lunch & Dinner', icon: Coffee }
                    ].map(s => {
                      const isSlotSelected = selectedSlot === s.id;
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSlot(s.id)}
                          style={{
                            padding: '1rem 0.5rem',
                            borderRadius: '0.75rem',
                            border: isSlotSelected ? '2px solid #10B981' : '1px solid #D1D5DB',
                            background: isSlotSelected ? '#ECFDF5' : '#FFFFFF',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <Icon size={20} color={isSlotSelected ? '#059669' : '#6B7280'} style={{ margin: '0 auto 0.35rem' }} />
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSlotSelected ? '#065F46' : '#111827' }}>{s.label}</div>
                          <div style={{ fontSize: '0.7rem', color: isSlotSelected ? '#047857' : '#6B7280' }}>{s.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Start Date Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>
                    Subscription Start Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ padding: '0.75rem', fontSize: '1rem' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.5rem 0 0' }}>
                    Preparation cutoffs are enforced in <b>Asia/Kolkata (IST)</b>. Same-day lunch starts require cutoff before 8:30 AM.
                  </p>
                </div>

                {/* Address Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>
                    Delivery Address
                  </label>
                  {addresses.length > 0 ? (
                    <select
                      className="form-input"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      style={{ padding: '0.75rem', fontSize: '0.95rem' }}
                    >
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.address_type}: {a.address_line1}, {a.city} - {a.pincode}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter flat / building / street name..."
                      value={newAddressText}
                      onChange={(e) => setNewAddressText(e.target.value)}
                      style={{ padding: '0.75rem', fontSize: '0.95rem' }}
                    />
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Serviceable in {selectedPlan?.seller?.area || 'Indiranagar & Bengaluru mess routes'}
                  </div>
                </div>
              </div>

              {/* Rotating Menu Preview for Selected Plan */}
              {selectedPlan?.menu_preview && selectedPlan.menu_preview.length > 0 && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                    <Sparkles size={16} color="#10B981" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
                      Rotating Weekly Menu Preview ({selectedPlan.kitchen_name || 'Kitchen'})
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {selectedPlan.menu_preview.map((item, idx) => (
                      <div key={idx} style={{ background: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>{item.day || item.date}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', marginTop: '3px' }}>{item.meal_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>Slot: {item.slot}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exact Pre-Purchase Calculation Breakdown Table */}
              {calculation && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.75rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        CALCULATED SCHEDULE PREVIEW
                      </span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
                        {calculation.start_date} → {calculation.end_date}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block' }}>ELIGIBLE DAYS</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>{calculation.delivery_days_count} days</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block' }}>TOTAL MEALS</span>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>{calculation.total_meals_purchased} meals</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial itemization */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Base Price / Meal:</span>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>₹{calculation.base_price_per_meal}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Subscriber Price / Meal:</span>
                      <div style={{ fontWeight: 700, color: '#059669' }}>₹{calculation.effective_price_per_meal} ({calculation.discount_percent}% OFF)</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>GST (5% Configured):</span>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>₹{calculation.tax_amount}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Doorstep Delivery:</span>
                      <div style={{ fontWeight: 700, color: '#059669' }}>FREE (₹0)</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                        Skip Policy: {calculation.skip_policy}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>GRAND TOTAL</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>₹{calculation.grand_total}</span>
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={handleSubscribe}
                        disabled={subscribing}
                        style={{ padding: '0.85rem 1.5rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: 'min(100%, 200px)' }}
                      >
                        {subscribing ? 'Activating...' : 'Activate Subscription'} <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUBSCRIPTIONS & INTERACTIVE ROTATING MENU CALENDAR */}
      {activeTab === 'my_subscriptions' && (
        <div>
          {mySubscriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#F9FAFB', borderRadius: '1rem' }}>
              <Calendar size={48} color="#9CA3AF" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>No Active Subscriptions Yet</h3>
              <p style={{ color: '#6B7280', margin: '0 0 1.5rem' }}>Browse our Working Professional or Student tiffin plans to get started.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('browse')}>
                Explore Plans
              </button>
            </div>
          ) : (
            <div>
              {/* Subscription Selector Pills */}
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
                {mySubscriptions.map(s => {
                  const isSelected = s.id === selectedCalendarSubId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => fetchCalendar(s.id)}
                      style={{
                        padding: '1.25rem',
                        background: isSelected ? '#FFFFFF' : '#F9FAFB',
                        border: isSelected ? '2px solid #10B981' : '1px solid #E5E7EB',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        minWidth: '280px',
                        boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {s.subscription_number}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.status === 'active' ? '#059669' : '#6B7280' }}>
                          {s.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' }}>
                        {s.plan?.name || 'Tiffin Subscription'}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 0.75rem' }}>
                        Kitchen: {s.seller?.business_name || 'FitBite Kitchen'}
                      </p>
                      
                      {/* Entitlements tracker */}
                      <div style={{ fontSize: '0.75rem', color: '#374151', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem' }}>
                        <span>Delivered: <b>{s.meals_delivered_count || 0}/{s.total_meals_purchased}</b></span>
                        <span>Skips Used: <b>{s.meals_skipped_count || 0}/{s.max_skips_allowed}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Deliveries View */}
              {calendarLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <RefreshCw className="spin" size={32} color="#10B981" />
                  <p style={{ color: '#6B7280', marginTop: '1rem' }}>Loading rotating tiffin menu calendar...</p>
                </div>
              ) : calendarData ? (
                <div>
                  {/* Subscription Metadata Header */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem' }}>
                        {calendarData.plan?.name} • 4-Week Rotating Delivery Schedule
                      </h3>
                      <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                        Start: <b>{calendarData.subscription.start_date}</b> • Original End: <b>{calendarData.subscription.original_end_date}</b> • 
                        Revised End: <b style={{ color: '#059669' }}>{calendarData.subscription.revised_end_date}</b> (adjusted for skips)
                      </p>
                    </div>

                    <div style={{ background: '#ECFDF5', color: '#065F46', padding: '0.6rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      Cutoff Policy: Lunch by 8:30 AM IST • Dinner by 4:00 PM IST
                    </div>
                  </div>

                  {/* Scheduled Deliveries Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {calendarData.deliveries?.map((d) => {
                      const isLunch = d.slot === 'lunch';
                      const meal = d.chosen_meal || d.scheduled_meal;

                      return (
                        <div
                          key={d.id}
                          style={{
                            background: d.is_skipped ? '#F3F4F6' : '#FFFFFF',
                            border: d.is_skipped ? '1px dashed #9CA3AF' : '1px solid #E5E7EB',
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            opacity: d.is_skipped ? 0.75 : 1,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ padding: '0.65rem 1rem', background: d.is_skipped ? '#E5E7EB' : isLunch ? '#FFFBEB' : '#EFF6FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isLunch ? <Sun size={15} color="#D97706" /> : <Moon size={15} color="#2563EB" />}
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isLunch ? '#92400E' : '#1E40AF', textTransform: 'capitalize' }}>
                                {d.delivery_date} ({d.slot})
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: d.is_skipped ? '#6B7280' : d.status === 'delivered' ? '#059669' : '#374151' }}>
                              {d.is_skipped ? 'SKIPPED (PLAN EXTENDED)' : d.status.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', padding: '1rem', gap: '1rem' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                              <ImageWithFallback
                                src={meal?.image_url}
                                alt={meal?.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>

                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#111827' }}>
                                {meal?.name || 'Chef Special Tiffin'}
                              </h4>
                              <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 0.5rem' }}>
                                Customizations: Basmati Rice • Medium Spice
                              </p>

                              {d.is_skipped ? (
                                <div style={{ fontSize: '0.75rem', color: '#4B5563', fontStyle: 'italic' }}>
                                  Reason: {d.skip_reason || 'Customer requested skip'}
                                </div>
                              ) : (
                                <div>
                                  {d.can_modify ? (
                                    <button
                                      className="btn btn-outline"
                                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                      onClick={() => handleSkipRequest(d.id)}
                                    >
                                      Request Skip (Extend End Date)
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.7rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <Clock size={12} /> {d.cutoff_message || 'Prep cutoff passed'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
