# Written Prototype: Ari, the AI Apprentice

*A plain-language description of how the idea would work. It started from the two brainstorm recordings ("Worcester Polytechnic Institute 2" and "26 Boynton St"), was reconciled with a teammate's stack research, and was settled in a design review on 2026-10-03. Nothing here is built yet.*

## The challenge

**Challenge 1: The AI Apprentice** (sponsored by ElevenLabs), part of the 7th Hack-Nation Global AI Hackathon.

> Capture the knowledge that disappears when experienced employees leave.
>
> Build a voice-powered AI apprentice that watches experts work, asks why at the right moments, maps their decisions and guardrails, and teaches the workflow to the next generation.

### How the prototype covers each part of the challenge

| Challenge asks for | Where it's covered |
|---|---|
| Voice-powered | Step 5 (asking out loud), Step 11 (teaching by voice), "Voice and avatar" below |
| Watches experts work | Steps 1 to 4 (account, session, the normal map, watching) and Step 8 (how they work) and Step 9 (the knowledge behind the work) |
| Asks why at the right moments | Step 5 (asking only when Ari can't work out the reason and it matters) and Step 10 (not over-asking) |
| Maps decisions and guardrails | Step 6 (types of reasons), Step 7 (depths), the decision cards |
| Teaches the workflow to the next generation | Step 11 |

### What we have to submit (by 9 AM Sunday)

Hack-Nation requires all of these, uploaded to app.hack-nation.ai **and** to the backup Google form:

| Item | Format | Purpose |
|---|---|---|
| Demo video | Video | Show the project |
| Tech video | Video | Explain the build |
| Team video | Video | Introduce the team |
| GitHub repo | Public link | Code and docs |
| Live demo | Deployed on Vercel | Judges try the product themselves |

Freeze features around 6 AM and spend the rest of the time on the videos and the submission.

## The idea in one paragraph

**Ari** is a voice-powered apprentice with a live face. It sits beside an expert while they work and learns their job so it can teach it to the next person. For the demo, the expert is **Maria, a Procurement Manager** at a made-up company, Northwind Supply. Her job is the kind that disappears when someone leaves: follow the company's procedures, coordinate with other people, and use experience to handle the exceptions the procedure doesn't cover. Maria sets her job role once, when she creates her account. Each session, Ari asks what she's working on today. Ari already knows how procurement is normally done and what Northwind's written procedure says. As Maria works, Ari watches every step and records which option she picks, *how* she works (pauses, what she checks, who she contacts) and the knowledge behind the work, like a scoring formula that only exists in Finance's head. At every choice, Ari tries to work out the reason itself. It speaks up only when it can't, **and** the answer would change how someone else should do the job. Each reason is sorted into a type and a level: **must follow**, **strong advice** or **your choice**. That separates the guardrails the next person must keep, including the unwritten ones, from the personal touches they can do their own way. Later, Ari teaches a newcomer in the same workspace by voice, takes the cursor to show them how Maria did a step, and warns them before they break one of Maria's rules.

## How it works, step by step

### 1. Account: say what you do in general, once

When the expert creates an account, they fill in a one-screen profile: **name, job role and company**. There's no password; it's a prototype, and the profile is saved in the browser.

> *Example:* "Maria · Procurement Manager · Northwind Supply"

This is the **general level**. Ari never asks for it again; it already knows from the account.

### 2. Start a session: say what you're doing today

Each session starts with Ari asking out loud:

> "Hi Maria, what are you working on today?"

> *Example:* "Marketing needs 40 laptops by Friday, about $38k."

This is the **specific level**. Ari always works on these two levels: the general job and today's task. From the answer, it loads the matching part of the normal map.

### 3. Before the expert starts: the "normal" map

Ari must already know how this kind of task is normally done: what the steps are and what the options are at each step.

| Step | Common options |
|---|---|
| Get quotes | Request 3 quotes, use a preferred supplier, single-source |
| Pick a vendor | Cheapest, best delivery record, existing relationship |
| Approve | Approve yourself, send to manager, send to CFO |
| ... | ... |

For a company role, the map has **two layers**:

1. **The general way** procurement is done (public guides and standards).
2. **The company's own written procedure** on top of it. For the demo, this is a one-page Northwind procurement procedure (for example: 3 quotes for anything over $5k, CFO approval over $50k).

The most valuable knowledge is **the gap between the written procedure and what the expert actually does**: workarounds, exceptions, unwritten rules, judgment calls. That gap is the core of the pitch.

*Where the map comes from:* for the demo we write the Northwind content ourselves (the procedure, three vendors with quote and delivery histories, Finance's scoring sheet, the laptop request, and a second request for the newcomer) into one seed file. In a real product the sources would be the company's own process documents, how-to material, industry standards, an LLM's general knowledge, and every session Ari watches.

### 4. Watch: record which path the expert takes

The expert works in a **workspace we build**: an inbox, a purchase-request queue, a vendor list with quotes, a scoring sheet, an approve button and a team chat. It's one web app, and every part of it **reports its own events** ("vendor_selected: B"), so Ari always knows exactly which step and which option was picked.

> *Example:* At "Get quotes" she requested 3 quotes; at "Pick a vendor" she chose Vendor B.

Ari also guesses the expert's next move before she makes it. The guess isn't a trigger for asking; it's one piece of evidence that Ari understands (see Step 5), shown on the decision card as **✓ predicted** or **✗ didn't predict**.

*Why our own workspace:* real tools (email, ERP systems, spreadsheets) are spread across many sites and are hard to watch reliably. In a real product, Ari would plug into them by watching the screen (for example with rrweb or OpenAdapt). For the prototype, our workspace reports its own events, and we say so in the tech video.

### 5. Ask why, but only when Ari can't work it out and it matters

At every choice, Ari first tries to explain it on its own. It uses what it knows: the normal map, the company procedure, the request details, things the expert said earlier, its prediction, and what it has already learned about this expert.

Ari asks only when **both** of these are true:

1. **It doesn't understand the choice.** Ari stays quiet only when it's confident. Evidence is the usual way to get there:
   - Evidence, but some doubt → it asks.
   - No specific evidence, but the reason is simple and obvious → it stays quiet.
2. **The answer matters to the next person.** If two options are equally fine and nobody else would need to copy the choice, Ari lets it go.

Whether the choice is usual or unusual doesn't decide it. **What decides it is whether Ari understands why, and whether it matters.**

| | Ari understands why | Ari doesn't understand why |
|---|---|---|
| **Matters to the next person** | Stays quiet, saves its own explanation | **Asks** |
| **Doesn't matter** | Stays quiet | Stays quiet |

**When it asks:** right away, at the moment of the choice, out loud. Ari's face comes forward from its corner bubble and asks:

> "Why Vendor B over the cheaper Vendor A?"

Two exceptions:

- **If the expert is mid-conversation** (typing in chat, on a call), Ari waits until that ends, usually a few seconds.
- **Tap-to-hear setting:** the expert can switch Ari to show an "I have a question" signal instead. She taps it when she's ready, and only then does Ari speak.

**Follow-ups:** if an answer is vague and hides something that matters, Ari asks **at most one** gentle follow-up:

> Maria: "I just like them better."
> Ari: "Is that from past experience with them, or personal taste?"

That one follow-up decides between strong advice and a free choice. If she says "just taste", Ari accepts it.

> *Example (Ari doesn't understand, and it matters):* Maria picks Vendor B, which costs more than Vendor A. Nothing explains it, so Ari asks. Maria: "A shipped late twice last year, and Friday is a hard deadline."
>
> *Example (Ari understands):* Maria requests 3 quotes. The procedure says so, Ari predicted it, and it stays quiet. The card shows "follows procedure §2".
>
> *Example (goes beyond the procedure):* Maria sends the $38k order to the CFO, although the procedure only requires that over $50k. Ari asks. Maria: "New suppliers over $25k always go to the CFO. It's not written down anywhere."

### 6. Sort the reasons into types and levels

Every reason, whether the expert said it or Ari worked it out, gets sorted into one or more **types**, and each type belongs to one of three **levels**:

- 🔴 **Must follow** (guardrail): the next person must not break it.
- 🟡 **Strong advice**: experience and judgment; not a hard rule, but ignore it at your own risk.
- 🟢 **Your choice**: personal; the next person can do it their own way.

**The list of types is a starting point, kept in data so it can grow** as Ari meets new kinds of answers.

**Rules from outside (usually 🔴)**
- **Legal and regulatory:** a law, regulation, license, or contract requires it.
- **Safety and security:** protects people, data, or systems.
- **Accessibility:** makes it usable for people with disabilities.
- **Industry standard:** the accepted norm in the field.
- **Platform or tool limits:** the software or platform only allows certain things.

**Rules from the organization (usually 🔴)**
- **Company policy or orders:** the employer requires it.
- **Client or requester request:** the customer or internal requester asked for it.
- **Brand guidelines:** the company's brand rules.
- **Team convention:** how this team always does it, written down or not.

**Practical constraints (often 🔴)**
- **Budget:** cost limits.
- **Time or deadline:** a faster option was needed.
- **Resources:** the people, skills, or tools available.
- **Compatibility:** has to work with something that already exists.

**Experience and judgment (🟡)**
- **Lesson learned:** something went wrong before, so they now do it differently.
- **Quality:** it gives a better result.
- **Efficiency:** it's faster or easier to maintain.
- **Risk avoidance:** it's the safer bet.
- **Audience:** what the end users or requesters need or expect.
- **Context-specific:** something particular about this request, supplier, or situation.
- **Gut feel or intuition:** experience says so, even if the expert can't fully explain it.

**Personal (🟢)**
- **Personal preference:** they just like it better.
- **Signature style:** their own touch, not because it's best.
- **Habit:** it's how they've always done it.

**Unknown**
- **No clear reason yet:** flagged so it can be asked about later.

One answer can have more than one type, such as "lesson learned + deadline".

**On screen**, every reason shows **both**: a big coloured level badge, with the exact types as smaller text underneath. The colour tells anyone in a second whether to copy or choose; the small text keeps the detail.

```
┌──────────────────────────┐
│ Vendor: picked B         │
│ "A shipped late twice"   │
│ 🟡 STRONG ADVICE          │
│ lesson learned · deadline│
└──────────────────────────┘
```

Anything that isn't in the official procedure also gets an **"Unwritten"** ribbon. The unwritten CFO rule shows as 🔴 **MUST FOLLOW**, *team convention*, with the Unwritten ribbon: the clearest example of knowledge that disappears when someone leaves.

### 7. Go deeper: from general paths to personal specifics

There are two depths:

1. **General path:** which of the common options the expert picks at each step.
2. **Specifics:** the small things this expert does that most people don't. These are often her personal style, not "best practice".

Ari captures both, and the 🟢 level marks the specifics that are personal.

### 8. Capture *how*, not just *what*

Besides what the expert does, Ari notices *how* she does it, automatically, without asking. Because our workspace reports every event with a timestamp, these five come almost free, and all five are built:

| # | What Ari notices | Example in the demo |
|---|---|---|
| 1 | **Pauses before a decision** | "Paused 14 seconds on the quotes before choosing" (a hard call) |
| 2 | **What she checked first** | "Opened Vendor A's delivery history before deciding" |
| 3 | **Who she contacted, about what** | "Messaged Finance about the scoring sheet; emailed the CFO for approval" |
| 4 | **Doing steps in a different order from the procedure** | "Checked the budget *before* asking for quotes (the procedure says after)" |
| 5 | **Changing her mind** | "Selected Vendor A, then switched to B" |

They appear as small grey notes on the step's decision card. In teach mode, Ari mentions them: *"Before picking, Maria always opened the delivery history. You might want to do the same."*

The longer list from the brainstorm stays as the direction for a real product: pace and time of day, tools and shortcuts, what's reused, which references are trusted, what's handed off, how hard calls are made, testing and review habits, priorities and trade-offs, and how the approach changes with deadline pressure. "Who she contacts" matters especially for an operations role.

### 9. Capture the knowledge behind the work

Watching what the expert does isn't enough. Ari also needs to know **what knowledge the work depends on**, and **where that knowledge comes from**. Without it, the next person can copy the steps and still not be able to do the job.

**Kinds of knowledge**

- **Where the information comes from:** when the expert types a number into a sheet, is it from another system, an email, a form, or her memory?
- **Company-specific methods:** ways of doing things that only exist inside the company. *Demo example:* the vendor score is 40% price and 60% delivery record. That's Finance's formula, and nobody wrote it down.
- **Field knowledge:** general subject knowledge the task depends on, like how to read a supplier quote.
- **Other know-how:** company terms and abbreviations, which suppliers are special cases, rules of thumb, and the access the person needs.

**How Ari handles it**

Same rule as Step 5. Ari first tries to work out what knowledge is needed and where it comes from. If it's reasonable to infer, it notes that and stays quiet. **Only when it can't, and it matters, does it ask:**

> "Where does that number come from?"
> "What would someone need to know to do this part?"

**Where the knowledge lives**

Each piece of knowledge is tagged with where the next person can find it:

- **Online or public:** textbooks, courses, websites.
- **A company document:** an onboarding packet, a manual, the written procedure.
- **A company system:** a database, shared drive, or another tool.
- **Told by a person:** only known because someone explained it. *This is the knowledge most at risk of disappearing, so Ari records it in full.*
- **Already a given:** something everyone in the role is expected to know.

### 10. Don't over-ask, and check the quiet decisions at the end

Ari has to strike a balance between asking about every click (annoying) and asking only vague, general questions (useless). The two-part rule in Step 5 keeps it there. The more it learns about an expert, the less it asks: her past answers count as evidence the next time. (This is built simply and isn't shown in the demo.)

**End of session.** Ari stayed quiet on many decisions because it thought it understood. Some of those guesses might be wrong, so when the expert ends the session:

1. Ari asks out loud: *"Want me to go through the decisions I'm least sure about?"*
2. **If yes:** it reads the **3 least-certain** quiet decisions **one at a time**. Maria confirms or corrects each one by voice. Then Ari asks whether she wants to continue with more.
3. **If no, or when she's done:** it shows the remaining quiet decisions as a list, **least certain first**. She can check them or skip straight to **Continue / End session**.

Any reason Maria never confirmed is labelled in teach mode as **"my best guess, not confirmed by Maria"**. This end-of-session check is also the expert's chance to review what Ari saved before a newcomer sees it.

### 11. Teach the next generation

Everything collected becomes a live, voice-guided tutor for a newcomer doing the same kind of task, **inside the same workspace**. The newcomer does the real task while Ari teaches:

- **A full spoken explanation at every step:** the usual options, what Maria chose, the reason, and its level (must follow, strong advice, your choice).
- **Maria's personal style is pointed out as optional:** *"Maria liked to message the requester first. That's her style, so do as you prefer."*
- **The knowledge needed** for each step and where to find it (Step 9), with anything that only lived in Maria's head explained in full.
- **The "how":** pace, who to contact, and what she checked before deciding (Step 8).
- **Highlights** point at the next button or field on screen.
- **"Why?" at any time:** the newcomer asks out loud and Ari answers from the saved reasons. Unconfirmed guesses are labelled as such.
- **"Show me":** Ari takes the cursor and does the step live in the workspace while explaining it, the way Maria did it.
- **Guardrail warnings:** Ari watches the newcomer too, and speaks up before they break a 🔴 rule, including the unwritten ones.
- **Any language:** if the newcomer asks in Spanish, Ari answers, and keeps teaching, in Spanish.

Under the hood, Maria's decisions are compiled into an **ElevenLabs Procedure**, the step-by-step playbook the tutor follows. The expert passes on their knowledge without having to teach anyone directly.

## Voice and avatar

Voice is required by the challenge, and the sponsor is ElevenLabs. Voice runs both ways:

- **Listening:** the expert answers by talking, so she never stops working to type. Her answers are turned into text and saved.
- **Speaking:** Ari asks its questions out loud, and later teaches the newcomer out loud. It uses a stock ElevenLabs voice, not a clone of the expert's voice.

**The avatar is a must-have.** The demo has to feel magical, like Sable's AI employee Aidan: a live face and voice that guides you inside the actual product, clicking, explaining and switching language on the fly.

- **Who Ari is:** the apprentice, its own character with its own name, which talks *about* Maria ("Maria always…"). It never plays Maria. It looks like a friendly, professional young colleague, picked from the avatar provider's stock avatars.
- **Expert mode:** a small, quiet bubble in the corner while Maria works. It comes forward and speaks when it asks why.
- **Newcomer mode:** always visible, as the tutor.
- **Technology:** **HeyGen LiveAvatar**, a photorealistic face streamed live, through its official ElevenLabs integration (the agent's voice drives the face's lip-sync). **TalkingHead**, a 3D character that runs in the browser, takes over automatically if the stream fails or the credits run out.

## The live demo for judges

Judges will open the Vercel link and use Ari **on their own**. The start page offers two modes:

1. **Learn from Maria** (shown first): Maria's session is already captured. The judge plays the newcomer, watches the decision cards, asks "why?", presses "show me", and triggers the guardrail warning. It works in about 60 seconds with no setup.
2. **Teach Ari as Maria:** the profile is prefilled ("Maria · Procurement Manager · Northwind Supply"), so the judge just clicks Continue. Small script cards suggest what to do and what to say, but Ari reacts for real to whatever the judge does. When they finish, the app switches to newcomer mode: **"Now watch Ari teach what you just taught it,"** using the judge's own answers.

**Protecting the credits:** each visit gets about 5 minutes of the live face, then switches smoothly to the TalkingHead fallback, with voice still working. A "demo key" can be switched off after judging.

## Reuse, don't rebuild: the stack

**Note for whoever builds this (person or AI):** this is a hackathon prototype. Use existing code for the plumbing, keep everything as simple as the demo allows (fake data, JSON storage, no logins), and don't spend time on performance or security hardening. Spend the build time on the parts listed under "What we build ourselves."

The picks below come from a teammate's research (10 agents checked licenses, activity and claims), reconciled with two constraints: the live demo must run on **Vercel**, and the expert works in **our own workspace**. Vercel only hosts the page and short server calls. Voice, the avatar, recording and the on-screen pointing all run in the visitor's browser or at ElevenLabs, Claude and HeyGen, so deploying there costs almost nothing in quality.

| Layer | Pick | What it does for us |
|---|---|---|
| App | **One Next.js app**, started from the ElevenLabs [`agents/nextjs/quickstart`](https://github.com/elevenlabs/elevenlabs-examples) example, deployed on Vercel | Everything in one place |
| Voice | **ElevenLabs Agents** (`@elevenlabs/react`, `@elevenlabs/client`) + [ElevenLabs UI](https://github.com/elevenlabs/ui) + **Scribe** speech-to-text | Two-way voice. The agent stays muted while the expert works; our code decides when it asks. Raise the default 10-minute session limit. |
| Face | **HeyGen LiveAvatar** (official ElevenLabs integration), with **[TalkingHead](https://github.com/met4citizen/TalkingHead)** (MIT) as the fallback | Ari's live face |
| Watching | **Our workspace reports its own events**, plus **[rrweb](https://github.com/rrweb-io/rrweb)** (MIT) | Exact steps and options; timestamps for the "how" factors |
| Brain | **Claude** with typed outputs (**[Instructor](https://github.com/instructor-ai/instructor-js)**, MIT) and our own ask-why scoring, borrowing thresholds from **[thoughtful-agents](https://github.com/xybruceliu/thoughtful-agents)** (Apache-2.0) | "Do I understand?", certainty, sorting reasons |
| Memory | **A JSON file**: Maria's preloaded session plus new sessions | Simple, nothing extra to host |
| Teaching | An **ElevenLabs Procedure** compiled from the decisions, **[driver.js](https://github.com/nilbuild/driver.js)** (MIT) for highlights, and our own "show me" cursor | The tutor's playbook and on-screen guidance |
| Map | **Decision cards** (our own React components), with an optional graph view in **[React Flow](https://github.com/xyflow/xyflow)** (MIT) | The live decision map |

**Dropped from the research list, and why:**

- **Playwright** and a shared controlled browser: judges opening a Vercel link don't have a machine controlling a browser, and our workspace runs inside the page anyway.
- **Midscene** and a vision model describing the screen: our workspace already reports its events as text.
- **Neo4j** and **Graphiti**: they need extra servers; JSON is enough for a prototype.
- **BPMN/DMN export:** not needed for the demo.

**Licence traps to keep avoiding:** screenpipe (now commercial), Shepherd.js, Intro.js and PM4Py (AGPL), FalkorDB (SSPL). Stagehand v4 doesn't work with Playwright pages.

**Test early, because these are the riskiest pieces:** LiveAvatar with the ElevenLabs agent, the muted-agent-then-ask pattern, and voice over venue Wi-Fi.

### What we build ourselves

Everything above is plumbing. These are the parts no existing code does, and they're what the challenge judges:

1. **The workspace and Northwind content (Steps 3–4):** the fake workspace, the written procedure, vendors, quotes, the scoring sheet and the two requests.
2. **The ask-why policy (Steps 5 and 10):** understands + matters, confidence and evidence, the next-move prediction as evidence, waiting while the expert is mid-conversation, tap-to-hear, one follow-up at most.
3. **The reason sorter (Step 6):** the growing list of types, more than one per answer, each with its level, plus the Unwritten flag.
4. **Depths (Step 7):** flagging the expert's personal specifics.
5. **The how-factors (Step 8):** the five notes, computed from event timestamps.
6. **The knowledge questions (Step 9):** inferring what knowledge a step needs, asking only when needed, tagging each piece with where it lives.
7. **The end-of-session check (Step 10):** three least-certain decisions read aloud, then the list.
8. **Teach mode (Step 11):** the Procedure, spoken explanations, "why?", "show me", guardrail warnings, language switching.
9. **Ari's presence:** the avatar bubble and tutor, the fallback, the per-visit limit.

## Build order: milestones

Each milestone leaves a working app that could be demoed if time ran out after it. The order puts the full "it learns, then it teaches" loop in place early, then adds depth. The build leans heavily on coding agents working in parallel, so be ambitious.

| Order | Milestone | What works when it's done |
|---|---|---|
| 1 | **M1: Clickable workspace** | Profile screen, inbox, request queue, vendors and quotes, scoring sheet, approvals, chat, the procedure page. No AI yet. |
| 2 | **M2: Ari watches** | Events become steps ("Vendor step: picked B"). The decision cards fill in. |
| 3 | **M3: Ari asks why, out loud** | The understand-and-matters decision, Ari's face coming forward to ask, the spoken answer saved. *← the minimum demo* |
| 4 | **M6: Teach mode** | The tutor, highlights, "why?", "show me", guardrail warnings, the Spanish switch. *← the full story* |
| 5 | **M4: Reasons and knowledge** | Types and levels, the Unwritten flag, "Where does that number come from?", source tags, the how-notes. |
| 6 | **M5: End of session** | Three least-certain decisions read aloud, then the list. |
| 7 | **M7: Polish and videos** | Start page with both modes, judge script cards, credit limit, fallback avatar, optional graph view. Record the demo video as soon as M6 works, and again after polish. |

Freeze features around **6 AM Sunday**. Everything is submitted by **9 AM**.

## Worked example: the demo script

The request in Maria's inbox: *"Marketing needs 40 laptops by Friday, about $38k."* About 2:40 in total. Nothing in the demo shows Ari getting something wrong.

1. **Session start** (≈5s): *"Hi Maria, what are you working on today?"* — "40 laptops for Marketing, by Friday."
2. **Quiet, then asks** (≈40s): Maria requests 3 quotes, as the procedure says. Ari predicted it and stays quiet; the card shows "follows procedure §2". Then she picks Vendor B over the cheaper Vendor A, after pausing on the quotes and opening A's delivery history. Ari's face comes forward: *"Why B over the cheaper A?"* — "A shipped late twice last year, and Friday is a hard deadline." Saved as 🟡 **Strong advice** · *lesson learned, deadline*.
3. **The unwritten rule** (≈30s): she sends the $38k order to the CFO, although the procedure only requires that over $50k. *"The procedure doesn't require that. Why?"* — "New suppliers over $25k always go to the CFO. It's not written down." Saved as 🔴 **Must follow** · *team convention*, with the **Unwritten** ribbon.
4. **Hidden knowledge** (≈25s): she types a vendor score. *"Where does that number come from?"* — "40% price, 60% delivery record. It's Finance's formula." Tagged **Told by a person**.
5. **End of session** (≈15s): *"Want me to go through the decisions I'm least sure about?"* Ari reads one, and Maria confirms it.
6. **Teaching** (≈50s, trimmed in the video): a newcomer gets *"30 office chairs from a new supplier, $30k."* Ari explains each step. The newcomer asks "Why vendor B last time?" and hears Maria's reason. They say "show me", and Ari opens the delivery history with its own cursor. They ask a question in Spanish, and Ari carries on in Spanish. Then they click *Approve* on the $30k order → *"Wait. New suppliers over $25k go to the CFO first. That's Maria's rule."*

Moment 3 sets up the payoff in moment 6: the knowledge that would have disappeared stops a real mistake.

## The three videos

- **Demo video (~3 min):** the script above, with Ari.
- **Tech video (~2–3 min):** the architecture (one Next.js app on Vercel; the ElevenLabs agent and LiveAvatar; Claude deciding "do I understand?"; decisions compiled into an ElevenLabs Procedure), the ask-why rule, and how a real product plugs into real tools by watching the screen.
- **Team video:** who we are and why this problem matters.

## Repo and housekeeping

- **A new, dedicated public GitHub repo** for Ari, with a clear README for judges. Don't make the teammate's dojo repo (which has unrelated robotics code) public.
- **The teammate's stack research** goes into `docs/research/` in the new repo. It's currently stuck in their cloud session (commit 19d62a5, the push failed with a 403). They need to fix GitHub access or copy the files out before that session expires.
