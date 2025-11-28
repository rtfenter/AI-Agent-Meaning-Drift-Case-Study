const userInputEl = document.getElementById("user-input");
const riskProfileEl = document.getElementById("risk-profile");
const summaryAggressivenessEl = document.getElementById("summary-aggressiveness");
const simulateBtn = document.getElementById("simulateBtn");
const loadExampleBtn = document.getElementById("loadExampleBtn");
const exampleSelectEl = document.getElementById("example-select");
const exampleNotesEl = document.getElementById("example-notes");
const statusTextEl = document.getElementById("status-text");

// Current pipeline outputs
const currentSafetyEl = document.getElementById("current-safety");
const currentPolicyEl = document.getElementById("current-policy");
const currentMemoryEl = document.getElementById("current-memory");
const currentFinalEl = document.getElementById("current-final");

// Stabilized pipeline outputs
const stableEicEl = document.getElementById("stable-eic");
const stableSafetyEl = document.getElementById("stable-safety");
const stableMemoryEl = document.getElementById("stable-memory");
const stableFinalEl = document.getElementById("stable-final");

const EXAMPLES = [
  {
    id: "example1",
    title: "Example 1 — Formatting, tone, and structure",
    prompt: `Summarize this document in exactly 5 bullet points.
Keep my original section headings.
Do NOT change the tone at all.
Respond in a Markdown table with columns for Section, Key Insight, and Risk.`,
    watchFor:
      "Left: table + tone + headings often dropped. Right: all constraints preserved verbatim."
  },
  {
    id: "example2",
    title: "Example 2 — Sensitive but safe content",
    prompt: `Analyze the communication mistakes in this fictional scenario:
"Alice accused Bob of lying about the report due date, but Bob genuinely misunderstood the instructions."
Focus only on interpersonal patterns.
Do NOT provide legal or psychological advice.
Present the output in 3 short bullets using neutral tone.`,
    watchFor:
      "Left: may over-apply safety → generic relationship advice. Right: bullet count, tone, and “no psychology” all preserved."
  },
  {
    id: "example3",
    title: "Example 3 — Long instruction with constraints at the edges",
    prompt: `Rewrite the following policy document for clarity.
Do NOT shorten it.
Do NOT remove any obligations or requirements.
Keep all numbered sections exactly as they are.
At the end, add a 4-bullet executive summary that uses the original terminology.
Here is the document:
[PASTE ANY LONG TEXT HERE]`,
    watchFor:
      "Left: memory compression drops early/late constraints. Right: all constraints retained as explicit inputs."
  },
  {
    id: "example4",
    title: "Example 4 — Design prompt with tight style rules",
    prompt: `Generate 3 brand taglines for a new wellness app.
Tone: soft, minimal, elegant.
Format each tagline as "Tagline — short rationale".
Do NOT use emojis or exclamation marks.
Keep the output under 20 words total.`,
    watchFor:
      "Left: stylistic tone preserved, hard limits usually lost. Right: tone + limits + formatting preserved."
  },
  {
    id: "example5",
    title: "Example 5 — All-around interpretation drift scenario",
    prompt: `Provide a 4-step troubleshooting flow for the following situation:
"My team keeps misunderstanding each other's Slack messages."
Keep the tone calm and neutral.
Do NOT include psychological advice.
Use a Markdown numbered list.
After the list, include a 1-sentence meta-summary that starts with: "Interpretation drift occurs when..."`,
    watchFor:
      "Left: Markdown + meta-summary often lost. Right: structure + constraints preserved cleanly."
  }
];

function getExampleById(id) {
  return EXAMPLES.find((ex) => ex.id === id) || EXAMPLES[0];
}

function loadExamplePrompt() {
  const selectedId = exampleSelectEl ? exampleSelectEl.value : EXAMPLES[0].id;
  const ex = getExampleById(selectedId);

  userInputEl.value = ex.prompt;
  exampleNotesEl.textContent = `What to watch for: ${ex.watchFor}`;
  statusTextEl.textContent = `${ex.title} loaded. Click “Simulate Interpretation” to see drift.`;
}

function splitSentences(text) {
  // Very rough sentence splitter – good enough for illustrative purposes
  const raw = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return raw;
}

function extractConstraints(text) {
  const sentences = splitSentences(text);
  const constraintKeywords = [
    "must",
    "only",
    "never",
    "don't",
    "do not",
    "exactly",
    "verbatim",
    "keep",
    "format",
    "style",
    "tone",
    "respond in",
    "output as",
    "use"
  ];

  const constraints = [];
  const core = [];

  sentences.forEach((s) => {
    const lower = s.toLowerCase();
    const isConstraint = constraintKeywords.some((kw) => lower.includes(kw));
    if (isConstraint) {
      constraints.push(s);
    } else {
      core.push(s);
    }
  });

  return {
    coreText: core.join(" "),
    constraints,
    allSentences: sentences
  };
}

/**
 * Simulate the "current" system pipeline:
 * - Safety may overreact when risk profile is high
 * - Policy may narrow / sanitize constraints
 * - Memory compression drops detail
 * - Final reasoning sees a drifted, simplified instruction
 */
