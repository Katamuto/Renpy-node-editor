/* Desktop-only features (Tauri). In a normal browser R.desktop.isDesktop() is false and nothing here runs.
   Play flow: export the project into <app data>/play/<name>, then ask the Rust side to start the Ren'Py SDK on that folder
   (optionally with --warp script.rpy:LINE to start at a chosen node). Ren'Py output comes back as "renpy-log" events. */
(function (R) {
  const D = R.desktop = { log: [], running: false };
  const T = () => window.__TAURI__;
  D.isDesktop = () => !!(T() && T().core && T().fs && T().path && T().dialog);
  D.sdk = () => { try { return localStorage.getItem('rvn.sdk') || ''; } catch (e) { return ''; } };
  D.setSdk = (p) => localStorage.setItem('rvn.sdk', p);

  const say = (line, err) => { D.log.push({ line, err: !!err }); if (D.log.length > 500) D.log.shift(); R.events.emit('play:log'); };
  D.say = say;
  D.clearLog = () => { D.log = []; R.events.emit('play:log'); };

  let listening = false;
  D.listen = function () {
    if (listening || !D.isDesktop() || !T().event) return; listening = true;
    T().event.listen('renpy-log', e => say(e.payload.line, e.payload.err));
    T().event.listen('renpy-exit', e => { D.running = false; say('Ren\'Py closed (exit code ' + e.payload + ')'); R.events.emit('play:state'); });
  };

  D.checkSdk = (path) => T().core.invoke('check_sdk', { sdk: path });
  D.browseSdk = async function () {
    const dir = await T().dialog.open({ directory: true, title: 'Select the Ren\'Py SDK folder (the one that contains renpy.exe / renpy.sh)' });
    if (!dir) return null;
    try { await D.checkSdk(dir); D.setSdk(dir); say('Ren\'Py SDK: ' + dir); return dir; } catch (e) { alert(String(e)); return null; }
  };

  // nodeId (optional): start the game at that node
  D.play = async function (nodeId) {
    if (!D.isDesktop()) { alert('Playing needs the desktop app.'); return; }
    D.listen();
    const sdk = D.sdk(); if (!sdk) { R.ui.toast('Choose the Ren\'Py SDK folder first (Play tab).'); R.panels.show('play'); return; }
    if (D.running && !confirm('The game is still running. Start another copy?')) return;
    const fs = T().fs, path = T().path;
    try {
      say('Exporting project...');
      const ex = R.exporter.files(R.state.project, { play: true });
      const base = await path.join(await path.appLocalDataDir(), 'play', ex.folder);
      try { await fs.remove(base, { recursive: true }); } catch (e) { /* first run */ }
      await fs.mkdir(base, { recursive: true });
      const made = new Set();
      for (const f of ex.files) {
        const parts = f.path.split('/').filter(Boolean);
        if (f.data === null) { await fs.mkdir(await path.join(base, ...parts), { recursive: true }); continue; }
        const dir = await path.join(base, ...parts.slice(0, -1));
        if (!made.has(dir)) { await fs.mkdir(dir, { recursive: true }); made.add(dir); }
        await fs.writeFile(await path.join(base, ...parts), f.data);
      }
      if (ex.warnings.length) say(ex.warnings.length + ' warning(s) in the story, see the Issues tab.');
      const line = nodeId && ex.lineMap[nodeId];
      if (nodeId && !line) say('That node has no script line, starting from the beginning.');
      await T().core.invoke('launch_renpy', { sdk, project: base, warp: line ? 'script.rpy:' + line : null });
      D.running = true; say('Started Ren\'Py' + (line ? ' at script.rpy:' + line : '') + '...'); R.events.emit('play:state');
    } catch (e) { say('Could not start: ' + e, true); R.ui.toast('Could not start the game, see the Play tab.'); }
  };
})(RVN);
