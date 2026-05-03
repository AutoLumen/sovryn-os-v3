import assert from "node:assert/strict";
import test from "node:test";
import {
  ArxivAbstractReader,
  createSourceReadingEvidence,
  createSourceReadingProvider,
  GitHubReadmeReader,
  normalizeSourceReadingConfig,
  OpenAlexWorkReader,
  summarizeSourceReadings,
  type DeepSourceReading,
} from "../src/core/invention/source-readers.js";
import type {
  FetchLike,
  PriorArtSearchResult,
} from "../src/core/invention/providers.js";

test("GitHub source reader reads repository metadata and README", async () => {
  const requests: string[] = [];
  const fetcher: FetchLike = async (url) => {
    requests.push(url);
    if (url.endsWith("/readme")) {
      return textResponse(
        "# Self-Verifying Agent Research\n\nThis repository implements reproducible evidence journals for autonomous research agents.",
      );
    }
    return jsonResponse({
      description: "Evidence journals for agent research",
      language: "TypeScript",
      stargazers_count: 42,
      topics: ["agents", "evidence"],
    });
  };
  const reading = await new GitHubReadmeReader({
    fetcher,
    maxReadBytes: 10000,
  }).read(githubSource(), {
    brief: "verifiable autonomous agent research",
    sources: [githubSource()],
  });
  assert.match(requests[0], /api\.github\.com\/repos\/sovryn\/research-agent/);
  assert.match(requests[1], /\/readme$/);
  assert.equal(reading.readStatus, "read");
  assert.equal(reading.provider, "github-readme-reader");
  assert.equal(reading.metadata.language, "TypeScript");
  assert.equal(reading.metadata.stars, 42);
  assert.match(reading.summary, /reproducible evidence journals/);
  assert.equal(reading.noveltyRisk, "high");
  assert.equal(reading.prototypeRelevance, "high");
});

test("arXiv source reader reads abstract authors categories and year", async () => {
  const fetcher: FetchLike = async () =>
    textResponse(`<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Self-Verifying Research Agents</title>
    <summary>We present agents that emit reproducible evidence for research tasks.</summary>
    <published>2026-01-02T00:00:00Z</published>
    <author><name>Ada Example</name></author>
    <category term="cs.AI" />
  </entry>
</feed>`);
  const reading = await new ArxivAbstractReader({ fetcher }).read(
    paperSource("https://arxiv.org/abs/2601.00001"),
    {
      brief: "self verifying research agents",
      sources: [paperSource("https://arxiv.org/abs/2601.00001")],
    },
  );
  assert.equal(reading.readStatus, "read");
  assert.equal(reading.provider, "arxiv-abstract-reader");
  assert.deepEqual(reading.metadata.authors, ["Ada Example"]);
  assert.deepEqual(reading.metadata.categories, ["cs.AI"]);
  assert.equal(reading.metadata.publishedYear, 2026);
  assert.match(reading.summary, /reproducible evidence/);
});

test("OpenAlex source reader reconstructs inverted abstract metadata", async () => {
  const fetcher: FetchLike = async () =>
    jsonResponse({
      title: "Open Research Artifact Systems",
      doi: "https://doi.org/10.0000/example",
      publication_year: 2025,
      abstract_inverted_index: {
        Open: [0],
        research: [1],
        artifacts: [2],
        improve: [3],
        reproducibility: [4],
      },
      primary_location: {
        source: {
          display_name: "Journal of Open Agents",
        },
      },
      authorships: [
        {
          author: {
            display_name: "Grace Example",
          },
        },
      ],
    });
  const reading = await new OpenAlexWorkReader({ fetcher }).read(
    paperSource("https://openalex.org/W123"),
    {
      brief: "open research artifacts",
      sources: [paperSource("https://openalex.org/W123")],
    },
  );
  assert.equal(reading.readStatus, "read");
  assert.equal(reading.provider, "openalex-work-reader");
  assert.equal(reading.metadata.venue, "Journal of Open Agents");
  assert.deepEqual(reading.metadata.authors, ["Grace Example"]);
  assert.match(
    reading.summary,
    /Open research artifacts improve reproducibility/,
  );
});

test("source reading provider skips query links and records failures", async () => {
  const fetcher: FetchLike = async () => {
    throw new Error("network unavailable");
  };
  const provider = createSourceReadingProvider(
    {
      research: {
        sourceReading: {
          enabled: true,
          timeoutMs: 1000,
          maxReadBytes: 10000,
          githubTokenEnv: null,
        },
      },
    } as any,
    fetcher,
  );
  const readings = await provider.read({
    brief: "open research artifacts",
    sources: [
      githubSource(),
      {
        ...githubSource(),
        kind: "query_link",
        sourceType: "web",
        title: "Search lead",
        url: "https://www.google.com/search?q=open+research",
      },
    ],
  });
  assert.equal(readings[0].readStatus, "failed");
  assert.equal(readings[1].readStatus, "skipped");
  const summary = summarizeSourceReadings(readings);
  assert.equal(summary.status, "failed");
  assert.equal(summary.failedCount, 1);
  assert.equal(summary.skippedCount, 1);
});

test("source reading config normalizes booleans limits and disabled evidence", async () => {
  assert.deepEqual(
    normalizeSourceReadingConfig({
      enabled: "true" as any,
      timeoutMs: 1,
      maxReadBytes: 999999,
      githubTokenEnv: "",
    }),
    {
      enabled: false,
      timeoutMs: 1000,
      maxReadBytes: 100000,
      githubTokenEnv: null,
    },
  );
  const provider = createSourceReadingProvider({ research: {} } as any);
  const readings = await provider.read({
    brief: "open research artifacts",
    sources: [githubSource()],
  });
  assert.equal(readings[0].readStatus, "disabled");
  const evidence = createSourceReadingEvidence(
    readings as DeepSourceReading[],
    "disabled",
    "2026-05-03T00:00:00.000Z",
  );
  assert.equal(evidence.status, "disabled");
  assert.equal(evidence.disabledCount, 1);
  assert.equal(evidence.evidenceHash.length, 64);
});

function githubSource(): PriorArtSearchResult {
  return {
    kind: "concrete_source",
    title: "sovryn/research-agent",
    sourceType: "github",
    url: "https://github.com/sovryn/research-agent",
    relevance: "high",
    overlap: "Repository may overlap with agent research evidence.",
    difference: "Compare evidence model and publication gates.",
    citation: "GitHub repository: sovryn/research-agent",
    note: "Public GitHub source.",
  };
}

function paperSource(url: string): PriorArtSearchResult {
  return {
    kind: "concrete_source",
    title: "Open Research Artifact Systems",
    sourceType: "paper",
    url,
    relevance: "medium",
    overlap: "Paper may overlap with research artifacts.",
    difference: "Compare method and validation artifacts.",
    citation: "Open Research Artifact Systems",
    note: "Public paper source.",
  };
}

function jsonResponse(value: unknown): ReturnType<FetchLike> {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => value,
  });
}

function textResponse(value: string): ReturnType<FetchLike> {
  return Promise.resolve({
    ok: true,
    status: 200,
    text: async () => value,
  });
}
