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

## Five ways to use it

| Practice | Prompt | Check your understanding |
| --- | --- | --- |
| Understand unfamiliar code | `$engineering-rep Pick one request path. Ask me to predict what happens when a dependency fails, then let me trace it.` | Compare your prediction with a test or trace; explain the difference. |
| Debug a race | `$engineering-rep Give me an independent debugging rep on out-of-order async responses in this project.` | Form a hypothesis, run an experiment, then try a changed timing case later. |
| Design a useful test | `$engineering-rep Show me a behavior with a plausible bug. Let me design the regression test before you show yours.` | Check whether your test rejects the wrong behavior. |
| Understand a slow query | `$engineering-rep Help me understand one slow query. Let me predict its result and plan before suggesting a change.` | Preserve the result, inspect the plan, then try a different filter. |
| Learn while shipping | `$engineering-gym I'm changing this worker. Make me reason through the failure boundary, then help implement it.` | Compare the finished behavior with your reasoning. AI-written code counts as assisted work. |

For an unfamiliar prerequisite, ask for **guided** teaching. For a familiar one, try **independent** practice and switch to **coached** if you need a hint. A later changed problem gives stronger evidence of learning than repeating the same answer. For confidential work, give an approved sanitized description for a portable synthetic case; do not copy private source, logs, records, or transcripts into engineering-gym.

[Animated walkthrough](demo/daily-workflow.gif) · [Editable Excalidraw flow](diagrams/daily-workflow.excalidraw) · [Human-review coaching scenarios](coaching-scenarios.json). The animation is illustrative. No live-model evaluation has been run.
