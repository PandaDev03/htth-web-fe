import { scrollToTop } from "@/shared/utils/utils";
import { useEffect } from "react";

import { Footer } from "@/shared/components/site/Footer";
import { Header } from "@/shared/components/site/Header";

import DownloadIntroPanel from "../components/DownloadIntroPanel";
import PlatformDownloadGrid from "../components/PlatformDownloadGrid";
// import ReleaseHistory from "../components/ReleaseHistory";

const GameDownloadPage = () => {
  useEffect(() => {
    scrollToTop({});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 pt-16">
        <DownloadIntroPanel />
        <PlatformDownloadGrid />
        {/* <ReleaseHistory /> */}
      </main>
      <Footer />
    </div>
  );
};

export default GameDownloadPage;
