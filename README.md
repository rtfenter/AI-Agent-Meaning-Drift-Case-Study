# AI Agent Meaning Drift — Case Study  
### How interpretation changes across safety layers, memory compression, and constraint handling

[![Live Demo](https://img.shields.io/badge/Live%20Demo-000?style=for-the-badge)](https://rtfenter.github.io/AI-Agent-Meaning-Drift-Case-Study/)

---

## Demo Screenshot  

<img width="2806" height="2900" alt="Screenshot 2025-11-28 at 13-51-09 Meaning Drift Sandbox – AI Agent Interpretation" src="https://github.com/user-attachments/assets/1ad75967-810b-4a55-b02e-250f1528c3ce" />

---

## Try These Examples in the Meaning Drift Sandbox

Selct one of the prompts below from the dropdown in the **Meaning Drift Sandbox**, click **Simulate Interpretation**, and compare:

- **Current System Interpretation** (left)  
- **Stabilized Contract Model** (right)

---

### Example 1 — Formatting, tone, structure

**Prompt:**  
Summarize this document in exactly 5 bullet points.  
Keep my original section headings.  
Do NOT change the tone at all.  
Respond in a Markdown table with columns for Section, Key Insight, and Risk.

**What to watch for:**  
Left: table + tone + headings often dropped  
Right: all constraints preserved verbatim

---

### Example 2 — Sensitive but safe content

**Prompt:**  
Analyze a fictional conflict:  
“Alice accused Bob of lying about the report due date, but Bob genuinely misunderstood the instructions.”  
Focus only on interpersonal patterns.  
Do NOT provide legal or psychological advice.  
Return 3 neutral bullets.

**What to watch for:**  
Left: over-applies safety → generic advice  
Right: preserves all constraints

---

### Example 3 — Long instruction with edge constraints

**Prompt:**  
Rewrite the policy document for clarity.  
Do NOT shorten it.  
Do NOT remove obligations.  
Keep numbered sections the same.  
Add a 4-bullet summary using original terminology.

**What to watch for:**  
Left: memory compression drops constraints  
Right: constraint retention

---

### Example 4 — Design prompt with tight style rules

**Prompt:**  
Generate 3 brand taglines.  
Tone: soft, minimal, elegant.  
Format: “Tagline — short rationale”.  
No emojis or exclamation marks.  
Under 20 words total.

**What to watch for:**  
Left: tone preserved, limits lost  
Right: limits + tone preserved

---

### Example 5 — Full interpretation drift scenario

**Prompt:**  
Provide a 4-step troubleshooting flow for:  
“My team keeps misunderstanding each other’s Slack messages.”  
Tone neutral.  
No psychology.  
Numbered list.  
Add a meta-summary starting with: “Interpretation drift occurs when…”

**What to watch for:**  
Left: formatting + constraints dropped  
Right: all retained

---

## 1. What Is Meaning Drift?

Meaning drift occurs when the model responds to a *different* version of the user input.

Common symptoms:

- safe prompts treated as risky  
- narrowed/reframed intent  
- dropped formatting or constraints  
- tone shifts  
- hallucinated permissions or rules  

---

## 2. Likely Contributing Factors

### A. Safety Layers  
Risk scoring alters inferred intent.

### B. Policy Interpretation  
Global rules override local user context.

### C. Memory Compression  
Summaries drop constraints, tone, or logic.

### D. Reasoning Layer  
Model reasons on transformed input.

---

## 3. System View: Current Interpretation Flow

    [User Instruction]
           ↓
    [Safety Layer]
           ↓
    [Policy Interpretation]
           ↓
    [Memory Compression]
           ↓
    [Model Reasoning]
           ↓
    [Output — drift introduced]

---

## 4. Stabilizing Interpretation: Proposed Contract Model

Meaning drift cannot be fixed with prompting alone.  
It requires **product and architectural changes.**

### A. Explicit Intent Contract (EIC)

Use this shape (escaped so GitHub won’t break the fence):

    {  
      "intent_type": "analysis",  
      "risk_tolerance": "literal",  
      "style": "direct"  
    }

### B. Memory Invariant Layer  
User-declared constraints persist verbatim unless changed.

### C. Safety Layer Contract  
Safety blocks unsafe tasks but must not reinterpret safe instructions.

---

## 5. Stabilized Interpretation Flow

    [User Instruction] + [Intent Contract]
               ↓
    [Safety Check — block/allow only]
               ↓
    [Memory Invariants — constraints preserved]
               ↓
    [Model Reasoning — stable interpretation]

---

## 6. Why This Matters

Unstable interpretation:

- breaks UX predictability  
- causes inconsistent long-form reasoning  
- increases false refusals  
- destabilizes trust  
- complicates integration across tools  
- undermines professional workflows  

Stable interpretation is a prerequisite for aligned AI systems.

---

## 7. About This Case Study

This is independent analysis based solely on **publicly observable behavior** of modern AI systems.  
It does *not* claim internal insight.

This repo aims to:

- map visible drift patterns  
- propose stabilizing architectural shapes  
- demonstrate PM-level reasoning through prototypes  
- make interpretation drift legible

---

### Part of the Product Architecture Case Studies Series  

Main hub:  
https://github.com/rtfenter/Product-Architecture-Case-Studies

---

## 8. Author

**Rebecca Fenter (rtfenter)**  
Product Manager — systems, platforms, AI architecture  
https://github.com/rtfenter
