import { describe, expect, it } from 'vitest'

import payload from '../../../payload.json'
import { normalizeFlow, normalizeNode } from '@/utils/flowNormalize'

describe('normalizeNode', () => {
  it('maps the legacy dateTime type to businessHours and keeps its data', () => {
    const legacy = { id: 'x', type: 'dateTime', data: { action: 'businessHours', timezone: 'UTC' } }
    expect(normalizeNode(legacy)).toEqual({ ...legacy, type: 'businessHours' })
  })

  it('does not mutate the input', () => {
    const legacy = { id: 'x', type: 'dateTime' }
    normalizeNode(legacy)
    expect(legacy.type).toBe('dateTime')
  })

  it('returns current types unchanged', () => {
    const item = { id: 'y', type: 'businessHours' }
    expect(normalizeNode(item)).toBe(item)
  })

  it('leaves the connector type alone', () => {
    const item = { id: 'z', type: 'dateTimeConnector' }
    expect(normalizeNode(item)).toBe(item)
  })
})

describe('normalizeFlow', () => {
  it('leaves no legacy types in the API payload', () => {
    const types = normalizeFlow(payload).map((item) => item.type)
    expect(types).not.toContain('dateTime')
    expect(types).toContain('businessHours')
  })

  it('handles missing data', () => {
    expect(normalizeFlow()).toEqual([])
  })
})
