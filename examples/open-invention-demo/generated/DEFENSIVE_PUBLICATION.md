# Defensive Publication: A method for verifiable open-source agent research

## Publication Date

Demo draft.

## Abstract

A deterministic demo dossier for verifiable open-source agent research.

## Technical Field

Autonomous research agents, evidence kernels, and reproducible open-source workflows.

## Problem

Agent research artifacts are difficult to trust when logs, verification, and publication review are disconnected.

## Background and Existing Approaches

Existing agent workflows often generate code or notes without a defensive-publication dossier and final publication gates.

## Summary of the Open Invention

Create an Open Invention mission that records evidence, generates a prototype, runs tests, and publishes only after Sovryn gates pass.

## Detailed Technical Description

The system creates a dossier, prototype, tests, and evidence under a mission-scoped invention directory.

## System Architecture

Sovryn Controller, Node Alpha workspace, dossier generator, verification evidence, publication policy, and GitHub publisher.

## Algorithm or Method

Accept a brief, generate the dossier structure, build a prototype scaffold, run verification, scan for secrets and unsafe content, and stage a GitHub release.

## Reference Implementation

See `prototype/`.

## Variants and Embodiments

- local Node Alpha
- future agentd backend

## Advantages

- auditable publication gates
- open-source-first artifacts

## Limitations

- manual prior-art review required

## Safety Considerations

Do not publish harmful artifacts or leaked secrets.

## Keywords

open invention, defensive publication, autonomous research, evidence

## License

Apache-2.0 for code; CC-BY-4.0 for documentation where applicable.

## Repository

Assigned during dry-run or real GitHub publication.
