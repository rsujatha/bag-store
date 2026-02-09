import React from 'react';
import { ShoppingBag, Star, Heart, Search } from 'lucide-react';
import './App.css';

const BAGS = [
  { id: 1, name: "Urban Explorer", price: 2499, img: "/catalog/example.png" },
  { id: 2, name: "Midnight Leather", price: 4999, img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500" },
];

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <a href="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <ShoppingBag size={20} />
          </div>
          <span className="navbar-logo-text">Kasvi</span>
        </a>

        {/* Navigation Links */}
        <ul className="navbar-links">
          {['Bags', 'Luggage', 'Backpacks', 'Offers'].map((item) => (
            <li key={item}>
              <a href={`#${item.toLowerCase()}`}>{item}</a>
            </li>
          ))}
        </ul>

        {/* Search Bar */}
        <div className="navbar-search">
          <Search size={16} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Search products, brands..."
            aria-label="Search products"
          />
        </div>

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

function App() {
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
    <div>
      <Navbar />

      {/* Hero */}
      <header className="hero">
        <h2>Premium Collection 2026</h2>
        <p>Quality bags for your everyday journey.</p>
      </header>

      {/* Product Grid */}
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
    </div>
  );
}

export default App;
