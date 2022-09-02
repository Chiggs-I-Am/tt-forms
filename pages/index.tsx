
import type { NextApiRequest, NextApiResponse } from 'next';
import { useCallback, useEffect, useState } from "react";


import ActivitiesList from "@components/activities-list";
import ActivityFormList from "@components/activity-form-list";
import ActivityItem from "@components/activity-item";
import AppLayout from "@components/layout/app-layout";
import Container from "@components/layout/container";
import Sidebar from "@components/layout/sidebar";
import { auth } from "@libs/firebase/auth";
import { firestore } from "@libs/firebase/firestore";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { NextPageWithLayout } from "./_app";

interface HomePageProps
{
  activities: {
    name: string;
    imageURL: string;
    registryForms: {
      [key: string]: {
        name: string;
        fee: number;
        slug: string;
      }
    };
  }[];
}

const Home: NextPageWithLayout<HomePageProps> = ({ activities }: HomePageProps) =>
{
  const [activityName, setActivityName] = useState<string>("");
  const [forms, setForms] = useState([] as { name: string; fee: number; slug: string }[]);
  const [isOpen, setIsOpen] = useState(false);

  const emailSignIn = useCallback( async () => {
    if( isSignInWithEmailLink( auth, window.location.href ) ) {
      let email = window.localStorage.getItem( "emailForSignIn" );
      if( !email ) {
        // prompt user for email address
      }
      try {
        let userCredential = await signInWithEmailLink( auth, email!, window.location.href );
        // userCredential.additionalUserInfo.isNewUser
        console.log( userCredential );
        window.localStorage.removeItem( "emailForSignIn" );
      }
      catch( error: any ) {
        console.log( error.code, error.message );
      }
    }
  }, [])

  useEffect( () => {
    emailSignIn()
  }, [ emailSignIn ]);

  const toggleSidbar = useCallback(() =>
  {
    setIsOpen(prev => !prev);
  }, []);

  const getActivityName = useCallback((name: string) =>
  {
    setActivityName(name)
  }, [])

  const getFormsFromActivity = useCallback((forms: any) =>
  {
    setForms(forms);
  }, []);

  return (
    <Container>
      <div className="mt-6">
        <ActivitiesList>
          { activities.map((activity, index: number) =>
          {
            const { name, imageURL, registryForms } = activity;
            const numberOfForms = Object.keys(registryForms).length;
            const forms = Object.values(registryForms);

            return (
              <ActivityItem
                key={ index }
                name={ name }
                numberOfForms={ numberOfForms }
                imageURL={ imageURL }
                handleOnClick={ () =>
                {
                  toggleSidbar();
                  getFormsFromActivity(forms);
                  getActivityName(name);
                } } />
            )
          }) }
        </ActivitiesList>
      </div>
      { isOpen ? 
        <Sidebar
          open={ isOpen }
          name={ `${ activityName } forms` }
          handleOnClick={ toggleSidbar }>
          <ActivityFormList forms={ forms } />
        </Sidebar>
        : null 
      }
    </Container>
  )
}

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse })
{
  let activitiesCollectionRef = collection(firestore, "activities");
  let activitiesSnapshot = await getDocs(activitiesCollectionRef);
  let activities = activitiesSnapshot.docs.map( doc => doc.data() );

  /* let userSession = await unstable_getServerSession(req, res, authOptions);

  if (!userSession)
  {
    return {
      props: {
        activities
      }
    };
  } */

  /* try
  {
    let userID = userSession.userID as string;
    let usernamesCollectionRef = collection(firestore, "usernames");
    let queryUsernameDoc = query(usernamesCollectionRef, where("userID", "==", userID));
    let usernameDocSnapshot = await getDocs(queryUsernameDoc);
    let isEmpty = usernameDocSnapshot.empty;

    // if user is signed in and doesn't have a username then redirect to create-username page
    if (userSession && isEmpty)
    {
      return {
        redirect: {
          permanent: false,
          destination: "/auth/create-username",
        },
        props: {}
      };
    }
  }
  catch (error: any) { } */

  return {
    props: {
      activities,
    }
  };
}

Home.Layout = AppLayout

export default Home;