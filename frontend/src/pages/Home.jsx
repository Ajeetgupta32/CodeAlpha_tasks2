import React from 'react';
import Hero from '../components/Hero';
import FlashDeals from '../components/FlashDeals';
import LatestCollection from '../components/LatestCollection';
import BestSeller from '../components/BestSeller';
import RecentlyViewed from '../components/RecentlyViewed';
import OurPolicy from '../components/OurPolicy';
import NewsletterBox from '../components/NewsletterBox';

const Home = () => {
  return (
    <div>
      <Hero />
      <FlashDeals />
      <LatestCollection />
      <BestSeller />
      <RecentlyViewed />
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
};

export default Home;
