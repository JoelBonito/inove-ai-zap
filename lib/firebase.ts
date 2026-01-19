import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Placeholder config - User needs to replace this
const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app, 'us-central1');
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators if in dev
// @ts-ignore
if (import.meta.env.DEV) {
    // Uncomment to use emulators
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
}
