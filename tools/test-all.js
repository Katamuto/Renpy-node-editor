// Headless tests (no browser): node tools/test-all.js
const fs = require('fs'), path = require('path'), assert = require('assert'), cp = require('child_process');
const R = require('./load-core')();
const eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
const sameMap = (a, b) => { eq(Object.keys(a).sort(), Object.keys(b).sort()); Object.keys(a).forEach(k => eq(a[k], b[k])); };
let n = 0; const ok = (name) => console.log('  ok  ' + name), T = async (name, fn) => { await fn(); n++; ok(name); };

(async () => {
  const bytes = new Uint8Array(fs.readFileSync(path.join(__dirname, '..', 'examples', 'branching-demo.rvn')));
  let project;

  await T('open .rvn (zip) with assets as binary', async () => {
    project = await R.io.parseAny(bytes); R.model.setProject(project);
    assert.strictEqual(project.assets.length, 3); assert.ok(project.assets[0].bytes.length > 50);
    assert.strictEqual(project.assets[1].name, 'eileen happy'); assert.strictEqual(project.assets[1].role, 'sprite');
  });
  await T('pack -> unpack round trip keeps everything', async () => {
    const again = await R.io.unpack(R.io.pack(R.state.project));
    assert.strictEqual(JSON.stringify(again.nodes), JSON.stringify(R.state.project.nodes));
    assert.strictEqual(again.assets[2].bytes.length, R.state.project.assets[2].bytes.length);
    eq(again.translations, R.state.project.translations);
  });
  await T('legacy v0.1 json still opens', async () => {
    const legacy = { format: 'rvn', version: 1, meta: { name: 'Old' }, characters: [], variables: [], nodes: [{ id: 's', type: 'start', x: 0, y: 0, data: {} }], links: [],
      assets: [{ id: 'a', kind: 'image', name: 'bg x', path: 'images/bg_x.png', mime: 'image/png', data: Buffer.from([1, 2, 3]).toString('base64') }] };
    const p = await R.io.parseAny(new TextEncoder().encode(JSON.stringify(legacy)));
    eq([...p.assets[0].bytes], [1, 2, 3]); R.model.setProject(p); R.model.setProject(project);
  });

  let out;
  await T('script: screen exits, merge label, loop label, jump, no fallthrough', () => {
    out = R.exporter.script(R.state.project);
    const t = out.text;
    assert.match(t, /label start:/); assert.match(t, /call screen name_entry/); assert.match(t, /jump epilogue/);
    assert.match(t, /define e = Character\(_\("Eileen"\), color="#c8ffc8"\)/); assert.match(t, /default player_name = ""/);
    assert.match(t, /label part_\d+:/); assert.match(t, /label epilogue:/); assert.match(t, /100%% scared/);
    eq(out.warnings, [], JSON.stringify(out.warnings));
    // every label body must end in jump/return (no fall-through into the next label)
    t.split(/\n(?=label )/).filter(b => b.startsWith('label ')).forEach(b => { const last = b.trim().split('\n').pop().trim(); assert.ok(/^(jump |return)/.test(last), 'label ends with: ' + last + '\n' + b); });
  });
  await T('screen with only a close button continues linearly', () => { assert.ok(!/_return ==/.test(out.text)); });

  await T('screen with exit buttons branches on _return', () => {
    const p = JSON.parse(JSON.stringify(R.state.project)); p.assets = [];
    const s = R.screens.create(); s.id = 's2'; s.name = 'Map Screen'; p.screens.push(s);
    p.nodes.push({ id: 'scr', type: 'screen', x: 0, y: 0, data: { mode: 'call', screen: 's2', name: '', definition: '' } });
    p.nodes.push({ id: 'x1', type: 'dialogue', x: 0, y: 0, data: { who: '', text: 'A' } }, { id: 'x2', type: 'dialogue', x: 0, y: 0, data: { who: '', text: 'B' } });
    const ex = R.screens.exits(s);
    p.links = p.links.filter(l => l.from !== 'show').concat([{ id: 'q1', from: 'show', port: 'next', to: 'scr' }, { id: 'q2', from: 'scr', port: ex[0].id, to: 'x1' }, { id: 'q3', from: 'scr', port: ex[1].id, to: 'x2' }]);
    p.links = p.links.filter(l => !(l.from === 'show' && l.to === 'ask'));
    R.model.setProject(p);
    const t = R.exporter.script(p).text;
    assert.match(t, /call screen map_screen\n\s+if _return == "e_/); assert.match(t, /\n\s+else:\n/);
    R.model.setProject(project);
  });

  await T('images: roles, fit, zoom', () => {
    const a = R.state.project.assets; assert.match(R.assets.expr(a[0]), /Transform\("images\/bg_room.png", xysize=\(config.screen_width, config.screen_height\), fit="cover"\)/);
    assert.strictEqual(R.assets.expr(a[1]), '"images/eileen_happy.png"');
    a[1].zoom = 0.8; assert.match(R.assets.expr(a[1]), /zoom=0.8/); a[1].zoom = 1;
    const tags = R.assets.tags(R.state.project, 'sprite'); assert.strictEqual(tags[0].tag, 'eileen'); assert.strictEqual(tags[0].variants.length, 2);
    assert.strictEqual(R.assets.nameFromFile('Bg_Living-Room.PNG'), 'bg living room'); assert.strictEqual(R.assets.guessRole('bg living'), 'background');
  });

  await T('translations: collect, PO round trip, CSV, import', () => {
    const P = R.state.project, I = R.i18n, es = P.translations.languages[0];
    const all = I.collect(P); assert.ok(all.length > 60, 'includes template UI strings: ' + all.length);
    assert.ok(all.some(e => e.text === 'Preferences') && all.some(e => e.text === 'Language') && all.some(e => e.text === 'Eileen') && all.some(e => e.text === 'What is your name?'));
    const po = I.toPO(P, es); assert.match(po, /"Language: es\\n"/); assert.match(po, /msgid "Forest"\nmsgstr "Bosque"/);
    const parsed = I.fromPO(po); assert.ok(parsed.entries.length === all.length);
    const copy = JSON.parse(JSON.stringify(P)); copy.translations.strings = {};
    const r = I.importEntries(copy, 'spanish', parsed.entries); assert.strictEqual(r.imported, 7);
    sameMap(copy.translations.strings, P.translations.strings);
    const csv = I.toCSV(P); const copy2 = JSON.parse(JSON.stringify(P)); copy2.translations.strings = {};
    assert.strictEqual(I.importCSV(copy2, csv).imported, 7); sameMap(copy2.translations.strings, P.translations.strings);
    const semi = I.parseCSV(csv).map(r => r.map(c => '"' + c.replace(/"/g, '""') + '"').join(';')).join('\r\n'); assert.strictEqual(I.importCSV(copy2, semi).imported, 7);   // Excel-style ; separated
    assert.notStrictEqual(I.placeholders('Hi [name]'), I.placeholders('Hola'));
    const multi = { id: 'a\nb "q" 50%', str: 'x', fuzzy: false }; const rt = I.fromPO('msgid ""\nmsgstr ""\n\nmsgid ' + '""\n"a\\n"\n"b \\"q\\" 50%"' + '\nmsgstr "x"\n'); assert.strictEqual(rt.entries[0].id, multi.id);
  });

  let zipPath = '/tmp/export-test.zip';
  await T('export zip: files, language picker, tl file, filter, options', () => {
    const res = R.exporter.build(R.state.project); fs.writeFileSync(zipPath, Buffer.from(res.bytes));
    const list = cp.execSync('unzip -Z1 ' + zipPath).toString().split('\n');
    ['game/script.rpy', 'game/custom_screens.rpy', 'game/rvn_images.rpy', 'game/rvn_translations.rpy', 'game/tl/spanish/rvn_strings.rpy', 'game/images/eileen_happy.png', 'game/gui.rpy', 'project.rvn']
      .forEach(f => assert.ok(list.some(x => x.endsWith('/' + f)), 'missing ' + f));
    const rd = (f) => cp.execSync('unzip -p ' + zipPath + ' "*/' + f + '"').toString();
    assert.match(rd('game/screens.rpy'), /textbutton "Español" action Language\("spanish"\)/); assert.match(rd('game/screens.rpy'), /textbutton "English" action Language\(None\)/);
    assert.match(rd('game/tl/spanish/rvn_strings.rpy'), /translate spanish strings:\n\n[\s\S]*old "Forest"\n\s+new "Bosque"/); assert.match(rd('game/tl/spanish/rvn_strings.rpy'), /100%% asustado/);
    assert.match(rd('game/rvn_translations.rpy'), /say_menu_text_filter/); assert.match(rd('game/options.rpy'), /config.name = _\("Branching Demo"\)/);
    assert.match(rd('game/custom_screens.rpy'), /screen name_entry\(\):\n\s+modal True\n\s+add Solid\("#00000099"\)[\s\S]*input value VariableInputValue\("player_name"\)[\s\S]*textbutton _\("Continue"\) action Return\(\)/);
    assert.match(rd('game/rvn_images.rpy'), /image bg room = Transform/); assert.match(rd('game/rvn_images.rpy'), /image eileen sad = "images\/eileen_sad.png"/);
    cp.execSync('unzip -tq ' + zipPath);
  });
  await T('deflate zips (made by other tools) can be read', async () => {
    const d = '/tmp/dz'; cp.execSync('rm -rf ' + d + ' && mkdir -p ' + d + ' && cd ' + d + ' && unzip -q ../export-test.zip && cd */ && zip -qr ../deflated.zip project.rvn game/script.rpy');
    const files = await R.zip.read(new Uint8Array(fs.readFileSync(d + '/deflated.zip'))); assert.ok(files.get('game/script.rpy').length > 100);
    const inner = await R.io.unpack(files.get('project.rvn')); assert.strictEqual(inner.nodes.length, R.state.project.nodes.length);
  });
  await T('model: group / ungroup / paste remaps ids and links', () => {
    const M = R.model, P = R.state.project;
    M.select({ nodeIds: ['forest', 'brave'] }); assert.ok(M.groupSelected() && M.groupOf('forest'));
    R.clipboard.data = null; M.select({ nodeIds: ['hi', 'menu', 'forest'] }); assert.ok(R.clipboard.copy());
    const before = P.nodes.length, lb = P.links.length; assert.ok(R.clipboard.paste(R.clipboard.data, { x: 0, y: 900 }));
    assert.strictEqual(P.nodes.length, before + 3); assert.strictEqual(P.links.length, lb + 2);   // hi->menu, menu c1->forest
    const newIds = P.nodes.slice(-3).map(x => x.id); assert.ok(P.links.slice(-2).every(l => newIds.includes(l.from) && newIds.includes(l.to)));
    M.removeNodes(newIds); assert.strictEqual(P.nodes.length, before);
    R.model.setProject(project);
  });

  const norm = (t) => { const m = {}; let i = 0; return t.replace(/part_\d+/g, x => m[x] || (m[x] = 'part_N' + (++i))); };
  const baseline = () => { R.model.setProject(project); return norm(R.exporter.script(R.state.project).text); };

  await T('containers: combine keeps the exported story identical (multi-input, multi-output)', () => {
    const want = baseline(), M = R.model;
    M.select({ nodeIds: ['forest', 'brave', 'cave', 'cond', 'yes', 'no'] });
    const c = M.makeContainer(M.selectedIds()); assert.ok(c);
    const ins = M.inputs(c), outs = M.outputs(c); assert.strictEqual(ins.length, 2); assert.strictEqual(outs.length, 3);
    assert.strictEqual(R.state.project.nodes.filter(n => n.type === 'container').length, 1);
    assert.strictEqual(R.flatten(R.state.project).nodes.some(n => n.type === 'container'), false);
    const out = R.exporter.script(R.state.project); assert.strictEqual(out.warnings.length, 0, JSON.stringify(out.warnings));
    assert.strictEqual(norm(out.text), want);
    // enter / breadcrumb / inner board
    M.enter(c.id); assert.strictEqual(R.state.path.length, 1); assert.strictEqual(M.crumbs().length, 2); assert.ok(M.node('forest')); assert.ok(!M.node('menu'));
    assert.ok(M.addNode('ginput', 0, 0)); M.up(); assert.strictEqual(R.state.path.length, 0); assert.strictEqual(M.addNode('ginput', 0, 0), null);
    // explode gives the original story back
    M.removeNodes([]); const extra = M.node(c.id).data.nodes.find(n => n.type === 'ginput' && n.data.label === 'in'); M.enter(c.id); M.removeNodes([extra.id]); M.up();
    assert.ok(M.explode(c.id)); assert.strictEqual(R.state.project.nodes.some(n => n.type === 'container'), false);
    assert.strictEqual(norm(R.exporter.script(R.state.project).text), want);
  });
  await T('containers: nested containers, labels inside, paste renews every id', () => {
    const want = baseline(), M = R.model;
    M.select({ nodeIds: ['cave', 'cond', 'yes', 'no'] }); const inner = M.makeContainer(M.selectedIds());
    M.select({ nodeIds: [inner.id, 'forest', 'brave'] }); const outerC = M.makeContainer(M.selectedIds());
    assert.strictEqual(R.allNodes(R.state.project).filter(n => n.type === 'container').length, 2);
    assert.strictEqual(norm(R.exporter.script(R.state.project).text), want);
    assert.ok(R.model.pathTo('yes').length === 2);                       // yes lives two levels down
    M.select({ nodeIds: [outerC.id] }); const before = R.allNodes(R.state.project).length;
    assert.ok(R.clipboard.copy()); assert.ok(R.clipboard.paste(R.clipboard.data, { x: 0, y: 1500 }));
    const all = R.allNodes(R.state.project), ids = all.map(n => n.id); assert.strictEqual(new Set(ids).size, ids.length, 'ids stay unique');
    assert.ok(all.length > before);
    const copy = R.state.project.nodes[R.state.project.nodes.length - 1]; assert.strictEqual(copy.type, 'container');
    assert.ok(copy.data.nodes.every(n => !['forest'].includes(n.id)));
    const t = R.exporter.script(R.state.project);                           // the copy is not connected: warns, does not crash
    assert.ok(t.warnings.some(w => /Not reachable/.test(w.msg)));
    R.model.setProject(project);
  });
  await T('containers: jump to a label inside a container, source map', () => {
    baseline(); const M = R.model;
    M.select({ nodeIds: ['lbl', 'last', 'end'] }); M.makeContainer(M.selectedIds());
    const out = R.exporter.script(R.state.project); assert.strictEqual(out.warnings.filter(w => !/Not reachable/.test(w.msg)).length, 0, JSON.stringify(out.warnings));
    assert.match(out.text, /jump epilogue/); assert.match(out.text, /label epilogue:/);
    const lines = out.text.split('\n'); assert.match(lines[out.lineMap['hi'] - 1], /^\s+e "Welcome/); assert.match(lines[out.lineMap['menu'] - 1], /menu:/);
    R.model.setProject(project);
  });
  await T('fonts: game font patches gui.rpy, language font wraps translations, picker uses it', () => {
    const P = JSON.parse(JSON.stringify(project)); P.assets = project.assets.map(a => Object.assign({}, a));
    P.assets.push({ id: 'f1', kind: 'font', name: 'Noto', path: 'fonts/Noto Sans.ttf', mime: 'font/ttf', bytes: new Uint8Array([1, 2, 3, 4]) },
                  { id: 'f2', kind: 'font', name: 'Jp', path: 'fonts/jp.otf', mime: 'font/otf', bytes: new Uint8Array([5, 6]) });
    P.meta.fontText = 'f1'; P.meta.fontUi = '';
    P.translations.languages[0].font = 'f2'; R.model.setProject(P);
    const res = R.exporter.build(P); fs.writeFileSync('/tmp/export-fonts.zip', Buffer.from(res.bytes));
    const rd = (f) => cp.execSync('unzip -p /tmp/export-fonts.zip "*/' + f + '"').toString();
    const gui = rd('game/gui.rpy'); assert.match(gui, /define gui.text_font = "fonts\/Noto Sans.ttf"/); assert.match(gui, /define gui.name_text_font = "fonts\/Noto Sans.ttf"/); assert.match(gui, /define gui.interface_text_font = "fonts\/Noto Sans.ttf"/);
    const tl = rd('game/tl/spanish/rvn_strings.rpy'); assert.match(tl, /new "\{font=fonts\/jp.otf\}Bosque\{\/font\}"/);
    assert.match(rd('game/screens.rpy'), /textbutton "Español" action Language\("spanish"\) text_font "fonts\/jp.otf"/);
    assert.ok(cp.execSync('unzip -Z1 /tmp/export-fonts.zip').toString().includes('/game/fonts/jp.otf'));
    assert.match(rd('game/options.rpy'), /config.name = _\("Branching Demo"\)/);     // title never gets font tags
    P.translations.languages[0].font = ''; const tl2 = R.emitTranslations(P).files[0].text; assert.ok(!/\{font=/.test(tl2));
    R.model.setProject(project);
  });
  console.log('\nall ' + n + ' tests passed');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
