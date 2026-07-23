---
title: Running MATLAB syntax in Jupyter, client-side in the browser
date: 2026-07-23
summary: A proof-of-concept JupyterLite kernel that runs numblin Jupyter notebooks entirely in the browser.
authors:
  - Jeremy Magland
thumbnails:
  - https://concept-collection.github.io/jupyterlite-numbl-kernel/
---

[jupyterlite-numbl-kernel](https://github.com/concept-collection/jupyterlite-numbl-kernel) is a [JupyterLite](https://jupyterlite.readthedocs.io/) kernel for [numbl](https://numbl.org). It demonstrates running MATLAB syntax in Jupyter, client-side in the browser (no MATLAB or Octave needed). The [live demo](https://concept-collection.github.io/jupyterlite-numbl-kernel/) is a static site hosted on GitHub Pages... nothing to install.

Numbl is a lightweight (TypeScript + wasm + optional native bridge to OpenBLAS) numerical computing environment that tries to be as compatible as possible with MATLAB syntax. It has 500+ built-in functions and runs both in the browser and on the command line. I am developing it with Dan Fortunato at the Flatiron Institute.

Why do this? There are many codebases that are written exclusively in MATLAB, require a MATLAB license, and cannot be run client-side in the browser. One such example is [chebfun](https://www.chebfun.org/), whose heavy use of MATLAB's object-oriented features means it does not run on Octave. Right now, numbl is mature enough to run most of chebfun's functionality. The capabilities will expand over time as we implement more builtins.

I make a lot of static web applications (many of them proofs of concept) and I love trying to get code to run client-side in the browser. I think it's great for teaching, sharing ideas and methods, and communicating science with interactive views.

Honest caveat: numbl is not MATLAB. It covers a large, tested subset of the language and toolboxes.

Join the effort: [github.com/flatironinstitute/numbl](https://github.com/flatironinstitute/numbl)

Source: [concept-collection/jupyterlite-numbl-kernel](https://github.com/concept-collection/jupyterlite-numbl-kernel) · [live demo](https://concept-collection.github.io/jupyterlite-numbl-kernel/)
