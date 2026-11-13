/* Graph analysis for export. Decides where Ren'Py labels are needed.
   Rules:
   - roots = Start + every Label node (labels are reachable by Jump nodes)
   - "head" nodes get a label: Label nodes, and any node with 2+ incoming links (a MERGE or a LOOP target)
   - containers are flattened first (core/flatten.js), so nesting never changes the exported story
   - everything else is emitted inline, so single-path branches read like hand-written Ren'Py
   Returns { nodes, out, order, seen, indeg, heads(Map nodeId->label), startTarget, warnings } */
(function (R) {
  const U = R.util;
  R.analyzeGraph = function (project) {
    const flat = R.flatten(project), nodes = new Map(flat.nodes.map(n => [n.id, n]));
    const out = new Map(), adj = new Map(), warnings = flat.warnings.slice();
    flat.links.forEach(l => {
      if (!nodes.has(l.from) || !nodes.has(l.to)) return;
      out.set(l.from + '|' + l.port, l.to);
      if (!adj.has(l.from)) adj.set(l.from, []);
      adj.get(l.from).push(l.to);
    });
    const start = flat.nodes.find(n => n.type === 'start');
    const labelNodes = flat.nodes.filter(n => n.type === 'label');
    if (!start) warnings.push({ msg: 'There is no Start node' });

    const roots = (start ? [start] : []).concat(labelNodes).map(n => n.id);
    const seen = new Set(roots), order = [], queue = roots.slice();
    while (queue.length) {
      const id = queue.shift(); order.push(id);
      (adj.get(id) || []).forEach(t => { if (!seen.has(t)) { seen.add(t); queue.push(t); } });
    }
    const indeg = new Map();
    flat.links.forEach(l => { if (seen.has(l.from) && nodes.has(l.to)) indeg.set(l.to, (indeg.get(l.to) || 0) + 1); });

    const heads = new Map(), used = new Set(['start']);
    labelNodes.forEach(n => {
      const base = U.ident(n.data.name, 'label');
      let nm = base, i = 2;
      while (used.has(nm)) nm = base + '_' + i++;
      if (nm !== base) warnings.push({ nodeId: n.id, msg: 'Label name "' + n.data.name + '" is duplicated or reserved, renamed to ' + nm });
      used.add(nm); heads.set(n.id, nm);
    });
    let k = 1;
    order.forEach(id => {
      if (heads.has(id) || nodes.get(id).type === 'start') return;
      if ((indeg.get(id) || 0) >= 2) { let nm; do { nm = 'part_' + k++; } while (used.has(nm)); used.add(nm); heads.set(id, nm); }
    });

    const startTarget = start ? (out.get(start.id + '|next') || null) : null;
    if (start && !startTarget) warnings.push({ nodeId: start.id, msg: 'Start is not connected to anything' });
    // If the first node is also a merge/loop target, it simply becomes "label start".
    if (startTarget && heads.has(startTarget) && nodes.get(startTarget).type !== 'label') heads.set(startTarget, 'start');

    flat.nodes.forEach(n => {
      if (!seen.has(n.id) && n.type !== 'comment') warnings.push({ nodeId: n.id, msg: 'Not reachable from Start (or a Label), it will not be exported' });
    });
    return { nodes, out, order, seen, indeg, heads, startTarget, warnings };
  };
})(RVN);
