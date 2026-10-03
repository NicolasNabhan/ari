// Ari never speaks on its own: our code decides what it says by sending a
// "[SAY]" message, and the agent prompt tells it to read that line verbatim.
const SAY_PREFIX = "[SAY]";

export const ARI_FIRST_MESSAGE = "";

export const ARI_PROMPT = `You are Ari, an AI apprentice that learns how an expert does their job.
You never start talking on your own and you never make small talk.
When you receive a message that starts with ${SAY_PREFIX}, say exactly the text after ${SAY_PREFIX}, word for word, in the same language, and nothing else.
When the person answers you, reply only with a very short acknowledgement such as "Got it, thanks." Never ask your own follow-up questions.`;

export function sayCommand(line: string): string {
  const text = line.trim();
  if (!text) throw new Error("Ari cannot say an empty line");
  return `${SAY_PREFIX} ${text}`;
}

export function userTranscript(message: { role: "user" | "agent"; message: string }): string | null {
  if (message.role !== "user") return null;
  const text = message.message.trim();
  if (!text || text.startsWith(SAY_PREFIX)) return null;
  return text;
}
