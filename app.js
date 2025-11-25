const userInputEl = document.getElementById("user-input");
const riskProfileEl = document.getElementById("risk-profile");
const summaryAggressivenessEl = document.getElementById("summary-aggressiveness");
const simulateBtn = document.getElementById("simulateBtn");
const loadExampleBtn = document.getElementById("loadExampleBtn");
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

function loadExamplePrompt() {
  const example =
    "Summarize this document in exactly 5 bullet points, " +
    "keep my original section headings, don't change the tone, " +
    "and respond in a Markdown table with columns for Section and Summary.";
  userInputEl.value = example;
  statusTextEl.textContent = "Example prompt loaded. Click “Simulate Interpretation” to see drift.";
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
  const { coreText, constraints, allSentences } = extractConstraints(text);

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
    statusTextEl.textContent = "Enter a user instruction first.";
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

// Initial status
statusTextEl.textContent = "No simulation yet. Load the example or paste a real instruction to begin.";
