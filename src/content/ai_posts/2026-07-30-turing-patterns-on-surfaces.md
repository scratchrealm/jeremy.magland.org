---
title: Turing patterns on a sphere, then on sphere-like surfaces
date: 2026-07-30
summary: Reaction-diffusion systems solved live in the browser, first on the sphere and then on curved closed surfaces, with the solver written in MATLAB syntax and executed by numbl on a WebGPU backend.
authors:
  - Jeremy Magland
featured: true
---

[turing-sphere](https://concept-collection.github.io/turing-sphere/) and [turing-surface](https://concept-collection.github.io/turing-surface/) solve reaction-diffusion systems (Turing patterns) live in the browser. Spots and stripes form in real time on a 3D shape you can orbit, parameters are adjustable while the simulation runs, and you can download a movie of the run, encoded to MP4 in the browser. This is joint work with Dan Fortunato and Owen Melia.

<video controls muted playsinline preload="metadata" style="width: 100%;" src="/media/turing-surface-schnakenberg-peanut.mp4"></video>

*Schnakenberg reaction-diffusion forming spots on the peanut geometry, exported from the app (10x speed).*

We built turing-sphere first. The solver is written in MATLAB syntax and executed by [numbl](https://numbl.org) with a WebGPU backend: each model is a small `.m` file, each element-wise line compiles to a GPU kernel, and you can edit the code on the page. The method is spectral. On the sphere the Laplace-Beltrami operator is diagonal in spherical-harmonic space, so the stiff diffusion term is handled implicitly with a single divide, while the reaction is evaluated on the grid. The transforms between the two spaces are nearly all of the compute, and for those we made [shtns-webgpu](https://github.com/concept-collection/shtns-webgpu), a translation of the [SHTNS](https://nschaeff.bitbucket.io/shtns/) spherical harmonic transforms to WebGPU compute shaders.

Then we moved to more general surfaces, which need to be closed and homeomorphic to the sphere. In turing-surface a geometry is an embedding of the sphere, three scalar fields x, y, z carried as spherical-harmonic coefficients, and you write one down as a short MATLAB function. Five ship (sphere, ellipsoid, a peanut, and seeded random blobs among them), all editable in the page, with a morph slider that blends the surface back to the round sphere. The catch is that on a general surface the Laplace-Beltrami operator is no longer diagonal, so the implicit divide has to become a solve. The models split the operator into the round-sphere part plus a correction and iterate from the round-sphere answer, which keeps the cost to a handful of transforms per step rather than a full elliptic solve, and reproduces turing-sphere exactly when the surface is the sphere.

turing-surface grew a number of features beyond that: transforms batched into shared dispatches, a benchmark button whose exact run reproduces from a printed command line on desktop WebGPU, and an export of the run on screen as one self-contained MATLAB function file, double-precision ports of the transforms included, that runs on base MATLAB with no toolboxes.

A third project, [turing-surface-cache](https://github.com/concept-collection/turing-surface-cache), narrows the settings to a discrete menu and shares computed solutions between all visitors through a cloud cache.

Source: [concept-collection/turing-sphere](https://github.com/concept-collection/turing-sphere) · [concept-collection/turing-surface](https://github.com/concept-collection/turing-surface) · transforms: [concept-collection/shtns-webgpu](https://github.com/concept-collection/shtns-webgpu)
