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
