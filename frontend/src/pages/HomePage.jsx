import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MealCard } from '../components/meal/MealCard';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sliders,
  Dumbbell,
  Users,
  Search,
  Star,
  Clock,
  ChevronRight,
  Flame,
  Truck
} from 'lucide-react';

export function HomePage() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [popularMeals, setPopularMeals] = useState([]);
  const [highProteinMeals, setHighProteinMeals] = useState([]);
  const [familyCombos, setFamilyCombos] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [catRes, mealsRes, sellersRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch('/api/catalog/meals'),
        fetch('/api/catalog/sellers')
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      if (mealsRes.ok) {
        const mealData = await mealsRes.json();
        setPopularMeals(mealData.filter(m => m.is_featured).slice(0, 8));
        setHighProteinMeals(mealData.filter(m => (m.protein_grams || 0) >= 25).slice(0, 4));
        setFamilyCombos(mealData.filter(m => (m.dietary_tags || []).includes('Family Combos')).slice(0, 3));
      }

      if (sellersRes.ok) {
        const sellerData = await sellersRes.json();
        setFeaturedSellers(sellerData.slice(0, 6));
      }
    } catch (err) {
      console.error('Home data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div>
      {/* 1. Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFDF9 100%)',
        paddingTop: '60px',
        paddingBottom: '70px',
        borderBottom: '1px solid #E2E8F0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '48px'
          }}>
            {/* Left Content */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '20px'
              }}>
                <Sparkles size={16} color="#10B981" />
                Your meals, your way
              </div>

              <h1 style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                marginBottom: '20px'
              }}>
                Healthy meals. <br />
                <span style={{ color: '#10B981' }}>Flexible plans.</span> <br />
                Made for you.
              </h1>

              <p style={{
                fontSize: '1.15rem',
                color: '#475569',
                lineHeight: 1.6,
                marginBottom: '32px',
                maxWidth: '520px'
              }}>
                Whether you want daily rotating tiffin subscriptions, on-demand restaurant ordering, or your own custom protein-packed bowl — FitBite delivers wholesome food your way.
              </p>

              {/* Location & Food Search Bar */}
              <form onSubmit={handleHeroSearch} style={{
                display: 'flex',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '6px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
                border: '1.5px solid #E2E8F0',
                maxWidth: '520px',
                marginBottom: '28px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '14px', flex: 1 }}>
                  <Search size={20} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Search meals, bowls, tiffins or cuisines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      padding: '12px',
                      fontSize: '0.98rem',
                      width: '100%',
                      backgroundColor: 'transparent'
                    }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '12px', padding: '12px 24px' }}>
                  Find Food
                </button>
              </form>

              {/* Quick CTAs */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link to="/subscriptions" className="btn btn-accent" style={{ padding: '12px 22px' }}>
                  <Calendar size={18} /> View Tiffin Subscriptions
                </Link>
                <Link to="/build-meal" className="btn btn-outline" style={{ padding: '12px 22px' }}>
                  <Sliders size={18} color="#F97316" /> Build Your Own Meal
                </Link>
              </div>
            </div>

            {/* Right Hero Visual Cards */}
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: '28px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)',
                border: '4px solid #FFFFFF'
              }}>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=80"
                  alt="FitBite Healthy Homestyle Meals"
                  style={{ width: '100%', height: '420px', objectFit: 'cover' }}
                />
              </div>

              {/* Floating Feature Tag 1: Macro Accuracy */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '-20px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '12px 18px',
                borderRadius: '16px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Fitness Friendly</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>32g+ Clean Protein</div>
                </div>
              </div>

              {/* Floating Feature Tag 2: Skip Guarantee */}
              <div style={{
                position: 'absolute',
                bottom: '-15px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '12px 18px',
                borderRadius: '16px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FFF7ED', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Zero Meal Wastage</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>Flexible Skips Extend End Date</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Food Categories (20 Categories) */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
            <div>
              <span className="badge badge-veg" style={{ marginBottom: '8px' }}>Category Variety</span>
              <h2 style={{ fontSize: '1.8rem', color: '#0F172A' }}>Explore by Meal Categories</h2>
              <p style={{ color: '#64748B', fontSize: '0.95rem' }}>From traditional everyday tiffins to high-protein fitness bowls.</p>
            </div>
            <Link to="/explore" className="btn btn-outline btn-sm">
              View All ({categories.length}) <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '12px',
            scrollbarWidth: 'thin'
          }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/explore?category=${cat.slug}`)}
                style={{
                  minWidth: '150px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
                  {cat.slug.includes('breakfast') ? '🥞' :
                   cat.slug.includes('tiffin') ? '🍱' :
                   cat.slug.includes('north') ? '🍲' :
                   cat.slug.includes('south') ? '🍛' :
                   cat.slug.includes('maharashtrian') ? '🥘' :
                   cat.slug.includes('protein') ? '💪' :
                   cat.slug.includes('bowl') ? '🥗' :
                   cat.slug.includes('vegan') ? '🌱' :
                   cat.slug.includes('egg') ? '🍳' :
                   cat.slug.includes('chicken') ? '🍗' :
                   cat.slug.includes('jain') ? '🕊️' :
                   cat.slug.includes('biryani') ? '🍚' :
                   cat.slug.includes('roti') ? '🫓' :
                   cat.slug.includes('salad') ? '🥬' :
                   cat.slug.includes('wrap') ? '🌯' :
                   cat.slug.includes('family') ? '👨‍👩‍👧‍👦' :
                   cat.slug.includes('beverage') ? '🥤' :
                   cat.slug.includes('dessert') ? '🍮' : '🍽️'}
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Popular Meals */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: '8px' }}>Customer Favorites</span>
              <h2 style={{ fontSize: '1.8rem', color: '#0F172A' }}>Popular &amp; High-Rated Meals</h2>
              <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Freshly cooked by verified local kitchens and mess partners.</p>
            </div>
            <Link to="/explore" className="btn btn-outline btn-sm">
              See All Meals <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '24px'
          }}>
            {popularMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Primary USP: Build Your Own Meal Showcase */}
      <section style={{
        padding: '70px 0',
        backgroundColor: '#FFF7ED',
        borderBottom: '1px solid #FED7AA'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '40px'
          }}>
            <div>
              <span className="badge" style={{ backgroundColor: '#FFEDD5', color: '#C2410C', marginBottom: '10px' }}>
                ⭐ Core USP: “Your meals, your way”
              </span>
              <h2 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '16px' }}>
                Build Your Own Meal. <br />
                <span style={{ color: '#F97316' }}>Customize Every Single Bite.</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
                No more boring, fixed-menu constraints. Choose your favorite base, swap paneer for tofu or grilled chicken, pick your spice level, select homestyle gravies, and eliminate ingredients you avoid.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                  <CheckCircle2 size={18} color="#10B981" /> Bases: Basmati, Brown Rice, Millets, Phulka
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                  <CheckCircle2 size={18} color="#10B981" /> Proteins: Paneer, Tofu, Eggs, Chicken
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                  <CheckCircle2 size={18} color="#10B981" /> Live Macro &amp; Calorie Recalculation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                  <CheckCircle2 size={18} color="#10B981" /> No Onion, No Garlic &amp; Oil Controls
                </div>
              </div>

              <Link to="/build-meal" className="btn btn-accent btn-lg">
                <Sliders size={20} /> Open Meal Customizer <ArrowRight size={20} />
              </Link>
            </div>

            {/* Customizer Interactive Preview Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 20px 30px rgba(249, 115, 22, 0.1)',
              border: '1px solid #FED7AA'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>Interactive Customizer Preview</span>
                <span className="badge badge-accent">Live Preview</span>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>SELECTED BASE:</div>
                <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Brown Rice &amp; Multigrain Phulka</span>
                  <span style={{ color: '#10B981' }}>+₹20</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>PROTEIN CORE:</div>
                <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Extra Fresh Malai Paneer (120g)</span>
                  <span style={{ color: '#10B981' }}>+₹45 (24g Protein)</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>SPICE &amp; REMOVALS:</div>
                <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.88rem' }}>
                  Medium Spiced • No Raw Onion • Less Cooking Oil
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Estimated Macros</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#065F46' }}>520 kcal • 28.5g Protein</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total Price</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>₹185</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Affordable Tiffin Plans Section */}
      <section style={{ padding: '70px 0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <span className="badge badge-veg" style={{ marginBottom: '8px' }}>Predictable Subscriptions</span>
            <h2 style={{ fontSize: '2.2rem', color: '#0F172A', marginBottom: '12px' }}>Affordable Tiffin Plans</h2>
            <p style={{ color: '#64748B', fontSize: '1rem' }}>
              Zero cooking fatigue. Homestyle lunch and dinner subscriptions designed for students and working professionals.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px'
          }}>
            {/* Working Professional Plan Card */}
            <div className="card" style={{ padding: '32px', borderTop: '4px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-veg">Daily Delivery (7 Days)</span>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>28-Day Cycle</span>
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🏢 Working Professional Plan</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '20px' }}>
                Designed for professionals staying in the city throughout the week. Nutritious rotational meals delivered every single day.
              </p>

              <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#065F46' }}>
                  ₹106 <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B' }}>/ meal (15% OFF)</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '4px' }}>
                  Includes free delivery &amp; daily steel dabba rotation.
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#334155', marginBottom: '28px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10B981" /> 28 calendar days (56 meals for Lunch + Dinner)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10B981" /> <strong>Up to 2 flexible skip-days</strong> that extend your end date
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10B981" /> Swap scheduled dish for approved alternative before cutoff
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10B981" /> Lunch (12:00-1:30 PM) &amp; Dinner (7:30-9:00 PM)
                </li>
              </ul>

              <Link to="/subscriptions" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Select Professional Plan <ArrowRight size={18} />
              </Link>
            </div>

            {/* Student Plan Card */}
            <div className="card" style={{ padding: '32px', borderTop: '4px solid #F97316' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-accent">Mon - Fri Only</span>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Weekends Excluded</span>
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>🎒 Student Pocket Saver Plan</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '20px' }}>
                Affordable monthly plan for students and college interns. Saturdays and Sundays automatically excluded so you only pay for weekdays.
              </p>

              <div style={{ backgroundColor: '#FFF7ED', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C2410C' }}>
                  ₹79 <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B' }}>/ meal (20% OFF)</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#EA580C', marginTop: '4px' }}>
                  Billed only for the ~22 scheduled weekdays in the month.
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#334155', marginBottom: '28px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#F97316" /> Dynamic eligible weekday calculation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#F97316" /> Zero weekend charges or unwanted deliveries
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#F97316" /> 1 emergency skip per monthly cycle
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#F97316" /> Pocket-friendly homestyle nutrition
                </li>
              </ul>

              <Link to="/subscriptions" className="btn btn-accent" style={{ width: '100%', padding: '12px' }}>
                Select Student Plan <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. High-Protein and Balanced Meals Spotlight */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <span className="badge badge-protein" style={{ marginBottom: '8px' }}>Macro Focused</span>
              <h2 style={{ fontSize: '1.8rem', color: '#0F172A' }}>High-Protein &amp; Balanced Bowls</h2>
              <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Loaded with 25g+ lean protein to support gym and fitness goals.</p>
            </div>
            <Link to="/explore?dietary=high_protein" className="btn btn-outline btn-sm">
              Explore High-Protein <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '24px'
          }}>
            {highProteinMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Family Meal Combos */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <span className="badge badge-veg" style={{ marginBottom: '8px' }}>Family Dining</span>
              <h2 style={{ fontSize: '1.8rem', color: '#0F172A' }}>Family Combos &amp; Multi-Person Thalis</h2>
              <p style={{ color: '#64748B', fontSize: '0.95rem' }}>Generous homestyle portions for dinners with family and roommates.</p>
            </div>
            <Link to="/explore?category=family-combos" className="btn btn-outline btn-sm">
              View All Combos <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {familyCombos.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. Featured Restaurants & Verified Cloud Kitchens (8 Demo Kitchens) */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <span className="badge badge-veg" style={{ marginBottom: '8px' }}>FSSAI Certified</span>
            <h2 style={{ fontSize: '2rem', color: '#0F172A', marginBottom: '10px' }}>
              Featured Kitchens &amp; Tiffin Centers
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
              All kitchens operate with a valid 14-digit FSSAI license, verified hygiene audits, and thermal dabba packing.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {featuredSellers.map((seller) => (
              <div key={seller.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                      {seller.business_name}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      📍 {seller.area}, {seller.city}
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Star size={13} fill="#065F46" color="#065F46" /> {seller.rating}
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '14px' }}>
                  Specialization: <strong>{(seller.cuisine_specializations || []).join(', ')}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #F1F5F9',
                  fontSize: '0.78rem',
                  color: '#64748B'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} color="#10B981" /> FSSAI: {seller.fssai_number}
                  </span>
                  <Link to={`/explore?seller_id=${seller.id}`} style={{ fontWeight: 700, color: '#10B981' }}>
                    View Menu &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. How FitBite Works */}
      <section style={{ padding: '70px 0', backgroundColor: '#F0FDF4', borderBottom: '1px solid #DCFCE7' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px auto' }}>
            <span className="badge badge-veg" style={{ marginBottom: '8px' }}>Simplicity &amp; Control</span>
            <h2 style={{ fontSize: '2.2rem', color: '#0F172A' }}>How FitBite Works</h2>
            <p style={{ color: '#475569', fontSize: '0.98rem' }}>Enjoy seamless dining flexibility in four easy steps.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '24px',
            textAlign: 'center'
          }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '28px 20px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>1️⃣</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Choose Your Flow</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Solo bachelor, gym enthusiast, or ordering for family. FitBite adapts to your situation.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '28px 20px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>2️⃣</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Customize Your Meals</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Select bases, extra protein, spice, and eliminate ingredients with live macro updates.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '28px 20px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>3️⃣</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Subscribe or Order Now</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Pick a 28-day rotational cycle, student weekday plan, or flexible instant orders.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '28px 20px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>4️⃣</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Doorstep Fresh Delivery</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Hot meals delivered in insulated dabbas with steel container exchange &amp; live tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Become a Partner Callout */}
      <section style={{ padding: '70px 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            borderRadius: '28px',
            padding: '50px 40px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '30px'
          }}>
            <div style={{ maxWidth: '580px' }}>
              <span className="badge" style={{ backgroundColor: '#F97316', color: '#FFFFFF', marginBottom: '12px' }}>
                Kitchen &amp; Mess Partners
              </span>
              <h2 style={{ fontSize: '2.2rem', color: '#FFFFFF', marginBottom: '14px' }}>
                Grow Your Kitchen with Guaranteed Monthly Tiffin Customers
              </h2>
              <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: '1.6' }}>
                Join FitBite as a Commercial Tiffin Mess, Home Chef Cloud Kitchen, or Restaurant. Receive predictable batch delivery manifests and daily subscription meal volume.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => openAuthModal({ mode: 'signup', accountType: 'seller' })}
                className="btn btn-accent btn-lg"
              >
                Register Your Kitchen Today &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
