/* Entry point of a container (only inside containers). Becomes an input port on the container node. Exports as nothing. */
RVN.registry.register({
  type: 'ginput', label: 'Container input', category: 'Flow', icon: '⇥', inner: true, inputs: false,
  defaults: () => ({ key: RVN.util.uid('k'), label: 'in' }),
  fields: [{ key: 'label', label: 'Input name (shown on the container)', kind: 'text' }],
  summary: (n) => 'Entry: ' + (n.data.label || '?')
});
