import { afterEach, describe, expect, it } from 'vitest'

import { getEnterNodeId, getKeyboardMoves } from '@/utils/canvasEvents'

describe('getKeyboardMoves', () => {
  it('keeps final position changes that carry a position (arrow-key moves)', () => {
    const changes = [
      { id: 'a', type: 'position', dragging: false, position: { x: 5, y: 0 } },
      { id: 'b', type: 'position', dragging: true, position: { x: 1, y: 1 } }, // mid-drag
      { id: 'c', type: 'position', dragging: false }, // drag end, saved on drag-stop
      { id: 'd', type: 'select', selected: true },
    ]
    expect(getKeyboardMoves(changes)).toEqual([{ id: 'a', position: { x: 5, y: 0 } }])
  })

  it('returns nothing for unrelated changes', () => {
    expect(getKeyboardMoves([{ id: 'a', type: 'dimensions' }])).toEqual([])
  })
})

describe('getEnterNodeId', () => {
  let root

  const setup = (html) => {
    root = document.createElement('div')
    root.innerHTML = html
    document.body.append(root)
    return root
  }

  afterEach(() => root?.remove())

  it('returns the id when Enter is pressed on a flow node', () => {
    const node = setup(
      '<div class="vue-flow__node vue-flow__node-flow" data-id="b0653a"></div>',
    ).firstElementChild
    expect(getEnterNodeId({ key: 'Enter', target: node })).toBe('b0653a')
  })

  it('ignores other keys and held-down Enter', () => {
    const node = setup('<div class="vue-flow__node-flow" data-id="x"></div>').firstElementChild
    expect(getEnterNodeId({ key: ' ', target: node })).toBeNull()
    expect(getEnterNodeId({ key: 'Enter', repeat: true, target: node })).toBeNull()
  })

  it('ignores Enter inside a node (e.g. a field) and on connectors', () => {
    const inner = setup(
      '<div class="vue-flow__node-flow" data-id="x"><input /></div>',
    ).querySelector('input')
    expect(getEnterNodeId({ key: 'Enter', target: inner })).toBeNull()

    const connector = setup(
      '<div class="vue-flow__node-connector" data-id="c"></div>',
    ).firstElementChild
    expect(getEnterNodeId({ key: 'Enter', target: connector })).toBeNull()
  })

  it('handles targets that are not elements', () => {
    expect(getEnterNodeId({ key: 'Enter', target: window })).toBeNull()
  })
})
