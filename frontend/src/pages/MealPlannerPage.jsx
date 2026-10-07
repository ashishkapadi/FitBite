import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import { 
  Sparkles, 
  Calendar, 
  Flame, 
  Dumbbell, 
  Heart, 
  CheckCircle, 
  RefreshCw, 
  ShoppingBag, 
  ArrowRight, 
  ChevronRight, 
  Info,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function MealPlannerPage() {
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Preference form state
  const [goal, setGoal] = useState('BALANCED');
  const [dietaryPreference, setDietaryPreference] = useState('VEGETARIAN');
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [dailyBudget, setDailyBudget] = useState(450);
  const [spicePreference, setSpicePreference] = useState('MEDIUM');
  const [showConfig, setShowConfig] = useState(false);

  // Optional biometric metrics for BMR/TDEE
  const [age, setAge] = useState(26);
  const [gender, setGender] = useState('MALE');
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [activityLevel, setActivityLevel] = useState('MODERATE');

  useEffect(() => {
    fetchMealPlan();
  }, []);

  const fetchMealPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/meal-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          dietaryPreference,
          dailyBudget: Number(dailyBudget),
          spicePreference,
          age: Number(age),
          gender,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          activityLevel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan from planner service');
      }

      const data = await response.json();
      setPlanData(data);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setError(err.message || 'Could not connect to meal planner service');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = (dayIdx, slot, swapOption) => {
    if (!planData || !planData.schedule) return;
    const newSchedule = [...planData.schedule];
    const day = { ...newSchedule[dayIdx] };
    const meals = { ...day.meals };
    meals[slot] = swapOption;
    day.meals = meals;
    newSchedule[dayIdx] = day;

    setPlanData({
      ...planData,
      schedule: newSchedule
    });
  };

  const handleOrderMeal = (meal) => {
    if (!user) {
      openAuthModal('customer', () => addToCart(meal, 1));
      return;
    }
    addToCart(meal, 1);
  };

  const activeDay = planData?.schedule?.[activeDayIndex];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Sparkles size={16} /> Powered by Java Spring Boot Deterministic Rule Engine
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            Personalized 7-Day Nutrition Plan
          </h1>
          <p style={{ color: '#4B5563', fontSize: '1.1rem', maxWidth: '680px', margin: 0 }}>
            Tailored nutrition based on your metabolic baseline, macro targets, and budget. Swap dishes or order them directly from verified FitBite home kitchens.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowConfig(!showConfig)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Sliders size={18} /> {showConfig ? 'Hide Settings' : 'Customize Goals'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={fetchMealPlan}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Regenerate Plan
          </button>
        </div>
      </div>

      {/* Preferences & Biometrics Config Panel */}
      {showConfig && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '1rem', padding: '1.75rem', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#1F2937' }}>
            Adjust Your Nutrition & Budget Parameters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Primary Goal</label>
              <select className="form-input" value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="BALANCED">Balanced Eating</option>
                <option value="WEIGHT_LOSS">Weight Loss / Fat Cut</option>
                <option value="MUSCLE_GAIN">Muscle Gain / Hypertrophy</option>
                <option value="CONVENIENCE">Convenience & Everyday Energy</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Dietary Filter</label>
              <select className="form-input" value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value)}>
                <option value="VEGETARIAN">Pure Vegetarian</option>
                <option value="VEGAN">Vegan (Plant-Based)</option>
                <option value="EGGETARIAN">Eggetarian</option>
                <option value="NON_VEG">Non-Vegetarian</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Daily Meal Budget (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={dailyBudget} 
                onChange={(e) => setDailyBudget(e.target.value)} 
                min={200} 
                max={1500} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Spice Tolerance</label>
              <select className="form-input" value={spicePreference} onChange={(e) => setSpicePreference(e.target.value)}>
                <option value="MILD">Mild (Low Chili)</option>
                <option value="MEDIUM">Medium Balanced</option>
                <option value="SPICY">Spicy / Authentic Desi</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Age & Gender</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: '80px' }} 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)} 
                />
                <select className="form-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Height (cm) & Weight (kg)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={heightCm} 
                  onChange={(e) => setHeightCm(e.target.value)} 
                  placeholder="Height cm"
                />
                <input 
                  type="number" 
                  className="form-input" 
                  value={weightKg} 
                  onChange={(e) => setWeightKg(e.target.value)} 
                  placeholder="Weight kg"
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={fetchMealPlan} disabled={loading}>
              Apply & Recalculate TDEE Macros
            </button>
          </div>
        </div>
      )}

      {/* Target Breakdown Card */}
      {planData?.targetProfile && (
        <div style={{ 
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)', 
          color: '#FFFFFF', 
          borderRadius: '1.25rem', 
          padding: '2rem', 
          marginBottom: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6EE7B7', fontWeight: 700 }}>
                Metabolic Profile & Mifflin-St Jeor Estimation
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: '#FFFFFF' }}>
                Daily Target: {planData.targetProfile.targetCalories} kcal / day
              </h2>
              <p style={{ color: '#D1FAE5', margin: 0, fontSize: '0.95rem', maxWidth: '600px' }}>
                Calculated BMR: {planData.targetProfile.bmr} kcal • TDEE: {planData.targetProfile.tdee} kcal • 
                Goal Focus: {planData.targetProfile.goalDescription || goal}
              </p>
            </div>

            {/* Macro distribution pills */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.15)', minWidth: '100px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 600 }}>PROTEIN</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>{planData.targetProfile.targetProteinGrams}g</div>
                <div style={{ fontSize: '0.7rem', color: '#D1FAE5' }}>30% calories</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.15)', minWidth: '100px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 600 }}>CARBS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>{planData.targetProfile.targetCarbsGrams}g</div>
                <div style={{ fontSize: '0.7rem', color: '#D1FAE5' }}>45% calories</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.15)', minWidth: '100px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#A7F3D0', fontWeight: 600 }}>HEALTHY FATS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>{planData.targetProfile.targetFatGrams}g</div>
                <div style={{ fontSize: '0.7rem', color: '#D1FAE5' }}>25% calories</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Day Selector Tabs */}
      {planData?.schedule && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {planData.schedule.map((day, idx) => {
              const isSelected = idx === activeDayIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDayIndex(idx)}
                  style={{
                    flex: '1',
                    minWidth: '130px',
                    padding: '0.85rem 1rem',
                    background: isSelected ? '#10B981' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#374151',
                    border: isSelected ? '1px solid #10B981' : '1px solid #E5E7EB',
                    borderRadius: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? '#D1FAE5' : '#6B7280', textTransform: 'uppercase' }}>
                    Day {idx + 1}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {day.dayName}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: isSelected ? '#ECFDF5' : '#9CA3AF' }}>
                    {day.totalCalories} kcal • ₹{day.estimatedCost}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Day Schedule Content */}
      {activeDay && (
        <div>
          {/* Day Macro Summary Bar */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block' }}>DAILY TOTAL</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{activeDay.totalCalories} kcal</span>
              </div>
              <div style={{ borderLeft: '1px solid #CBD5E1', paddingLeft: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block' }}>PROTEIN</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>{activeDay.totalProtein}g</span>
              </div>
              <div style={{ borderLeft: '1px solid #CBD5E1', paddingLeft: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block' }}>CARBS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D97706' }}>{activeDay.totalCarbs}g</span>
              </div>
              <div style={{ borderLeft: '1px solid #CBD5E1', paddingLeft: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block' }}>FATS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366F1' }}>{activeDay.totalFat}g</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, display: 'block' }}>ESTIMATED COST</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>₹{activeDay.estimatedCost}</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  Object.values(activeDay.meals || {}).forEach(meal => {
                    if (meal) addToCart(meal, 1);
                  });
                }}
              >
                Add All Meals to Cart
              </button>
            </div>
          </div>

          {/* Meals Grid for the Day */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((slot) => {
              const meal = activeDay.meals?.[slot];
              if (!meal) return null;

              const slotTitles = {
                breakfast: 'Breakfast (8:30 AM)',
                lunch: 'Lunch (12:30 PM)',
                dinner: 'Dinner (8:00 PM)',
                snack: 'Healthy Snack / Evening (4:30 PM)'
              };

              return (
                <div 
                  key={slot} 
                  style={{ 
                    background: '#FFFFFF', 
                    borderRadius: '1rem', 
                    border: '1px solid #E5E7EB', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ padding: '0.75rem 1rem', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>
                      {slotTitles[slot]}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {meal.calories} kcal
                    </span>
                  </div>

                  <div style={{ position: 'relative', height: '160px' }}>
                    <ImageWithFallback 
                      src={meal.image_url} 
                      alt={meal.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {meal.kitchen_name}
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#111827' }}>
                      {meal.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '0 0 1rem', flex: 1, lineHeight: '1.4' }}>
                      {meal.description}
                    </p>

                    {/* Macro details */}
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#F8FAFC', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem' }}>
                      <span style={{ flex: 1, textAlign: 'center' }}><b>P:</b> {meal.protein_g}g</span>
                      <span style={{ flex: 1, textAlign: 'center' }}><b>C:</b> {meal.carbs_g}g</span>
                      <span style={{ flex: 1, textAlign: 'center' }}><b>F:</b> {meal.fat_g}g</span>
                    </div>

                    {/* Why this meal was recommended */}
                    {meal.rationale && (
                      <div style={{ fontSize: '0.78rem', color: '#065F46', background: '#F0FDF4', padding: '0.6rem', borderRadius: '0.5rem', marginBottom: '1rem', lineHeight: '1.3' }}>
                        <Info size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                        {meal.rationale}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                        onClick={() => {
                          if (meal.swap_options && meal.swap_options.length > 0) {
                            handleSwap(activeDayIndex, slot, meal.swap_options[0]);
                          } else {
                            alert('No alternative swap options available for this specific slot.');
                          }
                        }}
                      >
                        <RefreshCw size={14} style={{ marginRight: '4px' }} /> Swap
                      </button>

                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                        onClick={() => handleOrderMeal(meal)}
                      >
                        <ShoppingBag size={14} style={{ marginRight: '4px' }} /> ₹{meal.base_price}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription Callout Banner */}
      <div style={{ marginTop: '4rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '1.25rem', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>
            Hassle-Free Consistency
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400E', margin: '0.25rem 0 0.5rem' }}>
            Love these planned meals? Put your nutrition on auto-pilot.
          </h2>
          <p style={{ color: '#B45309', margin: 0, fontSize: '0.95rem', maxWidth: '650px' }}>
            Choose our 28-Day Working Professional Plan or Monday-to-Friday Student Plan. Daily rotating menus, skip-day extensions, and up to 25% savings compared to single orders.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          style={{ background: '#D97706', borderColor: '#D97706' }}
          onClick={() => navigate('/subscriptions')}
        >
          Explore Tiffin Subscriptions <ArrowRight size={18} style={{ marginLeft: '6px' }} />
        </button>
      </div>
    </div>
  );
}
