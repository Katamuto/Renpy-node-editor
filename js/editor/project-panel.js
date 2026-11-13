/* "Story" tab: project name/version, characters and variables (variables become `default` statements). */
(function (R) {
  const el = R.el;
  R.panels.register('story', 'Story', function (host) {
    const p = R.state.project;
    const meta = (key, label) => el('label', { class: 'field' }, el('span', { text: label }),
      el('input', { type: 'text', value: p.meta[key] || '', oninput: e => { p.meta[key] = e.target.value; R.model.touch(); }, onchange: () => R.history.record() }));
    const fontSel = (key, label) => el('label', { class: 'field' }, el('span', { text: label }),
      el('select', { onchange: e => { p.meta[key] = e.target.value; R.model.commit(); } },
        [el('option', { value: '', text: '(Ren\'Py default)' })].concat(R.assets.fonts(p).map(a => el('option', { value: a.id, selected: a.id === p.meta[key], text: a.name })))));
    host.append(el('h3', { text: 'Project' }), meta('name', 'Game name'), meta('version', 'Version'),
      el('h3', { text: 'Fonts' }), fontSel('fontText', 'Dialogue and character names'), fontSel('fontUi', 'Menus and buttons (empty = same as dialogue)'),
      el('p', { class: 'hint', text: 'Import .ttf / .otf files in the Assets tab.' }),
      el('h3', { text: 'Characters' }), el('p', { class: 'hint', text: 'id is used in the script (e "Hello"). Color tints the name.' }),
      R.ui.listEditor({ items: p.characters, columns: [{ key: 'id', label: 'id' }, { key: 'name', label: 'Display name' }, { key: 'color', label: 'Color', type: 'color' }],
        make: () => ({ id: 'c' + (p.characters.length + 1), name: 'New character', color: '#ffffff' }), addLabel: '+ Add character' }),
      el('h3', { text: 'Variables' }), el('p', { class: 'hint', text: 'Declared with "default". Value is a Python expression.' }),
      R.ui.listEditor({ items: p.variables, columns: [{ key: 'name', label: 'name' }, { key: 'value', label: 'initial value' }],
        make: () => ({ name: 'points', value: '0' }), addLabel: '+ Add variable' }));
  });
})(RVN);
