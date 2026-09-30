import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import NodeDetail from '@/components/modal/NodeDetail.vue'

const comment = {
  id: 'e879e4',
  type: 'addComment',
  name: 'Add Comment #1',
  parentId: 'b6a0c1',
  data: { comment: 'User message during off hours' },
}

const mountDetail = (item = comment) =>
  mount(NodeDetail, { props: { item }, attachTo: document.body })

describe('NodeDetail', () => {
  let wrapper

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('shows the title in an input and the type fields', () => {
    wrapper = mountDetail()
    expect(wrapper.find('#node-title').element.value).toBe('Add Comment #1')
    expect(wrapper.find('#node-comment').element.value).toBe('User message during off hours')
    expect(wrapper.text()).toContain('All changes saved')
  })

  it('autosaves a valid edit after a short pause', async () => {
    wrapper = mountDetail()
    await wrapper.find('#node-title').setValue('Night note')
    expect(wrapper.text()).toContain('Saving…')
    expect(wrapper.emitted('update')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(400)

    expect(wrapper.emitted('update')).toEqual([
      [{ id: 'e879e4', patch: expect.objectContaining({ name: 'Night note' }) }],
    ])
    expect(wrapper.text()).toContain('All changes saved')
  })

  it('does not save while there are errors, and says how many', async () => {
    wrapper = mountDetail()
    await wrapper.find('#node-title').setValue('  ')
    await vi.advanceTimersByTimeAsync(1000)

    expect(wrapper.emitted('update')).toBeUndefined()
    expect(wrapper.text()).toContain('Title is required')
    expect(wrapper.text()).toContain('1 error to fix before saving')
  })

  it('clears the comment with the Clear button', async () => {
    wrapper = mountDetail()
    const clear = wrapper.findAll('button').find((button) => button.text() === 'Clear')
    await clear.trigger('click')
    await vi.advanceTimersByTimeAsync(400)

    expect(wrapper.emitted('update')[0][0].patch.data).toEqual({ comment: '' })
  })

  it('saves pending edits when unmounted', async () => {
    // A listener prop, like a real parent's @update (test-utils stops recording on unmount).
    const onUpdate = vi.fn()
    wrapper = mount(NodeDetail, { props: { item: comment, onUpdate }, attachTo: document.body })
    await wrapper.find('#node-comment').setValue('Changed')
    wrapper.unmount()
    wrapper = null

    expect(onUpdate).toHaveBeenCalledWith({
      id: 'e879e4',
      patch: expect.objectContaining({ data: { comment: 'Changed' } }),
    })
  })

  it('saves pending edits to the previous node when switching nodes', async () => {
    wrapper = mountDetail()
    await wrapper.find('#node-title').setValue('Edited')
    await wrapper.setProps({ item: { ...comment, id: 'other', name: 'Other' } })

    expect(wrapper.emitted('update')[0][0]).toMatchObject({
      id: 'e879e4',
      patch: { name: 'Edited' },
    })
    expect(wrapper.find('#node-title').element.value).toBe('Other')
  })

  it('reloads the draft when the node changes from outside (e.g. undo)', async () => {
    wrapper = mountDetail()
    await wrapper.find('#node-title').setValue('Edited')
    await vi.advanceTimersByTimeAsync(400)
    // Parent applies the save…
    await wrapper.setProps({ item: { ...comment, name: 'Edited' } })
    // …then an undo puts the old item back.
    await wrapper.setProps({ item: { ...comment } })

    expect(wrapper.find('#node-title').element.value).toBe('Add Comment #1')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.emitted('update')).toHaveLength(1)
  })

  it('keeps typing untouched when its own save comes back', async () => {
    wrapper = mountDetail()
    await wrapper.find('#node-title').setValue('Edited ')
    await vi.advanceTimersByTimeAsync(400)
    await wrapper.setProps({ item: { ...comment, name: 'Edited' } })

    expect(wrapper.find('#node-title').element.value).toBe('Edited ')
  })

  it('asks for confirmation before deleting', async () => {
    wrapper = mountDetail()
    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete node')
    await deleteButton.trigger('click')

    expect(wrapper.text()).toContain('Delete Add Comment #1?')
    expect(wrapper.emitted('delete')).toBeUndefined()

    const confirm = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await confirm.trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['e879e4']])
  })

  it('emits close from the close button', async () => {
    wrapper = mountDetail()
    await wrapper.find('[aria-label="Close details"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('validates business hours rows', async () => {
    wrapper = mountDetail({
      id: 'd09c08',
      type: 'businessHours',
      name: 'Business Hours',
      data: { times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }], timezone: 'UTC' },
    })
    await wrapper.find('[aria-label="Mon closes at"]').setValue('08:00')

    expect(wrapper.text()).toContain('End time must be after start time')
    expect(wrapper.find('[role="switch"][aria-checked="true"]').exists()).toBe(true)
  })
})
