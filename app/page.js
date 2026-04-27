import HomeClient from '@/components/HomeClient';
import Footer from '@/components/Footer';
import SubscriptionBanner from '@/components/SubscriptionBanner';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      {/* 
        🎬 CINEMATIC VIDEO FIRST
        The HomeClient contains the VideoHeroBanner at its top.
        This ensures a high-impact, visual first impression.
      */}
      <HomeClient />

      <SubscriptionBanner />
      <Footer />
    </>
  );
}
