// src/firestore-cache.js
import { clearIndexedDbPersistence } from 'firebase/firestore';
import { db } from './firebase'; // Adjust import path as needed

export async function clearFirestoreCache() {
  try {
    await clearIndexedDbPersistence(db);
    console.log('Firestore cache cleared successfully');
  } catch (err) {
    console.error('Error clearing Firestore cache:', err);
  }
}