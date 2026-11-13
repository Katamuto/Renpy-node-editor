/* Exit of a container (only inside containers). Becomes an output port on the container node. Exports as nothing. */
RVN.registry.register({
  type: 'goutput', label: 'Container output', category: 'Flow', icon: '⇤', inner: true, outputs: () => [],
  defaults: () => ({ key: RVN.util.uid('k'), label: 'out' }),
  fields: [{ key: 'label', label: 'Output name (shown on the container)', kind: 'text' }],
  summary: (n) => 'Exit: ' + (n.data.label || '?')
});
