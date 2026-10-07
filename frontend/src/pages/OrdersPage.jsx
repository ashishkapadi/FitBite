import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle, 
  RefreshCw, 
  Truck, 
  AlertCircle 
} from 'lucide-react';

export default function OrdersPage() {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'delivered'

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (order) => {
    if (!order.items || order.items.length === 0) return;
    for (const it of order.items) {
      await addToCart({
        id: it.meal_id,
        name: it.meal_name_snapshot,
        image_url: it.meal_image_snapshot,
        base_price: it.unit_base_price,
        seller_id: order.seller_id,
        seller_name: order.seller?.business_name
      }, it.quantity, it.portion_snapshot, it.customizations_snapshot);
    }
    navigate('/checkout');
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'active') return ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status);
    if (activeTab === 'delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            My Orders
          </h1>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '1rem' }}>
            Track active deliveries, review past meals, and reorder your favorites.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#F3F4F6', padding: '0.35rem', borderRadius: '0.75rem' }}>
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'active', label: `Active (${orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length})` },
            { id: 'delivered', label: `Past Delivered (${orders.filter(o => o.status === 'delivered').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: activeTab === tab.id ? '#111827' : '#6B7280',
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <RefreshCw className="spin" size={32} color="#10B981" />
          <p style={{ color: '#6B7280', marginTop: '1rem' }}>Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#F9FAFB', borderRadius: '1rem' }}>
          <ShoppingBag size={48} color="#9CA3AF" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>No orders found</h3>
          <p style={{ color: '#6B7280', margin: '0 0 1.5rem' }}>Looks like you haven't placed an order matching this filter yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/explore')}>
            Discover Fresh Meals
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredOrders.map(order => {
            const isActive = !['delivered', 'cancelled'].includes(order.status);
            const statusColors = {
              confirmed: { bg: '#EFF6FF', text: '#1D4ED8' },
              preparing: { bg: '#FEF3C7', text: '#B45309' },
              ready_for_pickup: { bg: '#EDE9FE', text: '#6D28D9' },
              out_for_delivery: { bg: '#FDF2F8', text: '#BE185D' },
              delivered: { bg: '#ECFDF5', text: '#047857' },
              cancelled: { bg: '#FEE2E2', text: '#B91C1C' }
            };
            const currentStyle = statusColors[order.status] || { bg: '#F3F4F6', text: '#374151' };

            return (
              <div 
                key={order.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '1rem',
                  border: '1px solid #E5E7EB',
                  padding: '1.75rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
              >
                {/* Order Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>
                        #{order.order_number}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '999px', background: currentStyle.bg, color: currentStyle.text, textTransform: 'uppercase' }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '0.25rem' }}>
                      Kitchen: <b>{order.seller?.business_name || 'FitBite Kitchen'}</b> • {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>
                      ₹{order.grand_total}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {order.payment_method?.replace(/_/g, ' ').toUpperCase()} • {order.payment_status}
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {order.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <div style={{ color: '#374151' }}>
                        <span style={{ fontWeight: 700 }}>{item.quantity}x</span> {item.meal_name_snapshot} ({item.portion_snapshot})
                      </div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        ₹{item.item_total_price}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Actions Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #F3F4F6', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    Slot: <b>{order.delivery_slot}</b>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleReorder(order)}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <RotateCcw size={14} /> Reorder
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/tracking/${order.id}`)}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Truck size={14} /> {isActive ? 'Live Track' : 'View Details'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
