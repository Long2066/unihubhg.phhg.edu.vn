import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyCmWinkQcP82-juuFRPmXB0wXeDUPxkxdA",
  authDomain: "unihubhg-tnu.firebaseapp.com",
  projectId: "unihubhg-tnu",
  storageBucket: "unihubhg-tnu.firebasestorage.app",
  messagingSenderId: "732168520347",
  appId: "1:732168520347:web:b2e8d00aa6610bc0f1bc3e",
  measurementId: "G-JCJ0KVWPR5",
  firestoreDatabaseId: ""
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore (fallback to default database if no firestoreDatabaseId is provided)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Storage for original theme images; Firestore only stores download URLs.
export const storage = getStorage(app);
