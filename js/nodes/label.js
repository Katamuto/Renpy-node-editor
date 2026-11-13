/* Named anchor. It always becomes a Ren'Py label and is a root of the graph, so Jump nodes
   (or your own Python / call statements) can reach it even without an incoming arrow. */
RVN.registry.register({
  type: 'label', label: 'Label', category: 'Flow', icon: '🏷',
  defaults: () => ({ name: 'chapter_2' }),
  fields: [{ key: 'name', label: 'Label name', kind: 'text', placeholder: 'chapter_2' }],
  summary: (n) => 'label ' + (n.data.name || '?'),
  emit: () => []
});
