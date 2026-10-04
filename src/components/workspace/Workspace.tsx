"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { northwind, quoteFor } from "@/lib/northwind/seed";
import type { ApprovalRoute, Screen } from "@/lib/workspace/events";
import { EventBusProvider, useEventBus } from "@/lib/workspace/WorkspaceContext";
import { loadProfile, MARIA, NEWCOMER, saveProfile, type Audience, type Profile } from "@/lib/workspace/profile";
import type { Lessons } from "@/lib/apprentice/types";
import { CoachBar } from "@/components/apprentice/CoachBar";
import { IntroOverlay } from "@/components/apprentice/IntroOverlay";
import { TipsBar } from "@/components/apprentice/TipsBar";
import {
  ArrowRight,
  BellRing,
  BookText,
  Building2,
  CalendarCheck,
  CalendarDays,
  FolderOpen,
  ClipboardList,
  Flag,
  GraduationCap,
  Inbox as InboxIcon,
  MessageCircleQuestion,
  MessagesSquare,
  MousePointerClick,
  PhoneOff,
  ScanEye,
  ScrollText,
  Sparkles,
  Stamp,
  Store,
  Calculator,
  X,
  type LucideIcon,
} from "lucide-react";
import { ProfileForm } from "./ProfileForm";
import { Inbox } from "./Inbox";
import { RequestQueue } from "./RequestQueue";
import { Vendors } from "./Vendors";
import { EventLog } from "./EventLog";
import { ScoringSheet } from "./ScoringSheet";
import { Approvals } from "./Approvals";
import { Messages, type SentMessage } from "./Messages";
import { Procedure } from "./Procedure";
import { WeekView } from "./WeekView";
import { ContextHub } from "./ContextHub";
import { DecisionCards } from "@/components/apprentice/DecisionCards";
import { useApprentice } from "@/components/apprentice/useApprentice";
import { useRecording } from "@/lib/workspace/useRecording";
import { ReviewList } from "@/components/apprentice/ReviewList";
import { ProcedureView } from "@/components/apprentice/ProcedureView";
import { AriProvider } from "@/components/ari/AriProvider";
import { WalkthroughPresenter } from "@/components/walkthrough/WalkthroughPresenter";
import { SCRIPT } from "@/lib/walkthrough/script";
import { navigate, replayTo, type NavAction } from "@/lib/walkthrough/replay";
import { useGaze } from "@/components/gaze/useGaze";
import { GazeControl, GazeDot } from "@/components/gaze/GazeControl";
import { AttentionReview } from "@/components/gaze/AttentionReview";

export function Workspace({
  audience,
  lessons,
  guided = false,
  walkthrough = false,
}: {
  audience: Audience;
  lessons?: Lessons;
  guided?: boolean;
  walkthrough?: boolean;
}) {
  return (
    <EventBusProvider>
      <AriProvider>
        <WorkspaceShell audience={audience} lessons={lessons} guided={guided} walkthrough={walkthrough} />
      </AriProvider>
    </EventBusProvider>
  );
}

const NAV: { screen: Screen; label: string; icon: LucideIcon }[] = [
  { screen: "inbox", label: "Inbox", icon: InboxIcon },
  { screen: "requests", label: "Requests", icon: ClipboardList },
  { screen: "vendors", label: "Vendors & quotes", icon: Store },
  { screen: "scoring", label: "Scoring sheet", icon: Calculator },
  { screen: "approvals", label: "Approvals", icon: Stamp },
  { screen: "messages", label: "Chat & email", icon: MessagesSquare },
  { screen: "procedure", label: "Procedure", icon: BookText },
  { screen: "week", label: "Week & schedule", icon: CalendarDays },
  { screen: "context", label: "Files & meetings", icon: FolderOpen },
];

