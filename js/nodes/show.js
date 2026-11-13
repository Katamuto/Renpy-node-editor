(function (R) {
  R.registry.register({
    type: 'show', label: 'Show image', category: 'Visual', icon: '🧍',
    defaults: () => ({ image: 'eileen happy', at: '', transition: 'dissolve' }),
    fields: [
      { key: 'image', label: 'Image name (tag + attributes)', kind: 'imagepick', role: 'sprite', placeholder: 'eileen happy' },
      { key: 'at', label: 'Position', kind: 'select', options: R.nodeUtil.positions },
      { key: 'transition', label: 'Transition', kind: 'select', options: R.nodeUtil.transitions }
    ],
    summary: (n) => 'show ' + (n.data.image || '?') + (n.data.at ? ' at ' + n.data.at : ''),
    emit(n, ctx) {
      const img = String(n.data.image).trim();
      if (!img) { ctx.warn(n, 'Show node has no image'); return []; }
      return ['show ' + img + (n.data.at ? ' at ' + n.data.at : '') + R.nodeUtil.withClause(n.data.transition)];
    }
  });
})(RVN);
