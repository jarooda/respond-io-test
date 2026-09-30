import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { mount } from '@vue/test-utils'

import AddCommentFields from '@/components/detail/AddCommentFields.vue'
import { findButton } from '../helpers'

const mountFields = (comment, errors = {}) => {
  const data = reactive({ comment })
  const wrapper = mount(AddCommentFields, { props: { data, errors } })
  return { wrapper, data }
}

describe('AddCommentFields', () => {
  it('shows the comment in an editable field', async () => {
    const { wrapper, data } = mountFields('User message during off hours')
    const field = wrapper.find('#node-comment')
    expect(field.element.value).toBe('User message during off hours')

    await field.setValue('Follow up tomorrow')
    expect(data.comment).toBe('Follow up tomorrow')
  })

  it('clears the comment', async () => {
    const { wrapper, data } = mountFields('Something')
    await findButton(wrapper, 'Clear').trigger('click')
    expect(data.comment).toBe('')
  })

  it('disables Clear when the comment is already empty', () => {
    const { wrapper } = mountFields('')
    expect(findButton(wrapper, 'Clear').attributes('disabled')).toBeDefined()
  })

  it('shows the internal-only hint, replaced by an error when there is one', () => {
    expect(mountFields('x').wrapper.text()).toContain('Internal only')

    const { wrapper } = mountFields('x', { comment: 'Comment must be 500 characters or fewer' })
    expect(wrapper.text()).not.toContain('Internal only')
    expect(wrapper.find('[role="alert"]').text()).toBe('Comment must be 500 characters or fewer')
  })
})
