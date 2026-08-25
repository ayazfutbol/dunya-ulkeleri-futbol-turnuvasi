// Dünya Ülkeleri Futbol Turnuvası - Firebase bağlantısı
// Firebase Console > Project settings > Your apps bölümündeki web uygulamanızın değerlerini buraya yazın.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "BURAYA_API_KEY",
  authDomain: "dunya-ulkeleri-futbol.firebaseapp.com",
  projectId: "dunya-ulkeleri-futbol",
  storageBucket: "dunya-ulkeleri-futbol.firebasestorage.app",
  messagingSenderId: "BURAYA_MESSAGING_SENDER_ID",
  appId: "BURAYA_APP_ID"
};

const valid = firebaseConfig.apiKey !== "BURAYA_API_KEY" && firebaseConfig.messagingSenderId !== "BURAYA_MESSAGING_SENDER_ID" && firebaseConfig.appId !== "BURAYA_APP_ID";
let app=null,auth=null,db=null;
if(valid){
  try{ app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app); }catch(e){ console.warn("Firebase başlatılamadı",e); }
}
export { app, auth, db, valid as firebaseReady };
