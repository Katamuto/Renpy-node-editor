/* Project model: the single source of truth. All edits go through RVN.model.
   project = { format:'rvn', version:2, meta:{name,version,fontText,fontUi}, characters, variables, assets, groups, screens, translations,
               nodes:[{id,type,x,y,data}], links:[{id,from,port,to,toPort}] }
   A node of type "container" stores its own board in data: {title, nodes, links, groups}. state.path = ids of the containers we are
   inside (the breadcrumb); model.board() is the board currently shown. selection = { nodeIds, linkId, groupId } (current board only). */
(function (R) {
  const S = R.state = { project: null, path: [], views: {}, needFit: false, selection: { nodeIds: [], linkId: null, groupId: null }, view: { x: 60, y: 60, z: 1 }, dirty: false, tool: 'pan' };
  const M = R.model = {}, U = R.util;

  M.newProject = function () {
    const a = U.uid('n'), b = U.uid('n'), c = U.uid('n');
    return {
      format: 'rvn', version: 2,
      meta: { name: 'My Visual Novel', version: '1.0', fontText: '', fontUi: '' },
      characters: [{ id: 'e', name: 'Eileen', color: '#c8ffc8' }],
      variables: [], assets: [], groups: [], screens: [],
      translations: { base: 'English', languages: [], strings: {} },
      nodes: [
        { id: a, type: 'start', x: 60, y: 80, data: {} },
        { id: b, type: 'dialogue', x: 340, y: 80, data: { who: 'e', text: 'Hello! This is your new story.' } },
        { id: c, type: 'end', x: 640, y: 80, data: {} }
      ],
      links: [{ id: U.uid('l'), from: a, port: 'next', to: b, toPort: 'in' }, { id: U.uid('l'), from: b, port: 'next', to: c, toPort: 'in' }]
    };
  };

  function normalizeBoard(b) {
    ['nodes', 'links', 'groups'].forEach(k => { if (!Array.isArray(b[k])) b[k] = []; });
    b.links.forEach(l => { if (!l.toPort) l.toPort = 'in'; });
    b.nodes.forEach(n => { if (n.type === 'container') normalizeBoard(n.data); });
  }
  function normalize(p) {
    p.version = 2;
    p.meta = Object.assign({ name: 'My Visual Novel', version: '1.0', fontText: '', fontUi: '' }, p.meta);
    ['characters', 'variables', 'assets', 'screens'].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; });
    normalizeBoard(p);
    p.translations = Object.assign({ base: 'English', languages: [], strings: {} }, p.translations);
    p.assets.forEach(R.assets.normalize);
    p.screens.forEach(s => { if (!Array.isArray(s.elements)) s.elements = []; });
    if (!p.nodes.some(n => n.type === 'start')) p.nodes.unshift({ id: U.uid('n'), type: 'start', x: 60, y: 80, data: {} });
    return p;
  }

  M.setProject = function (p) {
    S.project = normalize(p); S.path = []; S.views = {}; S.needFit = false;
    S.selection = { nodeIds: [], linkId: null, groupId: null }; S.dirty = false;
    R.history.reset();
    R.events.emit('graph:rebuild'); R.events.emit('selection:changed'); R.events.emit('board:changed'); R.events.emit('project:changed');
  };

  // --- boards / navigation ---
  const boardAt = (path) => { let b = S.project; for (const id of path) { const n = b.nodes.find(x => x.id === id); if (!n || n.type !== 'container') return null; b = n.data; } return b; };
  M.board = () => boardAt(S.path) || S.project;
  M.pathTo = (id) => { // containers to open in order to reach the board that holds node id
    let found = null;
    (function walk(b, path) { if (found) return; if (b.nodes.some(n => n.id === id)) { found = path; return; } b.nodes.forEach(n => { if (n.type === 'container') walk(n.data, path.concat(n.id)); }); })(S.project, []);
    return found;
  };
  M.goto = function (path) {
    if (!boardAt(path)) path = [];
    S.views[S.path.join('/')] = Object.assign({}, S.view);
    S.path = path.slice(); const saved = S.views[S.path.join('/')];
    S.needFit = !saved; if (saved) S.view = Object.assign({}, saved);
    S.selection = { nodeIds: [], linkId: null, groupId: null };
    R.events.emit('graph:rebuild'); R.events.emit('selection:changed'); R.events.emit('board:changed');
  };
  M.enter = (id) => { const n = M.node(id); if (n && n.type === 'container') M.goto(S.path.concat(id)); };
  M.up = () => { if (S.path.length) M.goto(S.path.slice(0, -1)); };
  M.crumbs = function () {
    const out = [{ title: 'Main', path: [] }]; let b = S.project;
    S.path.forEach((id, i) => { const n = b.nodes.find(x => x.id === id); if (!n) return; out.push({ title: n.data.title || 'Container', path: S.path.slice(0, i + 1) }); b = n.data; });
    return out;
  };

  // --- lookups on the current board ---
  M.node = (id) => M.board().nodes.find(n => n.id === id) || null;
  M.inputs = (node) => { const d = R.registry.get(node.type); return !d.inputs ? [] : d.inputs === true ? [{ id: 'in', label: '' }] : d.inputs(node); };
  M.outputs = (node) => R.registry.get(node.type).outputs(node);
  M.linkFrom = (id, port) => M.board().links.find(l => l.from === id && l.port === port) || null;
  M.groupOf = (nodeId) => M.board().groups.find(g => g.nodeIds.includes(nodeId)) || null;

  M.touch = () => { S.dirty = true; R.events.emit('project:changed'); };
  M.commit = () => { M.touch(); R.history.record(); };

  // --- selection ---
  M.selectedIds = () => S.selection.nodeIds.slice();
  M.primary = () => (S.selection.nodeIds.length === 1 ? S.selection.nodeIds[0] : null);
  // sel: {nodeId, add} | {nodeIds} | {groupId} | {linkId} | {}
  M.select = (sel) => {
    let ids = [], linkId = null, groupId = null;
    if (sel.groupId) { const g = M.board().groups.find(x => x.id === sel.groupId); if (g) { groupId = g.id; ids = g.nodeIds.slice(); } }
    else if (sel.nodeIds) ids = sel.nodeIds.slice();
    else if (sel.nodeId) {
      ids = sel.add ? S.selection.nodeIds.slice() : [];
      const i = ids.indexOf(sel.nodeId);
      if (sel.add && i >= 0) ids.splice(i, 1); else ids.push(sel.nodeId);
    }
    if (sel.linkId) linkId = sel.linkId;
    S.selection = { nodeIds: ids.filter(id => M.node(id)), linkId, groupId };
    R.events.emit('selection:changed');
  };

  // --- nodes ---
  M.addNode = function (type, x, y) {
    const def = R.registry.get(type), b = M.board();
    if (def.unique && R.allNodes(S.project).some(n => n.type === type)) return null;
    if (def.inner && !S.path.length) return null;
    const n = { id: U.uid('n'), type, x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10, data: def.defaults(S.project) };
    b.nodes.push(n);
    R.events.emit('graph:rebuild'); M.select({ nodeId: n.id }); M.commit();
    return n;
  };

  // Used by paste: nodes/links/groups must already have fresh ids.
  M.addNodes = function (nodes, links, groups) {
    const b = M.board(); b.nodes.push(...nodes); b.links.push(...links); b.groups.push(...(groups || []));
    R.events.emit('graph:rebuild'); M.select({ nodeIds: nodes.map(n => n.id) }); M.commit();
  };

  M.removeNodes = function (ids) {
    const b = M.board(), kill = new Set(ids.filter(id => { const n = M.node(id); return n && !R.registry.get(n.type).undeletable; }));
    if (!kill.size) return;
    b.nodes = b.nodes.filter(n => !kill.has(n.id));
    b.links = b.links.filter(l => !kill.has(l.from) && !kill.has(l.to));
    b.groups.forEach(g => { g.nodeIds = g.nodeIds.filter(id => !kill.has(id)); });
    b.groups = b.groups.filter(g => g.nodeIds.length);
    prune();
    R.events.emit('graph:rebuild'); M.select({}); M.commit();
  };
  M.removeNode = (id) => M.removeNodes([id]);

  // --- groups (frames) ---
  const GROUP_COLORS = ['#4a78c2', '#2f8f6b', '#8a5cc2', '#c77d2e', '#b04a6a', '#5b6477'];
  M.groupSelected = function () {
    const ids = M.selectedIds(), b = M.board(); if (!ids.length) return null;
    b.groups.forEach(g => { g.nodeIds = g.nodeIds.filter(id => !ids.includes(id)); });
    b.groups = b.groups.filter(g => g.nodeIds.length);
    const g = { id: U.uid('g'), title: 'Group ' + (b.groups.length + 1), color: GROUP_COLORS[b.groups.length % GROUP_COLORS.length], nodeIds: ids };
    b.groups.push(g);
    R.events.emit('groups:changed'); M.select({ groupId: g.id }); M.commit();
    return g;
  };
  M.ungroup = function (groupId) {
    const b = M.board(); b.groups = b.groups.filter(g => g.id !== groupId);
    R.events.emit('groups:changed'); M.select({ nodeIds: S.selection.nodeIds }); M.commit();
  };
  M.updateGroup = function (id, patch) {
    const g = M.board().groups.find(x => x.id === id); if (!g) return;
    Object.assign(g, patch); R.events.emit('groups:changed'); M.touch();
  };

  // --- links ---
  M.addLink = function (from, port, to, toPort) {
    const a = M.node(from), b = M.node(to);
    if (!a || !b || from === to) return false;
    const ins = M.inputs(b); if (!ins.length) return false;
    if (!ins.some(i => i.id === toPort)) toPort = ins[0].id;
    if (!M.outputs(a).some(o => o.id === port)) return false;
    const bd = M.board();
    bd.links = bd.links.filter(l => !(l.from === from && l.port === port));  // one exit per port
    bd.links.push({ id: U.uid('l'), from, port, to, toPort });
    R.events.emit('links:changed'); M.commit();
    return true;
  };
  M.removeLink = function (id) {
    const b = M.board(); b.links = b.links.filter(l => l.id !== id);
    R.events.emit('links:changed');
    if (S.selection.linkId === id) M.select({});
    M.commit();
  };

  // Drops links whose output or input port no longer exists (in every board: a container's ports depend on its inside).
  function prune() {
    let changed = false;
    R.allBoards(S.project).slice().reverse().forEach(b => {      // innermost first: container ports are computed from the inside
      const nodes = new Map(b.nodes.map(n => [n.id, n])), before = b.links.length;
      b.links = b.links.filter(l => {
        const f = nodes.get(l.from), t = nodes.get(l.to); if (!f || !t) return false;
        return M.outputs(f).some(o => o.id === l.port) && M.inputs(t).some(i => i.id === (l.toPort || 'in'));
      });
      if (b.links.length !== before) changed = true;
    });
    return changed;
  }

  // Merge a patch into node.data; drops links of ports that no longer exist. Caller decides when to record history.
  M.updateNode = function (id, patch) {
    const n = M.node(id); if (!n) return;
    Object.assign(n.data, patch);
    R.events.emit('node:updated', id);
    if (prune()) R.events.emit('links:changed');
    M.touch();
  };

  // After screens / characters change: recompute every node's ports, drop dead links, redraw nodes (panels stay as they are).
  M.syncPorts = function () { prune(); R.events.emit('nodes:refresh'); };

  // --- containers ---
  const labelOf = (node, port) => { const o = M.outputs(node).find(x => x.id === port); return (o && o.label) || ''; };

  // Combines the nodes into one container. Arrows crossing the border become the container's inputs and outputs.
  M.makeContainer = function (ids) {
    const b = M.board();
    const set = new Set(ids.filter(id => { const n = M.node(id); if (!n) return false; const d = R.registry.get(n.type); return !d.unique && !d.inner; }));
    if (!set.size) return null;
    const inside = b.nodes.filter(n => set.has(n.id));
    const internal = b.links.filter(l => set.has(l.from) && set.has(l.to));
    const incoming = b.links.filter(l => !set.has(l.from) && set.has(l.to));
    const outgoing = b.links.filter(l => set.has(l.from) && !set.has(l.to));
    const minX = Math.min(...inside.map(n => n.x)), minY = Math.min(...inside.map(n => n.y)), maxX = Math.max(...inside.map(n => n.x));
    const gIn = new Map(), gOut = new Map(), boundary = [], innerLinks = internal.map(l => Object.assign({}, l));
    incoming.forEach(l => {
      const k = l.to + '|' + (l.toPort || 'in'); if (gIn.has(k)) return;
      const g = { id: U.uid('n'), type: 'ginput', x: minX - 260, y: minY + gIn.size * 110, data: { key: U.uid('k'), label: 'in ' + (gIn.size + 1) } };
      gIn.set(k, g); boundary.push(g); innerLinks.push({ id: U.uid('l'), from: g.id, port: 'next', to: l.to, toPort: l.toPort || 'in' });
    });
    outgoing.forEach(l => {
      const k = l.from + '|' + l.port; if (gOut.has(k)) return;
      const g = { id: U.uid('n'), type: 'goutput', x: maxX + 330, y: minY + gOut.size * 110, data: { key: U.uid('k'), label: labelOf(M.node(l.from), l.port) || 'out ' + (gOut.size + 1) } };
      gOut.set(k, g); boundary.push(g); innerLinks.push({ id: U.uid('l'), from: l.from, port: l.port, to: g.id, toPort: 'in' });
    });
    const inGroups = b.groups.filter(g => g.nodeIds.every(id => set.has(id)));
    b.groups.forEach(g => { if (!inGroups.includes(g)) g.nodeIds = g.nodeIds.filter(id => !set.has(id)); });
    b.groups = b.groups.filter(g => !inGroups.includes(g) && g.nodeIds.length);
    const nContainers = R.allNodes(S.project).filter(n => n.type === 'container').length;
    const c = { id: U.uid('n'), type: 'container', x: minX, y: minY, data: { title: 'Container ' + (nContainers + 1), nodes: inside.concat(boundary), links: innerLinks, groups: inGroups } };
    const outer = [];
    incoming.forEach(l => outer.push({ id: l.id, from: l.from, port: l.port, to: c.id, toPort: gIn.get(l.to + '|' + (l.toPort || 'in')).data.key }));
    outgoing.forEach(l => outer.push({ id: l.id, from: c.id, port: gOut.get(l.from + '|' + l.port).data.key, to: l.to, toPort: l.toPort || 'in' }));
    const drop = new Set(internal.concat(incoming, outgoing).map(l => l.id));
    b.nodes = b.nodes.filter(n => !set.has(n.id)).concat(c);
    b.links = b.links.filter(l => !drop.has(l.id)).concat(outer);
    R.events.emit('graph:rebuild'); M.select({ nodeId: c.id }); M.commit();
    return c;
  };

  // Unpacks a container back into the current board, reconnecting the arrows that went through its inputs and outputs.
  M.explode = function (id) {
    const b = M.board(), c = M.node(id); if (!c || c.type !== 'container') return false;
    const d = c.data, byId = new Map(d.nodes.map(n => [n.id, n]));
    const real = d.nodes.filter(n => n.type !== 'ginput' && n.type !== 'goutput');
    const dx = real.length ? c.x - Math.min(...real.map(n => n.x)) : 0, dy = real.length ? c.y - Math.min(...real.map(n => n.y)) : 0;
    real.forEach(n => { n.x += dx; n.y += dy; });
    const outerIn = b.links.filter(l => l.to === id), outerOut = b.links.filter(l => l.from === id);
    const resolve = (nodeId, toPort) => {   // follow pass-through exits to the outside
      const n = byId.get(nodeId); if (!n) return null;
      if (n.type === 'goutput') { const o = outerOut.find(l => l.port === n.data.key); return o ? { to: o.to, toPort: o.toPort } : null; }
      return { to: nodeId, toPort };
    };
    const links = [];
    d.links.forEach(l => {
      const f = byId.get(l.from), t = byId.get(l.to); if (!f || !t) return;
      if (f.type === 'ginput') {
        const tgt = resolve(l.to, l.toPort); if (!tgt) return;
        outerIn.filter(o => o.toPort === f.data.key).forEach(o => links.push({ id: U.uid('l'), from: o.from, port: o.port, to: tgt.to, toPort: tgt.toPort }));
      } else if (t.type === 'goutput') {
        const o = outerOut.find(x => x.port === t.data.key); if (o) links.push({ id: U.uid('l'), from: l.from, port: l.port, to: o.to, toPort: o.toPort });
      } else links.push(l);
    });
    b.nodes = b.nodes.filter(n => n.id !== id).concat(real);
    b.links = b.links.filter(l => l.to !== id && l.from !== id).concat(links);
    b.groups.push(...d.groups.map(g => Object.assign({}, g, { nodeIds: g.nodeIds.filter(x => real.some(n => n.id === x)) })).filter(g => g.nodeIds.length));
    R.events.emit('graph:rebuild'); M.select({ nodeIds: real.map(n => n.id) }); M.commit();
    return true;
  };

  // History support (assets and translations are excluded from undo snapshots on purpose: they can be large).
  M.graphData = () => { const p = S.project; return { meta: p.meta, characters: p.characters, variables: p.variables, nodes: p.nodes, links: p.links, groups: p.groups, screens: p.screens }; };
  M.restoreGraph = function (json) {
    Object.assign(S.project, JSON.parse(json));
    if (!boardAt(S.path)) S.path = [];
    S.selection = { nodeIds: S.selection.nodeIds.filter(id => M.node(id)), groupId: null, linkId: null };
    R.events.emit('graph:rebuild'); R.events.emit('selection:changed'); R.events.emit('board:changed'); M.touch();
  };
})(RVN);
