import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAJw0lUX8_m0le35ONR61g1qXpeoxzCKa4",
  authDomain: "sigma-4a235.firebaseapp.com",
  projectId: "sigma-4a235",
  storageBucket: "sigma-4a235.appspot.com",
  messagingSenderId: "553837378789",
  appId: "1:553837378789:web:1bc0f16c6aad16a3b9a80c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);