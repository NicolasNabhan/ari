// A no-network Judge that guesses like someone who follows the written
// procedure to the letter. Used until the Claude-backed Judge is configured.
import { quoteFor } from "@/lib/northwind/seed";
import type { JudgeCall, JudgeResult } from "./types";

export function ruleJudge(call: JudgeCall): JudgeResult {
  if (call.stepId === "vendor") {
    const cheapest = [...call.options].sort(
      (a, b) => (quoteFor(a.id, call.requestId)?.total ?? Infinity) - (quoteFor(b.id, call.requestId)?.total ?? Infinity),
    )[0];
    return { kind: "predict", optionId: cheapest.id };
  }
  const byProcedure = call.options.find((o) => o.status === "procedure") ?? call.options[0];
  return { kind: "predict", optionId: byProcedure.id };
}
