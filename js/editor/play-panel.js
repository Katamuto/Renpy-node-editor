/* "Play" tab (desktop app): choose the Ren'Py SDK, then launch the current story. In the browser it explains the alternative. */
(function (R) {
  const el = R.el, D = R.desktop; let drawLog = null;
  R.panels.register('play', 'Play', function (host) {
    if (!D.isDesktop()) {
      host.append(el('h3', { text: 'Play in Ren\'Py' }),
        el('p', { class: 'hint', text: 'Launching the game needs the desktop app (a web page cannot start programs). Here, use "Export Ren\'Py ZIP", extract it into your Ren\'Py projects folder and press Launch Project.' }));
      return;
    }
    D.listen();
    const sdk = D.sdk(), id = R.model.primary(), node = id && R.model.node(id);
    const log = el('div', { class: 'log' });
    const draw = drawLog = () => { log.replaceChildren(...D.log.map(l => el('div', { class: l.err ? 'err' : '', text: l.line }))); log.scrollTop = log.scrollHeight; };
    host.append(el('h3', { text: 'Play in Ren\'Py' }),
      el('p', { class: 'hint', text: 'Uses your own Ren\'Py SDK (download it from renpy.org and unzip it anywhere).' }),
      el('div', { class: 'status' + (sdk ? ' ok' : ''), text: sdk ? 'SDK: ' + sdk : 'No SDK selected' }),
      el('div', { class: 'btn-row wrap' },
        el('button', { class: 'btn', text: sdk ? 'Change SDK folder…' : 'Choose SDK folder…', onclick: async () => { if (await D.browseSdk()) R.panels.refresh('play'); } }),
        el('button', { class: 'btn primary', text: '▶ Play game (F5)', onclick: () => D.play() }),
        el('button', { class: 'btn', text: '▶ Play from selected node', title: 'Starts at the selected node with --warp (developer mode)', disabled: node ? null : true, onclick: () => D.play(id) })),
      el('h3', { text: 'Output' }), log, el('button', { class: 'btn small', text: 'Clear', onclick: () => D.clearLog() }));
    draw();
  });
  R.events.on('play:log', () => { if (drawLog) drawLog(); });
  R.events.on('selection:changed', () => { if (D.isDesktop()) R.panels.refresh('play'); });
})(RVN);
