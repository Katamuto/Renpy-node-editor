# Ren'Py Node Editor (v0.3)

Build a visual novel as a graph of nodes, then export a ready-to-use Ren'Py project (ZIP).
Zero dependencies, no build step: **open `index.html` in a modern browser**, host the folder anywhere (GitHub Pages), or build the desktop app.

## Use it
1. Add nodes from the left palette (or right-click the canvas). Drag from an output dot (●) onto a node to connect.
2. **Branch** with Choice menus, Conditions, or Screens that have exit buttons. **Merge** by letting several arrows enter one node. **Loop** by pointing back.
3. **Select many**: Shift+drag the background (or switch to the *Select tool*), Ctrl+A, Ctrl/Shift+click. Drag moves the whole selection.
   **Ctrl+C / X / V** copy, cut, paste (also across tabs and projects), **Ctrl+D** duplicate.
4. **Group** (Ctrl+G, Ctrl+Shift+G to ungroup): a colored, titled frame around nodes, to keep big stories organized. It does not affect the game.
5. **Containers**: select nodes and press **Ctrl+K** (or *Combine*) to pack them into ONE node that holds its own board. Arrows that crossed the border become the
   container's **inputs and outputs** (a container can have several of each; name them by editing the *Container input/output* nodes inside).
   **Double-click** (or Enter) opens it; the **breadcrumb** at the top of the canvas (Main > Chapter 1 > Scene A) shows where you are and takes you back (Alt+Up goes up one level).
   Containers nest without limit, can be copied, and **Unpack** (Ctrl+Shift+K) restores the nodes. They only organize: the exported game is identical.
   *Frames* (Ctrl+G) are the lighter option: just a titled rectangle around nodes.
6. Side tabs: **Node** (edit), **Story** (characters, variables, fonts), **Assets**, **Screens**, **Translate**, **Play** (desktop), **Issues** (drag the panel edge to resize it).
7. **Save** downloads a `.rvn` project (a ZIP: `project.json` + the real image/audio files). Old `.rvn.json` files still open.
   **Export Ren'Py ZIP**: extract it into your Ren'Py projects folder and press *Refresh* in the launcher.

## Fonts
Import `.ttf` / `.otf` files in **Assets**. **Story** tab: the game font (dialogue and names, and menus/buttons) — patched into `gui.rpy`.
**Translate** tab: a font **per language**. Ren'Py has no per-language font switch that is safe to undo, so every translated text of that language
is wrapped in `{font=...}` tags (applies only while that language is active, no Python needed); the language picker button uses it too.
Screen text elements can also pick a font. Texts that Ren'Py itself shows and that are not in the translation list use the game font.

## Play in Ren'Py (desktop app)
**Play** tab: choose your Ren'Py SDK folder once, then **F5** / *Play game* exports to a temporary folder and starts Ren'Py on it; its output appears in the tab.
**Play from here** (node inspector, right-click menu, or the Play tab) starts at the selected node using `--warp script.rpy:LINE`
(the exporter keeps a node -> script line map; Ren'Py developer mode). Needs the desktop app: a browser cannot start programs.

## Images: variants and settings
Name files `eileen_happy.png`, `eileen_sad.png`, `bg_room.png`: they are **labeled automatically** (family `eileen`, variant `happy`).
Show / Scene / Hide nodes let you pick the family, then the variant. In **Assets** each image has settings:
type (background / sprite / CG / other), background fit (fill screen, fit inside, stretch, native) and sprite size.
New variants copy the settings of their family. Exported as `image eileen happy = ...` with the right `Transform`.

## Screens
The **Screens** tab is a small designer: layout, position, background, and elements (text, buttons, images, text input) with a live preview.
Button actions: **exit** (gets its own arrow on the Screen node: each button can lead to a different branch), close, set variable, jump to label.
Exported to `game/custom_screens.rpy`. A Screen node can also show/hide/call any other screen by name, with optional raw code.

## Translations
**Translate** tab: add languages, then **Export .po** (standard gettext: Poedit, Weblate, Crowdin, Lokalise...), translate, **Import .po**.
A **CSV** (one column per language) is also available. All texts of the game are collected automatically in ONE list, identical texts once:
Ren'Py interface texts (menus, preferences...), game title, character names, dialogue, menu choices and screen texts.
Warns if a translation loses a `[variable]` or `{tag}`. The export contains `game/tl/<language>/` files, and a **Language** picker is added to Preferences.
Texts typed inside Python nodes are not collected.

## Desktop app and hosting
- **GitHub Pages**: push to `main`; `.github/workflows/pages.yml` tests and publishes the static editor (enable Pages -> "GitHub Actions" in repo settings).
- **Desktop releases** (Windows, macOS, Linux): push a tag like `v0.2.0`; `.github/workflows/release.yml` builds installers with Tauri and creates a draft release.
- **Build locally**: install Node 20 + Rust (+ Tauri's system dependencies), then `npm install`, `npm run icon`, `npm run tauri:build`.
  `npm run tauri:dev` runs it in a window. In the desktop app, Save/Export use the native "Save as" dialog.

## Tests
`node tools/test-all.js` (exporter, `.rvn` round trip, PO/CSV, screens, images, clipboard). `tools/build-template.py` rebuilds the embedded Ren'Py template; `tools/make-example.js` rebuilds the demo.
Try `examples/branching-demo.rvn` (screen with text input, menu, loop, merge, jump, groups, image variants, Spanish) and `examples/containers-demo.rvn` (the same story with the forest and cave paths packed into containers).

## Notes / limits
- Embedded template: the empty Ren'Py 8.3.4 project you provided (generated files such as cache, saves, log, `tl/` left out).
- The ZIPs are uncompressed ("store"): no dependencies, and images/audio are already compressed.
- The desktop packaging files could not be compiled in the environment where they were written (no Rust toolchain or network there): the first CI run may need small fixes.
- Languages with non-Latin glyphs may need a font that has them (set it in Ren'Py's `gui.rpy` / a translate block); a font option is not in the editor yet.
- Play in Ren'Py: see `docs/PLAY-IN-RENPY.md` for how it works and what still needs checking.
