import React, { useState } from 'react';
import { useCart } from './CartContext';
import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './CartDrawer.css';

const SERVER_URL = '';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CartDrawer({ onClose }) {
  const { cartItems, removeFromCart, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  const [step, setStep] = useState('cart');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [formError, setFormError] = useState('');
  const [paying, setPaying] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Please enter your name.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email address.';
    if (!/^\d{10}$/.test(form.phone.trim())) return 'Please enter a valid 10-digit phone number.';
    if (!form.address.trim()) return 'Please enter your delivery address.';
    return null;
  };

  const saveOrderToFirestore = async (paymentId, razorpayOrderId) => {
    try {
      const user = auth.currentUser;
      const orderData = {
        payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          size: item.size,
          price: item.price,
          quantity: item.quantity,
          image: item.image || '',
        })),
        total: totalPrice,
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
        status: 'paid',
        created_at: serverTimestamp(),
        uid: user ? user.uid : 'guest',
      };

      const ref = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(ref.id);
      return ref;  
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  };

  const handlePayNow = async () => {
    const error = validateForm();
    if (error) { setFormError(error); return; }

    setPaying(true);

    const loaded = await loadRazorpay();
    if (!loaded) {
      setFormError('Failed to load payment gateway. Please check your connection.');
      setPaying(false);
      return;
    }

    try {
      const resp = await fetch(`${SERVER_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice }),
      });
      const order = await resp.json();

      if (!order.id) {
        setFormError('Could not create order. Please try again.');
        setPaying(false);
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Kasvi Bags',
        description: `${totalItems} item(s)`,
        order_id: order.id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: '#4A2B4D' },
        handler: async (response) => {
          try {
            const verifyResp = await fetch(`${SERVER_URL}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyResp.json();
if (verifyData.success) {
  const ref = await saveOrderToFirestore(response.razorpay_payment_id, response.razorpay_order_id);
  // Send email notification
  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      customerAddress: form.address,
      items: cartItems,
      total: totalPrice,
      orderId: ref?.id || '',
    }),
  });
  clearCart();
  setStep('success');
} else {
              setFormError('Payment verification failed. Please contact support.');
            }
          } catch {
            setFormError('Could not verify payment. Please contact support.');
          }
          setPaying(false);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch {
      setFormError('Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="drawer-header">
          {step === 'form' && (
            <button className="drawer-back" onClick={() => setStep('cart')}>← Back</button>
          )}
          <h2>
            {step === 'cart' && `Your Bag (${totalItems})`}
            {step === 'form' && 'Checkout'}
            {step === 'success' && 'Order Placed!'}
          </h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* ── CART STEP ── */}
        {step === 'cart' && (
          <>
            {cartItems.length === 0 ? (
              <div className="drawer-empty">
                <p>🛍️</p>
                <p>Your bag is empty</p>
                <button className="drawer-shop-btn" onClick={onClose}>Continue Shopping</button>
              </div>
            ) : (
              <>
                <div className="drawer-items">
                  {cartItems.map((item) => (
                    <div key={`${item.product_id}-${item.size}`} className="drawer-item">
                      <div className="drawer-item-img">
                        {item.image
                          ? <img src={item.image} alt={item.product_name} />
                          : <div className="drawer-item-placeholder">👜</div>
                        }
                      </div>
                      <div className="drawer-item-info">
                        <p className="drawer-item-name">{item.product_name}</p>
                        <p className="drawer-item-size">Size: {item.size}</p>
                        <p className="drawer-item-price">₹{Number(item.price).toLocaleString('en-IN')}</p>
                        <div className="drawer-item-qty">
                          <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <button className="drawer-item-remove"
                        onClick={() => removeFromCart(item.product_id, item.size)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="drawer-footer">
                  <div className="drawer-total">
                    <span>Total</span>
                    <span>₹{Number(totalPrice).toLocaleString('en-IN')}</span>
                  </div>
                  <button className="drawer-checkout-btn" onClick={() => setStep('form')}>
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── FORM STEP ── */}
        {step === 'form' && (
          <div className="drawer-form">
            <div className="drawer-order-summary">
              <p className="drawer-summary-label">Order Summary</p>
              {cartItems.map((item) => (
                <div key={`${item.product_id}-${item.size}`} className="drawer-summary-item">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>₹{Number(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="drawer-summary-total">
                <span>Total</span>
                <span>₹{Number(totalPrice).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="drawer-form-section-label">Delivery Details</p>

            <div className="drawer-field">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="Your name"
                value={form.name} onChange={handleFormChange} />
            </div>

            <div className="drawer-field">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="your@email.com"
                value={form.email} onChange={handleFormChange} />
            </div>

            <div className="drawer-field">
              <label>Phone Number</label>
              <input type="tel" name="phone" placeholder="10-digit mobile number"
                value={form.phone} onChange={handleFormChange} maxLength={10} />
            </div>

            <div className="drawer-field">
              <label>Delivery Address</label>
              <textarea name="address" placeholder="House no, Street, City, State, PIN"
                value={form.address} onChange={handleFormChange} rows={3} />
            </div>

            {formError && <p className="drawer-form-error">{formError}</p>}

            <button className="drawer-checkout-btn" onClick={handlePayNow} disabled={paying}>
              {paying ? 'Processing…' : `Pay ₹${Number(totalPrice).toLocaleString('en-IN')}`}
            </button>
          </div>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === 'success' && (
          <div className="drawer-success">
            <div className="drawer-success-icon">✓</div>
            <h3>Thank you for your order!</h3>
            <p>Your payment was successful. We'll be in touch soon with your delivery details.</p>
            {orderId && <p style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>Order ID: {orderId}</p>}
            <button className="drawer-shop-btn" onClick={onClose}>Continue Shopping</button>
          </div>
        )}

      </div>
    </div>
  );
}
