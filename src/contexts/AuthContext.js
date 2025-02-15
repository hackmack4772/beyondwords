import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc ,updateDoc} from "firebase/firestore";
import auth ,{ db } from "../config/firebase";   // Ensure Firestore (db) is imported

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function register(email, password, fullName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;  
    // Update user profile
    await updateProfile(user, { displayName: fullName });
    const userRef = doc(db, "users", user.uid);  
    await setDoc(userRef, {
      uid: user.uid,
      fullName:fullName || "EMo",
      email,
      createdAt: new Date().toISOString(),
    });  
    return user;
  }
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  async function updateUserProfile(user, profile) {
    console.log(profile,"profile");
    
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    });
    return updateProfile(user, profile);
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    error,
    setError,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
