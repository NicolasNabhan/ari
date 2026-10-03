"use client";

import { useEffect, useRef, useState } from "react";
import { northwind } from "@/lib/northwind/seed";

export type SentMessage = { channel: "chat" | "email"; to: string; text: string };

// Typing in a message or being on a call marks the expert as busy, so Ari can
// hold its questions until they're free.
const TYPING_IDLE_MS = 3000;

export function Messages({
  sent,
  onSend,
  onBusy,
}: {
  sent: SentMessage[];
  onSend: (m: SentMessage) => void;
  onBusy: (busy: boolean, reason: "typing" | "call") => void;
}) {
  const [to, setTo] = useState(northwind.people[0].id);
  const [channel, setChannel] = useState<"chat" | "email">("chat");
  const [text, setText] = useState("");
  const [onCall, setOnCall] = useState(false);
  const typing = useRef(false);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopTyping() {
    if (idle.current) clearTimeout(idle.current);
    if (typing.current) {
      typing.current = false;
      onBusy(false, "typing");
    }
  }

  useEffect(() => () => stopTyping(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function type(value: string) {
    setText(value);
    if (!typing.current) {
      typing.current = true;
      onBusy(true, "typing");
    }
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }

  function send() {
    if (!text.trim()) return;
    onSend({ channel, to, text: text.trim() });
    setText("");
    stopTyping();
  }

  function toggleCall() {
    setOnCall(!onCall);
    onBusy(!onCall, "call");
  }

  const person = northwind.people.find((p) => p.id === to)!;
  const thread = sent.filter((m) => m.to === to);
  return (
    <section className="flex gap-4">
      <ul className="w-56 shrink-0 space-y-1">
        {northwind.people.map((p) => (
          <li key={p.id}>
            <button data-ari={`person-${p.id}`} onClick={() => setTo(p.id)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${p.id === to ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-zinc-500">{p.role}</div>
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0 flex-1 rounded-xl border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold">{person.name}</h1>
          <div className="flex gap-2 text-sm">
            {(["chat", "email"] as const).map((c) => (
              <button key={c} data-ari={`channel-${c}`} onClick={() => setChannel(c)} className={`rounded px-2 py-1 ${channel === c ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}>
                {c === "chat" ? "Chat" : "Email"}
              </button>
            ))}
            <button data-ari="call-toggle" onClick={toggleCall} className={`rounded px-2 py-1 font-medium ${onCall ? "bg-red-600 text-white" : "border dark:border-zinc-700"}`}>
              {onCall ? "End call" : "Call"}
            </button>
          </div>
        </div>
        {onCall && <p className="mt-2 text-sm text-red-600">On a call with {person.name}…</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {thread.length === 0 && <li className="text-zinc-400">No messages yet.</li>}
          {thread.map((m, i) => (
            <li key={i} className="ml-auto max-w-[80%] rounded-lg bg-indigo-600 px-3 py-2 text-white">
              <span className="text-xs opacity-70">{m.channel}</span>
              <div>{m.text}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            data-ari="message-input"
            className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder={channel === "chat" ? `Message ${person.name}` : `Email ${person.name}`}
            value={text}
            onChange={(e) => type(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button data-ari="message-send" onClick={send} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
