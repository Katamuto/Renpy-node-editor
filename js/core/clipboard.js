/* Copy / cut / paste / duplicate of a node selection (current board). The payload is plain JSON, so it also works through the
   system clipboard (another tab, another project). Links between copied nodes are kept, groups fully inside the selection are kept,
   containers are copied with everything inside (all ids are renewed), the Start node is never copied. */
(function (R) {
  const U = R.util, M = R.model, K = R.clipboard = { data: null };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  K.copy = function () {
    const b = M.board(), ids = M.selectedIds().filter(id => { const n = M.node(id); return n && !R.registry.get(n.type).unique && !R.registry.get(n.type).inner; });
    if (!ids.length) return null;
    const set = new Set(ids);
    K.data = clone({ rvnClipboard: 1,
      nodes: b.nodes.filter(n => set.has(n.id)),
      links: b.links.filter(l => set.has(l.from) && set.has(l.to)),
      groups: b.groups.filter(g => g.nodeIds.every(id => set.has(id))) });
    return JSON.stringify(K.data);
  };

  K.cut = function () { const j = K.copy(); if (j) M.removeNodes(M.selectedIds()); return j; };

  // pos = world position for the top-left corner of the pasted block
  K.paste = function (payload, pos) {
    payload = payload || K.data; if (!payload || !payload.nodes || !payload.nodes.length) return false;
    const P = R.state.project, map = {}, p = clone(payload);
    const x0 = Math.min(...p.nodes.map(n => n.x)), y0 = Math.min(...p.nodes.map(n => n.y));
    pos = pos || (R.canvas && (R.canvas.mouse || R.canvas.viewCenter())) || { x: 0, y: 0 };
    const taken = new Set(R.allNodes(P).filter(n => n.type === 'label').map(n => n.data.name));
    const collect = (nodes) => nodes.forEach(n => { map[n.id] = U.uid('n'); if (n.type === 'container') collect(n.data.nodes); });
    const apply = (nodes, links, groups) => {
      nodes.forEach(n => {
        n.id = map[n.id];
        if (n.type === 'label' && taken.has(n.data.name)) n.data.name += '_copy';
        if (n.type === 'jump' && map[n.data.target]) n.data.target = map[n.data.target];
        if (n.type === 'container') apply(n.data.nodes, n.data.links, n.data.groups);
      });
      links.forEach(l => { l.id = U.uid('l'); l.from = map[l.from]; l.to = map[l.to]; });
      groups.forEach(g => { g.id = U.uid('g'); g.nodeIds = g.nodeIds.map(id => map[id]); });
    };
    collect(p.nodes); apply(p.nodes, p.links, p.groups);
    p.nodes.forEach(n => { n.x = Math.round((n.x - x0 + pos.x) / 10) * 10; n.y = Math.round((n.y - y0 + pos.y) / 10) * 10; });
    M.addNodes(p.nodes, p.links, p.groups);
    return true;
  };

  K.duplicate = function () {
    if (!K.copy()) return;
    const ns = M.selectedIds().map(M.node).filter(Boolean);
    K.paste(K.data, { x: Math.min(...ns.map(n => n.x)) + 40, y: Math.min(...ns.map(n => n.y)) + 40 });
  };

  // Writes to the system clipboard when possible (copy/cut buttons); keyboard shortcuts use the clipboard events instead.
  K.toSystem = (json) => { if (json && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).catch(() => {}); };
})(RVN);
