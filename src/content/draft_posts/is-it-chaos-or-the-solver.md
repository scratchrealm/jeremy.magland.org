---
scripts:
  - https://media.magland.org/jeremy.magland.org/libs/toy-instruments-79f0eea7e127.js
---
# Is it chaos or the solver?

Below are simulations of 5 masses connected by springs with increasing amplitudes of the pluck. The first pluck is gentle and is very close to the linear theory with only a few low frequency modes shown in the spectrogram.

<toy-instrument-sim settings="#/bead-string?n=5&tension=5.001&excBead=2&pluckAmp=0.0001&cfl=0.1" fmax="6000"></toy-instrument-sim>

The second pluck is moderate, and we get some non-linear effects with new high frequencies and detuning.

<toy-instrument-sim settings="#/bead-string?n=5&tension=5.001&excBead=2&pluckAmp=0.001&cfl=0.1"></toy-instrument-sim>

The third pluck is higher amplitude, and the non-linear effects are more dramatic. Looking at the spectrogram, I would argue that the dynamics includes chaos.

<toy-instrument-sim exaggeration="1" settings="#/bead-string?n=5&tension=5.001&excBead=2&pluckAmp=0.01&cfl=0.1"></toy-instrument-sim>


But it's hard to differentiate between chaos and a failure of the solver (e.g., the timestep is too large). To see evidence of chaos, let's run the same simulation but with a pluck amplitude of 10.0001 mm instead of 10 mm. Comparing these spectrograms, you can see some significant differences suggesting that negligible changes in the input have dramatic effects on the output.

<toy-instrument-sim exaggeration="1" settings="#/bead-string?n=5&tension=5.001&excBead=2&pluckAmp=0.0100001&cfl=0.1"></toy-instrument-sim>

But again, what if this is just a failure of the solver? For example, perhaps we did not choose a small enough timestep. To convince yourself that this is indeed chaos open the above simulation using the "Open the full app" and then modify the "step safety" parameter, which controls the timestep. As we decrease the timestep by factors of 2, the spectrogram never settles to a converged value. Instead, each spectrogram exhibits the same chaotic character. Of course, any time you change any of the parameters, including those that just affect the numerics of the simulation, you will observe changes to the spectrogram. This is the nature of the chaos.

**Conclusion:** It's chaos.