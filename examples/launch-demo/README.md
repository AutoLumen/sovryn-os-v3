# Launch Demo

This demo is the public beta / v1.0-RC readiness path for Sovryn OS v3.

```bash
npm install
npm run build
mkdir -p /tmp/sovryn-launch-demo
cd /tmp/sovryn-launch-demo
git init
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js init --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js beta demo --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js autonomy campaign plan --goal "Improve autonomous open-source research agents" --runs 10 --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js autonomy campaign run --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js benchmark research run --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js corpus api export --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js launch check --json
node /Users/sovryn/Desktop/sovryn-os-v3/dist/cli.js launch package --json
```

The demo prepares local evidence only. It does not perform real GitHub
publication and does not expose GitHub credentials.

See `DEMO_SCRIPT.md` for the full pilot sequence.
