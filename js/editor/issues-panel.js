/* "Issues" tab: runs the exporter's analysis and lists warnings. Click an item to jump to the node. */
(function (R) {
  const el = R.el;
  function render(host) {
    const run = () => { try { return R.exporter.script(R.state.project).warnings; } catch (e) { return [{ msg: 'Check failed: ' + e.message }]; } };
    const list = el('div', { class: 'issues' });
    const fill = (ws) => {
      list.replaceChildren();
      if (!ws.length) list.append(el('p', { class: 'ok', text: '✓ No issues found.' }));
      ws.forEach(w => list.append(el('button', { class: 'issue', text: w.msg, onclick: () => { const path = w.nodeId && R.model.pathTo(w.nodeId); if (!path) return; R.model.goto(path); const n = R.model.node(w.nodeId); if (n) { R.model.select({ nodeId: n.id }); R.canvas.centerOn(n); } } })));
    };
    host.append(el('h3', { text: 'Story check' }), el('button', { class: 'btn', text: 'Check story', onclick: () => fill(run()) }), list);
    fill(run());
  }
  R.panels.register('issues', 'Issues', render);
  R.events.on('export:done', () => { R.panels.refresh('issues'); });
})(RVN);
