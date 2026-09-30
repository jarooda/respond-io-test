import { describe, expect, it } from 'vitest'

import { CARD_HEIGHT, NODE_WIDTH } from '@/utils/flowTransform'
import { getCoveredRight, getFocusCenter } from '@/utils/viewport'

describe('getFocusCenter', () => {
  it('targets the node center when nothing covers the screen', () => {
    expect(getFocusCenter({ x: 100, y: 50 })).toEqual({
      x: 100 + NODE_WIDTH / 2,
      y: 50 + CARD_HEIGHT / 2,
    })
  })

  it('shifts right by half the covered width, in flow units', () => {
    const base = getFocusCenter({ x: 0, y: 0 })
    expect(getFocusCenter({ x: 0, y: 0 }, { zoom: 1, coveredRight: 400 }).x).toBe(base.x + 200)
    // At 2× zoom, 200 screen pixels are 100 flow units.
    expect(getFocusCenter({ x: 0, y: 0 }, { zoom: 2, coveredRight: 400 }).x).toBe(base.x + 100)
  })
})

describe('getCoveredRight', () => {
  it('uses the drawer width on wide screens', () => {
    expect(getCoveredRight(444, 1440)).toBe(444)
  })

  it('ignores the drawer when it would cover most of a narrow screen', () => {
    expect(getCoveredRight(444, 500)).toBe(0)
  })
})
