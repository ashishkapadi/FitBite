import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { SOCKET_URL, apiFetch, safeJson } from '../config/api';
import ImageWithFallback from '../components/ImageWithFallback';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Truck, 
  ChefHat, 
  Package, 
  Star, 
  Phone, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ArrowLeft,
  XCircle,
  Play
} from 'lucide-react';

const MILESTONES = [
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle, desc: 'Accepted by kitchen counter' },
  { key: 'preparing', label: 'Preparing Meal', icon: ChefHat, desc: 'Fresh ingredients being cooked' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: Package, desc: 'Packed in thermal container' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, desc: 'Rider is on the way to you' },
  { key: 'delivered', label: 'Delivered Fresh', icon: CheckCircle, desc: 'Delivered at your doorstep' }
];

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [trackingData, setTrackingData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Simulation state
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchOrderAndTracking();

    // Setup Socket.IO for live tracking updates
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    socket.emit('join_order', { order_id: orderId });

    socket.on('tracking_update', (data) => {
      if (data.order_id === orderId) {
        fetchOrderAndTracking();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  const fetchOrderAndTracking = async () => {
    try {
      const [trackRes, orderRes] = await Promise.all([
        apiFetch(`/api/tracking/${orderId}`),
        apiFetch(`/api/orders/${orderId}`)
      ]);

      if (!trackRes.ok || !orderRes.ok) {
        throw new Error('Order tracking information could not be retrieved.');
      }

      const trackJson = await safeJson(trackRes);
      const orderJson = await safeJson(orderRes);

      setTrackingData(trackJson);
      setOrderDetails(orderJson);
      if (orderJson.review) {
        setReviewSubmitted(true);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError(err.message || 'Unable to load tracking details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateStep = async () => {
    setSimulating(true);
    try {
      const res = await apiFetch('/api/tracking/simulate-step', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId })
      });
      if (res.ok) {
        await fetchOrderAndTracking();
      }
    } catch (err) {
      alert('Error advancing simulation step.');
    } finally {
      setSimulating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Cancellations are only permitted before the kitchen starts preparation.')) return;
    try {
      const res = await apiFetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Customer requested cancellation' })
      });
      const data = await safeJson(res);
      if (!res.ok) {
        alert(data.error || 'Failed to cancel order');
      } else {
        alert('Order has been cancelled.');
        fetchOrderAndTracking();
      }
    } catch (err) {
      alert('Error cancelling order.');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await apiFetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        setReviewSubmitted(true);
        fetchOrderAndTracking();
      } else {
        const data = await safeJson(res);
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      alert('Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '5rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <RefreshCw className="spin" size={36} color="#10B981" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Loading Live Order Tracking...</h2>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>Tracking Unavailable</h2>
        <p style={{ color: '#6B7280', margin: '0 0 1.5rem' }}>{error || 'Could not find order tracking.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/orders')}>View All Orders</button>
      </div>
    );
  }

  const currentStatus = trackingData.status;
  const isCancelled = currentStatus === 'cancelled';
  const isDelivered = currentStatus === 'delivered';
  const currentMilestoneIndex = MILESTONES.findIndex(m => m.key === currentStatus);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <button 
            onClick={() => navigate('/orders')} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: 0, marginBottom: '0.5rem' }}
          >
            <ArrowLeft size={16} /> Back to My Orders
          </button>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            Tracking Order #{trackingData.order_number}
          </h1>
          <p style={{ color: '#4B5563', margin: 0, fontSize: '0.95rem' }}>
            Prepared by <b>{trackingData.seller?.business_name || 'FitBite Kitchen'}</b> ({trackingData.seller?.area || 'Bandra West'})
          </p>
        </div>

        {/* Milestone Simulation Action Button for Easy Demo Verification */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {!isDelivered && !isCancelled && (
            <button
              className="btn btn-secondary"
              onClick={handleSimulateStep}
              disabled={simulating}
              title="Simulates rider/kitchen advancing the order milestone in real-time"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}
            >
              <Play size={16} /> {simulating ? 'Advancing...' : 'Demo: Advance Milestone'}
            </button>
          )}

          {currentStatus === 'confirmed' && (
            <button
              className="btn btn-outline"
              onClick={handleCancelOrder}
              style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Main Tracking Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1.25rem', padding: '2.5rem', marginBottom: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {/* Status Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CURRENT STATUS
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isCancelled ? '#DC2626' : '#10B981', marginTop: '0.25rem' }}>
              {isCancelled ? 'Order Cancelled' : MILESTONES.find(m => m.key === currentStatus)?.label || currentStatus.toUpperCase()}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', display: 'block' }}>ESTIMATED TIME</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
              {isDelivered ? 'Delivered' : isCancelled ? 'N/A' : `${trackingData.estimated_delivery_minutes} mins`}
            </span>
          </div>
        </div>

        {/* Milestone Timeline Steps */}
        {!isCancelled && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', position: 'relative', marginBottom: '2.5rem' }}>
            {MILESTONES.map((m, idx) => {
              const isPast = idx < currentMilestoneIndex;
              const isCurrent = idx === currentMilestoneIndex;
              const Icon = m.icon;

              return (
                <div 
                  key={m.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: isCurrent ? '#ECFDF5' : isPast ? '#F8FAFC' : '#FFFFFF',
                    border: isCurrent ? '2px solid #10B981' : isPast ? '1px solid #CBD5E1' : '1px solid #E5E7EB',
                    opacity: isPast || isCurrent ? 1 : 0.45
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isCurrent ? '#10B981' : isPast ? '#059669' : '#E5E7EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isCurrent ? '#065F46' : '#111827' }}>
                      Step {idx + 1}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '0.2rem' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {m.desc}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delivery Partner & Steel Dabba Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', background: '#F9FAFB', padding: '1.5rem', borderRadius: '1rem' }}>
          {/* Rider Details */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              ASSIGNED DELIVERY PARTNER
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                VJ
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>
                  {trackingData.delivery_partner?.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                  {trackingData.delivery_partner?.vehicle_number} • ⭐ {trackingData.delivery_partner?.rating}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.2rem' }}>
                  <Phone size={12} /> {trackingData.delivery_partner?.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Tracker */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              DELIVERY PREFERENCES & STEEL DABBA
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} color="#10B981" />
                Slot: <b>{trackingData.delivery_slot}</b>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} color="#10B981" />
                Steel Dabba Exchange: <b>{trackingData.exchange_steel_dabba ? 'Yes (Empty dabba ready for pickup)' : 'Standard packaging'}</b>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} color="#10B981" />
                Contactless Doorstep: <b>{trackingData.leave_at_doorstep ? 'Yes, leave at doorstep' : 'Hand to customer'}</b>
              </li>
              {trackingData.delivery_instructions && (
                <li style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                  Note: "{trackingData.delivery_instructions}"
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Review Submission Section (Triggered upon delivery) */}
      {isDelivered && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1.25rem', padding: '2rem', marginBottom: '2.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#111827' }}>
            How was your FitBite meal experience?
          </h3>
          <p style={{ color: '#4B5563', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
            Your feedback directly helps {trackingData.seller?.business_name} maintain top culinary standards.
          </p>

          {reviewSubmitted ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#065F46' }}>
              <CheckCircle size={22} color="#059669" />
              <div>
                <b>Review Submitted!</b> Thank you for rating this meal.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  Rate your meal (1 to 5 Stars)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Star size={28} fill={star <= rating ? '#F59E0B' : 'none'} color={star <= rating ? '#F59E0B' : '#D1D5DB'} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Comments & Taste Feedback
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Tell us about the spice, freshness, and portion size..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReview}
                style={{ padding: '0.75rem 1.75rem' }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Ordered Items Breakdown */}
      {orderDetails?.items && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1.25rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.25rem', color: '#111827' }}>
            Items in this Delivery ({orderDetails.items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orderDetails.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <ImageWithFallback src={item.meal_image_snapshot} alt={item.meal_name_snapshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                      {item.meal_name_snapshot}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      Portion: {item.portion_snapshot} • Qty: {item.quantity}
                    </div>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                  ₹{item.item_total_price}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Total Paid:</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
                ₹{orderDetails.order.grand_total}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
