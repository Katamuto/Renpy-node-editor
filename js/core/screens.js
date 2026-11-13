/* Helpers for screens designed in the Screens tab.
   project.screens = [{id, name, modal, layout:'vbox'|'hbox', xalign, yalign, spacing, bgKind:'none'|'color'|'image', bgValue, bgOpacity,
                       elements:[{id, type:'text'|'button'|'image'|'input', text, size, color, action:'exit'|'close'|'setvar'|'jump',
                                  varName, varValue, target(label node id), image, variable, length}]}]
   Buttons with action "exit" become EXIT PORTS on a "call screen" node: each exit leads to its own branch of the story. */
(function (R) {
  const U = R.util, S = R.screens = {};
  S.find = (project, id) => project.screens.find(s => s.id === id) || null;
  S.ident = (project, screen) => {
    const used = new Set();
    for (const s of project.screens) {
      const base = U.ident(s.name, 'screen'); let nm = base, i = 2;
      while (used.has(nm)) nm = base + '_' + i++;
      used.add(nm); if (s === screen) return nm;
    }
    return U.ident(screen && screen.name, 'screen');
  };
  S.exits = (s) => s.elements.filter(e => e.type === 'button' && e.action === 'exit').map(e => ({ id: e.id, label: e.text || 'exit' }));
  S.hasClose = (s) => s.elements.some(e => e.type === 'button' && e.action === 'close');
  S.outputsFor = (s) => {
    const ex = S.exits(s), ports = ex.slice();
    if (!ex.length || S.hasClose(s)) ports.push({ id: 'next', label: ex.length ? '(closed)' : '' });
    return ports;
  };
  S.create = () => ({ id: U.uid('s'), name: 'my_screen', modal: true, layout: 'vbox', xalign: 0.5, yalign: 0.5, spacing: 20, bgKind: 'color', bgValue: '#000000', bgOpacity: 0.6,
    elements: [{ id: U.uid('e'), type: 'text', text: 'Title', size: 60, color: '#ffffff' }, { id: U.uid('e'), type: 'button', text: 'Option A', action: 'exit' }, { id: U.uid('e'), type: 'button', text: 'Option B', action: 'exit' }] });
  S.element = (type) => {
    const e = { id: U.uid('e'), type };
    if (type === 'text') Object.assign(e, { text: 'Some text', size: '', color: '' });
    if (type === 'button') Object.assign(e, { text: 'Button', action: 'exit', varName: '', varValue: '', target: '' });
    if (type === 'image') Object.assign(e, { image: '' });
    if (type === 'input') Object.assign(e, { variable: 'player_name', length: 16 });
    return e;
  };
})(RVN);
