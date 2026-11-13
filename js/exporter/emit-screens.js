/* game/custom_screens.rpy: screens designed in the Screens tab + raw definitions typed in Screen nodes.
   Texts use _() so they are translatable. Buttons: exit -> Return("<port id>") ; close -> Return() ;
   setvar -> SetVariable ; jump -> Jump(label). Returns {text, warnings} or null. */
(function (R) {
  const U = R.util;
  R.emitScreens = function (project, heads) {
    const out = [], warnings = [], pad = (n) => '    '.repeat(n);
    const fontOf = (e) => { const f = e.font && project.assets.find(a => a.id === e.font && a.kind === 'font'); return f ? ' font "' + U.q(f.path) + '"' : ''; };
    project.screens.forEach(s => {
      const name = R.screens.ident(project, s);
      out.push('screen ' + name + '():');
      if (s.modal) out.push(pad(1) + 'modal True');
      if (s.bgKind === 'color') {
        const a = Math.round(Math.min(1, Math.max(0, Number(s.bgOpacity == null ? 1 : s.bgOpacity))) * 255).toString(16).padStart(2, '0');
        out.push(pad(1) + 'add Solid("' + U.q(String(s.bgValue || '#000000').slice(0, 7)) + a + '")');
      } else if (s.bgKind === 'image' && String(s.bgValue).trim()) out.push(pad(1) + 'add "' + U.q(String(s.bgValue).trim()) + '"');
      out.push(pad(1) + (s.layout === 'hbox' ? 'hbox:' : 'vbox:'),
        pad(2) + 'xalign ' + Number(s.xalign), pad(2) + 'yalign ' + Number(s.yalign), pad(2) + 'spacing ' + (Number(s.spacing) || 0));
      s.elements.forEach(e => {
        if (e.type === 'text') out.push(pad(2) + 'text _("' + U.qt(e.text) + '")' + (Number(e.size) ? ' size ' + Number(e.size) : '') + (e.color ? ' color "' + U.q(e.color) + '"' : '') + fontOf(e));
        else if (e.type === 'image') { if (String(e.image).trim()) out.push(pad(2) + 'add "' + U.q(String(e.image).trim()) + '"'); }
        else if (e.type === 'input') out.push(pad(2) + 'input value VariableInputValue("' + U.ident(e.variable, 'player_name') + '") length ' + (Number(e.length) || 16));
        else if (e.type === 'button') {
          let act = 'Return()';
          if (e.action === 'exit') act = 'Return("' + U.q(e.id) + '")';
          else if (e.action === 'setvar') act = 'SetVariable("' + U.ident(e.varName, 'x') + '", ' + (String(e.varValue).trim() || 'None') + ')';
          else if (e.action === 'jump') {
            const lbl = heads && heads.get(e.target);
            if (lbl) act = 'Jump("' + lbl + '")'; else warnings.push({ msg: 'Screen "' + s.name + '": button "' + e.text + '" jumps to a missing label' });
          }
          out.push(pad(2) + 'textbutton _("' + U.qt(e.text) + '") action ' + act);
        }
      });
      out.push('');
    });
    const seen = new Set();
    R.allNodes(project).filter(n => n.type === 'screen' && String(n.data.definition).trim()).forEach(n => {
      const key = U.ident(n.data.name, n.id); if (seen.has(key)) return;
      seen.add(key); out.push(String(n.data.definition).replace(/\s+$/, ''), '');
    });
    return out.length ? { text: '# Screens defined in the node editor\n\n' + out.join('\n').replace(/\n+$/, '\n'), warnings } : null;
  };
})(RVN);
