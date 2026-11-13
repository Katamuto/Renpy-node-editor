/* Select + drag nodes (snaps to a 10px grid). Shift/Ctrl/Cmd+click toggles a node in the selection.
   Dragging any selected node moves the whole selection. History is recorded once, on mouse release. */
(function (R) {
  const D = R.nodeDrag = {};
  const M = R.model;

  // Starts dragging the given nodes. onClick runs if the mouse was released without moving.
  D.begin = function (e, ids, onClick) {
    const nodes = ids.map(M.node).filter(Boolean), w0 = R.canvas.toWorld(e.clientX, e.clientY), orig = nodes.map(n => [n.x, n.y]);
    let moved = false;
    const move = ev => {
      const w = R.canvas.toWorld(ev.clientX, ev.clientY), dx = Math.round((w.x - w0.x) / 10) * 10, dy = Math.round((w.y - w0.y) / 10) * 10;
      nodes.forEach((n, i) => { n.x = orig[i][0] + dx; n.y = orig[i][1] + dy; });
      moved = true; R.events.emit('nodes:moved', nodes.map(n => n.id)); M.touch();
    };
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      if (moved) R.history.record(); else if (onClick) onClick();
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  D.init = function () {
    R.canvas.nodesLayer.addEventListener('dblclick', e => {
      const elm = e.target.closest('.node'); if (!elm || e.target.closest('.port')) return;
      R.model.enter(elm.dataset.id);
    });
    R.canvas.nodesLayer.addEventListener('mousedown', e => {
      if (e.button !== 0 || e.target.closest('.port')) return;
      const elm = e.target.closest('.node'); if (!elm) return;
      e.preventDefault();
      const id = elm.dataset.id, before = M.selectedIds();
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        M.select({ nodeId: id, add: true });
        if (M.selectedIds().includes(id)) D.begin(e, M.selectedIds());
        return;
      }
      if (!before.includes(id)) M.select({ nodeId: id });
      D.begin(e, M.selectedIds(), () => { if (before.length > 1 && before.includes(id)) M.select({ nodeId: id }); });
    });
  };
})(RVN);
