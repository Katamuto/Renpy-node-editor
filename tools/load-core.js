// Loads every non-UI script listed in index.html into a Node vm context and returns the RVN namespace (for tests and tools).
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = function () {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.includes('/editor/') && !s.endsWith('main.js'));
  const sb = { console, atob, btoa, TextEncoder, TextDecoder, Date, Math, Response, Blob, DecompressionStream, URL };
  sb.window = sb; vm.createContext(sb);
  srcs.forEach(s => vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), sb, { filename: s }));
  return sb.RVN;
};
