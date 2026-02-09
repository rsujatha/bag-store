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
          <span className="navbar-logo-text">KASVI</span>
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
        <h2>Premium Collection 2026</h2>
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
        <p>Explore our curated collection of premium bags.</p>
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
      {currentPage === 'about-us' && (
        <div className="placeholder-page">
          <h2>About Us</h2>
          <p>Coming soon.</p>
        </div>
      )}
    </div>
  );
}

export default App;
