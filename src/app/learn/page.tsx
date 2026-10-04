import { LearnFrom } from "./LearnFrom";

// /learn               teach mode from Maria's preloaded session
// /learn?from=you      teach mode from what you just taught Ari (/teach)
// /learn?from=story    teach mode on the story stage, continuing /story
export default async function LearnPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <LearnFrom fromYou={from === "you"} story={from === "story"} />;
}
