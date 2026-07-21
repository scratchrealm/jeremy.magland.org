---
title: Software
order: 2
description: >-
  Open-source scientific software by Jeremy Magland: Neurosift, figpack, Stan Playground, MountainSort, numbl, and more.
---

# Software

Selected open-source projects. Most of my software is developed in the open on
[GitHub](https://github.com/magland).

- **Numbl** — open-source MATLAB-compatible computing environment that runs
  `.m` files in the browser and on the command line; early stage (with Dan
  Fortunato). [numbl.org](https://numbl.org) ·
  [source](https://github.com/flatironinstitute/numbl)

- **mip** — package manager for MATLAB and numbl: dependencies, precompiled
  MEX binaries, and path management; early stage (with Dan Fortunato).
  [mip.sh](https://mip.sh) · [source](https://github.com/mip-org/mip-core)

- **Neurosift** — browser-based visualization of NWB (Neurodata Without
  Borders) files and interactive exploration of the DANDI Archive, EMBER
  Archive, and OpenNeuro (with the CatalystNeuro team).
  [neurosift.app](https://neurosift.app/) ·
  [source](https://github.com/flatironinstitute/neurosift/tree/main-v2) ·
  [paper](https://joss.theoj.org/papers/10.21105/joss.06590)

- **Figpack** — Python package for interactive scientific visualizations as
  self-contained HTML bundles: portable, reproducible, and suitable for
  long-term archiving.
  [home](https://flatironinstitute.github.io/figpack/) ·
  [source](https://github.com/flatironinstitute/figpack)

- **Stan Playground** — browser-based editor and runtime for Stan models:
  edit, compile, run, and analyze results with no local installation (with
  Brian Ward and Jeff Soules).
  [live](https://stan-playground.flatironinstitute.org/) ·
  [source](https://github.com/flatironinstitute/stan-playground)

- **DANDI AI Notebooks** — AI-powered chat assistant and automated notebook
  generator for exploring neurophysiology datasets in the DANDI Archive (with
  Ben Dichter, Ryan Ly, and Oliver Ruebel).
  [paper](https://doi.org/10.1038/s41597-025-06285-x)

- **Isosplit** — non-parametric clustering with no adjustable parameters,
  based on Hartigan's dip statistic and isotonic regression.
  [source](https://github.com/magland/isosplit6)

- **MountainSort** — spike sorting software built on isosplit clustering.
  [source](https://github.com/flatironinstitute/mountainsort5)

- **LINDI** — cloud-friendly file format and Python library for NWB data,
  compatible with HDF5 and Zarr and designed for linking to remote datasets
  (with the NWB team).
  [source](https://github.com/neurodatawithoutborders/lindi)

- **simple_ans** — simple, efficient lossless compression of integer datasets
  via Asymmetric Numeral Systems.
  [source](https://github.com/flatironinstitute/simple_ans)

- **NWB Assistant** — experimental AI chat assistant for navigating NWB
  documentation. [live](https://magland.github.io/nwb-assistant/chat) ·
  [source](https://github.com/magland/nwb-assistant)

- **Stan Assistant** — experimental AI chat assistant for Stan, with access
  to the Stan User's Guide.
  [live](https://magland.github.io/stan-assistant/chat) ·
  [source](https://github.com/magland/stan-assistant)

- **Neurosift chat** — experimental AI chat assistant for exploring the DANDI
  Archive and OpenNeuro. [live](https://chat.neurosift.app/)

- **Spurious Discovery Tests** — synthetic experiments probing whether large
  language models avoid false discoveries when analyzing datasets with no
  underlying signal.
  [source](https://github.com/magland/spurious-discovery-tests)

- **minicline** — command-line and Python interface for software engineering
  tasks with large language models.
  [source](https://github.com/magland/minicline)

- **MCMC Monitor** — real-time tracking and diagnostic visualization of Stan
  MCMC runs in the browser (with Jeff Soules).
  [source](https://github.com/flatironinstitute/mcmc-monitor)

- **nbfiddle** — web-based Jupyter notebook interface using browser storage,
  designed for self-contained analysis notebooks with remote data sources.
  [nbfiddle.app](https://nbfiddle.app/) ·
  [source](https://github.com/flatironinstitute/nbfiddle)

- **SpikeInterface** — unified Python framework for spike sorting and
  electrophysiology analysis; part of the original team.
  [docs](https://spikeinterface.readthedocs.io/en/latest/) ·
  [source](https://github.com/SpikeInterface/spikeinterface)

- **FINUFFT** — fast, parallel library for the nonuniform fast Fourier
  transform on CPU and GPU; co-developed the original version with Alex
  Barnett, no longer actively involved.
  [docs](https://finufft.readthedocs.io/) ·
  [source](https://github.com/flatironinstitute/finufft)

- **Benchcompress** — benchmarking framework for compression algorithms on
  scientific data arrays.
  [results](https://magland.github.io/benchcompress/) ·
  [source](https://github.com/magland/benchcompress)

- **Remfile** — file-like object for reading remote files over HTTP,
  optimized for h5py. [source](https://github.com/magland/remfile)

Also: the [Concept Collection](https://github.com/concept-collection), a set
of small proof-of-principle examples and interactive demos, many runnable
directly in the browser.

## Older projects

- **[Figurl](https://github.com/flatironinstitute/figurl/blob/main/doc/intro.md)** —
  shareable interactive figures; replaced by figpack
- **[Kachery](https://github.com/flatironinstitute/kachery-cloud/blob/main/README.md)** —
  content-addressed storage for sharing scientific data; replaced by figpack
- **[SortingView](https://github.com/magland/sortingview)** — interactive
  spike-sorting visualizations; replaced by figpack
- **[MountainSort 4](https://github.com/magland/mountainsort4)** — replaced
  by MountainSort 5
- **[SequenceTree](https://github.com/magland/sequencetree4)** — visual MRI
  pulse sequence programming
