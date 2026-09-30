import { describe, expect, it } from 'vitest'

import {
  draftToPatch,
  fileNameFromUrl,
  getAttachmentError,
  getTimezones,
  toDraft,
  validateDraft,
} from '@/utils/nodeDetail'

const welcome = {
  id: 'b0653a',
  type: 'sendMessage',
  name: 'Welcome Message',
  data: {
    payload: [
      { type: 'text', text: 'Hello there' },
      { type: 'attachment', attachment: 'https://x.test/id/396/354.jpg?hmac=abc' },
    ],
  },
}

const hours = {
  id: 'd09c08',
  type: 'businessHours',
  name: 'Business Hours',
  data: {
    times: [
      { startTime: '09:00', endTime: '17:00', day: 'mon' },
      { startTime: '10:00', endTime: '14:00', day: 'sat' },
    ],
    connectors: ['161f52', '28c4b9'],
    timezone: 'UTC',
    action: 'businessHours',
  },
}

describe('fileNameFromUrl', () => {
  it('takes the last path segment without the query string', () => {
    expect(fileNameFromUrl('https://x.test/id/396/354.jpg?hmac=abc')).toBe('354.jpg')
  })

  it('falls back for empty input', () => {
    expect(fileNameFromUrl('')).toBe('attachment')
  })
})

describe('getTimezones', () => {
  it('always starts with UTC and has no duplicates', () => {
    const zones = getTimezones()
    expect(zones[0]).toBe('UTC')
    expect(new Set(zones).size).toBe(zones.length)
  })
})

describe('toDraft / draftToPatch', () => {
  it('splits a message payload into texts and attachments', () => {
    const draft = toDraft(welcome)
    expect(draft.title).toBe('Welcome Message')
    expect(draft.data.texts.map((t) => t.text)).toEqual(['Hello there'])
    expect(draft.data.attachments[0]).toMatchObject({ name: '354.jpg' })
  })

  it('round-trips an unedited node to the same data', () => {
    for (const item of [welcome, hours]) {
      expect(draftToPatch(item, toDraft(item)).data).toEqual(item.data)
    }
  })

  it('rebuilds the payload with trimmed texts and keeps uploaded file names', () => {
    const draft = toDraft(welcome)
    draft.data.texts[0].text = '  Hi  '
    draft.data.attachments.push({ key: 'n', url: 'blob:abc', name: 'banner.png' })

    expect(draftToPatch(welcome, draft).data.payload).toEqual([
      { type: 'text', text: 'Hi' },
      { type: 'attachment', attachment: 'https://x.test/id/396/354.jpg?hmac=abc' },
      { type: 'attachment', attachment: 'blob:abc', name: 'banner.png' },
    ])
  })

  it('shows all seven days and saves only the open ones, keeping other data', () => {
    const draft = toDraft(hours)
    expect(draft.data.days).toHaveLength(7)
    expect(draft.data.days.find((d) => d.day === 'tue')).toMatchObject({ open: false })

    draft.data.days.find((d) => d.day === 'mon').open = false
    draft.data.days.find((d) => d.day === 'tue').open = true
    draft.data.timezone = 'Asia/Jakarta'

    expect(draftToPatch(hours, draft).data).toEqual({
      ...hours.data,
      timezone: 'Asia/Jakarta',
      times: [
        { startTime: '09:00', endTime: '17:00', day: 'tue' },
        { startTime: '10:00', endTime: '14:00', day: 'sat' },
      ],
    })
  })

  it('trims title and turns an empty description into undefined', () => {
    const draft = toDraft({ ...welcome, description: 'Old' })
    draft.title = '  New title '
    draft.description = '   '
    expect(draftToPatch(welcome, draft)).toMatchObject({
      name: 'New title',
      description: undefined,
    })
  })

  it('trims the comment', () => {
    const item = { id: 'c', type: 'addComment', name: 'C', data: { comment: 'x' } }
    const draft = toDraft(item)
    draft.data.comment = ' note '
    expect(draftToPatch(item, draft).data).toEqual({ comment: 'note' })
  })
})

describe('validateDraft', () => {
  it('passes untouched drafts', () => {
    expect(validateDraft('sendMessage', toDraft(welcome))).toEqual({})
    expect(validateDraft('businessHours', toDraft(hours))).toEqual({})
  })

  it('requires a title', () => {
    const draft = toDraft(welcome)
    draft.title = ' '
    expect(validateDraft('sendMessage', draft).title).toBe('Title is required')
  })

  it('flags empty messages by their key', () => {
    const draft = toDraft(welcome)
    const [{ key }] = draft.data.texts
    draft.data.texts[0].text = '  '
    expect(validateDraft('sendMessage', draft)).toEqual({
      [`text.${key}`]: "Message can't be empty",
    })
  })

  it('validates open days only', () => {
    const draft = toDraft(hours)
    const mon = draft.data.days.find((d) => d.day === 'mon')
    const tue = draft.data.days.find((d) => d.day === 'tue')
    mon.endTime = '08:00'
    tue.startTime = 'nope' // closed, so ignored

    expect(validateDraft('businessHours', draft)).toEqual({
      'hours.mon': 'End time must be after start time',
    })
  })
})

describe('getAttachmentError', () => {
  it('accepts PNG and JPG up to 5 MB', () => {
    expect(
      getAttachmentError({ name: 'a.png', type: 'image/png', size: 5 * 1024 * 1024 }),
    ).toBeNull()
  })

  it('rejects other types and larger files', () => {
    expect(getAttachmentError({ name: 'a.gif', type: 'image/gif', size: 1 })).toBe(
      "a.gif isn't a PNG or JPG",
    )
    expect(
      getAttachmentError({ name: 'a.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }),
    ).toBe('a.jpg is larger than 5 MB')
  })
})
