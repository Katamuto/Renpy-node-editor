/* Right-click: on a node -> copy / cut / duplicate / group / delete; on empty canvas -> paste here or add a node here. */
(function (R) {
  R.contextMenu = {
    init() {
      const el = R.el, M = R.model, K = R.clipboard; let menu = null;
      const close = () => { if (menu) { menu.remove(); menu = null; } };
      const open = (x, y, items) => {
        close(); menu = el('div', { class: 'ctx', style: 'left:' + x + 'px;top:' + y + 'px' },
          items.map(it => it === '-' ? el('hr') : el('button', { text: it[0], onclick: () => { close(); it[1](); } })));
        document.body.append(menu);
        const r = menu.getBoundingClientRect(); if (r.bottom > innerHeight) menu.style.top = Math.max(0, innerHeight - r.height - 4) + 'px';
      };
      R.canvas.el.addEventListener('contextmenu', e => {
        e.preventDefault();
        const n = e.target.closest('.node'), g = e.target.closest('.group-title'), w = R.canvas.toWorld(e.clientX, e.clientY);
        if (n || g) {
          if (n && !M.selectedIds().includes(n.dataset.id)) M.select({ nodeId: n.dataset.id });
          if (g) M.select({ groupId: g.parentNode.dataset.gid });
          const ids = M.selectedIds(), grp = R.state.selection.groupId || (M.groupOf(ids[0]) || {}).id, items = [];
          const one = ids.length === 1 && M.node(ids[0]);
          if (one && one.type === 'container') items.push(['Open container', () => M.enter(one.id)], ['Unpack container', () => M.explode(one.id)], '-');
          if (one && R.desktop.isDesktop()) items.push(['▶ Play from here', () => R.desktop.play(one.id)], '-');
          items.push(['Copy', () => K.toSystem(K.copy())], ['Cut', () => K.toSystem(K.cut())], ['Duplicate', () => K.duplicate()], '-',
            ['Combine into container', () => M.makeContainer(ids)], ['Group selection (frame)', () => M.groupSelected()]);
          if (grp) items.push(['Ungroup', () => M.ungroup(grp)]);
          items.push('-', ['Delete', () => M.removeNodes(ids)]);
          open(e.clientX, e.clientY, items);
        } else {
          const items = [];
          if (K.data) items.push(['Paste here', () => K.paste(K.data, w)], '-');
          open(e.clientX, e.clientY, items.concat(R.registry.visible().map(d => [(d.icon || '') + '  ' + d.label, () => M.addNode(d.type, w.x, w.y)])));
        }
      });
      document.addEventListener('mousedown', e => { if (menu && !menu.contains(e.target)) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
  };
})(RVN);
