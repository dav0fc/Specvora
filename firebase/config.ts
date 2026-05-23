import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD90N9HA2NFE6rhlGnLMRXy1FKnADYtAIc",
  authDomain: "specvoraauth.firebaseapp.com",
  projectId: "specvoraauth",
  storageBucket: "specvoraauth.firebasestorage.app",
  messagingSenderId: "245567251936",
  appId: "1:245567251936:web:ea1b511787b6bd6136b785"
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export { auth };
