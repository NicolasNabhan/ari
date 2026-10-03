import { VoiceCheck } from "@/components/VoiceCheck";

export default function VoiceCheckPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Voice check</h1>
      <p className="mt-2 text-zinc-500">
        Ari stays silent until our code tells it what to say. Connect, press the button, then answer out loud.
      </p>
      <div className="mt-8">
        <VoiceCheck />
      </div>
    </main>
  );
}
