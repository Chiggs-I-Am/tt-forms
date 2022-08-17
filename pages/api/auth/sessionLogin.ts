import { authAdmin } from "@libs/firebase/firebaseAdmin";
import cookie, { CookieSerializeOptions } from "cookie";
import { DecodedIdToken, UserRecord } from "firebase-admin/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler( req: NextApiRequest, res: NextApiResponse )
{
  if( req.method === "POST" )
  {
    let idToken = req.body.idToken.toString();
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    
    const options: CookieSerializeOptions = { 
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      path: "/",
    };

    let sessionCookie: string = await authAdmin.createSessionCookie( idToken, { expiresIn } );

    res.setHeader( "Set-Cookie", cookie.serialize( "session", sessionCookie, options ) );
    res.end( JSON.stringify({ status: "success" }) );
  }
}