import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Heart, ArrowRight } from 'lucide-react';
import './App.css';

const BAGS = [
  { id: 1, name: "Urban Explorer", price: 2499, img: "/catalog/example.png" },
  { id: 2, name: "Midnight Leather", price: 4999, img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500" },
];

function Navbar({ currentPage, onNavigate }) {
  const navItems = [
    { label: 'Shop', hash: 'shop' },
    { label: 'Blog', hash: 'blog' },
    { label: 'About Us', hash: 'about-us' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <a
          href="#home"
          className="navbar-logo"
          onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
        >
          <div className="navbar-logo-icon-wrap">
            <img src="/images/kasvi-logo.jpeg" alt="" className="navbar-logo-img" />
          </div>
<span 
  className="navbar-logo-text" 
  style={{ fontSize: '36px', fontWeight: 'bold' }}
>
  KASVI
</span>
       </a>

        {/* Navigation Links */}
        <ul className="navbar-links">
          {navItems.map((item) => (
            <li key={item.hash}>
              <a
                href={`#${item.hash}`}
                className={currentPage === item.hash ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); onNavigate(item.hash); }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Action Icons */}
        <div className="navbar-actions">
          <button className="navbar-action" aria-label="Wishlist">
            <Heart size={18} />
            <span>Wishlist</span>
          </button>

          <button className="navbar-action" aria-label="Shopping bag">
            <ShoppingBag size={18} />
            <span>Bag</span>
            <span className="navbar-badge">0</span>
          </button>
        </div>

      </div>
    </nav>
  );
}

function HomePage({ onNavigate }) {
  return (
    <>
      <header className="hero">
        <h2>Style with Purpose 2026</h2>
        <p>Quality bags for your everyday journey.</p>
        <button className="hero-cta" onClick={() => onNavigate('shop')}>
          Browse the Shop
          <ArrowRight size={16} />
        </button>
      </header>
    </>
  );
}

function ShopPage() {
  const makePayment = async (price) => {
    try {
      const response = await fetch('http://localhost:5001/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price }),
      });

      const data = await response.json();

      if (data.id) {
        alert(`Order Created Successfully! ID: ${data.id}`);
      } else {
        alert("Server reached, but Razorpay keys are missing or invalid.");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Could not connect to the server. Make sure node index.js is running!");
    }
  };

  return (
    <>
      <header className="shop-header">
        <h2>Shop</h2>
        <p>Explore our curated collection of handcrafted bags.</p>
      </header>

      <main className="product-grid">
        {BAGS.map(bag => (
          <div key={bag.id} className="product-card">
            <img src={bag.img} alt={bag.name} />
            <div className="product-card-body">
              <div className="product-card-header">
                <h3>{bag.name}</h3>
                <span className="product-rating">
                  <Star size={16} fill="currentColor" stroke="currentColor" />
                  4.8
                </span>
              </div>
              <p className="product-price">
                {'\u20B9'}{bag.price.toLocaleString()}
              </p>
              <button className="buy-button" onClick={() => makePayment(bag.price)}>
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}

function AboutPage() {
  return (
    <section className="about-page">
      <div className="about-hero">
        <span className="about-tagline">Style with Purpose</span>
        <h2>Preserving a Legacy, One Koodai at a Time</h2>
        <p>
          Every KASVI bag carries a story woven by the skilled hands of women artisans from Tamil Nadu.
        </p>
      </div>

      <div className="about-content">
        <div className="about-section">
          <h3>The Craft</h3>
          <p>
            For generations, the women of Tamil Nadu have practiced the art of koodai weaving
            &mdash; a time-honoured handicraft passed down through families and communities.
            These artisans possess an extraordinary skill that transforms simple materials into
            beautiful, functional works of art. They deserve the recognition and support to keep
            this living tradition thriving.
          </p>
        </div>

        <div className="about-section">
          <h3>Sustainable by Nature</h3>
          <p>
            Each koodai is handcrafted from recycled plastics, giving new life to materials that
            would otherwise end up in landfills. The result is a bag that is not only stunning
            but remarkably sturdy &mdash; built to last easily over 10 years of everyday use.
            When you carry a KASVI bag, you carry a choice for the planet.
          </p>
        </div>

        <div className="about-section">
          <h3>Our Mission</h3>
          <p>
            At KASVI, we believe style and sustainability are not at odds. We work directly with
            artisan communities across Tamil Nadu, ensuring fair wages and preserving the craft
            for future generations. Every purchase supports a woman artisan and her family,
            keeping this centuries-old tradition alive.
          </p>
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

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPage(hash || 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page) => {
    window.location.hash = page;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <Navbar currentPage={currentPage} onNavigate={navigate} />
      {currentPage === 'shop' && <ShopPage />}
      {currentPage === 'home' && <HomePage onNavigate={navigate} />}
      {currentPage === 'blog' && (
        <div className="placeholder-page">
          <h2>Blog</h2>
          <p>Coming soon.</p>
        </div>
      )}
      {currentPage === 'about-us' && <AboutPage />}
    </div>
  );
}

export default App;
