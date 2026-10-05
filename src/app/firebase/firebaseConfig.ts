import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuYD3p5wsb1KSFA6KvE_kVOOH2KLag5B0",
  authDomain:
    "ultra-fingerprint-attendance.firebaseapp.com",
  projectId:
    "ultra-fingerprint-attendance",
  storageBucket:
    "ultra-fingerprint-attendance.firebasestorage.app",
  messagingSenderId:
    "280589314007",
  appId:
    "1:280589314007:web:f8689a6610641ccd67cd92",
  measurementId:
    "G-774LZ9LWHN",
};

const firebaseApp =
  initializeApp(firebaseConfig);

export const firebaseAuth =
  getAuth(firebaseApp);

export default firebaseApp;
