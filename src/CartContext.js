import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const LOCAL_CART_KEY = 'kasvi_cart';

function loadLocalCart() {
  try {
    const data = localStorage.getItem(LOCAL_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadLocalCart);
  const [user, setUser]           = useState(null);

  // ── Listen to auth state ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // User just logged in — merge local cart with Firestore cart
        const ref  = doc(db, 'carts', u.uid);
        const snap = await getDoc(ref);
        const firestoreCart = snap.exists() ? snap.data().items || [] : [];
        const localCart     = loadLocalCart();

        // Merge: add local items to firestore cart, combining quantities
        const merged = [...firestoreCart];
        localCart.forEach((localItem) => {
          const existing = merged.find(
            (i) => i.product_id === localItem.product_id && i.size === localItem.size
          );
          if (existing) {
            existing.quantity += localItem.quantity;
          } else {
            merged.push(localItem);
          }
        });

        setCartItems(merged);
        await setDoc(ref, { items: merged });
        localStorage.removeItem(LOCAL_CART_KEY); // clear local cart after merge
      } else {
        // User logged out — load from localStorage
        setCartItems(loadLocalCart());
      }
    });
    return unsub;
  }, []);

  // ── Persist cart whenever it changes ─────────────────────────────────────
  useEffect(() => {
    if (user) {
      const ref = doc(db, 'carts', user.uid);
      setDoc(ref, { items: cartItems });
    } else {
      saveLocalCart(cartItems);
    }
  }, [cartItems, user]);

  // ── Cart operations ───────────────────────────────────────────────────────
  const addToCart = (product, size, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === product.product_id && i.size === size
      );
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.product_id && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, {
        product_id:   product.product_id,
        product_name: product.product_name,
        size,
        price:        product.price,
        image:        (product.images && product.images[0]) || '',
        quantity,
      }];
    });
  };

  const removeFromCart = (product_id, size) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.product_id === product_id && i.size === size))
    );
  };

  const updateQuantity = (product_id, size, quantity) => {
    if (quantity < 1) {
      removeFromCart(product_id, size);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.product_id === product_id && i.size === size ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}
