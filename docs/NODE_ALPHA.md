# Node Alpha

Node Alpha is Sovryn's dedicated Linux research machine concept. It is the
agent's working machine for legitimate research, software development,
prototyping, documentation, benchmarking, and preparation of open-source
research artifacts.

For the MVP, Node Alpha runs locally through the shell adapter:

```bash
sovryn node register alpha --host local
sovryn node status alpha
sovryn node run alpha <mission-id>
sovryn node logs alpha <mission-id>
sovryn node artifacts alpha <mission-id>
```

The architecture is designed for later SSH, `sovryn-agentd`, container, and VM
backends. Node Alpha can create workspaces, run commands, inspect environment
state, collect artifacts, and stream logs.

Node Alpha is not a security sandbox unless paired with containers, VMs,
firewalling, network namespaces, or equivalent OS controls. The local MVP uses
policy checks and command blocking, not kernel isolation.

Autonomous agents may work in mission workspaces and install legitimate
development dependencies when policy permits. They may not access secrets
directly unless Sovryn grants a controlled capability.
