// Teach mode: turning what Ari learned from the expert into spoken guidance
// for a newcomer (in English or Spanish), "show me" cursor moves, and the
// must-follow rules it checks before they act.
import { citationsFor } from "@/lib/context/knowledge";
import { largestOrder, northwind, vendor, vendorsQuoting } from "@/lib/northwind/seed";
import type { Profile } from "@/lib/workspace/profile";
import type { WorkspaceEvent } from "@/lib/workspace/events";
import { levelOf } from "./reasonTypes";
import type { CursorAction, DecisionCard, Guardrail, Lang, Lessons, StepId } from "./types";

const lcfirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type Phrases = {
  intro: (name: string, expert: string) => string;
  step: Record<StepId, string>;
  options: (names: string[]) => string;
  whenDid: (expert: string, subject: string) => string;
  chose: (expert: string, what: string) => string;
  choseTo: (label: string) => string;
  reason: (expert: string, text: string) => string;
  understanding: (text: string) => string;
  guess: (expert: string) => string;
  noReason: (expert: string) => string;
  mustUnwritten: (expert: string) => string;
  must: string;
  advice: string;
  choice: (expert: string) => string;
  how: (expert: string, notes: string[]) => string;
  knowledgeTold: (expert: string, text: string) => string;
  knowledgeFound: (expert: string, text: string, source: string) => string;
  notSeen: (expert: string) => string;
  cited: (who: string | undefined, where: string, text: string) => string;
  watch: (expert: string) => Record<StepId, string>;
  or: string;
  tip: {
    inbox: (subject: string) => string;
    vendors: string;
    history: string;
    approvals: (expert: string) => string;
    done: (expert: string) => string;
  };
};

const EN: Phrases = {
  intro: (name, expert) =>
    `Hi ${name}. I'm Ari. I watched how ${expert} works and learned her job, and now I'll pass it on to you. The first thing you might want to check out is your schedule, because it shapes the whole workflow; then we'll get into the specifics. Open Week & schedule on the left.`,
  step: {
    quotes: "First, get quotes.",
    vendor: "Next, pick a vendor.",
    scoring: "Now score the vendors.",
    approval: "Now the approval.",
    po: "Last step: issue the purchase order.",
  },
  options: (names) => `Your options are ${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}.`,
  whenDid: (expert, subject) => `When ${expert} did this for "${subject}",`,
  chose: (expert, what) => `${expert} chose ${what}.`,
  choseTo: (label) => `to ${lcfirst(label)}`,
  reason: (expert, text) => `${expert}'s reason: "${text}"`,
  understanding: (text) => `My understanding: ${lcfirst(text)}`,
  guess: (expert) => ` That's my best guess, not confirmed by ${expert}.`,
  noReason: (expert) => `${expert} didn't say why.`,
  mustUnwritten: (expert) => `That isn't in the written procedure. It's ${expert}'s unwritten rule, and you must follow it.`,
  must: "That's a rule you must follow.",
  advice: "That's strong advice from experience, not a hard rule.",
  choice: (expert) => `That's ${expert}'s personal style, so do it your own way.`,
  how: (expert, notes) => `How ${expert} worked: ${notes.map(lcfirst).join("; ")}.`,
  knowledgeTold: (expert, text) =>
    `To compare vendors, ${expert} uses this: ${text}. It isn't written down anywhere; ${expert} learned it from a colleague, so remember it.`,
  knowledgeFound: (expert, text, source) => `To compare vendors, ${expert} uses this: ${text}. You can find it in: ${lcfirst(source)}.`,
  notSeen: (expert) => `${expert} didn't do that step in the session I watched, so I don't know yet.`,
  cited: (who, where, text) => `${who ? `${who} said this in the ${where}` : `This came up in the ${where}`}: ${text}`,
  watch: (expert) => ({
    quotes: `Watch: I'll ask the vendors for quotes, the way ${expert} does.`,
    vendor: `Watch: ${expert} always opens the delivery history before choosing. Then the choice is yours.`,
    scoring: "Watch: each vendor gets a score in the shared sheet.",
    approval: `Watch: I'll route the approval the way ${expert} does it.`,
    po: "Watch: once it's approved, issue the purchase order.",
  }),
  or: "or",
  tip: {
    inbox: (subject) => `Here's your first request: ${subject}. Click it to open it.`,
    vendors: "Tick the vendors you want quotes from, then click Request quotes.",
    history: "When you've decided, click Select vendor on the one you choose.",
    approvals: (expert) => `Now pick who approves it. The highlighted option is how ${expert} does it.`,
    done: (expert) => `That's your first purchase done, the way ${expert} would have done it. Ask me why about any step, anytime.`,
  },
};

