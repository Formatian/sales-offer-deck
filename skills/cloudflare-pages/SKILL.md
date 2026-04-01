# Cloudflare Pages Workflow

Use this skill when working on local Pages preview, Wrangler configuration, or deployment for this presentation.

## Current setup

- Pages project name: `open-rtls-geoit`
- Config file: `wrangler.jsonc`
- Deploy helper: `publish.sh`
- Local credential file: `.cloudflare` (gitignored)

## Preview

Wrangler-based local preview:

```bash
npx wrangler pages dev .
```

Static preview is usually faster for content work:

```bash
bunx serve .
```

## Credentials

This project uses a local `.cloudflare` file with shell assignments.

Load it like this:

```bash
set -a
source ./.cloudflare
set +a
```

Do not print token values in responses.
Do not add `.cloudflare` to git.

## Deploy

Preferred command:

```bash
./publish.sh
```

Manual equivalent:

```bash
set -a
source ./.cloudflare
set +a
npx wrangler pages deploy . --project-name=open-rtls-geoit --branch=main
```

## Safety rule

Do not deploy unless the user explicitly asks to publish or deploy changes.

## Troubleshooting

- If Wrangler says it is unauthenticated in a non-interactive shell, the token was not exported correctly.
- If deployment warns about a dirty repo, that is acceptable for this project unless the user asked for a clean commit-based flow.
- If `wrangler.jsonc` changes, keep `name` aligned with the Pages project name.
