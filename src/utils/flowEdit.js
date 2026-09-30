import { CONNECTOR_TYPE } from '@/constants/nodeTypes'

export function removeNode(items, id) {
  const target = items.find((item) => String(item.id) === String(id))
  if (!target) return items

  const removed = new Set([String(target.id)])
  for (const item of items) {
    if (item.type === CONNECTOR_TYPE && String(item.parentId) === String(target.id)) {
      removed.add(String(item.id))
    }
  }

  return items
    .filter((item) => !removed.has(String(item.id)))
    .map((item) =>
      removed.has(String(item.parentId)) ? { ...item, parentId: target.parentId } : item,
    )
}

export function updateNode(items, id, patch) {
  return items.map((item) => {
    if (String(item.id) !== String(id)) return item
    const next = { ...item, ...patch }
    for (const [key, value] of Object.entries(patch)) if (value === undefined) delete next[key]
    return next
  })
}
