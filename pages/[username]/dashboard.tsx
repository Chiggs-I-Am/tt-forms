import { useAuthState } from "@components/auth/user-auth-state";
import AppLayout from "@components/layout/app-layout";
import Container from "@components/layout/container";
import UserForms from "@components/user/user-forms";
import UserProfile from "@components/user/user-profile";
import { firestore } from "@libs/firebase/firestore";
import { NextPageWithLayout } from "@pages/_app";
import { collection, doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { GetServerSidePropsContext } from "next";

interface UsernamePageProps
{
  forms: {
    name: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    formData: {}
  }[]
}

const UserDashboard: NextPageWithLayout<UsernamePageProps> = ( { forms }: UsernamePageProps ) =>
{
  const { user, username } = useAuthState();

  return (
    <Container>
      <div className="flex flex-col w-full gap-6 items-center mt-6">
        { user && <UserProfile user={{ ...user, username }} /> }
        <div className="w-full max-w-sm px-4">
          <h3 className="text-xs font-medium dark:text-on-surface-variant-dark text-on-surface-light py-4">Completed Forms</h3>
          { forms.length === 0 ?
            <div className="text-sm dark:text-on-surface-dark text-on-surface-light">👀 Nothing to see here...</div>
            :
            <UserForms forms={ forms } />
          }
        </div>
      </div>
    </Container>
  );
}

UserDashboard.Layout = AppLayout;

export default UserDashboard;

export async function getServerSideProps( { query }: GetServerSidePropsContext )
{
  const { username } = query;

  const usernameDocRef = doc( firestore, "usernames", username as string );
  const usernameDocSnapshot = await getDoc( usernameDocRef );
  const usernameDoc = usernameDocSnapshot.data();

  let userID = null;
  let forms = null

  if ( usernameDocSnapshot.exists() ) {
    userID = usernameDoc?.userID;

    // get all forms the user completed
    const userFormsCollectionRef = collection( firestore, "users", userID, "forms" );
    const userFormsDocSnapshot = await getDocs( userFormsCollectionRef );

    forms = userFormsDocSnapshot.docs.map( doc =>
    {
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
    } );
  }

  return {
    props: {
      forms
    }
  };
}

function getDateFromTimestamp( time: Timestamp )
{
  return new Date( time.toMillis() ).toDateString();
}
