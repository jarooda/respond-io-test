import { describe, expect, it } from 'vitest'

import { ROOT_PARENT_ID, buildNewNodes, generateNodeId } from '@/utils/nodeFactory'

// Deterministic random: yields the given values in order.
const sequence = (...values) => {
  let i = 0
  return () => values[i++]
}

describe('generateNodeId', () => {
  it('returns a 6-char hex id', () => {
    expect(generateNodeId([])).toMatch(/^[0-9a-f]{6}$/)
  })

  it('pads short ids', () => {
    expect(generateNodeId([], () => 0)).toBe('000000')
  })

  it('retries until the id is unused, comparing ids as strings', () => {
    const random = sequence(0, 0, 1 / 0xffffff)
    expect(generateNodeId([0, '000000'], random)).toBe('000001')
  })
})

describe('buildNewNodes', () => {
  const form = { title: 'Holiday notice', description: 'Closed today', type: 'sendMessage' }

  it('builds a root node with title as name and the description', () => {
    const [node] = buildNewNodes(form, [])
    expect(node).toMatchObject({
      parentId: ROOT_PARENT_ID,
      type: 'sendMessage',
      name: 'Holiday notice',
      description: 'Closed today',
      data: { payload: [] },
    })
  })

  it('omits an empty description', () => {
    const [node] = buildNewNodes({ ...form, description: '' }, [])
    expect(node).not.toHaveProperty('description')
  })

  it('attaches to a given parent', () => {
    const [node] = buildNewNodes(form, ['abc123'], { parentId: 'abc123' })
    expect(node.parentId).toBe('abc123')
  })

  it('gives addComment an empty comment', () => {
    const [node] = buildNewNodes({ ...form, type: 'addComment' }, [])
    expect(node.data).toEqual({ comment: '' })
  })

  it('creates business hours with default times and Success/Failure connectors', () => {
    const [node, success, failure, ...rest] = buildNewNodes({ ...form, type: 'businessHours' }, [])

    expect(rest).toHaveLength(0)
    expect(node.data).toMatchObject({ timezone: 'UTC', action: 'businessHours' })
    expect(node.data.times).toHaveLength(7)
    expect(node.data.connectors).toEqual([success.id, failure.id])
    expect(success).toMatchObject({
      parentId: node.id,
      type: 'dateTimeConnector',
      name: 'Success',
      data: { connectorType: 'success' },
    })
    expect(failure).toMatchObject({ parentId: node.id, name: 'Failure' })
  })

  it('stores a given position and has none otherwise', () => {
    const [placed] = buildNewNodes(form, [], { position: { x: 10, y: 20 } })
    const [unplaced] = buildNewNodes(form, [])
    expect(placed.position).toEqual({ x: 10, y: 20 })
    expect(unplaced).not.toHaveProperty('position')
  })

  it('places business hours connectors below the node, either side of it', () => {
    const [node, success, failure] = buildNewNodes({ ...form, type: 'businessHours' }, [], {
      position: { x: 0, y: 0 },
    })
    expect(success.position.y).toBeGreaterThan(node.position.y)
    expect(success.position.y).toBe(failure.position.y)
    expect(success.position.x).toBe(-failure.position.x)
  })

  it('never reuses existing ids or repeats ids within one build', () => {
    const existing = ['000000', '000001']
    const random = sequence(0, 1 / 0xffffff, 2 / 0xffffff, 2 / 0xffffff, 3 / 0xffffff, 4 / 0xffffff)
    const ids = buildNewNodes({ ...form, type: 'businessHours' }, existing, { random }).map(
      (item) => item.id,
    )
    expect(ids).toEqual(['000002', '000003', '000004'])
  })
})
