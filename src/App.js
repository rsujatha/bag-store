import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, ArrowRight, ArrowLeft, Tag, Layers, User } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthModal from './AuthModal';
import './App.css';
import { useCart } from './CartContext';
import CartDrawer from './CartDrawer';
import { useWishlist } from './WishlistContext';
import WishlistDrawer from './WishlistDrawer';

// ── Placeholder ───────────────────────────────────────────────────────────────
function PlaceholderImage({ name, className }) {
  return (
    <div className={`placeholder-img ${className || ''}`}>
      <ShoppingBag size={48} strokeWidth={1} />
      <span>{name}</span>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ currentPage, onNavigate }) {
  const [user, setUser]             = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCart, setShowCart]     = useState(false);
  const dropdownRef = useRef(null);
  const { totalItems } = useCart();
  const [showWishlist, setShowWishlist] = useState(false);
  const { totalWishlist } = useWishlist();

  const navItems = [
    { label: 'Shop',     hash: 'shop'     },
    { label: 'Blog',     hash: 'blog'     },
    { label: 'About Us', hash: 'about-us' },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="#home" className="navbar-logo"
             onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
            <div className="navbar-logo-icon-wrap">
              <img src="/images/kasvi-logo.jpeg" alt="" className="navbar-logo-img" />
            </div>
            <span className="navbar-logo-text" style={{ fontSize: '36px', fontWeight: 'bold' }}>KASVI</span>
          </a>

          <ul className="navbar-links">
            {navItems.map((item) => (
              <li key={item.hash}>
                <a href={`#${item.hash}`}
                   className={currentPage === item.hash ? 'active' : ''}
                   onClick={(e) => { e.preventDefault(); onNavigate(item.hash); }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <button className="navbar-action" onClick={() => setShowWishlist(true)}>
            <Heart size={18} /><span>Wishlist</span>
            {totalWishlist > 0 && <span className="navbar-badge">{totalWishlist}</span>}
          </button>

            {/* Bag button — opens cart drawer */}
            <button className="navbar-action" aria-label="Shopping bag"
              onClick={() => setShowCart(true)}>
              <ShoppingBag size={18} /><span>Bag</span>
              {totalItems > 0 && <span className="navbar-badge">{totalItems}</span>}
            </button>

            {user ? (
              <div className="user-menu" ref={dropdownRef}>
                <button className="navbar-action" onClick={() => setShowDropdown(!showDropdown)}>
                  <User size={18} />
                  <span>{user.displayName?.split(' ')[0] || 'Account'}</span>
                </button>
                {showDropdown && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <p className="user-dropdown-name">{user.displayName || 'User'}</p>
                      <p className="user-dropdown-email">{user.email}</p>
                    </div>
                    <button className="user-dropdown-item"
                      onClick={() => { setShowDropdown(false); onNavigate('orders'); }}>
                      📦 My Orders
                    </button>
                    <button className="user-dropdown-item signout"
                      onClick={() => { signOut(auth); setShowDropdown(false); }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="navbar-action" onClick={() => setShowModal(true)}>
                <User size={18} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      {showCart && <CartDrawer onClose={() => setShowCart(false)} onCheckout={() => { setShowCart(false); onNavigate('checkout'); }} />}
      {showWishlist && <WishlistDrawer onClose={() => setShowWishlist(false)} onNavigate={onNavigate} />}
    </>
  );
}
// ── Home ──────────────────────────────────────────────────────────────────────
function HomePage({ onNavigate }) {
  return (
    <header className="hero">
      <h2>Style with Purpose 2026</h2>
      <p>Quality bags for your everyday journey.</p>
      <button className="hero-cta" onClick={() => onNavigate('shop')}>
        Browse the Shop <ArrowRight size={16} />
      </button>
    </header>
  );
}

// ── Shop Card with hover image cycling ───────────────────────────────────────
function ProductCard({ product, allImages, onNavigate }) {
  const [imgIndex, setImgIndex] = useState(0);
  const intervalRef = useRef(null);

  const handleMouseEnter = () => {
    if (allImages.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % allImages.length);
    }, 1500);
  };

  const handleMouseLeave = () => {
    clearInterval(intervalRef.current);
    setImgIndex(0);
  };

  return (
    <div
      className="product-card"
      onClick={() => onNavigate('product', product.product_id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-image-stack">
        {allImages.length > 0
          ? allImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={product.product_name}
                className={`stack-img ${i === imgIndex ? 'visible' : ''}`}
              />
            ))
          : <PlaceholderImage name={product.product_name} />
        }
      </div>
      {allImages.length > 1 && (
        <div className="image-dots">
          {allImages.map((_, i) => (
            <span key={i} className={`dot ${i === imgIndex ? 'active' : ''}`} />
          ))}
        </div>
      )}
      <div className="product-card-body">
        <div className="product-card-header">
          <h3>{product.product_name}</h3>
          {!product.in_stock && <span className="out-of-stock-badge">Out of stock</span>}
        </div>
        <div className="product-meta">
          {product.category && (
            <span className="product-meta-tag"><Layers size={12} /> {product.category}</span>
          )}
        </div>
        <p className="product-price">₹{Number(product.price).toLocaleString('en-IN')}</p>
        <button className="view-button"
          onClick={(e) => { e.stopPropagation(); onNavigate('product', product.product_id); }}>
          View Details <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Shop Page ─────────────────────────────────────────────────────────────────
function ShopPage({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('All');

  useEffect(() => {
    fetch('/catalog.json')
      .then((r) => { if (!r.ok) throw new Error('Could not load catalog.json'); return r.json(); })
      .then((data) => { setProducts(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="page-status">Loading catalog…</div>;
  if (error)   return <div className="page-status error">⚠️ {error}</div>;
  if (!products.length) return <div className="page-status">No products found.</div>;

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const productMap = {};
  products.forEach((p) => {
    if (!productMap[p.product_id]) {
      productMap[p.product_id] = { ...p, _allImages: [] };
    }
    (p.images || []).forEach((img) => {
      if (!productMap[p.product_id]._allImages.includes(img)) {
        productMap[p.product_id]._allImages.push(img);
      }
    });
    if ((!productMap[p.product_id].images || productMap[p.product_id].images.length === 0)
        && p.images && p.images.length > 0) {
      productMap[p.product_id] = { ...productMap[p.product_id], ...p, _allImages: productMap[p.product_id]._allImages };
    }
  });

  const uniqueProducts = Object.values(productMap);
  const visible = filter === 'All' ? uniqueProducts : uniqueProducts.filter((p) => p.category === filter);

  return (
    <>
      <header className="shop-header">
        <h2>Shop</h2>
        <p>Explore our curated collection of handcrafted bags.</p>
      </header>
      <div className="filter-bar">
        {categories.map((cat) => (
          <button key={cat} className={`filter-pill ${filter === cat ? 'active' : ''}`}
                  onClick={() => setFilter(cat)}>{cat}</button>
        ))}
      </div>
      <main className="product-grid">
        {visible.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            allImages={product._allImages}
            onNavigate={onNavigate}
          />
        ))}
      </main>
    </>
  );
}

// ── Image Zoom Modal ─────────────────────────────────────────────────────────
function ImageZoomModal({ src, alt, onClose, onPrevious, onNext, hasPrevious, hasNext }) {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const maxZoom = 3;
  const minZoom = 1;

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.2, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.2, minZoom));
  };

  const handleReset = () => {
    setZoom(1);
  };

  // Keyboard navigation (arrow keys and ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext, hasPrevious, hasNext]);

  // Touch swipe support
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && hasNext) {
        onNext();
      } else if (diff < 0 && hasPrevious) {
        onPrevious();
      }
    }
    setTouchStart(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close" onClick={onClose} title="Press ESC to close">✕</button>

        {/* Zoom controls */}
        <div className="modal-controls">
          <button className="modal-btn" onClick={handleZoomOut} disabled={zoom === minZoom}>−</button>
          <span className="modal-zoom-level">{Math.round(zoom * 100)}%</span>
          <button className="modal-btn" onClick={handleZoomIn} disabled={zoom === maxZoom}>+</button>
          <button className="modal-btn" onClick={handleReset}>Reset</button>
        </div>

        {/* Image container */}
        <div className="modal-image-container">
          {isLoading && <div className="image-skeleton"></div>}
          <img
            src={src}
            alt={alt}
            className="modal-image"
            style={{ transform: `scale(${zoom})`, opacity: isLoading ? 0 : 1 }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </div>

        {/* Navigation arrows */}
        {hasPrevious && (
          <button className="modal-nav modal-nav-prev" onClick={onPrevious} title="Previous (← arrow key)">
            <ArrowLeft size={24} />
          </button>
        )}
        {hasNext && (
          <button className="modal-nav modal-nav-next" onClick={onNext} title="Next (→ arrow key)">
            <ArrowRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Image Gallery with Arrow Navigation ───────────────────────────────────────
function ImageGallery({ images, productName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomImageIndex, setZoomImageIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [lastDoubleTap, setLastDoubleTap] = useState(0);



  // const currentImage = images[currentIndex];
  const currentImage = images ? images[currentIndex] : null;


  const handlePrevious = () => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i + 1) % images.length);
  };

  const handleImageClick = () => {
    setZoomImageIndex(currentIndex);
  };

  const handleZoomPrevious = () => {
    setZoomImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const handleZoomNext = () => {
    setZoomImageIndex((i) => (i + 1) % images.length);
  };

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Touch swipe support
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    setTouchStart(null);
  };

  // Double-tap to zoom on mobile
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastDoubleTap < 300) {
      setZoomImageIndex(currentIndex);
    }
    setLastDoubleTap(now);
  };

  // Preload next and previous images
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % images.length;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    
    // Preload next image
    const nextImg = new Image();
    nextImg.src = images[nextIdx];
    
    // Preload previous image
    const prevImg = new Image();
    prevImg.src = images[prevIdx];
  }, [currentIndex, images]);
  if (!images || images.length === 0) {
    return <PlaceholderImage name={productName} className="large" />;
  }
  return (
    <>
      <div className="image-gallery-container">
        {/* Main image */}
        <div 
          className="gallery-main"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isLoading && <div className="image-skeleton"></div>}
          <img
            src={currentImage}
            alt={`${productName} ${currentIndex + 1}`}
            className="gallery-main-img"
            onClick={handleImageClick}
            onDoubleClick={handleDoubleTap}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            style={{ cursor: 'pointer', opacity: isLoading ? 0 : 1 }}
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className="gallery-arrow gallery-arrow-left"
                onClick={handlePrevious}
                aria-label="Previous image"
                title="Previous (← arrow key / swipe right)"
              >
                <ArrowLeft size={24} />
              </button>
              <button
                className="gallery-arrow gallery-arrow-right"
                onClick={handleNext}
                aria-label="Next image"
                title="Next (→ arrow key / swipe left)"
              >
                <ArrowRight size={24} />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="gallery-counter">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail dots */}
        {images.length > 1 && (
          <div className="gallery-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`View image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomImageIndex !== null && (
        <ImageZoomModal
          src={images[zoomImageIndex]}
          alt={`${productName} ${zoomImageIndex + 1}`}
          onClose={() => setZoomImageIndex(null)}
          onPrevious={handleZoomPrevious}
          onNext={handleZoomNext}
          hasPrevious={images.length > 1}
          hasNext={images.length > 1}
        />
      )}
    </>
  );
}

// ── Product Detail Page ───────────────────────────────────────────────────────
function ProductPage({ productId, onNavigate }) {
  const { addToCart } = useCart();
  const [variants, setVariants]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetch('/catalog.json')
      .then((r) => r.json())
      .then((data) => {
        const rows = data.filter((p) => String(p.product_id) === String(productId));
        setVariants(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="page-status">Loading…</div>;
  if (!variants.length) return <div className="page-status">Product not found.</div>;

  const activeVariant = variants[selectedVariantIdx];

  const optionGroups = [];
  const seenNames = {};
  variants.forEach((v, idx) => {
    const key = `${v.product_name}__${v.size}`;
    if (!seenNames[key]) {
      seenNames[key] = true;
      optionGroups.push({ variant: v, idx });
    }
  });

  const makePayment = async () => {
    try {
      const resp = await fetch('http://localhost:5001/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: activeVariant.price }),
      });
      const data = await resp.json();
      if (data.id) alert(`Order Created! ID: ${data.id}`);
      else alert('Server reached, but Razorpay keys are missing or invalid.');
    } catch {
      alert('Could not connect to the server.');
    }
  };

  return (
    <div className="product-detail">
      <button className="back-button" onClick={() => onNavigate('shop')}>
        <ArrowLeft size={16} /> Back to Shop
      </button>

      <div className="product-detail-inner">
        <div className="product-detail-image">
          <ImageGallery images={activeVariant.images} productName={activeVariant.product_name} />
        </div>

        <div className="product-detail-info">
          <span className="product-detail-category"><Tag size={13} /> {activeVariant.category}</span>
          <h2>{activeVariant.product_name}</h2>
          <p className="product-detail-price">₹{Number(activeVariant.price).toLocaleString('en-IN')}</p>

          {activeVariant.description && (
            <p className="product-detail-desc">{activeVariant.description}</p>
          )}

          <div className="variant-section">
            <p className="variant-label">Options</p>
            <div className="variant-options">
              {optionGroups.map(({ variant, idx }) => (
                <button
                  key={idx}
                  className={`variant-btn ${selectedVariantIdx === idx ? 'active' : ''}`}
                  onClick={() => setSelectedVariantIdx(idx)}
                >
                  {variant.product_name !== variants[0].product_name
                    ? `${variant.product_name} – ${variant.size}`
                    : variant.size}
                </button>
              ))}
            </div>
          </div>

          {activeVariant.color && (
            <div className="variant-section">
              <p className="variant-label">Color</p>
              <span className="product-meta-tag">{activeVariant.color}</span>
            </div>
          )}

          <div className="product-detail-stock">
            {activeVariant.in_stock
              ? <span className="in-stock">✓ In Stock</span>
              : <span className="out-of-stock">Out of Stock</span>}
          </div>
          <div className="product-detail-actions">
                <button
  className={`wishlist-heart-btn ${isInWishlist(activeVariant.product_id) ? 'active' : ''}`}
  onClick={() => toggleWishlist(activeVariant)}
>
  <Heart size={16} fill={isInWishlist(activeVariant.product_id) ? '#e74c7c' : 'none'} />
  {isInWishlist(activeVariant.product_id) ? 'Saved' : 'Wishlist'}
</button>
              <button
                className="add-to-cart-btn"
                disabled={!activeVariant.in_stock}
                onClick={() => {
                addToCart(activeVariant, activeVariant.size);
                }}
                >
    Add to Bag
  </button>
  <button className="buy-button" disabled={!activeVariant.in_stock} onClick={makePayment}>
    Buy Now
  </button>
</div>
        </div>
      </div>
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <section className="about-page">
      <div className="about-hero">
        <span className="about-tagline">Style with Purpose</span>
        <h2>Preserving a Legacy, One Koodai at a Time</h2>
        <p>Every KASVI bag carries a story woven by the skilled hands of women artisans from Tamil Nadu.</p>
      </div>
      <div className="about-content">
        <div className="about-section">
          <h3>The Craft</h3>
          <p>For generations, the women of Tamil Nadu have practiced the art of koodai weaving — a time-honoured handicraft passed down through families and communities.</p>
        </div>
        <div className="about-section">
          <h3>Sustainable by Nature</h3>
          <p>Each koodai is handcrafted from recycled plastics, giving new life to materials that would otherwise end up in landfills.</p>
        </div>
        <div className="about-section">
          <h3>Our Mission</h3>
          <p>At KASVI, we work directly with artisan communities across Tamil Nadu, ensuring fair wages and preserving the craft for future generations.</p>
        </div>
        <div className="about-values">
          <div className="about-value-card"><span className="about-value-number">100%</span><span className="about-value-label">Recycled Materials</span></div>
          <div className="about-value-card"><span className="about-value-number">10+</span><span className="about-value-label">Years of Durability</span></div>
          <div className="about-value-card"><span className="about-value-number">100+</span><span className="about-value-label">Women Artisans</span></div>
        </div>
      </div>
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPage(hash || 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page, productId = null) => {
    window.location.hash = page;
    setCurrentPage(page);
    setSelectedProductId(productId);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <Navbar currentPage={currentPage} onNavigate={navigate} />
      {currentPage === 'home'     && <HomePage onNavigate={navigate} />}
      {currentPage === 'shop'     && <ShopPage onNavigate={navigate} />}
      {currentPage === 'product'  && <ProductPage productId={selectedProductId} onNavigate={navigate} />}
      {currentPage === 'blog'     && <div className="placeholder-page"><h2>Blog</h2><p>Coming soon.</p></div>}
      {currentPage === 'about-us' && <AboutPage />}
    </div>
  );
}

export default App;
