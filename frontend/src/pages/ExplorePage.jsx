import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MealCard } from '../components/meal/MealCard';
import { Search, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { apiFetch, safeJson } from '../config/api';
import { isMealAvailable } from '../utils/mealUtils';
import { FALLBACK_CATEGORIES, FALLBACK_SELLERS, FALLBACK_MEALS } from '../utils/demoCatalogFallback';


export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSeller, setSelectedSeller] = useState(searchParams.get('seller_id') || '');
  const [selectedDietary, setSelectedDietary] = useState(searchParams.get('dietary') || '');
  const [onlyHighProtein, setOnlyHighProtein] = useState(false);
  const [onlyTiffin, setOnlyTiffin] = useState(false);
  const [maxPrice, setMaxPrice] = useState(600);

  const hasActiveFilters = Boolean(
    query.trim() ||
    selectedCategory ||
    selectedSeller ||
    selectedDietary ||
    onlyHighProtein ||
    onlyTiffin ||
    maxPrice < 600
  );

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setQuery(qParam);
    fetchMeals(qParam);
  }, [searchParams, selectedCategory, selectedSeller, selectedDietary, onlyHighProtein, onlyTiffin, maxPrice]);

  const fetchMetadata = async () => {
    try {
      const [catSettled, sellSettled] = await Promise.allSettled([
        apiFetch('/api/catalog/categories'),
        apiFetch('/api/catalog/sellers')
      ]);
      if (catSettled.status === 'fulfilled' && catSettled.value.ok) {
        const catData = await safeJson(catSettled.value);
        const list = Array.isArray(catData) ? catData : (Array.isArray(catData?.categories) ? catData.categories : []);
        setCategories(list.length > 0 ? list : FALLBACK_CATEGORIES);
      } else {
        setCategories(FALLBACK_CATEGORIES);
      }
      if (sellSettled.status === 'fulfilled' && sellSettled.value.ok) {
        const sellData = await safeJson(sellSettled.value);
        const list = Array.isArray(sellData) ? sellData : (Array.isArray(sellData?.sellers) ? sellData.sellers : []);
        setSellers(list.length > 0 ? list : FALLBACK_SELLERS);
      } else {
        setSellers(FALLBACK_SELLERS);
      }
    } catch (e) {
      console.error('Metadata error:', e);
      setCategories(FALLBACK_CATEGORIES);
      setSellers(FALLBACK_SELLERS);
    }
  };

  const fetchMeals = async (searchOverride = null) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      const currentQ = searchOverride !== null ? searchOverride : query;
      if (currentQ) params.set('query', currentQ);
      if (selectedCategory) params.set('category_slug', selectedCategory);
      if (selectedSeller) params.set('seller_id', selectedSeller);
      if (selectedDietary) params.set('dietary', selectedDietary);
      if (onlyHighProtein) params.set('high_protein', 'true');
      if (onlyTiffin) params.set('tiffin_only', 'true');
      if (maxPrice < 600) params.set('max_price', String(maxPrice));

      let rawMeals = [];
      try {
        const res = await apiFetch(`/api/catalog/meals?${params.toString()}`);
        if (res.ok) {
          const data = await safeJson(res);
          if (Array.isArray(data)) {
            rawMeals = data;
          } else if (data && Array.isArray(data.meals)) {
            rawMeals = data.meals;
          } else if (data && Array.isArray(data.data)) {
            rawMeals = data.data;
          }
        }
      } catch (fetchErr) {
        console.warn('Backend fetch note, using fallback meals:', fetchErr.message);
      }

      if (rawMeals.length === 0) {
        rawMeals = FALLBACK_MEALS;
      }

      // Strict availability normalization
      setMeals(rawMeals.filter(m => isMealAvailable(m)));
    } catch (e) {
      console.error('Fetch meals error:', e);
      setMeals(FALLBACK_MEALS.filter(m => isMealAvailable(m)));
    } finally {
      setLoading(false);
    }
  };


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (query.trim()) {
      nextParams.set('q', query.trim());
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedSeller('');
    setSelectedDietary('');
    setOnlyHighProtein(false);
    setOnlyTiffin(false);
    setMaxPrice(600);
    setSearchParams({});
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      {/* Title & Stats */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '8px' }}>
          Explore Full Meal Catalog
        </h1>
        <p style={{ color: '#64748B', fontSize: '1rem' }}>
          Browse 60+ wholesome homestyle dishes across verified cloud kitchens, tiffin services, and restaurants.
        </p>
      </div>

      {/* Main Layout: Filters Sidebar + Meals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }} className="explore-layout">
        {/* Filters Sidebar */}
        <aside style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1.5px solid #E2E8F0',
          height: 'fit-content'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="#10B981" /> Filters
            </span>
            <button
              onClick={resetFilters}
              style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Search Input */}
          <div className="form-group">
            <label className="form-label">Search Query</label>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Dish, cuisine, kitchen..."
                className="form-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Dietary Type Filter */}
          <div className="form-group">
            <label className="form-label">Dietary Preference</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'All Diets', value: '' },
                { label: 'Vegetarian (Pure Veg)', value: 'Vegetarian' },
                { label: 'Vegan (Dairy Free)', value: 'Vegan' },
                { label: 'Egg Meals', value: 'Egg Meals' },
                { label: 'Chicken & Fish', value: 'Chicken and Fish Meals' },
                { label: 'Jain Friendly (No Root Veg)', value: 'Jain-Friendly Options' }
              ].map((d) => (
                <label key={d.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer', padding: '4px 0' }}>
                  <input
                    type="radio"
                    name="dietary"
                    checked={selectedDietary === d.value}
                    onChange={() => setSelectedDietary(d.value)}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label">Food Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories (20)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Kitchen / Seller Filter */}
          <div className="form-group">
            <label className="form-label">Kitchen Partner</label>
            <select
              className="form-select"
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
            >
              <option value="">All Verified Kitchens ({sellers.length})</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>{s.business_name} ({s.area})</option>
              ))}
            </select>
          </div>

          {/* High-Protein & Tiffin Eligible Toggles */}
          <div className="form-group">
            <label className="form-label">Special Tag Filters</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={onlyHighProtein}
                  onChange={(e) => setOnlyHighProtein(e.target.checked)}
                />
                High-Protein (20g+ Protein)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={onlyTiffin}
                  onChange={(e) => setOnlyTiffin(e.target.checked)}
                />
                Tiffin Subscription Eligible
              </label>
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Max Price</label>
              <span style={{ fontWeight: 700, color: '#10B981', fontSize: '0.88rem' }}>₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min={70}
              max={600}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
            />
          </div>
        </aside>

        {/* Meals Grid Area */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 600 }}>
              Showing {meals.length} dishes matching criteria
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🍲</div>
              Loading nutritious meals...
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: '#FEF2F2',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              border: '1.5px solid #FCA5A5'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '1.25rem', color: '#991B1B', marginBottom: '8px' }}>Unable to load meals</h3>
              <p style={{ color: '#7F1D1D', fontSize: '0.92rem', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {error}
              </p>
              <button onClick={() => fetchMeals()} className="btn btn-primary btn-sm" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
                Retry Loading Meals
              </button>
            </div>
          ) : meals.length === 0 ? (
            hasActiveFilters ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '60px 24px',
                textAlign: 'center',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽️</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No meals found matching your filters</h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Try adjusting your dietary filter, price slider, or search term.
                </p>
                <button onClick={resetFilters} className="btn btn-primary btn-sm">
                  Clear Filters &amp; Show All
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '60px 24px',
                textAlign: 'center',
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍱</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Catalog is currently empty</h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Our kitchen partners are preparing fresh menus. Please check back shortly!
                </p>
                <button onClick={() => fetchMeals()} className="btn btn-outline btn-sm">
                  Refresh Catalog
                </button>
              </div>
            )
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '24px'
            }}>
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .explore-layout { gridTemplateColumns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default ExplorePage;
