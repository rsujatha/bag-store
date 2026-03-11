import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
  const [wishlistItems, setWishlistItems] = useState(loadLocalWishlist);
  const [user, setUser] = useState(null);

  // ── Listen to auth state ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // User just logged in — merge local wishlist with Firestore wishlist
        const ref = doc(db, 'wishlists', u.uid);
        const snap = await getDoc(ref);
        const firestoreWishlist = snap.exists() ? snap.data().items || [] : [];
        const localWishlist = loadLocalWishlist();

        // Merge: combine wishlists, avoid duplicates
        const merged = [...firestoreWishlist];
        localWishlist.forEach((localItem) => {
          const exists = merged.find((i) => i.product_id === localItem.product_id);
          if (!exists) {
            merged.push(localItem);
          }
        });

        setWishlistItems(merged);
        await setDoc(ref, { items: merged });
        localStorage.removeItem(LOCAL_WISHLIST_KEY); // clear local wishlist after merge
      } else {
        // User logged out — load from localStorage
        setWishlistItems(loadLocalWishlist());
      }
    });
    return unsub;
  }, []);

  // ── Persist wishlist whenever it changes ─────────────────────────────────
  useEffect(() => {
    if (user) {
      const ref = doc(db, 'wishlists', user.uid);
      setDoc(ref, { items: wishlistItems });
    } else {
      saveLocalWishlist(wishlistItems);
    }
  }, [wishlistItems, user]);

  // ── Wishlist operations ──────────────────────────────────────────────────
  const addToWishlist = (product) => {
    setWishlistItems((prev) => {
      const exists = prev.find((i) => i.product_id === product.product_id);
      if (exists) return prev; // Already in wishlist
      return [...prev, {
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price,
        image: (product.images && product.images[0]) || '',
        addedAt: new Date().toISOString(),
      }];
    });
  };

  const removeFromWishlist = (product_id) => {
    setWishlistItems((prev) =>
      prev.filter((i) => i.product_id !== product_id)
    );
  };

  const isInWishlist = (product_id) => {
    return wishlistItems.some((i) => i.product_id === product_id);
  };

  const totalWishlistItems = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      totalWishlistItems,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}
