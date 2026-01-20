import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Placeholder config - User needs to replace this
const firebaseConfig = {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim()
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app, 'us-central1');
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connect to emulators if in dev
// @ts-ignore
if (import.meta.env.DEV) {
    // Uncomment to use emulators
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
}
