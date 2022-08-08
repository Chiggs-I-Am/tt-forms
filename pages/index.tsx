import ActivitiesList from "@components/activities-list";
import ActivityFormList from "@components/activity-form-list";
import ActivityItem from "@components/activity-item";
import Container from "@components/layout/container";
import Layout from "@components/layout/layout";
import Sidebar from "@components/layout/sidebar";
import { createFirebaseApp } from "@libs/firebase";
import { collection, DocumentData, getDocs, getFirestore } from "firebase/firestore";
import type { NextPage } from 'next';
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
}

const Home: NextPage<HomePageProps> = ({ activities }: HomePageProps ) => { 
  const [ isOpen, setIsOpen ] = useState( false );
  const [ activityName, setActivityName ] = useState("");
  const [ activityForms, setActivityForms ] = useState( [] as { name: string; fee: number; slug: string }[] );

  const toggleSidbar = useCallback( ( ) => {
    setIsOpen( prev => !prev );
  }, []);

  const aName = useMemo( () => activityName, [ activityName ]);
  const forms = useMemo( () => activityForms, [ activityForms ]);

  return (
    <Layout>
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

export async function getStaticProps()
{
  let app = createFirebaseApp();
  let firestore = getFirestore( app );

  let activitiesCollection = collection( firestore, "activities" );
  let activityDocsSnapshot = await getDocs( activitiesCollection );

  let activities = activityDocsSnapshot.docs.map( ( doc: DocumentData ) => {
    let { name, forms } = doc.data();
    return { name, forms };
  });
  
  return {
    props: {
      activities
    },
  };
}

export default Home
