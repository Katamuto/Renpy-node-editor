# Launching the game from the editor: feasibility (not implemented)

**Verdict: feasible for the desktop app, not possible from the web version (GitHub Pages).** Small to medium effort.
(CLI details below are from Ren'Py documentation knowledge; confirm them once on the SDK version you use.)

## What Ren'Py offers
- `renpy.sh <project folder>` (Linux/macOS) or `renpy.exe <project folder>` (Windows) runs the game directly, no launcher needed.
- `--warp <file>:<line>` starts the game at a given script line (developer mode), useful for "play from this node".
- Other commands: `lint` (checks the script) and `compile`. Errors appear on stderr and in `traceback.txt` / `errors.txt`.
- With `config.developer` on, Ren'Py can auto reload (Shift+R) when files change.

## Desktop app (Tauri)
1. Setting "Ren'Py SDK folder" (saved locally). The SDK is a separate download: do not bundle it.
2. "Play": write the exported project to a folder on disk (the exporter already builds all files in memory), then start the SDK executable with that folder as argument (a Rust command or the Tauri shell plugin with a restricted scope).
3. Capture stdout/stderr and show them in an editor panel.
Costs: SDK discovery per OS (the macOS app bundle path differs), quoting of Windows paths, a Rust command to write many files, a warning when the SDK version differs from the template (8.3.4).

## Nice extras that fit our architecture
- **Source map**: `emit-script.js` can record the script line of each node. That gives "Play from this node" (`--warp`) and, in reverse, errors from `lint` or tracebacks highlighted on the offending node in the Issues tab.
- **Live preview loop**: keep the game open, re-export on change, press Shift+R.

## Web version
A browser cannot start programs. Alternatives: download the ZIP (today), or in Chromium browsers write the project folder directly with the File System Access API and let the user keep Ren'Py running with auto reload. Ren'Py's web (WebAssembly) build needs the SDK and cannot be produced from a browser.
