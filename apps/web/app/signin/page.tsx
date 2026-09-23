import Link from "next/link"
import { SignInForm } from "@/components/sign-in-form"

export const metadata = {
  title: "Sign in · TT Forms Demo",
}

// Sign-in gate for #34: nothing is written server-side before this step.
// Your email is real and used only to sign you in; every form answer you
// type must be invented.
export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Sign in to save your progress</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Browsing and trying fields is anonymous and stays in this browser. The
          first save to the server requires sign-in. Use Google or an email
          code; both land on one account for the same address.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your sign-in email is real and only used for authentication. Every
          form answer must be fake. Never type real ID numbers or personal
          details.
        </p>
      </div>
      <SignInForm />
      <Link
        href="/"
        className="text-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to the demo
      </Link>
    </div>
  )
}
