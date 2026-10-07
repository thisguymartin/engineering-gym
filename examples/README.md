# Pick a capability to practice

These are synthetic examples. Neither skill scans your day or starts a lesson without an explicit invocation.

## Learn a concept from a project

Open the agent in the project you want to understand. No ticket or code change is needed. If you do not have a topic, start with:

```text
$engineering-rep I want to deepen my understanding of this project. Offer two or three narrow concepts grounded in one area of its code. Let me choose one, then give me an independent read/predict and test-design rep.
```

Suppose you choose **stale async responses**. The agent finds one request path and asks what the UI shows if request B completes before the older request A. You inspect the code and predict the result before running an existing safe check or writing a small regression test. Afterward, the agent compares your prediction with the observed behavior and asks you to explain the result using the actual state transition or test. It does not write a patch into your attempt first.

That is the **immediate check**. On a later day, ask for a changed case such as cancellation during navigation. Try it without hints. That is stronger evidence that you retained and can transfer the idea; one passing test or fluent explanation is not enough. If the real project needs credentials or live data to run, use a read/predict rep or a synthetic version instead.

For a portable version, give a **sanitized concept**, such as “an older response may arrive last,” and request synthetic data. Do not copy private source, logs, records, or transcripts into engineering-gym.

## 1. Learn while shipping

You: `$engineering-gym I'm changing how our worker handles cancellation. I want to own the design; help implement once we have the behavior clear.`

Agent: Inspect the relevant code, then ask what should happen if cancellation arrives after a job is dequeued but before its result is committed. Compare your answer with the current behavior and requirements. If a key prerequisite is new, explain it. Once the decision is clear, implement the requested change and run checks. Later, connect the result to your original prediction.

This is similar to VibeWise's reason-first flow. AI-written implementation remains **assisted completion**.

## 2. Do the debugging yourself

You: `$engineering-rep I want an independent rep on duplicate delivery. Give me a small synthetic TypeScript starter and runnable checks.`

Agent: Prepare a fresh scratch workspace with synthetic events, an invariant, and a deterministic interleaving check. Verify the starter fails for the intended behavior. Give you the path and check command, then stop. You close the agent, investigate, and change the code yourself. When you return, the agent reviews your test result and explanation. A hint switches the attempt to coached.

## 3. Read and predict unfamiliar code

You: `$engineering-rep Give me a read-and-predict rep on this async module. No answer until I commit to a prediction.`

Agent: Identify one observable execution path, ask you to predict the output or state, then let you run it. Compare the result with your model. A later variation changes cancellation or ordering, not just names.

## 4. Revisit a concept later

You: `$engineering-rep Revisit the retry concept I struggled with. This time change the failure boundary.`

Agent: Use your approved summary or previous conversation context, not an automatic scan of private history. Give a changed problem. Compare your new unaided result with the earlier assisted one without assigning a mastery score.

For confidential work, supply an approved sanitized description; portable exercises use synthetic data. No customer records, production logs, secrets, or private transcripts should be copied into a practice workspace.

[Animated walkthrough](demo/daily-workflow.gif) · [Editable Excalidraw flow](diagrams/daily-workflow.excalidraw) · [Human-review coaching scenarios](coaching-scenarios.json). The animation is illustrative. No live-model evaluation has been run.
