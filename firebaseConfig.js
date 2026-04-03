// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getReactNativePersistence, initializeAuth, getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore, collection, enableNetwork, disableNetwork } from 'firebase/firestore'
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

enableNetwork(db).catch(() => {
  console.log('Offline mode enabled');
});

export const usersRef = collection(db, 'users');
export const roomRef = collection(db, 'rooms');
export const eventsRef = collection(db, 'events');