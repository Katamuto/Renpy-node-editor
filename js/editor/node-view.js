/* Creates / updates the DOM element of each node (of the board being shown) and subscribes to model events. */
(function (R) {
  const el = R.el, NV = R.nodeView = {};
  const clip = (s) => { s = String(s == null ? '' : s); return s.length > 90 ? s.slice(0, 90) + '…' : s; };

  NV.build = function (node) {
    const def = R.registry.get(node.type), outs = R.model.outputs(node), ins = R.model.inputs(node);
    let summary = '', title = def.label;
    try { summary = def.summary ? def.summary(node) : ''; if (def.title) title = def.title(node); } catch (e) { summary = '(invalid data)'; }
    const inPort = (i) => el('div', { class: 'port in', 'data-node': node.id, 'data-port': i.id, title: 'Input (many arrows can end here = merge)' });
    return el('div', { class: 'node cat-' + def.category.toLowerCase() + ' t-' + node.type, 'data-id': node.id, style: 'transform:translate(' + node.x + 'px,' + node.y + 'px)' },
      el('div', { class: 'node-head' }, ins.length === 1 ? inPort(ins[0]) : null,
        el('span', { class: 'icon', text: def.icon || '' }), el('span', { class: 'title', text: clip(title) })),
      el('div', { class: 'node-body', text: clip(summary) }),
      ins.length > 1 ? el('div', { class: 'node-ins' }, ins.map(i => el('div', { class: 'in-row' }, inPort(i), el('span', { class: 'out-label', text: clip(i.label) })))) : null,
      outs.length ? el('div', { class: 'node-outs' }, outs.map(o => el('div', { class: 'out-row' },
        el('span', { class: 'out-label', text: clip(o.label) }),
        el('div', { class: 'port out', 'data-node': node.id, 'data-port': o.id, title: 'Drag to a node to connect' })))) : null);
  };
  const find = (id) => R.canvas.nodesLayer.querySelector('[data-id="' + id + '"]');

  NV.renderAll = function () { R.canvas.nodesLayer.replaceChildren(...R.model.board().nodes.map(NV.build)); NV.refresh(); };
  NV.refresh = function () {
    const sel = R.state.selection.nodeIds;
    R.canvas.nodesLayer.querySelectorAll('.node').forEach(n => n.classList.toggle('selected', sel.includes(n.dataset.id)));
    R.canvas.nodesLayer.querySelectorAll('.port.out').forEach(p => p.classList.toggle('open', !R.model.linkFrom(p.dataset.node, p.dataset.port)));
  };

  NV.init = function () {
    const E = R.events;
    E.on('graph:rebuild', () => { NV.renderAll(); R.links.redraw(); });
    E.on('node:updated', id => { const old = find(id), n = R.model.node(id); if (old && n) { old.replaceWith(NV.build(n)); NV.refresh(); R.links.redraw(); } });
    E.on('nodes:moved', ids => { ids.forEach(id => { const e = find(id), n = R.model.node(id); if (e && n) e.style.transform = 'translate(' + n.x + 'px,' + n.y + 'px)'; }); R.links.redraw(); });
    E.on('nodes:refresh', () => { NV.renderAll(); R.links.redraw(); });
    E.on('links:changed', () => { NV.refresh(); R.links.redraw(); });
    E.on('selection:changed', () => { NV.refresh(); R.links.redraw(); });
  };
})(RVN);
