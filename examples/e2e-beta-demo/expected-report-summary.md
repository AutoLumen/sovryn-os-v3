# Expected E2E Report Summary

`E2E_REPORT.md` should include:

- exact commands run;
- phase pass/degraded/fail status;
- artifact references;
- discovered Factory, mission, and release-candidate IDs;
- critical failures;
- degraded reasons;
- replay diagnostics and replay-critical pass rate;
- launch limitation summary;
- public artifact scan result;
- worker isolation availability notes;
- confirmation that no real publication occurred;
- final recommendation.

Readiness labels:

- `failed`: critical security leak, unexpected real publish, silent host
  fallback, blocking launch limitation, replay-critical pass rate below 90, or
  no Factory run.
- `degraded`: major workflow ran, but a non-critical limitation such as
  unavailable container runtime or documented volatile replay observation was
  recorded.
- `pass`: all major flows completed with no critical failures.
- `strong-pass`: multiple release candidates, worker execution, replay success,
  and clean public scans are present.

The report must use careful language. It must not claim patentability, legal
novelty, or freedom-to-operate.
