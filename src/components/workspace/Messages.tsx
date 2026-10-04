"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, MessageSquare, MessagesSquare, Phone, PhoneOff, SendHorizontal } from "lucide-react";
import { northwind } from "@/lib/northwind/seed";
import { PageTitle, PersonAvatar } from "./PageTitle";

export type SentMessage = { channel: "chat" | "email"; to: string; text: string };

// Typing in a message or being on a call marks the expert as busy, so Ari can
// hold its questions until they're free.
const TYPING_IDLE_MS = 3000;

export function Messages({
  sent,
  onSend,
  onBusy,
  callWith,
  onToggleCall,
}: {
  sent: SentMessage[];
  onSend: (m: SentMessage) => void;
  onBusy: (busy: boolean, reason: "typing") => void;
  callWith: string | null; // person id, if on a call
  onToggleCall: (personId: string) => void;
}) {
  const [to, setTo] = useState(northwind.people[0].id);
  const [channel, setChannel] = useState<"chat" | "email">("chat");
  const [text, setText] = useState("");
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

  const person = northwind.people.find((p) => p.id === to)!;
  const onCall = callWith === to;
  const thread = sent.filter((m) => m.to === to);
  return (
    <section>
      <PageTitle icon={MessagesSquare} title="Chat & email" subtitle="Talk to colleagues and suppliers" tone="sky" />
      <div className="flex gap-4">
        <ul className="ari-stagger w-60 shrink-0 space-y-1">
          {northwind.people.map((p) => (
            <li key={p.id}>
              <button
                data-ari={`person-${p.id}`}
                onClick={() => setTo(p.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition-all ${
                  p.id === to ? "bg-white shadow-sm ring-1 ring-ari-100" : "hover:bg-white/70"
                }`}
              >
                <PersonAvatar name={p.name} />
                <span className="min-w-0">
                  <span className="block font-semibold text-zinc-900">{p.name}</span>
                  <span className="block truncate text-xs text-zinc-500">{p.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex min-h-[420px] min-w-0 flex-1 flex-col rounded-3xl border border-zinc-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-3">
              <PersonAvatar name={person.name} />
              <div>
                <h2 className="font-semibold text-zinc-900">{person.name}</h2>
                <p className="text-xs text-zinc-500">{person.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 text-sm">
              {(["chat", "email"] as const).map((c) => (
                <button
                  key={c}
                  data-ari={`channel-${c}`}
                  onClick={() => setChannel(c)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${channel === c ? "bg-white text-ari-700 shadow-sm" : "text-zinc-500"}`}
                >
                  {c === "chat" ? <MessageSquare className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                  {c === "chat" ? "Chat" : "Email"}
                </button>
              ))}
            </div>
            <button
              data-ari="call-toggle"
              onClick={() => onToggleCall(to)}
              className={`ari-lift flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${onCall ? "bg-rose-500 text-white" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}
            >
              {onCall ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />} {onCall ? "End call" : "Call"}
            </button>
          </div>
          {onCall && (
            <p className="ari-rise mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              <span className="h-2 w-2 animate-ping rounded-full bg-rose-500" /> On a call with {person.name}…
            </p>
          )}
          <ul className="mt-4 flex-1 space-y-2 text-sm">
            {thread.length === 0 && <li className="mt-10 text-center text-zinc-400">No messages yet. Say hello.</li>}
            {thread.map((m, i) => (
              <li key={i} className="ari-rise ml-auto max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2 text-white shadow-md shadow-ari-500/20 ari-gradient">
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider opacity-80">
                  {m.channel === "chat" ? <MessageSquare className="h-3 w-3" /> : <Mail className="h-3 w-3" />} {m.channel}
                </span>
                <div>{m.text}</div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input
              data-ari="message-input"
              className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-ari-400 focus:bg-white focus:ring-2 focus:ring-ari-100"
              placeholder={channel === "chat" ? `Message ${person.name}` : `Email ${person.name}`}
              value={text}
              onChange={(e) => type(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button data-ari="message-send" onClick={send} title="Send" className="ari-lift grid w-12 place-items-center rounded-2xl text-white shadow-md shadow-ari-500/30 ari-gradient">
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
