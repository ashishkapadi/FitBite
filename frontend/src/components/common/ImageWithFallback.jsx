import React, { useState } from 'react';
import { resolveImageUrl } from '../../config/api';

export function ImageWithFallback({ src, alt, className, style, category = 'food' }) {
  const [hasError, setHasError] = useState(false);

  const resolvedSrc = resolveImageUrl(src);

  if (hasError || !resolvedSrc) {
    const isSample = category === 'sample' || category === 'thumb';
    return (
      <div
        className={className}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #ECFDF5 0%, #FEF3C7 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#065F46',
          border: '1px solid #E2E8F0',
          position: 'relative',
          overflow: 'hidden',
          padding: isSample ? '4px' : undefined
        }}
        aria-label={alt || 'FitBite Fresh Dish'}
      >
        <span style={{ fontSize: isSample ? '1.5rem' : '2.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', lineHeight: 1 }}>
          {category && category.toLowerCase().includes('breakfast') ? '🥞' :
           category && category.toLowerCase().includes('salad') ? '🥗' :
           category && category.toLowerCase().includes('chicken') ? '🍗' :
           category && category.toLowerCase().includes('dessert') ? '🍮' :
           category && category.toLowerCase().includes('biryani') ? '🍲' : '🍱'}
        </span>
        {!isSample && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', marginTop: '6px' }}>
            FitBite Kitchen Fresh
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || 'FitBite Dish'}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export default ImageWithFallback;
