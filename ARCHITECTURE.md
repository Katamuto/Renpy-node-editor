# Architecture (read this first, then open only the file you need)

Classic `<script>` tags, one global namespace `RVN` (no ES modules: they do not load from `file://`). Load order is in `index.html`.

| Folder | Role |
|---|---|
| `js/core/` | `state.js` project model + every mutation (`RVN.model`: boards/containers, selection, groups, nodes, links), `flatten.js` containers -> plain graph for export, `history.js` undo, `clipboard.js` copy/cut/paste, `registry.js` node types, `assets.js` image families / roles / `image` expressions, `screens.js` screen helpers (exit ports), `events.js` bus, `util.js` helpers |
| `js/nodes/` | **One file per node type**, each calls `RVN.registry.register({...})` (contract in `core/registry.js`) |
| `js/io/` | `desktop.js` (Tauri only: play), `zip-writer.js` / `zip-reader.js` ZIP (store + deflate), `project-format.js` `.rvn` save/open, IndexedDB autosave, export button, `template-data.js` GENERATED (do not open) |
| `js/i18n/` | `extract.js` collects all texts, `po.js` gettext PO/POT, `csv.js` CSV |
| `js/exporter/` | `graph-analysis.js` (which nodes need labels) -> `emit-script.js` (script.rpy) ; `emit-options.js`, `emit-screens.js`, `emit-assets.js`, `emit-translations.js` (tl files, language picker), `emit-fonts.js` (gui font patch, per-language font tags), `build-zip.js` (assembles ZIP) |
| `js/editor/` | UI: `canvas` pan/zoom/box-select, `node-view` node DOM, `group-view` group frames, `breadcrumb` nesting path, `links` SVG arrows, `node-drag`, `connect`, `panels` tabs, `inspector` (node form), `project-panel`, `assets-panel`, `screens-panel` (designer), `translations-panel`, `play-panel` (desktop), `issues-panel`, `palette`, `context-menu`, `toolbar`, `shortcuts` |
| `js/main.js` | wiring only |

## Data (`RVN.state.project`)
`nodes[{id,type,x,y,data}]`, `links[{id,from,port,to}]` (`from`+`port` = an output, `to` = a node input), `groups`, `screens`, `translations`, `characters`, `variables`, `assets` (binary `bytes`), `meta`. Selection: `state.selection = {nodeIds, linkId, groupId}` (current board only).
A `container` node keeps its own `{title, nodes, links, groups}` in `data`; `state.path` = ids of the containers we are inside, `model.board()` = board shown. Inside, `ginput` / `goutput` nodes (key + label) define the container's ports. Links have `toPort` (several inputs). Node ids are unique across the whole project (paste renews them). `RVN.flatten(project)` removes containers (boundary nodes become pass-through nodes) so the exporter, analysis and translations only see a plain graph; use `RVN.allNodes / findNode` to look across boards.
File = `.rvn` ZIP (`project.json` + `assets/...`). Undo snapshots exclude assets and translations.
Rule: one link per output port; any number of links into one node (merge).

## Add a node type
1. Create `js/nodes/mynode.js` with `RVN.registry.register({type, label, category, icon, defaults, fields, summary, emit})`.
   Several exits: give `outputs(node)` and `branch(node, ctx)`; no exits: `outputs: () => []` (+ `terminal: true` if flow stops).
2. Add `<script src="js/nodes/mynode.js"></script>` in `index.html`. Done: palette, inspector and exporter pick it up.

## Events
`graph:rebuild`, `board:changed`, `play:log`, `nodes:refresh` (redraw nodes only), `node:updated(id)`, `nodes:moved(ids)`, `links:changed`, `groups:changed`, `selection:changed`, `project:changed`, `history:changed`, `export:done`.
After a finished edit call `RVN.model.commit()` (or `RVN.history.record()`); while typing use `RVN.model.updateNode` / `touch()`.

## Debug map
Wrong Ren'Py output -> `exporter/emit-script.js` or the node's `emit` in `js/nodes/`. Wrong labels / merges -> `graph-analysis.js`.
Editor drawing -> `node-view.js`, `links.js`, `canvas.js`. Run `node tools/test-export.js` after exporter changes.

## Other
`packaging`: `scripts/build-web.js` -> `dist/`, `src-tauri/` (desktop), `.github/workflows/` (Pages + releases). Tests: `node tools/test-all.js`. Play in Ren'Py: `docs/PLAY-IN-RENPY.md`.
