import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import { NextApiRequest, NextApiResponse } from "next";

export default function SignIn({ user }: any) 
{
  return (
    <Layout>
      <Container>
        <div className="grid w-full h-full place-items-center">
          <div className="w-full max-w-sm rounded-xl shadow-md bg-primary-container-light">
            <div className="mx-auto w-fit h-fit p-4 rounded-b-xl bg-primary-light">
              <span className="text-lg font-bold text-on-primary-light">TT FORMS</span>
            </div>
            { user ? 
              (
                <div className="mx-auto w-fit h-fit p-4 rounded-b-xl bg-primary-light">
                  <span className="text-lg font-bold text-on-primary-light">{ user.name }</span>
                </div>
              ) 
              : 
              (
                <div className="mx-auto w-fit h-fit p-4 rounded-b-xl bg-primary-light">
                  <span className="text-lg font-bold text-on-primary-light">Sign In</span>
                </div>
              )
            }
            <div className="grid gap-4 w-full h-full p-4 items-center justify-center">
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse })
{
  // let session = await getSession( req );
  console.log( "Next Requrest: ", req );
  
  return {
    props: { }
  }
}