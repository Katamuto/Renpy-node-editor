/* Tiny event bus: RVN.events.on(name, fn) / RVN.events.emit(name, payload)
   Events: graph:rebuild, node:updated(id), node:moved(id), links:changed,
           selection:changed, view:changed, project:changed, history:changed */
(function (R) {
  const handlers = {};
  R.events = {
    on(name, fn) { (handlers[name] = handlers[name] || []).push(fn); },
    emit(name, payload) {
      (handlers[name] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error('[' + name + ']', e); } });
    }
  };
})(RVN);
