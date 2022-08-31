import { firestoreAdmin } from "@libs/firebase/firebaseAdmin";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
	debug: true,
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
		EmailProvider({
			server: {
				host: process.env.EMAIL_SERVER_HOST,
				port: process.env.EMAIL_SERVER_PORT,
				auth: {
					user: process.env.EMAIL_SERVER_USER,
					pass: process.env.EMAIL_SERVER_PASSWORD
				},
			},
			from: process.env.EMAIL_FROM,
		})
	],
	adapter: FirestoreAdapter({
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	}),
	pages: {
		newUser: "/auth/create-username",
		signIn: "/auth/signin",
		verifyRequest: "/auth/verify-request"
	},
	callbacks: {
		session: async ({ session, user }) => {
			let userData = {
				...session.user,
				userID: user.id
			};
			session.user = userData;
			session.userID = user.id;

			let userRef = await firestoreAdmin.doc( `users/${ user.id }` ).get();
			let username = userRef.data()?.username;
			
			if( username ) {
				let data = {
					...session.user,
					username
				};
				session.user = data;
			}
			return session;
		}
	},
};

export default NextAuth( authOptions );
