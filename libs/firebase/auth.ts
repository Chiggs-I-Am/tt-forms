import { createFirebaseApp } from "@libs/firebase/app";
import
	{
		AuthProvider,
		getAuth,
		getIdToken,
		inMemoryPersistence,
		setPersistence,
		signInWithPopup,
		signOut,
		User
	} from "firebase/auth";

let app = createFirebaseApp();

export const auth = getAuth(app);

export async function signInWithAuthProvider(provider: AuthProvider) {
	try {
		await setPersistence(auth, inMemoryPersistence);

		const userCredentials = await signInWithPopup(auth, provider);

		// let csrfToken = getCookie( "csrfToken" );
		// postTokenToSessionLogin(userCredentials.user, csrfToken);
		postTokenToSessionLogin(userCredentials.user);

		return userCredentials;
	} catch (error: any) {
		console.log(`Code: ${error.code} | Message: ${error.message}`);
	}
}

async function postTokenToSessionLogin(user: User) {
	let idToken = await getIdToken(user);

	await fetch("/api/auth/sessionLogin", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ idToken }),
	});
}

export async function signOutUser() {
	try {
		await signOut(auth);

		fetch("/api/auth/sessionLogout", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		});
	} catch (error: any) {
		console.log(`Code: ${error.code} | Message: ${error.message}`);
	}
}

export function getCookie(name: string): string | null {
	const cookieArray = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
	alert(JSON.stringify(cookieArray));
	return cookieArray ? cookieArray[2] : null;
}