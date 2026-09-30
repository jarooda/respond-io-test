export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Strict 24-hour "HH:mm". */
export const isValidTime = (value) => TIME_RE.test(value ?? '')

export const toMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function getTimeRangeError(startTime, endTime) {
  if (!isValidTime(startTime) || !isValidTime(endTime)) return 'Use 24-hour time, e.g. 09:00'
  if (toMinutes(startTime) >= toMinutes(endTime)) return 'End time must be after start time'
  return null
}
