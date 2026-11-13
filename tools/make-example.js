// Dev aid: regenerates examples/branching-demo.rvn (menu, condition, loop, merge, jump, screen with input, group, image variants, Spanish).
const fs = require('fs'), path = require('path'), R = require('./load-core')();
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const nodes = [], links = [];
const N = (id, type, x, y, data) => nodes.push({ id, type, x, y, data: data || {} });
const L = (from, port, to) => links.push({ id: 'l_' + links.length, from, port, to });
const screen = R.screens.create(); screen.id = 's_name'; screen.name = 'name_entry'; screen.yalign = 0.45;
screen.elements = [
  { id: 'e_t', type: 'text', text: 'What is your name?', size: 60, color: '#ffffff' },
  { id: 'e_i', type: 'input', variable: 'player_name', length: 14 },
  { id: 'e_b', type: 'button', text: 'Continue', action: 'close', varName: '', varValue: '', target: '' }];

N('start', 'start', 40, 200);
N('bg', 'scene', 300, 200, { image: 'bg room', transition: 'dissolve' });
N('show', 'show', 300, 380, { image: 'eileen happy', at: 'center', transition: 'dissolve' });
N('ask', 'screen', 560, 200, { mode: 'call', screen: 's_name', name: '', definition: '' });
N('hi', 'dialogue', 840, 200, { who: 'e', text: 'Welcome, [player_name]! Which way do you want to go?' });
N('menu', 'menu', 1120, 160, { prompt: '', choices: [
  { id: 'c1', text: 'Forest', cond: '' }, { id: 'c2', text: 'Cave', cond: '' }, { id: 'c3', text: 'Wait a bit', cond: '' }] });
N('forest', 'dialogue', 1460, 40, { who: 'e', text: 'You walk into the forest and feel brave.' });
N('brave', 'variable', 1740, 40, { name: 'courage', op: '+=', value: '1' });
N('cave', 'dialogue', 1460, 260, { who: 'e', text: 'You enter a dark cave...' });
N('cond', 'condition', 1740, 260, { expr: 'courage > 0' });
N('yes', 'dialogue', 2020, 220, { who: 'e', text: 'You are not afraid of the dark.' });
N('no', 'dialogue', 2020, 400, { who: 'e', text: 'It is too scary. You run out! 100% scared.' });
N('wait', 'dialogue', 1460, 500, { who: 'e', text: 'You wait for a moment. (loops back to the menu)' });
N('river', 'dialogue', 2300, 200, { who: 'e', text: 'All paths meet at the river.' });
N('jmp', 'jump', 2580, 200, { target: 'lbl' });
N('lbl', 'label', 2300, 440, { name: 'epilogue' });
N('last', 'dialogue', 2580, 440, { who: '', text: 'The end. (Reached through a Jump to a Label node.)' });
N('end', 'end', 2860, 440);
N('note', 'comment', 40, 520, { text: 'Demo: screen with a text input, 3 menu exits, a loop (Wait), a merge (river), a Jump to a Label, image variants and a Spanish translation.' });
L('start', 'next', 'bg'); L('bg', 'next', 'show'); L('show', 'next', 'ask'); L('ask', 'next', 'hi'); L('hi', 'next', 'menu');
L('menu', 'c1', 'forest'); L('menu', 'c2', 'cave'); L('menu', 'c3', 'wait'); L('wait', 'next', 'menu');
L('forest', 'next', 'brave'); L('brave', 'next', 'river');
L('cave', 'next', 'cond'); L('cond', 'true', 'yes'); L('cond', 'false', 'no'); L('yes', 'next', 'river'); L('no', 'next', 'river');
L('river', 'next', 'jmp'); L('lbl', 'next', 'last'); L('last', 'next', 'end');

const asset = (id, file, role) => ({ id, kind: 'image', name: R.assets.nameFromFile(file), path: 'images/' + file, mime: 'image/png', bytes: new Uint8Array(PNG), role });
const project = { format: 'rvn', version: 2, meta: { name: 'Branching Demo', version: '1.0' },
  characters: [{ id: 'e', name: 'Eileen', color: '#c8ffc8' }],
  variables: [{ name: 'courage', value: '0' }, { name: 'player_name', value: '""' }],
  assets: [asset('a1', 'bg_room.png', 'background'), asset('a2', 'eileen_happy.png', 'sprite'), asset('a3', 'eileen_sad.png', 'sprite')],
  groups: [{ id: 'g1', title: 'Forest path', color: '#2f8f6b', nodeIds: ['forest', 'brave'] }, { id: 'g2', title: 'Cave path', color: '#8a5cc2', nodeIds: ['cave', 'cond', 'yes', 'no'] }],
  screens: [screen], nodes, links,
  translations: { base: 'English', languages: [{ code: 'spanish', name: 'Español', iso: 'es' }], strings: {
    'Welcome, [player_name]! Which way do you want to go?': { spanish: '¡Bienvenido, [player_name]! ¿Por qué camino quieres ir?' },
    'Forest': { spanish: 'Bosque' }, 'Cave': { spanish: 'Cueva' }, 'Wait a bit': { spanish: 'Esperar un poco' },
    'What is your name?': { spanish: '¿Cómo te llamas?' }, 'Continue': { spanish: 'Continuar' },
    'It is too scary. You run out! 100% scared.': { spanish: '¡Da demasiado miedo! ¡Sales corriendo! 100% asustado.' } } } };
fs.writeFileSync(path.join(__dirname, '..', 'examples', 'branching-demo.rvn'), Buffer.from(R.io.pack(project)));
console.log('ok');

// Second demo: same story, but the forest and cave paths are packed into containers (open them with a double-click).
R.model.setProject(project);
R.model.select({ nodeIds: ['forest', 'brave'] }); const f = R.model.makeContainer(R.model.selectedIds()); f.data.title = 'Forest path';
R.model.select({ nodeIds: ['cave', 'cond', 'yes', 'no'] }); const c = R.model.makeContainer(R.model.selectedIds()); c.data.title = 'Cave path';
fs.writeFileSync(path.join(__dirname, '..', 'examples', 'containers-demo.rvn'), Buffer.from(R.io.pack(R.state.project)));
console.log('containers demo ok');
