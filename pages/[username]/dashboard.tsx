import AppToolbar from "@components/layout/app-toolbar";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import UserForms from "@components/user/user-forms";
import UserProfile from "@components/user/user-profile";
import { firestore } from "@libs/firebase/firestore";
import { authOptions } from "@pages/api/auth/[...nextauth]";
import { collection, doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { GetServerSidePropsContext } from "next";
import { Session, unstable_getServerSession } from "next-auth";
import { signOut } from "next-auth/react";

interface UsernamePageProps
{
  userSession: Session;
  forms: {
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    formData: {}
  }[]
}

export default function UsernamePage({ userSession, forms }: UsernamePageProps )
{
  const { user } = userSession;

  return (
    <Layout>
      <div className="grid gap-6 w-full h-full grid-rows-[auto_1fr_auto] sm:gap-12">
        <AppToolbar userSession={ userSession } handleSignOut={ () => signOut() }></AppToolbar>
        <Container>
          <div className="flex flex-col w-full gap-6 items-center">
            <UserProfile name={ user?.name! } email={ user?.email! } image={ user?.image! } />
            <div className="w-full max-w-sm px-4">
              <h3 className="text-xs font-medium dark:text-on-surface-variant-dark text-on-surface-light py-4">Completed Forms</h3>
              <UserForms forms={ forms } />
            </div>
          </div>
        </Container>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext )
{
  let userSession = await unstable_getServerSession( req, res, authOptions );
  if( !userSession ) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      }
    };
  }

  const { username } = query;

  const usernameDocRef = doc( firestore, "usernames", username as string );
  const usernameDocSnapshot = await getDoc( usernameDocRef );
  const usernameDoc = usernameDocSnapshot.data();

  let userID = null;
  let forms = null

  if( usernameDocSnapshot.exists() ) {
    userID = usernameDoc?.userID;

    // get all forms the user completed
    const userFormsCollectionRef = collection( firestore, "users", userID, "forms" );
    const userFormsDocSnapshot = await getDocs( userFormsCollectionRef );
    
    forms = userFormsDocSnapshot.docs.map( doc => { 
      let data = doc.data();
      let createdAt = getDateFromTimestamp( data.createdAt )
      let updatedAt = getDateFromTimestamp( data.updatedAt )

      let form = {
        ...data,
        name: doc.id,
        createdAt,
        updatedAt,
      };
      
      return form;
    });
  }

  console.log( "FORMS", forms );

  return {
    props: {
      userSession,
      forms
    }
  };
}

function getDateFromTimestamp( time: Timestamp )
{
  return new Date( time.toMillis() ).toDateString();
}
