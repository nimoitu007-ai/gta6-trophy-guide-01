# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/nimoitu007-ai/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/nimoitu007-ai/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Entry for make.fun's "Build the best GTA 6 trophy guide" bounty ($250, 50 places, 1st $50). An offline guide and tracker for every one of the 55 Grand Theft Auto VI PlayStation 5 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden.

## What it is

- **All 55 trophies** with the official name, description and grade of each, a guide written for this ledger, numbered steps, and a named source next to it (Outputlag, checked against Keengamer and Radio Times; list data as Exophase and PSNProfiles agree on it).
- **A five-stage road to the Platinum (about 200 hours)** — Chapters 1–2, Chapters 3–4, strands and robberies, activities, then post-story cleanup and 100% — with a live earned-count on every stage, built from the official descriptions.
- **The one missable trophy called out**: Positive Mental Attitude. Lucia's balcony meditation spot in Chapter 1 disappears after that chapter, so the ledger warns you before you start and tells you to keep a Chapter 1 manual save. Save warning included: no mission replay, no New Game Plus — keep a manual save at the start of every chapter and one before the final mission (15 manual slots + 1 autosave), and cheats turn off trophies.
- **Tracker**: tick trophies off and progress saves in the browser (localStorage), with export to a file and import back, plus a reset. Sort by list order, grade, roadmap stage or name.
- **Filters**: search, grade, kind (story / missable / collectibles / activities / online — the game lists no online trophies, so that filter is empty on purpose), earned vs remaining, hidden-only.
- **Spoiler switch**: hides the names and descriptions of hidden story trophies until you earn them; the switch itself is remembered in the browser.
- **Said honestly**: Rockstar has not published an official trophy list. Names, descriptions and grades are the ones Exophase and PSNProfiles list, which agree on every entry; how-to notes are this ledger's own paraphrase of third-party guides and each trophy names its source. No Rockstar logo or artwork is used anywhere.

## Try it

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no network at run time: `app/` is plain static files.

## Files

- `app/index.html` — the guide page (warnings, roadmap, checklist, sources).
- `app/app.js` — checklist rendering, filters, sorting, spoiler mode, localStorage progress, export/import, per-stage progress.
- `app/style.css` — the ledger's own look.
- `app/data/trophies.json` — all 55 trophies: name, description, grade, hidden flag, kind, missable flag, count, chapter, roadmap stage, guide, steps, source.
- `screenshots/` — 4 real renders of the app in a browser (cover: checklist with the missable trophy's guide open; roadmap; spoiler mode with filters; a cited guide open).
- `main.ts` — entry program (Node 22): checks the trophy file holds 55 entries with a guide, a source, a valid grade and a unique slug, copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.
- `vendor/makefun-frontend.ts` — the kit's library, unchanged.
- `LICENSE` — MIT.

## Hand the entry in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

Entered on [make.fun](https://make.fun/?ref=23dndny3&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards
