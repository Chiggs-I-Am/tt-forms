"use client"

import { useAuthActions } from "@convex-dev/auth/react"
import { Button } from "@workspace/ui/components/button"
import { useState } from "react"

// Sign-in UI for #34: Google OAuth plus email OTP. Both land on one account
// per verified email with no custom linking code. The local answer typed on
// the home page is already in localStorage, so the Google redirect loses
// nothing; it is restored after the callback.
export function SignInForm() {
  const { signIn } = useAuthActions()
  const [emailStep, setEmailStep] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSending(true)
    const formData = new FormData(event.currentTarget)
    void signIn("resend-otp", formData)
      .then(() => {
        setEmailStep(formData.get("email") as string)
      })
      .catch(() => {
        setError("Could not send a code. Check the address and try again.")
      })
      .finally(() => {
        setSending(false)
      })
  }

  function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    void signIn("resend-otp", formData).catch(() => {
      setError("That code did not match. Try again or request a new one.")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        type="button"
        onClick={() => void signIn("google")}
        className="w-full"
      >
        Continue with Google
      </Button>

      <div className="text-center text-xs tracking-widest text-muted-foreground uppercase">
        or continue with email
      </div>

      {emailStep === null ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <label htmlFor="otp-email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="otp-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-10 rounded-none border border-input bg-background px-3 text-sm"
          />
          <Button type="submit" variant="outline" disabled={sending}>
            {sending ? "Sending code…" : "Send sign-in code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <p className="text-sm">
            Code sent to <span className="font-medium">{emailStep}</span>. It
            expires in 15 minutes.
          </p>
          <label htmlFor="otp-code" className="text-sm font-medium">
            8-digit code
          </label>
          <input
            id="otp-code"
            name="code"
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="12345678"
            className="h-10 rounded-none border border-input bg-background px-3 text-sm"
          />
          <input name="email" value={emailStep} type="hidden" readOnly />
          <Button type="submit">Verify and sign in</Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEmailStep(null)}
          >
            Use a different email
          </Button>
        </form>
      )}

      {error !== null && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
