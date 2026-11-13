/* Generic editable table. RVN.ui.listEditor({items, columns:[{key,label,type}], make, addLabel})
   Edits the given array in place; marks the project changed and records undo steps. */
(function (R) {
  R.ui.listEditor = function (o) {
    const el = R.el, wrap = el('div', { class: 'list-editor' });
    const cols = o.columns.length;
    function render() {
      wrap.replaceChildren();
      o.items.forEach((it, i) => {
        const row = el('div', { class: 'le-row', style: 'grid-template-columns:' + o.columns.map(c => c.type === 'color' ? '34px' : '1fr').join(' ') + ' 26px' });
        o.columns.forEach(c => row.append(el('input', {
          type: c.type || 'text', value: it[c.key] == null ? '' : it[c.key], placeholder: c.label, title: c.label,
          oninput: e => { it[c.key] = e.target.value; R.model.touch(); }, onchange: () => R.history.record()
        })));
        row.append(el('button', { class: 'icon-btn', title: 'Remove', text: '✕', onclick: () => { o.items.splice(i, 1); R.model.commit(); render(); } }));
        wrap.append(row);
      });
      wrap.append(el('button', { class: 'btn small', text: o.addLabel || '+ Add', onclick: () => { o.items.push(o.make()); R.model.commit(); render(); } }));
    }
    render();
    return wrap;
  };
})(RVN);
