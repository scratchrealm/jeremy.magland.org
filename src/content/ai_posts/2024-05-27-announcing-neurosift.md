---
title: Announcing Neurosift
date: 2024-05-27
summary: Neurosift is a browser-based tool for exploring NWB files and the DANDI Archive, now published in the Journal of Open Source Software.
authors:
  - Jeremy Magland
featured: true
thumbnails:
  - https://neurosift.app/
---

I'm happy to announce the release of [Neurosift](https://neurosift.app/), a browser-based tool for exploring [Neurodata Without Borders](https://www.nwb.org/) (NWB) files and the [DANDI Archive](https://dandiarchive.org/). The accompanying paper is now published in the [Journal of Open Source Software](https://joss.theoj.org/papers/10.21105/joss.06590).

NWB is a standard format for neurophysiology data, but its files are hierarchical and often very large, making them awkward to inspect. Neurosift opens any NWB file, whether local, remote, or in DANDI, and lets you explore its contents in the browser with no installation. While browsing DANDI, you can open a file with a click and drill into its timeseries, images, spike times, and more.

It provides plugin visualizations for many neurodata types, from `ElectricalSeries` and `Units` to `Fluorescence` and `RoiResponseSeries`. You can compose several views in one interface and keep them synchronized, so zooming and panning stay aligned on a shared time axis, then share the layout as a URL.

Under the hood, Neurosift is a static React/TypeScript site with no server-side processing, so it can be hosted anywhere. The main challenge was lazy-loading data from remote NWB files built on HDF5, whose reference implementation is in C. Neurosift solves this with WebAssembly, using a modified fork of [h5wasm](https://github.com/usnistgov/h5wasm) that reads data chunks from remote files without downloading the whole file.

Neurosift is developed at the Center for Computational Mathematics, Flatiron Institute, with the [CatalystNeuro](https://catalystneuro.com/) team. Give it a try at [neurosift.app](https://neurosift.app/).
