import { describe, expect, it } from 'vitest'

import {
  formatBusinessHours,
  getAttachmentCount,
  getNodeDescription,
  getNodeTitle,
  humanize,
} from '@/utils/nodeSummary'

const week = (startTime = '09:00', endTime = '17:00') =>
  ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => ({ day, startTime, endTime }))

describe('humanize', () => {
  it('splits camelCase into title-cased words', () => {
    expect(humanize('conversationOpened')).toBe('Conversation Opened')
  })

  it('handles empty input', () => {
    expect(humanize()).toBe('')
  })
})

describe('getNodeTitle', () => {
  it('prefers the node name', () => {
    expect(getNodeTitle({ type: 'sendMessage', name: 'Away Message' })).toBe('Away Message')
  })

  it('derives the trigger title from its trigger type', () => {
    expect(getNodeTitle({ type: 'trigger', data: { type: 'conversationOpened' } })).toBe(
      'Conversation Opened',
    )
  })
})

describe('formatBusinessHours', () => {
  it('collapses a full week with the same hours into a range', () => {
    expect(formatBusinessHours({ times: week(), timezone: 'UTC' })).toBe(
      'Mon–Sun · 09:00–17:00 · UTC',
    )
  })

  it('sorts days before collapsing', () => {
    const times = week().toReversed().slice(2) // fri..mon, in reverse order
    expect(formatBusinessHours({ times, timezone: 'UTC' })).toBe('Mon–Fri · 09:00–17:00 · UTC')
  })

  it('lists non-consecutive days individually', () => {
    const times = week().filter((t) => ['mon', 'wed'].includes(t.day))
    expect(formatBusinessHours({ times, timezone: 'UTC' })).toBe('Mon, Wed · 09:00–17:00 · UTC')
  })

  it('shows a single day without a range', () => {
    const times = week().filter((t) => t.day === 'fri')
    expect(formatBusinessHours({ times, timezone: 'UTC' })).toBe('Fri · 09:00–17:00 · UTC')
  })

  it('reports custom hours when days differ', () => {
    const times = [...week().slice(0, 6), { day: 'sun', startTime: '10:00', endTime: '14:00' }]
    expect(formatBusinessHours({ times, timezone: 'Asia/Jakarta' })).toBe(
      'Custom hours · Asia/Jakarta',
    )
  })

  it('reports closed when there are no times', () => {
    expect(formatBusinessHours({ times: [], timezone: 'UTC' })).toBe('Closed · UTC')
  })
})

describe('getNodeDescription', () => {
  it('prefers a user-entered description', () => {
    expect(getNodeDescription({ type: 'addComment', description: 'Custom', data: {} })).toBe(
      'Custom',
    )
  })

  it('describes triggers by oncePerContact', () => {
    expect(getNodeDescription({ type: 'trigger', data: { oncePerContact: false } })).toBe(
      'Runs every time a conversation is opened',
    )
    expect(getNodeDescription({ type: 'trigger', data: { oncePerContact: true } })).toBe(
      'Runs once per contact',
    )
  })

  it('uses the first text of a message with whitespace collapsed', () => {
    const item = {
      type: 'sendMessage',
      data: {
        payload: [
          { type: 'attachment', attachment: 'a.jpg' },
          { type: 'text', text: 'Hello there\n\nwelcome to the chat!' },
        ],
      },
    }
    expect(getNodeDescription(item)).toBe('Hello there welcome to the chat!')
  })

  it('falls back to an attachment count for attachment-only messages', () => {
    const item = {
      type: 'sendMessage',
      data: { payload: [{ type: 'attachment' }, { type: 'attachment' }] },
    }
    expect(getNodeDescription(item)).toBe('2 attachments')
  })

  it('uses the comment for addComment nodes', () => {
    expect(getNodeDescription({ type: 'addComment', data: { comment: 'Hi' } })).toBe('Hi')
  })

  it('summarises business hours for businessHours nodes', () => {
    expect(
      getNodeDescription({ type: 'businessHours', data: { times: week(), timezone: 'UTC' } }),
    ).toBe('Mon–Sun · 09:00–17:00 · UTC')
  })
})

describe('getAttachmentCount', () => {
  it('counts attachments on sendMessage nodes only', () => {
    const payload = [{ type: 'text', text: 'x' }, { type: 'attachment' }]
    expect(getAttachmentCount({ type: 'sendMessage', data: { payload } })).toBe(1)
    expect(getAttachmentCount({ type: 'addComment', data: { payload } })).toBe(0)
  })
})
