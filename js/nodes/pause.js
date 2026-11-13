RVN.registry.register({
  type: 'pause', label: 'Pause', category: 'Visual', icon: '⏱',
  defaults: () => ({ seconds: 1 }),
  fields: [{ key: 'seconds', label: 'Seconds (0 = wait for click)', kind: 'number' }],
  summary: (n) => Number(n.data.seconds) > 0 ? 'pause ' + n.data.seconds + 's' : 'pause (click)',
  emit: (n) => [Number(n.data.seconds) > 0 ? 'pause ' + Number(n.data.seconds) : 'pause']
});
