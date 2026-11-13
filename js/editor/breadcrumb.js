/* Small guide at the top of the canvas: Main > Chapter 1 > Scene A. Click a crumb to go back to that level. */
(function (R) {
  R.breadcrumb = {
    init() {
      const el = R.el, bar = el('div', { class: 'crumbs' });
      R.canvas.el.append(bar);
      const render = () => {
        const cs = R.model.crumbs(), kids = [];
        if (cs.length > 1) kids.push(el('button', { class: 'crumb up', text: '⬆', title: 'Up one level (Alt+↑)', onclick: () => R.model.up() }));
        cs.forEach((c, i) => {
          if (i) kids.push(el('span', { class: 'sep', text: '›' }));
          kids.push(i === cs.length - 1 ? el('span', { class: 'crumb current', text: c.title }) : el('button', { class: 'crumb', text: c.title, onclick: () => R.model.goto(c.path) }));
        });
        bar.replaceChildren(...kids);
      };
      ['board:changed', 'graph:rebuild', 'node:updated'].forEach(e => R.events.on(e, render));
      bar.addEventListener('mousedown', e => e.stopPropagation());
      render();
    }
  };
})(RVN);
