
import type { NextApiRequest, NextApiResponse } from 'next';
import { useCallback, useEffect, useState } from "react";


import ActivitiesList from "@components/activities-list";
import ActivityFormList from "@components/activity-form-list";
import ActivityItem from "@components/activity-item";
import AppLayout from "@components/layout/app-layout";
import Container from "@components/layout/container";
import Sidebar from "@components/layout/sidebar";
import { checkEmailSignIn } from "@libs/firebase/auth";
import { firestore } from "@libs/firebase/firestore";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useRouter } from "next/router";
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
  
  const router = useRouter();

  const ifSignedInWithEmail = useCallback( async () => {
    let email = window.localStorage.getItem("emailForSignIn" ) ?? "";
    await checkEmailSignIn( email, router );
  }, [ router ]);

  useEffect( () => {
    ifSignedInWithEmail();
  }, [ ifSignedInWithEmail ]);

  const toggleSidbar = useCallback(() =>
  {
    setIsOpen(prev => !prev);
  }, []);

  const getActivityName = useCallback((name: string) =>
  {
    setActivityName(name)
  }, [])

  const getFormsFromActivity = useCallback((forms: any[]) => {
    setForms(forms);
  }, []);

  const handleOnClick = useCallback( ( name: string, forms: { name: string; fee: number; slug: string }[] ) => {
    getActivityName( name );
    
    let sortedForms = forms.sort( ( a: any, b: any ) => (a.name > b.name) ? 1 : -1 );
    forms.length > 1 ? getFormsFromActivity( sortedForms ) : getFormsFromActivity( forms );
    getFormsFromActivity( forms );

    toggleSidbar();
  }, [ getActivityName, getFormsFromActivity, toggleSidbar ]);

  return (
    <Container>
        <div className="px-4 pt-6">
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
                  imageURL={ `/${imageURL}` }
                  handleOnClick={ () => handleOnClick( name, forms ) } />
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
  let queryActivities = query( activitiesCollectionRef, orderBy( "name", "asc" ) );
  let activitiesSnapshot = await getDocs(queryActivities);
  let activities = activitiesSnapshot.docs.map( doc => doc.data() );

  return {
    props: {
      activities,
    }
  };
}

Home.Layout = AppLayout

export default Home;