/* Drag from an output port (●) and release over any node to connect. An output has one exit:
   connecting again replaces it. Many outputs may end on the same node (that is how branches merge). */
(function (R) {
  R.connect = {
    init() {
      R.canvas.nodesLayer.addEventListener('mousedown', e => {
        const port = e.target.closest('.port.out'); if (e.button !== 0 || !port) return;
        e.preventDefault(); e.stopPropagation();
        const from = port.dataset.node, name = port.dataset.port, a = R.links.portCenter(port);
        const move = ev => R.links.drawTemp(a, R.canvas.toWorld(ev.clientX, ev.clientY));
        const up = ev => {
          document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
          R.links.clearTemp();
          const t = document.elementFromPoint(ev.clientX, ev.clientY), nodeEl = t && t.closest('.node');
          if (!nodeEl) return;
          const inp = t.closest('.port.in') || nodeEl.querySelector('.port.in');
          R.model.addLink(from, name, nodeEl.dataset.id, inp ? inp.dataset.port : 'in');
        };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
      });
    }
  };
})(RVN);
