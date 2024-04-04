# Userspace AudioRenderCapacity

A (currently failing) experiment to implement AudioRenderCapacity with current Web Audio primitives.

## How to use

`node server.js` and visit the provided localhost URL.

- Hit Start when idle for a baseline measurement.
- Click Measure to determine the load once per second.
- You might hear a small crack every time a load measurement is performed.

## How it works

A buffer underrun is observable in Web Audio API because the AudioContext.currentTime starts deviating from the browser time.

We abuse this fact by spinning the audio render thread with increasing workload, until we detect a discrepancy in time. I.e. when load is 100%.

## It does not work

For some reason the load seems to correlate with overall CPU usage, but not so much dependent on other AudioContext in other windows. Defeating the purpose of this experiment.
