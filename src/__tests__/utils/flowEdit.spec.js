import { describe, expect, it } from 'vitest'

import rawPayload from '../../../payload.json'
import { removeNode, updateNode } from '@/utils/flowEdit'
import { normalizeFlow } from '@/utils/flowNormalize'

// Tree: 1 → d09c08 → {161f52 → b0653a, 28c4b9 → b6a0c1 → e879e4}
const items = normalizeFlow(rawPayload)
const find = (list, id) => list.find((item) => String(item.id) === id)

describe('removeNode', () => {
  it('removes the node and re-attaches its children to its parent', () => {
    const next = removeNode(items, 'b6a0c1')
    expect(find(next, 'b6a0c1')).toBeUndefined()
    expect(find(next, 'e879e4').parentId).toBe('28c4b9')
    expect(next).toHaveLength(items.length - 1)
  })

  it('removes business hours together with its connectors', () => {
    const next = removeNode(items, 'd09c08')
    expect(next.map((item) => item.id)).not.toEqual(
      expect.arrayContaining(['d09c08', '161f52', '28c4b9']),
    )
    // Branch children move up to the trigger.
    expect(find(next, 'b0653a').parentId).toBe(1)
    expect(find(next, 'b6a0c1').parentId).toBe(1)
  })

  it('makes children of a root node roots themselves', () => {
    const next = removeNode(items, '1')
    expect(find(next, 'd09c08').parentId).toBe(-1)
  })

  it('returns the same list for unknown ids and never mutates input', () => {
    expect(removeNode(items, 'nope')).toBe(items)
    removeNode(items, 'b6a0c1')
    expect(find(items, 'e879e4').parentId).toBe('b6a0c1')
  })
})

describe('updateNode', () => {
  it('merges the patch into the matching item only', () => {
    const next = updateNode(items, 'e879e4', { name: 'Renamed', data: { comment: 'x' } })
    expect(find(next, 'e879e4')).toMatchObject({ name: 'Renamed', data: { comment: 'x' } })
    expect(find(next, 'b6a0c1')).toBe(find(items, 'b6a0c1'))
  })

  it('removes keys patched to undefined', () => {
    const withDescription = updateNode(items, 'e879e4', { description: 'Note' })
    const cleared = updateNode(withDescription, 'e879e4', { description: undefined })
    expect(find(cleared, 'e879e4')).not.toHaveProperty('description')
  })
})
