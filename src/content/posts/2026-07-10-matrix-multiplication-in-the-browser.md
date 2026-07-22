---
title: Benchmarking matrix multiplication in the browser
date: 2026-07-10
summary: Benchmarking strategies for large matrix-matrix multiplication in the browser — plain JavaScript, WebGPU, C compiled to WebAssembly, and libFLAME compiled to WebAssembly — against a native reference.
authors:
  - Jeremy Magland
writtenByHuman: true
---

While the desktop version of [numbl](https://numbl.org) links to OpenBLAS for linear algebra, the browser version cannot directly use native libraries, but must rely on technologies available in modern browsers, such as JavaScript and WebAssembly. While modern JavaScript is much faster than it used to be, it is orders of magnitude slower than OpenBLAS for operations such as large matrix-matrix multiplications.

With the help of Claude Code, I made [matmul-bench](https://concept-collection.github.io/matmul-bench/) to benchmark various methods of matrix-matrix multiplication in the browser. The strategies include plain JavaScript, WebGPU, a compilation of naive C to Wasm, a compilation of more sophisticated (blocked+SIMD) C to Wasm, with and without multi-thread support, and compilation of [libFLAME](https://github.com/flame/libflame) to Wasm, with and without multiple threads.

On my (Linux) machine, the WebGPU came out the winner. But a very important caveat is that WebGPU is only capable of single precision arithmetic, whereas numbl is right now exclusively double precision. Of the double precision (non-GPU) options, the clear winner was libFLAME->Wasm multi-threaded. That came in 30 times faster than the naive plain JavaScript implementation for the 1024x1024 matrix size. Neither of these matched the native (outside the browser) speed on my particular machine, but the best method (libFLAME) came within a factor of 4 of OpenBLAS, which I think is pretty good for the browser.

So as of now, numbl in the browser by default is using libFLAME->Wasm as the default method of matrix-matrix multiplication (for large matrices). If you're reading this and think you can improve this benchmark, please try it out and submit a PR. Then I'll move your solution upstream to numbl.

Source: [concept-collection/matmul-bench](https://github.com/concept-collection/matmul-bench) · [live demo](https://concept-collection.github.io/matmul-bench/)