function WorkspaceShell({ audience, lessons, guided, walkthrough }: { audience: Audience; lessons?: Lessons; guided: boolean; walkthrough: boolean }) {
  const bus = useEventBus();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [screenLocal, setScreen] = useState<Screen>("inbox");
  const [openRequestLocal, setOpenRequestId] = useState<string | null>(null);
  const [quotedLocal, setQuoted] = useState<Record<string, string[]>>({});
  const [selectedLocal, setSelected] = useState<Record<string, string>>({});
  const [scoresLocal, setScores] = useState<Record<string, Record<string, number>>>({});
  const [routesLocal, setRoutes] = useState<Record<string, ApprovalRoute>>({});
  const [issuedLocal, setIssued] = useState<Record<string, boolean>>({});
  // Step 1: Maria's session plays from a script; the workspace shows whatever
  // the script has reached, and Ari's cards come from replaying it.
  const [position, setPosition] = useState(0);
  const [blocked, setBlocked] = useState<string | null>(null); // Ari's warning when it stopped an approval
  const [sidePanel, setSidePanel] = useState<"week" | "context" | null>(null);
  // Moving forward one beat, Maria's clicks land one at a time (the presenter
  // animates them); any other move shows the beat already done.
  const [clicksShown, setClicksShown] = useState(Infinity);
  const wt = useMemo(() => (walkthrough ? replayTo(SCRIPT, position, clicksShown) : null), [walkthrough, position, clicksShown]);
  function walk(action: NavAction) {
    const next = navigate(SCRIPT, position, action);
    if (next === position) return;
    setPosition(next);
    setClicksShown(action === "next" ? 0 : Infinity);
  }
  const screen = wt ? wt.workspace.screen : screenLocal;
  const openRequestId = wt ? wt.workspace.openRequestId : openRequestLocal;
  const quoted = wt ? wt.workspace.quoted : quotedLocal;
  const selected = wt ? wt.workspace.selected : selectedLocal;
  const scores = wt ? wt.workspace.scores : scoresLocal;
  const routes = wt ? wt.workspace.routes : routesLocal;
  const issued = wt ? wt.workspace.issued : issuedLocal;
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [callWith, setCallWith] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [started, setStarted] = useState(false);
  const live = useApprentice(bus, profile, audience, started && !walkthrough, lessons);
  const { teachingStep, check, askWhy, showMe, lang, tapToHear, setTapToHear, questionWaiting, hearQuestion, review, attend } = live;
  const cards = wt ? wt.cards : live.cards;
  const task = wt ? wt.core.task : live.task;
  const teaching = audience === "newcomer";
  useRecording(!!profile);
  // Eye tracking: opt-in, expert only, while the session runs.
  const gaze = useGaze({ screen, enabled: !teaching && !walkthrough && started && !review.ended, onRecord: attend });
  const [gazeReview, setGazeReview] = useState<"auto" | "open" | "closed">("auto");

  useEffect(() => {
    // Browser storage is only readable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(walkthrough ? MARIA : loadProfile(audience));
    setLoaded(true);
  }, [audience, walkthrough]);

  const requests = northwind.requests.filter((r) => r.audience === audience);
  const currentRequest = () => requests.find((r) => r.id === openRequestId) ?? null;

  function go(next: Screen) {
    // Step 1: the big-picture screens open as a panel; Maria's walkthrough stays where it is.
    if (wt) {
      if (next === "week" || next === "context") setSidePanel(next);
      return;
    }
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
    const event = { type: "approval_routed", requestId, vendorId: selected[requestId], amount: amountFor(requestId), to } as const;
    const warning = check(event);
    if (warning) return setBlocked(warning); // Ari warned; a second click goes ahead
    setBlocked(null);
    setRoutes((r) => ({ ...r, [requestId]: to }));
    bus.emit(event);
  }

  function issuePo(requestId: string) {
    setIssued((i) => ({ ...i, [requestId]: true }));
    bus.emit({ type: "po_issued", requestId, vendorId: selected[requestId], amount: amountFor(requestId) });
  }

  // The call stays on across screens until it's ended, from chat or the header.
  function toggleCall(personId: string) {
    const ending = callWith !== null;
    setCallWith(ending ? null : personId);
    bus.emit({ type: "busy_changed", busy: !ending, reason: "call" });
  }

  function sendMessage(m: SentMessage) {
    setSent((s) => [...s, m]);
    bus.emit({ type: "message_sent", ...m });
  }

  if (!loaded) return null;

  if (!profile) {
    return (
      <ProfileForm
        initial={audience === "expert" ? MARIA : NEWCOMER}
        onSave={(p) => {
          saveProfile(audience, p);
          setProfile(p);
          bus.emit({ type: "profile_saved", ...p });
        }}
      />
    );
  }

  const userName = profile.name;
  return (
    <div className="flex min-h-screen flex-col text-zinc-900">
      <header data-gaze-ignore="" className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-4 border-b border-white/60 bg-white/80 px-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" title="Back to start">
            <span className="grid h-8 w-8 place-items-center rounded-xl text-white shadow-md shadow-ari-500/30 ari-gradient-animated">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight ari-gradient-text">Ari</span>
          </Link>
          <span className="h-5 w-px bg-zinc-200" />
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-600">
            <Building2 className="h-4 w-4 text-zinc-400" />
            {profile.company}
          </span>
          <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${teaching ? "bg-emerald-50 text-emerald-700" : "bg-ari-50 text-ari-700"}`}>
            {teaching ? "Learning mode" : "Ari is watching"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {task && (
            <span data-ari="today-task" className="ari-rise hidden max-w-xs items-center gap-1.5 truncate rounded-full bg-amber-50 px-3 py-1 text-amber-800 lg:flex">
              <CalendarCheck className="h-4 w-4 shrink-0" /> <span className="truncate">Today: {task.text}</span>
            </span>
          )}
          {callWith && (
            <button data-ari="end-call" onClick={() => toggleCall(callWith)} className="ari-rise flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 font-medium text-white shadow-md shadow-rose-500/30">
              <PhoneOff className="h-4 w-4" /> End call with {northwind.people.find((p) => p.id === callWith)?.name.split(" ")[0]}
            </button>
          )}
          {!teaching && !walkthrough && started && !review.ended && <GazeControl gaze={gaze} />}
          {review.ended && gaze.records.length > 0 && (
            <button data-ari="gaze-replay" onClick={() => setGazeReview("open")} className="ari-rise ari-lift flex items-center gap-1.5 rounded-full border border-ari-200 bg-white px-3 py-1.5 font-medium text-ari-700">
              <ScanEye className="h-4 w-4" /> Where your eyes went
            </button>
          )}
          {!teaching && !walkthrough && started && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-zinc-600 hover:bg-zinc-100" title="Ari shows a signal instead of speaking up; tap it when you're ready">
              <input data-ari="tap-to-hear" type="checkbox" className="accent-[var(--color-ari-600)]" checked={tapToHear} onChange={(e) => setTapToHear(e.target.checked)} />
              <BellRing className="h-4 w-4 text-zinc-400" /> Tap to hear
            </label>
          )}
          {started && !teaching && (wt ? !wt.core.ended : !review.ended) && (
            <button data-ari="end-session" onClick={wt ? undefined : review.end} className="ari-lift flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 font-medium text-zinc-700">
              <Flag className="h-4 w-4" /> End session
            </button>
          )}
          {review.ended && (
            <a data-ari="teach-back" href="/learn?from=you" className="ari-rise ari-lift flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
              <GraduationCap className="h-4 w-4" /> Now watch Ari teach it <ArrowRight className="h-4 w-4" />
            </a>
          )}
          <span className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm ring-1 ring-zinc-200/70">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-coral-400 text-xs font-bold text-white">{userName.charAt(0)}</span>
            <span className="hidden text-zinc-700 md:inline">
              {userName} <span className="text-zinc-400">· {profile.role}</span>
            </span>
          </span>
        </div>
      </header>
      <div className="flex flex-1">
        <nav data-gaze-ignore="" className="w-[4.5rem] shrink-0 p-3 xl:w-56">
          <ul className="ari-stagger space-y-1">
            {NAV.map(({ screen: s, label, icon: Icon }) => (
              <li key={s}>
                <button
                  data-ari={`nav-${s}`}
                  onClick={() => go(s)}
                  title={label}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium transition-all xl:px-3 ${
                    screen === s ? "bg-white text-ari-700 shadow-sm ring-1 ring-ari-100" : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                  }`}
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${screen === s ? "text-white ari-gradient" : "bg-white text-zinc-500 ring-1 ring-zinc-200/70"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="hidden xl:inline">{label}</span>
                  {wt && (s === "week" || s === "context") && (
                    <span className="ml-auto rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white xl:inline" title="New: Ari learns from these too">
                      New
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main key={screen} className={`ari-rise min-w-0 flex-1 p-6 ${guided && !teaching && started ? "pt-56" : teaching && started ? "pt-24" : ""}`}>          {screen === "inbox" && <Inbox requests={requests} onOpen={openRequest} onOpenPlan={teaching ? () => go("week") : undefined} />}
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
              controlled={wt ? { ticked: wt.workspace.ticked, historyFor: wt.workspace.historyFor } : undefined}
            />
          )}
          {screen === "scoring" && (
            <ScoringSheet
              request={currentRequest()}
              quoted={openRequestId ? quoted[openRequestId] ?? [] : []}
              scores={openRequestId ? scores[openRequestId] ?? {} : {}}
              onScore={(vendorId, score) => openRequestId && enterScore(openRequestId, vendorId, score)}
              controlledDraft={wt?.workspace.scoreDraft}
            />
          )}
          {screen === "approvals" && (
            <Approvals
              request={currentRequest()}
              vendorId={openRequestId ? selected[openRequestId] ?? null : null}
              route={openRequestId ? routes[openRequestId] ?? null : null}
              poIssued={openRequestId ? !!issued[openRequestId] : false}
              onRoute={(to) => openRequestId && route(openRequestId, to)}
              warning={blocked}
              onIssuePo={() => openRequestId && issuePo(openRequestId)}
            />
          )}
          {screen === "messages" && (
            <Messages
              sent={sent}
              onSend={sendMessage}
              onBusy={(busy, reason) => bus.emit({ type: "busy_changed", busy, reason })}
              callWith={callWith}
              onToggleCall={toggleCall}
            />
          )}
          {screen === "procedure" && <Procedure />}
          {screen === "week" && <WeekView audience={audience} lessons={lessons} />}
          {screen === "context" && <ContextHub audience={audience} />}
        </main>
        <aside data-gaze-ignore="" className="w-80 shrink-0 2xl:w-[22rem] space-y-5 overflow-y-auto border-l border-white/60 bg-white/50 p-4 pb-96 backdrop-blur">
          {teaching ? (
            <>
              {started && (
                <div className="ari-rise grid grid-cols-2 gap-2">
                  <button data-ari="ask-why" onClick={askWhy} className="ari-lift flex items-center justify-center gap-2 rounded-2xl border border-ari-200 bg-white px-3 py-3 text-sm font-semibold text-ari-700">
                    <MessageCircleQuestion className="h-4 w-4" />
                    {lang === "es-ES" ? "¿Por qué?" : "Ask why"}
                  </button>
                  <button data-ari="show-me" onClick={showMe} className="ari-lift flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient">
                    <MousePointerClick className="h-4 w-4" />
                    {lang === "es-ES" ? "Muéstramelo" : "Show me"}
                  </button>
                </div>
              )}
              {lessons && (
                <>
                  <ProcedureView lessons={lessons} />
                  <DecisionCards title={`${lessons.expert}'s playbook`} cards={lessons.cards} activeStep={teachingStep} expert={lessons.expert} />
                </>
              )}
            </>
          ) : (
            <DecisionCards cards={cards} expert={profile.name} />
          )}
          <div>
            <button onClick={() => setShowLog(!showLog)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600">
              <ScrollText className="h-3.5 w-3.5" /> {showLog ? "Hide" : "Show"} event log
            </button>
            {showLog && (
              <div className="mt-2">
                <EventLog />
              </div>
            )}
          </div>
        </aside>
      </div>
      {!started && <IntroOverlay mode={teaching ? "newcomer" : walkthrough ? "walkthrough" : "expert"} onStart={() => setStarted(true)} />}
      {sidePanel && (
        <div className="fixed inset-0 z-[46] flex justify-center bg-[#1d1a2f]/40 p-6 pb-24 backdrop-blur-sm" onClick={() => setSidePanel(null)}>
          <section
            data-ari="side-panel"
            onClick={(e) => e.stopPropagation()}
            className="ari-pop relative w-full max-w-5xl overflow-y-auto rounded-3xl bg-[#f7f5ff] p-6 shadow-2xl"
          >
            <button
              data-ari="close-side-panel"
              onClick={() => setSidePanel(null)}
              className="sticky top-0 float-right z-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 shadow ring-1 ring-zinc-200"
            >
              <X className="h-4 w-4" /> Back to Maria
            </button>
            {sidePanel === "week" ? <WeekView audience="expert" /> : <ContextHub audience="expert" />}
          </section>
        </div>
      )}
      {wt && started && !sidePanel && <WalkthroughPresenter view={wt} onNavigate={walk} onClicksShown={setClicksShown} />}
      {guided && !teaching && started && <CoachBar task={task} cards={cards} ended={review.ended} screen={screen} />}
      {teaching && started && <TipsBar lang={lang} />}
      {review.list && (
        <ReviewList
          cards={review.list.map((id) => cards.find((c) => c.id === id)!).filter(Boolean)}
          onConfirm={review.confirm}
          onCorrect={review.correct}
          onDone={review.skip}
        />
      )}
      <GazeDot on={gaze.active && gaze.showDot} mouse={gaze.mode === "mouse"} dot={gaze.setDot} />
      {review.ended && gaze.records.length > 0 && gazeReview !== "closed" && (gazeReview === "open" || !review.list) && (
        <AttentionReview records={gaze.records} expert={profile.name} onClose={() => setGazeReview("closed")} />
      )}
      {questionWaiting && (
        <button
          data-ari="hear-question"
          onClick={hearQuestion}
          className="ari-rise fixed bottom-36 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient-animated"
        >
          <BellRing className="h-4 w-4 animate-bounce" /> Ari has a question · tap to hear
        </button>
      )}
    </div>
  );
}
