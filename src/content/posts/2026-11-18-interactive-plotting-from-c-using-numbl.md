---
title: "Interactive plotting from C using numbl"
---

I recently received the following (paraphrased) email from a colleague.

> I've always wanted a runtime live plotting library that you link against from C/C++/Fortran. You include "plot" commands that update a window from a separate thread that plots the live contents of an array in the code and allows interactive control *while* the simulation is running. It should affect the simulation minimally. Of course, Julia/Python/MAT solve that problem somewhat, but they don't really let you interact with the plot until the simulation stops. 

After some thinking I realized that we could piggy-back on the [numbl](https://numbl.org) project (a MATLAB clone that can run in the browser or from the command line) since numbl already implements a large part of the MATLAB plotting capabilities by streaming plotting commands. Rather than supporting a bunch of new plot commands in the C interface, the user could send arbitrary MATLAB plotting code as plain text to the numbl engine, running in an external process.

Here's the syntax I settled on (inspired by MATLAB's C++ API).

```C
#define NUMBL_PLOT_IMPLEMENTATION
#include "numbl_plot.h"

int main(void) {
  numbl_engine *e = numbl_open();
  numbl_eval_sync(e, "colormap jet");
  for (int step = 0; step < nsteps; step++) {
    advance(u);
    if (step % 50 == 0) {
      numbl_put_matrix(e, "u", u, ny, nx);
      numbl_put_scalar(e, "t", step * dt);
      numbl_eval(e, "imagesc(u); colorbar; title(sprintf('t = %g', t))");
    }
  }
  numbl_close(e);
}
```

This just requires that numbl is installed (`npm install -g numbl`) and only depends on a single small header file `numbl_plot.h` that can be conveniently generated using numbl:

```bash
numbl c-header > numbl_plot.h
```

When you run the code, a new browser tab opens and the interactive plot appears. While the simulation runs, the plot can be zoomed, panned, scaled, etc. Data transfer to numbl and the browser happens in a background thread in the C program so it only minimally slows down the main execution.


For detailed instructions, see [this documentation and demo](https://numbl.org/docs/live-plots-from-c/).

Here's a more involved example:

```C
/*
 * 2-D heat equation with a moving heat source, plotted live with numbl.
 *
 *   ./heat2d [nsteps] [plot_every] [nx] [ny]
 *
 * Explicit finite differences on an ny x nx grid, zero boundary values.
 * The field is stored column-major (u[i + j * ny]), so it goes to numbl
 * as-is.
 */
/* numbl_plot.h is a single-header library: in one file of the program,
 * define NUMBL_PLOT_IMPLEMENTATION and include it before other headers. */
#define NUMBL_PLOT_IMPLEMENTATION
#include "numbl_plot.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static double now(void) {
  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);
  return (double)ts.tv_sec + 1e-9 * (double)ts.tv_nsec;
}

int main(int argc, char **argv) {
  const int nsteps = argc > 1 ? atoi(argv[1]) : 20000;
  const int plot_every = argc > 2 ? atoi(argv[2]) : 50;
  const int nx = argc > 3 ? atoi(argv[3]) : 200;
  const int ny = argc > 4 ? atoi(argv[4]) : 150;
  const double dt = 0.2; /* stable for dt <= 0.25 with unit spacing */

  double *u = (double *)calloc((size_t)nx * (size_t)ny, sizeof *u);
  double *un = (double *)calloc((size_t)nx * (size_t)ny, sizeof *un);
  if (!u || !un) return 1;

  numbl_engine *e = numbl_open();
  if (!e) return 1;
  /* Setup: clear figures left by an earlier run on the same server. */
  numbl_eval_sync(e, "close all");

  int frames = 0;
  double t_plot = 0, t0 = now();
  for (int step = 0; step <= nsteps; step++) {
    const double t = step * dt;
    const double cx = nx / 2.0 + 0.3 * nx * cos(t / 200);
    const double cy = ny / 2.0 + 0.3 * ny * sin(t / 200);
    for (int j = 1; j < nx - 1; j++) {
      for (int i = 1; i < ny - 1; i++) {
        const int k = i + j * ny;
        const double lap = u[k - 1] + u[k + 1] + u[k - ny] + u[k + ny] - 4 * u[k];
        const double r2 = (i - cy) * (i - cy) + (j - cx) * (j - cx);
        un[k] = u[k] + dt * (lap + 0.05 * exp(-r2 / 20));
      }
    }
    double *tmp = u;
    u = un;
    un = tmp;

    if (step % plot_every == 0) {
      const double tp = now();
      numbl_put_matrix(e, "u", u, (size_t)ny, (size_t)nx);
      numbl_put_scalar(e, "t", t);
      numbl_eval(e,
                 "subplot(1, 2, 1); imagesc(u); axis image; colorbar;"
                 "title(sprintf('t = %.0f', t));"
                 "subplot(1, 2, 2); plot(u(round(end/2), :));"
                 "title('middle row'); xlabel('x'); ylabel('u');");
      t_plot += now() - tp;
      frames++;
    }
  }
  const double total = now() - t0;
  numbl_eval_sync(e, "drawnow"); /* wait for the queued frames */
  size_t sent = 0, replaced = 0;
  numbl_get_stats(e, &sent, &replaced);
  printf("%d steps on %dx%d in %.2f s; %.3f s (%.1f%%) in numbl calls\n",
         nsteps, ny, nx, total, t_plot, 100 * t_plot / total);
  printf("%d frames: %zu sent, %zu replaced by newer ones\n", frames,
         sent - 2, replaced); /* minus the two sync frames */
  fflush(stdout);

  free(u);
  free(un);
  numbl_close(e);
  return 0;
}
```