import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD90N9HA2NFE6rhlGnLMRXy1FKnADYtAIc",
  authDomain: "specvoraauth.firebaseapp.com",
  projectId: "specvoraauth",
  storageBucket: "specvoraauth.firebasestorage.app",
  messagingSenderId: "245567251936",
  appId: "1:245567251936:web:ea1b511787b6bd6136b785"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
