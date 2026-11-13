/* Group frames: a titled colored rectangle that follows its member nodes. Click the title to select the whole group,
   drag the title to move it. Frames never affect the exported game (they are only for organizing). */
(function (R) {
  const el = R.el, G = R.groupView = {}, PAD = 24, TITLE = 26;

  G.render = function () {
    const layer = R.canvas.groupsLayer, P = R.model.board();
    layer.replaceChildren();
    P.groups.forEach(g => {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, any = false;
      g.nodeIds.forEach(id => {
        const n = R.model.node(id), e = R.canvas.nodesLayer.querySelector('[data-id="' + id + '"]'); if (!n) return;
        any = true; x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + (e ? e.offsetWidth : 230)); y1 = Math.max(y1, n.y + (e ? e.offsetHeight : 100));
      });
      if (!any) return;
      const sel = R.state.selection.groupId === g.id;
      layer.append(el('div', { class: 'group' + (sel ? ' selected' : ''), 'data-gid': g.id,
        style: 'left:' + (x0 - PAD) + 'px;top:' + (y0 - PAD - TITLE) + 'px;width:' + (x1 - x0 + PAD * 2) + 'px;height:' + (y1 - y0 + PAD * 2 + TITLE) + 'px;--g:' + g.color },
        el('div', { class: 'group-title', text: g.title || 'Group' })));
    });
  };

  G.init = function () {
    const E = R.events;
    ['graph:rebuild', 'nodes:moved', 'node:updated', 'groups:changed', 'nodes:refresh', 'selection:changed'].forEach(ev => E.on(ev, G.render));
    R.canvas.groupsLayer.addEventListener('mousedown', e => {
      const t = e.target.closest('.group-title'); if (e.button !== 0 || !t) return;
      e.preventDefault(); e.stopPropagation();
      const g = t.parentNode.dataset.gid; R.model.select({ groupId: g });
      R.nodeDrag.begin(e, R.model.selectedIds());
    });
  };
})(RVN);
