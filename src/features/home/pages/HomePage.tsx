import { PublicFooter } from "@/shared/components/site/PublicFooter";
import { PublicTopbar } from "@/shared/components/site/PublicHeader";
import { scrollToTop } from "@/shared/utils/utils";
import { useEffect } from "react";

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
      <PublicTopbar />
      <main className="flex-1">
        <OceanWelcomeHero />
        <ZaloCommunityBanner />
        <AdminNoticeBoard />
        <CompactDownloadShowcase />
      </main>
      <PublicFooter />
    </div>
  );
}

export default PirateLandingPage;
