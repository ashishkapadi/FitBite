import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { apiFetch, safeJson } from '../config/api';
import {
  Sliders,
  Sparkles,
  Flame,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ShoppingCart,
  Plus
} from 'lucide-react';

export function BuildMealPage() {
  const [searchParams] = useSearchParams();
  const mealIdParam = searchParams.get('meal_id');
  const { addToCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [availableMeals, setAvailableMeals] = useState([]);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [customOptions, setCustomOptions] = useState({
    base: [],
    protein: [],
    side: [],
    spice: [],
    sauce: [],
    extra: [],
    removal: []
  });

  // User selections
  const [portion, setPortion] = useState('standard');
  const [selectedBaseId, setSelectedBaseId] = useState('');
  const [selectedProteinId, setSelectedProteinId] = useState('');
  const [selectedSideId, setSelectedSideId] = useState('');
  const [selectedSpiceId, setSelectedSpiceId] = useState('');
  const [selectedSauceId, setSelectedSauceId] = useState('');
  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [selectedRemovalIds, setSelectedRemovalIds] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');

  // Live Recalculation Results from Backend
  const [calcResult, setCalcResult] = useState(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [customMealName, setCustomMealName] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [savedMeals, setSavedMeals] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [mealsRes, optRes] = await Promise.all([
        apiFetch('/api/catalog/meals'),
        apiFetch('/api/catalog/customization-options')
      ]);

      if (mealsRes.ok) {
        const mList = await safeJson(mealsRes);
        setAvailableMeals(Array.isArray(mList) ? mList : []);
        const initialId = mealIdParam || (mList[0]?.id || '');
        setSelectedMealId(initialId);
      }

      if (optRes.ok) {
        const optData = await safeJson(optRes);
        if (optData && optData.grouped) {
          setCustomOptions(optData.grouped);

          // Set initial defaults
          const defaultBase = optData.grouped.base?.find(o => o.is_default) || optData.grouped.base?.[0];
          const defaultProtein = optData.grouped.protein?.[0];
          const defaultSide = optData.grouped.side?.find(o => o.is_default) || optData.grouped.side?.[0];
          const defaultSpice = optData.grouped.spice?.find(o => o.is_default) || optData.grouped.spice?.[1];
          const defaultSauce = optData.grouped.sauce?.find(o => o.is_default) || optData.grouped.sauce?.[0];

          if (defaultBase) setSelectedBaseId(defaultBase.id);
          if (defaultProtein) setSelectedProteinId(defaultProtein.id);
          if (defaultSide) setSelectedSideId(defaultSide.id);
          if (defaultSpice) setSelectedSpiceId(defaultSpice.id);
          if (defaultSauce) setSelectedSauceId(defaultSauce.id);
        }
      }
    } catch (e) {
      console.error('Build meal data error:', e);
    }
  };

  // When selectedMealId or options change, fetch live calculation
  useEffect(() => {
    if (selectedMealId) {
      const found = availableMeals.find(m => m.id === selectedMealId);
      setSelectedMeal(found || null);
      if (found && !customMealName) {
        setCustomMealName(`My Custom ${found.name}`);
      }
      recalculateCustomization();
    }
  }, [
    selectedMealId,
    availableMeals,
    portion,
    selectedBaseId,
    selectedProteinId,
    selectedSideId,
    selectedSpiceId,
    selectedSauceId,
    selectedExtraIds,
    selectedRemovalIds,
    specialNotes
  ]);

  const recalculateCustomization = async () => {
    if (!selectedMealId) return;
    try {
      setLoadingCalc(true);
      const res = await apiFetch('/api/custom-meals/calculate', {
        method: 'POST',
        body: JSON.stringify({
          meal_id: selectedMealId,
          selections: {
            portion,
            base_id: selectedBaseId,
            protein_id: selectedProteinId,
            side_id: selectedSideId,
            spice_id: selectedSpiceId,
            sauce_id: selectedSauceId,
            extra_ids: selectedExtraIds,
            removal_ids: selectedRemovalIds,
            special_notes: specialNotes
          }
        })
      });

      if (res.ok) {
        setCalcResult(await safeJson(res));
      }
    } catch (e) {
      console.error('Recalculate error:', e);
    } finally {
      setLoadingCalc(false);
    }
  };

  const toggleExtra = (id) => {
    if (selectedExtraIds.includes(id)) {
      setSelectedExtraIds(selectedExtraIds.filter(x => x !== id));
    } else {
      setSelectedExtraIds([...selectedExtraIds, id]);
    }
  };

  const toggleRemoval = (id) => {
    if (selectedRemovalIds.includes(id)) {
      setSelectedRemovalIds(selectedRemovalIds.filter(x => x !== id));
    } else {
      setSelectedRemovalIds([...selectedRemovalIds, id]);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      openAuthModal({
        mode: 'signin',
        accountType: 'customer',
        action: () => handleAddToCart()
      });
      return;
    }

    await addToCart({
      meal_id: selectedMealId,
      quantity: 1,
      portion,
      customizations: {
        base_id: selectedBaseId,
        protein_id: selectedProteinId,
        side_id: selectedSideId,
        spice_id: selectedSpiceId,
        sauce_id: selectedSauceId,
        extra_ids: selectedExtraIds,
        removal_ids: selectedRemovalIds
      },
      special_notes: specialNotes
    });

    navigate('/checkout');
  };

  const handleSaveFavorite = async () => {
    if (!user) {
      openAuthModal({
        mode: 'signin',
        accountType: 'customer',
        action: () => handleSaveFavorite()
      });
      return;
    }

    try {
      const res = await apiFetch('/api/custom-meals/save', {
        method: 'POST',
        body: JSON.stringify({
          meal_id: selectedMealId,
          custom_name: customMealName || `Custom ${selectedMeal?.name}`,
          selections: {
            portion,
            base_id: selectedBaseId,
            protein_id: selectedProteinId,
            side_id: selectedSideId,
            spice_id: selectedSpiceId,
            sauce_id: selectedSauceId,
            extra_ids: selectedExtraIds,
            removal_ids: selectedRemovalIds,
            special_notes: specialNotes
          }
        })
      });

      if (res.ok) {
        setSaveSuccessMessage('Custom combination saved to your favorites!');
        setTimeout(() => setSaveSuccessMessage(''), 4000);
      }
    } catch (e) {
      console.error('Save favorite error:', e);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      {/* Title */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#C2410C', backgroundColor: '#FFF7ED', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
          <Sparkles size={16} color="#F97316" />
          FitBite Primary USP
        </div>
        <h1 style={{ fontSize: '2.4rem', color: '#0F172A', marginBottom: '8px' }}>
          Build Your Own Meal
        </h1>
        <p style={{ color: '#64748B', fontSize: '1.05rem' }}>
          Total control over your nutrition. Choose bases, proteins, spice levels, extras, and ingredient exclusions with instant live pricing and macro recalculation.
        </p>
      </div>

      {/* Main Grid: Interactive Builder vs Live Summary Ticket */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '36px' }} className="custom-builder-layout">
        {/* Left: Interactive Configurator */}
        <div>
          {/* Base Dish Picker */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              1. Select Base Dish / Canvas
            </h3>
            <select
              className="form-select"
              value={selectedMealId}
              onChange={(e) => {
                setSelectedMealId(e.target.value);
                const found = availableMeals.find(m => m.id === e.target.value);
                if (found) setCustomMealName(`My Custom ${found.name}`);
              }}
              style={{ fontSize: '1rem', fontWeight: 600 }}
            >
              {availableMeals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.seller_name}) - Base ₹{m.base_price}
                </option>
              ))}
            </select>
          </div>

          {/* Portion Size */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
              2. Portion Size
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { id: 'standard', title: 'Standard', desc: 'Balanced single meal', extra: '₹0' },
                { id: 'large', title: 'Large (+25%)', desc: 'Hearty hunger', extra: '+₹40' },
                { id: 'fitness_mega', title: 'Fitness Mega (+50%)', desc: 'Athlete high volume', extra: '+₹75' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPortion(p.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: `2px solid ${portion === p.id ? '#10B981' : '#E2E8F0'}`,
                    backgroundColor: portion === p.id ? '#ECFDF5' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p.title}</span>
                    <span style={{ color: '#059669', fontSize: '0.82rem' }}>{p.extra}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Grain / Base Selection */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
              3. Grain or Salad Base
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {customOptions.base.map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedBaseId === opt.id ? '#10B981' : '#E2E8F0'}`,
                    backgroundColor: selectedBaseId === opt.id ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="base_choice"
                      checked={selectedBaseId === opt.id}
                      onChange={() => setSelectedBaseId(opt.id)}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{opt.item_choice}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: opt.price_delta > 0 ? '#10B981' : '#64748B' }}>
                    {opt.price_delta > 0 ? `+₹${opt.price_delta}` : 'Free'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Protein Core */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
              4. Protein Core (Fuel Your Body)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {customOptions.protein.map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedProteinId === opt.id ? '#10B981' : '#E2E8F0'}`,
                    backgroundColor: selectedProteinId === opt.id ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      name="protein_choice"
                      checked={selectedProteinId === opt.id}
                      onChange={() => setSelectedProteinId(opt.id)}
                    />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{opt.item_choice}</div>
                      <div style={{ fontSize: '0.75rem', color: '#1E40AF' }}>+{opt.protein_delta}g protein</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>
                    +₹{opt.price_delta}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sides & Gravies */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
              5. Vegetable Side &amp; Sauce
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Vegetable side */}
              <div>
                <label className="form-label">Vegetable Side</label>
                <select
                  className="form-select"
                  value={selectedSideId}
                  onChange={(e) => setSelectedSideId(e.target.value)}
                >
                  {customOptions.side.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.item_choice} {s.price_delta > 0 ? `(+₹${s.price_delta})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sauce / Curry */}
              <div>
                <label className="form-label">Curry / Sauce</label>
                <select
                  className="form-select"
                  value={selectedSauceId}
                  onChange={(e) => setSelectedSauceId(e.target.value)}
                >
                  {customOptions.sauce.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.item_choice} {sc.price_delta > 0 ? `(+₹${sc.price_delta})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Spice Level */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
              6. Spice Level
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {customOptions.spice.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setSelectedSpiceId(sp.id)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedSpiceId === sp.id ? '#F97316' : '#E2E8F0'}`,
                    backgroundColor: selectedSpiceId === sp.id ? '#FFF7ED' : '#FFFFFF',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                    {sp.item_choice.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {sp.price_delta > 0 ? `+₹${sp.price_delta}` : 'Free'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Extras / Add-ons */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
              7. Add-On Extras
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {customOptions.extra.map((ext) => (
                <label
                  key={ext.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedExtraIds.includes(ext.id) ? '#10B981' : '#E2E8F0'}`,
                    backgroundColor: selectedExtraIds.includes(ext.id) ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedExtraIds.includes(ext.id)}
                      onChange={() => toggleExtra(ext.id)}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ext.item_choice}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10B981' }}>
                    +₹{ext.price_delta}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Ingredient Removals */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>
                8. Ingredient Removals &amp; Restrictions
              </h3>
              <span className="badge badge-veg">Kitchen Guarantee</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              {customOptions.removal.map((rem) => (
                <button
                  key={rem.id}
                  type="button"
                  onClick={() => toggleRemoval(rem.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: `1.5px solid ${selectedRemovalIds.includes(rem.id) ? '#EF4444' : '#CBD5E1'}`,
                    backgroundColor: selectedRemovalIds.includes(rem.id) ? '#FEF2F2' : '#FFFFFF',
                    color: selectedRemovalIds.includes(rem.id) ? '#B91C1C' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {selectedRemovalIds.includes(rem.id) ? '✕ ' : '+ '} {rem.item_choice}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
              *Note: While kitchen preparation follows strict separate utensils for removal requests, please notify us for severe airborne allergen sensitivities.
            </p>
          </div>

          {/* Special Preparation Instructions */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
              9. Special Chef Notes
            </h3>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Please pack curry and rotis in separate containers, extra lime wedge..."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Live Summary & Recalculated Ticket (Sticky) */}
        <div>
          <div style={{
            position: 'sticky',
            top: '90px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px',
            border: '2px solid #E2E8F0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A' }}>
                Live Custom Ticket
              </span>
              <span className="badge badge-accent">
                {loadingCalc ? 'Calculating...' : 'Recalculated'}
              </span>
            </div>

            {selectedMeal && (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                <ImageWithFallback
                  src={selectedMeal.image_url}
                  alt={selectedMeal.name}
                  style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedMeal.name}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>By {selectedMeal.seller_name}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>Base ₹{selectedMeal.base_price}</div>
                </div>
              </div>
            )}

            {/* Macro Breakdown Pills */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                Estimated Nutritional Breakdown:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={12} color="#D97706" /> Energy
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {calcResult?.estimated_calories || 480} kcal
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Dumbbell size={12} /> Lean Protein
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E40AF' }}>
                    {calcResult?.estimated_protein || 24}g
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Carbohydrates</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {calcResult?.estimated_carbs || 60}g
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Fats &amp; Lipids</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    {calcResult?.estimated_fat || 14}g
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Add-ons List */}
            <div style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Applied Customizations:</div>
              {calcResult?.applied_options?.map((app, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#334155' }}>
                  <span>• {app.item}</span>
                  <span style={{ fontWeight: 600 }}>{app.price_delta > 0 ? `+₹${app.price_delta}` : 'Included'}</span>
                </div>
              ))}
              {calcResult?.removals?.length > 0 && (
                <div style={{ color: '#DC2626', marginTop: '6px', fontSize: '0.82rem' }}>
                  Restricted: {calcResult.removals.join(', ')}
                </div>
              )}
            </div>

            {/* Allergen Conflict Alert Banner */}
            {calcResult?.allergen_warnings?.length > 0 && (
              <div style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                color: '#92400E',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                marginBottom: '20px',
                display: 'flex',
                gap: '8px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Allergen Notice:</strong> {calcResult.allergen_warnings.join(' • ')}
                </div>
              </div>
            )}

            {/* Custom Meal Name Input */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Name This Custom Creation</label>
              <input
                type="text"
                className="form-input"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                placeholder="e.g. My High Protein Brown Rice Bowl"
              />
            </div>

            {/* Total Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingTop: '16px', borderTop: '2px solid #E2E8F0' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>Final Custom Price</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>
                ₹{calcResult?.calculated_price || selectedMeal?.base_price || 0}
              </span>
            </div>

            {saveSuccessMessage && (
              <div style={{ backgroundColor: '#ECFDF5', color: '#065F46', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                ✓ {saveSuccessMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                <ShoppingCart size={18} /> Add Custom Meal to Cart
              </button>

              <button
                type="button"
                onClick={handleSaveFavorite}
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                <Bookmark size={16} /> Save as Favorite Custom Meal
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .custom-builder-layout { gridTemplateColumns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default BuildMealPage;
