/* Patches the template's options.rpy with the project name / version. Everything else is kept as is. */
(function (R) {
  R.emitOptions = function (templateText, project) {
    const U = R.util, name = project.meta.name || 'My Visual Novel';
    const buildName = U.slug(name).replace(/[^A-Za-z0-9_]/g, '') || 'MyVisualNovel';
    const set = (text, re, value) => text.replace(re, (m, pre) => pre + value);
    let t = templateText;
    t = set(t, /^(define config\.name = )[^\r\n]*/m, '_("' + U.q(name) + '")');
    t = set(t, /^(define config\.version = )[^\r\n]*/m, '"' + U.q(project.meta.version || '1.0') + '"');
    t = set(t, /^(define build\.name = )[^\r\n]*/m, '"' + buildName + '"');
    t = set(t, /^(define config\.save_directory = )[^\r\n]*/m, '"' + buildName + '-' + Math.floor(Date.now() / 1000) + '"');
    return t;
  };
})(RVN);
