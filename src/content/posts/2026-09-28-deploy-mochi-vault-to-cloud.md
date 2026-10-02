---
title: Deploy a Mochi vault to the cloud
summary: A video follow-up showing how to deploy a Mochi Forge vault to Fly.io with a single command, and how to back it up.
---

<video controls playsinline preload="metadata" poster="https://media.magland.org/jeremy.magland.org/videos/deploy-mochi-vault-to-cloud-d882e290bcc9.jpg" style="width: 100%;" src="https://media.magland.org/jeremy.magland.org/videos/deploy-mochi-vault-to-cloud-2adf9c7eadeb.mp4"></video>

This is a follow-up to [Spin up your own git forge with Mochi](/posts/2026-09-26-spin-up-your-own-git-forge-with-mochi/), which shows how to run a vault locally.

Source: [magland/mochiforge](https://github.com/magland/mochiforge) · [npm: @magland/mochi](https://www.npmjs.com/package/@magland/mochi) · Docs: [Deploying a vault](https://github.com/magland/mochiforge/blob/main/docs/deploying.md), [Backing up a vault](https://github.com/magland/mochiforge/blob/main/docs/backup.md)

## Transcript

### Deploying with one command

In a [previous video post](/posts/2026-09-26-spin-up-your-own-git-forge-with-mochi/), I showed how to launch a Mochi vault (a GitHub replacement, a git forge) locally with a single command. Here I'm going to follow up by showing how to deploy a Mochi vault to the cloud, also with a single command.

First, you need to sign up for [Fly.io](https://fly.io). You could use other cloud providers, but this is the simplest way to go. After you have signed up, log in with the `fly` command line utility. I'll show that I'm logged in:

```bash
fly auth whoami
```

At this point, we just run `mochi deploy fly` and give the vault a name, like `vault6`:

```bash
npx @magland/mochi deploy fly vault6
```

The documentation describes how to configure the size of the machine and things like that, but by default it creates a relatively small machine. Then we wait a minute or so.

There we go. Up here is the API key (the token) for the owner of the vault, and here is the login URL. You can see [my other video](/posts/2026-09-26-spin-up-your-own-git-forge-with-mochi/) on how to use a Mochi vault, but it's very similar to being on GitHub. We sign in as the owner, and we can start creating repositories and so on.

### Idle shutdown and cold starts

One thing to note is that, by default, Fly only charges you for the time your machine is actually running. If you don't visit the website for a period of time, it shuts the machine down for you, and then you're not paying for it, which is nice. But when you do visit the site, there will be a cold start, perhaps five to ten seconds.

To show that, I'll stop the machine by hand:

```bash
fly machine stop -a vault6
```

I select the machine, and now I've forced it to stop. If I go back and load the vault, you can see that it takes about five or ten seconds the first time to start up. After that, until it shuts down again from being idle, it will be pretty fast.

### A custom domain

You can also configure your own custom domain. For example, I have `vault1.magland.org`. The [documentation](https://github.com/magland/mochiforge/blob/main/docs/deploying.md#a-domain-of-your-own) shows how to do that.

### Backups

Another convenient thing about Mochi is that you can very easily create a backup of your cloud vault. I have some backups of my `vault1`. Here's the current backup, and, again, with Mochi a vault is just a directory, so a backup is conceptually very simple. Here are the snapshots. Incremental backups are made by running `mochi backup` with the directory where I want to create the backup, plus `--snapshot`:

```bash
npx @magland/mochi backup ~/vault-backups/vault1 --snapshot
```

I won't actually run it here. Once you have a backup, you can serve it, or any snapshot you've created. For example, to serve the current backup of my `vault1` locally, I just run:

```bash
npx @magland/mochi serve ~/vault-backups/vault1/current
```

And there we go. It's serving locally from the backup.

### The philosophy of Mochi

Again, the philosophy of Mochi is not to host a large-scale git forge with hundreds or thousands of users. It's to let you very easily host your own GitHub replacement for yourself and perhaps a few collaborators, as a convenient place to keep your code. Thanks.
