// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqCyOWK8Pj9U1JLSc-JIR0x6XCeDRS31o",
  authDomain: "blinking-events.firebaseapp.com",
  projectId: "blinking-events",
  storageBucket: "blinking-events.firebasestorage.app",
  messagingSenderId: "833007175655",
  appId: "1:833007175655:web:be4cc1725fe41f3bac1f42",
  measurementId: "G-7YDTQH4K0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);