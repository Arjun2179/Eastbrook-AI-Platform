# Eastbrook Youth AI Well-Being
## 10-Minute Final Presentation Script

**Team 1**
Tejaswini Vuppalapati  
Pavani Suthram  
Vardhan Sreepurushothama  
Vinay Reddy Beeram  
Arjun Pinapothu

**Presentation assets**
- Portfolio: `https://eastbrook-ai-platform-portfolio.vercel.app/`
- Live App: `https://eastbrook-ai-platform.vercel.app/`
- Comparison View: `https://eastbrook-ai-platform.vercel.app/compare`
- AS-IS Dashboard: `https://easterbook-youth-ai-dashboard.vercel.app/`

---

## 1. Presentation Flow

| Speaker | Section | Time Window | Target |
|---|---|---:|---:|
| Tejaswini | Problem, stakeholders, why this matters | 0:00-2:00 | 2 min |
| Pavani | Dataset design, ERD, research grounding | 2:00-4:00 | 2 min |
| Vardhan | Dashboard evidence and key findings | 4:00-6:00 | 2 min |
| Vinay Reddy Beeram | Solution, architecture, platform logic | 6:00-8:00 | 2 min |
| Arjun Pinapothu | Outcomes, future scope, conclusion | 8:00-10:00 | 2 min |

**Goal of the presentation**
- Show that the problem is real and measurable.
- Show that the platform is evidence-led, not just a UI concept.
- Show that the future direction is practical and grounded in the current architecture.

---

## 2. Browser Setup Before Presenting

Open these tabs before the team starts:

1. Portfolio home page, already scrolled near the problem section
2. Portfolio dashboard evidence section
3. Live app, logged in and ready
4. Comparison view
5. AS-IS dashboard

**Suggested tab order**
- Tab 1: Portfolio
- Tab 2: AS-IS dashboard
- Tab 3: Live app
- Tab 4: Comparison view

---

## 3. Detailed Script

### Speaker 1: Tejaswini Vuppalapati
**Time:** 0:00-2:00  
**Screen cue:** Portfolio -> Home -> Problem section -> problem cards

**Script**

"Good morning everyone. We are Team 1, and our project is called Eastbrook Youth AI Well-Being.

Our project starts with a simple question: what happens when student AI use becomes normal before schools have a way to monitor it responsibly?

At Eastbrook, the pattern is not occasional use. It is sustained, high-frequency use. Our dataset shows more than 14,000 AI prompts per day across 400 students, which comes to about 35 prompts per student per day. That tells us AI is already part of the daily learning workflow.

But the bigger issue is not usage alone. The real risk is the combination of high usage and weak verification. Only 56 percent of AI outputs are independently checked. That means a large share of students are accepting answers without validating whether they are correct, complete, or appropriate.

The impact is not only academic. We also see physical strain. Students average 8.6 hours of screen time per day, with eye dryness at 7.1 out of 10 and neck pain at 5.9 out of 10. So this is not just a productivity or convenience issue. It is also a student well-being issue.

And finally, educators usually see these patterns too late. They may notice poor work quality or over-reliance after the behavior has already become chronic. So the school needs earlier visibility, not retrospective reporting.

This is why our project matters. It is about making student AI use visible, safer, and easier to intervene on.

Pavani will now explain how we designed the data and research foundation behind this project."

**Transition line**

"To make the problem measurable, we first needed a dataset structure that could capture both behavior and risk."

---

### Speaker 2: Pavani Suthram
**Time:** 2:00-4:00  
**Screen cue:** Portfolio -> Data section -> ERD -> research section

**Script**

"To study this problem properly, we needed data that was detailed enough to reflect real student behavior, but safe enough to avoid any privacy concerns. That is why we built a synthetic dataset.

Our dataset includes 400 students, 12,000 structured observations, and 34 fields per row. Each row represents one student on one observed day. That structure lets us capture daily prompt volume, verification rate, screen time, strain scores, reliance type, and safeguarding indicators in one connected model.