const ES: Phrases = {
  intro: (name, expert) =>
    `Hola ${name}. Soy Ari. Observé cómo trabaja ${expert} y aprendí su trabajo; ahora te lo voy a pasar a ti. Lo primero que conviene mirar es tu horario, porque marca todo el flujo de trabajo; luego vamos a los detalles. Abre Semana y horario a la izquierda.`,
  step: {
    quotes: "Primero, pide presupuestos.",
    vendor: "Ahora, elige un proveedor.",
    scoring: "Ahora, puntúa a los proveedores.",
    approval: "Ahora, la aprobación.",
    po: "Último paso: emite la orden de compra.",
  },
  options: (names) => `Tus opciones son ${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}.`,
  whenDid: (expert, subject) => `Cuando ${expert} hizo esto para "${subject}",`,
  chose: (expert, what) => `${expert} eligió ${what}.`,
  choseTo: (label) => lcfirst(label),
  reason: (expert, text) => `El motivo de ${expert}, en sus palabras: "${text}"`,
  understanding: (text) => `Lo que yo entiendo: "${text}"`,
  guess: (expert) => ` Es mi mejor suposición; ${expert} no lo ha confirmado.`,
  noReason: (expert) => `${expert} no dijo por qué.`,
  mustUnwritten: (expert) => `Eso no está en el procedimiento escrito. Es una regla no escrita de ${expert}, y tienes que seguirla.`,
  must: "Es una regla que tienes que seguir.",
  advice: "Es un consejo firme basado en la experiencia, no una regla estricta.",
  choice: (expert) => `Es el estilo personal de ${expert}, así que hazlo a tu manera.`,
  how: (expert, notes) => `Cómo trabajó ${expert}: "${notes.join("; ")}".`,
  knowledgeTold: (expert, text) =>
    `Para comparar proveedores, ${expert} usa esto: "${text}". No está escrito en ningún sitio; ${expert} lo aprendió de un compañero, así que recuérdalo.`,
  knowledgeFound: (expert, text, source) => `Para comparar proveedores, ${expert} usa esto: "${text}". Lo encontrarás en: ${lcfirst(source)}.`,
  notSeen: (expert) => `${expert} no hizo ese paso en la sesión que observé, así que todavía no lo sé.`,
  cited: (who, where, text) => `${who ? `${who} lo dijo en la reunión "${where}"` : `Esto salió en la reunión "${where}"`}: "${text}"`,
  watch: (expert) => ({
    quotes: `Mira: voy a pedir presupuestos a los proveedores, como lo hace ${expert}.`,
    vendor: `Mira: ${expert} siempre abre el historial de entregas antes de elegir. Luego la decisión es tuya.`,
    scoring: "Mira: cada proveedor recibe una puntuación en la hoja compartida.",
    approval: `Mira: voy a enviar la aprobación como lo hace ${expert}.`,
    po: "Mira: una vez aprobada, emite la orden de compra.",
  }),
  or: "o",
  tip: {
    inbox: (subject) => `Aquí está tu primera solicitud: ${subject}. Haz clic para abrirla.`,
    vendors: "Marca los proveedores a los que quieres pedir presupuesto y haz clic en Request quotes.",
    history: "Cuando lo tengas claro, haz clic en Select vendor en el que elijas.",
    approvals: (expert) => `Ahora elige quién lo aprueba. La opción resaltada es como lo hace ${expert}.`,
    done: (expert) => `Listo, tu primera compra está hecha, como la habría hecho ${expert}. Pregúntame por qué en cualquier paso.`,
  },
};

// Spanish words for option labels, so the choice reads naturally.
const ES_OPTIONS: Record<string, string> = {
  three_quotes: "pedir 3 o más presupuestos",
  fewer_quotes: "pedir menos de 3 presupuestos",
  self: "aprobarlo personalmente",
  manager: "enviarlo a su responsable",
  cfo: "enviarlo al director financiero",
  issue: "emitir la orden de compra después de la aprobación",
  score: "puntuar a los proveedores en la hoja compartida",
};

