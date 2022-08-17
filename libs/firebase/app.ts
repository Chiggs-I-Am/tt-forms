import { Analytics, getAnalytics } from "firebase/analytics";
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";

export function createFirebaseApp(): FirebaseApp | undefined
{
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  if( getApps().length <= 0 ) {
    let app = initializeApp( firebaseConfig );
    
    return app;
  }
}

export function analytics(): Analytics | undefined
{
  if( getApps().length > 0 ) {
    if( typeof window !== undefined ) {
      return getAnalytics( getApps()[0] );
    }
  }
}

function setAuthPersistence() 
{
  let auth = getAuth();
  setPersistence( auth, inMemoryPersistence );
}