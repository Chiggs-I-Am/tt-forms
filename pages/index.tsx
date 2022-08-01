import ActivitiesList from "@components/activities-list";
import Container from "@components/container";
import Layout from "@components/layout";
import { createFirebaseApp } from "@libs/firebase";
import { collection, DocumentData, getDocs, getFirestore } from "firebase/firestore";
import type { NextPage } from 'next';
import { Activity } from "stories/components/ActivityItem.stories";

interface HomePageProps
{
  forms?: {
    slug: string;
    name: string;
    number: number;
  }[];
}

const Home: NextPage = ({ forms }: HomePageProps ) => { 
  return (
    <Layout>
      <Container>
        <ActivitiesList>
          { forms?.map( ( form: any, index: number ) => (
            <Activity key={ index } number={ form.number } name={ form.name } slug={ `/forms/${ form.slug }` } />
          ))}
        </ActivitiesList>
      </Container>
    </Layout>
  )
}

export async function getStaticProps()
{
  let app = createFirebaseApp();
  let firestore = getFirestore( app );

  let formsCollection = collection( firestore, "forms" );
  let formDocsSnapshot = await getDocs( formsCollection );

  let forms = formDocsSnapshot.docs.map( ( doc: DocumentData ) => {
    let { name, slug, number } = doc.data();
    return { name, slug, number };
  });
  
  return {
    props: {
      forms
    },
  };
}

export default Home
