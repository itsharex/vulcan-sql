import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Overview from '../components/Overview';
import Setups from '../components/Setups';
import Head from '@docusaurus/Head';
import Community from '@site/src/components/Community';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Head>
        <title>{siteConfig.title}</title>
        <meta property="og:title" content={siteConfig.title} />
      </Head>
      <main>
        <Overview />
        <Setups />
        <Community />
      </main>
    </Layout>
  );
}
