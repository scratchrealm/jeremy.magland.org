# Comment server

[Isso](https://isso-comments.de) comment server for the posts on jeremy.magland.org, running on Fly.io as the app `jeremy-comments` and served at https://jeremy-comments.magland.org. It is a single machine with a SQLite database on a Fly volume mounted at `/db`. This folder is not part of the Astro build or the GitHub Pages deploy.

- `Dockerfile`: the official `ghcr.io/isso-comments/isso:release` image plus `isso.cfg`. It refuses to start if the `ISSO_ADMIN_PASSWORD` secret is missing.
- `isso.cfg`: all comments are held for moderation (unapproved ones are purged after 30 days), the default rate limits apply, and the admin UI is enabled.
- `fly.toml`: one 512 MB machine that stops when idle and starts on the next request, so the first page view after a quiet period waits a moment for comments to load.

## One-time deploy

Run these from this folder with `fly` logged in.

```bash
# Create the app from the existing fly.toml, without deploying
fly launch --copy-config --no-deploy

# 1 GB volume for the SQLite database, in the same region as the app
fly volumes create isso_db --size 1 --region ewr --yes

# Password for the admin UI (keep it in a password manager)
fly secrets set ISSO_ADMIN_PASSWORD='<long random password>'

# Moderation emails (see "Email notifications" below)
fly secrets set ISSO_SMTP_USER='<you>@gmail.com' ISSO_SMTP_PASSWORD='<app password>'

# Deploy a single machine (SQLite cannot be shared between machines)
fly deploy --ha=false

# TLS certificate for the custom domain
fly certs add jeremy-comments.magland.org
```

Then add this record to the `magland.org` zone in Cloudflare:

| Type  | Name              | Target                    | Proxy status |
|-------|-------------------|---------------------------|--------------|
| CNAME | `jeremy-comments` | `jeremy-comments.fly.dev` | DNS only     |

The record must stay DNS only (grey cloud). Fly needs to reach the domain directly to issue the certificate, and Isso's rate limits key on the client address, which it reads from the last `X-Forwarded-For` entry; behind the Cloudflare proxy that entry would be a Cloudflare address shared by many commenters. Check the certificate with `fly certs show jeremy-comments.magland.org`, then https://jeremy-comments.magland.org/info should answer.

## Email notifications

Each new comment is emailed to `ISSO_SMTP_USER` through Gmail's SMTP server (see `[smtp]` in `isso.cfg`). The email contains the comment text, the commenter's address truncated to /24, and links that activate or delete the comment without logging in. Gmail requires an app password for this, which needs 2-Step Verification on the account; create one at https://myaccount.google.com/apppasswords and set it as `ISSO_SMTP_PASSWORD`. To use another provider, change `host`, `port`, and `security` in `isso.cfg`. At startup, `fly logs` shows either "connected to SMTP server" or the reason the connection failed.

## Operation

- Moderation: https://jeremy-comments.magland.org/admin (log in with `ISSO_ADMIN_PASSWORD`), or the Activate and Delete links in the notification email. New comments are also logged to stdout, so `fly logs` shows them.
- Config changes: edit `isso.cfg` and run `fly deploy --ha=false` again.
- Backups: Fly takes daily snapshots of the volume (`fly volumes snapshots list <volume id>`).
