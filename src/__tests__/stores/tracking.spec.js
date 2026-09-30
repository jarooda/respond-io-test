import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { HISTORY_LIMIT, useTrackingStore } from '@/stores/tracking'

describe('tracking store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTrackingStore()
  })

  it('starts with nothing to undo or redo', () => {
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
    expect(store.undo(['current'])).toBeNull()
    expect(store.redo(['current'])).toBeNull()
  })

  it('undoes to the recorded snapshot and makes the current flow redoable', () => {
    const a = ['a']
    const b = ['b']
    store.record(a)

    expect(store.undo(b)).toBe(a)
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(true)

    expect(store.redo(a)).toBe(b)
    expect(store.canUndo).toBe(true)
    expect(store.canRedo).toBe(false)
  })

  it('walks back and forth through several steps in order', () => {
    const [s0, s1, s2, s3] = [['0'], ['1'], ['2'], ['3']]
    store.record(s0)
    store.record(s1)
    store.record(s2)

    expect(store.undo(s3)).toBe(s2)
    expect(store.undo(s2)).toBe(s1)
    expect(store.redo(s1)).toBe(s2)
    expect(store.redo(s2)).toBe(s3)
  })

  it('drops the redo stack on a new change', () => {
    store.record(['a'])
    store.undo(['b'])
    store.record(['c'])
    expect(store.canRedo).toBe(false)
  })

  it(`keeps at most ${HISTORY_LIMIT} steps, dropping the oldest`, () => {
    for (let i = 0; i <= HISTORY_LIMIT; i++) store.record([i])
    expect(store.past).toHaveLength(HISTORY_LIMIT)
    expect(store.past[0]).toEqual([1])
  })

  it('clears both stacks', () => {
    store.record(['a'])
    store.undo(['b'])
    store.clear()
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
  })
})
