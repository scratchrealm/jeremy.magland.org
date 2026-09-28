---
title: Spin up your own git forge with Mochi
date: 2026-09-26
summary: A video walkthrough of Mochi Forge, a self-hosted GitHub replacement that runs locally with a single command.
authors:
  - Jeremy Magland
featured: true
---

<video controls playsinline preload="metadata" poster="https://media.magland.org/videos/spin-up-your-own-git-forge-with-mochi-6404521fd391.jpg" style="width: 100%;" src="https://media.magland.org/videos/spin-up-your-own-git-forge-with-mochi-6404521fd391.mp4"></video>

Source: [magland/mochiforge](https://github.com/magland/mochiforge) · [npm: @magland/mochi](https://www.npmjs.com/package/@magland/mochi)

## Transcript

### Starting a local vault

Hello. I'm going to show you how you can spin up your own GitHub replacement, a git forge, locally with a single command. I'm on Linux, and I have Node.js installed, so I can run `npx`. First, I'm going to make a directory for storing all of my repositories and everything else. I'll call it `vault1`. Then I run:

```bash
npx @magland/mochi serve vault1
```

There we go. This is the token for the owner user of my new Mochi vault. Let me open this link here on port 3000 locally, and here's my vault. I can click sign in, choose owner, and put in the token.

### Users, collections, and repositories

Maybe the first thing I want to do is go to Admin and create a new user. Let's call it `jmagland` and make it an admin user. I have a new token here, so let me sign out and then sign in as the new user.

Now I can create a new collection. A collection is kind of like an organization on GitHub. Let me call it Proof of Concept. Now that I have the collection, I can create a new repository: `example1`, with the description "Test repo". Create the repository, and there we go.

### Cloning and pushing

Let's say I want to clone that. Of course, all of this is local. I go to my terminal and run `git clone` with the local URL for that repo, and there we go. I have the README. Let's say I edit the README, then add, commit, and push.

Here's where I have to put in my username, `jmagland`, and I hope I still have the token on my clipboard. Maybe I don't. So what am I going to do? I go back to Admin, Users, `jmagland`, and make a new token. Copy that. (Of course, what I really should be doing is keeping these tokens in a text file, but this is just for a demo.) Back in the terminal, let's give the push another shot with the username and token. Great.

Now we go back to the browser and see the exciting thing, which is that my new repo has been modified: the README has new content. You can probably guess how the rest works. I can make further edits in the browser and commit the changes just like on GitHub, and then pull the changes in the terminal.

### Workflows and runners

There's a lot you can do in Mochi; it's modeled after GitHub. Probably the most advanced feature is actions and workflows. Mochi supports a subset of the functionality of GitHub Actions.

You might be wondering where those actions run. GitHub has a whole fleet of runners that Microsoft hosts. In the case of Mochi, we run our own workflow runners. If I go to Admin, Runners, I can register a new runner. I give it a name (the name of this laptop) and specify which repositories the runner will serve. If I leave that blank, or I guess put a `*` there, it will serve all repositories. I register the runner, and then, if I have Docker installed, I just run the command it gives me. Let me go to a scratch directory and run the command, and now it's waiting for jobs.

The exciting thing is that if I had a repository with a GitHub Actions workflow in it (this one doesn't, but suppose it did) set up to run on push, the runner in this terminal would pick it up.

### Sites, and a vault in the cloud

Workflows can deploy to the equivalent of GitHub Pages, so you can have sites; in Mochi they're called sites. Here's a Mochi vault that I've set up in the cloud. You can see that I have a Proof of Concept collection where I've put a lot of repositories. I feel like an advantage of having your own GitHub is that you can put a ton of repositories on it without thinking twice or wondering whether you should really be putting this on GitHub. It's my own disk and my own space, so I can put a whole bunch of proof-of-concept repos there.

Each of these is a repo. For example, here's a repo with a simulation of cymbal crashes. If I open that repo, it has a GitHub Actions workflow that deploys the site, in the same syntax and format as on GitHub. I can look at Actions, and these are my own runners that executed the queued workflow and created the deployed site here. This is another fun project where I'm simulating the physics of musical instruments, but that's for a different video.

### Issues, pull requests, and the CLI

Mochi is designed to have all of the most important features of GitHub. It has issues and pull requests, and you can set topics on repos. Importantly, there is a command line interface and an API for Mochi vaults, much like the `gh` GitHub command line tool. If you use AI coding agents, you can point them to the [Mochi skill](https://github.com/magland/mochiforge-skill), and then they know how to push to your Mochi repositories and do everything else, just as conveniently as if you were working with GitHub.

### Everything is a directory

So I showed you how to make a local Mochi vault. Very simple. Of course, it's not that useful to have something only on your computer, so the typical next step would be to put the vault in the cloud, and Mochi tries to make that as easy as possible. But first, one thing I wanted to show.

Let me close that runner. If I go to the vault directory, we can see how things are stored on disk. I've got collections, and in each collection I've got the repos. In the repos I've got `example1`, which is a bare repo, meaning it doesn't have a working tree, so you can't see the files; it's just the git content. What I'm showing here is that everything is on disk. There's no database. If you want to back up your vault, you just make a backup of everything under the vault directory. That includes the issues, the pull requests, the deployed sites, everything. I think that's a simple, elegant approach: it's only a directory.

That wouldn't work for something as large as GitHub, where you have thousands or millions of users. You can't have just one directory. So the philosophy of Mochi is that it's not trying to be a big social platform for code collaboration among hundreds of users. It's meant to be a private GitHub instance that you use with a few developers, or just by yourself for all of your stuff. When you deploy it to the cloud, all you really need is one virtual machine with a public URL. The disk on that one machine holds the whole vault, and a single process serves it. It's very simple, and you can just back up that directory.

### Deploying to the cloud

Let's say I wanted to create a new vault in the cloud. I would run something like:

```bash
npx @magland/mochi deploy fly vault5
```

Interesting. Okay, well, in a separate video I will show you how to deploy a Mochi vault to the cloud. It's supposed to be as easy as one command if you sign up for [Fly.io](https://fly.io). Thanks.
