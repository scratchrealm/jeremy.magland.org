---
title: Qhull in the browser
date: 2026-06-18
summary: How numbl computes delaunay, convhull, and friends by compiling Qhull to WebAssembly, with a standalone demo and browser-vs-desktop benchmarks.
authors:
  - Jeremy Magland
thumbnails:
  - https://concept-collection.github.io/qhull-wasm-demo/
---

[numbl](https://numbl.org) aims to be MATLAB-compatible, including geometry functions like `delaunay`, `delaunayn`, `convhull`, and `convhulln`. MATLAB and Octave compute those with [Qhull](http://www.qhull.org), the standard library for convex hulls and Delaunay triangulations. So I compiled Qhull to WebAssembly as [qhull-wasm](https://github.com/magland/qhull-wasm), which numbl loads as the backend for those builtins on both the command line and in the browser. It uses the same engine as MATLAB and Octave, so its results match.

[qhull-wasm-demo](https://concept-collection.github.io/qhull-wasm-demo/) is a standalone showcase for that library, with three parts: a **2D triangulation** view (click to add points, switch distributions, toggle circumcircles), a **3D convex hull** view rendered with three.js that exports to a Gmsh mesh, and a **benchmark**.

The benchmark is the part I find most interesting. It times Delaunay triangulation in the browser alongside a `.m` script that runs the same computation in MATLAB, Octave, and numbl, all of which triangulate via Qhull. Since it is the same code everywhere, it makes for an apples-to-apples comparison of the browser against the desktop, and the script is included so you can run it yourself.

Source: [concept-collection/qhull-wasm-demo](https://github.com/concept-collection/qhull-wasm-demo).
