---
title: Turing patterns from a shared cache
date: 2026-08-10
summary: A version of turing-surface where every setting is a choice from a short list, so each combination names one solution, computed once and shared with all visitors through a serverless cloud cache.
authors:
  - Jeremy Magland
thumbnails:
  - https://concept-collection.github.io/turing-surface-cache/
  - https://concept-collection.github.io/turing-surface-cache/sweep.html
---

The [previous post](/posts/2026-07-30-turing-patterns-on-surfaces/)'s [turing-surface](https://concept-collection.github.io/turing-surface/) computes every pattern live: each visitor waits through their own run, minutes for a long one, and the result is discarded when the tab closes. [turing-surface-cache](https://concept-collection.github.io/turing-surface-cache/) is built on the observation that if every setting is a choice from a short list, then each combination of choices names exactly one solution, and the first person to compute it can compute it for everyone.

That observation is enough to make a cache with no server. The settings are hashed and the hash is the file name in cloud storage; a GET either returns the solution (an HDF5 file of about 100 KB, readable from Python) or a 404 saying nobody has been there yet. As you browse the choices, cached solutions appear in about a second. An uncached combination you compute yourself, in the browser on WebGPU, and an upload key lets you contribute the result back.

Somebody still has to be first, and there are about 8,200 combinations, three GPU-weeks of computing. So an idle machine can run auto-fill: it computes the combinations closest to the defaults first, in random order, skipping whatever is already cached. The random order means many machines can fill the cache at once without coordinating.

The payoff is the [sweep page](https://concept-collection.github.io/turing-surface-cache/sweep.html): fix everything but one parameter, drag a knob through its values, each one a solution somebody already computed, and watch the pattern change.

Source: [concept-collection/turing-surface-cache](https://github.com/concept-collection/turing-surface-cache) · [live demo](https://concept-collection.github.io/turing-surface-cache/)
