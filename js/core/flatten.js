/* Containers hold a whole board (nodes + links + groups) inside node.data. These helpers walk / flatten that tree.
   flatten(project) -> {nodes, links, warnings}: containers disappear. Each container input becomes an invisible pass-through node
   (ginput) and each output another (goutput); outer links are re-pointed to them, so the exporter only ever sees a plain graph.
   Node ids are unique across the whole project, so jump targets and warnings keep working unchanged. */
(function (R) {
  R.allBoards = function (project) {
    const out = [];
    (function walk(b) { out.push(b); b.nodes.forEach(n => { if (n.type === 'container') walk(n.data); }); })(project);
    return out;
  };
  R.allNodes = (project) => R.allBoards(project).reduce((a, b) => a.concat(b.nodes), []);
  R.findNode = (project, id) => R.allNodes(project).find(n => n.id === id) || null;

  R.flatten = function (project) {
    const nodes = [], links = [], warnings = [];
    (function walk(b) {
      const byId = new Map(b.nodes.map(n => [n.id, n]));
      b.nodes.forEach(n => { if (n.type === 'container') walk(n.data); else nodes.push(n); });
      const end = (c, type, key) => c.data.nodes.find(x => x.type === type && x.data.key === key);
      b.links.forEach(l => {
        const f = byId.get(l.from), t = byId.get(l.to); if (!f || !t) return;
        let from = l.from, port = l.port, to = l.to;
        if (f.type === 'container') {
          const g = end(f, 'goutput', l.port);
          if (!g) { warnings.push({ nodeId: f.id, msg: 'A container output no longer exists, its arrow was ignored' }); return; }
          from = g.id; port = 'next';
        }
        if (t.type === 'container') {
          const g = end(t, 'ginput', l.toPort || 'in');
          if (!g) { warnings.push({ nodeId: t.id, msg: 'A container input no longer exists, its arrow was ignored' }); return; }
          to = g.id;
        }
        links.push({ id: l.id, from, port, to, toPort: 'in' });
      });
    })(project);
    return { nodes, links, warnings };
  };
})(RVN);
