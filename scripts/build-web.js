// Copies the static editor into dist/ (used for GitHub Pages and as the Tauri frontend). No bundling: the editor IS static.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(dist, { recursive: true });
['index.html', 'css', 'js', 'examples'].forEach(p => fs.cpSync(path.join(root, p), path.join(dist, p), { recursive: true }));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('web build ready in dist/');
