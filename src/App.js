import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, ArrowRight, ArrowLeft, Tag, Layers, User } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthModal from './AuthModal';
import './App.css';

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
// Replace the entire Navbar function in App.js with this:

function Navbar({ currentPage, onNavigate }) {
  const [user, setUser]             = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { label: 'Shop',     hash: 'shop'     },
    { label: 'Blog',     hash: 'blog'     },
    { label: 'About Us', hash: 'about-us' },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  // Close dropdown when clicking outside
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

          <div className="navbar-actions">
            <button className="navbar-action" aria-label="Wishlist">
              <Heart size={18} /><span>Wishlist</span>
            </button>

            <button className="navbar-action" aria-label="Shopping bag">
              <ShoppingBag size={18} /><span>Bag</span>
              <span className="navbar-badge">0</span>
            </button>

            {/* User menu */}
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

// ── Horizontal Image Gallery ──────────────────────────────────────────────────
function ImageGallery({ images, productName }) {
  if (!images || images.length === 0) {
    return <PlaceholderImage name={productName} className="large" />;
  }
  return (
    <div className="image-gallery">
      {images.map((src, i) => (
        <img key={i} src={src} alt={`${productName} ${i + 1}`} />
      ))}
    </div>
  );
}

// ── Product Detail Page ───────────────────────────────────────────────────────
function ProductPage({ productId, onNavigate }) {
  const [variants, setVariants]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

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

          <button className="buy-button" disabled={!activeVariant.in_stock} onClick={makePayment}>
            Buy Now
          </button>
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
