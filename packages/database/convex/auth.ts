import Google from "@auth/core/providers/google"
import { convexAuth } from "@convex-dev/auth/server"
import { ResendOTP } from "./ResendOTP"

// Sign-in methods for #34: Google OAuth plus email OTP. Google and OTP are
// both trusted verification methods, so the same verified email lands on one
// user automatically with no custom linking code. Do NOT add the Anonymous
// provider (sign-in-to-save: no anonymous Convex writes) and do NOT pass a
// custom createOrUpdateUser (the default account linking must stay intact).
// auth.test.ts pins this list.
export const authProviders = [Google, ResendOTP]

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: authProviders,
})
