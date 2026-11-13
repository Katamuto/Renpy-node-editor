/* Small helpers shared by editor and exporter. No DOM access at load time. */
(function (R) {
  const U = R.util = {};

  U.uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

  // Body of a Ren'Py string literal (paths, names): escapes \ " and newlines.
  U.q = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
  // Same, for displayed text (dialogue, menu captions): a literal % must be doubled in Ren'Py.
  U.qt = (s) => U.q(s).replace(/%/g, '%%');

  // Python/Ren'Py identifier: lowercase ascii, digits, underscore.
  U.ident = (s, fallback) => {
    let t = String(s == null ? '' : s).trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    if (!t) return fallback || '';
    return /^\d/.test(t) ? '_' + t : t;
  };
  // Safe folder / file base name.
  U.slug = (s) => String(s || '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_');

  U.b64ToBytes = (b64) => { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; };
  U.bytesToB64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  U.toBytes = (str) => new TextEncoder().encode(str);
  U.fromBytes = (b) => new TextDecoder('utf-8', { ignoreBOM: true }).decode(b);

  // Browser: classic download link. Desktop (Tauri): native "Save as" dialog + file write.
  U.download = (name, data, mime) => {
    const T = window.__TAURI__;
    if (T && T.dialog && T.fs) {
      const bytes = typeof data === 'string' ? U.toBytes(data) : data;
      return T.dialog.save({ defaultPath: name }).then(path => path ? T.fs.writeFile(path, bytes).then(() => path) : null)
        .catch(e => { alert('Could not save the file: ' + e); });
    }
    const blob = new Blob([data], { type: mime || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
})(RVN);
