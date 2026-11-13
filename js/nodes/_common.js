/* Shared option lists for node definitions. Loaded before the node files. */
(function (R) {
  R.nodeUtil = {
    transitions: ['', 'dissolve', 'fade', 'pixellate', 'moveinleft', 'moveinright', 'moveintop', 'moveinbottom', 'moveoutleft', 'moveoutright', 'vpunch', 'hpunch'],
    positions: ['', 'left', 'center', 'right', 'truecenter', 'offscreenleft', 'offscreenright'],
    withClause: (t) => (t ? ' with ' + t : ''),
    tag: (img) => String(img || '').trim().split(/\s+/)[0] || ''
  };
})(RVN);
