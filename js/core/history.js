/* Undo/redo by snapshots of the graph (see model.graphData). Call RVN.history.record() after each finished edit. */
(function (R) {
  const H = R.history = { stack: [], idx: -1 };
  const snap = () => JSON.stringify(R.model.graphData());
  H.reset = () => { H.stack = [snap()]; H.idx = 0; R.events.emit('history:changed'); };
  H.record = () => {
    const s = snap(); if (s === H.stack[H.idx]) return;
    H.stack = H.stack.slice(0, H.idx + 1); H.stack.push(s);
    if (H.stack.length > 100) H.stack.shift();
    H.idx = H.stack.length - 1; R.events.emit('history:changed');
  };
  H.canUndo = () => H.idx > 0;
  H.canRedo = () => H.idx < H.stack.length - 1;
  H.undo = () => { if (H.canUndo()) { H.idx--; R.model.restoreGraph(H.stack[H.idx]); R.events.emit('history:changed'); } };
  H.redo = () => { if (H.canRedo()) { H.idx++; R.model.restoreGraph(H.stack[H.idx]); R.events.emit('history:changed'); } };
})(RVN);
