/* Fonts. Two levels:
   1. Game font (Story tab): patches the three gui.rpy font variables (dialogue, character names, interface).
   2. Font per language (Translate tab): Ren'Py has no per-language font switch that is safe to undo, so every translated text of that
      language is wrapped in {font=...}...{/font}. It only applies while that language is active and needs no Python.
      (Not wrapped: the game title, and texts Ren'Py itself shows that are not in our list.) */
(function (R) {
  const U = R.util;
  const asset = (project, id) => project.assets.find(a => a.id === id && a.kind === 'font') || null;

  R.patchGui = function (guiText, project) {
    const text = asset(project, project.meta.fontText), ui = asset(project, project.meta.fontUi) || text;
    let t = guiText;
    const set = (name, a) => { if (a) t = t.replace(new RegExp('^(define gui\\.' + name + ' = )[^\\r\\n]*', 'm'), (m, pre) => pre + '"' + U.q(a.path) + '"'); };
    set('text_font', text); set('name_text_font', text); set('interface_text_font', ui);
    return t;
  };

  // {font=...} wrapper for one language, or null
  R.languageFont = function (project, lang) {
    const a = lang.font && asset(project, lang.font);
    return a ? { open: '{font=' + a.path + '}', close: '{/font}', path: a.path } : null;
  };
})(RVN);
