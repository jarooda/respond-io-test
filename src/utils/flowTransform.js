import { CONNECTOR_TYPE, TONE_COLORS, getNodeTone } from '@/constants/nodeTypes'

export const NODE_WIDTH = 260
export const CARD_HEIGHT = 104
export const CONNECTOR_HEIGHT = 24
export const H_GAP = 40
export const V_GAP = 48

const isConnector = (item) => item.type === CONNECTOR_TYPE

export const getNodeHeight = (item) => (isConnector(item) ? CONNECTOR_HEIGHT : CARD_HEIGHT)

export function layoutTree(items) {
  const ids = new Set(items.map((item) => String(item.id)))
  const children = new Map()
  const roots = []

  for (const item of items) {
    const parentId = String(item.parentId)
    if (!ids.has(parentId)) {
      roots.push(item)
      continue
    }
    if (!children.has(parentId)) children.set(parentId, [])
    children.get(parentId).push(item)
  }

  const positions = new Map()
  let cursor = 0

  const place = (item, y) => {
    const id = String(item.id)
    const kids = children.get(id) ?? []
    const childY = y + getNodeHeight(item) + V_GAP
    let x
    if (kids.length === 0) {
      x = cursor
      cursor += NODE_WIDTH + H_GAP
    } else {
      kids.forEach((kid) => place(kid, childY))
      const first = positions.get(String(kids[0].id)).x
      const last = positions.get(String(kids.at(-1).id)).x
      x = (first + last) / 2
    }
    positions.set(id, { x, y })
  }

  roots.forEach((root) => place(root, 0))
  return positions
}

export function applyLayout(items = []) {
  if (items.every((item) => item.position)) return items
  const positions = layoutTree(items)
  return items.map((item) =>
    item.position ? item : { ...item, position: positions.get(String(item.id)) },
  )
}

export function toFlowElements(items = []) {
  const laidOut = applyLayout(items)
  const byId = new Map(items.map((item) => [String(item.id), item]))

  const nodes = laidOut.map((item) => ({
    id: String(item.id),
    type: isConnector(item) ? 'connector' : 'flow',
    position: item.position,
    data: { node: item },
    ...(isConnector(item) && { selectable: false, focusable: false }),
  }))

  const edges = items
    .filter((item) => byId.has(String(item.parentId)))
    .map((item) => {
      const source = byId.get(String(item.parentId))
      return {
        id: `e${item.parentId}-${item.id}`,
        source: String(item.parentId),
        target: String(item.id),
        type: 'smoothstep',
        style: { stroke: TONE_COLORS[getNodeTone(source)], strokeWidth: 1.5 },
      }
    })

  return { nodes, edges }
}
