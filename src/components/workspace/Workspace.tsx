"use client";

import { useEffect, useState } from "react";
import { northwind, quoteFor } from "@/lib/northwind/seed";
import type { ApprovalRoute, Screen } from "@/lib/workspace/events";
import { EventBusProvider, useEventBus } from "@/lib/workspace/WorkspaceContext";
import { loadProfile, MARIA, saveProfile, type Profile } from "@/lib/workspace/profile";
import { ProfileForm } from "./ProfileForm";
import { Inbox } from "./Inbox";
import { RequestQueue } from "./RequestQueue";
import { Vendors } from "./Vendors";
import { EventLog } from "./EventLog";
import { ScoringSheet } from "./ScoringSheet";
import { Approvals } from "./Approvals";
import { Messages, type SentMessage } from "./Messages";
import { Procedure } from "./Procedure";

export type Audience = "expert" | "newcomer";

export function Workspace({ audience }: { audience: Audience }) {
  return (
    <EventBusProvider>
      <WorkspaceShell audience={audience} />
    </EventBusProvider>
  );
}

const NAV: { screen: Screen; label: string }[] = [
  { screen: "inbox", label: "Inbox" },
  { screen: "requests", label: "Requests" },
  { screen: "vendors", label: "Vendors & quotes" },
  { screen: "scoring", label: "Scoring sheet" },
  { screen: "approvals", label: "Approvals" },
  { screen: "messages", label: "Chat & email" },
  { screen: "procedure", label: "Procedure" },
];

function WorkspaceShell({ audience }: { audience: Audience }) {
  const bus = useEventBus();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>("inbox");
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [quoted, setQuoted] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [routes, setRoutes] = useState<Record<string, ApprovalRoute>>({});
  const [issued, setIssued] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<SentMessage[]>([]);

  useEffect(() => {
    // Browser storage is only readable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(loadProfile());
    setLoaded(true);
  }, []);

  const requests = northwind.requests.filter((r) => r.audience === audience);
  const currentRequest = () => requests.find((r) => r.id === openRequestId) ?? null;

  function go(next: Screen) {
    setScreen(next);
    bus.emit({ type: "screen_opened", screen: next });
  }

  function openRequest(requestId: string) {
    setOpenRequestId(requestId);
    setScreen("requests");
    bus.emit({ type: "request_opened", requestId });
  }

  function requestQuotes(requestId: string, vendorIds: string[]) {
    setQuoted((q) => ({ ...q, [requestId]: vendorIds }));
    bus.emit({ type: "quotes_requested", requestId, vendorIds });
  }

  function selectVendor(requestId: string, vendorId: string) {
    const previousVendorId = selected[requestId] ?? null;
    if (previousVendorId === vendorId) return;
    setSelected((s) => ({ ...s, [requestId]: vendorId }));
    bus.emit({ type: "vendor_selected", requestId, vendorId, previousVendorId });
  }

  function enterScore(requestId: string, vendorId: string, score: number) {
    setScores((s) => ({ ...s, [requestId]: { ...s[requestId], [vendorId]: score } }));
    bus.emit({ type: "score_entered", requestId, vendorId, score });
  }

  function amountFor(requestId: string) {
    return quoteFor(selected[requestId], requestId)!.total;
  }

  function route(requestId: string, to: ApprovalRoute) {
    setRoutes((r) => ({ ...r, [requestId]: to }));
    bus.emit({ type: "approval_routed", requestId, vendorId: selected[requestId], amount: amountFor(requestId), to });
  }

  function issuePo(requestId: string) {
    setIssued((i) => ({ ...i, [requestId]: true }));
    bus.emit({ type: "po_issued", requestId, vendorId: selected[requestId], amount: amountFor(requestId) });
  }

  function sendMessage(m: SentMessage) {
    setSent((s) => [...s, m]);
    bus.emit({ type: "message_sent", ...m });
  }

  if (!loaded) return null;

  if (!profile) {
    return (
      <ProfileForm
        initial={MARIA}
        onSave={(p) => {
          saveProfile(p);
          setProfile(p);
          bus.emit({ type: "profile_saved", ...p });
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="font-semibold">{profile.company}</span>
        <span className="text-sm text-zinc-500">
          {profile.name} · {profile.role}
        </span>
      </header>
      <div className="flex flex-1">
        <nav className="w-48 shrink-0 border-r bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          {NAV.map((n) => (
            <button
              key={n.screen}
              data-ari={`nav-${n.screen}`}
              onClick={() => go(n.screen)}
              className={`mb-1 block w-full rounded-md px-3 py-2 text-left text-sm ${
                screen === n.screen ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <main className="min-w-0 flex-1 p-6">
          {screen === "inbox" && <Inbox requests={requests} onOpen={openRequest} />}
          {screen === "requests" && (
            <RequestQueue
              requests={requests}
              openRequestId={openRequestId}
              onOpen={openRequest}
              quoted={quoted}
              selected={selected}
              onGoToVendors={() => go("vendors")}
            />
          )}
          {screen === "vendors" && (
            <Vendors
              request={currentRequest()}
              quoted={openRequestId ? quoted[openRequestId] ?? [] : []}
              selectedVendorId={openRequestId ? selected[openRequestId] ?? null : null}
              onRequestQuotes={requestQuotes}
              onSelect={selectVendor}
              onOpenHistory={(vendorId) => bus.emit({ type: "delivery_history_opened", vendorId })}
            />
          )}
          {screen === "scoring" && (
            <ScoringSheet
              request={currentRequest()}
              quoted={openRequestId ? quoted[openRequestId] ?? [] : []}
              scores={openRequestId ? scores[openRequestId] ?? {} : {}}
              onScore={(vendorId, score) => openRequestId && enterScore(openRequestId, vendorId, score)}
            />
          )}
          {screen === "approvals" && (
            <Approvals
              request={currentRequest()}
              vendorId={openRequestId ? selected[openRequestId] ?? null : null}
              route={openRequestId ? routes[openRequestId] ?? null : null}
              poIssued={openRequestId ? !!issued[openRequestId] : false}
              onRoute={(to) => openRequestId && route(openRequestId, to)}
              onIssuePo={() => openRequestId && issuePo(openRequestId)}
            />
          )}
          {screen === "messages" && <Messages sent={sent} onSend={sendMessage} onBusy={(busy, reason) => bus.emit({ type: "busy_changed", busy, reason })} />}
          {screen === "procedure" && <Procedure />}
        </main>
        <aside className="w-80 shrink-0 border-l bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <EventLog />
        </aside>
      </div>
    </div>
  );
}
