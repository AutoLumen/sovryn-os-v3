import assert from "node:assert/strict";
import test from "node:test";
import {
  ArxivSearchAdapter,
  createPublicSourceSearchAdapter,
  GitHubSearchAdapter,
  OpenAlexSearchAdapter,
  type FetchLike,
} from "../src/core/invention/providers.js";

test("GitHub public-source adapter maps repository search results", async () => {
  const requests: string[] = [];
  const fetcher: FetchLike = async (url) => {
    requests.push(url);
    return jsonResponse({
      items: [
        {
          full_name: "sovryn/self-verifying-agent-research",
          html_url: "https://github.com/sovryn/self-verifying-agent-research",
          description: "Evidence-based autonomous research agents",
        },
      ],
    });
  };
  const results = await new GitHubSearchAdapter({
    fetcher,
    limit: 1,
  }).search({
    brief: "self verifying autonomous research agents",
    sources: ["github"],
  });
  assert.match(requests[0], /api\.github\.com\/search\/repositories/);
  assert.equal(results.length, 1);
  assert.equal(results[0].sourceType, "github");
  assert.equal(results[0].title, "sovryn/self-verifying-agent-research");
  assert.equal(
    results[0].url,
    "https://github.com/sovryn/self-verifying-agent-research",
  );
  assert.equal(results[0].relevance, "high");
});

test("OpenAlex public-source adapter maps works search results", async () => {
  const fetcher: FetchLike = async () =>
    jsonResponse({
      results: [
        {
          title: "Verifiable Autonomous Research Workflows",
          doi: "https://doi.org/10.0000/example",
          publication_year: 2026,
        },
      ],
    });
  const results = await new OpenAlexSearchAdapter({
    fetcher,
    limit: 1,
  }).search({
    brief: "verifiable autonomous research workflows",
    sources: ["papers"],
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].sourceType, "paper");
  assert.equal(results[0].title, "Verifiable Autonomous Research Workflows");
  assert.equal(
    results[0].citation,
    "Verifiable Autonomous Research Workflows (2026)",
  );
});

test("arXiv public-source adapter parses Atom search entries", async () => {
  const fetcher: FetchLike = async () =>
    textResponse(`<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>https://arxiv.org/abs/2601.00001</id>
    <title>Self-Verifying Research Agents</title>
    <summary>Agents that emit reproducible evidence for research tasks.</summary>
  </entry>
</feed>`);
  const results = await new ArxivSearchAdapter({
    fetcher,
    limit: 1,
  }).search({
    brief: "self verifying research agents",
    sources: ["papers"],
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].sourceType, "paper");
  assert.equal(results[0].title, "Self-Verifying Research Agents");
  assert.equal(results[0].url, "https://arxiv.org/abs/2601.00001");
});

test("composite public-source adapter includes live adapters and public query links", async () => {
  const fetcher: FetchLike = async (url) => {
    if (url.includes("api.github.com")) {
      return jsonResponse({
        items: [
          {
            full_name: "sovryn/open-research",
            html_url: "https://github.com/sovryn/open-research",
            description: "Open research artifacts",
          },
        ],
      });
    }
    if (url.includes("api.openalex.org")) {
      return jsonResponse({
        results: [
          {
            title: "Open Research Artifact Systems",
            id: "https://openalex.org/W1",
          },
        ],
      });
    }
    return textResponse(
      `<feed><entry><id>https://arxiv.org/abs/2601.1</id><title>Open Agent Research</title><summary>Evidence artifacts.</summary></entry></feed>`,
    );
  };
  const results = await createPublicSourceSearchAdapter(
    {
      maxResultsPerSource: 1,
      includeQueryLinks: true,
    },
    fetcher,
  ).search({
    brief: "open research artifacts",
    sources: ["web", "github", "papers", "standards", "patents"],
  });
  assert.equal(
    results.some((result) => result.sourceType === "github"),
    true,
  );
  assert.equal(
    results.some((result) => result.sourceType === "paper"),
    true,
  );
  assert.equal(
    results.some((result) => result.sourceType === "patent"),
    true,
  );
  assert.equal(
    results.some((result) => result.sourceType === "standard"),
    true,
  );
  assert.equal(
    results.some((result) => result.sourceType === "web"),
    true,
  );
});

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
