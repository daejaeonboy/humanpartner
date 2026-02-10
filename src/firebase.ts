import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase User Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCvLPDKERNs8P27ipJjLwmZ7a_kJlgJSlg",
    authDomain: "human-partner.firebaseapp.com",
    projectId: "human-partner",
    storageBucket: "human-partner.firebasestorage.app",
    messagingSenderId: "36770228350",
    appId: "1:36770228350:web:f5e37c9acad11ebf18d02f",
    measurementId: "G-CVV7XF7E86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
