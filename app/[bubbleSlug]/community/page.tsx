import { notFound } from "next/navigation";
import CommunityPage from "@/app/demo/community/page";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getActiveServerBubble } from "@/lib/bubble-server";

type BubblePageProps = {
  params: Promise<{ bubbleSlug: string }>;
};

export default async function BubbleCommunityPage({ params }: BubblePageProps) {
  const { bubbleSlug } = await params;
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const bubble = await getActiveServerBubble(normalizedSlug);
  if (!bubble) notFound();

  return <CommunityPage />;
}
