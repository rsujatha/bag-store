import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBKgJzRgHJyGvlLuNBnMFNqqBExFS-HzxU",
  authDomain: "kasvi-bags.firebaseapp.com",
  projectId: "kasvi-bags",
  storageBucket: "kasvi-bags.firebasestorage.app",
  messagingSenderId: "420573418736",
  appId: "1:420573418736:web:c7535f3653394e30091e35",
  measurementId: "G-24ZVTGMJBL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
