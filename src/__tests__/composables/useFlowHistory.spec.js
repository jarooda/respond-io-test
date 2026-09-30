import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import { queryKeys } from '@/config/query'
import { useFlowHistory, useUndoRedoShortcuts } from '@/composables/useFlowHistory'
import { useTrackingStore } from '@/stores/tracking'

let wrapper

function setup(initial) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(queryKeys.flow, initial)

  let history
  let store
  wrapper = mount(
    defineComponent({
      setup() {
        history = useFlowHistory()
        store = useTrackingStore()
        return () => null
      },
    }),
    {
      global: { plugins: [createPinia(), [VueQueryPlugin, { queryClient }]] },
      attachTo: document.body,
    },
  )
  return { queryClient, history, store }
}

afterEach(() => wrapper?.unmount())

describe('useFlowHistory', () => {
  it('undoes and redoes by swapping snapshots in the query cache', () => {
    const before = [{ id: 'a', name: 'Before' }]
    const after = [{ id: 'a', name: 'After' }]
    const { queryClient, history, store } = setup(after)
    store.record(before)

    history.undo()
    // toEqual: the query cache applies structural sharing, so identity isn't preserved.
    expect(queryClient.getQueryData(queryKeys.flow)).toEqual(before)
    expect(history.canUndo.value).toBe(false)
    expect(history.canRedo.value).toBe(true)

    history.redo()
    expect(queryClient.getQueryData(queryKeys.flow)).toEqual(after)
  })

  it('does nothing when there is nothing to undo or redo', () => {
    const flow = [{ id: 'a' }]
    const { queryClient, history } = setup(flow)
    history.undo()
    history.redo()
    expect(queryClient.getQueryData(queryKeys.flow)).toBe(flow)
  })
})

describe('useUndoRedoShortcuts', () => {
  function mountShortcuts() {
    const actions = { undo: vi.fn(), redo: vi.fn() }
    wrapper = mount(
      defineComponent({
        setup() {
          useUndoRedoShortcuts(actions)
          return () => null
        },
      }),
      { attachTo: document.body },
    )
    return actions
  }

  const press = (init, target = window) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))

  it.each([
    [{ key: 'z', ctrlKey: true }, 'undo'],
    [{ key: 'z', metaKey: true }, 'undo'],
    [{ key: 'Z', ctrlKey: true, shiftKey: true }, 'redo'],
    [{ key: 'z', metaKey: true, shiftKey: true }, 'redo'],
    [{ key: 'y', ctrlKey: true }, 'redo'],
  ])('%o triggers %s', (init, action) => {
    const actions = mountShortcuts()
    press(init)
    expect(actions[action]).toHaveBeenCalledOnce()
  })

  it('ignores plain keys and other shortcuts', () => {
    const actions = mountShortcuts()
    press({ key: 'z' })
    press({ key: 's', ctrlKey: true })
    expect(actions.undo).not.toHaveBeenCalled()
    expect(actions.redo).not.toHaveBeenCalled()
  })

  it('leaves text fields to the browser’s own undo', () => {
    const actions = mountShortcuts()
    const input = document.createElement('input')
    document.body.append(input)
    press({ key: 'z', ctrlKey: true }, input)
    expect(actions.undo).not.toHaveBeenCalled()
    input.remove()
  })

  it('stops listening once unmounted', () => {
    const actions = mountShortcuts()
    wrapper.unmount()
    wrapper = null
    press({ key: 'z', ctrlKey: true })
    expect(actions.undo).not.toHaveBeenCalled()
  })
})
