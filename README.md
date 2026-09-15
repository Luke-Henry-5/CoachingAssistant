# Matchday — Soccer Lineup Builder

A small, no-build-step web app for coaches: add players with a position,
see them auto-grouped into a bench by position, then drag names onto the
pitch to build your starting lineup. Players on the pitch disappear from
the bench list automatically, so the bench naturally becomes your subs list.

## Files

- `index.html` — page structure (team name, add-player form, bench, pitch)
- `style.css` — visual styling (pitch, chips, layout)
- `app.js` — all app logic: state, rendering, drag-and-drop, persistence

No build tools, frameworks, or installs are required.

## Running it

Just open `index.html` in a browser — double-click it, or for best results
(especially if you add features later that need a local server) run:

```
python3 -m http.server 8000
```

from this folder, then visit `http://localhost:8000`.

## How it works

- **Add players**: type a name, pick a position, and click "Add player."
- **Positions are yours to define**: it ships with Goalkeeper, Defense,
  Midfield, and Forward, but open "Manage positions" (under the bench) to
  add anything more specific — Outside Back, Left Wing, Holding Mid,
  whatever fits how you actually coach. Give each one a color; that color
  shows up as the little badge on every player chip. A position can only
  be deleted once no players are assigned to it.
- **Bench**: players are auto-grouped by position. This list is effectively
  your subs list, since anyone on the pitch is removed from it.
- **Build a lineup**: drag a player's chip from the bench onto the pitch
  (a vertical field, goal at top and bottom) and drop it wherever you want
  them positioned.
- **Move a player**: drag a chip already on the pitch to reposition it.
- **Bench a player**: drag their chip from the pitch back onto the bench
  area, or click the small "×" on their pitch chip.
- **Remove a player from the squad entirely**: click the "×" on their bench
  chip (this asks for confirmation, since it deletes them for good).
- **Bench everyone**: one click clears the whole pitch back to the bench,
  without deleting anyone from your squad.
- **Team name**: click the team name at the top left to rename it.

## Data

Everything (squad, your custom positions, current lineup, and team name) is
saved to the browser's `localStorage`, so it's still there next time you
open the page on the same device/browser. There's no server or account —
it's all local to your browser.

## Ideas for later

- Formation presets (4-4-2, 4-3-3, etc.) with snap-to-slot positions
- Multiple saved lineups per opponent/game
- Export the lineup as an image or PDF to hand to an assistant coach
- Track playing time per player across a season
- Reorder or rename existing positions from the manage-positions panel
