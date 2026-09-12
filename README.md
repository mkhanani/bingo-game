# Bingo Night

A simple bingo game you can play in the browser.

## Files

- `index.html` — multiplayer version. Two players join the same room code from separate phones (one Android, one iPhone) and play together in real time, using in-browser shared storage to sync calls and card marks.
- `single-player.html` — single-device version with a built-in number caller and win detection, no syncing needed.

## Running it

These are static HTML files with no build step. Open `index.html` (or `single-player.html`) directly in a browser, or serve the folder with any static file host (GitHub Pages, Netlify, a simple `python -m http.server`, etc).

Note: the multiplayer sync in `index.html` relies on a storage API (`window.storage`) that is only available when the page is rendered inside a Claude.ai artifact. Opening `index.html` on a plain web server will load the page and UI, but the cross-device sync will not work there — it needs to run as a Claude artifact for both players to see the same room.
