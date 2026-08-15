---
title: "simple_ans: Asymmetric Numeral Systems compression in Python/C++"
date: 2026-03-15
summary: A small, self-contained Python/C++ implementation of the Asymmetric Numeral Systems (ANS) entropy coder, plus an interactive ANS visualizer.
authors:
  - Jeremy Magland
featured: true
writtenByHuman: true
thumbnails:
  - https://concept-collection.github.io/ans-visualizer/
---

The Asymmetric Numeral Systems (ANS) algorithm ([Duda et al, 2015](https://ieeexplore.ieee.org/abstract/document/7170048)) is perhaps the most practical way of getting near optimal compression ratios for independent and identically distributed random sequences of symbols from a known discrete probability distribution. Simplest example: a random sequence of 0's and 1's with probability p of getting a 1. Shannon's entropy formula gives us the expected compression ratio for such a sequence, but realizing that compression ratio efficiently in a computer program is not such an easy task. ANS does the trick and is incorporated into several general purpose compression algorithms, but I wasn't able to track down a simple, self-contained implementation that was reasonably performant.

So I made [simple_ans](https://github.com/flatironinstitute/simple_ans), a straightforward Python package that uses a small, yet efficient, kernel of C++ code (few hundred lines of code).

If you want it even simpler, there's also a pure Python implementation in the repo (much slower though).

You may also be interested in this fun [ANS visualizer](https://concept-collection.github.io/ans-visualizer/).
