import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDROiXH5qnQv07m-9P3w-uRwl94E5tVHYQ",
  authDomain: "o-keo-ngot-cua-wyn.firebaseapp.com",
  projectId: "o-keo-ngot-cua-wyn",
  storageBucket: "o-keo-ngot-cua-wyn.firebasestorage.app",
  messagingSenderId: "748119706992",
  appId: "1:748119706992:web:28a689515cbad21af513b5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connection test as required by skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  }
}
testConnection();
