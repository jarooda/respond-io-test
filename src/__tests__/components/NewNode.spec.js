import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import NewNode from '@/components/modal/NewNode.vue'
import { findButton } from '../helpers'

let wrapper

async function mountOpen() {
  wrapper = mount(NewNode, {
    props: {
      open: false,
      'onUpdate:open': (open) => wrapper.setProps({ open }),
    },
    attachTo: document.body,
  })
  await wrapper.setProps({ open: true })
  return wrapper
}

afterEach(() => wrapper?.unmount())

describe('NewNode', () => {
  it('is hidden until opened', () => {
    wrapper = mount(NewNode, { props: { open: false } })
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('focuses the title field when opened', async () => {
    await mountOpen()
    expect(document.activeElement?.id).toBe('new-node-title')
  })

  it('offers the three creatable node types', async () => {
    await mountOpen()
    const options = wrapper.findAll('#new-node-type option').map((o) => [o.element.value, o.text()])
    expect(options).toEqual([
      ['', 'Select a type'],
      ['sendMessage', 'Send Message'],
      ['addComment', 'Add Comment'],
      ['businessHours', 'Business Hours'],
    ])
  })

  it('shows no errors until the first submit', async () => {
    await mountOpen()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Title is required')
    expect(wrapper.text()).toContain('Select a node type')
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('updates errors live after a failed submit', async () => {
    await mountOpen()
    await wrapper.find('form').trigger('submit')
    await wrapper.find('#new-node-title').setValue('Holiday notice')

    expect(wrapper.text()).not.toContain('Title is required')
    expect(wrapper.text()).toContain('Select a node type')
  })

  it('emits the trimmed form and closes on a valid submit', async () => {
    await mountOpen()
    await wrapper.find('#new-node-title').setValue('  Holiday notice ')
    await wrapper.find('#new-node-description').setValue(' Closed today ')
    await wrapper.find('#new-node-type').setValue('addComment')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('create')).toEqual([
      [{ title: 'Holiday notice', description: 'Closed today', type: 'addComment' }],
    ])
    expect(wrapper.props('open')).toBe(false)
  })

  it('starts empty again when reopened', async () => {
    await mountOpen()
    await wrapper.find('#new-node-title').setValue('Draft')
    await wrapper.find('form').trigger('submit') // fails: no type, shows errors
    await findButton(wrapper, 'Cancel').trigger('click')
    await wrapper.setProps({ open: true })

    expect(wrapper.find('#new-node-title').element.value).toBe('')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('closes on Cancel without creating', async () => {
    await mountOpen()
    await findButton(wrapper, 'Cancel').trigger('click')
    expect(wrapper.props('open')).toBe(false)
    expect(wrapper.emitted('create')).toBeUndefined()
  })
})
