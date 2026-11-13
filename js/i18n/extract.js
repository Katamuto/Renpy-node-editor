/* Collects every translatable text of the project in ONE list (deduplicated):
     1. interface strings of the Ren'Py template (menus, preferences, confirm dialogs...) + game title
     2. character names
     3. story texts, in story order (each node type provides texts(node, project))
     4. texts of designed screens
   "text" is the HUMAN form (a single %). Ren'Py's own form doubles it: RVN.i18n.key(text). */
(function (R) {
  const U = R.util, I = R.i18n = R.i18n || {};
  I.key = (t) => String(t).replace(/%/g, '%%');
  I.placeholders = (s) => (String(s).match(/\[[^\[\]]*\]|\{(?!#)[^{}]*\}/g) || []).sort().join('|');

  let uiCache = null;
  I.templateStrings = function () {
    if (uiCache) return uiCache;
    const out = [];
    ['game/screens.rpy', 'game/options.rpy'].forEach(f => {
      if (!R.templateFiles || !R.templateFiles[f]) return;
      U.fromBytes(U.b64ToBytes(R.templateFiles[f])).split(/\r?\n/).forEach(line => {
        if (/^\s*#/.test(line)) return;
        for (const m of line.matchAll(/\b_\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)) {
          const v = m[1].replace(/\\(n|"|'|\\)/g, (x, c) => c === 'n' ? '\n' : c).replace(/%%/g, '%');
          if (v.trim() && !out.includes(v)) out.push(v);
        }
      });
    });
    return (uiCache = out);
  };

  I.collect = function (project) {
    const seen = new Map(), list = [];
    const add = (text, kind, note, plain) => {
      if (text == null) return; text = String(text); if (!text.trim()) return;
      let e = seen.get(text);
      if (!e) { e = { text, kind, notes: [], plain: !!plain }; seen.set(text, e); list.push(e); }
      if (note && !e.notes.includes(note) && e.notes.length < 4) e.notes.push(note);
    };
    I.templateStrings().forEach(t => add(t, 'ui', 'Game interface'));
    add(project.meta.name, 'ui', 'Game title', true);   // plain: used as window title, never wrapped in font tags
    if (project.translations.languages.length) add('Language', 'ui', 'Language picker label');
    project.characters.forEach(c => add(c.name, 'name', 'Character name (' + c.id + ')'));
    const A = R.analyzeGraph(project);
    A.order.concat([...A.nodes.keys()].filter(id => !A.seen.has(id))).forEach(id => {
      const n = A.nodes.get(id), def = R.registry.get(n.type);
      if (def.texts) def.texts(n, project).forEach(t => add(t.text, 'story', t.note));
    });
    project.screens.forEach(s => s.elements.forEach(e => { if (e.type === 'text' || e.type === 'button') add(e.text, 'screen', 'Screen "' + s.name + '"'); }));
    return list;
  };

  I.get = (project, text, code) => ((project.translations.strings[text] || {})[code]) || '';
  I.set = (project, text, code, value) => {
    const st = project.translations.strings;
    if (!String(value).trim()) { if (st[text]) { delete st[text][code]; if (!Object.keys(st[text]).length) delete st[text]; } return; }
    (st[text] = st[text] || {})[code] = value;
  };
  I.status = function (project, code, entries) {
    entries = entries || I.collect(project);
    let done = 0, bad = 0; const live = new Set(entries.map(e => e.text));
    entries.forEach(e => { const t = I.get(project, e.text, code); if (t) { done++; if (I.placeholders(t) !== I.placeholders(e.text)) bad++; } });
    const obsolete = Object.keys(project.translations.strings).filter(k => !live.has(k)).length;
    return { total: entries.length, done, bad, obsolete };
  };
  I.purge = function (project, entries) {
    const live = new Set((entries || I.collect(project)).map(e => e.text));
    Object.keys(project.translations.strings).forEach(k => { if (!live.has(k)) delete project.translations.strings[k]; });
  };
})(RVN);
