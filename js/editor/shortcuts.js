/* Keyboard shortcuts: Ctrl+K combine into container, Ctrl+Shift+K unpack, Enter open container, Alt+Up go up, Delete, Esc, Ctrl+A, Ctrl+Z / Y, Ctrl+S, Ctrl+C / X / V, Ctrl+D (duplicate), Ctrl+G / Ctrl+Shift+G (group / ungroup). */
(function (R) {
  const typing = (t) => /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
  R.shortcuts = {
    init() {
      const M = R.model, K = R.clipboard;
      document.addEventListener('keydown', e => {
        const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
        if (mod && k === 's') { e.preventDefault(); R.io.saveFile(); return; }
        if (e.key === 'F5' && R.desktop.isDesktop()) { e.preventDefault(); R.panels.show('play'); R.desktop.play(); return; }
        if (typing(e.target)) return;
        if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? R.history.redo() : R.history.undo(); }
        else if (mod && k === 'y') { e.preventDefault(); R.history.redo(); }
        else if (mod && k === 'a') { e.preventDefault(); M.select({ nodeIds: M.board().nodes.map(n => n.id) }); }
        else if (mod && k === 'd') { e.preventDefault(); K.duplicate(); }
        else if (mod && k === 'g') {
          e.preventDefault();
          if (e.shiftKey) { const g = R.state.selection.groupId || (M.groupOf(M.primary()) || {}).id; if (g) M.ungroup(g); } else M.groupSelected();
        }
        else if (mod && k === 'k') {
          e.preventDefault(); const one = M.primary() && M.node(M.primary());
          if (e.shiftKey) { if (one && one.type === 'container') M.explode(one.id); } else M.makeContainer(M.selectedIds());
        }
        else if (e.key === 'Enter') { const one = M.primary() && M.node(M.primary()); if (one && one.type === 'container') M.enter(one.id); }
        else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); M.up(); }
        else if (e.key === 'Escape') M.select({});
        else if (e.key === 'Delete' || e.key === 'Backspace') {
          const s = R.state.selection;
          if (s.linkId) M.removeLink(s.linkId); else if (s.nodeIds.length) M.removeNodes(s.nodeIds);
        }
      });
      // copy / cut / paste go through the clipboard events: works with the system clipboard (other tabs, other projects)
      document.addEventListener('copy', e => { if (typing(e.target)) return; const j = K.copy(); if (j) { e.clipboardData.setData('text/plain', j); e.preventDefault(); R.ui.toast('Copied'); } });
      document.addEventListener('cut', e => { if (typing(e.target)) return; const j = K.cut(); if (j) { e.clipboardData.setData('text/plain', j); e.preventDefault(); } });
      document.addEventListener('paste', e => {
        if (e.key === 'F5' && R.desktop.isDesktop()) { e.preventDefault(); R.panels.show('play'); R.desktop.play(); return; }
        if (typing(e.target)) return;
        let payload = null; try { const p = JSON.parse(e.clipboardData.getData('text/plain')); if (p && p.rvnClipboard) payload = p; } catch (x) { /* not ours */ }
        if (K.paste(payload || K.data)) e.preventDefault();
      });
    }
  };
})(RVN);
