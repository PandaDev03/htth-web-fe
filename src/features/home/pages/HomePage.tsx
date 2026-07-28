import { useEffect } from "react";

import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";
import { scrollToTop } from "@/shared/utils/utils";

import AdminNoticeBoard from "../components/AdminNoticeBoard";
import CompactDownloadShowcase from "../components/CompactDownloadShowcase";
import OceanWelcomeHero from "../components/OceanWelcomeHero";
import ZaloCommunityBanner from "../components/ZaloCommunityBanner";

function PirateLandingPage() {
  useEffect(() => {
    scrollToTop({});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <OceanWelcomeHero />
        <ZaloCommunityBanner />
        <AdminNoticeBoard />
        <CompactDownloadShowcase />
      </main>
      <Footer />
    </div>
  );
}

export default PirateLandingPage;
