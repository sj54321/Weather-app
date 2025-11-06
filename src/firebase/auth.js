import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPGTUiHGpfYMstJia8aJOqsJQYuvuORxc",
  authDomain: "weatherforcastappmiet.firebaseapp.com",
  projectId: "weatherforcastappmiet",
  storageBucket: "weatherforcastappmiet.firebasestorage.app",
  messagingSenderId: "165568502457",
  appId: "1:165568502457:web:f202cc1a37de9262e71968",
  measurementId: "G-PVG2RKLLK9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
