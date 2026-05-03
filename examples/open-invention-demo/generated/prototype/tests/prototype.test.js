import assert from "node:assert/strict";
import { describeOpenInvention } from "../src/index.js";

const invention = describeOpenInvention();
assert.equal(invention.slug, "verifiable-open-source-agent-research");
assert.ok(invention.title.length > 0);
