/* Node type registry. Every file in js/nodes/ calls RVN.registry.register({...}).
   Definition contract (all optional except type/label):
     type, label, category, icon
     inputs   : true (default) -> one input port (several links may arrive = merge) | false | (node) => [{id,label}] several inputs
     title    : (node) => text for the node header (default: label)
     actions  : [{label, run(node)}] extra buttons in the inspector
     inner    : true -> only offered inside containers
     outputs  : (node) => [{id, label}]   default: one port "next"
     defaults : (project) => data object for a new node
     fields   : [{key,label,kind,...}] inspector form (see editor/inspector.js)
     summary  : (node) => short text shown inside the node
     emit     : (node, ctx) => string[]   Ren'Py lines for a linear node
     branch   : (node, ctx) => items[]    for nodes with several exits (menu, if, call screen). See exporter/emit-script.js
     texts    : (node, project) => [{text, note}]   player-visible strings, collected for translation
     terminal : true -> flow stops after this node (end, jump)
     unique / hidden / undeletable : used by start node */
(function (R) {
  const types = {}, order = [];
  R.registry = {
    register(def) {
      if (!def.type) throw new Error('node type needs a "type"');
      def.category = def.category || 'Misc';
      def.fields = def.fields || [];
      def.defaults = def.defaults || (() => ({}));
      def.outputs = def.outputs || (() => [{ id: 'next', label: '' }]);
      if (def.inputs === undefined) def.inputs = true;
      if (!types[def.type]) order.push(def.type);
      types[def.type] = def;
    },
    get(t) {
      return types[t] || { type: t, label: '? ' + t, category: 'Misc', fields: [], defaults: () => ({}), outputs: () => [], inputs: true, summary: () => 'Unknown node type' };
    },
    list() { return order.map(t => types[t]); },
    visible() { const inside = R.state && R.state.path.length > 0; return order.map(t => types[t]).filter(d => !d.hidden && (!d.inner || inside)); }
  };
})(RVN);
