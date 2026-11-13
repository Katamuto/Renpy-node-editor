/* "Node" tab: form generated from the node type's `fields`.
   Field kinds: text, number, textarea, code, select(options), character, image, audio, checkbox, labelref, choices. */
(function (R) {
  const el = R.el, M = R.model;

  function assetNames(kind) { return R.state.project.assets.filter(a => a.kind === kind).map(a => kind === 'image' ? a.name : a.path); }

  function control(node, f) {
    const val = node.data[f.key];
    const set = (v) => M.updateNode(node.id, { [f.key]: v }), done = () => R.history.record();
    switch (f.kind) {
      case 'textarea': case 'code':
        return el('textarea', { rows: f.rows || 3, class: f.kind === 'code' ? 'mono' : '', placeholder: f.placeholder || '', text: val == null ? '' : val, spellcheck: f.kind === 'code' ? 'false' : null, oninput: e => set(e.target.value), onchange: done });
      case 'number':
        return el('input', { type: 'number', step: 'any', value: val, oninput: e => set(parseFloat(e.target.value) || 0), onchange: done });
      case 'checkbox':
        return el('input', { type: 'checkbox', checked: !!val, onchange: e => { set(e.target.checked); done(); } });
      case 'select': case 'character': case 'labelref': {
        let opts;
        if (f.kind === 'select') opts = f.options.map(o => [o, o || '(none)']);
        else if (f.kind === 'character') opts = [['', '(narrator)']].concat(R.state.project.characters.map(c => [c.id, c.name ? c.name + ' (' + c.id + ')' : c.id]));
        else opts = [['', '(choose a label node)']].concat(R.allNodes(R.state.project).filter(n => n.type === 'label').map(n => [n.id, n.data.name || '(unnamed)']));
        return el('select', { onchange: e => { set(e.target.value); done(); } }, opts.map(o => el('option', { value: o[0], selected: o[0] === val, text: o[1] })));
      }
      case 'screenref': {
        const opts = [['', '(other: use the name below)']].concat(R.state.project.screens.map(x => [x.id, x.name]));
        return el('select', { onchange: e => { set(e.target.value); done(); R.panels.refresh('node'); } }, opts.map(o => el('option', { value: o[0], selected: o[0] === val, text: o[1] })));
      }
      case 'imagepick': return imagePicker(node, f);
      case 'image': case 'audio': {
        const id = 'dl-' + f.key;
        return el('div', {}, el('input', { type: 'text', list: id, value: val == null ? '' : val, placeholder: f.placeholder || '', oninput: e => set(e.target.value), onchange: done }),
          el('datalist', { id }, assetNames(f.kind).map(n => el('option', { value: n }))));
      }
      case 'choices': return choicesEditor(node, f);
      default:
        return el('input', { type: 'text', value: val == null ? '' : val, placeholder: f.placeholder || '', oninput: e => set(e.target.value), onchange: done });
    }
  }

  // Tag select (character / background family) + variant select, both built from the imported images (auto-labeled by file name).
  function imagePicker(node, f) {
    const P = R.state.project, tags = R.assets.tags(P, f.role === 'sprite' ? null : f.role), val = String(node.data[f.key] || '');
    const cur = R.assets.tagOf(val), fam = tags.find(t => t.tag === cur);
    const set = (v) => { M.updateNode(node.id, { [f.key]: v }); R.history.record(); R.panels.refresh('node'); };
    const box = el('div', { class: 'imgpick' });
    if (tags.length) {
      box.append(el('div', { class: 'pair' },
        el('select', { title: 'Image family', onchange: e => { const t = tags.find(x => x.tag === e.target.value); set(t ? t.variants[0].name : e.target.value); } },
          [el('option', { value: '', text: '(type a name)' })].concat(tags.map(t => el('option', { value: t.tag, selected: t.tag === cur, text: t.tag + ' (' + t.variants.length + ')' })))),
        fam ? el('select', { title: 'Variant', onchange: e => set(e.target.value) }, fam.variants.map(v => el('option', { value: v.name, selected: v.name === val, text: v.attrs || '(base)' }))) : null));
    }
    const id = 'dl-' + f.key;
    box.append(el('input', { type: 'text', list: id, value: val, placeholder: f.placeholder || '', oninput: e => M.updateNode(node.id, { [f.key]: e.target.value }), onchange: () => R.history.record() }),
      el('datalist', { id }, assetNames('image').map(n => el('option', { value: n }))));
    return box;
  }

  function choicesEditor(node, f) {
    const list = node.data[f.key], box = el('div', { class: 'choices' });
    const apply = (rerender) => { M.updateNode(node.id, { [f.key]: list }); R.history.record(); if (rerender) R.panels.refresh('node'); };
    list.forEach((c, i) => box.append(el('div', { class: 'choice' },
      el('input', { type: 'text', value: c.text, placeholder: 'Choice text', oninput: e => { c.text = e.target.value; M.updateNode(node.id, {}); }, onchange: () => R.history.record() }),
      el('input', { type: 'text', value: c.cond, placeholder: 'Show only if… (optional)', class: 'mono', oninput: e => { c.cond = e.target.value; M.touch(); }, onchange: () => R.history.record() }),
      el('button', { class: 'icon-btn', text: '✕', title: 'Remove choice (and its arrow)', onclick: () => { list.splice(i, 1); apply(true); } }))));
    box.append(el('button', { class: 'btn small', text: '+ Add choice', onclick: () => { list.push({ id: R.util.uid('c'), text: 'New option', cond: '' }); apply(true); } }));
    return box;
  }

  function multiPanel(host, ids, group) {
    const K = R.clipboard, row = el('div', { class: 'btn-row wrap' });
    if (group) {
      host.append(el('h3', { text: 'Group' }),
        el('label', { class: 'field' }, el('span', { text: 'Title' }), el('input', { type: 'text', value: group.title, oninput: e => M.updateGroup(group.id, { title: e.target.value }), onchange: () => R.history.record() })),
        el('label', { class: 'field' }, el('span', { text: 'Color' }), el('input', { type: 'color', value: group.color, oninput: e => M.updateGroup(group.id, { color: e.target.value }), onchange: () => R.history.record() })));
    } else host.append(el('h3', { text: ids.length + ' nodes selected' }), el('p', { class: 'hint', text: 'Drag any of them to move all. Ctrl+G groups them.' }));
    if (group) row.append(el('button', { class: 'btn', text: 'Ungroup', onclick: () => M.ungroup(group.id) }));
    else row.append(el('button', { class: 'btn', text: 'Combine into container', onclick: () => M.makeContainer(ids) }), el('button', { class: 'btn', text: 'Frame', onclick: () => M.groupSelected() }));
    row.append(el('button', { class: 'btn', text: 'Copy', onclick: () => K.toSystem(K.copy()) }), el('button', { class: 'btn', text: 'Cut', onclick: () => K.toSystem(K.cut()) }),
      el('button', { class: 'btn', text: 'Duplicate', onclick: () => K.duplicate() }), el('button', { class: 'btn danger', text: 'Delete nodes', onclick: () => M.removeNodes(ids) }));
    host.append(row);
  }

  function render(host) {
    const sel = R.state.selection;
    if (sel.linkId) {
      host.append(el('h3', { text: 'Link' }), el('p', { class: 'hint', text: 'Press Delete (or double-click the arrow) to remove it.' }),
        el('button', { class: 'btn danger', text: 'Delete link', onclick: () => M.removeLink(sel.linkId) }));
      return;
    }
    if (sel.groupId) { multiPanel(host, sel.nodeIds, R.state.project.groups.find(g => g.id === sel.groupId)); return; }
    if (sel.nodeIds.length > 1) { multiPanel(host, sel.nodeIds, null); return; }
    const node = M.node(sel.nodeIds[0]);
    if (!node) {
      host.append(el('h3', { text: 'How it works' }), el('ul', { class: 'hint' },
        el('li', { text: 'Add nodes from the left palette (or right-click the canvas).' }),
        el('li', { text: 'Drag from an output dot (●) onto a node to connect them.' }),
        el('li', { text: 'Menus, conditions and screens with exit buttons have several exits: that is how the story branches.' }),
        el('li', { text: 'Several arrows may enter the same node: that merges the branches again.' }),
        el('li', { text: 'Shift+drag the background (or use the Select tool) to box-select. Ctrl+C / X / V copy, cut, paste. Ctrl+G groups.' }),
        el('li', { text: 'Wheel = zoom, drag background = pan, Delete = remove selection.' })));
      return;
    }
    const def = R.registry.get(node.type);
    host.append(el('h3', { text: (def.icon || '') + ' ' + def.label }));
    def.fields.forEach(f => host.append(el('label', { class: 'field' }, el('span', { text: f.label }), control(node, f))));
    if (!def.fields.length) host.append(el('p', { class: 'hint', text: def.summary ? def.summary(node) : '' }));
    const row = el('div', { class: 'btn-row wrap' });
    (def.actions || []).forEach(a => row.append(el('button', { class: 'btn', text: a.label, onclick: () => a.run(node) })));
    if (R.desktop.isDesktop()) row.append(el('button', { class: 'btn', text: '▶ Play from here', title: 'Start the game at this node (needs the SDK set in the Play tab)', onclick: () => R.desktop.play(node.id) }));
    if (!def.unique) row.append(el('button', { class: 'btn', text: 'Duplicate', onclick: () => R.clipboard.duplicate() }));
    if (!def.undeletable) row.append(el('button', { class: 'btn danger', text: 'Delete', onclick: () => M.removeNode(node.id) }));
    host.append(row);
  }
  R.panels.register('node', 'Node', render);
})(RVN);
