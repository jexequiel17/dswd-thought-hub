// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA53TaCIXdhYJ2d0iDReDDcWM-jZjgCA1s",
  authDomain: "thought-hub-dswd.firebaseapp.com",
  projectId: "thought-hub-dswd",
  storageBucket: "thought-hub-dswd.firebasestorage.app",
  messagingSenderId: "651906458635",
  appId: "1:651906458635:web:3cb7d40e5964a8b23b530e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);