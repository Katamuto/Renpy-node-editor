/* "Translate" tab. Workflow: 1) add languages  2) Export .po (or the CSV) and send it to translators  3) Import it back.
   Every player-visible text of the game (menus, dialogue, choices, names, screens) is collected into ONE list automatically.
   Identical texts are listed once. Exported games get tl/<language>/ files and a language picker in Preferences. */
(function (R) {
  const el = R.el, I = R.i18n, U = R.util, PAGE = 80;
  let code = '', filter = 'all', query = '', shown = PAGE;

  function pick(accept, fn) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
    inp.onchange = async () => { const f = inp.files[0]; if (f) fn(f.name, new TextDecoder('utf-8').decode(new Uint8Array(await f.arrayBuffer()))); };
    inp.click();
  }

  function render(host) {
    const P = R.state.project, T = P.translations, redraw = () => R.panels.refresh('translations');
    if (!T.languages.some(l => l.code === code)) code = T.languages.length ? T.languages[0].code : '';
    const lang = T.languages.find(l => l.code === code), entries = I.collect(P), st = lang ? I.status(P, code, entries) : null;

    host.append(el('h3', { text: 'Languages' }),
      el('label', { class: 'field' }, el('span', { text: 'Original language name (shown in the language picker)' }),
        el('input', { type: 'text', value: T.base, oninput: e => { T.base = e.target.value; R.model.touch(); } })),
      el('p', { class: 'hint', text: 'code = folder name used by Ren\'Py (spanish, french, german...). iso = code for translation tools (es, fr, de...).' }),
      R.ui.listEditor({ items: T.languages, columns: [{ key: 'code', label: 'code' }, { key: 'name', label: 'Shown as (Español)' }, { key: 'iso', label: 'iso' }],
        make: () => ({ code: 'spanish', name: 'Español', iso: 'es' }), addLabel: '+ Add language' }),
      el('button', { class: 'btn small', text: 'Apply language list', onclick: redraw }));
    if (!lang) { host.append(el('p', { class: 'hint', text: 'Add a language to start translating.' })); return; }

    host.append(el('h3', { text: 'Work on' }), el('select', { onchange: e => { code = e.target.value; shown = PAGE; redraw(); } },
      T.languages.map(l => el('option', { value: l.code, selected: l.code === code, text: (l.name || l.code) + ' (' + l.code + ')' }))),
      el('label', { class: 'field' }, el('span', { text: 'Font for ' + (lang.name || lang.code) + ' (needed for alphabets the game font lacks, e.g. 日本語)' }),
        el('select', { onchange: e => { lang.font = e.target.value; R.model.commit(); } },
          [el('option', { value: '', text: '(same as the game font)' })].concat(R.assets.fonts(P).map(a => el('option', { value: a.id, selected: a.id === lang.font, text: a.name }))))),
      el('div', { class: 'progress' }, el('div', { style: 'width:' + (st.total ? Math.round(st.done / st.total * 100) : 0) + '%' })),
      el('p', { class: 'hint', text: st.done + ' of ' + st.total + ' texts translated' + (st.bad ? ' · ' + st.bad + ' with changed [variables]/{tags}' : '') + (st.obsolete ? ' · ' + st.obsolete + ' unused' : '') }));

    const msg = (r) => R.ui.toast('Imported ' + r.imported + ' texts' + (r.fuzzy ? ', ' + r.fuzzy + ' fuzzy skipped' : '') + (r.skipped ? ', ' + r.skipped + ' unknown skipped' : ''));
    host.append(el('h3', { text: 'Exchange with translators' }), el('div', { class: 'btn-row wrap' },
      el('button', { class: 'btn', text: 'Export .po', title: 'Standard gettext file for this language (Poedit, Weblate, Crowdin...)', onclick: () => U.download((U.slug(P.meta.name) || 'game') + '_' + (lang.iso || lang.code) + '.po', I.toPO(P, lang), 'text/plain') }),
      el('button', { class: 'btn', text: 'Export template .pot', title: 'Empty file with the original texts only', onclick: () => U.download((U.slug(P.meta.name) || 'game') + '.pot', I.toPO(P, null), 'text/plain') }),
      el('button', { class: 'btn', text: 'Export CSV (all)', title: 'Spreadsheet with one column per language', onclick: () => U.download((U.slug(P.meta.name) || 'game') + '_translations.csv', I.toCSV(P), 'text/csv') })),
      el('div', { class: 'btn-row wrap' },
        el('button', { class: 'btn', text: 'Import .po into ' + (lang.name || lang.code), onclick: () => pick('.po,.pot,text/plain', (n, t) => { msg(I.importEntries(P, code, I.fromPO(t).entries)); R.model.touch(); redraw(); }) }),
        el('button', { class: 'btn', text: 'Import CSV', onclick: () => pick('.csv,text/csv', (n, t) => { try { msg(I.importCSV(P, t)); R.model.touch(); redraw(); } catch (e) { alert(e.message); } }) }),
        st.obsolete ? el('button', { class: 'btn', text: 'Remove unused', onclick: () => { I.purge(P, entries); R.model.touch(); redraw(); } }) : null));

    host.append(el('h3', { text: 'Texts' }), el('div', { class: 'pair' },
      el('input', { type: 'text', placeholder: 'Search…', value: query, oninput: e => { query = e.target.value; shown = PAGE; list(); } }),
      el('select', { onchange: e => { filter = e.target.value; shown = PAGE; list(); } }, [['all', 'All'], ['todo', 'Untranslated'], ['bad', 'Check [vars]']].map(o => el('option', { value: o[0], selected: o[0] === filter, text: o[1] })))));
    const box = el('div', { class: 'tr-list' }); host.append(box);
    function list() {
      box.replaceChildren();
      const q = query.toLowerCase();
      const rows = entries.filter(e => {
        const t = I.get(P, e.text, code);
        if (q && !(e.text + ' ' + t).toLowerCase().includes(q)) return false;
        return filter === 'all' || (filter === 'todo' ? !t : t && I.placeholders(t) !== I.placeholders(e.text));
      });
      rows.slice(0, shown).forEach(e => {
        const t = I.get(P, e.text, code), bad = t && I.placeholders(t) !== I.placeholders(e.text);
        box.append(el('div', { class: 'tr-row' + (bad ? ' bad' : '') },
          el('div', { class: 'tr-src', text: e.text }), el('small', { text: e.kind + (e.notes[0] ? ' · ' + e.notes[0] : '') }),
          el('textarea', { rows: Math.min(5, Math.max(1, Math.ceil(e.text.length / 38))), placeholder: 'Translation', text: t, oninput: ev => { I.set(P, e.text, code, ev.target.value); R.model.touch(); ev.target.parentNode.classList.toggle('bad', ev.target.value && I.placeholders(ev.target.value) !== I.placeholders(e.text)); } }),
          bad ? el('small', { class: 'warn', text: 'Keep the same [variables] and {tags} as the original.' }) : null));
      });
      if (rows.length > shown) box.append(el('button', { class: 'btn small', text: 'Show more (' + (rows.length - shown) + ')', onclick: () => { shown += PAGE; list(); } }));
      if (!rows.length) box.append(el('p', { class: 'hint', text: 'Nothing to show.' }));
    }
    list();
  }
  R.panels.register('translations', 'Translate', render);
})(RVN);
