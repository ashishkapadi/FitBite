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
  Coffee,
  Sliders,
  Sun,
  Moon,
  Save,
  Store
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user, token, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Active operational sidebar tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'menu' | 'plans' | 'manifest' | 'earnings' | 'settings'

  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [meals, setMeals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [settings, setSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Modals
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

  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    plan_type: 'working_professional',
    description: '',
    base_price_per_meal: 160,
    plan_discount_percent: 15,
    supported_slots: ['lunch', 'dinner', 'both'],
    cycle_days: 28,
    max_skips_allowed: 2
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
        fetchPlans(),
        fetchManifest(),
        fetchEarnings(),
        fetchSettings()
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

  const fetchPlans = async () => {
    const res = await apiFetch('/api/seller/plans');
    if (res.ok) {
      const data = await safeJson(res);
      setPlans(Array.isArray(data) ? data : []);
    }
  };

  const fetchManifest = async () => {
    const res = await apiFetch(`/api/seller/batch-manifest?date=${manifestDate}&slot=${manifestSlot}`);
    if (res.ok) setManifest(await safeJson(res));
  };

  const fetchEarnings = async () => {
    const res = await apiFetch('/api/seller/earnings');
    if (res.ok) setEarnings(await safeJson(res));
  };

  const fetchSettings = async () => {
    const res = await apiFetch('/api/seller/settings');
    if (res.ok) setSettings(await safeJson(res));
  };

  // Status Milestone Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await apiFetch(`/api/seller/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
        fetchOverview();
      }
    } catch (err) {
      alert('Error updating order milestone.');
    }
  };

  // Toggle Meal Stock
  const handleToggleMealAvailability = async (meal) => {
    try {
      const res = await apiFetch(`/api/seller/meals/${meal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_available: !meal.is_available })
      });
      if (res.ok) fetchMeals();
    } catch (err) {
      alert('Error updating dish availability.');
    }
  };

  // Toggle Plan Active
  const handleTogglePlanActive = async (plan) => {
    try {
      const res = await apiFetch(`/api/seller/plans/${plan.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !plan.is_active })
      });
      if (res.ok) fetchPlans();
    } catch (err) {
      alert('Error updating subscription plan.');
    }
  };

  // Create New Meal
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

  // Create New Plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/seller/plans', {
        method: 'POST',
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        setShowAddPlanModal(false);
        fetchPlans();
        alert('New tiffin subscription plan created!');
      } else {
        const data = await safeJson(res);
        alert(data.error || 'Failed to create plan');
      }
    } catch (err) {
      alert('Error saving plan');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess('');
    try {
      const res = await apiFetch('/api/seller/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSettingsSuccess('Kitchen configuration successfully saved!');
        setTimeout(() => setSettingsSuccess(''), 4000);
        fetchOverview();
      } else {
        const data = await safeJson(res);
        alert(data.error || 'Failed to save settings.');
      }
    } catch (err) {
      alert('Error updating kitchen settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '5rem auto', textAlign: 'center' }}>
        <RefreshCw size={36} color="#EA580C" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Loading FitBite Partner Operations Desk...</h2>
      </div>
    );
  }

  const seller = overview?.seller || settings;
  const isApproved = seller?.verification_status === 'approved';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Orders & Tickets', icon: ShoppingBag, badge: orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length },
    { id: 'menu', label: 'Menu Catalog', icon: ChefHat, count: meals.length },
    { id: 'plans', label: 'Tiffin Plans', icon: Calendar, count: plans.length },
    { id: 'manifest', label: 'Delivery Schedule', icon: Truck },
    { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
    { id: 'settings', label: 'Kitchen Settings', icon: Sliders }
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', backgroundColor: '#F8FAFC', display: 'flex' }} className="seller-portal-layout">
      {/* 1. Operational Dark Slate Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid #1E293B'
      }}>
        {/* Kitchen Mini Profile */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Operating Kitchen
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {seller?.business_name || 'My Cloud Kitchen'}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: isApproved ? '#065F46' : '#78350F', color: isApproved ? '#34D399' : '#FDE68A' }}>
            {isApproved ? '● Live on Platform' : '⏳ Verification Underway'}
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#EA580C' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '999px' }}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && !item.badge && (
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div style={{ padding: '16px', borderTop: '1px solid #1E293B', fontSize: '0.75rem', color: '#64748B' }}>
          FSSAI: {seller?.fssai_number || '21523000000000'}
        </div>
      </aside>

      {/* 2. Main Work Area */}
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {/* Verification Status Banner for Pending/Rejected Sellers */}
        {!isApproved && (
          <div style={{
            background: seller?.verification_status === 'pending_approval' ? '#FFFBEB' : '#FEF2F2',
            border: `1.5px solid ${seller?.verification_status === 'pending_approval' ? '#FDE68A' : '#FECACA'}`,
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            color: seller?.verification_status === 'pending_approval' ? '#92400E' : '#991B1B'
          }}>
            <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '2px' }}>
                {seller?.verification_status === 'pending_approval'
                  ? 'Kitchen Verification Pending Standard Review'
                  : 'Kitchen Verification Incomplete / Rejected'}
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.45' }}>
                {seller?.verification_status === 'pending_approval'
                  ? 'Your FSSAI license and cloud kitchen setup are currently under review by the FitBite administration team. While pending, you have full access to configure your dishes, tiffin plans, and delivery cutoff schedules. Your listings will automatically go live once verified.'
                  : `Reason: ${seller?.rejection_reason || 'Please update your FSSAI registration and contact support.'}`}
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && overview && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  Kitchen Performance Overview
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                  Live metrics for {seller?.business_name || 'your cloud kitchen'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={fetchAllSellerData}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Refresh Terminal
              </button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>GROSS REVENUE</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
                  ₹{overview.stats.total_revenue_inr}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>From delivered customer orders</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>ACTIVE SUBSCRIBERS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366F1', marginTop: '6px' }}>
                  {overview.stats.active_subscriptions_count}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Enrolled in daily tiffin routine</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TODAY'S ORDERS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
                  {overview.stats.today_orders_count}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Placed in past 24 hours</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>LIVE TICKETS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EA580C', marginTop: '6px' }}>
                  {overview.stats.active_kitchen_tickets}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Preparing or ready for pickup</div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>Quick Kitchen Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowAddMealModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add New Dish
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddPlanModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Calendar size={16} /> Create Tiffin Plan
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('orders')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ShoppingBag size={16} /> View Orders
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('manifest')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Truck size={16} /> Delivery Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & TICKETS */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  Kitchen Orders &amp; Preparation Tickets
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                  Live incoming food orders with customizations and milestone status
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={fetchOrders}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <ShoppingBag size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>No Orders Received Yet</h3>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>New customer orders placed for this kitchen will appear here instantly.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                            Order #{order.order_number || order.id}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', backgroundColor: order.status === 'delivered' ? '#ECFDF5' : '#FEF3C7', color: order.status === 'delivered' ? '#065F46' : '#92400E' }}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                          Placed at: {new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                          ₹{order.grand_total}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Paid: {order.payment_method?.toUpperCase() || 'ONLINE'}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Dishes in Ticket:</div>
                      {order.items?.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #F1F5F9', fontSize: '0.9rem' }}>
                          <span><b>{item.quantity}x</b> {item.meal_name || item.name} ({item.portion_selected || 'Standard'})</span>
                          <span style={{ fontWeight: 600 }}>₹{item.total_price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Update Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Update Milestone:</span>
                      {order.status === 'confirmed' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}>
                          Mark Ready for Pickup
                        </button>
                      )}
                      {order.status === 'ready_for_pickup' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}>
                          Out for Delivery
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>
                          Mark Delivered
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>✓ Order Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MENU CATALOG */}
        {activeTab === 'menu' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  Kitchen Menu ({meals.length} Dishes)
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                  Manage dish availability, prices, and add new recipes
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddMealModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add New Dish
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {meals.map(meal => (
                <div key={meal.id} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '150px', position: 'relative' }}>
                    <ImageWithFallback src={meal.image_url} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: meal.is_available ? '#10B981' : '#EF4444', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {meal.is_available ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>

                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>
                      {meal.name}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px', flex: 1 }}>
                      {meal.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                        ₹{meal.base_price}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleToggleMealAvailability(meal)}
                        style={{ fontSize: '0.8rem' }}
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

        {/* TAB 4: TIFFIN PLANS */}
        {activeTab === 'plans' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  Tiffin Subscription Plans ({plans.length})
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                  Recurring monthly plans offered by your kitchen to students &amp; professionals
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddPlanModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Create Tiffin Plan
              </button>
            </div>

            {plans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <Calendar size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>No Tiffin Plans Yet</h3>
                <p style={{ color: '#64748B', margin: '0 0 16px', fontSize: '0.9rem' }}>Create recurring Student or Working Professional plans to receive steady subscription orders.</p>
                <button className="btn btn-primary" onClick={() => setShowAddPlanModal(true)}>
                  Create First Plan
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {plans.map(p => (
                  <div key={p.id} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: p.plan_type === 'student' ? '#6366F1' : '#059669', background: p.plan_type === 'student' ? '#EEF2FF' : '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
                        {p.plan_type === 'student' ? 'Student Routine' : 'Working Professional'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.is_active ? '#059669' : '#DC2626' }}>
                        {p.is_active ? '● Active' : '○ Paused'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                      {p.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 12px', flex: 1 }}>
                      {p.description}
                    </p>

                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748B' }}>Base Price / Meal:</span>
                        <span style={{ fontWeight: 700 }}>₹{p.base_price_per_meal}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748B' }}>Subscriber Discount:</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>{p.plan_discount_percent}% OFF</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Cycle Duration:</span>
                        <span style={{ fontWeight: 600 }}>{p.cycle_days} days</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        Slots: {Array.isArray(p.supported_slots) ? p.supported_slots.join(', ') : 'Lunch, Dinner'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleTogglePlanActive(p)}
                      >
                        {p.is_active ? 'Pause Plan' : 'Activate Plan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DELIVERY SCHEDULE (BATCH MANIFEST) */}
        {activeTab === 'manifest' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  Delivery Manifest Schedule
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                  Scheduled subscription deliveries grouped by delivery zone &amp; morning/evening slot
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-input"
                  value={manifestDate}
                  onChange={(e) => { setManifestDate(e.target.value); setTimeout(fetchManifest, 50); }}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                />
                <select
                  className="form-input"
                  value={manifestSlot}
                  onChange={(e) => { setManifestSlot(e.target.value); setTimeout(fetchManifest, 50); }}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                >
                  <option value="lunch">Lunch Delivery</option>
                  <option value="dinner">Dinner Delivery</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={fetchManifest}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {manifest && Object.keys(manifest.grouped_by_area || {}).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(manifest.grouped_by_area).map(([area, items]) => (
                  <div key={area} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} color="#EA580C" />
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          {area} Delivery Zone ({items.length} dabbas)
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>
                        Slot: {manifest.slot.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {items.map((del, idx) => (
                        <div key={idx} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                              {del.customer_name} ({del.subscription_number})
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                              {del.street_address}, {del.pincode}
                            </div>
                            {del.exchange_steel_dabba && (
                              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                                ♻️ Exchange Empty Stainless Steel Dabba
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: '#EA580C', fontSize: '0.85rem' }}>
                              {del.meal_name}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              Status: {del.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <Truck size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>No Deliveries Scheduled</h3>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                  There are no subscription deliveries scheduled for {manifestDate} ({manifestSlot}).
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: EARNINGS & PAYOUTS */}
        {activeTab === 'earnings' && earnings && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                Earnings &amp; Payouts
              </h1>
              <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                Settlement breakdown of completed single meal orders and subscription disbursements
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>GROSS SALES</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                  ₹{earnings.summary.gross_revenue}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Combined orders &amp; plans</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>PLATFORM COMMISSION</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444', marginTop: '6px' }}>
                  {earnings.summary.platform_fee_percent}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Technology &amp; dispatch fee</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>NET PAYABLE</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '6px' }}>
                  ₹{earnings.summary.net_payout}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Direct bank disbursement</div>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>Recent Settled Orders</h3>
              {earnings.recent_orders?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {earnings.recent_orders.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.9rem' }}>
                      <span>Order #{o.order_number || o.id} ({new Date(o.created_at).toLocaleDateString()})</span>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>+₹{o.grand_total}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#64748B', fontSize: '0.9rem' }}>No settled orders in this billing cycle yet.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: KITCHEN SETTINGS */}
        {activeTab === 'settings' && settings && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                Kitchen Settings &amp; Cutoff Policy
              </h1>
              <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                Operating address, meal preparation cutoffs (Asia/Kolkata), and FSSAI information
              </p>
            </div>

            {settingsSuccess && (
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600 }}>
                ✓ {settingsSuccess}
              </div>
            )}

            <form onSubmit={handleSaveSettings} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px', maxWidth: '720px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Kitchen Business Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.business_name || ''}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Operating Area / Locality</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.area || ''}
                    onChange={(e) => setSettings({ ...settings, area: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Operating Hours</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.operating_hours || ''}
                    onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Operating Kitchen Address</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={settings.operating_address || ''}
                  onChange={(e) => setSettings({ ...settings, operating_address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    <Sun size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Lunch Cutoff Time (IST)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.preparation_cutoff_lunch_time || '08:30:00'}
                    onChange={(e) => setSettings({ ...settings, preparation_cutoff_lunch_time: e.target.value })}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Time before which customer can modify/skip lunch</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    <Moon size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Dinner Cutoff Time (IST)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.preparation_cutoff_dinner_time || '16:00:00'}
                    onChange={(e) => setSettings({ ...settings, preparation_cutoff_dinner_time: e.target.value })}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Time before which customer can modify/skip dinner</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>FSSAI 14-Digit Registration Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.fssai_number || ''}
                  onChange={(e) => setSettings({ ...settings, fssai_number: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={settingsSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
              >
                <Save size={16} /> {settingsSaving ? 'Saving...' : 'Save Kitchen Settings'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Add New Dish Modal */}
      {showAddMealModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
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

      {/* Add New Plan Modal */}
      {showAddPlanModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Create Tiffin Subscription Plan</h3>
              <button onClick={() => setShowAddPlanModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Plan Name</label>
                <input type="text" className="form-input" required value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="e.g. Dakshin Corporate Lunch" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Plan Type</label>
                  <select className="form-input" value={newPlan.plan_type} onChange={(e) => setNewPlan({ ...newPlan, plan_type: e.target.value, cycle_days: e.target.value === 'student' ? 30 : 28 })}>
                    <option value="working_professional">Working Professional (28 Consecutive Days)</option>
                    <option value="student">Student (Weekdays Only)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Base Price / Meal (₹)</label>
                  <input type="number" className="form-input" required value={newPlan.base_price_per_meal} onChange={(e) => setNewPlan({ ...newPlan, base_price_per_meal: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Discount (%)</label>
                  <input type="number" className="form-input" required value={newPlan.plan_discount_percent} onChange={(e) => setNewPlan({ ...newPlan, plan_discount_percent: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Max Skips Allowed</label>
                  <input type="number" className="form-input" required value={newPlan.max_skips_allowed} onChange={(e) => setNewPlan({ ...newPlan, max_skips_allowed: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                <textarea className="form-input" rows={2} value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} placeholder="Daily rotating homestyle tiffin..." />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Create Tiffin Plan
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .seller-portal-layout { flex-direction: column !important; }
          .seller-portal-layout aside { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
