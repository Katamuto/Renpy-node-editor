RVN.registry.register({
  type: 'condition', label: 'Condition (if / else)', category: 'Logic', icon: '❓',
  defaults: () => ({ expr: '' }),
  fields: [{ key: 'expr', label: 'Python condition', kind: 'text', placeholder: 'points >= 3' }],
  outputs: () => [{ id: 'true', label: 'true' }, { id: 'false', label: 'false' }],
  summary: (n) => 'if ' + (n.data.expr || '?'),
  branch(n, ctx) {
    let e = String(n.data.expr).trim();
    if (!e) { ctx.warn(n, 'Condition is empty, using True'); e = 'True'; }
    return [
      { header: 'if ' + e + ':', port: 'true', headerIndent: 0, bodyIndent: 1 },
      { header: 'else:', port: 'false', headerIndent: 0, bodyIndent: 1 }
    ];
  }
});
