/* Right-hand tabbed side panel. RVN.panels.register(id, title, render(host)); refresh(id) re-renders it. */
(function (R) {
  const P = R.panels = { defs: [], hosts: {}, tabs: {}, current: null };
  P.register = (id, title, render) => P.defs.push({ id, title, render });
  P.init = function (root) {
    const bar = R.el('div', { class: 'tabs' }), body = R.el('div', { class: 'tab-body' });
    root.append(bar, body);
    P.defs.forEach(d => {
      P.tabs[d.id] = R.el('button', { class: 'tab', text: d.title, onclick: () => P.show(d.id) });
      P.hosts[d.id] = R.el('div', { class: 'tab-host' });
      bar.append(P.tabs[d.id]); body.append(P.hosts[d.id]);
    });
    P.refreshAll(); P.show(P.defs[0].id);
    R.events.on('graph:rebuild', P.refreshAll);
    R.events.on('selection:changed', () => { const s = R.state.selection; P.refresh('node'); if (s.nodeIds.length || s.linkId || s.groupId) P.show('node'); });
    // drag the left edge of the panel to resize it
    const grip = R.el('div', { class: 'grip' }); root.append(grip);
    grip.addEventListener('mousedown', e => {
      e.preventDefault(); const app = document.getElementById('app'), startX = e.clientX, w0 = root.offsetWidth;
      const move = ev => app.style.setProperty('--side', Math.min(760, Math.max(280, w0 + startX - ev.clientX)) + 'px');
      const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); R.events.emit('links:changed'); };
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    });
  };
  P.show = (id) => { P.current = id; P.defs.forEach(d => { P.hosts[d.id].hidden = d.id !== id; P.tabs[d.id].classList.toggle('active', d.id === id); }); };
  P.refresh = (id) => { const d = P.defs.find(x => x.id === id); if (d && P.hosts[id]) { P.hosts[id].replaceChildren(); d.render(P.hosts[id]); } };
  P.refreshAll = () => P.defs.forEach(d => P.refresh(d.id));
})(RVN);
