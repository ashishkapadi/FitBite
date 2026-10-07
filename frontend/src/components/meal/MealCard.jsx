import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Star, Clock, Flame, Dumbbell, Plus, Sliders } from 'lucide-react';

export function MealCard({ meal, onSelectCustom }) {
  const { addToCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal({
        mode: 'signin',
        accountType: 'customer',
        action: () => addToCart({ meal_id: meal.id, quantity: 1 })
      });
      return;
    }
    await addToCart({ meal_id: meal.id, quantity: 1, portion: 'standard' });
  };

  const handleCustomizeClick = (e) => {
    e.stopPropagation();
    if (onSelectCustom) {
      onSelectCustom(meal);
    } else {
      navigate(`/build-meal?meal_id=${meal.id}`);
    }
  };

  const isVeg = (meal.dietary_tags || []).some(t => ['vegetarian', 'vegan', 'veg'].includes(t.toLowerCase()));
  const isHighProtein = (meal.protein_grams || 0) >= 20 || (meal.dietary_tags || []).some(t => t.toLowerCase().includes('protein'));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Food Image with Fallback */}
      <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden' }}>
        <ImageWithFallback
          src={meal.image_url}
          alt={meal.name}
          category={meal.cuisine || 'meal'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Dietary Marker Icon Top-Left */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#FFFFFF',
          borderRadius: '4px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: isVeg ? '50%' : '2px',
            backgroundColor: isVeg ? '#10B981' : '#EF4444',
            border: `1.5px solid ${isVeg ? '#065F46' : '#991B1B'}`
          }} />
        </div>

        {/* Rating Top-Right */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          color: '#FFFFFF',
          padding: '4px 8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <Star size={13} fill="#F59E0B" color="#F59E0B" />
          {meal.rating || 4.7}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Kitchen Name & Prep time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>
            {meal.seller_name || 'FitBite Partner Kitchen'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#64748B' }}>
            <Clock size={12} /> {meal.prep_time_minutes || 20}m
          </span>
        </div>

        {/* Title */}
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px', lineHeight: 1.3 }}>
          {meal.name}
        </h4>

        {/* Description */}
        <p style={{
          fontSize: '0.82rem',
          color: '#64748B',
          lineHeight: 1.45,
          marginBottom: '12px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {meal.description}
        </p>

        {/* Nutrition Badges (Calories & Protein) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {meal.calories && (
            <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.72rem' }}>
              <Flame size={12} /> {meal.calories} kcal
            </span>
          )}
          {meal.protein_grams && (
            <span className="badge badge-protein" style={{ fontSize: '0.72rem' }}>
              <Dumbbell size={12} /> {meal.protein_grams}g protein
            </span>
          )}
          {isHighProtein && (
            <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
              Fit Choice
            </span>
          )}
        </div>

        {/* Footer: Price & Action Buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Starting from</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              ₹{meal.base_price}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleCustomizeClick}
              className="btn btn-outline btn-sm"
              title="Customize with base, protein, sides & spice"
              style={{ padding: '6px 10px', borderRadius: '8px' }}
            >
              <Sliders size={15} color="#F97316" />
              <span style={{ color: '#F97316', fontWeight: 700 }}>Custom</span>
            </button>

            <button
              type="button"
              onClick={handleQuickAdd}
              className="btn btn-primary btn-sm"
              title="Quick Add standard meal to cart"
              style={{ padding: '6px 12px', borderRadius: '8px' }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
