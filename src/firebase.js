// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBtm9WpPn-WT0IFVKOW6Xs-dcX474oW16o",
  authDomain: "hackmack4772.firebaseapp.com",
  projectId: "hackmack4772",
  storageBucket: "hackmack4772.firebasestorage.app",
  messagingSenderId: "38931846023",
  appId: "1:38931846023:web:2ed96aa0b1912c0fa6b922",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);
