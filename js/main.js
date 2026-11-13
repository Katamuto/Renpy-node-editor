/* Bootstrap: wires modules together. Keep this file tiny. */
window.addEventListener('DOMContentLoaded', async function () {
  const R = RVN, $ = (id) => document.getElementById(id);
  R.canvas.init($('canvas'));
  R.nodeView.init(); R.groupView.init(); R.breadcrumb.init(); R.nodeDrag.init(); R.connect.init();
  R.palette.init($('palette'));
  R.toolbar.init($('toolbar'));
  R.contextMenu.init(); R.shortcuts.init();

  let t;
  R.events.on('project:changed', () => { document.title = R.state.project.meta.name + " - Ren'Py Node Editor"; clearTimeout(t); t = setTimeout(R.io.autosave, 1500); });
  window.addEventListener('beforeunload', e => { if (R.state.dirty) { e.preventDefault(); e.returnValue = ''; } });

  if (!(await R.io.restoreAutosave())) R.model.setProject(R.model.newProject());
  R.panels.init($('sidepanel'));   // after the project exists: panels render project data immediately
  R.canvas.fit();
});
