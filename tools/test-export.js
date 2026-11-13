// Headless test of the exporter (no browser): node tools/test-export.js [project.rvn.json] [out.zip]
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.includes('/editor/') && !s.endsWith('main.js'));
const sb = { console, atob, btoa, TextEncoder, TextDecoder, Date, Math }; sb.window = sb; vm.createContext(sb);
srcs.forEach(s => vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), sb, { filename: s }));
const R = sb.RVN;
const file = process.argv[2] || path.join(root, 'examples', 'branching-demo.rvn.json');
const project = JSON.parse(fs.readFileSync(file, 'utf8'));
R.model.setProject(project);
const res = R.exporter.script(R.state.project);
console.log(res.text); console.log('warnings:', JSON.stringify(res.warnings));
const zip = R.exporter.build(R.state.project);
const out = process.argv[3] || '/tmp/export-test.zip';
fs.writeFileSync(out, Buffer.from(zip.bytes)); console.log('zip:', out, zip.bytes.length, 'bytes');
