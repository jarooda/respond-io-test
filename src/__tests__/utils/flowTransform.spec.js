import { describe, expect, it } from 'vitest'

import rawPayload from '../../../payload.json'
import {
  CARD_HEIGHT,
  CONNECTOR_HEIGHT,
  V_GAP,
  applyLayout,
  layoutTree,
  toFlowElements,
} from '@/utils/flowTransform'
import { normalizeFlow } from '@/utils/flowNormalize'

const payload = normalizeFlow(rawPayload)

describe('toFlowElements', () => {
  const { nodes, edges } = toFlowElements(payload)
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]))

  it('creates one node per payload item with string ids', () => {
    expect(nodes).toHaveLength(payload.length)
    expect(nodes.every((node) => typeof node.id === 'string')).toBe(true)
    expect(byId['1']).toBeDefined()
  })

  it('maps connectors to the connector type and everything else to flow', () => {
    expect(byId['161f52'].type).toBe('connector')
    expect(byId['28c4b9'].type).toBe('connector')
    expect(byId['d09c08'].type).toBe('flow')
    expect(byId['161f52'].selectable).toBe(false)
  })

  it('keeps the cached item on data.node when it already has a position', () => {
    const laidOut = applyLayout(payload)
    const node = toFlowElements(laidOut).nodes.find((n) => n.id === 'e879e4')
    expect(node.data.node).toBe(laidOut.find((item) => item.id === 'e879e4'))
  })

  it('creates an edge for every item with a known parent', () => {
    expect(edges).toHaveLength(payload.length - 1)
    expect(edges).toContainEqual(
      expect.objectContaining({ source: '1', target: 'd09c08', type: 'smoothstep' }),
    )
  })

  it('colors edges by the source node tone', () => {
    const fromTrigger = edges.find((edge) => edge.source === '1')
    const fromSuccess = edges.find((edge) => edge.source === '161f52')
    expect(fromTrigger.style.stroke).toBe('var(--warning)')
    expect(fromSuccess.style.stroke).toBe('var(--success)')
  })

  it('returns empty elements for no data', () => {
    expect(toFlowElements(undefined)).toEqual({ nodes: [], edges: [] })
  })
})

describe('applyLayout', () => {
  it('gives every item a position from the tree layout', () => {
    const laidOut = applyLayout(payload)
    const positions = layoutTree(payload)
    for (const item of laidOut) expect(item.position).toEqual(positions.get(String(item.id)))
  })

  it('keeps stored positions and only fills the missing ones', () => {
    const moved = { ...payload[0], position: { x: 999, y: 999 } }
    const laidOut = applyLayout([moved, ...payload.slice(1)])
    expect(laidOut[0]).toBe(moved)
    expect(laidOut.slice(1).every((item) => item.position)).toBe(true)
  })

  it('returns the same array when nothing is missing', () => {
    const laidOut = applyLayout(payload)
    expect(applyLayout(laidOut)).toBe(laidOut)
  })

  it('does not mutate the input', () => {
    applyLayout(payload)
    expect(payload.some((item) => item.position)).toBe(false)
  })
})

describe('toFlowElements positions', () => {
  it('uses stored positions, so relinking does not move nodes', () => {
    const laidOut = applyLayout(payload)
    const before = toFlowElements(laidOut).nodes.find((node) => node.id === 'b0653a').position
    // Move "Welcome Message" under "Add Comment #1": the tree changes, positions must not.
    const relinked = laidOut.map((item) =>
      item.id === 'b0653a' ? { ...item, parentId: 'e879e4' } : item,
    )
    const after = toFlowElements(relinked).nodes.find((node) => node.id === 'b0653a').position
    expect(after).toEqual(before)
  })
})

describe('layoutTree', () => {
  const positions = layoutTree(payload)

  it('centers a parent over its children', () => {
    const success = positions.get('161f52').x
    const failure = positions.get('28c4b9').x
    expect(positions.get('d09c08').x).toBe((success + failure) / 2)
  })

  it('stacks rows by the real height of the parent', () => {
    const trigger = positions.get('1')
    const businessHours = positions.get('d09c08')
    const success = positions.get('161f52')
    const welcome = positions.get('b0653a')

    expect(businessHours.y).toBe(trigger.y + CARD_HEIGHT + V_GAP)
    expect(success.y).toBe(businessHours.y + CARD_HEIGHT + V_GAP)
    expect(welcome.y).toBe(success.y + CONNECTOR_HEIGHT + V_GAP)
  })

  it('treats items with an unknown parent as roots', () => {
    const orphans = layoutTree([
      { id: 'a', parentId: -1 },
      { id: 'b', parentId: 'missing' },
    ])
    expect(orphans.get('a').y).toBe(0)
    expect(orphans.get('b').y).toBe(0)
    expect(orphans.get('a').x).not.toBe(orphans.get('b').x)
  })
})
