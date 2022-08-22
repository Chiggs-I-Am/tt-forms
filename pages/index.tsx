import ActivityFormList from "@components/activity-form-list";
import AppToolbar from "@components/layout/app-toolbar";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import Sidebar from "@components/layout/sidebar";

import type { NextApiRequest, NextApiResponse, NextPage } from 'next';
import { useCallback, useMemo, useState } from "react";

import { firestoreAdmin } from "@libs/firebase/firebaseAdmin";

import ActivitiesList from "@components/activities-list";
import ActivityItem from "@components/activity-item";
import { Session, unstable_getServerSession } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { authOptions } from "./api/auth/[...nextauth]";

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
  userSession: Session;
}

const Home: NextPage<HomePageProps> = ({ activities, userSession }: HomePageProps ) => { 
  const [ activityName, setActivityName ] = useState("");
  const [ forms, setForms ] = useState( [] as { name: string; fee: number; slug: string }[] );
  const [ isOpen, setIsOpen ] = useState( false );
  
  const toggleSidbar = useCallback( ( ) => {
    setIsOpen( prev => !prev );
  }, []);

  const aName = useMemo( () => activityName, [ activityName ]);
  // const forms = activities.map( activity => activity.forms ).flat();
  // const forms = useMemo( () => activityForms, [ activityForms ]);

  const { data: session } = useSession();

  const handleSignOut = useCallback( () => {
    signOut();
  }, []);

  const getActivityName = useCallback( ( name: string ) => {
    setActivityName( name )
  }, [])

  const getFormsFromActivity = useCallback( ( forms: any ) => {
    setForms( forms );
  }, []);

  return (
    <Layout>
      <div className="grid gap-6 w-full h-full grid-rows-[auto_1fr_auto]">
        <AppToolbar>
        { !session && !userSession ?
          <div>
            <button 
              onClick={ () => signIn() }
              className="flex items-center justify-center text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Sign in</button>
          </div>
          :
          <div className="flex items-center gap-2">
            <h1 className="text-sm text-on-primary-container-light font-medium">{ session?.user?.email ?? userSession.user?.email }</h1>
            <button 
              onClick={ handleSignOut }
              className="text-sm font-medium h-10 px-6 rounded-full shadow-md bg-primary-light text-on-primary-light">Sign out</button>
          </div>
        }
        </AppToolbar>
        <Container>
          <ActivitiesList>
            { activities.map( ( activity, index: number ) => {
                const { name, imageURL, forms } = activity;
                return (
                  <ActivityItem 
                    key={ index } 
                    name={ name }
                    numberOfForms={ forms.length } 
                    imageURL={ imageURL }
                    handleOnClick={ () => {
                      toggleSidbar();
                      getFormsFromActivity( forms );
                      getActivityName( name );
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

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse })
{
  let activitiesCollectionRef = await firestoreAdmin.collection( "activities" ).get();
  let activitiesSnapshot = activitiesCollectionRef.docs;
  let activities = activitiesSnapshot.map( ( doc ) => {
    return doc.data();
  });

  let userSession = await unstable_getServerSession( req, res, authOptions );

  if( !userSession ) {
    return {
      props: {
        activities,
      }
    };
  }

  return {
    props: {
      activities,
      userSession
    }
  };
}

export default Home
