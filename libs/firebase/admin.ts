import { apps } from "firebase-admin";
import { App, cert, getApp, initializeApp } from "firebase-admin/app";
import { DecodedIdToken, UserRecord, getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function createFirebaseAdminApp(): App {
  if (apps.length <= 0 || !apps.length) {
    let app = initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!
      }),
    });

    return app;
  }

  const app = getApp();
  return app;
}

export const firebaseAdmin = createFirebaseAdminApp();
export const authAdmin = getAuth(firebaseAdmin);
export const firestoreAdmin = getFirestore(firebaseAdmin);

export async function getUserRecordFromToken(idToken: string) {
  let decodedIdToken: DecodedIdToken = await authAdmin.verifyIdToken(idToken, true);
  let userRecord: UserRecord = await authAdmin.getUser(decodedIdToken.uid);
  return userRecord;
}

export async function getUserInfoFromSessionCookie(sessionCookie: string) {
  let decodedIdToken: DecodedIdToken = await authAdmin.verifySessionCookie(sessionCookie, true);

  return decodedIdToken;
}