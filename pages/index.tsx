import ActivitiesList from "@components/activities-list";
import ActivityFormList from "@components/activity-form-list";
import ActivityItem from "@components/activity-item";
import AppToolbar from "@components/layout/app-toolbar";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import Sidebar from "@components/layout/sidebar";
import { useAuthState } from "@components/user-auth-state";
import { createFirebaseApp } from "@libs/firebase/app";

import { getUserRecordFromSessionCookie as getUserInfoFromSessionCookie } from "@libs/firebase/firebaseAdmin";
import { DecodedIdToken } from "firebase-admin/auth";
import { collection, DocumentData, getDocs, getFirestore } from "firebase/firestore";
import type { NextApiRequest, NextPage } from 'next';
import { useCallback, useMemo, useState } from "react";

interface HomePageProps
{
  activities: {
    name: string;
    imageURL: string;
    forms: {
      name: string;
      fee: number;
      slug: string;
    }[];
  }[];
  userData?: DecodedIdToken;
}

const Home: NextPage<HomePageProps> = ({ activities, userData }: HomePageProps ) => { 
  const [ activityName, setActivityName ] = useState("");
  const [ activityForms, setActivityForms ] = useState( [] as { name: string; fee: number; slug: string }[] );
  const [ isOpen, setIsOpen ] = useState( false );
  
  const [ userSession, setUserSession ] = useState<DecodedIdToken | undefined>( userData );
  const { user, signInWithGoogle, signOut } = useAuthState();

  const toggleSidbar = useCallback( ( ) => {
    setIsOpen( prev => !prev );
  }, []);

  const aName = useMemo( () => activityName, [ activityName ]);
  const forms = useMemo( () => activityForms, [ activityForms ]);

  const handleSignIn = useCallback( () => {
    signInWithGoogle();
  }, [ signInWithGoogle ]);

  const handleSignOut = useCallback( () => {
    signOut();

    setUserSession( undefined );
  }, [ signOut ]);

  return (
    <Layout>
      <div className="grid gap-6 w-full h-full grid-rows-[auto_1fr_auto]">
        <AppToolbar>
        {/* { !user ? 
          !userSession ?
            <div>
              <button 
                onClick={ handleSignIn }
                className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Login</button>
            </div>
          : 
            <div className="flex items-center gap-2">
              <h1 className="text-sm text-on-primary-container-light font-medium">From cookies-{ userSession.email }</h1>
              <button 
                onClick={ handleSignOut }
                className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Sign out</button>
            </div> 
          : 
            <div className="flex items-center gap-2">
              <h1 className="text-sm text-on-primary-container-light font-medium">From OAuth-{ user.email }</h1>
              <button 
                onClick={ signOut }
                className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Sign out</button>
            </div> 
        } */}
        { !user && !userSession ?
          <div>
            <button 
              onClick={ handleSignIn }
              className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Login</button>
          </div>
          :
          <div className="flex items-center gap-2">
            <h1 className="text-sm text-on-primary-container-light font-medium">{ user?.email ?? userSession?.email }</h1>
            <button 
              onClick={ handleSignOut }
              className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Sign out</button>
          </div>
        }
        </AppToolbar>
        <Container>
          <ActivitiesList>
            { activities?.map( ( activity, index: number ) => {
                const { name, forms, imageURL } = activity;  
                return (
                  <ActivityItem 
                    key={ index } 
                    name={ name }
                    numberOfForms={ forms.length } 
                    imageURL={ imageURL }
                    handleOnClick={ () => { 
                      toggleSidbar(); 
                      setActivityName( name )
                      setActivityForms( forms )
                    }}/> 
                  )
            })}
          </ActivitiesList>
        </Container>
      </div>
      { isOpen 
        ? <Sidebar
            open={ isOpen }
            name={ `${ aName } forms` }
            handleOnClick={ toggleSidbar }>
              <ActivityFormList forms={ forms } />
          </Sidebar> 
        : null }
    </Layout>
  )
}

export async function getServerSideProps({ req }: { req: NextApiRequest })
{
  let app = createFirebaseApp();
  let firestore = getFirestore( app );

  let activitiesCollection = collection( firestore, "activities" );
  let activityDocsSnapshot = await getDocs( activitiesCollection );

  let activities = activityDocsSnapshot.docs.map( ( doc: DocumentData ) => {
    let { name, forms } = doc.data();
    return { name, forms };
  });

  // get user info from session cookie
  let sessionCookie = req.cookies.session;
  if( sessionCookie ) {    
    let userRecord = await getUserInfoFromSessionCookie( sessionCookie );
    console.log( "User Info", userRecord );

    return {
      props: {
        activities,
        userData: userRecord,
      }
    };
  }
  
  return {
    props: {
      activities,
    },
  };
}

export default Home
