# Video scripts

Record on the live Vercel link in Chrome: full screen, sound on, browser zoom 100%. Close other tabs. Each script is about 2 to 3 minutes. **Bold** is what to click; quotes are what you say over it.

---

## Demo video (about 2:45)

**0:00 · Start page**
> "When a veteran employee leaves, their know-how usually leaves with them: the reasons behind their choices, and the rules nobody ever wrote down. This is Ari."

Hover over the four cards.
> "Ari is our program, a little learner bot. It watches a veteran work, asks why only when it can't work out a choice, and passes the job on to the next person. To show it, we built an office simulator, a pretend company called Northwind Supply, and Maria, a simulated Procurement Manager with eight years in the job."

**0:25 · Step 1**
Click **Start step 1**, then **Start step 1** on the intro.
> "In step 1, Maria buys 40 laptops for Marketing, and Ari learns from her."

Click **Next**. Ari asks what she's working on and she answers. Click **Next** again.
> "Ari asks to turn on eye tracking, so it sees exactly what she reads, not just what she clicks."

Click **Next step**, then **Next** a few times. Maria opens the request, asks three vendors for quotes, and Ari stays quiet.
> "Three quotes is in the written procedure. Ari can explain it, so it doesn't interrupt."

Keep clicking **Next**. Maria checks Apex's delivery history and picks Brightline, the pricier vendor.
> "Here's a choice Ari can't explain. And because it saw her reading Apex's late deliveries, its question is precise."

Pause on Ari's question and Maria's answer. Point at the vendor card on the right: "What Maria looked at", **Strong advice**.

**1:20 · Scoring and approval**
Click **Next step**, then **Next** through the scoring part.
> "The 82 comes from Finance's 40/60 formula. It isn't written anywhere, so Ari captures it, with where to find it."

Click **Next step**, then **Next** through the approval part.
> "The procedure says Maria can approve this herself. She sends it to the CFO anyway: new suppliers over 25 thousand always go to the CFO. Ari files it as a **must-follow, unwritten rule**."

**1:50 · End of step 1**
Click **Next step**, then **Next** to the end. Ari double-checks its least-certain guesses.
> "Before Maria leaves, Ari checks the guesses it was least sure about. And here's what it learned: each decision, how strict it is, and the unwritten rules."

Briefly open **Week & schedule** (the New badge) and close it.
> "Ari also learns from her calendar, her files and her meetings: the big picture, not just one task."

**2:10 · Step 2**
Click **Start step 2**.
> "Maria has left. Now we test whether Ari learned well, and whether it can teach. You're the new employee."

Click **Start learning from Ari**. Ari points to the schedule. Click **Week & schedule**.
> "It starts with the schedule, because the schedule shapes the job. It even spotted a pattern you'd only see across the whole week: supplies are cheapest on Tuesdays."

Open the Inbox and the chairs request. When the approval step comes, click **Approve myself**.
> "And when I'm about to break Maria's unwritten rule, Ari stops me, before the mistake happens."

**2:40 · Close**
> "Ari: the know-how stays, even when the people move on."

---

## Tech video (about 2:30)

**0:00 · One sentence**
> "Ari is one Next.js app on Vercel. Everything Ari does runs through one pure function, the Apprentice Core."

Show `src/lib/apprentice/core.ts`.
> "The Core is a reducer: state and an input go in, a new state and effects come out. Inputs are workspace events, speech, and eye-tracking dwell times. Effects are cards, questions, explanations, cursor moves and warnings. Because it's pure, our tests replay the whole demo through it."

**0:30 · Judgment**
Show the Judge interface and `/api/judge`.
> "All judgment goes through a Judge interface. With a key it's Claude Opus, using structured outputs, to decide whether it understands a choice, how sure it is, and how to classify the reason. Without a key, a rule Judge reasons like someone who only knows the written procedure. Ari asks only when it isn't confident and the answer would change how the next person works."

**0:55 · Eye tracking**
Show `src/lib/gaze/attention.ts`.
> "Eye tracking uses WebGazer, an open-source webcam tracker, so we didn't build one from scratch. We map gaze points to what's on screen and merge them into dwell times. Those become evidence on each decision, and they let Ari ask sharper questions."

**1:15 · The big picture**
Show `src/lib/context/patterns.ts` and `plan.ts`.
> "Ari looks beyond one task. Pattern detection runs over the expert's whole week: recurring meetings, breaks that differ by day, and trends like a discount that drops every day. A plan builder turns that, plus what Ari learned, into the new employee's week, day and task guides."

Show `/api/transcribe` and `/api/extract`.
> "Meetings are transcribed with ElevenLabs Speech-to-Text, with speakers labelled. Claude pulls out rules and facts with exact quotes and links each one to the decision it explains. There's a rule-based fallback, so the demo works offline."

**1:45 · Voice**
> "Ari speaks through ElevenLabs text-to-speech with word timestamps, and Maria has her own voice. Without a key, the browser's voices take over automatically."

**2:00 · The walkthrough and tests**
Show `src/lib/walkthrough/script.ts` and the test run.
> "Step 1 is a script of beats. Any position is rebuilt by replaying the script through the Core, which is why Back and Next always match. Over 160 tests cover the Core, the Judge, patterns, the plan, knowledge extraction and the walkthrough."

Run `npm test` on screen.

**2:20 · Close**
> "In a real company, Ari would plug into real tools by watching the screen. The prototype uses its own office simulator, so every action is known exactly."
