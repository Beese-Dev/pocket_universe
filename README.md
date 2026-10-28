# Pocket Universe

A pocket universe that runs in the browser. Plant stars, grow planets out of their protoplanetary discs, name worlds and moons, launch probes, and watch stars live, die and feed black holes on a real clock, from a day per second up to a million years per second.

Play it: the page is a single `index.html` with no build step. Open it locally or host it on any static site (it is set up for GitHub Pages).

## What is in it

- Stars of every class, with lifetimes from stellar mass; red giants, planetary nebulae, white dwarfs, supernovas, pulsars and stellar black holes
- Procedurally generated planets (rocky, ocean, gas giant, lava, ice), moons, rings, tidal locking, habitable zones
- Comets, impacts and impact winters, mass extinctions
- Black holes that bend orbits, capture stars, tear apart anything that comes too close, and feed on close companions as X-ray binaries
- Probes on real gravity-bent trajectories, with a report on arrival
- Field notes, postcards, discoveries, share codes, and an ambient generative soundtrack
- A galaxy to zoom out into, turning once every 230 million years

**Daily challenge:** everyone gets the same seeded universe each UTC day and one billion years; keep worlds alive for the highest Legacy score. A shared leaderboard runs on the small service in `leaderboard/` once deployed.

Everything is saved in your browser. Share codes let a friend visit your universe on their own copy of the page.

## Running it

Open `index.html` in a modern browser, or serve the folder with any static server. Three.js is loaded from a CDN, so the first load needs a network connection.

## Credits

Built with [three.js](https://threejs.org/). Fonts from Google Fonts (Instrument Serif, Instrument Sans, IBM Plex Mono).
