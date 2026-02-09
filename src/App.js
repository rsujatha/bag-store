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

<nav className="bg-white shadow-sm h-20 flex items-center sticky top-0 z-50 px-10">
  <div className="w-full flex items-center justify-between max-w-[1600px] mx-auto">
    
    {/* 1. Logo Section */}
    <div className="flex items-center gap-1 cursor-pointer pr-4">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <ShoppingBag className="text-white" size={24} />
      </div>
      <span className="text-xl font-black tracking-tight text-gray-800">KASVI</span>
    </div>

    {/* 2. Navigation Links (Myntra style) */}
    <ul className="hidden lg:flex items-center h-20 gap-8 ml-4">
      {['BAGS', 'LUGGAGE', 'BACKPACKS', 'OFFERS'].map((item) => (
        <li key={item} className="h-full flex items-center border-b-4 border-transparent hover:border-indigo-600 transition-all cursor-pointer">
          <span className="text-xs font-bold text-gray-700 tracking-widest">{item}</span>
        </li>
      ))}
    </ul>

    {/* 3. Search Bar (The Myntra Look) */}
    <div className="flex-1 max-w-md mx-8 hidden md:block">
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search for products, brands and more" 
          className="w-full bg-gray-100 border border-transparent focus:border-gray-200 focus:bg-white py-2 pl-10 pr-4 rounded text-sm outline-none transition-all"
        />
        <svg className="absolute left-3 top-2.5 text-gray-400" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>
    </div>

    {/* 4. Action Icons (Right Side) */}
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center cursor-pointer group">
        <Star size={18} className="text-gray-700 group-hover:text-black" />
        <span className="text-[10px] font-bold mt-1">Wishlist</span>
      </div>
      
      <div className="flex flex-col items-center cursor-pointer group relative">
        <ShoppingBag size={18} className="text-gray-700 group-hover:text-black" />
        <span className="text-[10px] font-bold mt-1">Bag</span>
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
      </div>
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
