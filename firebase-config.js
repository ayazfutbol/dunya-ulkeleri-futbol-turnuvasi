// Firebase bağlantısı - ÜCRETSİZ SÜRÜM
// Bu dosyadaki firebaseConfig değerleri Firebase Console > Project Settings > Your apps bölümünden alınır.
// ÖNEMLİ: GitHub'daki mevcut çalışan firebase-config.js dosyan varsa onun gerçek değerlerini koru.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "BURAYA_MEVCUT_API_KEY",
  authDomain: "dunya-ulkeleri-futbol.firebaseapp.com",
  projectId: "dunya-ulkeleri-futbol",
  storageBucket: "dunya-ulkeleri-futbol.firebasestorage.app",
  messagingSenderId: "BURAYA_MEVCUT_SENDER_ID",
  appId: "BURAYA_MEVCUT_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseFns = {
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut, doc, getDoc, getDocs, setDoc, deleteDoc,
  collection, runTransaction, serverTimestamp
};
window.dispatchEvent(new Event("firebase-ready"));

export { app, auth, db };
