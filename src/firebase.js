import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyA1tYjHPofA5W51bMPLDzEx5gdnfG43VnY",
    authDomain: "fys-a0411.firebaseapp.com",
    databaseURL: "https://fys-a0411-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fys-a0411",
    storageBucket: "fys-a0411.firebasestorage.app",
    messagingSenderId: "979364345399",
    appId: "1:979364345399:web:04356386b707bbc37231b2"
};

const app = initializeApp(firebaseConfig);

// Realtime Database export
export const db = getDatabase(app);