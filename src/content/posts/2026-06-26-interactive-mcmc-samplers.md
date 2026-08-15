---
title: Interactive MCMC samplers in the browser
date: 2026-06-26
summary: Two browser demos that run an MCMC sampler written in plain MATLAB and let you watch it work.
authors:
  - Jeremy Magland
featured: true
thumbnails:
  - https://concept-collection.github.io/hitandrun-interactive/#figure/sampler
  - https://concept-collection.github.io/walnuts-interactive/#figure/sampler
---

Two small demos that run a Markov chain Monte Carlo sampler in the browser, with the algorithm written in plain, editable MATLAB syntax running via [numbl](https://numbl.org).

- [**Hit-and-run**](https://concept-collection.github.io/hitandrun-interactive/#figure/sampler) — uniform sampling of a 2D region.
- [**WALNUTS**](https://concept-collection.github.io/walnuts-interactive/#figure/sampler) — the within-orbit adaptive leapfrog No-U-Turn Sampler, using Nawaf Bou-Rabee's reference MATLAB code from the [paper](https://jmlr.org/papers/v27/25-1452.html).

Open a demo, hit **Run**, and play the movie to step through the algorithm.

Click the *Code* button to open an IDE where you can edit the MATLAB syntax and rerun the sampler.