import { describe, expect, it } from 'vitest'

import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  emptyNodeForm,
  validateNodeForm,
} from '@/utils/nodeForm'

const valid = { title: 'Holiday notice', description: '', type: 'addComment' }

describe('validateNodeForm', () => {
  it('passes a valid form', () => {
    expect(validateNodeForm(valid)).toEqual({})
  })

  it('flags an empty form on every required field', () => {
    expect(validateNodeForm(emptyNodeForm())).toEqual({
      title: 'Title is required',
      type: 'Select a node type',
    })
  })

  it('treats a whitespace-only title as empty', () => {
    expect(validateNodeForm({ ...valid, title: '   ' }).title).toBe('Title is required')
  })

  it('limits title length after trimming', () => {
    expect(
      validateNodeForm({ ...valid, title: 'a'.repeat(TITLE_MAX_LENGTH) }).title,
    ).toBeUndefined()
    expect(
      validateNodeForm({ ...valid, title: 'a'.repeat(TITLE_MAX_LENGTH + 1) }).title,
    ).toBeDefined()
    expect(
      validateNodeForm({ ...valid, title: ` ${'a'.repeat(TITLE_MAX_LENGTH)} ` }).title,
    ).toBeUndefined()
  })

  it('limits description length', () => {
    const description = 'a'.repeat(DESCRIPTION_MAX_LENGTH + 1)
    expect(validateNodeForm({ ...valid, description }).description).toBeDefined()
  })

  it('rejects types that cannot be created by users', () => {
    expect(validateNodeForm({ ...valid, type: 'trigger' }).type).toBe('Unsupported node type')
    expect(validateNodeForm({ ...valid, type: 'dateTimeConnector' }).type).toBe(
      'Unsupported node type',
    )
  })

  it('accepts business hours under the current type only', () => {
    expect(validateNodeForm({ ...valid, type: 'businessHours' })).toEqual({})
    expect(validateNodeForm({ ...valid, type: 'dateTime' }).type).toBe('Unsupported node type')
  })
})
