RVN.registry.register({
  type: 'end', label: 'End', category: 'Flow', icon: '■',
  outputs: () => [], terminal: true,
  summary: () => 'Ends the game (return)',
  emit: () => ['return']
});
