---
title: Reading remote HDF5 files in the browser
date: 2026-06-16
summary: A self-contained demonstration of how a web application can lazy load data from remote HDF5 files, a core functionality of Neurosift.
authors:
  - Jeremy Magland
featured: true
writtenByHuman: true
thumbnails:
  - https://concept-collection.github.io/remote-hdf5-lazy-read/
---

[remote-hdf5-lazy-read](https://concept-collection.github.io/remote-hdf5-lazy-read/) is a self-contained demonstration of how a web application can lazy load data from remote HDF5 files. This is a core functionality of [Neurosift](https://neurosift.app/) and I wanted to separate it out in a project where you can inspect the source code, see how it fits together, and perhaps use it in your own project.

The usual way to read HDF5 files is using [the official C++ library](https://github.com/HDFGroup/hdf5). But there were two challenges in adapting this for our application of reading from remote files from the browser. First, compiling hdf5 to webassembly, and second, working with asynchronous network calls. The hdf5 library assumes that the file is on the local disk, and is inherently as a synchronous reader. I needed to modify the emscripten-generated wasm library of [h5wasm](https://github.com/usnistgov/h5wasm) to intercept the synchronous calls to reading sections of the file with asynchronous http range requests. To make this work, the low-level reading code needs to execute in a web worker in order to not freeze the UI of the main page.

Source: [concept-collection/remote-hdf5-lazy-read](https://github.com/concept-collection/remote-hdf5-lazy-read) · [live demo](https://concept-collection.github.io/remote-hdf5-lazy-read/)