const phrases = (lang: Lang) => (lang === "es-ES" ? ES : EN);

export function intro(profile: Profile, lessons: Lessons, lang: Lang = "en-US"): string {
  return phrases(lang).intro(profile.name, lessons.expert);
}

function choiceName(card: DecisionCard, lang: Lang) {
  if (card.stepId === "vendor") return vendor(card.chosen)?.name ?? card.chosen;
  const label = card.options.find((o) => o.id === card.chosen)?.label ?? card.chosen;
  return lang === "es-ES" ? ES_OPTIONS[card.chosen] ?? label : phrases(lang).choseTo(label);
}

export function isUnwritten(card: DecisionCard): boolean {
  const chosen = card.options.find((o) => o.id === card.chosen);
  return !!card.reason && levelOf(card.reason.types) === "must" && chosen?.status !== "procedure";
}

function reasonSentence(card: DecisionCard, expert: string, lang: Lang): string {
  const p = phrases(lang);
  const r = card.reason;
  if (!r) return p.noReason(expert);
  if (r.source === "expert") return p.reason(expert, r.text);
  return `${p.understanding(r.text)}${r.confirmed ? "" : p.guess(expert)}`;
}

function levelSentence(card: DecisionCard, expert: string, lang: Lang): string {
  const p = phrases(lang);
  if (!card.reason) return "";
  switch (levelOf(card.reason.types)) {
    case "must":
      return isUnwritten(card) ? p.mustUnwritten(expert) : p.must;
    case "advice":
      return p.advice;
    case "choice":
      return p.choice(expert);
    default:
      return "";
  }
}

export function explainStep(stepId: StepId, lessons: Lessons, quotedVendorIds: string[], lang: Lang = "en-US"): { text: string; highlight?: string } {
  const p = phrases(lang);
  const card = lessons.cards.find((c) => c.stepId === stepId);
  const parts = [p.step[stepId]];
  if (stepId === "vendor" && quotedVendorIds.length) parts.push(p.options(quotedVendorIds.map((id) => vendor(id)?.name ?? id)));
  if (card) {
    parts.push(`${p.whenDid(lessons.expert, lessons.requestSubject)} ${p.chose(lessons.expert, choiceName(card, lang))}`);
    parts.push(reasonSentence(card, lessons.expert, lang));
    const level = levelSentence(card, lessons.expert, lang);
    if (level) parts.push(level);
    if (card.howNotes.length) parts.push(p.how(lessons.expert, card.howNotes));
  }
  // Rules taught from meetings, cited where they were said.
  for (const c of citationsFor(stepId).slice(0, 2)) parts.push(p.cited(c.who, c.where, c.text));
  // Knowledge the step depends on, and where to find it (from any step).
  if (stepId === "vendor") {
    for (const item of lessons.cards.flatMap((c) => c.knowledge ?? [])) {
      parts.push(item.source === "Told by a person" ? p.knowledgeTold(lessons.expert, item.text) : p.knowledgeFound(lessons.expert, item.text, item.source));
    }
  }
  const highlight: Partial<Record<StepId, string>> = {
    quotes: "go-to-vendors",
    vendor: quotedVendorIds[0] ? `history-${quotedVendorIds[0]}` : undefined,
    approval: "nav-approvals",
    po: "issue-po",
  };
  return { text: parts.join(" "), highlight: highlight[stepId] };
}

const STEP_WORDS: [RegExp, StepId][] = [
  [/score|number|formula|puntu|n[uú]mero|f[oó]rmula/i, "scoring"],
  [/quote|presupuesto|cotiz/i, "quotes"],
  [/cfo|approv|manager|sign|aprob|director financiero/i, "approval"],
  [/\bpo\b|purchase order|requester|tell|orden de compra/i, "po"],
  [/vendor|supplier|pick|choose|proveedor|elegi|escogi|apex|brightline|coreparts|sitwell/i, "vendor"],
];

export function isWhyQuestion(text: string) {
  return /\bwhy\b|how come|por qu[eé]|porqu[eé]/i.test(text);
}

