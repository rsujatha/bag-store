import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [uid, setUid] = useState(null);

  // Load from localStorage for guests
  useEffect(() => {
    const stored = localStorage.getItem('kasvi_wishlist');
    if (stored) {
      try { setWishlistItems(JSON.parse(stored)); } catch {}
    }
  }, []);

  // Auth state — sync with Firestore for logged-in users
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const ref = doc(db, 'wishlists', user.uid);
        const snap = await getDoc(ref);
        const local = JSON.parse(localStorage.getItem('kasvi_wishlist') || '[]');
        if (snap.exists()) {
          const firestoreItems = snap.data().items || [];
          // Merge local + firestore (deduplicate by product_id)
          const merged = [...firestoreItems];
          local.forEach((item) => {
            if (!merged.find((i) => i.product_id === item.product_id)) {
              merged.push(item);
            }
          });
          setWishlistItems(merged);
          await setDoc(ref, { items: merged });
        } else if (local.length > 0) {
          setWishlistItems(local);
          await setDoc(ref, { items: local });
        }
        localStorage.removeItem('kasvi_wishlist');
      } else {
        setUid(null);
      }
    });
    return unsub;
  }, []);

  // Persist changes
  useEffect(() => {
    if (uid) {
      const ref = doc(db, 'wishlists', uid);
      setDoc(ref, { items: wishlistItems }).catch(() => {});
    } else {
      localStorage.setItem('kasvi_wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, uid]);

  const addToWishlist = (product) => {
    setWishlistItems((prev) => {
      if (prev.find((i) => i.product_id === product.product_id)) return prev;
      return [...prev, {
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price,
        image: product.images?.[0] || null,
        category: product.category,
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

export function useWishlist() {
  return useContext(WishlistContext);
}
