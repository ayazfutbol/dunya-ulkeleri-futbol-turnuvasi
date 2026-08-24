import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDM4kokEaH4xYcVfLHz3a_Q58N-xTw_Ytk",
  authDomain: "dunya-ulkeleri-futbol.firebaseapp.com",
  projectId: "dunya-ulkeleri-futbol",
  messagingSenderId: "154596523963",
  appId: "1:154596523963:web:2ad4d1414b510846878e9e",
  measurementId: "G-Q35YM7ETY3"
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  // Google girişinden sonra oturum tarayıcıda korunur.
  await setPersistence(auth, browserLocalPersistence);

  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseFns = {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    runTransaction,
    serverTimestamp
  };

  // index.html'nin Firebase'in hazır olduğunu güvenilir şekilde anlamasını sağlar.
  window.dispatchEvent(new Event("firebase-ready"));
} catch (error) {
  console.error("Firebase başlatılamadı:", error);
  window.firebaseInitError = error;
  window.dispatchEvent(new CustomEvent("firebase-error", {
    detail: error
  }));
}
