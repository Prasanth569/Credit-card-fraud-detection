import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAyZA_qcu7izD1Mf3OC9y7azYxokEEDIZk",
  authDomain: "credit-card-fraud-detect-a17e4.firebaseapp.com",
  projectId: "credit-card-fraud-detect-a17e4",
  storageBucket: "credit-card-fraud-detect-a17e4.firebasestorage.app",
  messagingSenderId: "699761425270",
  appId: "1:699761425270:web:75cec0f3b0a5e7cbecd857",
  measurementId: "G-8B6RJKE78K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);