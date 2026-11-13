(function (R) {
  const ACTIONS = ['play music', 'play sound', 'queue music', 'stop music', 'stop sound'];
  R.registry.register({
    type: 'audio', label: 'Audio', category: 'Audio', icon: '🎵',
    defaults: () => ({ action: 'play music', file: '', fade: 0, loop: true }),
    fields: [
      { key: 'action', label: 'Action', kind: 'select', options: ACTIONS },
      { key: 'file', label: 'File (ignored for stop)', kind: 'audio', placeholder: 'audio/theme.ogg' },
      { key: 'fade', label: 'Fade seconds (0 = none)', kind: 'number' },
      { key: 'loop', label: 'Loop', kind: 'checkbox' }
    ],
    summary: (n) => n.data.action + (n.data.action.startsWith('stop') ? '' : ' ' + (n.data.file || '?')),
    emit(n, ctx) {
      const d = n.data, fade = Number(d.fade) > 0 ? Number(d.fade) : 0;
      if (d.action.startsWith('stop')) return [d.action + (fade ? ' fadeout ' + fade : '')];
      if (!String(d.file).trim()) { ctx.warn(n, 'Audio node has no file'); return []; }
      const music = d.action.endsWith('music');
      let line = d.action + ' "' + R.util.q(String(d.file).trim()) + '"';
      if (fade && d.action.startsWith('play')) line += ' fadein ' + fade;
      if (music && !d.loop) line += ' noloop'; else if (!music && d.loop) line += ' loop';
      return [line];
    }
  });
})(RVN);
