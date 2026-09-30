import { LEGACY_NODE_TYPES } from '@/constants/nodeTypes'

export function normalizeNode(item) {
  const type = LEGACY_NODE_TYPES[item.type]
  return type ? { ...item, type } : item
}

export function normalizeFlow(items = []) {
  return items.map(normalizeNode)
}