export function isSpanish(text: string) {
  return /[¿¡ñáéíóú]|\b(por qu[eé]|qu[eé]|c[oó]mo|eligi[oó]|proveedor|hola|gracias|el|la|los|las|es|para|con)\b/i.test(text) && !/\b(the|why|what|how|did)\b/i.test(text);
}

export function answerWhy(text: string, lessons: Lessons, currentStep: StepId | null, lang: Lang = "en-US"): string {
  const step = STEP_WORDS.find(([re]) => re.test(text))?.[1] ?? currentStep;
  const card = lessons.cards.find((c) => c.stepId === step);
  if (!card) return phrases(lang).notSeen(lessons.expert);
  return [phrases(lang).chose(lessons.expert, choiceName(card, lang)), reasonSentence(card, lessons.expert, lang), levelSentence(card, lessons.expert, lang)]
    .filter(Boolean)
    .join(" ");
}

// "Show me": Ari's own cursor does the step the way the expert did.
export function showMe(stepId: StepId, requestId: string, quotedVendorIds: string[], lessons: Lessons, lang: Lang = "en-US"): { actions: CursorAction[]; narration: string } {
  const click = (target: string): CursorAction => ({ target, action: "click" });
  const point = (target: string): CursorAction => ({ target, action: "point" });
  const candidates = vendorsQuoting(requestId).map((v) => v.id);
  const chosenApproval = lessons.cards.find((c) => c.stepId === "approval")?.chosen ?? "self";
  const actions: Record<StepId, CursorAction[]> = {
    quotes: [click("go-to-vendors"), ...candidates.map((id) => click(`tick-${id}`)), click("request-quotes")],
    vendor: [click("nav-vendors"), ...(quotedVendorIds[0] ? [click(`history-${quotedVendorIds[0]}`)] : []), ...quotedVendorIds.map((id) => point(`select-${id}`))],
    scoring: [click("nav-scoring"), ...quotedVendorIds.map((id) => point(`score-${id}`))],
    approval: [click("nav-approvals"), click(`route-${chosenApproval}`)],
    po: [click("nav-approvals"), click("issue-po")],
  };
  return { actions: actions[stepId], narration: phrases(lang).watch(lessons.expert)[stepId] };
}

// The guardrail an action would break, if any.
export function brokenGuardrail(event: WorkspaceEvent, lessons: Lessons): Guardrail | null {
  if (event.type !== "approval_routed") return null;
  return (
    lessons.guardrails.find(
      (g) =>
        g.step === "approval" &&
        event.to !== g.requiredOption &&
        event.amount > g.minAmount &&
        (!g.onlyNewSuppliers || largestOrder(event.vendorId) <= g.minAmount),
    ) ?? null
  );
}

// Between the bigger explanations: exactly what to click next, once each.
export type Tip = { id: string; text: string; highlight?: string };

export function tipFor(event: WorkspaceEvent, history: WorkspaceEvent[], lessons: Lessons, lang: Lang = "en-US"): Tip | null {
  const p = phrases(lang).tip;
  const happened = (type: WorkspaceEvent["type"]) => history.some((e) => e.type === type);
  const request = northwind.requests.find((r) => r.audience === "newcomer");
  if (event.type === "screen_opened" && event.screen === "inbox" && request && !happened("request_opened")) {
    return { id: "inbox", text: p.inbox(request.subject), highlight: `inbox-${request.id}` };
  }
  if (event.type === "screen_opened" && event.screen === "vendors" && request && !happened("quotes_requested")) {
    const first = vendorsQuoting(request.id)[0];
    return { id: "vendors", text: p.vendors, highlight: first ? `tick-${first.id}` : undefined };
  }
  if (event.type === "delivery_history_opened" && !happened("vendor_selected")) return { id: "history", text: p.history };
  if (event.type === "screen_opened" && event.screen === "approvals" && happened("vendor_selected") && !happened("approval_routed")) {
    const rule = lessons.guardrails.find((g) => g.step === "approval");
    return { id: "approvals", text: p.approvals(lessons.expert), highlight: rule ? `route-${rule.requiredOption}` : undefined };
  }
  if (event.type === "po_issued") return { id: "done", text: p.done(lessons.expert) };
  return null;
}
