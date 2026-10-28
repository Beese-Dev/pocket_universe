# Pocket Universe: Game Design Roadmap

2026-10-28. The living version of this document is the Claude doc shared with the team; this copy tracks it.

## Why
Players call Pocket Universe educational rather than a game because it offers plenty to watch and little to want. The physics, rendering and realism rules are done; what is missing is a reason to act and something to lose. A game needs goals, scarcity, consequences and skills. This roadmap adds all four without breaking the rule that anything that happens in the game would happen in reality.

## Where we are
| System | What exists | Game use |
| --- | --- | --- |
| Stars | Seven classes, real lifetimes, red giants, white dwarfs, supernovas, pulsars, collapse to black holes | Deadlines and hazards |
| Planets and moons | Formed from 5 Myr discs, habitable zones, field notes with species, tidal locking | Things worth protecting |
| Black holes | Bend orbits, capture stars, tidal disruption, X-ray binaries | Hazards and tools |
| Comets | Impacts, dust winters, extinctions, sungrazers | The main threat to life |
| Probes | Gravity-bent trajectories with guidance, reports | The player's active verb |
| Time | One clock in years, five speeds, event slow motion and camera | Pacing |
| Daily challenge | Seeded universe, 1 Gyr, Legacy score, leaderboard service written | First competitive loop |
| Meta | 36 discoveries, share codes, Atlas, lessons, Guide | Collection and onboarding |

## Goals
- **Missions**: three live objectives generated from the player's own universe, each a checkable predicate; completing one unlocks the next tier and, early on, the next tool.
- **Challenge scenarios**: pre-made universes with a problem, limited tools, a clock, and a pass/fail condition; shipped as share codes.
- **Daily seed**: built. Same universe for everyone each UTC day, 1 Gyr, Legacy score; leaderboard once the service in `leaderboard/` is deployed.

## Scarcity
- **Budget of matter**: stars cost mass from a finite reserve, planets cost disc material, probes cost gathered resources; supernovas refill the reserve.
- **Limited actions per epoch**: a handful of interventions per 100 Myr.

## Consequence
**Civilisations** grow from long-lived life and earn Legacy continuously; they die to impacts, giants, supernovas and nearby X-ray binaries. Proposed stages:

| Stage | Reached after | Earns | Can do | Dies to |
| --- | --- | --- | --- | --- |
| Microbial | Life appears | 1 / Myr | Nothing | Any sterilising event |
| Complex | 500 Myr unbroken | 2 / Myr | Nothing | Impact winter 55%, giant, supernova |
| Civilised | 1.5 Gyr, no extinction in last 200 Myr | 5 / Myr | Night-side lights | Impact winter 30%, giant, supernova |
| Spacefaring | 2 Gyr | 10 / Myr | Own probes; deflects some comets | Giant, supernova, X-ray binary |
| Interstellar | 2.5 Gyr | 20 / Myr | Can be evacuated | Nothing, if moved in time |

**Legacy score**: life-years weighted by stage, rare discoveries, missions. Always visible, in share codes, on postcards; the daily score becomes the same number over a fixed span.

## Mastery
Comet deflection by probe (timing and lead matter); gravity assists scored in the arrival report; system engineering rewarded by field notes ("Stable for the next 2 Gyr").

## Collection and progression
Rare rolls with cards (hot Jupiter, diamond world, rogue with a subsurface ocean, circumbinary world, Trojan planet). Unlocks: new players start with G/K/M stars and rocky worlds; blue giants, black holes, probes and fast time unlock through missions.

## Social
Legacy score and civilisation count carried in share codes; visits leave a probe report. Daily leaderboard via the Cloudflare Worker in `leaderboard/`.

## Build order
1. **Core loop** (about 2 sessions): civilisation stages, Legacy score always on, score in share codes and postcards. Gate: life can be lost, and the score shows it.
2. **Goals** (about 2): three live missions, unlocks, leaderboard deployed, daily uses Legacy. Gate: a new player has a goal in the first minute.
3. **Mastery** (about 2): comet deflection, gravity-assist scoring, engineering notes, limited interventions. Gate: a skill improves with practice.
4. **Depth** (about 3): challenge scenarios, budget of matter, rare rolls, visit traces. Gate: players make and share their own challenges.

## Design rules
If it would happen in reality, it happens in the game, and nothing happens that would not. No power-ups or instant terraforming; no punishment for watching; honest scores; complexity gated, never removed; every change ships to both copies and migrates saves.

## Open questions
- Civilisation timescales: Earth's, or compressed as in the table?
- Do unlocks apply to existing players?
- Keep the daily budget (2 stars, 1 black hole) or switch to per-epoch interventions?
- Leaderboard hosting: Cloudflare Workers or Supabase?
- Leaderboard names: free text or generated handles?
- Challenge scenarios: player-authored from day one, or curated first?
