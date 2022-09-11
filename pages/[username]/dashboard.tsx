import { useAuthState } from "@components/auth/user-auth-state";
import AppLayout from "@components/layout/app-layout";
import Container from "@components/layout/container";
import UserForms from "@components/user/user-forms";
import UserProfile from "@components/user/user-profile";
import { onAuth } from "@libs/firebase/auth";
import { firestore, getDateFromTimestamp } from "@libs/firebase/firestore";
import { NextPageWithLayout } from "@pages/_app";
import { User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { lowerCase, upperFirst } from "lodash";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

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

const UserDashboard: NextPageWithLayout<UsernamePageProps> = () =>
{
  const { user, username } = useAuthState();
  const [ forms, setForms ] = useState<any[]>([]);

  const router = useRouter();

  const checkIfSignedIn = useCallback(( user: User ) => {
    if( !user ) {
      router.push("/");
    }
  }, [ router ]);

  useEffect( () => {
    const unsubscribe = onAuth( checkIfSignedIn );

    return () => unsubscribe();
  }, [ checkIfSignedIn ]);

  const getUserForms = useCallback(async () => {
    const formsCollectionRef = collection( firestore, "users", `${user?.uid}`, "forms");
    const formsDocSnapshot = await getDocs( formsCollectionRef );
    if( !formsDocSnapshot.empty ) {
      let formsDocs = formsDocSnapshot.docs.map( ( doc ) => {
        const data = doc.data();
        let form = {
          ...data,
          name: upperFirst( lowerCase( doc.id )),
          createdAt: getDateFromTimestamp( data.createdAt ),
          updatedAt: getDateFromTimestamp( data.updatedAt ),
        }
        return form;
      });
      
      setForms( formsDocs );
    }
  }, [ user ]);

  useEffect( () => {
    getUserForms();
  }, [ getUserForms ]);

  return (
    <Container>
      <div className="flex flex-col w-full gap-6 items-center mt-6">
        { user && 
          <>
            <UserProfile user={{ ...user, username }} />
            <div className="w-full max-w-sm px-4">
              <h3 className="text-xs font-medium dark:text-on-surface-variant-dark text-on-surface-light py-4">Completed Forms</h3>
              { !forms ?
                <div className="text-sm dark:text-on-surface-dark text-on-surface-light">👀 Nothing to see here...</div>
                :
                <UserForms forms={ forms } />
              }
            </div> 
          </>
        }
      </div>
    </Container>
  );
}

UserDashboard.Layout = AppLayout;

export default UserDashboard;