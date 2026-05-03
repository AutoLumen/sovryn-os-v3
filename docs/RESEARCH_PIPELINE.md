# Research Pipeline

Open Research Missions run deterministic phases in the MVP:

1. `brief`
2. `landscape_scan`
3. `prior_art_mapping`
4. `invention_synthesis`
5. `skeptic_review`
6. `prototype_build`
7. `verification`
8. `dossier_generation`
9. `publication_review`
10. `github_publication`

Each phase writes evidence to:

```text
.sovryn/inventions/<slug>/evidence/<phase>.json
```

Phase evidence includes status, timestamps, summary, artifacts, evidence hash,
and errors. The first implementation is template-based and deterministic. Future
providers may use external LLMs, local models, search APIs, browser automation,
or `sovryn-agentd`.

Internal roles are represented as modules: Scout, PriorArtMapper, Inventor,
Skeptic, Builder, DocWriter, and Publisher. Prior-art mapping is not a legal
conclusion.
