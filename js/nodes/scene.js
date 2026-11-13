(function (R) {
  R.registry.register({
    type: 'scene', label: 'Scene / Background', category: 'Visual', icon: '🖼',
    defaults: () => ({ image: 'bg room', transition: 'dissolve' }),
    fields: [
      { key: 'image', label: 'Image name', kind: 'imagepick', role: 'background', placeholder: 'bg room' },
      { key: 'transition', label: 'Transition', kind: 'select', options: R.nodeUtil.transitions }
    ],
    summary: (n) => 'scene ' + (n.data.image || 'black'),
    emit: (n) => ['scene ' + (String(n.data.image).trim() || 'black') + R.nodeUtil.withClause(n.data.transition)]
  });
})(RVN);
