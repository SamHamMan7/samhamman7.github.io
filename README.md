# My personal website

A simple site with Home, Games, Math practice, and Accomplishments tabs.
Games: the offline Pokémon Showdown bot, Tessera, and Spin & Freeze.
Math practice: 16 original AMC/AIME-style questions with hints and solutions.

Intended address: https://samhamman7.github.io/

## Edit and preview

Run `node serve.mjs` and open http://127.0.0.1:4175.
The ready-to-host website is in `dist/`. The personal page source is in `web/`.
Use `node verify-practice.mjs` to check the math answer keys.
The supplied games in `web/games/` are preserved byte for byte.

Rebuild from the prepared bot with `python assemble.py PATH_TO_BOT` using
Python/Pillow and the bot's installed esbuild. Then `python assemble.py --refresh`
updates page files and offline packs. The packaged bot source is linked from
`dist/credits.html` and can be extracted for development.

## Publish

This repository must be named `samhamman7.github.io` under SamHamMan7 for the
site's root-relative game URLs. GitHub Pages should use GitHub Actions.
The workflow publishes only `dist/`, with no build or paid service required.

## Offline play

Use Games → Download for offline on Wi-Fi and wait for Ready for offline.
About 63 MB includes all three games, sprites, and math practice. Browser
storage can be cleared by the device; check readiness before a trip.
Physical phone performance has not been verified.

## Source and attribution

The Pokémon bot was built with AI assistance. Preserve its AGPL-3.0 license,
third-party notices, artwork notices, and corresponding-source ZIP. Pokémon
artwork retains its respective owners' rights. See `dist/credits.html`.

## November 2026 bot update

The battle workers now include the validated Very Strong RandBats controller
from bot commit `fbe416b`. The personal pages, static/silent browser adapter,
prepared media and other games are preserved. No Arena credentials or neural
weights are hosted. Champions Arena needs its separate Node controller and is
not a format this static site can run.

To update the workers again, use a fresh checkout and an existing committed bot:

```powershell
python assemble.py C:\path\to\PokemonShowdownOfflineBot --update-bot
```

This restores the previous corresponding source and overlays only committed
AI/core/data/worker files plus dependency manifests, rebuilds the browser
workers, then regenerates matching source/offline packs and version metadata.
Use `python assemble.py --refresh` for later page edits in the same checkout.

Pages now rebuilds the reviewed source update with `python3 apply-bot-update.py`
before publishing. It verifies both worker fingerprints against the local
browser-tested build. A failed build leaves the previous deployment live. The
committed `dist` remains the prepared base assets; the deployed artifact and
its source ZIP/offline packs are regenerated together. For a fresh local clone:

```powershell
python apply-bot-update.py C:\path\to\PokemonShowdownOfflineBot\node_modules
node serve.mjs
```
