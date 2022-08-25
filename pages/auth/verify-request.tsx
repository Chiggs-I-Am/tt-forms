import Layout from "@components/layout/layout";
import Link from "next/link";

export default function VerifyRequest() {
  return (
    <Layout>
      <div className="grid w-full h-full place-items-center">
        <div className="w-full max-w-sm rounded-xl shadow-lg overflow-hidden bg-primary-container-light">
          <div className="grid w-full gap-4 p-4">
            <div>
              <h1 className="text-2xl text-on-primary-container-light font-semibold">Check your email</h1> 
            </div>
            <div>
              <p className="text-sm text-on-primary-container-light">A sign in link has been sent to your email address.</p>
              <Link href="/">
                <a className="text-sm text-tertiary-light font-bold hover:underline">Go to home page.</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
