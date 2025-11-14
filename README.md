# Watch Generator

Generates a 3x3 terrain grid and shows pass/fail results for three watch actions (Piloting, Navigating, Forraging) against terrain-specific DC values defined in `config.json`.

## Usage
1. Open `index.html` in a browser.
2. Click `Roll All` to roll all three d20s (or roll individually with each Roll button, or manually enter values 1–20).
3. Click `Generate Grid` to build/update the terrain grid.
4. Each terrain cell displays:
   - Terrain name and image
   - Sub-grid of three checks (Piloting / Navigating / Forraging)
   - Green icon = roll >= DC (pass)
   - Red icon = roll < DC (fail)
   - Roll value and DC are shown for clarity

## Config
DCs are loaded from `config.json` under `difficulty classes.watch_actions`.
All three action categories currently share identical DCs per terrain.

## Image Filename Note
One file is named `cracked_wastelands .png` (with an extra space). Logic in `script.js` maps the terrain key `cracked_wastelands` to that filename. Rename the file without the space for cleaner consistency and remove the special-case in `script.js` if desired.

## Extending
- To add more terrains: update each action block in `config.json` and add the corresponding image in `terrains/`.
- To change DCs: edit `config.json` and refresh the page.
- To adjust layout or colors: modify `styles.css`.

## Future Ideas
- Persist last rolls in `localStorage`.
- Add advantage/disadvantage toggle (roll twice, keep high/low).
- Export summary (e.g., copyable text or JSON).

Enjoy!
