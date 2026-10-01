---
title: "Are we human file format v2"
summary: "A motivation and description for the arewehuman file format (v2) for tracking the provenance of a document to provide evidence of human authorship."
featured: false
---

<video controls playsinline preload="metadata" poster="https://media.magland.org/videos/are-we-human-file-format-v1-492238037ab8.jpg" style="width: 100%;" src="https://media.magland.org/videos/are-we-human-file-format-v1-809a7be3f5fb.mp4"></video>

This is a follow-up to [Are we human?](/posts/2026-09-29-are-we-human/), which introduced the arewehuman app.

Source: [magland/arewehuman](https://github.com/magland/arewehuman) · File format: [SPEC.md](https://github.com/magland/arewehuman/blob/main/SPEC.md)

## Transcript

### Introduction

I'm excited to share with you the beginnings of an experimental file format called arewehuman. The purpose of this format is to record the history of the composition of a document, like a Markdown document, some code, or a LaTeX file, so that it can be replayed at a later time. The history of the composition can be replayed in order to provide evidence that the document was written by a human and not by AI.

The system and the file format were inspired by a [blog post](https://blog.danromik.com/on-provably-writing-without-ai) about another system called ReelDocs. I should also say that the technical aspects of the file format, and the code to record it and everything, were a collaborative effort between myself and Claude Code.

### A basic example in VS Code

Let's get into it, so you get an idea of how this works. Suppose I create a new Markdown document called `example.md`. First I click the arewehuman record button, and then I start typing: "This is an example document," a few lines ("line one," "line two," "line one a"), and then "some example text," which I delete.

Now let's click on the sidecar file that was automatically created by the arewehuman system, `example.md.awh.jsonl`. You can see that it's replaying, sped up, the composition of the document. Notice, importantly, that this line here shows that it was created, but its content is redacted. That's important because that line was not included in the final document, so we don't want to show its content in the replay.

### The file format

Now let's look at the actual text of this file, by opening it with the built-in text editor. The first line just gives the format and the version of the format. It also includes a timestamp for when the recording started. That's important because the timestamp of every keystroke after that is relative to that start time.

This next line is an insert event. It took place about 3.2 seconds after the recording started, and this is the cursor position, zero. Notice that the actual value, or content, of the character is not included here. That's important because at this point we don't know whether that value will end up being redacted. This is an append-only system, for efficiency.

So you might wonder: during replay, we'll see all these insertion events, but how are we going to play them back if we don't have the values of the characters? The trick here, the clever thing, is that at the end of the file we have a snapshot of the contents of the file, the end state. Each of these insertion events is like a placeholder character. We don't know its value, but we have a placeholder for it. Then there are some deletion events here, and what a deletion event does is delete placeholder characters. So we have all of that without knowing the values, and then at the end we can fill in the values of all the placeholder characters and work backwards to know what each character was at the time it was inserted.

### Pasted text

Now let's go back to the document and see what happens if I grab some text. This is not AI generated, but let's pretend that it was, and paste it in. The system allows you to paste in external text, but it marks it: you can clearly see that this is highlighted as a paste. Then suppose that I edit some of it and add some content here. The system keeps track of what has been written by me and what has been pasted in. If we replay this, you can see the text come in as a paste, and then the additional typing.

If I go back to the text of the recording, I believe this is the paste event. `p` is for paste, and then there is the timestamp, the cursor position, and how many unknown characters were pasted. Of course, in the end we have the content that was pasted in, at least the part that wasn't deleted, and so the paste event can be filled in later.

### Content that existed before recording

Now let's consider another situation. Suppose I have a text file, `example2.md`, that already had some content before we started recording. Let me open this file in a different text editor: this content ("test test two") already existed in the file, and we weren't recording it. Now, back in VS Code, I click to record with arewehuman and start editing. These edits are made after recording started. Let's say I delete that, and save. If I replay, you can see that the earlier text is highlighted, showing that it came from a different source, and of course this part is redacted because it was ultimately deleted.

Let's look at how the file format represents that. The first event is an insertion of 58 characters, marked with `x`, which means that it was already in the file (imported) rather than typed. And these numbers are the positions of line breaks. Even if all of that content is deleted in the end, we save the line breaks so that we can represent the structure of the document. Then there are insertions and deletions, and in the end some of this content survived, so the identity of this block at the beginning can be inferred by working backwards from the end content.

### Edits made outside the editor

Now a third situation. Suppose I have another Markdown file, `example3.md`, and I start recording from the beginning: "line one, line two, line three." Now suppose I edit the file outside of VS Code: I open it in a text editor, add another line, "line four," and save. VS Code, as usual, picks up the external edit, and our system marks it as unknown. If I add other content here, and more content afterwards, and then replay, it should show the external edit as something that was added from outside. Yep, that's external, and then we continue.

How is that represented in the file? Let's see if I can trace it down. Here, the system detected that the state in the sidecar file was different from the state on disk, and it didn't know what to do besides say that there was an insertion of other content at this position.

Now I'm going to try something that I thought the system might not be able to handle yet. Let me close the file and open it again in the text editor, so I get the fresh content, and add "line two a," and then "line two b," and replay. Let's move towards the end: line two a and line two b. Look at that. Somehow the system was able to determine that the difference between the recording and the file was an insertion of text. I'll have to go back to the code and see how it does this, but I think it's computing some kind of smart delta, detecting where there was an insertion. That's important, because if it didn't detect that the other text was already in place, everything after that insertion point might be considered external, which we don't want. So the system needs some kind of sophisticated delta mechanism, similar to Git, so that external edits don't destroy the tracking of the human edits that already existed.

### Collaborating with git

Now I want to talk a little bit about collaboration. Let's say I'm collaborating on a project, like writing a paper, and I make edits to my file, and I've got my arewehuman sidecar file. I believe the thing to do is to commit and push these sidecar files into the repo. This works okay if I edit, then my collaborator edits and pushes, and I pull, so that we edit sequentially, because then we're always extending the same arewehuman file.

The problem comes if we both make edits and then need to merge. For merging the Markdown there are a lot of established processes, and automatic merging works. The problem is how to merge these JSON files, because that gets complicated. I'm not sure exactly how to solve that, but here is one idea.

First, instead of littering the space with sidecar files next to the documents, we could have a top-level `.arewehuman` directory that contains all of these files. Then we could have a different provenance file for each workspace that has the document open: each workspace would have an ID, and each of these files would hold the history of everything that happened in that particular workspace. If external edits come in through a merge, the workspace's file would just identify them as other content, as the system does now; it doesn't know how to replay them. However, the other workspace's file would have come into the same directory. So there needs to be some kind of smart replay that takes all of those files from the different workspaces into consideration and pieces them together. I think that's where the interesting development needs to happen. Maybe there should be a whole different system for this, but that is the challenge.

In the end, you could publish your paper, provide the repo, and people could see the full commit history. In addition, you would have these arewehuman files that allow replaying the process of writing the paper, providing evidence that it was human authored, with deleted content redacted. Thanks.
