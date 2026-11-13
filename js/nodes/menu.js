(function (R) {
  const U = R.util;
  R.registry.register({
    type: 'menu', label: 'Choice menu', category: 'Story', icon: '🔀',
    defaults: () => ({ prompt: '', choices: [{ id: U.uid('c'), text: 'Option A', cond: '' }, { id: U.uid('c'), text: 'Option B', cond: '' }] }),
    fields: [
      { key: 'prompt', label: 'Caption (optional)', kind: 'textarea', rows: 2 },
      { key: 'choices', label: 'Choices (each one gets its own exit)', kind: 'choices' }
    ],
    outputs: (n) => n.data.choices.map(c => ({ id: c.id, label: c.text || '(empty)' })),
    summary: (n) => n.data.prompt || n.data.choices.length + ' choices',
    texts: (n) => [{ text: n.data.prompt, note: 'Menu caption' }].concat(n.data.choices.map(c => ({ text: c.text, note: 'Menu choice' }))),
    // Items: strings are emitted at the node's indent; {header,port,headerIndent,bodyIndent} are branches.
    branch(n) {
      const items = ['menu:'];
      if (String(n.data.prompt).trim()) items.push('    "' + U.qt(n.data.prompt) + '"');
      n.data.choices.forEach(c => items.push({
        header: '"' + U.qt(c.text || '...') + '"' + (String(c.cond).trim() ? ' if ' + String(c.cond).trim() : '') + ':',
        port: c.id, headerIndent: 1, bodyIndent: 2
      }));
      return items;
    }
  });
})(RVN);
