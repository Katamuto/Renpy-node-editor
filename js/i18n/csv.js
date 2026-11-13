/* CSV for spreadsheet people: columns  text, context, <language code>...  (UTF-8 with BOM so Excel opens accents correctly). */
(function (R) {
  const I = R.i18n = R.i18n || {};
  const cell = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';

  I.toCSV = function (project) {
    const langs = project.translations.languages, rows = [['text', 'context'].concat(langs.map(l => l.code))];
    I.collect(project).forEach(e => rows.push([e.text, e.notes.join(' / ')].concat(langs.map(l => I.get(project, e.text, l.code)))));
    return '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
  };

  I.parseCSV = function (text) {
    text = text.replace(/^\uFEFF/, '');
    const first = text.split(/\r?\n/)[0], d = (first.split(';').length > first.split(',').length) ? ';' : ',';   // Excel in some locales uses ;
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === d) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  };

  // Matches columns by language code. Returns {imported, skipped, langs:[codes]}
  I.importCSV = function (project, text) {
    const rows = I.parseCSV(text), head = rows.shift() || [];
    const cols = project.translations.languages.map(l => [l.code, head.indexOf(l.code)]).filter(c => c[1] >= 0);
    const textCol = head.indexOf('text'); if (textCol < 0) throw new Error('CSV needs a "text" column');
    let imported = 0, skipped = 0; const known = new Set(I.collect(project).map(e => e.text).concat(Object.keys(project.translations.strings)));
    rows.forEach(r => {
      const src = r[textCol];
      if (!known.has(src)) { skipped++; return; }
      cols.forEach(c => { const v = r[c[1]]; if (v) { I.set(project, src, c[0], v); imported++; } });
    });
    return { imported, skipped, langs: cols.map(c => c[0]) };
  };
})(RVN);
