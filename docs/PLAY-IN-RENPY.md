# Play in Ren'Py (desktop app)

Implemented in v0.3. Because it could not be run against a real Ren'Py SDK or a compiled Tauri build where it was written,
check these on your machine first:

1. Play tab -> *Choose SDK folder* -> pick the folder that contains `renpy.exe` (Windows) or `renpy.sh` (macOS / Linux).
   On macOS/Linux `renpy.sh` must be executable (unzipping with some tools drops that bit: `chmod +x renpy.sh`).
2. **F5**: the project is written to `<app data>/play/<game name>/` (Windows: `%LOCALAPPDATA%\com.renpynodeeditor.app\play\...`) and started with
   `renpy.sh <folder>`. The first launch compiles the scripts and takes a few seconds.
3. **Play from here**: starts with `--warp script.rpy:<line>`. Ren'Py's warp is a developer-mode feature that rebuilds the scene state
   (backgrounds, shown images) up to that line; some games with heavy Python state may not behave exactly as a full playthrough.

## How it works
- `js/exporter/emit-script.js` returns a source map `lineMap` (node id -> first line in `script.rpy`).
- `js/io/desktop.js` exports with `RVN.exporter.files(project, {play:true})`, writes every file with the Tauri fs plugin, then calls the Rust command.
- `src-tauri/src/main.rs`: `check_sdk` (is this an SDK folder?) and `launch_renpy` (spawns Ren'Py, streams stdout/stderr back as `renpy-log` events, `renpy-exit` when it closes).
- Permissions are in `src-tauri/capabilities/default.json` (write access is limited to the user's folders and the app data folder).

## Ideas not done yet
- Map `lint` errors and tracebacks back to nodes through the source map (click an error to jump to the node).
- A "Stop" button, and reusing the same folder to let Ren'Py auto reload (Shift+R) instead of restarting.