We also designed the data in two phases. The first is AS-IS, which represents the current baseline with no intervention. The second is TO-BE, which models what happens if the school introduces nudges, training, and earlier educator oversight. This gives us a way to compare not just what the problem looks like, but what improvement could look like.

The ERD is important here because it shows that this is not random sample data. It is a deliberate analytical model. We organised behavior, risk, and phase-level logic so that comparisons remain consistent across the same student population.

The research foundation also shaped our KPI choices. We focused on verification because literature on automation bias shows that people trust automated outputs more when checking takes effort. That is exactly what we see in our data. Verification drops even further when tasks become more complex, which is the point where students most need independent checking.

We also grounded the project in current research on AI-assisted learning, adolescent digital behavior, and screen-related strain. So the platform is not solving an imagined problem. It is responding to patterns that the literature already warns us about.

Now that the data structure is clear, Vardhan will walk through the actual evidence from the AS-IS dashboard."

**Transition line**

"The model gives us the structure. The dashboard shows us what the structure reveals."

---

### Speaker 3: Vardhan Sreepurushothama
**Time:** 4:00-6:00  
**Screen cue:** AS-IS dashboard or Portfolio -> Dashboard and Key Evidence

**Script**

"The AS-IS dashboard gives us three strong pieces of evidence, and together they explain why intervention is necessary.

First, prompt volume remains consistently high. We see 14,119 AI prompts per day across the observation period. The line is basically flat, which tells us this is routine behavior, not a temporary spike. Students are not self-correcting on their own.

Second, verification remains stagnant. The average stays around 56 percent across the same period. That would already be concerning on its own, but the more important finding is what happens under task complexity. At high-complexity tasks, verification drops to about 40.4 percent. So the exact situations where accuracy matters most are the situations where students are least likely to verify.

Third, the strain data stays high as well. Eye dryness averages 7.1 out of 10, and neck pain averages 5.9 out of 10. Those trends are also flat. There is no sign of natural recovery within the observation window.

These three patterns lead to one clear conclusion. High AI dependency is not showing up as a single metric. It shows up as a combination of heavy usage, weak verification, and persistent physical strain.

We also found that a smaller subgroup drives disproportionate risk. A limited number of students account for the most serious over-reliance patterns, which means the school does not need a blanket response. It needs a targeted, role-based intervention system.

That is the bridge from analysis to product design. The evidence tells us what the platform has to do: detect risk earlier, support students directly, and give educators practical intervention tools.

Vinay Reddy Beeram will now show how we translated those findings into the platform architecture."

**Transition line**

"The dashboard tells us what is happening. The platform is our response to what should happen next."

---

### Speaker 4: Vinay Reddy Beeram
**Time:** 6:00-8:00  
**Screen cue:** Portfolio -> Solution section -> architecture section -> live app

**Script**

"Based on those findings, we designed a live role-based platform rather than a static reporting dashboard.

The platform has three core user views. The student side helps learners see their own AI habits, complete training modules, and understand where their behavior sits against the broader pattern. The educator side provides visibility into daily trends, risk alerts, and intervention opportunities. The analyst side supports KPI monitoring and AS-IS versus TO-BE evaluation across the whole dataset.

The architecture reflects that same logic.

On the business side, the platform supports student AI behavior tracking, AI verification monitoring, physical wellness monitoring, educator risk intervention, policy and compliance analysis, and analyst KPI reporting.

At the application layer, the system uses a React and TypeScript front end, a Node.js and Express REST API, a Python analytics engine for dataset processing, and Neon PostgreSQL as the operational data store.

At the infrastructure and security layer, we deploy through Vercel, use role-based authentication, secure headers, CORS controls, rate limiting, and environment-based configuration. So the architecture is not just about building features. It is also about making the platform secure, scalable, and realistic for real institutional use.

The lower architecture layer maps the tools and endpoints that make the system usable in practice. That includes session logging, educator nudges, the risk alert engine, training module delivery, and comparison endpoints for the AS-IS and TO-BE views.

What matters most is that the architecture follows directly from the evidence. We did not start with technology and look for a problem. We started with the measured problem and designed the system around it.

