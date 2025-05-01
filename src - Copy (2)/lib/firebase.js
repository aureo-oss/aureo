import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAJw0lUX8_m0le35ONR61g1qXpeoxzCKa4",
    authDomain: "sigma-4a235.firebaseapp.com",
    projectId: "sigma-4a235",
    storageBucket: "sigma-4a235.firebasestorage.app",
    messagingSenderId: "553837378789",
    appId: "1:553837378789:web:1bc0f16c6aad16a3b9a80c",
    measurementId: "G-7BEQD8C82K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);  // Make sure this line exists!