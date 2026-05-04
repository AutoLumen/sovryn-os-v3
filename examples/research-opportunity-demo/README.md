# Research Opportunity Demo

This demo shows the Alpha.15 Research Opportunity Engine. It lets Sovryn scan a
broad goal, rank research opportunities, build an autonomous queue, run one
Factory job, and write a morning report.

```bash
npm install
npm run build
mkdir -p /tmp/sovryn-opportunity-demo
cd /tmp/sovryn-opportunity-demo
git init -b main
git config user.name "Demo User"
git config user.email demo@example.com
printf '{"scripts":{"test":"node -e \"process.exit(0)\""}}\n' > package.json
git add -A
git commit -m initial
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js init --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js research scan --goal "Improve autonomous open-source research agents" --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js research queue build --goal "Improve autonomous open-source research agents" --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js research queue status --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js research queue run --max-runs 1 --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js research morning-report --json
```

Expected artifacts:

```text
.sovryn/opportunities/
  opportunity-scan.json
  opportunity-candidates.json
  priority-ranking.json
  rejected-opportunities.json
  research-queue.json
  RESEARCH_QUEUE.md
  OPPORTUNITY_REPORT.md
  morning-report.json
  MORNING_REPORT.md
```

Queue execution starts Factory runs only. It does not publish to GitHub and does
not bypass Factory, Open Invention, safety, secret, replay, or publication
gates.

The generated reports are open-source research planning artifacts. They are not
legal patent filings, patentability opinions, novelty opinions, or
freedom-to-operate opinions.
