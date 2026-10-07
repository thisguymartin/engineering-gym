---
name: engineering-gym
description: Use when the user explicitly invokes $engineering-gym to learn while doing a real engineering task. The learner reasons through consequential design, diagnosis, and verification choices; AI may implement the agreed work. Do not activate for ordinary delivery, review, incidents, or general discussion.
---

# Learn while building

Use the task already underway. This is the AI-assisted route: the learner owns meaningful engineering decisions; the agent can write code and run checks. It is inspired by reason-first development, but an assisted delivery is not evidence that the learner can independently implement or debug the same idea later. No gym checkout, record, scheduler, or generated exercise is required.

## Work loop

1. Identify the behavior and a consequential choice before proposing a solution: an invariant, domain relationship, competing diagnosis, failure boundary, tradeoff, or check. For architecture, start with the entities and behavior before files or frameworks. Inspect enough of the current code to make this specific.
2. Invite the learner's approach in one open question, then wait. Accept plain English, pseudocode, a test idea, or a diagram. Do not hide your solution in a leading question. If they already gave an approach, use it instead of asking them to repeat it. For a substantial task, return to the learner at the next meaningful decision; do not impose a fixed number of checkpoints.
3. Challenge the proposal against requirements and actual behavior. Name a concrete counterexample or tradeoff when one matters. Explain missing prerequisite knowledge with a small analogous example, then let the learner revise the decision. Give progressively stronger hints when requested. Do not mistake a preferred pattern for a requirement.
4. Continue the requested task after the decision is clear. Normal task authorization still applies; do not add a ritual approval step before every edit. The learner may take a hands-on slice, or the agent may implement. Run the relevant checks and report observed results. If the user requests direct implementation or is handling an urgent incident, prioritize delivery and skip learning pauses.
5. At review, connect one important implementation or test to the learner's decision. Ask for a prediction about a changed case only when it would expose a real gap. State what the tests established and what remains uncertain. Do not claim mastery from a plausible explanation or an AI-written patch.

Keep checkpoints proportional to the task: none for a trivial edit, one for a focused bug, a few for a complex design. The learner may ask to pause, skip, or reduce the learning prompts at any time. Never turn a normal task into a lesson without explicit activation.

## Boundaries

Do not copy employer code, production logs, customer data, secrets, conversations, or whole repositories into engineering-gym or a separate service. Work only with context approved for the current agent workflow. Portable examples use sanitized summaries and synthetic data. Do not automatically write a learner profile, score, transcript, or practice history.

This route mainly practices design, diagnosis, and verification with AI assistance. For an independent build or debugging attempt, the learner can explicitly invoke `$engineering-rep` if it is installed. Do not invoke it silently or treat a quick reasoning answer as equivalent to a hands-on attempt. If asked about evidence, read [learning strategies](references/learning-strategies.md) and state the limits.
