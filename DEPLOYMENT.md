# Deploying the three sites

One repo, three separate Cloudflare Pages projects. Each has its own address and settings.

| Project | Build command | Output directory | Build-time variables |
|---|---|---|---|
| portfolio | `npm run build:portfolio` | `apps/portfolio/dist` | see `apps/portfolio/.env.example` |
| lighthouse | `npm run build:lighthouse` | `apps/lighthouse/dist` | see `apps/lighthouse/.env.example` |
| admin | `npm run build:admin` | `apps/admin/dist` | see `apps/admin/.env.example` |

Leave the root directory as the repo root, because the apps share `packages/shared`.

For each project:

1. Connect the GitHub repo and enter the settings above.
2. Under Settings → Builds, create a deploy hook. Copy its URL into the backend as
   `DEPLOY_HOOK_PORTFOLIO` or `DEPLOY_HOOK_LIGHTHOUSE`.
3. Set "Build watch paths" so a push to one app doesn't rebuild the others:
   `apps/<name>/*` and `packages/shared/*`. Admin doesn't need a deploy hook.

The public sites fetch their content from the backend while building, so the backend must be running.
A failed build leaves the previous version online.

The backend setup is in `Portfolio-with-AI-agent/DEPLOYMENT.md`.
