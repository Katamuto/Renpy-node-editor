/* Declares every image asset explicitly (image <name> = <expr>) so names in nodes always match.
   <expr> carries the per-image settings: background fit (cover/contain/fill) and sprite zoom (see core/assets.js).
   Returns null if there are no image assets. */
(function (R) {
  R.emitImages = function (project) {
    const lines = ['# Images imported in the node editor', ''];
    project.assets.filter(a => a.kind === 'image').forEach(a => {
      const name = String(a.name).trim().replace(/\s+/g, ' ');
      if (name) lines.push('image ' + name + ' = ' + R.assets.expr(a));
    });
    return lines.length > 2 ? lines.join('\n') + '\n' : null;
  };
})(RVN);
