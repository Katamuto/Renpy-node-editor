(function (R) {
  R.registry.register({
    type: 'dialogue', label: 'Dialogue', category: 'Story', icon: '💬',
    defaults: (p) => ({ who: p.characters.length ? p.characters[0].id : '', text: '' }),
    fields: [
      { key: 'who', label: 'Character (empty = narrator)', kind: 'character' },
      { key: 'text', label: 'Text', kind: 'textarea', rows: 5 }
    ],
    summary: (n) => (n.data.who ? n.data.who + ': ' : '') + (n.data.text || '(empty)'),
    texts(n, project) {
      const c = project.characters.find(x => x.id === n.data.who);
      return [{ text: n.data.text, note: 'Dialogue' + (c ? ' - ' + (c.name || c.id) : '') }];
    },
    emit(n, ctx) {
      if (!String(n.data.text).trim()) { ctx.warn(n, 'Dialogue is empty, skipped'); return []; }
      let who = '';
      if (n.data.who) {
        who = ctx.charId(n.data.who);
        if (!who) ctx.warn(n, 'Unknown character "' + n.data.who + '", using narrator');
      }
      return [(who ? who + ' ' : '') + '"' + R.util.qt(n.data.text) + '"'];
    }
  });
})(RVN);
