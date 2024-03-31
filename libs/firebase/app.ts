import { Analytics, getAnalytics } from "firebase/analytics";
import { FirebaseApp, FirebaseOptions, getApps, initializeApp } from "firebase/app";
import { Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import { Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

interface FirebaseServices {
  isConfigured: boolean;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

function initializeServices(): FirebaseServices {
  const isConfigured = getApps.length > 0;
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { isConfigured, app, auth, firestore };
}

function connectToEmulators({ auth, firestore }: Pick<FirebaseServices, "auth" | "firestore">) {
  if (process.env.NODE_ENV === "development" && !auth.emulatorConfig) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(firestore, "localhost", 8080);
  }
}

export function getFirebase(): FirebaseServices {
  const services = initializeServices();
  if (!services.isConfigured) {
    connectToEmulators(services);
  }
  return services;
}

export function analytics(): Analytics | undefined {
  if (getApps().length > 0) {
    if (typeof window !== undefined) {
      return getAnalytics(getApps()[0]);
    }
  }
}