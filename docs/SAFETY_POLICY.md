# Safety Policy

Sovryn's open invention pipeline is open-source-first, but it must not publish
harmful artifacts.

The MVP blocks publication when generated or staged files contain conservative
patterns for:

- malware source or payload instructions
- credential theft tools
- phishing kits
- exploit operationalization or unauthorized intrusion workflows
- spam automation
- dangerous weaponization
- harmful biological or chemical instructions
- private data
- copyrighted bulk material
- leaked secrets

The scanner is intentionally conservative and deterministic. It is not perfect,
and it is not a replacement for human review. Generated content must be reviewed
if used in serious contexts.

The system is not a security sandbox unless paired with containers, VMs,
firewalling, network namespaces, or equivalent runtime isolation.
