import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBtm9WpPn-WT0IFVKOW6Xs-dcX474oW16o",
  authDomain: "hackmack4772.firebaseapp.com",
  projectId: "hackmack4772",
  storageBucket: "hackmack4772.firebasestorage.app",
  messagingSenderId: "38931846023",
  appId: "1:38931846023:web:2ed96aa0b1912c0fa6b922",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
export const db = getFirestore(app);


export default auth;
