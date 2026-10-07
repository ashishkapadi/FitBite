import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Tag, 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function CheckoutPage() {
  const { user, token, openAuthModal } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_line1: '',
    city: 'Mumbai',
    pincode: '400050',
    address_type: 'Home'
  });

  // Delivery Preferences
  const [deliverySlot, setDeliverySlot] = useState('Instant Delivery (30-40 mins)');
  const [leaveAtDoorstep, setLeaveAtDoorstep] = useState(false);
  const [exchangeSteelDabba, setExchangeSteelDabba] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState(null);

  // Bill calculation state
  const [bill, setBill] = useState(null);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('demo_upi');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    if (user && token) {
      fetchAddresses();
    }
  }, [user, token]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/users/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        } else {
          setShowNewAddressForm(true);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.address_line1.trim()) return;

    try {
      const res = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });
      if (res.ok) {
        const saved = await res.json();
        setAddresses([...addresses, saved]);
        setSelectedAddressId(saved.id);
        setShowNewAddressForm(false);
        setNewAddress({ address_line1: '', city: 'Mumbai', pincode: '400050', address_type: 'Home' });
      }
    } catch (err) {
      alert('Failed to save address.');
    }
  };

  // Recalculate bill whenever cart items or coupon changes
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      setBill(null);
      return;
    }
    recalculateBill(couponFeedback?.code);
  }, [cart?.items]);

  const recalculateBill = async (activeCoupon) => {
    try {
      const subtotal = cart.items.reduce((sum, item) => sum + (item.total_price || item.item_price * item.quantity), 0);
      const res = await fetch('/api/orders/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subtotal,
          coupon_code: activeCoupon
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBill(data);
      }
    } catch (err) {
      console.error('Error recalculating bill:', err);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponFeedback(null);
    try {
      const subtotal = cart.items.reduce((sum, item) => sum + (item.total_price || item.item_price * item.quantity), 0);
      const res = await fetch('/api/orders/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subtotal,
          coupon_code: couponCode.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (data.coupon) {
        setCouponFeedback({
          success: true,
          code: data.coupon.code,
          message: `Saved ₹${data.discount_amount} with ${data.coupon.code}!`
        });
        setBill(data);
      } else {
        setCouponFeedback({
          success: false,
          message: 'Invalid or ineligible coupon code.'
        });
        recalculateBill(null);
      }
    } catch (err) {
      setCouponFeedback({
        success: false,
        message: 'Could not validate coupon.'
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      openAuthModal('customer', () => handlePlaceOrder());
      return;
    }

    if (!selectedAddressId) {
      alert('Please select or add a delivery address.');
      return;
    }

    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    setOrderError(null);

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          coupon_code: couponFeedback?.code || null,
          delivery_slot: deliverySlot,
          leave_at_doorstep: leaveAtDoorstep,
          exchange_steel_dabba: exchangeSteelDabba,
          delivery_instructions: deliveryInstructions
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Order placed successfully!
      navigate(`/tracking/${data.order.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setOrderError(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <ShoppingBag size={36} color="#9CA3AF" />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
          Your Cart is Empty
        </h2>
        <p style={{ color: '#6B7280', fontSize: '1.05rem', margin: '0 0 2rem' }}>
          Explore hundreds of healthy meals or craft your own personalized plate.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/explore')} style={{ padding: '0.85rem 2rem' }}>
          Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111827', margin: '0 0 2rem', letterSpacing: '-0.02em' }}>
        Secure Checkout
      </h1>

      {orderError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{orderError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>
        {/* Left Column: Delivery Details, Kitchen Items, Preferences, Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1: Delivery Address */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="#10B981" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>Delivery Address</h2>
              </div>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
              >
                <Plus size={14} style={{ marginRight: '4px' }} /> {showNewAddressForm ? 'Cancel' : 'Add New'}
              </button>
            </div>

            {/* Address Selection Radio Cards */}
            {!showNewAddressForm && addresses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {addresses.map(addr => {
                  const isSelected = addr.id === selectedAddressId;
                  return (
                    <label 
                      key={addr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '1rem',
                        border: isSelected ? '2px solid #10B981' : '1px solid #E5E7EB',
                        borderRadius: '0.75rem',
                        background: isSelected ? '#ECFDF5' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="address_choice" 
                        checked={isSelected} 
                        onChange={() => setSelectedAddressId(addr.id)}
                        style={{ marginTop: '0.25rem', accentColor: '#10B981' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                          {addr.address_type}
                        </div>
                        <div style={{ color: '#4B5563', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                          {addr.address_line1}, {addr.city} - {addr.pincode}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Add New Address Form */}
            {showNewAddressForm && (
              <form onSubmit={handleSaveAddress} style={{ background: '#F9FAFB', padding: '1.25rem', borderRadius: '0.75rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                    Address (Flat / Building / Street)
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Flat 402, Green Palms, Bandra West"
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>City</label>
                    <input type="text" className="form-input" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Pincode</label>
                    <input type="text" className="form-input" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>Type</label>
                    <select className="form-input" value={newAddress.address_type} onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value })}>
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                  Save & Use Address
                </button>
              </form>
            )}
          </div>

          {/* Section 2: Delivery Slot & Special Preferences */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Clock size={20} color="#10B981" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>Delivery Preferences</h2>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                Select Delivery Slot
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {[
                  'Instant Delivery (30-40 mins)',
                  'Lunch (12:00 PM - 1:30 PM)',
                  'Dinner (7:30 PM - 9:00 PM)'
                ].map((slot) => {
                  const isSlot = deliverySlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setDeliverySlot(slot)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: isSlot ? '2px solid #10B981' : '1px solid #D1D5DB',
                        background: isSlot ? '#ECFDF5' : '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: isSlot ? '#065F46' : '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkbox toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
                <input 
                  type="checkbox" 
                  checked={leaveAtDoorstep} 
                  onChange={(e) => setLeaveAtDoorstep(e.target.checked)} 
                  style={{ accentColor: '#10B981', width: '16px', height: '16px' }}
                />
                <span>Leave at doorstep (Contactless Delivery)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}>
                <input 
                  type="checkbox" 
                  checked={exchangeSteelDabba} 
                  onChange={(e) => setExchangeSteelDabba(e.target.checked)} 
                  style={{ accentColor: '#10B981', width: '16px', height: '16px' }}
                />
                <span style={{ fontWeight: 600, color: '#059669' }}>
                  Exchange yesterday's empty steel dabba (Zero-waste & ₹0 dabba charge)
                </span>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Delivery Instructions (Optional)
              </label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="e.g. Ring bell twice, leave with security guard if not answering"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
              />
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="#10B981" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>Payment Method</h2>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#ECFDF5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
                Demo Sandbox Mode
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[
                { id: 'demo_upi', title: 'Demo UPI', desc: 'Google Pay / PhonePe / Paytm (Instant)' },
                { id: 'demo_card', title: 'Demo Card', desc: 'Visa / Mastercard / RuPay' },
                { id: 'demo_netbanking', title: 'Demo NetBanking', desc: 'HDFC / ICICI / SBI Simulator' },
                { id: 'cash_on_delivery', title: 'Cash on Delivery', desc: 'Pay cash upon delivery' }
              ].map(m => {
                const isSelected = paymentMethod === m.id;
                return (
                  <label
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1rem',
                      border: isSelected ? '2px solid #10B981' : '1px solid #E5E7EB',
                      borderRadius: '0.75rem',
                      background: isSelected ? '#ECFDF5' : '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <input 
                        type="radio" 
                        name="pay_choice" 
                        checked={isSelected} 
                        onChange={() => setPaymentMethod(m.id)} 
                        style={{ accentColor: '#10B981' }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{m.title}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', paddingLeft: '1.5rem' }}>{m.desc}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>Payments in Demo Mode are verified on the backend with zero risk. No real bank charges apply.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items Summary & Bill Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cart Items List */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                Order Items ({cart.items.length})
              </h2>
              {cart.seller && (
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                  Kitchen: <b>{cart.seller.business_name}</b>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                    <ImageWithFallback src={item.meal?.image_url} alt={item.meal?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.15rem', color: '#111827' }}>
                      {item.meal?.name || 'Custom Meal'}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      ₹{item.item_price} each • {item.portion_selected || 'Standard'}
                    </div>
                    {item.customizations && (
                      <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.15rem' }}>
                        Base: {item.customizations.base || 'Standard'} • Spice: {item.customizations.spice || 'Medium'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                      x{item.quantity}
                    </span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Coupon code (e.g. WELCOME50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ textTransform: 'uppercase', fontSize: '0.9rem' }}
                />
                <button 
                  type="submit" 
                  className="btn btn-secondary" 
                  disabled={couponLoading}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              </div>

              {couponFeedback && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600, color: couponFeedback.success ? '#059669' : '#DC2626' }}>
                  {couponFeedback.message}
                </div>
              )}
            </form>
          </div>

          {/* Bill Breakdown Box */}
          {bill && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem', color: '#111827' }}>
                Bill Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: '#4B5563' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Item Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>₹{bill.subtotal}</span>
                </div>

                {bill.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Coupon Discount ({bill.coupon?.code})</span>
                    <span>-₹{bill.discount_amount}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Fee</span>
                  <span style={{ fontWeight: 600, color: bill.delivery_fee === 0 ? '#059669' : '#111827' }}>
                    {bill.delivery_fee === 0 ? 'FREE' : `₹${bill.delivery_fee}`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxes (5% GST)</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>₹{bill.tax_amount}</span>
                </div>

                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>To Pay</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>₹{bill.grand_total}</span>
                </div>
              </div>

              {/* Final Submit Button */}
              <button
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={submitting}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {submitting ? 'Placing Order...' : `Pay ₹${bill.grand_total} & Place Order`}
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
