import { getNodeTitle } from '@/utils/nodeSummary'
import { getTimeRangeError } from '@/utils/time'
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/utils/nodeForm'

export const MESSAGE_MAX_LENGTH = 1000
export const COMMENT_MAX_LENGTH = 500
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024
export const ATTACHMENT_TYPES = ['image/png', 'image/jpeg']

export const WEEK_DAYS = [
  { day: 'mon', label: 'Mon' },
  { day: 'tue', label: 'Tue' },
  { day: 'wed', label: 'Wed' },
  { day: 'thu', label: 'Thu' },
  { day: 'fri', label: 'Fri' },
  { day: 'sat', label: 'Sat' },
  { day: 'sun', label: 'Sun' },
]

const DEFAULT_HOURS = { startTime: '09:00', endTime: '17:00' }

let keySeed = 0
export const nextKey = () => `k${++keySeed}`

export function fileNameFromUrl(url = '') {
  const path = url.split(/[?#]/)[0]
  return decodeURIComponent(path.split('/').filter(Boolean).at(-1) ?? 'attachment')
}

export function getTimezones() {
  const zones =
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  return ['UTC', ...zones.filter((zone) => zone !== 'UTC')]
}

function toDataDraft(item) {
  const data = item.data ?? {}
  switch (item.type) {
    case 'sendMessage': {
      const payload = data.payload ?? []
      return {
        texts: payload
          .filter((entry) => entry.type === 'text')
          .map((entry) => ({ key: nextKey(), text: entry.text ?? '' })),
        attachments: payload
          .filter((entry) => entry.type === 'attachment')
          .map((entry) => ({
            key: nextKey(),
            url: entry.attachment,
            name: entry.name ?? fileNameFromUrl(entry.attachment),
          })),
      }
    }
    case 'addComment':
      return { comment: data.comment ?? '' }
    case 'businessHours': {
      const byDay = new Map((data.times ?? []).map((time) => [time.day, time]))
      return {
        timezone: data.timezone ?? 'UTC',
        // Closed days are simply absent from `times`; the draft keeps them with default hours.
        days: WEEK_DAYS.map(({ day }) => {
          const time = byDay.get(day)
          return time
            ? { day, open: true, startTime: time.startTime, endTime: time.endTime }
            : { day, open: false, ...DEFAULT_HOURS }
        }),
      }
    }
    default:
      return {}
  }
}

export function toDraft(item) {
  return {
    title: getNodeTitle(item),
    description: item.description ?? '',
    data: toDataDraft(item),
  }
}

function fromDataDraft(item, dataDraft) {
  const data = item.data ?? {}
  switch (item.type) {
    case 'sendMessage':
      return {
        ...data,
        payload: [
          ...dataDraft.texts.map(({ text }) => ({ type: 'text', text: text.trim() })),
          ...dataDraft.attachments.map(({ url, name }) => ({
            type: 'attachment',
            attachment: url,
            ...(name !== fileNameFromUrl(url) && { name }),
          })),
        ],
      }
    case 'addComment':
      return { ...data, comment: dataDraft.comment.trim() }
    case 'businessHours':
      return {
        ...data,
        timezone: dataDraft.timezone,
        times: dataDraft.days
          .filter((day) => day.open)
          .map(({ day, startTime, endTime }) => ({ startTime, endTime, day })),
      }
    default:
      return data
  }
}

export function draftToPatch(item, draft) {
  const description = draft.description.trim()
  return {
    name: draft.title.trim(),
    description: description || undefined,
    data: fromDataDraft(item, draft.data),
  }
}

export function validateDraft(type, draft) {
  const errors = {}
  const title = draft.title.trim()

  if (!title) errors.title = 'Title is required'
  else if (title.length > TITLE_MAX_LENGTH)
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer`

  if (draft.description.trim().length > DESCRIPTION_MAX_LENGTH)
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`

  if (type === 'sendMessage') {
    for (const { key, text } of draft.data.texts) {
      if (!text.trim()) errors[`text.${key}`] = "Message can't be empty"
      else if (text.length > MESSAGE_MAX_LENGTH)
        errors[`text.${key}`] = `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer`
    }
  }

  if (type === 'addComment' && draft.data.comment.length > COMMENT_MAX_LENGTH)
    errors.comment = `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer`

  if (type === 'businessHours') {
    if (!draft.data.timezone) errors.timezone = 'Select a timezone'
    for (const { day, open, startTime, endTime } of draft.data.days) {
      const error = open && getTimeRangeError(startTime, endTime)
      if (error) errors[`hours.${day}`] = error
    }
  }

  return errors
}

export function getAttachmentError(file) {
  if (!ATTACHMENT_TYPES.includes(file.type)) return `${file.name} isn't a PNG or JPG`
  if (file.size > ATTACHMENT_MAX_BYTES) return `${file.name} is larger than 5 MB`
  return null
}
