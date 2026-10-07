import React from 'react';
import { useCart } from '../../context/CartContext';
import { AlertCircle } from 'lucide-react';

export function CartConflictModal() {
  const { conflictModalData, confirmReplaceCart, cancelConflict } = useCart();

  if (!conflictModalData) return null;

  return (
    <div className="modal-backdrop" onClick={cancelConflict}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="conflict-title">
        <div style={{ padding: '28px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <AlertCircle size={32} />
          </div>

          <h3 id="conflict-title" style={{ fontSize: '1.25rem', marginBottom: '10px' }}>
            Replace cart with new kitchen?
          </h3>

          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
            {conflictModalData.message}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={cancelConflict}
              className="btn btn-outline"
              style={{ flex: 1 }}
            >
              Keep Existing Cart
            </button>
            <button
              onClick={confirmReplaceCart}
              className="btn btn-accent"
              style={{ flex: 1 }}
            >
              Clear &amp; Add New Meal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartConflictModal;
