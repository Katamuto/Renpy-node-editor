/* Show / hide / call a screen. Pick a screen designed in the Screens tab, or type the name of any other screen.
   "call" on a designed screen gets one EXIT PORT per "exit" button, so each button leads to its own branch. */
(function (R) {
  const SC = R.screens, U = R.util;
  const target = (n) => { const p = R.state.project, s = SC.find(p, n.data.screen); return { s, name: s ? SC.ident(p, s) : U.ident(n.data.name, '') }; };
  R.registry.register({
    type: 'screen', label: 'Screen', category: 'Visual', icon: '🪟',
    defaults: () => ({ mode: 'call', screen: '', name: '', definition: '' }),
    fields: [
      { key: 'mode', label: 'Action', kind: 'select', options: ['call', 'show', 'hide'] },
      { key: 'screen', label: 'Screen (designed in the Screens tab)', kind: 'screenref' },
      { key: 'name', label: '...or any other screen name', kind: 'text', placeholder: 'save, load, preferences, my_screen' },
      { key: 'definition', label: 'Raw screen code (advanced, optional)', kind: 'code', rows: 6 }
    ],
    outputs(n) {
      const s = n.data.mode === 'call' ? SC.find(R.state.project, n.data.screen) : null;
      return s ? SC.outputsFor(s) : [{ id: 'next', label: '' }];
    },
    summary(n) { const t = target(n); return n.data.mode + ' screen ' + (t.name || '?'); },
    branch(n, ctx) {
      const t = target(n);
      if (!t.name) { ctx.warn(n, 'Screen node has no screen'); return []; }
      const line = n.data.mode + ' screen ' + t.name, ports = n.data.mode === 'call' && t.s ? SC.outputsFor(t.s) : [];
      if (!ports.length || (ports.length === 1 && ports[0].id === 'next')) return [line];
      const items = [line];
      ports.forEach((p, i) => {
        const header = ports.length === 1 ? null : i === ports.length - 1 ? 'else:' : (i === 0 ? 'if' : 'elif') + ' _return == "' + U.q(p.id) + '":';
        items.push({ header, port: p.id, headerIndent: 0, bodyIndent: header === null ? 0 : 1 });
      });
      return items;
    }
  });
})(RVN);
