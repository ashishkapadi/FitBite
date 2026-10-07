import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MealCard } from '../components/meal/MealCard';
import { Search, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSeller, setSelectedSeller] = useState(searchParams.get('seller_id') || '');
  const [selectedDietary, setSelectedDietary] = useState(searchParams.get('dietary') || '');
  const [onlyHighProtein, setOnlyHighProtein] = useState(false);
  const [onlyTiffin, setOnlyTiffin] = useState(false);
  const [maxPrice, setMaxPrice] = useState(600);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [selectedCategory, selectedSeller, selectedDietary, onlyHighProtein, onlyTiffin, maxPrice]);

  const fetchMetadata = async () => {
    try {
      const [catRes, sellRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch('/api/catalog/sellers')
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (sellRes.ok) setSellers(await sellRes.json());
    } catch (e) {
      console.error('Metadata error:', e);
    }
  };

  const fetchMeals = async (searchOverride = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const currentQ = searchOverride !== null ? searchOverride : query;
      if (currentQ) params.set('query', currentQ);
      if (selectedCategory) params.set('category_slug', selectedCategory);
      if (selectedSeller) params.set('seller_id', selectedSeller);
      if (selectedDietary) params.set('dietary', selectedDietary);
      if (onlyHighProtein) params.set('high_protein', 'true');
      if (onlyTiffin) params.set('tiffin_only', 'true');
      if (maxPrice < 600) params.set('max_price', String(maxPrice));

      const res = await fetch(`/api/catalog/meals?${params.toString()}`);
      if (res.ok) {
        setMeals(await res.json());
      }
    } catch (e) {
      console.error('Fetch meals error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMeals();
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
    fetchMeals('');
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
          ) : meals.length === 0 ? (
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
