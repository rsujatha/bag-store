import React from 'react';
import { useCart } from './CartContext';
import './CartDrawer.css';

export default function CartDrawer({ onClose, onCheckout }) {
  const { cartItems, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="drawer-header">
          <h2>Your Bag ({totalItems})</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Empty state */}
        {cartItems.length === 0 ? (
          <div className="drawer-empty">
            <p>🛍️</p>
            <p>Your bag is empty</p>
            <button className="drawer-shop-btn" onClick={onClose}>Continue Shopping</button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="drawer-items">
              {cartItems.map((item) => (
                <div key={`${item.product_id}-${item.size}`} className="drawer-item">
                  {/* Image */}
                  <div className="drawer-item-img">
                    {item.image
                      ? <img src={item.image} alt={item.product_name} />
                      : <div className="drawer-item-placeholder">👜</div>
                    }
                  </div>

                  {/* Info */}
                  <div className="drawer-item-info">
                    <p className="drawer-item-name">{item.product_name}</p>
                    <p className="drawer-item-size">Size: {item.size}</p>
                    <p className="drawer-item-price">
                      ₹{Number(item.price).toLocaleString('en-IN')}
                    </p>

                    {/* Quantity controls */}
                    <div className="drawer-item-qty">
                      <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)}>+</button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button className="drawer-item-remove"
                    onClick={() => removeFromCart(item.product_id, item.size)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="drawer-footer">
              <div className="drawer-total">
                <span>Total</span>
                <span>₹{Number(totalPrice).toLocaleString('en-IN')}</span>
              </div>
              <button className="drawer-checkout-btn" onClick={onCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
