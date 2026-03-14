// ── Admin Page ────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function AdminPage() {
  const ADMIN_PASSWORD = 'kasvi2026';
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null); // order id being updated

  const STATUS_FLOW = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  const STATUS_LABELS = {
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const STATUS_COLORS = {
    paid:       { bg: '#e8f5e9', color: '#2a7a2a' },
    processing: { bg: '#fff8e1', color: '#f57f17' },
    shipped:    { bg: '#e3f2fd', color: '#1565c0' },
    delivered:  { bg: '#ede7f6', color: '#4527a0' },
    cancelled:  { bg: '#fce4ec', color: '#c62828' },
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
    setLoading(false);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      loadOrders();
    } else {
      setPwError('Incorrect password.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setUpdating(null);
  };

  // ── Login Screen ──
  if (!authed) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h2>Admin Panel</h2>
          <p>Enter your password to continue</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="admin-input"
          />
          {pwError && <p className="admin-error">{pwError}</p>}
          <button className="admin-login-btn" onClick={handleLogin}>Sign In</button>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ──
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>All Orders</h2>
        <div className="admin-header-right">
          <span>{orders.length} orders</span>
          <button className="admin-refresh-btn" onClick={loadOrders}>↻ Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="page-status">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="page-status">No orders yet.</div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => {
            const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.paid;
            return (
              <div key={order.id} className="admin-order-card">
                {/* Order header */}
                <div className="admin-order-header">
                  <div>
                    <p className="order-date">
                      {order.created_at?.toDate
                        ? order.created_at.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Recent'}
                    </p>
                    <p className="order-id">ID: {order.id}</p>
                  </div>
                  <span className="order-status" style={{ background: statusColor.bg, color: statusColor.color }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                {/* Customer info */}
                <div className="admin-customer">
                  <div className="admin-customer-row">
                    <span className="admin-label">Name</span>
                    <span>{order.customer?.name}</span>
                  </div>
                  <div className="admin-customer-row">
                    <span className="admin-label">Phone</span>
                    <span>{order.customer?.phone}</span>
                  </div>
                  <div className="admin-customer-row">
                    <span className="admin-label">Email</span>
                    <span>{order.customer?.email || '—'}</span>
                  </div>
                  <div className="admin-customer-row">
                    <span className="admin-label">Address</span>
                    <span>{order.customer?.address}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="admin-items">
                  {order.items?.map((item, i) => (
                    <div key={i} className="admin-item">
                      <div className="order-item-img">
                        {item.image
                          ? <img src={item.image} alt={item.product_name} />
                          : <div className="order-item-placeholder">👜</div>
                        }
                      </div>
                      <div className="order-item-info">
                        <p className="order-item-name">{item.product_name}</p>
                        <p className="order-item-meta">Size: {item.size} · Qty: {item.quantity}</p>
                        <p className="order-item-price">₹{Number(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer — total + status update */}
                <div className="admin-order-footer">
                  <div className="order-total">
                    <span>Total</span>
                    <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="admin-status-update">
                    <span className="admin-label">Update Status</span>
                    <div className="admin-status-btns">
                      {STATUS_FLOW.map((status) => (
                        <button
                          key={status}
                          className={`admin-status-btn ${order.status === status ? 'current' : ''}`}
                          style={order.status === status ? { background: statusColor.bg, color: statusColor.color, borderColor: statusColor.color } : {}}
                          onClick={() => handleStatusChange(order.id, status)}
                          disabled={updating === order.id || order.status === status}
                        >
                          {updating === order.id && order.status !== status ? '…' : STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
