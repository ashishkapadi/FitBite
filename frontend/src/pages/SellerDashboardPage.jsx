import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import { apiFetch, safeJson } from '../config/api';
import { 
  ChefHat, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  RefreshCw, 
  Truck, 
  FileText, 
  Check, 
  X, 
  ShieldCheck,
  PackageCheck,
  TrendingUp,
  MapPin,
  Coffee
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user, token, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'menu' | 'manifest' | 'overview'
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [meals, setMeals] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Meal Form Modal State
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    category_id: 'cat_north_indian',
    base_price: 180,
    cuisine: 'North Indian',
    description: '',
    calories: 520,
    protein_grams: 18,
    carbs_grams: 65,
    fat_grams: 14,
    is_tiffin_eligible: true
  });

  // Batch Manifest Filters
  const [manifestSlot, setManifestSlot] = useState('lunch');
  const [manifestDate, setManifestDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) {
      openAuthModal({ mode: 'signin', accountType: 'seller', action: () => {} });
      return;
    }
    if (user.role !== 'seller' && user.role !== 'admin') {
      alert('Access restricted to Partner Kitchens.');
      navigate('/');
      return;
    }
    fetchAllSellerData();
  }, [user]);

  const fetchAllSellerData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverview(),
        fetchOrders(),
        fetchMeals(),
        fetchManifest()
      ]);
    } catch (err) {
      console.error('Error loading seller dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    const res = await apiFetch('/api/seller/overview');
    if (res.ok) setOverview(await safeJson(res));
  };

  const fetchOrders = async () => {
    const res = await apiFetch('/api/seller/orders');
    if (res.ok) {
      const data = await safeJson(res);
      setOrders(Array.isArray(data) ? data : []);
    }
  };

  const fetchMeals = async () => {
    const res = await apiFetch('/api/seller/meals');
    if (res.ok) {
      const data = await safeJson(res);
      setMeals(Array.isArray(data) ? data : []);
    }
  };

  const fetchManifest = async () => {
    const res = await apiFetch(`/api/seller/batch-manifest?date=${manifestDate}&slot=${manifestSlot}`);
    if (res.ok) setManifest(await safeJson(res));
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await apiFetch(`/api/seller/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
        fetchOverview();
      } else {
        const data = await safeJson(res);
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleToggleMealAvailability = async (meal) => {
    try {
      const res = await apiFetch(`/api/seller/meals/${meal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_available: !meal.is_available })
      });
      if (res.ok) {
        fetchMeals();
      }
    } catch (err) {
      alert('Error toggling availability');
    }
  };

  const handleCreateMeal = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/seller/meals', {
        method: 'POST',
        body: JSON.stringify(newMeal)
      });
      if (res.ok) {
        setShowAddMealModal(false);
        fetchMeals();
        alert('New dish added to kitchen menu!');
      } else {
        const data = await safeJson(res);
        alert(data.error || 'Failed to add meal');
      }
    } catch (err) {
      alert('Error saving meal');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '5rem auto', textAlign: 'center' }}>
        <RefreshCw className="spin" size={36} color="#10B981" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Loading Kitchen Terminal...</h2>
      </div>
    );
  }

  const seller = overview?.seller;
  const isApproved = seller?.verification_status === 'approved';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      {/* Verification Notice Banner */}
      {!isApproved && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1.25rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#92400E' }}>
          <AlertCircle size={24} color="#D97706" />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800 }}>
              Kitchen Status: {seller?.verification_status?.toUpperCase() || 'PENDING APPROVAL'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {seller?.verification_status === 'pending_approval' 
                ? 'Your kitchen documents and 14-digit FSSAI registration are under standard review by FitBite administrators. You can prepare draft menus and manage settings, but meals are not yet publicly discoverable.'
                : `Status notice: ${seller?.rejection_reason || 'Under administrative review'}`}
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              {seller?.business_name || 'Kitchen Partner Terminal'}
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '999px', background: isApproved ? '#ECFDF5' : '#FEF3C7', color: isApproved ? '#047857' : '#B45309', textTransform: 'uppercase' }}>
              {seller?.verification_status || 'Active'}
            </span>
          </div>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '0.95rem' }}>
            FSSAI License: <b>{seller?.fssai_number || '21523000000000'}</b> • Rating: ⭐ {seller?.rating || '4.8'} ({seller?.rating_count || 42} reviews)
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#F3F4F6', padding: '0.35rem', borderRadius: '0.75rem' }}>
          {[
            { id: 'tickets', label: `Kitchen Tickets (${orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length})` },
            { id: 'manifest', label: 'Batch Manifest' },
            { id: 'menu', label: `Menu (${meals.length})` },
            { id: 'overview', label: 'Performance' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === t.id ? '#FFFFFF' : 'transparent',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: activeTab === t.id ? '#111827' : '#6B7280',
                cursor: 'pointer',
                boxShadow: activeTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: KITCHEN PREPARATION TICKETS */}
      {activeTab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              Live Kitchen Tickets & Customizations
            </h2>
            <button className="btn btn-outline" onClick={fetchOrders} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              <RefreshCw size={14} style={{ marginRight: '4px' }} /> Refresh Orders
            </button>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#F9FAFB', borderRadius: '1rem' }}>
              <ChefHat size={48} color="#9CA3AF" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>No Active Orders</h3>
              <p style={{ color: '#6B7280' }}>All current food orders have been fulfilled.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {orders.map(order => {
                const isConfirmed = order.status === 'confirmed';
                const isPreparing = order.status === 'preparing';
                const isReady = order.status === 'ready_for_pickup';
                const isOut = order.status === 'out_for_delivery';
                const isDelivered = order.status === 'delivered';

                return (
                  <div
                    key={order.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '1.25rem',
                      border: isConfirmed ? '2px solid #3B82F6' : isPreparing ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Ticket Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F3F4F6', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>
                          Ticket #{order.order_number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          Placed: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '999px', background: isConfirmed ? '#EFF6FF' : isPreparing ? '#FEF3C7' : '#ECFDF5', color: isConfirmed ? '#1D4ED8' : isPreparing ? '#B45309' : '#047857', textTransform: 'uppercase' }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Customer & Slot Tags */}
                    <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Slot: <b>{order.delivery_slot}</b></span>
                        <span style={{ color: order.exchange_steel_dabba ? '#059669' : '#64748B', fontWeight: 600 }}>
                          {order.exchange_steel_dabba ? '♻️ Steel Dabba Exchange' : '📦 Disposable'}
                        </span>
                      </div>
                      {order.delivery_instructions && (
                        <div style={{ marginTop: '0.35rem', fontStyle: 'italic', color: '#475569' }}>
                          Note: "{order.delivery_instructions}"
                        </div>
                      )}
                    </div>

                    {/* Detailed Items & Customization Specs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', flex: 1 }}>
                      {order.items?.map(item => (
                        <div key={item.id} style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '0.75rem', borderRadius: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#92400E' }}>
                              {item.quantity}x {item.meal_name_snapshot}
                            </span>
                            <span style={{ fontSize: '0.75rem', background: '#FDE68A', color: '#78350F', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                              {item.portion_snapshot}
                            </span>
                          </div>

                          {/* Primary Customization Choices */}
                          {item.customizations_snapshot && (
                            <div style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '0.4rem', lineHeight: '1.4' }}>
                              <div>• Base: <b>{item.customizations_snapshot.base || 'Standard'}</b></div>
                              <div>• Spice Level: <b>{item.customizations_snapshot.spice || 'Medium'}</b></div>
                              {item.customizations_snapshot.protein && <div>• Protein: <b>{item.customizations_snapshot.protein}</b></div>}
                              {item.customizations_snapshot.removed_ingredients?.length > 0 && (
                                <div style={{ color: '#DC2626', fontWeight: 700 }}>
                                  ⚠️ OMIT: {item.customizations_snapshot.removed_ingredients.join(', ')}
                                </div>
                              )}
                              {item.customizations_snapshot.special_notes && (
                                <div style={{ fontStyle: 'italic' }}>Note: {item.customizations_snapshot.special_notes}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Milestone State Updater Buttons */}
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      {isConfirmed && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                          style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem' }}
                        >
                          Start Cooking (Preparing)
                        </button>
                      )}

                      {isPreparing && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                          style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', background: '#059669' }}
                        >
                          Mark Ready for Pickup
                        </button>
                      )}

                      {isReady && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                          style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', background: '#D97706' }}
                        >
                          Hand Over to Rider
                        </button>
                      )}

                      {isOut && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem' }}
                        >
                          Confirm Delivered
                        </button>
                      )}

                      {isDelivered && (
                        <div style={{ width: '100%', textAlign: 'center', color: '#059669', fontWeight: 700, fontSize: '0.85rem', padding: '0.5rem' }}>
                          <CheckCircle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                          Order Complete
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BATCH DELIVERY MANIFEST */}
      {activeTab === 'manifest' && (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1.25rem', padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#111827' }}>
                  Daily Tiffin Batch Delivery Manifest
                </h2>
                <p style={{ color: '#6B7280', margin: 0, fontSize: '0.9rem' }}>
                  Grouped dispatch list for fixed-route deliveries & steel dabba collection.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-input"
                  value={manifestDate}
                  onChange={(e) => setManifestDate(e.target.value)}
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                />
                <select
                  className="form-input"
                  value={manifestSlot}
                  onChange={(e) => setManifestSlot(e.target.value)}
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  <option value="lunch">Lunch Batch (12:00 PM)</option>
                  <option value="dinner">Dinner Batch (7:30 PM)</option>
                </select>
                <button className="btn btn-primary" onClick={fetchManifest} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                  Load Manifest
                </button>
              </div>
            </div>

            {manifest?.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>TOTAL MEALS</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{manifest.summary.total_meals_scheduled}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>STEEL DABBAS TO COLLECT</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{manifest.summary.steel_dabbas_to_exchange}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>AREAS COVERED</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6366F1' }}>{manifest.summary.distinct_areas_count}</span>
                </div>
              </div>
            )}

            {/* Manifest Items Table */}
            {manifest?.manifest && manifest.manifest.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#4B5563', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Sub #</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Delivery Area</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Dabba Exchange</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Meal Assigned</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifest.manifest.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#111827' }}>
                          {item.subscription_number}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{item.customer_phone}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600 }}>{item.area}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{item.street_address}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {item.exchange_steel_dabba ? (
                            <span style={{ color: '#059669', fontWeight: 700 }}>♻️ Yes (Collect Dabba)</span>
                          ) : (
                            <span style={{ color: '#9CA3AF' }}>No</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>
                          {item.meal_name || 'Chef Rotational Tiffin'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#ECFDF5', color: '#059669', fontWeight: 700 }}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                No scheduled deliveries for this date and slot.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MENU CATALOG MANAGEMENT */}
      {activeTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#111827' }}>
              Kitchen Dishes & Availability ({meals.length})
            </h2>
            <button className="btn btn-primary" onClick={() => setShowAddMealModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add New Dish
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {meals.map(meal => (
              <div key={meal.id} style={{ background: '#FFFFFF', borderRadius: '1rem', border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '140px', position: 'relative' }}>
                  <ImageWithFallback src={meal.image_url} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: meal.is_available ? '#10B981' : '#EF4444', color: '#FFF', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {meal.is_available ? 'In Stock' : 'Sold Out'}
                  </div>
                </div>

                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#111827' }}>
                    {meal.name}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 1rem', flex: 1 }}>
                    {meal.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                      ₹{meal.base_price}
                    </span>

                    <button
                      className="btn btn-outline"
                      onClick={() => handleToggleMealAvailability(meal)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    >
                      {meal.is_available ? 'Mark Out of Stock' : 'Enable in Menu'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PERFORMANCE & OVERVIEW STATS */}
      {activeTab === 'overview' && overview && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>TOTAL EARNINGS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
                ₹{overview.stats.total_revenue_inr}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>ACTIVE SUBSCRIBERS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366F1', marginTop: '0.25rem' }}>
                {overview.stats.active_subscriptions_count}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>TODAY'S ORDERS</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', marginTop: '0.25rem' }}>
                {overview.stats.today_orders_count}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>TOTAL DELIVERIES</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
                {overview.stats.total_orders_count}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Dish Modal */}
      {showAddMealModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Add New Dish to Kitchen</h3>
              <button onClick={() => setShowAddMealModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateMeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Dish Name</label>
                <input type="text" className="form-input" required value={newMeal.name} onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })} placeholder="e.g. Kolhapuri Paneer Thali" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Base Price (₹)</label>
                  <input type="number" className="form-input" required value={newMeal.base_price} onChange={(e) => setNewMeal({ ...newMeal, base_price: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Cuisine</label>
                  <input type="text" className="form-input" value={newMeal.cuisine} onChange={(e) => setNewMeal({ ...newMeal, cuisine: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                <textarea className="form-input" rows={2} value={newMeal.description} onChange={(e) => setNewMeal({ ...newMeal, description: e.target.value })} placeholder="Fresh homestyle ingredients, slow cooked..." />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Save Dish to Menu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
