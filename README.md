# Starcradle

Starcradle is a small universe that runs in the browser. Plant stars, grow planets out of their protoplanetary discs, name worlds and moons, launch probes, and watch stars live, die and feed black holes on a real clock, from a day per second up to a million years per second.

Play it at [starcradle.space](https://starcradle.space/).

## Code layout

| Path | What |
| --- | --- |
| `src/lib/` | Pure modules with tests: physics formulas, formatting, the seeded RNG, scoring |
| `src/app/` | The game, split by concern (renderer, shaders, world, stellar death, comets, probes, UI, daily, persistence, loop). These files share one scope and are concatenated in name order. |
| `src/styles.css`, `src/body.html`, `src/head.html` | Styles and markup |
| `public/` | Static files served as-is: manifest, icons, `CNAME` |
| `tools/build.mjs` | Builds `site/` (public page) and `dist/artifact.html` (Claude artifact) with esbuild |
| `leaderboard/` | The Cloudflare Worker behind the daily leaderboard |
| `test/` | Unit tests (`npm test`) |

`npm ci`, then `npm run build`; `npm run watch` rebuilds on change. Open `site/index.html` with any static server. Pushes to `main` run the tests, build, and deploy to GitHub Pages.

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

## Credits

Built with [three.js](https://threejs.org/). Fonts from Google Fonts (Instrument Serif, Instrument Sans, IBM Plex Mono).
