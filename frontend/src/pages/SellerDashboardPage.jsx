import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import { apiFetch, safeJson } from '../config/api';
import { FALLBACK_SELLER_DASHBOARD } from '../utils/demoCatalogFallback';
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
  Store,
  Edit2,
  Loader2,
  UserRound,
  Trash2,
  Archive,
  RotateCcw,
  Info
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user, token, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();

  // Active operational sidebar tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'menu' | 'plans' | 'manifest' | 'earnings' | 'settings'

  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [meals, setMeals] = useState([]);
  const [archivedMeals, setArchivedMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customizationOptions, setCustomizationOptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activeSubscribers, setActiveSubscribers] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [earningsError, setEarningsError] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Menu sub-tab: 'active' | 'archived'
  const [menuSubTab, setMenuSubTab] = useState('active');

  // Edit Meal State
  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [isEditDirty, setIsEditDirty] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete / Archive Meal State
  const [showDeleteMealModal, setShowDeleteMealModal] = useState(false);
  const [deletingMeal, setDeletingMeal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteDependencyInfo, setDeleteDependencyInfo] = useState(null);

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

  // Currency Formatter - ensures accurate display starting at ₹0.00
  const formatCurrency = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    fetchAllSellerData();
  }, [user]);

  const fetchAllSellerData = async () => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchOverview(),
        fetchOrders(),
        fetchMeals(),
        fetchArchivedMeals(),
        fetchCategories(),
        fetchCustomizationOptions(),
        fetchPlans(),
        fetchActiveSubscribers(),
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
    const res = await apiFetch('/api/seller/meals?status=active');
    if (res.ok) {
      const data = await safeJson(res);
      setMeals(Array.isArray(data) ? data : []);
    }
  };

  const fetchArchivedMeals = async () => {
    const res = await apiFetch('/api/seller/meals?status=archived');
    if (res.ok) {
      const data = await safeJson(res);
      setArchivedMeals(Array.isArray(data) ? data : []);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch('/api/catalog/categories');
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) setCategories(data);
      }
    } catch (e) {
      console.warn('Could not load categories:', e);
    }
  };

  const fetchCustomizationOptions = async () => {
    try {
      const res = await apiFetch('/api/seller/customization-options');
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) setCustomizationOptions(data);
      }
    } catch (e) {
      console.warn('Could not load customization options:', e);
    }
  };

  const fetchPlans = async () => {
    const res = await apiFetch('/api/seller/plans');
    if (res.ok) {
      const data = await safeJson(res);
      setPlans(Array.isArray(data) ? data : []);
    }
  };

  const fetchActiveSubscribers = async () => {
    const res = await apiFetch('/api/seller/subscriptions');
    if (res.ok) {
      const data = await safeJson(res);
      setActiveSubscribers(Array.isArray(data) ? data : []);
    }
  };

  const fetchManifest = async () => {
    const res = await apiFetch(`/api/seller/batch-manifest?date=${manifestDate}&slot=${manifestSlot}`);
    if (res.ok) setManifest(await safeJson(res));
  };

  const fetchEarnings = async () => {
    setEarningsLoading(true);
    setEarningsError(null);
    try {
      const res = await apiFetch('/api/seller/earnings');
      if (res.ok) {
        const data = await safeJson(res);
        setEarnings(data);
      } else {
        const errData = await safeJson(res);
        setEarningsError(errData.error || 'Failed to retrieve authenticated earnings record.');
      }
    } catch (err) {
      setEarningsError('Network error connecting to payment records. Please retry.');
    } finally {
      setEarningsLoading(false);
    }
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
        fetchEarnings();
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

  // Open Edit Dish Modal with prefilled values including customization options
  const handleOpenEditMeal = (meal) => {
    setEditingMeal({
      id: meal.id,
      name: meal.name,
      category_id: meal.category_id || 'cat_north_indian',
      cuisine: meal.cuisine || 'North Indian',
      base_price: meal.base_price,
      description: meal.description || '',
      portion_choices: Array.isArray(meal.portion_choices) ? meal.portion_choices.join(', ') : (typeof meal.portion_choices === 'string' ? meal.portion_choices : 'Standard Portion'),
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients.join(', ') : '',
      allergens: Array.isArray(meal.allergens) ? meal.allergens.join(', ') : '',
      dietary_tags: Array.isArray(meal.dietary_tags) ? meal.dietary_tags.join(', ') : 'Vegetarian',
      prep_time_minutes: meal.prep_time_minutes || 25,
      calories: meal.calories ?? '',
      protein_grams: meal.protein_grams ?? '',
      carbs_grams: meal.carbs_grams ?? '',
      fat_grams: meal.fat_grams ?? '',
      image_url: meal.image_url || '',
      is_available: Boolean(meal.is_available),
      is_tiffin_eligible: Boolean(meal.is_tiffin_eligible),
      customization_option_ids: Array.isArray(meal.customization_option_ids) ? [...meal.customization_option_ids] : [],
      updated_at: meal.updated_at
    });
    setIsEditDirty(false);
    setEditError('');
    setShowEditMealModal(true);
  };

  // Toggle single customization option in editingMeal
  const handleToggleCustomizationOption = (optId) => {
    if (!editingMeal) return;
    const current = editingMeal.customization_option_ids || [];
    const updated = current.includes(optId)
      ? current.filter(id => id !== optId)
      : [...current, optId];
    setEditingMeal({ ...editingMeal, customization_option_ids: updated });
    setIsEditDirty(true);
  };

  // Close Edit Dish Modal with unsaved changes verification
  const handleCloseEditMeal = () => {
    if (isEditDirty) {
      if (!window.confirm('You have unsaved changes in this dish. Discard changes without saving?')) {
        return;
      }
    }
    setShowEditMealModal(false);
    setEditingMeal(null);
    setIsEditDirty(false);
    setEditError('');
  };

  // Save Dish Changes
  const handleSaveEditMeal = async (e) => {
    e.preventDefault();
    if (!editingMeal) return;

    if (!editingMeal.name || !editingMeal.name.trim()) {
      setEditError('Dish name is required.');
      return;
    }
    const priceNum = parseFloat(editingMeal.base_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setEditError('Base price must be a valid positive amount in ₹.');
      return;
    }
    const prepNum = parseInt(editingMeal.prep_time_minutes, 10);
    if (isNaN(prepNum) || prepNum < 5) {
      setEditError('Preparation time must be at least 5 minutes.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const payload = {
        name: editingMeal.name.trim(),
        description: editingMeal.description.trim(),
        category_id: editingMeal.category_id,
        cuisine: editingMeal.cuisine.trim(),
        base_price: priceNum,
        portion_choices: typeof editingMeal.portion_choices === 'string'
          ? editingMeal.portion_choices.split(',').map(s => s.trim()).filter(Boolean)
          : editingMeal.portion_choices,
        ingredients: typeof editingMeal.ingredients === 'string'
          ? editingMeal.ingredients.split(',').map(s => s.trim()).filter(Boolean)
          : editingMeal.ingredients,
        allergens: typeof editingMeal.allergens === 'string'
          ? editingMeal.allergens.split(',').map(s => s.trim()).filter(Boolean)
          : editingMeal.allergens,
        dietary_tags: typeof editingMeal.dietary_tags === 'string'
          ? editingMeal.dietary_tags.split(',').map(s => s.trim()).filter(Boolean)
          : editingMeal.dietary_tags,
        prep_time_minutes: prepNum,
        calories: editingMeal.calories ? parseInt(editingMeal.calories, 10) : null,
        protein_grams: editingMeal.protein_grams ? parseFloat(editingMeal.protein_grams) : null,
        carbs_grams: editingMeal.carbs_grams ? parseFloat(editingMeal.carbs_grams) : null,
        fat_grams: editingMeal.fat_grams ? parseFloat(editingMeal.fat_grams) : null,
        image_url: editingMeal.image_url ? editingMeal.image_url.trim() : null,
        is_available: Boolean(editingMeal.is_available),
        is_tiffin_eligible: Boolean(editingMeal.is_tiffin_eligible),
        customization_option_ids: editingMeal.customization_option_ids || [],
        client_last_updated: editingMeal.updated_at
      };

      const res = await apiFetch(`/api/seller/meals/${editingMeal.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update meal.');
      }

      setMeals(prev => prev.map(m => m.id === editingMeal.id ? data.meal : m));
      setShowEditMealModal(false);
      setEditingMeal(null);
      setIsEditDirty(false);
      alert(`"${data.meal.name}" saved successfully to your kitchen menu!`);
    } catch (err) {
      setEditError(err.message || 'Error updating meal');
    } finally {
      setEditSaving(false);
    }
  };

  // Open Delete / Archive Confirmation Modal
  const handleOpenDeleteMeal = (meal) => {
    setDeletingMeal(meal);
    setDeleteError('');
    setDeleteDependencyInfo(null);
    setShowDeleteMealModal(true);
  };

  // Close Delete Confirmation Modal
  const handleCloseDeleteMeal = () => {
    if (isDeleting) return;
    setShowDeleteMealModal(false);
    setDeletingMeal(null);
    setDeleteError('');
    setDeleteDependencyInfo(null);
  };

  // Confirm Soft-Delete / Archive Meal
  const handleConfirmDeleteMeal = async () => {
    if (!deletingMeal || isDeleting) return;
    setIsDeleting(true);
    setDeleteError('');
    setDeleteDependencyInfo(null);

    try {
      const res = await apiFetch(`/api/seller/meals/${deletingMeal.id}`, {
        method: 'DELETE'
      });
      const data = await safeJson(res);

      if (res.status === 409 || data.blocked) {
        // Dependency conflict found: meal is needed by upcoming tiffin deliveries or active subscriptions
        setDeleteDependencyInfo(data);
        setDeleteError(data.error || data.explanation || 'Meal is required by active subscription deliveries.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to archive meal from menu.');
      }

      // Soft delete succeeded
      setShowDeleteMealModal(false);
      setDeletingMeal(null);
      await Promise.all([fetchMeals(), fetchArchivedMeals()]);
      alert(`"${data.meal?.name || 'Dish'}" was archived. It has been removed from new customer purchases.`);
    } catch (err) {
      setDeleteError(err.message || 'An unexpected error occurred while deleting meal.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Restore Archived Meal
  const handleRestoreMeal = async (meal) => {
    try {
      const res = await apiFetch(`/api/seller/meals/${meal.id}/restore`, {
        method: 'PUT'
      });
      const data = await safeJson(res);
      if (!res.ok) {
        alert(data.error || 'Failed to restore meal to active menu.');
        return;
      }
      await Promise.all([fetchMeals(), fetchArchivedMeals()]);
      alert(`"${data.meal?.name || 'Dish'}" has been restored to your active kitchen menu and customer catalog.`);
    } catch (err) {
      alert('Error restoring meal to active menu.');
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

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '2.5rem', background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: '#FFFFFF'
        }}>
          <Store size={28} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
          Kitchen Partner Sign In Required
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Please sign in with your registered Kitchen Partner account to manage dishes, active orders, and batch dispatches.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openAuthModal({ mode: 'signin', accountType: 'seller' })}
            style={{
              padding: '12px',
              fontWeight: 700,
              backgroundColor: '#EA580C',
              borderColor: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Store size={18} />
            <span>Sign In as Kitchen Partner</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/')}
            style={{ padding: '10px', fontWeight: 600 }}
          >
            Return to Customer Storefront
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'seller' && user.role !== 'admin') {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '2.5rem', background: '#FFFFFF', borderRadius: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: '#FFF7ED',
          color: '#EA580C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <AlertCircle size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
          Kitchen Partner Access Only
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.92rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          You are currently signed in as <b>{user.email}</b> (Role: <b>{user.role}</b>). Access to the Kitchen Operations portal is restricted to registered Kitchen Partners.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={async () => {
              await logout();
              openAuthModal({ mode: 'signin', accountType: 'seller' });
            }}
            style={{ padding: '10px', fontWeight: 600 }}
          >
            Sign Out and Switch to Partner Account
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ padding: '10px', fontWeight: 600 }}
          >
            Return to Customer Storefront
          </button>
        </div>
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
                  {formatCurrency(0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>From delivered customer orders</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>ACTIVE SUBSCRIBERS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366F1', marginTop: '6px' }}>
                  {overview?.stats?.active_subscriptions_count ?? overview?.active_subscriptions_count ?? 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Enrolled in daily tiffin routine</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TODAY'S ORDERS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
                  {overview?.stats?.today_orders_count ?? overview?.today_orders_count ?? 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Placed in past 24 hours</div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>LIVE TICKETS</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EA580C', marginTop: '6px' }}>
                  {overview?.stats?.active_kitchen_tickets ?? overview?.pending_orders_count ?? 0}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  Kitchen Menu Management
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                  Manage dishes, price and portions, custom add-ons, and menu availability
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => { fetchMeals(); fetchArchivedMeals(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} /> Refresh Menu
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddMealModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add New Dish
                </button>
              </div>
            </div>

            {/* Menu Sub-tabs: Active Dishes vs Archived Dishes */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setMenuSubTab('active')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: menuSubTab === 'active' ? '#EA580C' : '#64748B',
                  borderBottom: menuSubTab === 'active' ? '3px solid #EA580C' : '3px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Active Dishes</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: menuSubTab === 'active' ? '#FFEDD5' : '#F1F5F9', color: menuSubTab === 'active' ? '#C2410C' : '#64748B' }}>
                  {meals.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMenuSubTab('archived')}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: menuSubTab === 'archived' ? '#EA580C' : '#64748B',
                  borderBottom: menuSubTab === 'archived' ? '3px solid #EA580C' : '3px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Archive size={16} />
                  <span>Archived Dishes</span>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: menuSubTab === 'archived' ? '#FFEDD5' : '#F1F5F9', color: menuSubTab === 'archived' ? '#C2410C' : '#64748B' }}>
                  {archivedMeals.length}
                </span>
              </button>
            </div>

            {/* Active Sub-tab Content */}
            {menuSubTab === 'active' && (
              meals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <ChefHat size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>No Active Dishes in Menu</h3>
                  <p style={{ color: '#64748B', margin: '0 0 16px', fontSize: '0.9rem' }}>Add your kitchen dishes to begin receiving individual and tiffin subscription orders.</p>
                  <button className="btn btn-primary" onClick={() => setShowAddMealModal(true)}>
                    <Plus size={16} style={{ marginRight: '6px' }} /> Add First Dish
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {meals.map(meal => (
                    <div key={meal.id} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '150px', position: 'relative' }}>
                        <ImageWithFallback src={meal.image_url} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: meal.is_available ? '#10B981' : '#EF4444', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {meal.is_available ? 'In Stock' : 'Out of Stock'}
                        </div>
                        {meal.is_tiffin_eligible && (
                          <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.85)', color: '#FDBA74', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                            🍱 Tiffin Eligible
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                            {meal.name}
                          </h4>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px' }}>
                          ID: <code>{meal.id}</code> • {meal.cuisine || 'Homestyle'}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {meal.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                            {formatCurrency(meal.base_price)}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenEditMeal(meal)}
                              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: '#CBD5E1', color: '#1E293B' }}
                              title="Edit meal details"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenDeleteMeal(meal)}
                              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: '#FCA5A5', color: '#DC2626' }}
                              title="Archive/Delete dish from menu"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleToggleMealAvailability(meal)}
                              style={{ fontSize: '0.78rem' }}
                              title={meal.is_available ? 'Mark temporarily unavailable' : 'Make available for orders'}
                            >
                              {meal.is_available ? 'Out of Stock' : 'In Stock'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Archived Sub-tab Content */}
            {menuSubTab === 'archived' && (
              archivedMeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <Archive size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>No Archived Dishes</h3>
                  <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
                    When you remove a dish from your active menu, it is preserved here safely. Past customer orders and historical pricing will never be damaged.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {archivedMeals.map(meal => (
                    <div key={meal.id} style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: 0.9 }}>
                      <div style={{ height: '140px', position: 'relative', filter: 'grayscale(40%)' }}>
                        <ImageWithFallback src={meal.image_url} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#475569', color: '#FFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                          Archived
                        </div>
                      </div>

                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>
                          {meal.name}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '8px' }}>
                          Archived on: {meal.archived_at ? new Date(meal.archived_at).toLocaleDateString('en-IN') : 'Recent'}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px', flex: 1 }}>
                          {meal.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>
                            {formatCurrency(meal.base_price)}
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRestoreMeal(meal)}
                            style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#10B981', color: '#059669', fontWeight: 700 }}
                          >
                            <RotateCcw size={14} /> Restore to Menu
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
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

            <section style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                    Active Subscribers ({activeSubscribers.length})
                  </h2>
                  <p style={{ color: '#64748B', margin: 0, fontSize: '0.85rem' }}>
                    Customer contact and delivery details, with the plan each customer selected.
                  </p>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={fetchActiveSubscribers} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> Refresh subscribers
                </button>
              </div>

              {activeSubscribers.length === 0 ? (
                <div style={{ padding: '24px', borderRadius: '10px', background: '#F8FAFC', color: '#64748B', fontSize: '0.9rem', textAlign: 'center' }}>
                  No active subscribers yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
                  {activeSubscribers.map(subscription => {
                    const address = subscription.delivery_address;
                    const customer = subscription.customer;
                    return (
                      <article key={subscription.id} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', background: '#F8FAFC' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', gap: '9px', minWidth: 0 }}>
                            <UserRound size={18} color="#4F46E5" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 800, color: '#0F172A' }}>{customer?.full_name || 'Customer'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>{subscription.subscription_number || subscription.id}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '3px 7px', borderRadius: '999px' }}>ACTIVE</span>
                        </div>
                        <div style={{ display: 'grid', gap: '7px', fontSize: '0.84rem', color: '#334155' }}>
                          <div><strong>Plan:</strong> {subscription.plan?.name || 'Plan unavailable'}{subscription.plan?.plan_type ? ` (${subscription.plan.plan_type.replaceAll('_', ' ')})` : ''}</div>
                          <div><strong>Meal slot:</strong> {subscription.slot || 'Not specified'}</div>
                          <div><strong>Phone:</strong> {customer?.phone || address?.phone || 'Not provided'}</div>
                          <div><strong>Email:</strong> {customer?.email || 'Not provided'}</div>
                          <div><strong>Delivery address:</strong> {address ? [address.street_address, address.landmark, address.area, address.city, address.pincode].filter(Boolean).join(', ') : 'Not provided'}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

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
                        Slot: {(manifest?.slot || 'lunch').toUpperCase()}
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
        {activeTab === 'earnings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                  Earnings &amp; Payouts
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.92rem' }}>
                  Settlement breakdown of completed food orders and subscription disbursements
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={fetchEarnings}
                disabled={earningsLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={earningsLoading ? 'spin' : ''} /> Refresh Statement
              </button>
            </div>

            {/* Error / Retry State if financial data cannot load */}
            {earningsError && (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
                <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ color: '#991B1B', fontWeight: 800, fontSize: '1.15rem', marginBottom: '6px' }}>
                  Financial Statement Unavailable
                </h3>
                <p style={{ color: '#7F1D1D', fontSize: '0.9rem', marginBottom: '16px' }}>
                  {earningsError}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={fetchEarnings}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} /> Retry Loading Financials
                </button>
              </div>
            )}

            {/* Loading State */}
            {earningsLoading && !earnings && (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <Loader2 size={32} color="#EA580C" className="spin" style={{ margin: '0 auto 10px' }} />
                <p style={{ color: '#64748B', fontWeight: 600 }}>Calculating authenticated seller statement...</p>
              </div>
            )}

            {/* Financial Cards (Accurate Server-side calculations starting at ₹0.00) */}
            {earnings && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>GROSS SALES</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                      {formatCurrency(earnings?.summary?.gross_revenue ?? 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Delivered orders &amp; active subscriptions</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>TODAY'S EARNINGS</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                      {formatCurrency(earnings?.summary?.today_earnings ?? 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Net settled past 24 hours</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>AVAILABLE BALANCE</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', marginTop: '6px' }}>
                      {formatCurrency(earnings?.summary?.available_balance ?? 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Cleared for instant bank transfer</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>PENDING PAYOUTS</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '6px' }}>
                      {formatCurrency(earnings?.summary?.pending_payouts ?? 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Processing in current cycle</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginBottom: '28px' }}>
                  <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>PLATFORM COMMISSION</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>
                      {earnings?.summary?.platform_fee_percent ?? 10}% ({formatCurrency(earnings?.summary?.platform_fee_amount ?? 0)})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Technology &amp; dispatch service fee</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>REFUNDS &amp; CHARGEBACKS</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#64748B', marginTop: '4px' }}>
                      {formatCurrency(earnings?.summary?.refunds_amount ?? 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Customer returns / cancellations</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '14px', border: '2px solid #10B981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase' }}>NET PAYABLE TO SELLER</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                      {formatCurrency(earnings?.summary?.net_payout ?? 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '4px' }}>Gross sales minus platform fee</div>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>Recent Settled Orders</h3>
                  {earnings.recent_orders?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {earnings.recent_orders.map(o => (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.9rem' }}>
                          <span>Order #{o.order_number || o.id} ({new Date(o.created_at).toLocaleDateString()})</span>
                          <span style={{ fontWeight: 700, color: '#10B981' }}>+{formatCurrency(o.grand_total)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#64748B', fontSize: '0.9rem', padding: '12px 0' }}>No qualifying settled orders for this seller yet. Newly registered kitchens start at {formatCurrency(0)}.</div>
                  )}
                </div>
              </>
            )}
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

      {/* Edit Dish Modal */}
      {showEditMealModal && editingMeal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-dialog" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 2px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit2 size={18} color="#0D9488" /> Edit Dish: {editingMeal.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Meal ID: <code>{editingMeal.id}</code> (Preserves order history &amp; tiffin references)
                </span>
              </div>
              <button 
                type="button" 
                onClick={handleCloseEditMeal} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditMeal} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editError && (
                <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                  Dish Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editingMeal.name}
                  onChange={(e) => {
                    setEditingMeal({ ...editingMeal, name: e.target.value });
                    setIsEditDirty(true);
                  }}
                  placeholder="e.g. Kolhapuri Paneer Thali"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    required
                    value={editingMeal.base_price}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, base_price: e.target.value });
                      setIsEditDirty(true);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingMeal.prep_time_minutes}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, prep_time_minutes: e.target.value });
                      setIsEditDirty(true);
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                    Cuisine
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingMeal.cuisine}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, cuisine: e.target.value });
                      setIsEditDirty(true);
                    }}
                    placeholder="e.g. North Indian, South Indian"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                    Category
                  </label>
                  <select
                    className="form-input"
                    value={editingMeal.category_id}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, category_id: e.target.value });
                      setIsEditDirty(true);
                    }}
                  >
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="cat_north_indian">North Indian</option>
                        <option value="cat_south_indian">South Indian</option>
                        <option value="cat_healthy_bowls">Healthy Bowls</option>
                        <option value="cat_high_protein">High Protein</option>
                        <option value="cat_tiffin_combos">Tiffin Combos</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                  Image URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  value={editingMeal.image_url}
                  onChange={(e) => {
                    setEditingMeal({ ...editingMeal, image_url: e.target.value });
                    setIsEditDirty(true);
                  }}
                  placeholder="https://..."
                />
                {editingMeal.image_url && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ width: '60px', height: '48px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                      <ImageWithFallback src={editingMeal.image_url} alt="Dish Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Live image preview for customer storefront</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                  Description
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={editingMeal.description}
                  onChange={(e) => {
                    setEditingMeal({ ...editingMeal, description: e.target.value });
                    setIsEditDirty(true);
                  }}
                  placeholder="Fresh homestyle ingredients, slow cooked..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                  Portion Choices (comma-separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingMeal.portion_choices}
                  onChange={(e) => {
                    setEditingMeal({ ...editingMeal, portion_choices: e.target.value });
                    setIsEditDirty(true);
                  }}
                  placeholder="Standard Portion, Mini Thali, Large Thali"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                    Dietary Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingMeal.dietary_tags}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, dietary_tags: e.target.value });
                      setIsEditDirty(true);
                    }}
                    placeholder="Vegetarian, High-Protein, Jain"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                    Allergens (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingMeal.allergens}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, allergens: e.target.value });
                      setIsEditDirty(true);
                    }}
                    placeholder="Dairy, Gluten, Nuts"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1E293B' }}>
                  Key Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingMeal.ingredients}
                  onChange={(e) => {
                    setEditingMeal({ ...editingMeal, ingredients: e.target.value });
                    setIsEditDirty(true);
                  }}
                  placeholder="Paneer, Tomatoes, Fresh Herbs, Spices"
                />
              </div>

              {/* Supported Customization Options */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                    Supported Customization Options (Build Your Own / Add-ons)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {(editingMeal.customization_option_ids || []).length} selected
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#64748B' }}>
                  Select which meal customization options customers may configure when ordering this dish.
                </p>

                {customizationOptions.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                    {customizationOptions.map(opt => {
                      const isChecked = (editingMeal.customization_option_ids || []).includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            background: isChecked ? '#EFF6FF' : '#FFFFFF',
                            border: isChecked ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCustomizationOption(opt.id)}
                            style={{ accentColor: '#2563EB' }}
                          />
                          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{opt.name || opt.item_choice}</span>
                            <span style={{ color: '#64748B', fontSize: '0.72rem', marginLeft: '4px' }}>
                              ({opt.group_type})
                            </span>
                          </div>
                          {Number(opt.price_delta) > 0 && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>
                              +{formatCurrency(opt.price_delta)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                    Loading kitchen customization presets...
                  </div>
                )}
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  Nutrition Facts (optional)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Calories</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                      value={editingMeal.calories}
                      onChange={(e) => {
                        setEditingMeal({ ...editingMeal, calories: e.target.value });
                        setIsEditDirty(true);
                      }}
                      placeholder="kcal"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                      value={editingMeal.protein_grams}
                      onChange={(e) => {
                        setEditingMeal({ ...editingMeal, protein_grams: e.target.value });
                        setIsEditDirty(true);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                      value={editingMeal.carbs_grams}
                      onChange={(e) => {
                        setEditingMeal({ ...editingMeal, carbs_grams: e.target.value });
                        setIsEditDirty(true);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748B' }}>Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                      value={editingMeal.fat_grams}
                      onChange={(e) => {
                        setEditingMeal({ ...editingMeal, fat_grams: e.target.value });
                        setIsEditDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingMeal.is_available}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, is_available: e.target.checked });
                      setIsEditDirty(true);
                    }}
                  />
                  <span>In Stock (Available for ordering)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingMeal.is_tiffin_eligible}
                    onChange={(e) => {
                      setEditingMeal({ ...editingMeal, is_tiffin_eligible: e.target.checked });
                      setIsEditDirty(true);
                    }}
                  />
                  <span>Tiffin Eligible</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseEditMeal}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {editSaving ? (
                    <>
                      <Loader2 size={16} className="spin" /> Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {showDeleteMealModal && deletingMeal && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="modal-dialog" style={{ maxWidth: '520px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={20} color="#DC2626" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px', color: '#0F172A' }}>
                  Remove this meal from your menu?
                </h3>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.88rem' }}>
                  It will no longer be available for new orders.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteMeal}
                disabled={isDeleting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                title="Cancel"
              >
                <X size={20} />
              </button>
            </div>

            {/* Meal summary snapshot card */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
              <div style={{ width: '64px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <ImageWithFallback src={deletingMeal.image_url} alt={deletingMeal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deletingMeal.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {formatCurrency(deletingMeal.base_price)} • {deletingMeal.cuisine || 'Homestyle'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Meal ID: <code>{deletingMeal.id}</code>
                </div>
              </div>
            </div>

            {/* Dependency Conflict Display (HTTP 409 from server) */}
            {deleteDependencyInfo && (
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '10px', padding: '14px', marginBottom: '1.25rem', color: '#991B1B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.92rem', marginBottom: '6px' }}>
                  <AlertCircle size={18} color="#DC2626" />
                  <span>Removal Blocked: Active Tiffin Dependencies Found</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {deleteDependencyInfo.explanation || 'This meal is currently assigned to upcoming subscription deliveries.'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '0.78rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>Active Subs</div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#DC2626' }}>{deleteDependencyInfo.active_subscriptions_count ?? 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>Upcoming Deliveries</div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#DC2626' }}>{deleteDependencyInfo.upcoming_deliveries_count ?? 0}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>Next Scheduled</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#DC2626', marginTop: '2px' }}>{deleteDependencyInfo.next_delivery_date || 'Today'}</div>
                  </div>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#7F1D1D' }}>
                  👉 <b>Action required:</b> Please reassign a valid replacement dish in your daily tiffin schedule or resolve active deliveries before archiving this meal.
                </p>
              </div>
            )}

            {/* General Delete Error */}
            {deleteError && !deleteDependencyInfo && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseDeleteMeal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleConfirmDeleteMeal}
                disabled={isDeleting || Boolean(deleteDependencyInfo?.blocked)}
                style={{
                  backgroundColor: Boolean(deleteDependencyInfo?.blocked) ? '#9CA3AF' : '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: (isDeleting || Boolean(deleteDependencyInfo?.blocked)) ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="spin" /> Deleting Meal...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Delete Meal
                  </>
                )}
              </button>
            </div>
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
