export const getKeyboardMoves = (changes) =>
  changes
    .filter((change) => change.type === 'position' && change.dragging === false && change.position)
    .map(({ id, position }) => ({ id, position }))

export function getEnterNodeId(event) {
  if (event.key !== 'Enter' || event.repeat) return null
  const nodeElement = event.target?.closest?.('.vue-flow__node-flow')
  return nodeElement && nodeElement === event.target ? (nodeElement.dataset.id ?? null) : null
}
