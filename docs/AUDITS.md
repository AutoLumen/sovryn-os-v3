# Security and Reliability Audits

Alpha.25 adds repo-level audit commands for hardening autonomous research runs.
They are evidence gates and diagnostics, not guarantees of security.

```bash
sovryn security audit --json
sovryn security audit-public-release .sovryn/factory/<slug>/release/public --json
sovryn security audit-worker --profile container-netoff --json
sovryn reliability audit --json
sovryn reliability replay-all --json
sovryn safety scan-goal "Improve autonomous research agents" --json
sovryn safety scan-release .sovryn/factory/<slug>/release/public --json
```

Artifacts are written under `.sovryn/audits/`:

- `security-audit.json` and `SECURITY_AUDIT.md`
- `reliability-audit.json` and `RELIABILITY_AUDIT.md`
- `replay-all-report.json` and `REPLAY_ALL_REPORT.md`
- `abuse-risk-report.json` and `ABUSE_RISK_REPORT.md`

Security audit checks generated public release roots, public corpus exports,
release-candidate packages, worker doctor output, and generated command
evidence. It blocks obvious command-injection patterns, curl-pipe-shell
installers, host package-manager installs, host `sudo`, raw log leakage,
secret-like text, local absolute paths, fake sandbox claims, and fake legal
patentability or freedom-to-operate claims.

Reliability audit replays existing Factory evidence without new network
research, rebuilds corpus/public-corpus views, and updates the release registry
from current evidence. It fails when replay-all fails, release-candidate review
fails, corpus export gates fail, or registry reconstruction fails.

Safety scans are conservative text gates for goals and release directories. They
do not make semantic safety guarantees, but they catch obvious malware,
credential-theft, phishing, exploit-operationalization, spam, dangerous
physical-world, and fake legal-claim language before those artifacts enter a
publication workflow.

Sovryn produces Open Inventions, Defensive Publications, and Open Source
Research Artifacts. It does not file legal patents and does not provide legal
novelty, patentability, or freedom-to-operate opinions.
