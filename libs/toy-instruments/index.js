// <toy-instrument-sim settings="…">: one simulation from toy-instruments
// (https://vault1.magland.org/proof-of-concept/toy-instruments): the 3D model and
// its replay, and the sound, loaded from the shared result cache or run in the
// browser when the cache has none. See the Embedding section of its README.
//
// The cache key hashes what this bundle's model code builds, so a post keeps
// asking for (and can always refill) the same result however the app changes.

import 'toy-instruments/embed'
