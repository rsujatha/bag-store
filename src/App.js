import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, ArrowRight, ArrowLeft, Tag, Layers } from 'lucide-react';
import './App.css';

// ── Placeholder image when no image_url is provided ─────────────────────────
function PlaceholderImage({ name, className }) {
  return (
    <div className={`placeholder-img ${className || ''}`}>
      <ShoppingBag size={48} strokeWidth={1} />
      <span>{name}</span>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ currentPage, onNavigate }) {
  const navItems = [
    { label: 'Shop',     hash: 'shop'     },
    { label: 'Blog',     hash: 'blog'     },
    { label: 'About Us', hash: 'about-us' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="#home" className="navbar-logo"
           onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
          <div className="navbar-logo-icon-wrap">
            <img src="/images/kasvi-logo.jpeg" alt="" className="navbar-logo-img" />
          </div>
          <span className="navbar-logo-text" style={{ fontSize: '36px', fontWeight: 'bold' }}>
            KASVI
          </span>
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
        </div>
      </div>
    </nav>
  );
}

// ── Home Page ────────────────────────────────────────────────────────────────
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

// ── Shop Page ────────────────────────────────────────────────────────────────
function ShopPage({ onNavigate }) {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filter, setFilter]       = useState('All');

  useEffect(() => {
    fetch('/catalog.json')
      .then((r) => {
        if (!r.ok) throw new Error('Could not load catalog.json');
        return r.json();
      })
      .then((data) => { setProducts(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="page-status">Loading catalog…</div>;
  if (error)   return <div className="page-status error">⚠️ {error}</div>;
  if (!products.length) return <div className="page-status">No products found.</div>;

  // Unique categories for filter bar
  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Deduplicate by product_id — show one card per unique product
  const seen = new Set();
  const uniqueProducts = products.filter((p) => {
    if (seen.has(p.product_id)) return false;
    seen.add(p.product_id);
    return true;
  });

  const visible = filter === 'All'
    ? uniqueProducts
    : uniqueProducts.filter((p) => p.category === filter);

  return (
    <>
      <header className="shop-header">
        <h2>Shop</h2>
        <p>Explore our curated collection of handcrafted bags.</p>
      </header>

      {/* Category filter pills */}
      <div className="filter-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-pill ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="product-grid">
        {visible.map((product) => (
          <div key={product.product_id} className="product-card"
               onClick={() => onNavigate('product', product.product_id)}>

            {/* Image / Placeholder */}
            {product.image_url
              ? <img src={product.image_url} alt={product.product_name} />
              : <PlaceholderImage name={product.product_name} />
            }

            <div className="product-card-body">
              <div className="product-card-header">
                <h3>{product.product_name}</h3>
                {!product.in_stock && (
                  <span className="out-of-stock-badge">Out of stock</span>
                )}
              </div>

              <div className="product-meta">
                {product.category && (
                  <span className="product-meta-tag">
                    <Layers size={12} /> {product.category}
                  </span>
                )}
              </div>

              <p className="product-price">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>

              <button
                className="view-button"
                onClick={(e) => { e.stopPropagation(); onNavigate('product', product.product_id); }}
              >
                View Details <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}

// ── Product Detail Page ──────────────────────────────────────────────────────
function ProductPage({ productId, onNavigate }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    fetch('/catalog.json')
      .then((r) => r.json())
      .then((data) => {
        const rows = data.filter(
          (p) => String(p.product_id) === String(productId)
        );
        setVariants(rows);
        if (rows.length) {
          setSelectedSize(rows[0].size   || null);
          setSelectedColor(rows[0].color || null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="page-status">Loading…</div>;
  if (!variants.length) return <div className="page-status">Product not found.</div>;

  const product  = variants[0];
  const sizes    = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const colors   = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  // Find the variant matching selected size + color
  const activeVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  ) || variants[0];

  const makePayment = async () => {
    try {
      const response = await fetch('http://localhost:5001/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: activeVariant.price }),
      });
      const data = await response.json();
      if (data.id) {
        alert(`Order Created! ID: ${data.id}`);
      } else {
        alert('Server reached, but Razorpay keys are missing or invalid.');
      }
    } catch {
      alert('Could not connect to the server.');
    }
  };

  return (
    <div className="product-detail">
      {/* Back button */}
      <button className="back-button" onClick={() => onNavigate('shop')}>
        <ArrowLeft size={16} /> Back to Shop
      </button>

      <div className="product-detail-inner">

        {/* Image */}
        <div className="product-detail-image">
          {activeVariant.image_url
            ? <img src={activeVariant.image_url} alt={product.product_name} />
            : <PlaceholderImage name={product.product_name} className="large" />
          }
        </div>

        {/* Info */}
        <div className="product-detail-info">
          <span className="product-detail-category">
            <Tag size={13} /> {product.category}
          </span>
          <h2>{product.product_name}</h2>

          <p className="product-detail-price">
            ₹{Number(activeVariant.price).toLocaleString('en-IN')}
          </p>

          {product.description && (
            <p className="product-detail-desc">{product.description}</p>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div className="variant-section">
              <p className="variant-label">Size</p>
              <div className="variant-options">
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`variant-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selector */}
          {colors.length > 0 && (
            <div className="variant-section">
              <p className="variant-label">Color</p>
              <div className="variant-options">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`variant-btn ${selectedColor === c ? 'active' : ''}`}
                    onClick={() => setSelectedColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail-stock">
            {activeVariant.in_stock
              ? <span className="in-stock">✓ In Stock</span>
              : <span className="out-of-stock">Out of Stock</span>
            }
          </div>

          <button
            className="buy-button"
            disabled={!activeVariant.in_stock}
            onClick={makePayment}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── About Page ───────────────────────────────────────────────────────────────
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
          <div className="about-value-card">
            <span className="about-value-number">100%</span>
            <span className="about-value-label">Recycled Materials</span>
          </div>
          <div className="about-value-card">
            <span className="about-value-number">10+</span>
            <span className="about-value-label">Years of Durability</span>
          </div>
          <div className="about-value-card">
            <span className="about-value-number">100+</span>
            <span className="about-value-label">Women Artisans</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── App root ─────────────────────────────────────────────────────────────────
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
