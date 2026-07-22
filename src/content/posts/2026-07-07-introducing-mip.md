---
title: Introducing mip
date: 2026-07-07
summary: We are excited to announce the release of version 1.0.0 of mip.
authors:
  - Jeremy Magland
  - Dan Fortunato
originalUrl: https://mip.sh/blog/introducing-mip
writtenByHuman: true
---

After months of planning and development, we are excited to announce the release of version 1.0.0 of [mip](https://mip.sh), a package manager for MATLAB.

Back in November 2025, we had a conversation where we thought: "wouldn't it be nice if we had something like pip or Homebrew for MATLAB?" Initially we imagined building such a tool would be straightforward, but after diving in we discovered that the MATLAB way of doing things presents a unique set of challenges. Through many iterations we realized we needed to mix and match various conventions from the different existing package managers—`load` from Lmod (similar to import in pip), `pin` from Homebrew, using Github runners to automate package building like Homebrew, channels from conda (similar to taps in Homebrew), editable development installs from pip, and so forth.

For us, mip's killer features are distributing portable pre-built MEX binaries for Linux, Mac, and Windows (users no longer need a MEX compiler) and managing MATLAB's global path automatically (no more manually adding paths or running startup scripts). But there are many other advantages compared with the usual way of working in MATLAB.

Feel free to explore the docs, try it out, and request packages. We'd love to get your feedback!

\- Dan and Jeremy (Center for Computational Mathematics, Flatiron Institute)
