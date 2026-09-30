const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const TRIGGER_DESCRIPTIONS = {
  true: 'Runs once per contact',
  false: 'Runs every time a conversation is opened',
}

export function humanize(value = '') {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

const collapseWhitespace = (value) => value.replace(/\s+/g, ' ').trim()

export function getNodeTitle(item) {
  if (item.name) return item.name
  if (item.type === 'trigger') return humanize(item.data?.type)
  return humanize(item.type)
}

export function getAttachmentCount(item) {
  if (item.type !== 'sendMessage') return 0
  return (item.data?.payload ?? []).filter((entry) => entry.type === 'attachment').length
}

export function formatBusinessHours({ times = [], timezone = 'UTC' } = {}) {
  const sorted = times
    .filter((time) => DAY_ORDER.includes(time.day))
    .toSorted((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))

  if (sorted.length === 0) return `Closed · ${timezone}`

  const [{ startTime, endTime }] = sorted
  const sameHours = sorted.every((time) => time.startTime === startTime && time.endTime === endTime)
  if (!sameHours) return `Custom hours · ${timezone}`

  const first = DAY_ORDER.indexOf(sorted[0].day)
  const consecutive = sorted.every((time, i) => DAY_ORDER.indexOf(time.day) === first + i)
  const days = consecutive
    ? sorted.length === 1
      ? capitalize(sorted[0].day)
      : `${capitalize(sorted[0].day)}–${capitalize(sorted.at(-1).day)}`
    : sorted.map((time) => capitalize(time.day)).join(', ')

  return `${days} · ${startTime}–${endTime} · ${timezone}`
}

function describeSendMessage(data) {
  const payload = data?.payload ?? []
  const text = payload.find((entry) => entry.type === 'text' && entry.text?.trim())
  if (text) return collapseWhitespace(text.text)

  const attachments = payload.filter((entry) => entry.type === 'attachment').length
  if (attachments) return `${attachments} attachment${attachments > 1 ? 's' : ''}`
  return ''
}

export function getNodeDescription(item) {
  if (item.description) return item.description

  switch (item.type) {
    case 'trigger':
      return TRIGGER_DESCRIPTIONS[Boolean(item.data?.oncePerContact)]
    case 'sendMessage':
      return describeSendMessage(item.data)
    case 'addComment':
      return item.data?.comment ?? ''
    case 'businessHours':
      return formatBusinessHours(item.data)
    default:
      return ''
  }
}
