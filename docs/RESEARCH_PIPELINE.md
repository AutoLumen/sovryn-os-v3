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

Phase filenames use hyphens, for example `landscape-scan.json`,
`prior-art-mapping.json`, `publication-review.json`, and
`github-publication.json`. The typed phase names remain underscore-separated in
JSON for stable programmatic use.

Phase evidence includes status, timestamps, summary, artifacts, evidence hash,
and errors. The first implementation is template-based and deterministic. Future
providers may use external LLMs, local models, search APIs, browser automation,
or `sovryn-agentd`.

Internal roles are represented as modules: Scout, PriorArtMapper, Inventor,
Skeptic, Builder, DocWriter, and Publisher. Prior-art mapping is not a legal
conclusion.

The dossier includes a structured prior-art matrix with source type, URL,
overlap, difference, relevance, and citation fields. By default the MVP keeps
`invent-open` deterministic and fills this with mock public-source placeholders.

Sovryn also includes public-source search adapters for GitHub repositories,
OpenAlex works, arXiv papers, patent search links, standards/docs search links,
and general web search links. Enable them in `.sovryn/config.json`:

```json
{
  "research": {
    "publicSearch": {
      "enabled": true,
      "maxResultsPerSource": 3,
      "includeQueryLinks": true,
      "githubTokenEnv": null
    }
  }
}
```

Public-source search writes
`.sovryn/inventions/<slug>/evidence/public-source-search.json`. Retrieved
results are technical research leads, not legal prior-art conclusions.
