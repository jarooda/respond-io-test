import { describe, expect, it } from 'vitest'

import rawPayload from '../../../payload.json'
import { getConnectionError, reparentNode } from '@/utils/flowConnect'
import { normalizeFlow } from '@/utils/flowNormalize'

// Tree: 1 → d09c08 → {161f52 → b0653a, 28c4b9 → b6a0c1 → e879e4}
const items = normalizeFlow(rawPayload)
const orphan = { id: 'aaa111', parentId: -1, type: 'addComment', data: {} }
const withOrphan = [...items, orphan]

describe('getConnectionError', () => {
  it('allows linking a new root node under a card', () => {
    expect(getConnectionError(withOrphan, 'e879e4', 'aaa111')).toBeNull()
  })

  it('allows linking from a Success/Failure branch', () => {
    expect(getConnectionError(withOrphan, '161f52', 'aaa111')).toBeNull()
  })

  it('allows moving an existing node under another parent', () => {
    expect(getConnectionError(items, 'b0653a', 'e879e4')).toBeNull()
  })

  it('accepts numeric ids in either form', () => {
    expect(getConnectionError(withOrphan, 1, 'aaa111')).toBeNull()
    expect(getConnectionError(withOrphan, '1', 'aaa111')).toBeNull()
  })

  it.each([
    ['unknown nodes', 'nope', 'aaa111', 'Node not found'],
    ['self links', 'aaa111', 'aaa111', "A node can't connect to itself"],
    ['linking into the trigger', 'aaa111', '1', 'The trigger must stay at the start of the flow'],
    [
      'linking into a connector',
      'aaa111',
      '161f52',
      'Success and Failure always belong to their business hours node',
    ],
    [
      'linking straight from business hours',
      'd09c08',
      'aaa111',
      'Connect from its Success or Failure branch instead',
    ],
    ['duplicate links', '28c4b9', 'b6a0c1', 'These nodes are already connected'],
    ['linking a node under its own descendant', 'e879e4', 'b6a0c1', 'This would create a loop'],
  ])('rejects %s', (_, source, target, message) => {
    expect(getConnectionError(withOrphan, source, target)).toBe(message)
  })
})

describe('reparentNode', () => {
  it('moves only the target and returns a new list', () => {
    const result = reparentNode(withOrphan, 'aaa111', 1)
    expect(result).not.toBe(withOrphan)
    expect(result.find((item) => item.id === 'aaa111').parentId).toBe(1)
    expect(orphan.parentId).toBe(-1)
    expect(result.filter((item, i) => item !== withOrphan[i])).toHaveLength(1)
  })
})
