import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVWcYvADuIo6yKipbnd-5hU6WIb2HAWPA",
  authDomain: "aggelospito.firebaseapp.com",
  projectId: "aggelospito",
  storageBucket: "aggelospito.firebasestorage.app",
  messagingSenderId: "627384100036",
  appId: "1:627384100036:web:fc85ff35560b80f6bb9591",
  measurementId: "G-EQ5M6FHZBT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
