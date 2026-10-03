"use client";

import { useState } from "react";
import {
  ConversationProvider,
  useConversationControls,
  useConversationStatus,
  type MessagePayload,
} from "@elevenlabs/react";
import { ARI_FIRST_MESSAGE, ARI_PROMPT, sayCommand, userTranscript } from "@/lib/voice/speech";

const GREETING = "Hi Maria, what are you working on today?";

export function VoiceCheck() {
  // The mic stays muted until Ari has asked something, so the agent never
  // reacts to the expert talking to someone else.
  const [muted, setMuted] = useState(true);
  const [transcripts, setTranscripts] = useState<string[]>([]);

  function onMessage(message: MessagePayload) {
    const text = userTranscript(message);
    if (!text) return;
    setTranscripts((t) => [...t, text]);
    setMuted(true);
  }

  return (
    <ConversationProvider isMuted={muted} onMutedChange={setMuted} onMessage={onMessage}>
      <Controls onAsked={() => setMuted(false)} listening={!muted} />
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">What you said</h2>
        {transcripts.length === 0 ? (
          <p className="mt-2 text-zinc-400">Nothing yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {transcripts.map((t, i) => (
              <li key={i} className="rounded bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                {t}
              </li>
            ))}
          </ul>
        )}
      </section>
    </ConversationProvider>
  );
}

function Controls({ onAsked, listening }: { onAsked: () => void; listening: boolean }) {
  const { startSession, endSession, sendUserMessage } = useConversationControls();
  const { status, message } = useConversationStatus();
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setError(null);
    let body: { token?: string; error?: string };
    try {
      body = await (await fetch("/api/voice/token")).json();
    } catch {
      setError("Could not reach the voice service");
      return;
    }
    if (!body.token) {
      setError(body.error ?? "Could not get a voice token");
      return;
    }
    startSession({
      conversationToken: body.token,
      connectionType: "webrtc",
      overrides: { agent: { prompt: { prompt: ARI_PROMPT }, firstMessage: ARI_FIRST_MESSAGE } },
    });
  }

  function ask() {
    sendUserMessage(sayCommand(GREETING));
    onAsked();
  }

  const connected = status === "connected";
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        Status: <span className="font-mono">{status}</span>
        {listening && connected ? " · listening for your answer" : ""}
        {message ? ` · ${message}` : ""}
      </p>
      <div className="flex gap-3">
        {!connected ? (
          <button onClick={connect} className="rounded-lg bg-zinc-900 px-4 py-2 text-white dark:bg-white dark:text-zinc-900">
            Connect Ari
          </button>
        ) : (
          <>
            <button onClick={ask} className="rounded-lg bg-indigo-600 px-4 py-2 text-white">
              Ari, ask: &ldquo;{GREETING}&rdquo;
            </button>
            <button onClick={endSession} className="rounded-lg border px-4 py-2">
              Disconnect
            </button>
          </>
        )}
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
