/* Project file = ".rvn" = a ZIP:  project.json  +  assets/<path>  (binary, not base64).
   Also opens the old v0.1 ".rvn.json" (assets as base64). Autosave goes to IndexedDB (binary friendly).
   RVN.io: pack / unpack / parseAny / saveFile / openFile / autosave / restoreAutosave / exportZip */
(function (R) {
  const U = R.util, IO = R.io = {};
  let warned = false;

  IO.pack = function (project) {
    const meta = Object.assign({}, project, {
      assets: project.assets.map(a => ({ id: a.id, kind: a.kind, name: a.name, path: a.path, mime: a.mime, role: a.role, fit: a.fit, zoom: a.zoom }))
    });
    const files = [{ path: 'project.json', data: U.toBytes(JSON.stringify(meta, null, 1)) }];
    project.assets.forEach(a => files.push({ path: 'assets/' + a.path, data: a.bytes }));
    return R.zip.build(files);
  };

  IO.unpack = async function (bytes) {
    const files = await R.zip.read(bytes), pj = files.get('project.json');
    if (!pj) throw new Error('project.json is missing');
    const p = JSON.parse(U.fromBytes(pj));
    if (p.format !== 'rvn' || !Array.isArray(p.nodes)) throw new Error('not a Ren\'Py Node Editor project');
    p.assets = (p.assets || []).map(a => Object.assign(a, { bytes: files.get('assets/' + a.path) || new Uint8Array(0) }));
    return p;
  };

  IO.parseAny = async function (bytes) {
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) return IO.unpack(bytes);              // "PK" = zip
    const p = JSON.parse(U.fromBytes(bytes));                                           // legacy v0.1 json
    if (p.format !== 'rvn' || !Array.isArray(p.nodes)) throw new Error('not a Ren\'Py Node Editor project');
    (p.assets || []).forEach(a => { a.bytes = U.b64ToBytes(a.data || ''); delete a.data; });
    return p;
  };

  IO.saveFile = function () {
    const name = (U.slug(R.state.project.meta.name) || 'project') + '.rvn';
    Promise.resolve(U.download(name, IO.pack(R.state.project), 'application/zip')).then(() => { R.state.dirty = false; R.ui.toast('Saved ' + name); });
  };

  IO.openFile = function () {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.rvn,.zip,.json,application/zip,application/json';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try { R.model.setProject(await IO.parseAny(new Uint8Array(await f.arrayBuffer()))); R.canvas.fit(); R.ui.toast('Opened ' + f.name); }
      catch (e) { alert('Could not open file: ' + e.message); }
    };
    inp.click();
  };

  // --- autosave (IndexedDB) ---
  const db = () => new Promise((res, rej) => { const r = indexedDB.open('rvn', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const put = (k, v) => db().then(d => new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }));
  const get = (k) => db().then(d => new Promise((res, rej) => { const r = d.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));

  IO.autosave = function () {
    put('autosave', IO.pack(R.state.project)).catch(() => { if (!warned) { warned = true; R.ui.toast('Autosave is not available in this browser. Use Save.'); } });
  };
  IO.restoreAutosave = async function () {
    try {
      let bytes = await get('autosave');
      if (!bytes) { const old = localStorage.getItem('rvn.autosave'); if (old) bytes = U.toBytes(old); }   // v0.1 leftovers
      if (!bytes) return false;
      R.model.setProject(await IO.parseAny(bytes)); return true;
    } catch (e) { return false; }
  };

  IO.exportZip = function () {
    try {
      const res = R.exporter.build(R.state.project);
      Promise.resolve(U.download(res.filename, res.bytes, 'application/zip')).then(() => {
        R.events.emit('export:done', res.warnings);
        R.ui.toast('Exported ' + res.filename + (res.warnings.length ? ' (' + res.warnings.length + ' warnings, see Issues)' : ''));
      });
    } catch (e) { console.error(e); alert('Export failed: ' + e.message); }
  };
})(RVN);
