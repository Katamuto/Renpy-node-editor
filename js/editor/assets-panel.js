/* "Assets" tab: import images and audio (stored as binary inside the .rvn file; copied to game/images and game/audio on export).
   Images are AUTO-LABELED from their file name: eileen_happy.png -> "eileen happy" = family "eileen", variant "happy".
   Each family is shown as one card with its variants. Settings: role (background / sprite / cg / other),
   background fit (cover, contain, stretch, native) and sprite zoom. Settings of a family are copied to new variants automatically. */
(function (R) {
  const el = R.el, A = R.assets;
  const ROLES = [['background', 'Background'], ['sprite', 'Character / sprite'], ['cg', 'CG / event image'], ['other', 'Other']];
  const FITS = [['cover', 'Fill screen (crop edges)'], ['contain', 'Fit inside (bars)'], ['fill', 'Stretch to screen'], ['none', 'Native size']];

  const refreshTabs = () => ['assets', 'story', 'translations', 'screens'].forEach(id => R.panels.refresh(id));

  function addFile(f) {
    const isFont = /\.(ttf|otf|ttc)$/i.test(f.name);
    const kind = isFont ? 'font' : f.type.startsWith('image/') ? 'image' : f.type.startsWith('audio/') ? 'audio' : null;
    if (!kind) { R.ui.toast('Unsupported file: ' + f.name); return; }
    f.arrayBuffer().then(buf => {
      const assets = R.state.project.assets, dir = kind === 'image' ? 'images/' : 'audio/';
      let file = f.name.replace(/[^\w.\- ]+/g, '_'), n = 2;
      while (assets.some(a => a.path === dir + file)) file = f.name.replace(/(\.[^.]*)?$/, '_' + n++ + '$1');
      const a = { id: R.util.uid('a'), kind, path: dir + file, mime: f.type || (isFont ? A.fontMime(f.name) : ''), bytes: new Uint8Array(buf) };
      if (kind === 'image') {
        a.name = A.nameFromFile(f.name); a.role = A.guessRole(a.name);
        const sib = assets.find(x => x.kind === 'image' && A.tagOf(x.name) === A.tagOf(a.name));   // same family -> same settings
        if (sib) { a.role = sib.role; a.fit = sib.fit; a.zoom = sib.zoom; }
        A.normalize(a);
      } else a.name = f.name.replace(/\.[^.]+$/, '');
      assets.push(a); R.model.touch(); refreshTabs();
    });
  }

  function settings(a, family) {
    const set = (patch) => { Object.assign(a, patch); R.model.touch(); };
    const sel = (opts, val, fn) => el('select', { onchange: e => fn(e.target.value) }, opts.map(o => el('option', { value: o[0], selected: o[0] === val, text: o[1] })));
    const box = el('div', { class: 'settings' },
      el('label', { class: 'field' }, el('span', { text: 'Type' }), sel(ROLES, a.role, v => { Object.assign(a, { role: v }, A.defaults(v)); R.model.touch(); R.panels.refresh('assets'); })));
    if (a.role === 'background') box.append(el('label', { class: 'field' }, el('span', { text: 'Fit to screen' }), sel(FITS, a.fit, v => set({ fit: v }))));
    else box.append(el('label', { class: 'field' }, el('span', { text: 'Size (1 = native)' }), el('input', { type: 'number', step: '0.05', min: '0.05', value: a.zoom, oninput: e => set({ zoom: parseFloat(e.target.value) || 1 }) })));
    if (family.length > 1) box.append(el('button', { class: 'btn small', text: 'Apply to all ' + A.tagOf(a.name) + ' variants',
      onclick: () => { family.forEach(x => Object.assign(x, { role: a.role, fit: a.fit, zoom: a.zoom })); R.model.touch(); R.ui.toast('Applied to ' + family.length + ' images'); } }));
    return box;
  }

  function imageCard(a, family) {
    const open = { v: false }, card = el('div', { class: 'asset' });
    const draw = () => {
      card.replaceChildren(
        el('img', { src: A.url(a), alt: a.name }),
        el('div', { class: 'asset-info' },
          el('input', { type: 'text', value: a.name, title: 'Image name used in nodes: family + variant', oninput: e => { a.name = e.target.value.trim().replace(/\s+/g, ' '); R.model.touch(); } }),
          el('small', { text: a.path + ' · ' + Math.round(a.bytes.length / 1024) + ' KB · ' + a.role }),
          open.v ? settings(a, family) : null),
        el('div', { class: 'asset-btns' },
          el('button', { class: 'icon-btn', text: open.v ? '▾' : '⚙', title: 'Settings', onclick: () => { open.v = !open.v; draw(); } }),
          el('button', { class: 'icon-btn', text: '✕', title: 'Remove', onclick: () => remove(a) })));
    };
    draw(); return card;
  }

  function remove(a) {
    const assets = R.state.project.assets; A.forget(a); assets.splice(assets.indexOf(a), 1);
    R.model.touch(); refreshTabs();
  }

  R.panels.register('assets', 'Assets', function (host) {
    const P = R.state.project, input = el('input', { type: 'file', multiple: true, accept: 'image/*,audio/*,.ttf,.otf,.ttc', hidden: true, onchange: e => { [...e.target.files].forEach(addFile); input.value = ''; } });
    host.append(el('h3', { text: 'Images, audio & fonts' }), input,
      el('button', { class: 'btn', text: '+ Import files…', onclick: () => input.click() }),
      el('p', { class: 'hint', text: 'Name files like eileen_happy.png, eileen_sad.png, bg_room.png: they are labeled automatically (family + variant). In nodes you pick the family, then the variant.' }));
    [['background', 'Backgrounds'], ['sprite', 'Characters / sprites'], ['cg', 'CG / events'], ['other', 'Other images']].forEach(([role, title]) => {
      const tags = A.tags(P, role); if (!tags.length) return;
      host.append(el('h4', { class: 'sec', text: title }));
      tags.forEach(t => {
        const fam = t.variants.map(v => v.asset);
        host.append(el('div', { class: 'family' }, el('div', { class: 'family-title', text: t.tag + '  ·  ' + t.variants.length + ' variant' + (t.variants.length > 1 ? 's' : '') }), fam.map(a => imageCard(a, fam))));
      });
    });
    const fonts = A.fonts(P);
    if (fonts.length) host.append(el('h4', { class: 'sec', text: 'Fonts' }), ...fonts.map(a => el('div', { class: 'asset font' },
      el('div', { class: 'font-sample', style: 'font-family:"' + A.fontFamily(a) + '",sans-serif', text: 'Aa 123 áéñü' }),
      el('div', { class: 'asset-info' },
        el('input', { type: 'text', value: a.name, title: 'Name shown in the editor', oninput: e => { a.name = e.target.value; R.model.touch(); } }),
        el('small', { text: a.path + ' · ' + Math.round(a.bytes.length / 1024) + ' KB' })),
      el('button', { class: 'icon-btn', text: '✕', title: 'Remove', onclick: () => remove(a) }))),
      el('p', { class: 'hint', text: 'Choose the game font in the Story tab and a font per language in the Translate tab.' }));
    const audio = P.assets.filter(a => a.kind === 'audio');
    if (audio.length) host.append(el('h4', { class: 'sec', text: 'Audio' }), ...audio.map(a => el('div', { class: 'asset audio' },
      el('div', { class: 'audio-ico', text: '🎵' }),
      el('div', { class: 'asset-info' }, el('div', { class: 'mono', text: a.path }), el('small', { text: Math.round(a.bytes.length / 1024) + ' KB' })),
      el('button', { class: 'icon-btn', text: '✕', title: 'Remove', onclick: () => remove(a) }))));
  });
})(RVN);
