/* DOM helper: RVN.el('div', {class:'x', onclick: fn, text:'hi'}, child, [children], ...) and a toast. */
(function (R) {
  R.ui = R.ui || {};
  R.el = function (tag, props, ...kids) {
    const e = document.createElement(tag);
    Object.keys(props || {}).forEach(k => {
      const v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    const add = (c) => { if (c === null || c === undefined || c === false) return; if (Array.isArray(c)) c.forEach(add); else e.append(c.nodeType ? c : document.createTextNode(String(c))); };
    kids.forEach(add);
    return e;
  };
  let timer;
  R.ui.toast = function (msg) {
    let t = document.getElementById('toast');
    if (!t) { t = R.el('div', { id: 'toast' }); document.body.append(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => t.classList.remove('show'), 3500);
  };
})(RVN);
