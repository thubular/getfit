// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

// Your web app's Firebase configuration
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore, collection } from 'firebase/firestore'
const firebaseConfig = {
  apiKey: "AIzaSyBjaX8J8OVFPPeIzd_FucJ7Ayd1rTpUAeo",
  authDomain: "getfit-a9526.firebaseapp.com",
  projectId: "getfit-a9526",
  storageBucket: "getfit-a9526.firebasestorage.app",
  messagingSenderId: "75158552850",
  appId: "1:75158552850:web:29e84acc7db6feb95fb3cb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export const usersRef = collection(db, 'users');
export const roomRef = collection(db, 'rooms');