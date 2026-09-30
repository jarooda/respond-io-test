import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import FlowNode from '@/components/flow/FlowNode.vue'
import { HandleStub } from '../helpers'

const welcome = {
  id: 'b0653a',
  type: 'sendMessage',
  name: 'Welcome Message',
  data: {
    payload: [
      { type: 'text', text: 'Hello there\n\nwelcome to the chat!' },
      { type: 'attachment', attachment: 'https://x.test/a.jpg' },
    ],
  },
}

const trigger = {
  id: 1,
  type: 'trigger',
  data: { type: 'conversationOpened', oncePerContact: false },
}

const mountNode = (node, props = {}) =>
  mount(FlowNode, {
    props: { data: { node }, ...props },
    global: { stubs: { Handle: HandleStub } },
  })

describe('FlowNode', () => {
  it('shows the type icon, type label, title and description', () => {
    const wrapper = mountNode(welcome)

    expect(wrapper.find('.flow-node__icon [data-icon]').attributes('data-icon')).toBe(
      'material-symbols:chat',
    )
    expect(wrapper.find('.flow-node__type').text()).toBe('Send Message')
    expect(wrapper.find('.flow-node__title').text()).toBe('Welcome Message')
    expect(wrapper.find('.flow-node__description').text()).toBe('Hello there welcome to the chat!')
  })

  it('shows the attachment count for messages with attachments', () => {
    const wrapper = mountNode(welcome)
    const badge = wrapper.find('.flow-node__attachments')
    expect(badge.text()).toBe('1')
    expect(badge.attributes('aria-label')).toBe('1 attachment')
  })

  it('hides the attachment count when there are none', () => {
    const wrapper = mountNode({ ...welcome, data: { payload: [{ type: 'text', text: 'Hi' }] } })
    expect(wrapper.find('.flow-node__attachments').exists()).toBe(false)
  })

  it('prefers a user-entered description', () => {
    const wrapper = mountNode({ ...welcome, description: 'Greets new contacts' })
    expect(wrapper.find('.flow-node__description').text()).toBe('Greets new contacts')
  })

  it('titles the trigger by its event and gives it no incoming handle', () => {
    const wrapper = mountNode(trigger)
    expect(wrapper.find('.flow-node__title').text()).toBe('Conversation Opened')
    expect(wrapper.find('.flow-node__icon--warning').exists()).toBe(true)

    const handles = wrapper.findAll('.handle-stub').map((h) => h.attributes('data-type'))
    expect(handles).toEqual(['source'])
  })

  it('has incoming and outgoing handles on other nodes', () => {
    const handles = mountNode(welcome)
      .findAll('.handle-stub')
      .map((h) => h.attributes('data-type'))
    expect(handles).toEqual(['target', 'source'])
  })

  it('reflects the selected state', async () => {
    const wrapper = mountNode(welcome)
    expect(wrapper.find('.flow-node--selected').exists()).toBe(false)
    await wrapper.setProps({ selected: true })
    expect(wrapper.find('.flow-node--selected').exists()).toBe(true)
  })

  it('uses the business hours summary', () => {
    const wrapper = mountNode({
      id: 'd',
      type: 'businessHours',
      name: 'Business Hours',
      data: { times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }], timezone: 'UTC' },
    })
    expect(wrapper.find('.flow-node__description').text()).toBe('Mon · 09:00–17:00 · UTC')
    expect(wrapper.find('.flow-node__icon--neutral').exists()).toBe(true)
  })
})
