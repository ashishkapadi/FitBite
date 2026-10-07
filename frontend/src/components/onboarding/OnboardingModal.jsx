import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Dumbbell, Coffee, Calendar, Users, User } from 'lucide-react';

export function OnboardingModal() {
  const { isOnboardingModalOpen, closeOnboardingModal, completeOnboardingSuccess } = useAuth();

  const [step, setStep] = useState(1);
  const [livingSituation, setLivingSituation] = useState(''); // 'solo_bachelor' | 'family'
  const [routineType, setRoutineType] = useState('wellness_focused'); // 'wellness_focused' | 'chill_convenient'
  const [primaryInterest, setPrimaryInterest] = useState('tiffin_subscriptions'); // 'tiffin_subscriptions' | 'regular_meals'
  const [tiffinSchedule, setTiffinSchedule] = useState('working_professional'); // 'working_professional' | 'student'

  // Preferences
  const [goal, setGoal] = useState('muscle_gain');
  const [dietaryPreference, setDietaryPreference] = useState('vegetarian');
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedCuisines, setSelectedCuisines] = useState(['North Indian', 'Maharashtrian']);
  const [spicePreference, setSpicePreference] = useState('medium');
  const [budgetPerMeal, setBudgetPerMeal] = useState(160);
  const [portion, setPortion] = useState('standard');
  const [loading, setLoading] = useState(false);

  if (!isOnboardingModalOpen) return null;

  const allergyOptions = ['Peanuts', 'Dairy/Lactose', 'Gluten', 'Soy', 'Eggs', 'Shellfish'];
  const cuisineOptions = ['North Indian', 'South Indian', 'Maharashtrian', 'Balanced Bowls', 'Continental'];

  const toggleAllergy = (item) => {
    if (selectedAllergies.includes(item)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== item));
    } else {
      setSelectedAllergies([...selectedAllergies, item]);
    }
  };

  const toggleCuisine = (item) => {
    if (selectedCuisines.includes(item)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== item));
    } else {
      setSelectedCuisines([...selectedCuisines, item]);
    }
  };

  const handleFinish = async (isFamily = false) => {
    setLoading(true);
    try {
      const payload = {
        living_situation: isFamily ? 'family' : livingSituation,
        routine_type: isFamily ? 'chill_convenient' : routineType,
        primary_interest: isFamily ? 'regular_meals' : primaryInterest,
        default_delivery_slot: 'both',
        preferences: {
          goal: isFamily ? 'balanced_eating' : goal,
          dietary_preference: dietaryPreference,
          allergies: selectedAllergies,
          avoid_ingredients: [],
          preferred_cuisines: selectedCuisines,
          spice_preference: spicePreference,
          budget_per_meal: budgetPerMeal,
          preferred_portion: portion
        }
      };

      const token = localStorage.getItem('fitbite_token');
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        completeOnboardingSuccess(data.profile, data.preferences);
      }
    } catch (err) {
      console.error('Onboarding save error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Living Situation
  const renderStep1 = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '2.5rem' }}>🏡</span>
        <h3 style={{ fontSize: '1.4rem', marginTop: '10px' }}>Who do you live with?</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
          We tailor portions, meal plans, and options to fit your household routine.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <button
          type="button"
          onClick={() => {
            setLivingSituation('solo_bachelor');
            setStep(2);
          }}
          style={{
            padding: '24px 16px',
            borderRadius: '16px',
            border: '2px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            textAlign: 'center',
            transition: 'all 200ms ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.backgroundColor = '#F0FDF4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#ECFDF5',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <User size={28} />
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Living Solo / Bachelor</h4>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Single portions, gym macros &amp; monthly tiffin packages
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setLivingSituation('family');
            handleFinish(true); // Direct family flow: bypass bachelor steps
          }}
          style={{
            padding: '24px 16px',
            borderRadius: '16px',
            border: '2px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            textAlign: 'center',
            transition: 'all 200ms ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.backgroundColor = '#FFF7ED'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FFF7ED',
            color: '#F97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Users size={28} />
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>With Family</h4>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Family combos, multi-person thalis &amp; diverse dinner menus
          </p>
        </button>
      </div>
    </div>
  );

  // Step 2: Daily Routine
  const renderStep2 = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '2.5rem' }}>⚡</span>
        <h3 style={{ fontSize: '1.4rem', marginTop: '10px' }}>How would you describe your daily routine?</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
          Choose your lifestyle vibe. You can adjust this anytime.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
        <button
          type="button"
          onClick={() => { setRoutineType('wellness_focused'); setStep(3); }}
          style={{
            padding: '18px',
            borderRadius: '14px',
            border: `2px solid ${routineType === 'wellness_focused' ? '#10B981' : '#E2E8F0'}`,
            backgroundColor: routineType === 'wellness_focused' ? '#F0FDF4' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'left'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '3px' }}>Gym &amp; Wellness Focused 💪</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              I track protein and calories. Give me macro targets and clean nutrition.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setRoutineType('chill_convenient'); setStep(3); }}
          style={{
            padding: '18px',
            borderRadius: '14px',
            border: `2px solid ${routineType === 'chill_convenient' ? '#F97316' : '#E2E8F0'}`,
            backgroundColor: routineType === 'chill_convenient' ? '#FFF7ED' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'left'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFF7ED', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '3px' }}>Chill &amp; Convenient 🍕</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Keep meals simple, tasty, and hassle-free without overthinking.
            </p>
          </div>
        </button>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setStep(1)} className="btn btn-ghost">
          <ChevronLeft size={18} /> Back
        </button>
      </div>
    </div>
  );

  // Step 3: What are you looking for mostly?
  const renderStep3 = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ fontSize: '2.5rem' }}>🍱</span>
        <h3 style={{ fontSize: '1.4rem', marginTop: '10px' }}>What are you looking for mostly?</h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
          This sets your default dashboard. You can switch anytime.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
        <button
          type="button"
          onClick={() => { setPrimaryInterest('tiffin_subscriptions'); setStep(4); }}
          style={{
            padding: '18px',
            borderRadius: '14px',
            border: '2px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'left'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '3px' }}>Tiffin Services &amp; Subscriptions</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Daily rotating lunch &amp; dinner dabbas delivered automatically.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setPrimaryInterest('regular_meals'); setStep(5); }}
          style={{
            padding: '18px',
            borderRadius: '14px',
            border: '2px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'left'
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFF7ED', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '3px' }}>Regular / Flexible Instant Orders</h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
              Order on-demand whenever hunger strikes.
            </p>
          </div>
        </button>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setStep(2)} className="btn btn-ghost">
          <ChevronLeft size={18} /> Back
        </button>
      </div>
    </div>
  );

  // Step 4: Tiffin Schedule Selection
  const renderStep4 = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '2.5rem' }}>🗓️</span>
        <h3 style={{ fontSize: '1.35rem', marginTop: '8px' }}>Which schedule fits your routine best?</h3>
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
          Transparent pricing and skip policies included upfront.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
        {/* Working Professional */}
        <div
          onClick={() => setTiffinSchedule('working_professional')}
          style={{
            padding: '16px',
            borderRadius: '14px',
            border: `2px solid ${tiffinSchedule === 'working_professional' ? '#10B981' : '#E2E8F0'}`,
            backgroundColor: tiffinSchedule === 'working_professional' ? '#F0FDF4' : '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h4 style={{ fontSize: '1rem' }}>🏢 Working Professional Plan</h4>
            <span className="badge badge-veg">28 Calendar Days</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '6px' }}>
            Daily meals 7 days a week, including weekends. Allows up to 2 flexible skip-days that extend your end date!
          </p>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>
            ₹106 / meal (15% Subscriber Discount)
          </span>
        </div>

        {/* Student Plan */}
        <div
          onClick={() => setTiffinSchedule('student')}
          style={{
            padding: '16px',
            borderRadius: '14px',
            border: `2px solid ${tiffinSchedule === 'student' ? '#10B981' : '#E2E8F0'}`,
            backgroundColor: tiffinSchedule === 'student' ? '#F0FDF4' : '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h4 style={{ fontSize: '1rem' }}>🎒 Student Pocket Saver Plan</h4>
            <span className="badge badge-accent">Mon - Fri Only</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '6px' }}>
            Weekdays only. Weekends automatically excluded. Pay only for the actual ~22 scheduled weekdays.
          </p>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#C2410C' }}>
            ₹79 / meal (20% Student Discount)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setStep(3)} className="btn btn-ghost">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={() => setStep(5)} className="btn btn-primary">
          Next: Preferences <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  // Step 5: Diet & Preferences
  const renderStep5 = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🎯</span>
        <h3 style={{ fontSize: '1.35rem', marginTop: '6px' }}>Personalize Your Nutrition</h3>
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
          FitBite uses this to generate your personalized 7-day meal plan.
        </p>
      </div>

      <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Goal */}
        <div className="form-group">
          <label className="form-label">Primary Health Goal</label>
          <select className="form-select" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="balanced_eating">Balanced Homestyle Eating</option>
            <option value="muscle_gain">Muscle Gain &amp; High Protein 💪</option>
            <option value="weight_management">Weight Management &amp; Lean Calorie Control</option>
            <option value="convenience">Pure Convenience &amp; Daily Comfort</option>
          </select>
        </div>

        {/* Dietary Preference */}
        <div className="form-group">
          <label className="form-label">Dietary Preference</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {['vegetarian', 'vegan', 'eggetarian', 'non_vegetarian'].map((diet) => (
              <button
                key={diet}
                type="button"
                onClick={() => setDietaryPreference(diet)}
                className={`btn btn-sm ${dietaryPreference === diet ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {diet.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="form-group">
          <label className="form-label">Allergies to Avoid</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {allergyOptions.map((alg) => (
              <button
                key={alg}
                type="button"
                onClick={() => toggleAllergy(alg)}
                className={`badge ${selectedAllergies.includes(alg) ? 'badge-protein' : 'badge-veg'}`}
                style={{ padding: '6px 12px', cursor: 'pointer', border: '1px solid #CBD5E1' }}
              >
                {selectedAllergies.includes(alg) ? '✕ ' : '+ '} {alg}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Cuisines */}
        <div className="form-group">
          <label className="form-label">Preferred Cuisines</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {cuisineOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                className={`badge ${selectedCuisines.includes(c) ? 'badge-accent' : 'badge-veg'}`}
                style={{ padding: '6px 12px', cursor: 'pointer', border: '1px solid #CBD5E1' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Spice Level */}
        <div className="form-group">
          <label className="form-label">Spice Preference: {spicePreference.toUpperCase()}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['mild', 'medium', 'spicy'].map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSpicePreference(sp)}
                className={`btn btn-sm ${spicePreference === sp ? 'btn-accent' : 'btn-outline'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setStep(primaryInterest === 'tiffin_subscriptions' ? 4 : 3)} className="btn btn-ghost">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={() => handleFinish(false)} disabled={loading} className="btn btn-primary">
          {loading ? 'Personalizing...' : 'Complete & Unlock Marketplace 🎉'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={closeOnboardingModal} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '28px' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B', marginBottom: '6px' }}>
            <span>Step {step} of 5</span>
            <span>Customer Setup</span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                backgroundColor: '#10B981',
                width: `${(step / 5) * 100}%`,
                transition: 'width 250ms ease'
              }}
            />
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}

export default OnboardingModal;
