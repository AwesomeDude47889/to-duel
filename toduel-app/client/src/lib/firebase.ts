import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCCtgUjUlZ7LxUdEnHsu-k48nb7ziWGu04",
  authDomain: "todoxp-8ad41.firebaseapp.com", // Keep as default Firebase domain
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID || "todoxp-8ad41"}-default-rtdb.firebaseio.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "todoxp-8ad41",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "todoxp-8ad41"}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "696881848881",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:696881848881:web:ffe239a421a4989b37eb10"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);