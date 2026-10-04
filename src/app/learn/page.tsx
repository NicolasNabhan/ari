import { LearnFrom } from "./LearnFrom";

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <LearnFrom fromYou={from === "you"} />;
}
