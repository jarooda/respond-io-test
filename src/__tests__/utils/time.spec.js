import { describe, expect, it } from 'vitest'

import { getTimeRangeError, isValidTime, toMinutes } from '@/utils/time'

describe('isValidTime', () => {
  it.each(['00:00', '09:00', '23:59'])('accepts %s', (value) => {
    expect(isValidTime(value)).toBe(true)
  })

  it.each(['24:00', '9:00', '09:60', '0900', '', undefined, '09:00 '])('rejects %s', (value) => {
    expect(isValidTime(value)).toBe(false)
  })
})

describe('toMinutes', () => {
  it('converts HH:mm to minutes since midnight', () => {
    expect(toMinutes('09:30')).toBe(570)
  })
})

describe('getTimeRangeError', () => {
  it('passes a valid range', () => {
    expect(getTimeRangeError('09:00', '17:00')).toBeNull()
  })

  it('rejects malformed times', () => {
    expect(getTimeRangeError('9:00', '17:00')).toBe('Use 24-hour time, e.g. 09:00')
  })

  it('rejects an end time that is not after the start', () => {
    expect(getTimeRangeError('17:00', '09:00')).toBe('End time must be after start time')
    expect(getTimeRangeError('09:00', '09:00')).toBe('End time must be after start time')
  })
})
