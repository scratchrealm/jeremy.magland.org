---
title: MRI in the browser
date: 2026-07-24
summary: Three apps that cover the MRI workflow client-side, writing pulseq pulse sequences in MATLAB syntax (seqlab), simulating them on a digital phantom to get raw k-space (mri-scanner), and the spin physics underneath (mri-spins).
authors:
  - Jeremy Magland
featured: true
thumbnails:
  - https://concept-collection.github.io/seqlab/
  - https://concept-collection.github.io/mri-scanner/
  - https://concept-collection.github.io/mri-spins/
---

An MRI scanner runs a pulse sequence: a precisely timed program of radiofrequency pulses, gradient waveforms, and data acquisition windows. [Pulseq](https://pulseq.github.io/) is an open framework for defining these sequences, with a MATLAB toolbox that writes `.seq` files real scanners can execute. I spent years working on MRI at Penn before coming to Flatiron, so I wanted to see how much of this workflow could run in the browser. Three small apps came out of it.

[seqlab](https://concept-collection.github.io/seqlab/) is where you write the sequence. The unmodified pulseq `+mr` toolbox executes on [numbl](https://numbl.org) in a web worker, and the `.seq` files it produces are byte-identical to desktop MATLAB's, down to the md5 signature. The result opens in an interactive timeline, RF magnitude and phase, the three gradient axes, and ADC, with synchronized zoom to microsecond detail; drop in any existing `.seq` file and it works as a plain viewer too. FID, gradient echo, and EPI examples are included.

[mri-scanner](https://concept-collection.github.io/mri-scanner/) is the virtual scanner. Upload a `.seq` file, pick a digital phantom (the [KomaMRI](https://github.com/JuliaHealth/KomaMRI.jl) phantom format), and a Bloch simulation runs in a web worker to produce the raw k-space, the acquired signal laid out one row per readout. It deliberately stops at raw data; reconstruction is the natural next project.

[mri-spins](https://concept-collection.github.io/mri-spins/) is the physics underneath: a 3D sample of spins evolving under the Bloch equations. Apply a 90° pulse and watch the signal decay with T2, dephase the spins with a gradient and refocus them into a spin echo with a 180° pulse, or run the built-in spoiled gradient echo sequence, with gradient sounds that click like a real scanner.

Source: [seqlab](https://github.com/concept-collection/seqlab) · [mri-scanner](https://github.com/concept-collection/mri-scanner) · [mri-spins](https://github.com/concept-collection/mri-spins)
