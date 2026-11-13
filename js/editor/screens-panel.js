/* "Screens" tab: a small visual designer for screens (menus, choice boards, name entry...).
   Pick a layout, add text / buttons / images / inputs, see a live preview. Buttons with action "exit" become exit ports on the
   "Screen (call)" node, so each button can lead to a different branch of the story. Exported to game/custom_screens.rpy. */
(function (R) {
  const el = R.el, SC = R.screens;
  let cur = null;
  const ACTIONS = [['exit', 'Exit through its own arrow'], ['close', 'Close screen (continue)'], ['setvar', 'Set a variable (stay)'], ['jump', 'Jump to a label']];
  const TYPES = { text: '𝐓 Text', button: '▭ Button', image: '🖼 Image', input: '⌨ Input' };

  function preview(s) {
    const P = R.state.project, k = 100 / 19.2;     // 1920 px design width -> cqw
    const box = el('div', { class: 'sp-preview' });
    if (s.bgKind === 'color') box.style.background = s.bgValue + Math.round((s.bgOpacity == null ? 1 : s.bgOpacity) * 255).toString(16).padStart(2, '0');
    else box.style.background = '#1d2230';
    if (s.bgKind === 'image') { const a = P.assets.find(x => x.name === s.bgValue); if (a) { box.style.backgroundImage = 'url(' + R.assets.url(a) + ')'; box.style.backgroundSize = 'cover'; } }
    const lay = el('div', { class: 'sp-layout', style: 'left:' + s.xalign * 100 + '%;top:' + s.yalign * 100 + '%;transform:translate(-' + s.xalign * 100 + '%,-' + s.yalign * 100 + '%);flex-direction:' + (s.layout === 'hbox' ? 'row' : 'column') + ';gap:' + (s.spacing * k) + 'cqw' });
    s.elements.forEach(e => {
      if (e.type === 'text') lay.append(el('div', { class: 'sp-text', text: e.text, style: 'font-size:' + ((Number(e.size) || 33) * k) + 'cqw;color:' + (e.color || '#fff') }));
      else if (e.type === 'button') lay.append(el('div', { class: 'sp-btn', text: e.text, style: 'font-size:' + (33 * k) + 'cqw' }));
      else if (e.type === 'input') lay.append(el('div', { class: 'sp-input', text: '[' + (e.variable || 'input') + ']', style: 'font-size:' + (33 * k) + 'cqw' }));
      else if (e.type === 'image') { const a = P.assets.find(x => x.name === e.image); lay.append(a ? el('img', { src: R.assets.url(a), style: 'max-width:30cqw;max-height:30cqw' }) : el('div', { class: 'sp-img', text: e.image || 'image' })); }
    });
    box.append(lay); return box;
  }

  function render(host) {
    const P = R.state.project;
    let s = SC.find(P, cur) || P.screens[0]; cur = s ? s.id : null;
    const redraw = () => R.panels.refresh('screens');
    const structural = () => { R.model.syncPorts(); R.model.commit(); redraw(); };
    host.append(el('h3', { text: 'Screen designer' }),
      el('div', { class: 'btn-row wrap' },
        P.screens.length ? el('select', { onchange: e => { cur = e.target.value; redraw(); } }, P.screens.map(x => el('option', { value: x.id, selected: x.id === cur, text: x.name }))) : null,
        el('button', { class: 'btn', text: '+ New screen', onclick: () => { const n = SC.create(); n.name = 'screen_' + (P.screens.length + 1); P.screens.push(n); cur = n.id; structural(); } }),
        s ? el('button', { class: 'btn danger', text: 'Delete', onclick: () => { P.screens.splice(P.screens.indexOf(s), 1); cur = null; structural(); } }) : null));
    if (!s) { host.append(el('p', { class: 'hint', text: 'Create a screen, then use a "Screen" node (call) to show it. Buttons marked "Exit" give the node one arrow each.' })); return; }

    let pv = preview(s); host.append(pv);
    const live = () => { const n = preview(s); pv.replaceWith(n); pv = n; R.model.touch(); R.events.emit('nodes:refresh'); };
    const field = (label, input) => el('label', { class: 'field' }, el('span', { text: label }), input);
    const txt = (obj, key, ph) => el('input', { type: 'text', value: obj[key] == null ? '' : obj[key], placeholder: ph || '', oninput: e => { obj[key] = e.target.value; live(); }, onchange: () => R.history.record() });
    const num = (obj, key, step, min, max) => el('input', { type: 'number', step, min, max, value: obj[key], oninput: e => { obj[key] = parseFloat(e.target.value) || 0; live(); }, onchange: () => R.history.record() });
    const sel = (opts, obj, key, after) => el('select', { onchange: e => { obj[key] = e.target.value; R.history.record(); (after || live)(); } }, opts.map(o => el('option', { value: o[0], selected: o[0] === obj[key], text: o[1] })));

    host.append(
      field('Screen name', txt(s, 'name', 'my_screen')),
      el('div', { class: 'grid2' },
        field('Layout', sel([['vbox', 'Vertical'], ['hbox', 'Horizontal']], s, 'layout')), field('Spacing (px)', num(s, 'spacing', 1, 0)),
        field('Horizontal position (0-1)', num(s, 'xalign', 0.05, 0, 1)), field('Vertical position (0-1)', num(s, 'yalign', 0.05, 0, 1))),
      field('Background', el('div', { class: 'pair' }, sel([['none', 'None'], ['color', 'Color'], ['image', 'Image']], s, 'bgKind', redraw),
        s.bgKind === 'color' ? el('input', { type: 'color', value: s.bgValue, oninput: e => { s.bgValue = e.target.value; live(); }, onchange: () => R.history.record() })
          : s.bgKind === 'image' ? txt(s, 'bgValue', 'image name') : null)),
      s.bgKind === 'color' ? field('Background opacity (0-1)', num(s, 'bgOpacity', 0.05, 0, 1)) : null,
      el('label', { class: 'field inline' }, el('input', { type: 'checkbox', checked: !!s.modal, onchange: e => { s.modal = e.target.checked; R.history.record(); live(); } }), el('span', { text: 'Modal (blocks the story behind it)' })),
      el('h4', { class: 'sec', text: 'Elements' }));

    s.elements.forEach((e, i) => {
      const card = el('div', { class: 'el-card' }), head = el('div', { class: 'el-head' }, el('strong', { text: TYPES[e.type] }), el('span', { class: 'grow' }),
        el('button', { class: 'icon-btn', text: '↑', title: 'Move up', onclick: () => { if (i) { s.elements.splice(i - 1, 0, s.elements.splice(i, 1)[0]); structural(); } } }),
        el('button', { class: 'icon-btn', text: '↓', title: 'Move down', onclick: () => { if (i < s.elements.length - 1) { s.elements.splice(i + 1, 0, s.elements.splice(i, 1)[0]); structural(); } } }),
        el('button', { class: 'icon-btn', text: '✕', title: 'Remove', onclick: () => { s.elements.splice(i, 1); structural(); } }));
      card.append(head);
      if (e.type === 'text') card.append(field('Text', txt(e, 'text')), el('div', { class: 'grid2' }, field('Size (blank = default)', num(e, 'size', 1, 0)), field('Color', el('input', { type: 'color', value: e.color || '#ffffff', oninput: ev => { e.color = ev.target.value; live(); }, onchange: () => R.history.record() }))),
        R.assets.fonts(P).length ? field('Font', sel([['', '(game font)']].concat(R.assets.fonts(P).map(a => [a.id, a.name])), e, 'font', () => {})) : null);
      if (e.type === 'button') {
        card.append(field('Label', el('input', { type: 'text', value: e.text, oninput: ev => { e.text = ev.target.value; live(); }, onchange: () => R.history.record() })), field('When clicked', sel(ACTIONS, e, 'action', structural)));
        if (e.action === 'setvar') card.append(el('div', { class: 'grid2' }, field('Variable', txt(e, 'varName', 'points')), field('Value', txt(e, 'varValue', '1'))));
        if (e.action === 'jump') card.append(field('Label', sel([['', '(choose a label node)']].concat(R.allNodes(P).filter(n => n.type === 'label').map(n => [n.id, n.data.name || '(unnamed)'])), e, 'target')));
        if (e.action === 'exit') card.append(el('p', { class: 'hint', text: '→ gets its own arrow on the Screen node.' }));
      }
      if (e.type === 'image') card.append(field('Image name', txt(e, 'image', 'image name')));
      if (e.type === 'input') card.append(el('div', { class: 'grid2' }, field('Stores text in variable', txt(e, 'variable', 'player_name')), field('Max length', num(e, 'length', 1, 1))), el('p', { class: 'hint', text: 'Declare the variable in the Story tab (e.g. player_name = "").' }));
      host.append(card);
    });
    host.append(el('div', { class: 'btn-row wrap' }, Object.keys(TYPES).map(t => el('button', { class: 'btn small', text: '+ ' + TYPES[t], onclick: () => { s.elements.push(SC.element(t)); structural(); } }))));
  }
  R.panels.register('screens', 'Screens', render);
})(RVN);
