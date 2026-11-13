/* Left sidebar: node types by category. Click to add at the view center, or drag onto the canvas.
   Entries marked "inner" (container input / output) appear only while you are inside a container. */
(function (R) {
  R.palette = {
    init(root) {
      const el = R.el;
      const render = () => {
        const cats = {}; root.replaceChildren(el('h4', { text: 'Add node' }));
        R.registry.visible().forEach(d => (cats[d.category] = cats[d.category] || []).push(d));
        Object.keys(cats).forEach(c => {
          root.append(el('div', { class: 'cat-title', text: c }));
          cats[c].forEach(d => root.append(el('button', {
            class: 'pal-item cat-' + c.toLowerCase(), draggable: 'true', text: (d.icon || '') + '  ' + d.label,
            onclick: () => { const v = R.canvas.viewCenter(), j = Math.round(Math.random() * 4) * 10; R.model.addNode(d.type, v.x - 100 + j, v.y - 40 + j); },
            ondragstart: e => e.dataTransfer.setData('text/rvn-node', d.type)
          })));
        });
      };
      render(); R.events.on('board:changed', render);
      R.canvas.el.addEventListener('dragover', e => e.preventDefault());
      R.canvas.el.addEventListener('drop', e => {
        const t = e.dataTransfer.getData('text/rvn-node'); if (!t) return; e.preventDefault();
        const w = R.canvas.toWorld(e.clientX, e.clientY); R.model.addNode(t, w.x - 100, w.y - 20);
      });
    }
  };
})(RVN);
