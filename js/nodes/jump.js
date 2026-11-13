RVN.registry.register({
  type: 'jump', label: 'Jump to label', category: 'Flow', icon: '↪',
  defaults: () => ({ target: '' }),
  fields: [{ key: 'target', label: 'Target label', kind: 'labelref' }],
  outputs: () => [], terminal: true,
  summary(n) { const t = RVN.findNode(RVN.state.project, n.data.target); return 'jump ' + (t ? t.data.name : '?'); },
  emit(n, ctx) {
    const name = ctx.labelName(n.data.target);
    if (!name) { ctx.warn(n, 'Jump has no valid target label, ending game here'); return ['return']; }
    return ['jump ' + name];
  }
});
