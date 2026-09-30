import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import TimePicker from '@/components/form/TimePicker.vue'

let wrapper

const mountPicker = (props = {}) => {
  wrapper = mount(TimePicker, {
    props: {
      modelValue: '09:00',
      'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
      ...props,
    },
    attrs: { 'aria-label': 'Opens at' },
    attachTo: document.body,
  })
  return wrapper.find('input')
}

afterEach(() => wrapper?.unmount())

describe('TimePicker', () => {
  it('renders the value in an input that flatpickr is attached to', () => {
    const input = mountPicker()
    expect(input.element.value).toBe('09:00')
    expect(input.element._flatpickr).toBeDefined()
    expect(input.attributes('aria-label')).toBe('Opens at')
  })

  it('emits typed values as they are typed', async () => {
    const input = mountPicker()
    await input.setValue('10:3')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['10:3'])
  })

  it('emits the picked time in 24-hour HH:mm', async () => {
    const input = mountPicker()
    input.element._flatpickr.setDate('18:45', true)
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['18:45'])
  })

  it('follows value changes from outside (e.g. undo)', async () => {
    const input = mountPicker()
    await wrapper.setProps({ modelValue: '07:15' })
    expect(input.element.value).toBe('07:15')
    expect(input.element._flatpickr.selectedDates[0].getHours()).toBe(7)
  })

  it('reflects disabled and invalid states', () => {
    const input = mountPicker({ disabled: true, invalid: true })
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('.jl-input-wrap').attributes('data-invalid')).toBe('true')
  })

  it('cleans up flatpickr on unmount', () => {
    const input = mountPicker()
    const destroy = vi.spyOn(input.element._flatpickr, 'destroy')
    wrapper.unmount()
    wrapper = null
    expect(destroy).toHaveBeenCalledOnce()
  })
})
