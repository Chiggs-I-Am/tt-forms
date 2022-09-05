import { Analytics, getAnalytics } from "firebase/analytics";
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function initializeFirebaseApp(): FirebaseApp
{
  if( !getApps().length ) {
    let app = initializeApp( firebaseConfig );
    
    return app;
  }

  const app = getApp();
  return app;
}

export function analytics(): Analytics | undefined
{
  if( getApps().length > 0 ) {
    if( typeof window !== undefined ) {
      return getAnalytics( getApps()[0] );
    }
  }
}