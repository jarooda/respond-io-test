import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { mount } from '@vue/test-utils'

import SendMessageFields from '@/components/detail/SendMessageFields.vue'
import { toast } from '@/components/ui/toast'
import { findButton } from '../helpers'

vi.mock('@/components/ui/toast', () => ({ toast: { warning: vi.fn() } }))

let wrapper

function mountFields(errors = {}) {
  const data = reactive({
    texts: [
      { key: 't1', text: 'Hello there' },
      { key: 't2', text: 'Second' },
    ],
    attachments: [{ key: 'a1', url: 'https://x.test/banner.jpg', name: 'banner.jpg' }],
  })
  wrapper = mount(SendMessageFields, { props: { data, errors }, attachTo: document.body })
  return data
}

const file = (name, type, size = 1024) => {
  const blob = new File(['x'], name, { type })
  Object.defineProperty(blob, 'size', { value: size })
  return blob
}

beforeEach(() => {
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:test-${++n}`)
  vi.mocked(toast.warning).mockClear()
})
afterEach(() => wrapper?.unmount())

describe('SendMessageFields › messages', () => {
  it('shows each text in a field with the message count', () => {
    mountFields()
    const fields = wrapper.findAll('textarea')
    expect(fields.map((f) => f.element.value)).toEqual(['Hello there', 'Second'])
    expect(wrapper.find('.detail-section__meta').text()).toBe('2')
  })

  it('edits a text in place', async () => {
    const data = mountFields()
    await wrapper.find('#message-t1').setValue('Hi!')
    expect(data.texts[0].text).toBe('Hi!')
  })

  it('removes a text', async () => {
    const data = mountFields()
    await wrapper.find('[aria-label="Remove message 1"]').trigger('click')
    expect(data.texts.map((t) => t.text)).toEqual(['Second'])
  })

  it('adds an empty text and focuses it', async () => {
    const data = mountFields()
    await findButton(wrapper, 'Add text').trigger('click')
    await wrapper.vm.$nextTick()

    expect(data.texts).toHaveLength(3)
    expect(data.texts[2].text).toBe('')
    expect(document.activeElement?.id).toBe(`message-${data.texts[2].key}`)
  })

  it('shows errors under the matching text', () => {
    mountFields({ 'text.t2': "Message can't be empty" })
    const alert = wrapper.find('[role="alert"]')
    expect(alert.text()).toBe("Message can't be empty")
    expect(wrapper.find('#message-t2').attributes('aria-invalid')).toBe('true')
  })
})

describe('SendMessageFields › attachments', () => {
  it('shows existing attachments as tiles with their names', () => {
    mountFields()
    expect(wrapper.find('.attachment img').attributes('src')).toBe('https://x.test/banner.jpg')
    expect(wrapper.find('.attachment__name').text()).toBe('banner.jpg')
  })

  it('removes an attachment', async () => {
    const data = mountFields()
    await wrapper.find('[aria-label="Remove banner.jpg"]').trigger('click')
    expect(data.attachments).toEqual([])
  })

  it('falls back to an icon when an image fails to load', async () => {
    mountFields()
    await wrapper.find('.attachment img').trigger('error')
    expect(wrapper.find('.attachment img').exists()).toBe(false)
    expect(wrapper.find('.attachment__preview [data-icon]').exists()).toBe(true)
  })

  it('adds valid uploads and warns about rejected ones', async () => {
    const data = mountFields()
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [file('photo.png', 'image/png'), file('doc.pdf', 'application/pdf')],
    })
    await input.trigger('change')

    expect(data.attachments.at(-1)).toMatchObject({ url: 'blob:test-1', name: 'photo.png' })
    expect(data.attachments).toHaveLength(2)
    expect(toast.warning).toHaveBeenCalledWith("doc.pdf isn't a PNG or JPG")
  })

  it('rejects images over 5 MB', async () => {
    const data = mountFields()
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [file('huge.jpg', 'image/jpeg', 6 * 1024 * 1024)],
    })
    await input.trigger('change')

    expect(data.attachments).toHaveLength(1)
    expect(toast.warning).toHaveBeenCalledWith('huge.jpg is larger than 5 MB')
  })

  it('accepts dropped files and highlights the drop zone while dragging', async () => {
    const data = mountFields()
    const tile = wrapper.find('.upload-tile')

    await tile.trigger('dragover')
    expect(tile.classes()).toContain('upload-tile--active')

    await tile.trigger('drop', { dataTransfer: { files: [file('drop.jpg', 'image/jpeg')] } })
    expect(tile.classes()).not.toContain('upload-tile--active')
    expect(data.attachments.at(-1).name).toBe('drop.jpg')
  })
})
