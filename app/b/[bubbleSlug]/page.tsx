import { notFound, redirect } from "next/navigation";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getActiveServerBubble } from "@/lib/bubble-server";

type BubbleLinkPageProps = {
  params: Promise<{ bubbleSlug: string }>;
};

export default async function BubbleLinkPage({ params }: BubbleLinkPageProps) {
  const { bubbleSlug } = await params;
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const bubble = await getActiveServerBubble(normalizedSlug);
  if (!bubble) notFound();

  redirect(`/${normalizedSlug}`);
}
