---
title: "Are we human git collaboration"
summary: "How to use arewehuman in a collaborative git environment."
featured: false
---

<video controls playsinline preload="metadata" poster="https://media.magland.org/jeremy.magland.org/videos/are-we-human-git-collaboration-0a04a25f9eaa.jpg" style="width: 100%;" src="https://media.magland.org/jeremy.magland.org/videos/are-we-human-git-collaboration-2e2d1e4b57e8.mp4"></video>

This is a follow-up to [Are we human file format v2](/posts/2026-10-01-are-we-human-file-format-v2/). The arewehuman app itself was introduced in [Are we human?](/posts/2026-09-29-are-we-human/).

Source: [magland/arewehuman](https://github.com/magland/arewehuman) · Docs: [Where recordings are kept](https://github.com/magland/arewehuman/blob/main/vscode/README.md#where-recordings-are-kept)

## Transcript

### Setup

This is a follow-up to my last post about the arewehuman file format. Here I'm going to show how we might use the system in a collaborative environment, where two or more people are working in the same git repository and we want to track the history of composing a paper or other documents together.

What I have here is a bare repository on my local machine called `hub`, and two clones of it, with a VS Code window open on each: copy one and copy two.

### The .arewehuman directory

I'll start by creating a `.arewehuman` directory at the top level. The way it works is that if the system detects that this directory is present, the sidecar files go in there instead of next to the documents.

Let me make a new document, `document1.md`, and turn on arewehuman recording. Let's type "line one," "line two," "line two a," "line three." Let's say that we delete "line two a," and add "line four."

Now we can go into the `.arewehuman` directory, select this `.awh.jsonl` file, and see the replay locally. This is all my own work. As in the last video, you can see the redacted content that was later deleted.

### Committing and pulling

Now let's commit these changes. Notice that I'm adding the `.arewehuman` directory and checking it into the repository. That's very important. Let's push that to the bare repository, then go to my other copy of the repository and pull the changes. There I can click on the recording and view the playback of my collaborator.

In this copy I don't have to press record, because the extension automatically detects that this document is one we are tracking. Let's add "line three a" and "line three b," and save. Notice that there is now a new `.awh.jsonl` file, which treats the content that came in as other, or external, content, and the new content as what I've composed.

### One recording per workspace

The reason we structure it this way is that resolving merges in the document itself between two collaborators is perhaps straightforward. Merging the arewehuman files is a much more complicated situation, and you can run into all kinds of edge cases. So the approach here is to keep a separate arewehuman file for each workspace, that is, for each copy of the repository. This ID, `jeremy-magland-f288`, is assigned to this copy, and it's stored in the `.git` directory.

Let me commit these changes, push them, go back to my first copy of the repository, and pull. Now I have both files. From the perspective of this repository, I can see my own contributions, and the external contributions come in as... Let's see. They're not actually in this file yet. But if I save (I just pressed Ctrl+S to trigger an update) and go back to this provenance file, you can see that the external content comes in at the end, and it's treated as other.

### Combining the recordings

Between these two files, I have all the information I need to reconstruct the playback of the entire document. That's a problem that hasn't been solved yet, but I believe the right thing to do is to maintain a separate arewehuman file for each clone of the repository, and then, in another step, figure out how to play back the whole thing by combining the different contributions. That step is going to be much more complicated in terms of the method and the algorithm.
