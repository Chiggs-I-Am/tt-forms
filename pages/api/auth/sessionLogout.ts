import cookie, { CookieSerializeOptions } from "cookie";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler( req: NextApiRequest, res: NextApiResponse )
{
  if( req.method === "POST" ) {    
    let options: CookieSerializeOptions = { 
      expires: new Date( 0 ),
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      path: "/",
    };
    
    res.setHeader( "Set-Cookie", cookie.serialize( "session", "", options ) )
    res.end( JSON.stringify({ status: "success" }) );
  }
}