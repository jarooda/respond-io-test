import { CONNECTOR_TYPE } from '@/constants/nodeTypes'

export function getConnectionError(items, sourceId, targetId) {
  const byId = new Map(items.map((item) => [String(item.id), item]))
  const source = byId.get(String(sourceId))
  const target = byId.get(String(targetId))

  if (!source || !target) return 'Node not found'
  if (source === target) return "A node can't connect to itself"
  if (target.type === 'trigger') return 'The trigger must stay at the start of the flow'
  if (target.type === CONNECTOR_TYPE)
    return 'Success and Failure always belong to their business hours node'
  if (source.type === 'businessHours') return 'Connect from its Success or Failure branch instead'
  if (String(target.parentId) === String(source.id)) return 'These nodes are already connected'

  // Walk up from the source; reaching the target means the target is an ancestor → loop.
  for (let node = source; node; node = byId.get(String(node.parentId))) {
    if (node === target) return 'This would create a loop'
  }

  return null
}

/** Returns a new item list with `targetId` moved under `parentId` (keeping the parent's id type). */
export function reparentNode(items, targetId, parentId) {
  return items.map((item) => (String(item.id) === String(targetId) ? { ...item, parentId } : item))
}
