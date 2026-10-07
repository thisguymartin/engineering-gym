# Evidence behind the practice

Checked 2026-10-07. Confidence is high (~90%) in the scoped summaries below;
low-to-medium (~60%) that adapting them as AI-assisted reasoning and separate
hands-on attempts will improve later independent performance. This adaptation has not been evaluated. These are design choices,
not a clinical intervention for “brainrot” or a guarantee of employability.

| Principle / primary source | Studied and found | Adaptation here / limit |
| --- | --- | --- |
| Retrieval: Roediger & Karpicke (2006), [published paper abstract](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/), [PubMed](https://pubmed.ncbi.nlm.nih.gov/16507066/) | Students studied prose; recall practice improved delayed retention compared with restudying, while restudying could do better on the immediate test. | Predict or attempt before seeing the answer. This does not establish that memorizing syntax or forbidding documentation improves software work. |
| Spacing: Cepeda et al. (2008), [published abstract](https://pubmed.ncbi.nlm.nih.gov/19076480/) | Fact learning with different review gaps and later test delays; useful spacing depended on the retention horizon. | Revisit a concept on a later real task when useful. No scheduler or optimal developer interval is established. |
| Transfer: Butler (2010), [published abstract](https://pubmed.ncbi.nlm.nih.gov/20804289/) | Four prose-learning experiments compared repeated study/testing; later tests included new inferential questions. Testing improved retention and transfer in those conditions. | Ask about a changed concurrency, failure boundary, predicate, or cancellation requirement. This does not validate broad job-skill transfer. |
| Fading: Renkl, Atkinson, Maier & Staley (2002), [publisher abstract](https://www.tandfonline.com/doi/abs/10.1080/00220970209599510), [original JSTOR link](https://www.jstor.org/stable/20152687) | Field/lab experiments compared gradually incomplete worked examples with example-problem pairs; benefits included near transfer, with backward fading favorable. | Teach prerequisites, show an analogous example, then reduce support on a different task. Professional engineering and far transfer remain unestablished here. |
| Assisted vs unaided performance: Bastani et al. (2025), [PNAS abstract](https://pubmed.ncbi.nlm.nih.gov/40560616/) | A high-school mathematics field experiment compared standard GPT access, a guarded tutor, and control. Assisted practice improved; subsequent unaided performance was worse for unrestricted access, with the tutor largely mitigating that harm. | Distinguish an AI-assisted delivery from an independent later attempt. Mathematics education is not evidence of inevitable deterioration in experienced engineers. |
| Calibrated evidence: Shen & Tamkin (2026), [paper v2](https://arxiv.org/html/2601.20245v2), [publication record](https://arxiv.org/abs/2601.20245), [authors' article](https://www.anthropic.com/research/AI-assistance-coding-skills) | In the main randomized study, 52 developers unfamiliar with Trio completed tasks then took a short-term quiz. AI access reduced average quiz performance; the average time benefit was not statistically significant. | Pair explanation with behavior and, when worthwhile, try a later changed task. This one-hour library-learning study did not measure long-term loss of established expertise. |

Access/status: R1–R5 are journal publications; this bounded review used their
abstracts, not a full methods audit. JSTOR did not expose text; R4's publisher
abstract was accessible. R5 has an [August 2025 correction](https://pubmed.ncbi.nlm.nih.gov/40833419/)
for an author's affiliation ([correction text](https://pdfs.semanticscholar.org/4e8b/adc5aef00eef42a935570827ec170420106d.pdf)).
R6 is an arXiv preprint, v2 dated February 1, 2026 in its submission record;
no peer-reviewed venue was verified. Its full HTML methods, results and limits
were consulted. The authors' interpretation of cognitive engagement and their
qualitative interaction groups is not a randomized comparison of coaching styles.
Their prediction about more agentic tools is an extrapolation, not an experimental finding.

Explanation tied to a test, trace, or counterexample is our conservative assessment
choice. It helps avoid equating fluent prose with the ability to implement. None
of these sources validates this repo, an optimal manual-coding percentage, an
intelligence score, or permanent mastery after one passing attempt.

## Relationship to VibeWise and the video

[VibeWise](https://github.com/nykooi1/vibe-wise) uses reason-first design
checkpoints while Claude writes the agreed implementation. Its [learning behavior](https://github.com/nykooi1/vibe-wise/blob/main/skills/learn/behavior.md)
also includes explanations, local learning notes, and project context. We adopt the
useful idea that the learner should shape consequential decisions, then add a
separate hands-on route in which the learner implements or debugs before seeing an
AI solution. Neither approach has demonstrated that it preserves a senior
engineer's long-term skill. Confidence: ~90% on the documented workflow distinction,
low on comparative learning effectiveness.

Snapshot on 2026-10-07: MIT license; GitHub showed 74 commits, one listed contributor,
recent commits on October 1 and 6, 7 open issues and 14 PRs, about 2.9k stars.
[Activity](https://github.com/nykooi1/vibe-wise/commits/main/) and
[contributors](https://github.com/nykooi1/vibe-wise/graphs/contributors) suggest active
but very young, single-maintainer development. Stars and a directory listing are
interest/distribution signals, not proof of production adoption or learning outcomes.
Its Claude Code/Python integration and session hook are more specific than these
portable instruction skills. No VibeWise code was copied or installed.

The [linked video](https://youtu.be/Ru99FGJ_yuE) is Gergely Orosz's LDX3 keynote.
His [October 6 written summary](https://newsletter.pragmaticengineer.com/p/the-state-of-the-tech-industry-in)
describes automation alongside persistent planning/testing needs and problems in
review and reliability. We reviewed that author-written companion, not a complete
video transcript. Its observations focus on AI labs, VC-backed startups and Big Tech;
they do not establish that coding knowledge is obsolete across the profession.
My inference (~85% confidence): practicing diagnosis, invariants and verification
remains useful as code generation increases. Individual career outcomes are uncertain.
