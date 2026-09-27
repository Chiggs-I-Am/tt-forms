// Convex module paths cannot contain hyphens.
/* eslint-disable github/filenames-match-regex */
import { Email } from "@convex-dev/auth/providers/Email";
import { generateRandomString } from "@oslojs/crypto/random";
import { Resend as ResendAPI } from "resend";
import type { RandomReader } from "@oslojs/crypto/random";

// Email OTP provider for #34. 8-digit code, 15-minute expiry (the documented
// Resend example). The address collected here is real and used for
// authentication only; every form answer must be fake (sign-in page says so).
export const ResendOTP = Email({
  apiKey: process.env.AUTH_RESEND_KEY,
  generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 8);
  },
  id: "resend-otp",
  maxAge: 900,
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "TT Forms Demo <onboarding@resend.dev>",
      subject: "Sign in to TT Forms Demo",
      text:
        `Your TT Forms Demo sign-in code is ${token}.\n\n` +
        "It expires in 15 minutes. This address is only used to sign you in; " +
        "use invented details in every form answer.",
      to: [email],
    });
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
