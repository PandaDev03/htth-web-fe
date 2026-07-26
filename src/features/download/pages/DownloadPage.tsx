import { PublicFooter } from "@/shared/components/site/PublicFooter";
import { PublicTopbar } from "@/shared/components/site/PublicTopbar";
import { scrollToTop } from "@/shared/utils/utils";
import { useEffect } from "react";

import DownloadIntroPanel from "../components/DownloadIntroPanel";
import PlatformDownloadGrid from "../components/PlatformDownloadGrid";
// import ReleaseHistory from "../components/ReleaseHistory";

const GameDownloadPage = () => {
  useEffect(() => {
    scrollToTop({});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PublicTopbar />
      <main className="flex-1 pt-16">
        <DownloadIntroPanel />
        <PlatformDownloadGrid />
        {/* <ReleaseHistory /> */}
      </main>
      <PublicFooter />
    </div>
  );
};

export default GameDownloadPage;
