import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from './WishlistContext';
import './WishlistDrawer.css';

export default function WishlistDrawer({ onClose, onNavigate }) {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="drawer-header">
          <h2>Wishlist ({wishlistItems.length})</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="drawer-empty">
            <p>🤍</p>
            <p>Your wishlist is empty</p>
            <button className="drawer-shop-btn" onClick={onClose}>Browse Shop</button>
          </div>
        ) : (
          <div className="drawer-items">
            {wishlistItems.map((item) => (
              <div key={item.product_id} className="drawer-item">
                <div className="drawer-item-img"
                  onClick={() => { onClose(); onNavigate('product', item.product_id); }}
                  style={{ cursor: 'pointer' }}>
                  {item.image
                    ? <img src={item.image} alt={item.product_name} />
                    : <div className="drawer-item-placeholder">👜</div>
                  }
                </div>
                <div className="drawer-item-info">
                  <p className="drawer-item-name"
                    onClick={() => { onClose(); onNavigate('product', item.product_id); }}
                    style={{ cursor: 'pointer' }}>
                    {item.product_name}
                  </p>
                  {item.category && <p className="drawer-item-size">{item.category}</p>}
                  <p className="drawer-item-price">₹{Number(item.price).toLocaleString('en-IN')}</p>
                  <button className="wishlist-view-btn"
                    onClick={() => { onClose(); onNavigate('product', item.product_id); }}>
                    View Product
                  </button>
                </div>
                <button className="drawer-item-remove"
                  onClick={() => removeFromWishlist(item.product_id)}
                  title="Remove from wishlist">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
