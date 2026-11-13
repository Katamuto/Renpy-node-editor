/* Sticky note for the author. Not connected, not exported. */
RVN.registry.register({
  type: 'comment', label: 'Note', category: 'Misc', icon: '🗒',
  inputs: false, outputs: () => [],
  defaults: () => ({ text: '' }),
  fields: [{ key: 'text', label: 'Note', kind: 'textarea', rows: 5 }],
  summary: (n) => n.data.text || '(empty note)'
});
