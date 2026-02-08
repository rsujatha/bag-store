import React from 'react';
import { ShoppingBag, Star } from 'lucide-react';

const BAGS = [
  { id: 1, name: "Urban Explorer", price: 2499, img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500" },
  { id: 2, name: "Midnight Leather", price: 4999, img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500" },
];

function App() {
  const handlePayment = (price) => {
    alert(`Redirecting to Razorpay for ₹${price}... (Backend setup needed next!)`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="text-indigo-600" /> BAGGS
        </h1>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium">Cart (0)</button>
      </nav>

      {/* Hero */}
      <header className="py-12 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900">Premium Collection 2026</h2>
        <p className="text-gray-500 mt-2">Quality bags for your everyday journey.</p>
      </header>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
        {BAGS.map(bag => (
          <div key={bag.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
            <img src={bag.img} alt={bag.name} className="w-full h-64 object-cover" />
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{bag.name}</h3>
                <span className="flex items-center text-yellow-500"><Star size={16} fill="currentColor"/> 4.8</span>
              </div>
              <p className="text-2xl font-black mt-4 text-indigo-600">₹{bag.price}</p>
              <button 
                onClick={() => handlePayment(bag.price)}
                className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors"
              >
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
