import React from 'react';
import { ShoppingBag, Star } from 'lucide-react';

const BAGS = [
  { id: 1, name: "Urban Explorer", price: 2499, img: "/catalog/example.png" },
  { id: 2, name: "Midnight Leather", price: 4999, img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500" },
];

function App() {
  const makePayment = async (price) => {
  try {
    // This tells React to talk to your Node.js server
    const response = await fetch('http://localhost:5001/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: price, // sending the bag price
      }),
    });

    const data = await response.json();
    console.log("Response from Server:", data);

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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
<nav className="bg-white shadow-md p-4 sticky top-0 z-50">
  <div className="max-w-6xl mx-auto flex justify-between items-center">
    
    {/* Left Side: Logo */}
    <div className="flex items-center gap-2">
      <ShoppingBag className="text-indigo-600" size={28} />
      <span className="text-2xl font-black tracking-tighter text-gray-900">KASVI BAGS</span>
    </div>

    {/* Right Side: Navigation Links & Cart */}
    <div className="flex items-center gap-8">
      <ul className="flex flex-column gap-6 text-sm font-semibold text-gray-600">
        <li className="hover:text-indigo-600 cursor-pointer transition-colors">SHOP</li>
        <li className="hover:text-indigo-600 cursor-pointer transition-colors">BLOG</li>
        <li className="hover:text-indigo-600 cursor-pointer transition-colors">ABOUT US</li>
      </ul>
      
      {/* Cart Button */}
      <button className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
        <ShoppingBag size={20} />
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
          0
        </span>
      </button>
    </div>

  </div>
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
             <button onClick={() => makePayment(bag.price)}>
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
