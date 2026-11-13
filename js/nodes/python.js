RVN.registry.register({
  type: 'python', label: 'Python code', category: 'Logic', icon: '🐍',
  defaults: () => ({ code: '' }),
  fields: [{ key: 'code', label: 'Python', kind: 'code', rows: 6 }],
  summary: (n) => n.data.code || '(empty)',
  emit(n) {
    const lines = String(n.data.code).split(/\r?\n/);
    return ['python:'].concat(String(n.data.code).trim() ? lines.map(l => '    ' + l) : ['    pass']);
  }
});
