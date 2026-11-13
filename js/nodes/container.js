/* Container: a whole board inside one node. Double-click (or Enter) opens it. Its inputs and outputs are the
   "Container input" / "Container output" nodes placed inside (their labels become the port labels). */
(function (R) {
  const U = R.util;
  const ends = (n, type) => n.data.nodes.filter(x => x.type === type);
  R.registry.register({
    type: 'container', label: 'Container', category: 'Flow', icon: '📦',
    defaults() {
      const a = { id: U.uid('n'), type: 'ginput', x: 60, y: 80, data: { key: U.uid('k'), label: 'in' } };
      const b = { id: U.uid('n'), type: 'goutput', x: 520, y: 80, data: { key: U.uid('k'), label: 'out' } };
      return { title: 'Container', nodes: [a, b], links: [{ id: U.uid('l'), from: a.id, port: 'next', to: b.id, toPort: 'in' }], groups: [] };
    },
    title: (n) => n.data.title || 'Container',
    fields: [{ key: 'title', label: 'Title', kind: 'text' }],
    inputs: (n) => ends(n, 'ginput').map(x => ({ id: x.data.key, label: x.data.label || 'in' })),
    outputs: (n) => ends(n, 'goutput').map(x => ({ id: x.data.key, label: x.data.label || 'out' })),
    summary: (n) => n.data.nodes.filter(x => x.type !== 'ginput' && x.type !== 'goutput').length + ' nodes inside. Double-click to open.',
    actions: [
      { label: 'Open container', run: (n) => R.model.enter(n.id) },
      { label: 'Unpack (explode)', run: (n) => R.model.explode(n.id) }
    ]
  });
})(RVN);
