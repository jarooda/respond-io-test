import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import FloatingHeader from '@/components/header/FloatingHeader.vue'
import NewNode from '@/components/modal/NewNode.vue'
import { queryKeys } from '@/config/query'
import { useTrackingStore } from '@/stores/tracking'
import { findButton } from '../helpers'

let wrapper

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const queryClient = new QueryClient()
  queryClient.setQueryData(queryKeys.flow, [{ id: 'a', name: 'Current' }])

  wrapper = mount(FloatingHeader, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
    attachTo: document.body,
  })
  return { queryClient, store: useTrackingStore() }
}

const undoButton = () => wrapper.find('button[aria-label^="Undo"]')
const redoButton = () => wrapper.find('button[aria-label^="Redo"]')

afterEach(() => wrapper?.unmount())

describe('FloatingHeader', () => {
  it('disables undo and redo when there is no history', () => {
    setup()
    expect(undoButton().attributes('disabled')).toBeDefined()
    expect(redoButton().attributes('disabled')).toBeDefined()
  })

  it('enables undo once something is recorded, and undo restores the flow', async () => {
    const { queryClient, store } = setup()
    store.record([{ id: 'a', name: 'Before' }])
    await wrapper.vm.$nextTick()

    expect(undoButton().attributes('disabled')).toBeUndefined()
    await undoButton().trigger('click')

    expect(queryClient.getQueryData(queryKeys.flow)).toEqual([{ id: 'a', name: 'Before' }])
    expect(undoButton().attributes('disabled')).toBeDefined()
    expect(redoButton().attributes('disabled')).toBeUndefined()

    await redoButton().trigger('click')
    expect(queryClient.getQueryData(queryKeys.flow)).toEqual([{ id: 'a', name: 'Current' }])
  })

  it('shows the keyboard shortcut in the button hints', () => {
    setup()
    expect(undoButton().attributes('title')).toMatch(/Undo \((⌘Z|Ctrl\+Z)\)/)
  })

  it('opens the create dialog and passes its result up', async () => {
    setup()
    expect(wrapper.find('form#new-node-form').exists()).toBe(false)

    await findButton(wrapper, 'Create New Node').trigger('click')
    expect(wrapper.find('form#new-node-form').exists()).toBe(true)

    const form = { title: 'Note', description: '', type: 'addComment' }
    wrapper.findComponent(NewNode).vm.$emit('create', form)
    expect(wrapper.emitted('create')).toEqual([[form]])
  })
})
