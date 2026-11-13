RVN.registry.register({
  type: 'variable', label: 'Set variable', category: 'Logic', icon: '📝',
  defaults: () => ({ name: '', op: '=', value: '1' }),
  fields: [
    { key: 'name', label: 'Variable', kind: 'text', placeholder: 'points' },
    { key: 'op', label: 'Operation', kind: 'select', options: ['=', '+=', '-=', '*='] },
    { key: 'value', label: 'Value (Python expression)', kind: 'text', placeholder: '1  |  "text"  |  True' }
  ],
  summary: (n) => (n.data.name || '?') + ' ' + n.data.op + ' ' + n.data.value,
  emit(n, ctx) {
    const name = RVN.util.ident(n.data.name, '');
    if (!name) { ctx.warn(n, 'Variable node has no name'); return []; }
    return ['$ ' + name + ' ' + n.data.op + ' ' + (String(n.data.value).trim() || 'None')];
  }
});
