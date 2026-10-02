# Figpack for the Curious

[Figpack](https://figpack.org) is a Python (or MATLAB) package that let's you create interactive, data-rich scientific figures and optionally share them over the internet. This post is for those who are curious about how Figpack works - the design decisions, rationale, etc.

## What's the core idea?

Sharing static figures (PNGs, etc) is easy, but not as powerful as interactive visualizations (feature-rich GUIs), especially for complex datasets. Various libraries let you create and share interactive web applications, but you usually need to host them with some backend services. The libraries that can export lightweight interactive figures (Plotly, Bokeh), are limited in the size and complexity of the datasets and views that they support.

In Figpack, an interactive visualization (figure) is simply a collection of HTML/JavaScript/CSS files plus data. All in one directory. It's a stand-alone full-fledged website that doesn't depend on any backend services. You just upload it somewhere public and share the link. Assuming web browsers stay backward compatible, your archived figure will be available 10, 20 years from now. With this flexible definition of what a figure is, sharing the figure can be as simple as setting `upload=True` (with an upload key).

## Okay, give me an example

It's local first, so you can get started by running something like this:

```python
import numpy as np
import figpack.views as vv

# Create a timeseries graph
graph = vv.TimeseriesGraph(y_label="Signal")

# Add a decaying oscillation and its envelope
t = np.linspace(0, 10, 2000)
envelope = np.exp(-t / 3)
y = envelope * np.sin(2 * np.pi * 2 * t)
graph.add_line_series(name="signal", t=t, y=y, color="steelblue", width=2)
graph.add_line_series(name="upper", t=t, y=envelope, color="darkorange", dash=[6, 4])
graph.add_line_series(name="lower", t=t, y=-envelope, color="darkorange", dash=[6, 4])

# Display the visualization locally
graph.show(open_in_browser=True, title="My First Figure")
```

That will show the new figure in a web browser. Everything stays on your machine. You can try it now -- just `pip install figpack` and run that in IPython or wherever.

To share on the web, add `upload=True` to the show command:

```python
graph.show(open_in_browser=True, upload=True, title="My First Figure - Shared")
```

Then copy the URL and send it to your colleagues over email/slack. They'll be able to see exactly what you see locally.

(Note: You'll need to set an environment variable with an API key. Reach out if you want one. You can also host your own cloud bucket, etc.)

I ran it myself and [got the URL](https://figures.figpack.org/figures/default/f37b50f8ad019a80e709f30d/index.html) `https://figures.figpack.org/figures/default/f37b50f8ad019a80e709f30d/index.html`

<iframe src="https://figures.figpack.org/figures/default/f37b50f8ad019a80e709f30d/index.html" height=500 width="100%"></iframe>

To explore all the different Figpack widgets and views that are available, see the [Figpack documentation](https://flatironinstitute.github.io/figpack/).



## What types of data can be visualized?

The target application is neuroscience, especially neurophysiology data where you want to have complex layouts with time-synchronized panels. But there's nothing about Figpack that is specific to that domain. If you can imagine it, figpack can probably support it.

## Where do local figures live?

When you create a local figure (the default), the system produces a stand-alone directory of HTML/JavaScript that lives in a temporary directory on your machine, and a temporary local process serves that site in your web browser.

## Who stores the cloud data? Where do shared figures live?

It's relatively inexpensive to host static data on Cloudflare (AWS S3 is also supported by Figpack, but is more expensive and you pay for network egress). I host a default bucket and give out API keys (figpack api keys, not bucket credentials) to folks who are doing open science and want to try out the system for a reasonable limited use. For labs and individuals that want to use Figpack more heavily for sharing data, there's a way to host your own bucket for use with the system.

## Are figures going to persist forever on the Figpack network?

No, unless you provide your own bucket and don't tear it down. Figpack has a multi-tier system that determines how long figures will remain available.

(1) By default, figures expire after 24 hours. This lets people upload a lot of data without worrying about cluttering the bucket long term. The figures expire (become unavailable), but can be renewed until they are actually deleted by an admin (which I don't do very often).

(2) You can renew/extend the lifetime of a figure that you want to be around for an additional week or so.

(3) You can "pin" a figure. That keeps it alive long term until you unpin it. Of course, if it's not your bucket, there's no guarantee that it will be around forever.

(4) Since figpack figures are just directories of files (a static website), you can archive them on a long-term storage site such as Zenodo. Or you can put them on GitHub pages, or your own website. There's a lot of flexibility.

## What's the format for figure data?

A Figpack figure consists of the rendering code (HTML/JavaScript) and the data (raw numbers). There's no strict/enforced format for the data (each view type is free to establish its own conventions), but there is a preferred layout that all of the core views use. It's a consolidated Zarr v2 format, where data are compressed, stored in Zarr chunks, metadata is consolidated, and data chunks are also consolidated to limit the number of files for large datasets (the particular chunk consolidation approach is very efficient and unique to Figpack).

## How about MATLAB users?

There IS a [native MATLAB version of Figpack](https://github.com/magland/figpack_experimental_matlab), but it's experimental. Let me know if you are using it... we can build it out more.

## Can I create custom view types?

Yes, absolutely! That's the whole point. And please share them with the community.

Figpack ships with a large collection of core views (see the documentation) as well as some domain-specific extension packages. But it's meant to be extensible.

Do you use an AI coding agent? If so, just point Claude (or whichever) to the figpack source repository and ask it to review the documentation. The Figpack docs are very thorough when it comes to adding custom view types.

If you don't use AI for coding, same thing. Review the documentation manually. And reach out if anything is unclear.

## Can Figpack be used with very large datasets?

Yes. Most figures are less than 10-20 MB, but up to a gigabyte is not unreseasonable (in principle the system has no hard limit). The Figpack/Zarr integration allows figures to efficiently lazy-load chunks of data and doesn't need to download the entire dataset to the browser at once. See the documentation for examples.

## Should I try out Figpack?

Yes, you should.