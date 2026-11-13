/* Assembles the Ren'Py project: template files + generated script + assets + screens + translations + fonts.
   RVN.exporter.script(project)        -> {text, warnings, lineMap}   (used by the Issues panel)
   RVN.exporter.files(project, opts)   -> {files:[{path, data|null}], folder, warnings, lineMap}   (opts.play: skip the .rvn copy)
   RVN.exporter.build(project)         -> {bytes, filename, warnings}  (ZIP of files()) */
(function (R) {
  const U = R.util;
  R.exporter = {
    script: (project) => R.emitScript(project),
    files(project, opts) {
      opts = opts || {};
      if (!R.templateFiles) throw new Error('template data missing (run tools/build-template.py)');
      const folder = U.slug(project.meta.name) || 'MyVisualNovel';
      const files = [], tr = R.emitTranslations(project), script = R.emitScript(project), warnings = script.warnings.slice();
      const add = (path, data) => files.push({ path, data: typeof data === 'string' ? U.toBytes(data) : data });
      ['game/', 'game/images/', 'game/audio/'].forEach(d => files.push({ path: d, data: null }));

      Object.keys(R.templateFiles).forEach(path => {
        let bytes = U.b64ToBytes(R.templateFiles[path]);
        if (path === 'game/options.rpy') bytes = R.emitOptions(U.fromBytes(bytes), project);
        else if (path === 'game/gui.rpy') bytes = R.patchGui(U.fromBytes(bytes), project);
        else if (path === 'game/screens.rpy' && tr) {
          const r = R.patchPreferences(U.fromBytes(bytes), project);
          if (!r.ok) warnings.push({ msg: 'Could not add the language picker to screens.rpy (unexpected template). Players can still change language with Language() actions.' });
          bytes = r.text;
        }
        add(path, bytes);
      });
      add('game/script.rpy', script.text);
      const images = R.emitImages(project); if (images) add('game/rvn_images.rpy', images);
      const scr = R.emitScreens(project, R.analyzeGraph(project).heads);
      if (scr) { add('game/custom_screens.rpy', scr.text); warnings.push(...scr.warnings); }
      if (tr) tr.files.forEach(f => add(f.path, f.text));
      project.assets.forEach(a => add('game/' + a.path, a.bytes));
      if (!opts.play) add('project.rvn', R.io.pack(project));   // lets you re-open the story in the editor
      return { files, folder, warnings, lineMap: script.lineMap };
    },
    build(project) {
      const r = R.exporter.files(project);
      const files = [{ path: r.folder + '/', data: null }].concat(r.files.map(f => ({ path: r.folder + '/' + f.path, data: f.data })));
      return { bytes: R.zip.build(files), filename: r.folder + '.zip', warnings: r.warnings };
    }
  };
})(RVN);
