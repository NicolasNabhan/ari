import { claudeJudge } from "@/lib/apprentice/claudeJudge";
import type { JudgeCall } from "@/lib/apprentice/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json({ error: "Claude Judge not configured" }, { status: 503 });
  }
  const call = (await request.json()) as JudgeCall;
  try {
    return Response.json(await claudeJudge(call));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Judge failed" }, { status: 502 });
  }
}
