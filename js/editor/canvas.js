/* The pannable / zoomable workspace. Layers inside .world (bottom to top): group frames, <svg> links, node elements.
   Tool "pan": drag background = pan, Shift+drag = box select.  Tool "select": the opposite.  Ctrl/Cmd+drag adds to the selection. */
(function (R) {
  const C = R.canvas = {}, S = R.state;
  C.mouse = null;   // last mouse position in world coordinates (used by paste)

  C.init = function (root) {
    C.el = root;
    C.groupsLayer = R.el('div', { class: 'groups' });
    C.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); C.svg.setAttribute('class', 'links');
    C.nodesLayer = R.el('div', { class: 'nodes' });
    C.world = R.el('div', { class: 'world' }, C.groupsLayer, C.svg, C.nodesLayer);
    root.append(C.world); C.apply();

    root.addEventListener('wheel', e => { e.preventDefault(); C.zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 1 / 1.1); }, { passive: false });
    root.addEventListener('mousemove', e => { C.mouse = C.toWorld(e.clientX, e.clientY); });
    root.addEventListener('mousedown', e => {
      if (e.button !== 0 && e.button !== 1) return;
      if (e.target !== root && e.target !== C.world && e.target !== C.nodesLayer && e.target !== C.groupsLayer) return;
      e.preventDefault();
      const add = e.ctrlKey || e.metaKey;
      if (e.button === 0 && ((S.tool === 'select') !== e.shiftKey)) C.marquee(e, add); else C.pan(e, add);
    });
    window.addEventListener('resize', () => R.events.emit('links:changed'));
    R.events.on('board:changed', () => { if (S.needFit) { S.needFit = false; C.fit(); } else C.apply(); R.events.emit('links:changed'); });
  };

  C.pan = function (e, add) {
    const sx = e.clientX, sy = e.clientY, ox = S.view.x, oy = S.view.y; let moved = false;
    const move = ev => { moved = true; S.view.x = ox + ev.clientX - sx; S.view.y = oy + ev.clientY - sy; C.apply(); };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); if (!moved && !add) R.model.select({}); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  C.marquee = function (e, add) {
    const r0 = C.el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, keep = add ? R.model.selectedIds() : [];
    const box = R.el('div', { class: 'marquee' }); C.el.append(box);
    let hit = [];
    const move = ev => {
      const x0 = Math.min(sx, ev.clientX), y0 = Math.min(sy, ev.clientY), x1 = Math.max(sx, ev.clientX), y1 = Math.max(sy, ev.clientY);
      box.style.cssText = 'left:' + (x0 - r0.left) + 'px;top:' + (y0 - r0.top) + 'px;width:' + (x1 - x0) + 'px;height:' + (y1 - y0) + 'px';
      hit = [];
      C.nodesLayer.querySelectorAll('.node').forEach(n => {
        const b = n.getBoundingClientRect(), inside = b.right > x0 && b.left < x1 && b.bottom > y0 && b.top < y1;
        n.classList.toggle('marq', inside); if (inside) hit.push(n.dataset.id);
      });
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      box.remove(); C.nodesLayer.querySelectorAll('.marq').forEach(n => n.classList.remove('marq'));
      R.model.select({ nodeIds: [...new Set(keep.concat(hit))] });
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  C.apply = function () {
    const v = S.view;
    C.world.style.transform = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + v.z + ')';
    C.el.style.backgroundPosition = v.x + 'px ' + v.y + 'px';
    C.el.style.backgroundSize = 24 * v.z + 'px ' + 24 * v.z + 'px';
  };
  C.zoomAt = function (cx, cy, f) {
    const v = S.view, r = C.el.getBoundingClientRect(), nz = Math.min(2, Math.max(0.25, v.z * f)), k = nz / v.z;
    const mx = cx - r.left, my = cy - r.top;
    v.x = mx - (mx - v.x) * k; v.y = my - (my - v.y) * k; v.z = nz; C.apply();
  };
  C.toWorld = function (cx, cy) {
    const r = C.el.getBoundingClientRect(), v = S.view;
    return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z };
  };
  C.viewCenter = function () { const r = C.el.getBoundingClientRect(); return C.toWorld(r.left + r.width / 2, r.top + r.height / 2); };
  C.fit = function () {
    const ns = R.model.board().nodes; if (!ns.length) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ns.forEach(n => { const e = C.nodesLayer.querySelector('[data-id="' + n.id + '"]'); x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + (e ? e.offsetWidth : 230)); y1 = Math.max(y1, n.y + (e ? e.offsetHeight : 100)); });
    const r = C.el.getBoundingClientRect(), pad = 50;
    const z = Math.min(1.1, Math.max(0.25, Math.min((r.width - pad * 2) / (x1 - x0), (r.height - pad * 2) / (y1 - y0))));
    S.view.z = z; S.view.x = (r.width - (x1 - x0) * z) / 2 - x0 * z; S.view.y = (r.height - (y1 - y0) * z) / 2 - y0 * z; C.apply();
  };
  C.centerOn = function (node) {
    const r = C.el.getBoundingClientRect(), z = S.view.z;
    S.view.x = r.width / 2 - (node.x + 115) * z; S.view.y = r.height / 2 - (node.y + 40) * z; C.apply();
  };
})(RVN);