Arjun Pinapothu will now show what improvement looks like in the TO-BE view, and where this platform can grow next."

**Transition line**

"If the architecture is the system backbone, the outcomes tell us whether the backbone is worth building on."

---

### Speaker 5: Arjun Pinapothu
**Time:** 8:00-10:00  
**Screen cue:** Comparison view -> Portfolio future section -> final thoughts

**Script**

"The most important question after building the platform is this: if the school uses this model, what changes?

In the TO-BE comparison, we see meaningful movement in the core KPIs. Verification improves from 56 percent to 66.7 percent. That matters because verification is our main behavioral lever. Automation bias drops from 44 percent to 33.3 percent, which tells us more students are checking AI outputs instead of accepting them automatically.

We also see well-being improvements. Average screen time decreases from 8.6 hours to 7.8 hours. Eye dryness reduces from 7.1 to 6.3, and neck pain reduces from 5.9 to 5.3. These are modeled outcomes, not live pilot results, so we are careful not to overclaim. But they show that our intervention logic is measurable and testable.

The platform also gives us a realistic future direction, and that is important because this project is designed to grow.

The next major step is an AI-powered personalised nudge engine. Instead of sending the same static message to every student, the system could generate context-aware nudges based on reliance type, history, and risk trajectory.

After that, we can add predictive risk scoring so educators know which students are likely to cross a threshold three to five days before that happens. That moves the platform from reactive monitoring to proactive prevention.

We also see strong value in natural language dashboard queries, automated educator reports, LMS integration with systems like Canvas or Moodle, and eventually federated learning for privacy-preserving multi-school deployment.

So our final message is this: Eastbrook Youth AI Well-Being is not only a dashboard, and it is not only a prototype. It is an evidence-led system for helping schools respond to student AI use in a more measurable, ethical, and actionable way.

Thank you."

**Closing line**

"We would be happy to take your questions."

---

## 4. Short Future Section Script

Use this if your faculty wants a dedicated future slide or if you want a slightly stronger close on innovation.

"Our future roadmap keeps the same goal, but increases intelligence at each layer. First, we replace rule-based nudges with personalised LLM-generated interventions. Second, we add predictive ML to identify risk before threshold breach. Third, we connect the platform to LMS data so we can study how verification behavior relates to real academic outcomes. And long term, federated learning would let multiple schools benefit from shared model improvement without centralising any student data."

---

## 5. Speaker Notes: Key Numbers to Memorise

| Metric | AS-IS | TO-BE |
|---|---:|---:|
| Daily AI prompts | 14,119 | 11,871 |
| Verification rate | 56.0% | 66.7% |
| Automation bias | 44.0% | 33.3% |
| Screen time | 8.6 hrs | 7.8 hrs |
| Eye dryness | 7.1/10 | 6.3/10 |
| Neck pain | 5.9/10 | 5.3/10 |
| Nudge success rate | - | 25.6% |
| Students observed | 400 | 400 |
| Structured observations | 12,000 | 12,000 |

---

## 6. Likely Questions and Short Answers

**Why did you use synthetic data?**  
Because the topic involves student behavior, strain, and safeguarding signals. Synthetic data let us model realistic patterns without exposing any real student records.

**Is the TO-BE phase real or simulated?**  
It is a modeled intervention phase built on the same student population. It shows testable projected outcomes, not a completed live pilot.

**Why is verification the main KPI?**  
Because it is the clearest measurable behavior connecting AI reliance, academic quality, and automation bias.

**What makes the platform different from a normal dashboard?**  
It is role-based, intervention-oriented, and designed to support action through nudges, risk flags, training, and comparison views.

**What is the most practical next step?**  
A controlled pilot with real educators using the nudge workflow, followed by validation of predictive models on live institutional data.

---

## 7. Rehearsal Checklist

- Keep each section close to 2 minutes.
- Do not read directly from the script.
- Point to the charts and architecture while speaking.
- Keep transitions crisp between speakers.
- Make sure the live app and comparison tabs are ready before starting.
- End with the future scope and the core takeaway: move from reaction to prevention.
