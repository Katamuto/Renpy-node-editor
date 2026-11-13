(function (R) {
  R.registry.register({
    type: 'hide', label: 'Hide image', category: 'Visual', icon: '🫥',
    defaults: () => ({ image: 'eileen', transition: 'dissolve' }),
    fields: [
      { key: 'image', label: 'Image tag', kind: 'imagepick', role: 'sprite', placeholder: 'eileen' },
      { key: 'transition', label: 'Transition', kind: 'select', options: R.nodeUtil.transitions }
    ],
    summary: (n) => 'hide ' + (R.nodeUtil.tag(n.data.image) || '?'),
    emit(n, ctx) {
      const tag = R.nodeUtil.tag(n.data.image);
      if (!tag) { ctx.warn(n, 'Hide node has no image'); return []; }
      return ['hide ' + tag + R.nodeUtil.withClause(n.data.transition)];
    }
  });
})(RVN);
