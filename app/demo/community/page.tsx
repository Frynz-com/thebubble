import { CommunityBoard } from "@/components/community-board";
import { MobilePage } from "@/components/mobile-page";

export default function CommunityPage() {
  return (
    <MobilePage title="Community" subtitle="Eine einfache Pinnwand für alle vor Ort.">
      <CommunityBoard />
    </MobilePage>
  );
}
