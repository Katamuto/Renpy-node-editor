/* Draws links (SVG bezier curves) between output and input ports. Port positions are read from the DOM,
   so nodes can have any height. Click a link to select it (Delete removes it); double-click removes it. */
(function (R) {
  const L = R.links = {}, NS = 'http://www.w3.org/2000/svg';
  const mk = (cls, d) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', cls); p.setAttribute('d', d); return p; };
  const curve = (a, b) => { const dx = Math.max(50, Math.abs(b.x - a.x) / 2); return 'M' + a.x + ' ' + a.y + ' C' + (a.x + dx) + ' ' + a.y + ' ' + (b.x - dx) + ' ' + b.y + ' ' + b.x + ' ' + b.y; };

  L.portCenter = function (elm) {
    const r = elm.getBoundingClientRect(), w = R.canvas.world.getBoundingClientRect(), z = R.state.view.z;
    return { x: (r.left + r.width / 2 - w.left) / z, y: (r.top + r.height / 2 - w.top) / z };
  };
  L.redraw = function () {
    const svg = R.canvas.svg, layer = R.canvas.nodesLayer, sel = R.state.selection;
    svg.replaceChildren();
    R.model.board().links.forEach(l => {
      const a = layer.querySelector('.port.out[data-node="' + l.from + '"][data-port="' + l.port + '"]');
      const b = layer.querySelector('.port.in[data-node="' + l.to + '"][data-port="' + (l.toPort || 'in') + '"]');
      if (!a || !b) return;
      const d = curve(L.portCenter(a), L.portCenter(b));
      const hit = mk('link-hit', d);
      hit.addEventListener('mousedown', e => e.stopPropagation());
      hit.addEventListener('click', () => R.model.select({ linkId: l.id }));
      hit.addEventListener('dblclick', () => R.model.removeLink(l.id));
      const g = document.createElementNS(NS, 'g'); g.append(mk('link' + (sel.linkId === l.id ? ' selected' : ''), d), hit); svg.append(g);
    });
  };
  L.drawTemp = function (a, b) { L.clearTemp(); R.canvas.svg.append(mk('link temp', curve(a, b))); };
  L.clearTemp = function () { const t = R.canvas.svg.querySelector('.temp'); if (t) t.remove(); };
})(RVN);
