export const TRAINING_CATALOG = [
  {
    id: 1,
    slug: 'understanding-automation-bias',
    icon: '🧠',
    title: 'Understanding Automation Bias',
    description:
      'Learn how over-reliance on AI outputs can weaken critical thinking skills and how to recognise it in your own workflow.',
    durationMinutes: 8,
    accentColor: '#8B5CF6',
    slides: [
      {
        title: 'What Is Automation Bias?',
        stat: '56%',
        statLabel: 'of AI outputs verified at Eastbrook',
        statColor: '#EF4444',
        body:
          'Automation bias is the tendency to over-trust automated systems — like AI chatbots — and accept their outputs without critical review. When AI presents information confidently, people naturally reduce their own scrutiny. Research shows that students who relied heavily on AI completed tasks faster but made significantly more uncaught factual errors.',
        highlight: "Key insight: Confidence in an AI's tone does not equal accuracy in its content.",
      },
      {
        title: 'How It Shows Up in Your Work',
        stat: '38%',
        statLabel: 'of Eastbrook students are over-reliant',
        statColor: '#F59E0B',
        body:
          'Automation bias shows up when you copy AI-generated statistics without checking the source, submit an AI-written paragraph without reading it carefully, or answer a follow-up question with “the AI said so.” Over-reliant students at Eastbrook verified only 32% of AI outputs on average — well below the 60% benchmark set by educational researchers.',
        highlight: "Real example: An AI confidently cited a study that doesn't exist. Only students who verified caught it.",
      },
      {
        title: 'Breaking the Bias',
        stat: '3 min',
        statLabel: 'average time to verify an AI claim',
        statColor: '#10B981',
        body:
          'The fix is simple: build a habit of pausing before accepting AI output. Ask yourself: “Does this sound right? Can I find a second source?” Studies show that students who took a few minutes to cross-check AI outputs reduced factual errors dramatically. Verification is not a sign of distrust — it is a sign of critical thinking.',
        highlight: 'Goal: Raise your personal verification rate to above 60% for every AI session.',
      },
    ],
    quiz: [
      {
        question: 'What is automation bias?',
        options: [
          'Always carefully checking AI outputs before using them',
          'Over-trusting AI outputs without independent verification',
          'Refusing to use AI tools in academic work',
          'Using AI only for mathematics problems',
        ],
        correct: 1,
        explanation:
          'Automation bias is the tendency to over-trust automated systems and accept their outputs without critical review — even when those outputs may be wrong.',
      },
      {
        question: 'Which behaviour most clearly shows automation bias?',
        options: [
          'Cross-checking an AI answer with a textbook before submitting',
          'Taking scheduled breaks between AI sessions',
          'Submitting AI-generated work without reading it critically',
          'Limiting each AI session to 25 minutes',
        ],
        correct: 2,
        explanation:
          "Submitting AI work without critical review is the classic sign of automation bias — you're trusting the system completely instead of exercising your own judgment.",
      },
      {
        question: 'What is the recommended verification rate for AI outputs according to researchers?',
        options: [
          'At least 20% of outputs',
          'At least 40% of outputs',
          'At least 60% of outputs',
          '100% of outputs every time',
        ],
        correct: 2,
        explanation:
          "Eastbrook's baseline of 56% is below the concern threshold. Students need to raise their verification habits above 60% to reduce automation bias risk.",
      },
    ],
  },
  {
    id: 2,
    slug: 'the-verification-habit',
    icon: '✅',
    title: 'The Verification Habit',
    description:
      'Build a simple 3-step process to fact-check any AI output and protect your academic integrity.',
    durationMinutes: 6,
    accentColor: '#10B981',
    slides: [
      {
        title: 'Why AI Gets Things Wrong',
        stat: '40.4%',
        statLabel: 'verification rate on high-complexity tasks',
        statColor: '#EF4444',
        body:
          'AI language models generate text by predicting patterns in their training data. They do not “know” facts — they approximate them. That means AI can confidently produce statistics, dates, quotes, or citations that are partially or entirely fabricated. This gets worse on complex, nuanced topics.',
        highlight: 'The harder the question, the more likely AI is to hallucinate — and the less likely students are to verify.',
      },
      {
        title: 'The 3-Step Verification Process',
        body:
          'Use this process for any AI-generated claim before you use it:\n\n1. SOURCE — Does the cited source actually exist?\n2. LOGIC — Does the claim make sense and fit what you already know?\n3. CROSS-CHECK — Does another reliable source confirm it?\n\nIf any step fails, revise or remove the AI output before submission.',
        highlight: 'Source → Logic → Cross-check. Three steps, less than five minutes, prevents most errors.',
      },
      {
        title: 'Putting It Into Practice',
        stat: '5 min',
        statLabel: 'is all it takes to verify most AI claims',
        statColor: '#3B82F6',
        body:
          'Before your next assignment submission, go through your AI-assisted content and apply the 3-step check to every factual claim, statistic, or quote. Build this into your workflow like proofreading. Over time, you will develop an instinct for which AI outputs need closer scrutiny.',
        highlight: 'Students who verified AI outputs scored higher on accuracy rubrics and made fewer factual mistakes.',
      },
    ],
    quiz: [
      {
        question: 'What are the three steps in the verification process?',
        options: [
          'Copy, Paste, Submit',
          'Source, Logic, Cross-check',
          'Read, Highlight, Memorize',
          'Ask, Answer, Accept',
        ],
        correct: 1,
        explanation:
          'Source (does the reference exist?), Logic (does it make sense?), and Cross-check (does another source confirm it?) form the three-step verification framework.',
      },
      {
        question: 'Why do AI models sometimes produce incorrect information?',
        options: [
          'They are programmed to include intentional errors',
          'They only work correctly for adult users',
          'They generate text based on patterns, not verified facts',
          'They run out of processing power on complex questions',
        ],
        correct: 2,
        explanation:
          'AI models predict likely text based on patterns — they do not actually know facts. That can lead to confident-sounding but incorrect outputs.',
      },
      {
        question: 'If an AI gives you a statistic for your research paper, you should:',
        options: [
          'Use it immediately since AI is highly accurate',
          'Ask the AI if it is sure about the statistic',
          'Verify the original source before including it',
          'Remove all statistics from your paper to be safe',
        ],
        correct: 2,
        explanation:
          "Verifying the original source is the correct approach. AI-cited statistics often reference real studies with altered numbers or entirely fabricated sources.",
      },
    ],
  },
  {
    id: 3,
    slug: 'healthy-session-management',
    icon: '⏱️',
    title: 'Healthy Session Management',
    description:
      'Discover the 25-5 rule, recognise digital fatigue, and build a personal session schedule that protects your health.',
    durationMinutes: 5,
    accentColor: '#F59E0B',
    slides: [
      {
        title: 'The Physical Cost of Long Sessions',
        stat: '8.6 hrs',
        statLabel: 'average daily screen time at Eastbrook',
        statColor: '#EF4444',
        body:
          'Eastbrook data shows students average 8.6 hours of screen time per day — well above the 5-hour risk threshold flagged in the literature. Eye dryness and neck pain climb sharply as sessions get longer, especially beyond the one-hour mark.',
        highlight: 'Session duration is the single strongest predictor of physical strain in our dataset.',
      },
      {
        title: 'The 25-5 Rule',
        stat: '25-5',
        statLabel: 'minutes on, minutes off',
        statColor: '#3B82F6',
        body:
          'The 25-5 rule is simple: work for 25 minutes, then step away from your screen for 5 minutes. During your break, look into the distance, stand up, stretch your neck and shoulders, and drink water. After four cycles, take a longer break.',
        highlight: 'Students who used structured breaks reported lower eye dryness and better focus.',
      },
      {
        title: 'Recognising Digital Fatigue',
        body:
          'Digital fatigue signals tell you it is time for a break right now:\n\n• Eyes feel dry, itchy, or blurry\n• Neck or upper back feels stiff\n• You are re-reading the same sentence multiple times\n• You are sending more prompts than usual for simple tasks\n• You feel mentally foggy or distracted\n\nUse the built-in timer to practice this habit today.',
        highlight: 'Use the Break Timer regularly so breaks become part of the workflow, not an afterthought.',
      },
    ],
    quiz: [
      {
        question: 'What does the “25-5 rule” mean?',
        options: [
          'Study for 25 hours, then sleep for 5 hours',
          'Use 25 different AI tools, then take a 5-minute walk',
          'Work focused for 25 minutes, then take a 5-minute screen break',
          'Take 25 short breaks spread across a 5-hour session',
        ],
        correct: 2,
        explanation:
          'The 25-5 rule means 25 minutes of focused work followed by a 5-minute break away from the screen. It helps prevent strain caused by uninterrupted sessions.',
      },
      {
        question: 'What is the average daily screen time for Eastbrook students?',
        options: [
          '3.2 hours per day',
          '5.5 hours per day',
          '8.6 hours per day',
          '12.1 hours per day',
        ],
        correct: 2,
        explanation:
          'Eastbrook students average 8.6 hours of screen time per day, which aligns with the elevated eye dryness and neck pain scores seen in the dataset.',
      },
      {
        question: 'Which of the following is a sign that you need a break?',
        options: [
          'Feeling energized and mentally focused',
          'Understanding the material clearly and making good progress',
          'Eyes feeling dry or itchy, neck feeling stiff',
          'Finishing your assignment ahead of schedule',
        ],
        correct: 2,
        explanation:
          'Eye dryness, itchiness, and neck stiffness are direct physical warning signs of digital fatigue and should trigger a break.',
      },
    ],
  },
  {
    id: 4,
    slug: 'effective-prompt-writing',
    icon: '🎯',
    title: 'Effective Prompt Writing',
    description:
      'Write better prompts to get better answers in fewer tries — reducing unnecessary usage while improving output quality.',
    durationMinutes: 10,
    accentColor: '#3B82F6',
    slides: [
      {
        title: 'Why Prompt Quality Matters',
        stat: '35',
        statLabel: 'avg prompts sent per student per day',
        statColor: '#F59E0B',
        body:
          'Eastbrook students send an average of 35 AI prompts per day. Many are repeated attempts caused by vague starting prompts. Poor prompts create poor answers, which create more prompts, longer sessions, and more strain.',
        highlight: 'Reducing prompt volume by 30% would cut average session time meaningfully.',
      },
      {
        title: 'Anatomy of a Strong Prompt',
        body:
          'Every effective AI prompt has three parts:\n\n1. CONTEXT — Give the AI the background it needs.\n2. TASK — State exactly what you want.\n3. FORMAT — Specify how you want the answer returned.\n\nContext + Task + Format beats vague prompting every time.',
        highlight: 'One strong prompt often replaces five weak ones.',
      },
      {
        title: 'Before You Start: The 2-Minute Outline',
        body:
          'Before opening any AI tool, spend two minutes writing down:\n1. What question are you actually trying to answer?\n2. What do you already know?\n3. What format do you need?\n\nThis eliminates exploratory prompting, which often accounts for a large share of total prompt volume.',
        highlight: 'Two minutes of planning can save twenty minutes of prompting.',
      },
    ],
    quiz: [
      {
        question: 'What are the three components of a strong AI prompt?',
        options: [
          'Copy, Paste, and Submit',
          'Ask, Wait, and Accept',
          'Context, Task, and Format',
          'Subject, Verb, and Object',
        ],
        correct: 2,
        explanation:
          'A strong prompt provides Context, Task, and Format. This reduces the need for follow-up prompts and improves output quality.',
      },
      {
        question: 'Sending many vague prompts to AI typically results in:',
        options: [
          'More accurate and detailed answers',
          'Faster completion of assignments',
          'Longer sessions, more strain, and less reliable outputs',
          'Better learning and comprehension',
        ],
        correct: 2,
        explanation:
          'Vague prompts lead to weak answers and more follow-up prompting, which extends sessions and usually makes outcomes worse.',
      },
      {
        question: 'What should you do before starting an AI session for an assignment?',
        options: [
          'Guess what AI will say and prepare to disagree',
          'Spend 2 minutes outlining exactly what you need to find out',
          'Open multiple AI tools simultaneously for comparison',
          'Ask AI to write the entire assignment immediately',
        ],
        correct: 1,
        explanation:
          'A short planning outline reduces exploratory prompting and helps students get to useful answers faster with fewer retries.',
      },
    ],
  },
  {
    id: 5,
    slug: 'ai-as-a-learning-partner',
    icon: '🤝',
    title: 'AI as a Learning Partner',
    description:
      'Learn strategies for using AI to enhance your thinking rather than replace it — turning dependency into collaboration.',
    durationMinutes: 7,
    accentColor: '#EC4899',
    slides: [
      {
        title: 'Assisted vs. Dependent',
        stat: '28.6%',
        statLabel: 'of students consult AI on serious life topics',
        statColor: '#EF4444',
        body:
          'AI-assisted learning means using AI to support and deepen your own thinking. AI-dependent learning means outsourcing your thinking entirely. The difference is whether you still own the understanding when the AI is gone.',
        highlight: "If you couldn't explain the work to a friend without AI, you may be dependent rather than assisted.",
      },
      {
        title: 'Healthy Collaboration Strategies',
        body:
          'Use AI to enhance your learning, not replace it:\n\n✅ Ask for explanations, alternate perspectives, or reasoning checks.\n✅ Use AI to deepen your own notes or research.\n❌ Do not ask AI to do the thinking for you.\n❌ Do not use AI as a substitute for understanding the material.',
        highlight: 'AI should make your thinking richer — not replace the thinking itself.',
      },
      {
        title: 'Your Personal AI Usage Contract',
        body:
          'Write down a short set of rules for how you will use AI. Include verification, break habits, planning, and boundaries on what you will ask AI to do for you. A visible, written commitment makes healthy habits more likely to stick.',
        highlight: 'A written commitment is far more likely to become a lasting habit.',
      },
    ],
    quiz: [
      {
        question: 'What is the key difference between AI-assisted and AI-dependent work?',
        options: [
          'AI-assisted means copying AI answers; AI-dependent means editing them',
          'AI-assisted uses AI to support your own thinking; AI-dependent replaces your thinking',
          'There is no meaningful difference between the two',
          'AI-dependent means using AI only during school hours',
        ],
        correct: 1,
        explanation:
          'In AI-assisted work, you use AI to deepen understanding. In AI-dependent work, the AI replaces your reasoning and you lose ownership of the learning.',
      },
      {
        question: 'Which is an example of healthy AI use in learning?',
        options: [
          'Asking AI to write your entire essay and submitting it as-is',
          'Using AI to explain a concept, then working through problems yourself',
          'Only studying topics that AI can explain clearly',
          'Submitting AI outputs without reading them first',
        ],
        correct: 1,
        explanation:
          'Healthy AI use means the tool supports your learning process while you still do the thinking, interpretation, and final judgment.',
      },
      {
        question: 'What does a personal AI usage contract help you do?',
        options: [
          'Get discounts on AI subscriptions and premium tools',
          'Set clear personal boundaries on how and when you use AI',
          'Block access to AI tools on school nights automatically',
          'Share your AI chat logs with your teacher',
        ],
        correct: 1,
        explanation:
          'A personal AI usage contract creates clear rules and accountability around verification, breaks, and healthy boundaries in AI use.',
      },
    ],
  },
];
