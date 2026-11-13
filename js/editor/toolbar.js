/* Top bar. */
(function (R) {
  R.toolbar = {
    init(root) {
      const el = R.el, btn = (label, title, fn) => el('button', { class: 'btn', text: label, title, onclick: fn });
      const exportBtn = btn('Export Ren\'Py ZIP', 'Download a ready-to-use Ren\'Py project', () => R.io.exportZip());
      exportBtn.classList.add('primary');
      const toolBtn = btn('', 'Background drag: pan or box-select (hold Shift for the other one)', () => { R.state.tool = R.state.tool === 'pan' ? 'select' : 'pan'; syncTool(); });
      const combineBtn = btn('📦 Combine', 'Combine the selected nodes into one container node (Ctrl+K)', () => R.model.makeContainer(R.model.selectedIds()));
      const groupBtn = btn('▣ Frame', 'Draw a titled frame around the selected nodes (Ctrl+G)', () => R.model.groupSelected());
      const syncTool = () => { toolBtn.textContent = R.state.tool === 'pan' ? '✥ Pan tool' : '⬚ Select tool'; R.canvas.el.classList.toggle('tool-select', R.state.tool === 'select'); };
      const undo = btn('↶ Undo', 'Ctrl+Z', () => R.history.undo()), redo = btn('↷ Redo', 'Ctrl+Y', () => R.history.redo());
      root.append(el('strong', { class: 'brand', text: "Ren'Py Node Editor" }),
        btn('New', 'New project', () => { if (!R.state.dirty || confirm('Discard unsaved changes?')) { R.model.setProject(R.model.newProject()); R.canvas.fit(); } }),
        btn('Open…', 'Open a .rvn.json project', () => R.io.openFile()),
        btn('Save', 'Ctrl+S: download the project file', () => R.io.saveFile()),
        el('span', { class: 'sep' }), undo, redo,
        btn('Fit view', 'Show the whole graph', () => R.canvas.fit()),
        el('span', { class: 'sep' }), toolBtn, groupBtn, combineBtn,
        el('span', { class: 'grow' }),
        ...(R.desktop.isDesktop() ? [btn('▶ Play', 'Launch the game in Ren\'Py (F5)', () => { R.panels.show('play'); R.desktop.play(); })] : []),
        exportBtn);
      const sync = () => { undo.disabled = !R.history.canUndo(); redo.disabled = !R.history.canRedo(); };
      R.events.on('history:changed', sync); sync(); syncTool();
    }
  };
})(RVN);
