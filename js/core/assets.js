/* Asset helpers. An image asset: {id, kind:'image', name, path, mime, bytes, role, fit, zoom}
   name = Ren'Py image name = TAG + attributes, e.g. "eileen happy" (tag "eileen", variant "happy").
   Importing eileen_happy.png / eileen_sad.png therefore labels both as variants of the character "eileen" automatically.
   role: 'background' | 'sprite' | 'cg' | 'other'. fit (backgrounds): cover | contain | fill | none. zoom (sprites). */
(function (R) {
  const U = R.util, A = R.assets = {};
  const BG = /^(bg|bgs|background|backgrounds|scene|location|loc)$/, CG = /^(cg|cgs|event|ev|still)$/;

  A.parseName = (base) => {
    const w = String(base || '').toLowerCase().split(/[\s_\-]+/).filter(Boolean);
    return { tag: w[0] || 'image', attrs: w.slice(1) };
  };
  A.nameFromFile = (file) => { const p = A.parseName(String(file).replace(/\.[^.]+$/, '')); return [p.tag].concat(p.attrs).join(' '); };
  A.guessRole = (name) => { const p = A.parseName(name); return BG.test(p.tag) ? 'background' : CG.test(p.tag) ? 'cg' : 'sprite'; };
  A.tagOf = (name) => String(name || '').trim().split(/\s+/)[0] || '';
  A.attrsOf = (name) => String(name || '').trim().split(/\s+/).slice(1).join(' ');
  A.defaults = (role) => ({ fit: role === 'background' ? 'cover' : 'none', zoom: 1 });

  // Fonts: kind 'font', stored under game/fonts/. FontFace makes them usable in the editor previews.
  A.fonts = (project) => project.assets.filter(a => a.kind === 'font');
  const faces = new Map();
  A.fontFamily = (a) => {
    const fam = 'rvn-font-' + a.id;
    if (!faces.has(a.id) && typeof FontFace !== 'undefined') {
      const f = new FontFace(fam, a.bytes.slice().buffer); faces.set(a.id, f);
      f.load().then(() => document.fonts.add(f)).catch(() => {});
    }
    return fam;
  };
  A.fontMime = (file) => /\.otf$/i.test(file) ? 'font/otf' : /\.ttc$/i.test(file) ? 'font/collection' : 'font/ttf';

  A.normalize = (a) => {
    if (a.kind === 'image') {
      a.role = a.role || A.guessRole(a.name);
      if (!a.fit) a.fit = A.defaults(a.role).fit;
      if (!a.zoom) a.zoom = 1;
    }
    return a;
  };
  A.images = (project, role) => project.assets.filter(a => a.kind === 'image' && (!role || a.role === role));

  // [{tag, variants:[{name, attrs, asset}]}] sorted by tag
  A.tags = (project, role) => {
    const m = new Map();
    A.images(project, role).forEach(a => {
      const t = A.tagOf(a.name); if (!t) return;
      if (!m.has(t)) m.set(t, []);
      m.get(t).push({ name: a.name, attrs: A.attrsOf(a.name), asset: a });
    });
    return [...m.keys()].sort().map(t => ({ tag: t, variants: m.get(t).sort((x, y) => x.attrs.localeCompare(y.attrs)) }));
  };

  // Ren'Py expression used in `image <name> = <expr>`
  A.expr = (a) => {
    const path = '"' + U.q(a.path) + '"';
    if (a.role === 'background' && a.fit && a.fit !== 'none')
      return 'Transform(' + path + ', xysize=(config.screen_width, config.screen_height), fit="' + (a.fit === 'fill' ? 'fill' : a.fit) + '")';
    if (a.zoom && Number(a.zoom) !== 1) return 'Transform(' + path + ', zoom=' + Number(a.zoom) + ')';
    return path;
  };

  // Blob URL for thumbnails (cached per asset)
  const urls = new Map();
  A.url = (a) => {
    if (!a.bytes) return '';
    const hit = urls.get(a.id);
    if (hit && hit.bytes === a.bytes) return hit.url;
    if (hit) URL.revokeObjectURL(hit.url);
    const url = URL.createObjectURL(new Blob([a.bytes], { type: a.mime || 'application/octet-stream' }));
    urls.set(a.id, { url, bytes: a.bytes }); return url;
  };
  A.forget = (a) => { const h = urls.get(a.id); if (h) { URL.revokeObjectURL(h.url); urls.delete(a.id); } };
})(RVN);