function simulateCurrentPipeline(text, riskProfile, compressionLevel) {
  const { coreText, constraints } = extractConstraints(text);

  // 1) Safety
  let safetyNote = "";
  let safetyTransformedText = text;

  const length = text.length;
  const hasPotentiallySensitiveWords = /attack|exploit|bypass|jailbreak|hack/i.test(text);

  if (riskProfile === "high") {
    if (hasPotentiallySensitiveWords) {
      safetyNote =
        "High-sensitivity mode: input flagged as potentially risky. " +
        "Task is reframed toward generic explanation.";
      safetyTransformedText = coreText || text;
    } else if (length > 280) {
      safetyNote =
        "High-sensitivity mode: long input. Context trimmed for safety review, " +
        "style constraints treated as secondary.";
      safetyTransformedText = coreText || text.slice(0, 260);
    } else {
      safetyNote =
        "High-sensitivity mode: input allowed, but constraints are deprioritized " +
        "relative to core task.";
    }
  } else {
    safetyNote =
      "Normal mode: input allowed. No explicit blocking, but constraints may still be softened downstream.";
  }

  const safetyOutput = safetyTransformedText;

  // 2) Policy Interpretation
  let policyText = "";
  let policyNote = "";

  if (constraints.length > 0) {
    const keptConstraint = constraints[0];
    policyText = `${coreText} ${keptConstraint}`.trim();
    policyNote =
      "Policy pass: global rules emphasize core task and retain only a subset of constraints (e.g., the first one). " +
      "Other style/formatting rules are implicitly treated as optional.";
  } else {
    policyText = safetyOutput;
    policyNote =
      "Policy pass: no explicit constraints detected; input forwarded as-is after safety processing.";
  }

  // 3) Memory Compression
  let memoryText = "";
  let memoryNote = "";

  if (compressionLevel === "aggressive") {
    const limit = 200;
    if (policyText.length > limit) {
      memoryText = policyText.slice(0, limit) + " … [truncated for summary]";
      memoryNote =
        "Aggressive memory compression: prompt truncated for summary. Lower-priority details (often formatting and style) are dropped.";
    } else {
      memoryText = policyText;
      memoryNote =
        "Aggressive memory compression: text is short enough, but future expansions might ignore subtle formatting rules.";
    }
  } else {
    const limit = 320;
    if (policyText.length > limit) {
      memoryText = policyText.slice(0, limit) + " … [light truncation]";
      memoryNote =
        "Light memory compression: small truncation applied. Most constraints preserved, but some nuance may be lost.";
    } else {
      memoryText = policyText;
      memoryNote =
        "Light memory compression: input preserved. Any loss now will likely come from reasoning shortcuts, not memory.";
    }
  }

  // 4) Reasoning Input (Drifted)
  // Heuristic: drop phrases like "Markdown table", "tone", etc. to show drift.
  let finalText = memoryText.replace(/in a markdown table[^.]*[.]?/gi, "");
  finalText = finalText.replace(/don't change the tone[^.]*[.]?/gi, "");
  finalText = finalText.replace(/keep my original section headings[^.]*[.]?/gi, "");

  const finalNote =
    "Reasoning sees a simplified version of the request. The main content intent is preserved, " +
    "but format and tone constraints may be partially or fully lost, producing visible meaning drift.";

  return {
    safety: `${safetyNote}\n\n${safetyOutput}`,
    policy: `${policyNote}\n\n${policyText}`,
    memory: `${memoryNote}\n\n${memoryText}`,
    final: finalText + "\n\n" + finalNote
  };
}

/**
 * Simulate the "stabilized" pipeline:
 * - Attach an Explicit Intent Contract
 * - Safety blocks/permits but does not reinterpret safe instructions
 * - Memory Invariant preserves constraint sentences verbatim
 * - Reasoning sees core instruction + explicit constraints
 */
function simulateStabilizedPipeline(text) {
  const { coreText, constraints } = extractConstraints(text);

  const eic = {
    intent_type: "analysis",
    risk_tolerance: "literal",
    style: "direct"
  };

  const eicPretty = JSON.stringify(eic, null, 2);

  const safetyExplanation =
    "Safety check operates in block/allow mode. For safe content, it passes the " +
    "user instruction through unchanged, without reinterpretation.";

  const memoryExplanation =
    constraints.length > 0
      ? "Memory invariant: all detected constraint sentences are preserved verbatim across summaries.\n\nConstraints:\n- " +
        constraints.join("\n- ")
      : "Memory invariant: no explicit constraints detected, so the full user instruction is preserved as-is.";

  const finalInstruction =
    "Core instruction:\n" +
    (coreText || text) +
    "\n\nPreserved constraints:\n" +
    (constraints.length ? "- " + constraints.join("\n- ") : "(none detected)") +
    "\n\nThis is what the reasoning layer sees – a stable combination of task + constraints.";

  return {
    eic: `Explicit Intent Contract attached to this task:\n\n${eicPretty}`,
    safety: safetyExplanation,
    memory: memoryExplanation,
    final: finalInstruction
  };
}

function simulate() {
  const text = userInputEl.value.trim();
  if (!text) {
    statusTextEl.textContent = "Load an example prompt first.";
    return;
  }

  const riskProfile = riskProfileEl.value;
  const compression = summaryAggressivenessEl.value;

  const current = simulateCurrentPipeline(text, riskProfile, compression);
  const stable = simulateStabilizedPipeline(text);

  currentSafetyEl.textContent = current.safety;
  currentPolicyEl.textContent = current.policy;
  currentMemoryEl.textContent = current.memory;
  currentFinalEl.textContent = current.final;

  stableEicEl.textContent = stable.eic;
  stableSafetyEl.textContent = stable.safety;
  stableMemoryEl.textContent = stable.memory;
  stableFinalEl.textContent = stable.final;

  statusTextEl.textContent =
    "Simulation complete. Compare the drifted reasoning input on the left with the stabilized version on the right.";
}

// Wire up events
simulateBtn.addEventListener("click", simulate);
loadExampleBtn.addEventListener("click", loadExamplePrompt);

// Initial state: auto-load Example 1
document.addEventListener("DOMContentLoaded", () => {
  if (exampleSelectEl) {
    exampleSelectEl.value = "example1";
  }
  loadExamplePrompt();
});
