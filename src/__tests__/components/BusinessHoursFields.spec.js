import { afterEach, describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { mount } from '@vue/test-utils'

import BusinessHoursFields from '@/components/detail/BusinessHoursFields.vue'
import { toDraft } from '@/utils/nodeDetail'

let wrapper

function mountFields(errors = {}) {
  const { data } = toDraft({
    id: 'd',
    type: 'businessHours',
    name: 'Business Hours',
    data: {
      times: [
        { day: 'mon', startTime: '09:00', endTime: '17:00' },
        { day: 'tue', startTime: '10:00', endTime: '14:00' },
      ],
      timezone: 'UTC',
    },
  })
  const reactiveData = reactive(data)
  wrapper = mount(BusinessHoursFields, {
    props: { data: reactiveData, errors },
    attachTo: document.body,
  })
  return reactiveData
}

const switchFor = (label) => wrapper.find(`[role="switch"][aria-labelledby="day-${label}"]`)

afterEach(() => wrapper?.unmount())

describe('BusinessHoursFields', () => {
  it('shows all seven days with open days switched on', () => {
    mountFields()
    expect(wrapper.findAll('.hours__day').map((d) => d.text())).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ])
    expect(switchFor('mon').attributes('aria-checked')).toBe('true')
    expect(switchFor('wed').attributes('aria-checked')).toBe('false')
  })

  it('shows existing hours in the time pickers', () => {
    mountFields()
    expect(wrapper.find('[aria-label="Tue opens at"]').element.value).toBe('10:00')
    expect(wrapper.find('[aria-label="Tue closes at"]').element.value).toBe('14:00')
  })

  it('disables the pickers of closed days, and the switch reopens them', async () => {
    const data = mountFields()
    expect(wrapper.find('[aria-label="Wed opens at"]').attributes('disabled')).toBeDefined()

    await switchFor('wed').trigger('click')

    expect(data.days.find((d) => d.day === 'wed').open).toBe(true)
    expect(wrapper.find('[aria-label="Wed opens at"]').attributes('disabled')).toBeUndefined()
  })

  it('updates a time from its picker', async () => {
    const data = mountFields()
    await wrapper.find('[aria-label="Mon closes at"]').setValue('18:30')
    expect(data.days.find((d) => d.day === 'mon').endTime).toBe('18:30')
  })

  it('lets the timezone be changed, with UTC first', async () => {
    const data = mountFields()
    const select = wrapper.find('#node-timezone')
    expect(select.findAll('option')[0].element.value).toBe('UTC')

    const other = select.findAll('option')[1].element.value
    await select.setValue(other)
    expect(data.timezone).toBe(other)
  })

  it('shows row errors and marks both pickers invalid', () => {
    mountFields({ 'hours.mon': 'End time must be after start time' })
    expect(wrapper.find('[role="alert"]').text()).toBe('End time must be after start time')
    expect(wrapper.find('[aria-label="Mon opens at"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('[aria-label="Mon closes at"]').attributes('aria-invalid')).toBe('true')
  })
})
