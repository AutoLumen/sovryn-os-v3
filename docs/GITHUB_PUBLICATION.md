# GitHub Publication

GitHub publishing is performed by Sovryn Controller after publication gates
pass. The autonomous agent never receives raw GitHub credentials.

Config:

```json
{
  "github": {
    "enabled": true,
    "defaultOrg": "<org>",
    "tokenEnv": "SOVRYN_GITHUB_TOKEN",
    "defaultVisibility": "public"
  }
}
```

Dry run:

```bash
sovryn publish-github <mission-id> --dry-run
```

Real publication:

```bash
SOVRYN_GITHUB_TOKEN=... sovryn publish-github <mission-id> --org <org> --repo <repo>
```

The publisher stages a clean release repository under
`.sovryn/inventions/<slug>/release/repo`, initializes Git, commits the dossier
and prototype, creates a release tag, and pushes through GitHub CLI using the
configured token environment variable.

Sovryn publishes Open Inventions and Defensive Publications. It does not file
legal patents.
