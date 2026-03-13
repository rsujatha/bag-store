import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

const LOCAL_WISHLIST_KEY = 'kasvi_wishlist';

function loadLocalWishlist() {
  try {
    const data = localStorage.getItem(LOCAL_WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(items) {
  localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const wishlistItemsRef = useRef([]);

  // Keep ref in sync
  useEffect(() => {
    wishlistItemsRef.current = wishlistItems;
  }, [wishlistItems]);

  // ── Listen to auth state ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setLoading(true);
        setUser(u);

        const ref  = doc(db, 'wishlists', u.uid);
        const snap = await getDoc(ref);
        const firestoreItems = snap.exists() ? snap.data().items || [] : [];
        const localItems     = loadLocalWishlist();

        // Merge local + Firestore (deduplicate by product_id)
        const merged = [...firestoreItems];
        localItems.forEach((item) => {
          if (!merged.find((i) => i.product_id === item.product_id)) {
            merged.push(item);
          }
        });

        setWishlistItems(merged);
        localStorage.removeItem(LOCAL_WISHLIST_KEY);
        setLoading(false);
      } else {
        // Save current wishlist to localStorage before clearing
        saveLocalWishlist(wishlistItemsRef.current);
        setUser(null);
        setWishlistItems([]);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // ── Persist whenever wishlist changes (blocked during load) ───────────────
  useEffect(() => {
    if (loading) return;
    if (user) {
      const ref = doc(db, 'wishlists', user.uid);
      setDoc(ref, { items: wishlistItems }).catch(() => {});
    } else {
      saveLocalWishlist(wishlistItems);
    }
  }, [wishlistItems, user, loading]);

  // ── Wishlist operations ───────────────────────────────────────────────────
  const addToWishlist = (product) => {
    setWishlistItems((prev) => {
      if (prev.find((i) => i.product_id === product.product_id)) return prev;
      return [...prev, {
        product_id:   product.product_id,
        product_name: product.product_name,
        price:        product.price,
        image:        product.images?.[0] || null,
        category:     product.category,
      }];
    });
  };

  const removeFromWishlist = (product_id) => {
    setWishlistItems((prev) => prev.filter((i) => i.product_id !== product_id));
  };

  const isInWishlist = (product_id) => {
    return wishlistItems.some((i) => i.product_id === product_id);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product.product_id)) {
      removeFromWishlist(product.product_id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      totalWishlist: wishlistItems.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}
